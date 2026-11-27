import type { FriendRequest, PublicUser } from "@sonora/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { play } from "../../lib/sound";
import { notify } from "../../ui/toast";

export type Social = { friends: PublicUser[]; requests: FriendRequest[] };

export const socialQuery = queryOptions({
  queryKey: ["social"],
  queryFn: (): Promise<Social> => unwrap(api.friends.$get()),
});

const byName = (a: PublicUser, b: PublicUser) => a.username.localeCompare(b.username);

/** Cache helpers shared by mutations and realtime events. */
export const social = {
  addFriend: (s: Social, friend: PublicUser): Social => ({
    friends: [...s.friends.filter((f) => f.id !== friend.id), friend].sort(byName),
    requests: s.requests.filter((r) => r.user.id !== friend.id),
  }),
  addRequest: (s: Social, request: FriendRequest): Social => ({
    ...s,
    requests: [request, ...s.requests.filter((r) => r.user.id !== request.user.id)],
  }),
  remove: (s: Social, userId: string): Social => ({
    friends: s.friends.filter((f) => f.id !== userId),
    requests: s.requests.filter((r) => r.user.id !== userId),
  }),
  presence: (s: Social, userId: string, patch: Pick<PublicUser, "presence" | "lastSeenAt">) => ({
    ...s,
    friends: s.friends.map((f) => (f.id === userId ? { ...f, ...patch } : f)),
  }),
};

function useSocialMutation<V, R>(
  request: (v: V) => Promise<R>,
  optimistic: (s: Social, v: V) => Social,
  done?: (s: Social, r: R) => Social,
) {
  const qc = useQueryClient();
  const key = socialQuery.queryKey;
  return useMutation({
    mutationFn: request,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      if (prev) qc.setQueryData(key, optimistic(prev, v));
      return { prev };
    },
    onSuccess: (r) => {
      if (done) qc.setQueryData(key, (s) => (s ? done(s, r) : s));
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(key, ctx?.prev);
      play("error");
    },
  });
}

/** Not optimistic: we can't show the person until the server confirms they exist. */
export function useSendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => unwrap(api.friends.requests.$post({ json: { username } })),
    onSuccess: (r) => {
      qc.setQueryData(socialQuery.queryKey, (s) =>
        !s ? s : "friend" in r ? social.addFriend(s, r.friend) : social.addRequest(s, r.request),
      );
      if ("friend" in r)
        notify(
          `friend:${r.friend.id}`,
          { title: `You and ${r.friend.username} are friends`, description: "Say hi." },
          "success",
        );
      else play("success");
    },
    onError: () => play("error"),
  });
}

export const useAcceptRequest = () =>
  useSocialMutation(
    (userId: string) => unwrap(api.friends.requests[":userId"].accept.$post({ param: { userId } })),
    (s, userId) => {
      const req = s.requests.find((r) => r.user.id === userId);
      return req ? social.addFriend(s, req.user) : s;
    },
    (s, r) => social.addFriend(s, r.friend),
  );

export const useDeclineRequest = () =>
  useSocialMutation(
    (userId: string) => unwrap(api.friends.requests[":userId"].$delete({ param: { userId } })),
    social.remove,
  );

export const useRemoveFriend = () =>
  useSocialMutation(
    (userId: string) => unwrap(api.friends[":userId"].$delete({ param: { userId } })),
    social.remove,
  );
