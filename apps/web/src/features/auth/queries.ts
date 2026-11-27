import type { LoginInput, Me, SignupInput } from "@sonora/shared";
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, unwrap } from "../../lib/api";

// Last known profile (no secrets; the session itself stays in the HttpOnly cookie) so the
// installed app can open offline instead of failing the session check.
const KEY = "sonora-me";
const remembered = {
  get: (): Me | null => {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {
      return null;
    }
  },
  set: (me: Me | null) => {
    try {
      if (me) localStorage.setItem(KEY, JSON.stringify(me));
      else localStorage.removeItem(KEY);
    } catch {}
  },
};

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async (): Promise<Me | null> => {
    try {
      const { user } = await unwrap(api.auth.me.$get());
      remembered.set(user);
      return user;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        remembered.set(null);
        return null;
      }
      const cached = e instanceof ApiError && e.code === "offline" ? remembered.get() : null;
      if (cached) return cached;
      throw e;
    }
  },
  staleTime: Number.POSITIVE_INFINITY, // changes only through our own mutations / realtime
});

function useSetMe() {
  const qc = useQueryClient();
  return (me: Me) => {
    remembered.set(me);
    qc.setQueryData(meQuery.queryKey, me);
  };
}

export function useLogin() {
  const setMe = useSetMe();
  return useMutation({
    mutationFn: (json: LoginInput) => unwrap(api.auth.login.$post({ json })),
    onSuccess: ({ user }) => setMe(user),
  });
}

export function useSignup() {
  const setMe = useSetMe();
  return useMutation({
    mutationFn: (json: SignupInput) => unwrap(api.auth.signup.$post({ json })),
    onSuccess: ({ user }) => setMe(user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.auth.logout.$post()),
    onSettled: () => {
      remembered.set(null);
      qc.clear();
    },
  });
}
