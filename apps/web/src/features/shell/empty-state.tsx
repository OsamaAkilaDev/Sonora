import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid h-full place-items-center p-8 text-center">
      <div className="grid max-w-[34ch] justify-items-center gap-1.5">
        <h2 className="text-lg font-semibold tracking-[-0.2px]">{title}</h2>
        <p className="text-sm text-slate text-pretty">{body}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
