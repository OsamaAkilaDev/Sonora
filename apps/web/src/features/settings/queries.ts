import type { SessionInfo } from "@sonora/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "../../lib/api";
import { play } from "../../lib/sound";
import { toast } from "../../ui/toast";

export const sessionsQuery = queryOptions({
  queryKey: ["sessions"],
  queryFn: async () => (await unwrap(api.auth.sessions.$get())).sessions,
});

/** Optimistic: rows disappear immediately; restored with a toast if the server refuses. */
function useOptimisticRevoke<V>(
  request: (v: V) => Promise<unknown>,
  keep: (s: SessionInfo, v: V) => boolean,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: request,
    onMutate: async (v: V) => {
      await qc.cancelQueries(sessionsQuery);
      const prev = qc.getQueryData(sessionsQuery.queryKey);
      qc.setQueryData(sessionsQuery.queryKey, (list) => list?.filter((s) => keep(s, v)));
      play("tick");
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(sessionsQuery.queryKey, ctx?.prev);
      play("error");
      toast.add({
        title: "Couldn't sign that out",
        description: "Check your connection and try again.",
      });
    },
    onSettled: () => qc.invalidateQueries(sessionsQuery),
  });
}

export const useRevokeSession = () =>
  useOptimisticRevoke(
    (id: string) => unwrap(api.auth.sessions[":id"].$delete({ param: { id } })),
    (s, id) => s.id !== id,
  );

export const useRevokeOthers = () =>
  useOptimisticRevoke(
    (_: undefined) => unwrap(api.auth.sessions.$delete()),
    (s) => s.current,
  );
