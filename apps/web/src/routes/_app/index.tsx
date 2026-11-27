import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "../../features/shell/empty-state";

export const Route = createFileRoute("/_app/")({
  component: () => (
    <EmptyState
      title="Nothing open yet"
      body="Pick a conversation from the list, or add a friend to start one."
    />
  ),
});
