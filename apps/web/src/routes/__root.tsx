import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { UpdatePrompt } from "../features/pwa/update-prompt";
import { NotFound, RouteError } from "../features/shell/route-error";
import { Toaster } from "../ui/toast";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  errorComponent: RouteError,
  notFoundComponent: NotFound,
  component: () => (
    <>
      <Outlet />
      <Toaster />
      <UpdatePrompt />
    </>
  ),
});
