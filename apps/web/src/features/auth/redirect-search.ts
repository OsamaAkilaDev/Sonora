/** `?redirect=` for auth pages; only same-app paths survive, never an absolute URL. */
export const redirectSearch = (s: Record<string, unknown>): { redirect?: string } => {
  const r = s.redirect;
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? { redirect: r } : {};
};
