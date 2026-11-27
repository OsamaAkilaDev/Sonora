import { Toast } from "@base-ui/react/toast";
import { X } from "@phosphor-icons/react";

/** Global toast manager: call `toast.add({ title, description })` from anywhere, React or not. */
export const toast = Toast.createToastManager();

export function Toaster() {
  return (
    <Toast.Provider toastManager={toast} timeout={4500}>
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-60 w-[min(360px,calc(100vw-32px))]">
          <List />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function List() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => (
    <Toast.Root key={t.id} toast={t} className="toast">
      <Toast.Content className="flex items-center gap-3 py-2.5 pr-2 pl-3.5 transition-opacity duration-200 data-behind:opacity-0 data-expanded:opacity-100">
        <div className="min-w-0 flex-1">
          <Toast.Title className="text-[13.5px] font-semibold" />
          <Toast.Description className="text-[13px] text-slate" />
        </div>
        {t.actionProps && (
          <Toast.Action className="h-7 shrink-0 rounded-full bg-ink px-3 text-[13px] font-medium text-on-ink shadow-btn active:scale-[0.96]" />
        )}
        <Toast.Close
          aria-label="Dismiss"
          className="grid size-7 shrink-0 place-items-center rounded-full text-slate hover:bg-hover hover:text-ink"
        >
          <X />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}
