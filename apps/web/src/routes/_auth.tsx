import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AuthShowcase } from "../features/auth/auth-showcase";
import { meQuery } from "../features/auth/queries";
import { Logo } from "../ui/logo";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    if (await context.queryClient.ensureQueryData(meQuery)) throw redirect({ to: "/" });
  },
  component: AuthLayout,
});

/** Form on the calm left; on large screens the right panel shows Sonora at work. */
function AuthLayout() {
  return (
    <div className="grid min-h-dvh gap-2 p-2 lg:grid-cols-[minmax(440px,560px)_1fr]">
      <main className="flex flex-col px-6 pt-[max(24px,env(safe-area-inset-top))] pb-6 sm:px-10">
        <div className="hidden items-center gap-2.5 lg:flex">
          <Logo className="h-7 text-cyan" />
          <span className="text-[17px] font-semibold tracking-[-0.2px]">Sonora</span>
        </div>
        <div className="grid flex-1 place-items-center py-10">
          <Outlet />
        </div>
        <p className="text-center text-[12.5px] text-ash lg:text-left">
          Calls go straight between you and the people you call.
        </p>
      </main>
      <AuthShowcase />
    </div>
  );
}
