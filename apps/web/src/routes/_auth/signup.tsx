import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "../../features/auth/auth-card";
import { redirectSearch } from "../../features/auth/redirect-search";

export const Route = createFileRoute("/_auth/signup")({
  validateSearch: redirectSearch,
  component: () => <AuthCard mode="signup" />,
});
