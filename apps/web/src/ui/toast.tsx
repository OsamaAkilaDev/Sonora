import { Toast } from "@base-ui/react/toast";
import { X } from "@phosphor-icons/react";
import { usePhone } from "../lib/phone";
import { play, type SoundName } from "../lib/sound";

/** Global toast manager: call `toast.add({ title, description })` from anywhere, React or not. */
export const toast = Toast.createToastManager();

const recent = new Map<string, number>();
/**
 * Toast keyed by what it's about. The same event can reach us twice (the mutation's response
 * and its realtime echo); identical keys within 5s show once.
 */
export function notify(key: string, options: Parameters<typeof toast.add>[0], sound?: SoundName) {
  const now = Date.now();
  if ((recent.get(key) ?? 0) > now) return;
  recent.set(key, now + 5000);
  if (sound) play(sound);
  toast.add(options);
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={toast} timeout={4500}>
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-60 w-[min(360px,calc(100vw-32px))] max-md:top-[max(12px,env(safe-area-inset-top))] max-md:right-3 max-md:bottom-auto max-md:w-[calc(100vw-24px)]">
          <List />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function List() {
  const { toasts } = Toast.useToastManager();
  // Phones show toasts at the top, clear of the nav bar and composer.
  const away = usePhone() ? "up" : "down";
  return toasts.map((t) => (
    <Toast.Root key={t.id} toast={t} swipeDirection={[away, "right"]} className="toast">
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
