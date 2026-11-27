import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { meQuery } from "../features/auth/queries";
import { type SettingsSection, settingsSections } from "../features/settings/settings-dialog";
import { AppShell } from "../features/shell/app-shell";

export const Route = createFileRoute("/_app")({
  validateSearch: (s: Record<string, unknown>): { settings?: SettingsSection } => ({
    settings: settingsSections.find((x) => x === s.settings),
  }),
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
