import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { LazyMotion, MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { screenMotion } from "./features/shell/tabs";
import { isPhone } from "./lib/phone";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const loadMotion = () => import("./lib/motion-features").then((r) => r.default);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0, // Query owns caching
  scrollRestoration: true,
  // Phones slide between screens. Browsers without transition types just switch.
  defaultViewTransition: CSS.supports("selector(:active-view-transition-type(a))") && {
    types: ({ fromLocation, toLocation }) => {
      const motion = isPhone() && screenMotion(fromLocation?.pathname, toLocation.pathname);
      return motion ? [motion] : false;
    },
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// biome-ignore lint/style/noNonNullAssertion: root exists in index.html
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={loadMotion} strict>
          <RouterProvider router={router} />
        </LazyMotion>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
