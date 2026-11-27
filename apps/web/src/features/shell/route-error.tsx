import { type ErrorComponentProps, Link } from "@tanstack/react-router";
import { ApiError } from "../../lib/api";
import { Button } from "../../ui/button";
import { Logo } from "../../ui/logo";

function Screen({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="grid max-w-[36ch] justify-items-center gap-2">
        <Logo className="mb-2 h-10 text-cyan" />
        <h1 className="text-[22px] font-semibold tracking-[-0.37px]">{title}</h1>
        <p className="text-sm text-slate text-pretty">{body}</p>
        <div className="mt-3">{action}</div>
      </div>
    </main>
  );
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  const offline = error instanceof ApiError && error.code === "offline";
  return (
    <Screen
      title={offline ? "You're offline" : "Something broke"}
      body={
        offline
          ? "Sonora can't reach the server. It'll work again as soon as you're back online."
          : "That's on us. Try again, and if it keeps happening, reload the app."
      }
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}

export function NotFound() {
  return (
    <Screen
      title="Nothing here"
      body="This page doesn't exist, or it moved."
      action={
        <Link
          to="/"
          className="text-sm font-medium text-cyan-ink underline-offset-4 hover:underline"
        >
          Back to Sonora
        </Link>
      }
    />
  );
}
