import { createFileRoute, Outlet, redirect, retainSearchParams } from "@tanstack/react-router";
import { meQuery } from "../features/auth/queries";
import { type SettingsSection, settingsSections } from "../features/settings/settings-dialog";
import { AppShell } from "../features/shell/app-shell";
import { type UrlTab, urlTabs } from "../features/shell/tabs";

export const Route = createFileRoute("/_app")({
  validateSearch: (s: Record<string, unknown>): { settings?: SettingsSection; tab?: UrlTab } => {
    const tab = urlTabs.find((x) => x === s.tab);
    return { settings: settingsSections.find((x) => x === s.settings), ...(tab && { tab }) };
  },
  // Opening a chat or settings keeps you on the same tab.
  search: { middlewares: [retainSearchParams(["tab"])] },
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me) throw redirect({ to: "/login", search: { redirect: location.href } });
    return { me };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
