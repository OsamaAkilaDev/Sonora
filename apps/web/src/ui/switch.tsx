import { Switch as S } from "@base-ui/react/switch";
import { play } from "../lib/sound";

type Props = { checked: boolean; onChange: (v: boolean) => void; label: string };

export function Switch({ checked, onChange, label }: Props) {
  return (
    <S.Root
      checked={checked}
      onCheckedChange={(v) => {
        onChange(v);
        play(v ? "on" : "off"); // after the change, so turning sounds off stays quiet
      }}
      aria-label={label}
      className="relative h-[22px] w-[38px] shrink-0 rounded-full bg-line transition-colors duration-200 data-checked:bg-ink"
    >
      <S.Thumb className="absolute top-[3px] left-[3px] size-4 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.25)] transition-[translate,background-color] duration-250 ease-out-quint data-checked:translate-x-4 data-checked:bg-panel" />
    </S.Root>
  );
}
