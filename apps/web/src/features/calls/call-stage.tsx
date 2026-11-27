import {
  CaretUp,
  MicrophoneSlash,
  PhoneX,
  Screencast,
  SlidersHorizontal,
} from "@phosphor-icons/react";
import type { ChatSummary, Me, PublicUser } from "@sonora/shared";
import { useNavigate } from "@tanstack/react-router";
import * as m from "motion/react-m";
import type { ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Avatar } from "../../ui/avatar";
import { CallStatus, CameraButton, ControlButton, MicButton, ScreenButton } from "./controls";
import { Video } from "./media";
import { leaveCall } from "./session";
import { type Remote, useCall, useCalls } from "./store";

const faceColumns = [
  "grid-cols-1",
  "grid-cols-1",
  "grid-cols-2 max-sm:grid-cols-1",
  "grid-cols-2 max-sm:grid-cols-1",
  "grid-cols-2",
  "grid-cols-3 max-sm:grid-cols-2",
  "grid-cols-3 max-sm:grid-cols-2",
];
const stripColumns = [
  "grid-cols-1",
  "grid-cols-1",
  "grid-cols-2",
  "grid-cols-3",
  "grid-cols-4",
  "grid-cols-5 max-sm:grid-cols-3",
  "grid-cols-6 max-sm:grid-cols-3",
];

/** The call, above the messages. On phones it takes over the whole chat panel. */
export function CallStage({ chat, me }: { chat: ChatSummary; me: Me }) {
  const peers = useCall((s) => s.peers);
  const minimized = useCall((s) => s.minimized);
  const camera = useCall((s) => s.camera);
  const screen = useCall((s) => s.screen);
  const preview = useCall((s) => s.preview);
  const muted = useCall((s) => s.muted);
  const speaking = useCall((s) => s.speaking);
  const ringing = useCalls((s) => (s.byChat[chat.id]?.ringsUntil ?? 0) > Date.now());
  const navigate = useNavigate();

  const member = (id: string) => chat.members.find((u) => u.id === id);
  const remotes = Object.values(peers);
  // Still ringing: show who we're waiting for.
  const awaited =
    !remotes.length && ringing ? chat.members.filter((u) => u.id !== me.id).slice(0, 5) : [];
  // A shared screen gets most of the room; faces line up in a strip underneath.
  const shares = remotes.filter((p) => p.screen).length + (screen ? 1 : 0);
  const faces = remotes.filter((p) => !p.screen).length + awaited.length + 1;
  const avatar = shares ? 44 : 72;

  return (
    <m.section
      aria-label="Call"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className={cx(
        "flex h-[clamp(260px,46dvh,460px)] shrink-0 flex-col gap-2.5 border-b border-line bg-inset p-3",
        "max-md:absolute max-md:inset-0 max-md:z-20 max-md:h-auto max-md:border-b-0",
        minimized && "max-md:hidden",
      )}
    >
      <div className="flex items-center gap-2 md:hidden">
        <ControlButton
          label="Minimize call"
          className="size-9 text-lg"
          onClick={() => useCall.setState({ minimized: true })}
        >
          <CaretUp />
        </ControlButton>
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold">
          {chat.name ?? chat.members.find((u) => u.id !== me.id)?.username}
        </p>
        <span className="size-9" />
      </div>

      <div
        className={cx(
          "grid min-h-0 flex-1 gap-2.5 overflow-y-auto",
          shares
            ? cx("auto-rows-[minmax(0,1fr)]", stripColumns[Math.min(faces, 6)])
            : cx("auto-rows-fr", faceColumns[Math.min(faces, 6)]),
        )}
        style={shares ? { gridTemplateRows: `repeat(${shares}, minmax(0, 2.4fr))` } : undefined}
      >
        {screen && preview && (
          <Tile className="col-span-full" label="Your screen" icon={<Screencast />}>
            <Video track={preview} className="object-contain" />
          </Tile>
        )}
        {remotes.map((p) => (
          <RemoteTile
            key={p.peerId}
            peer={p}
            user={member(p.userId)}
            on={speaking[p.userId]}
            avatar={avatar}
          />
        ))}
        {awaited.map((u) => (
          <Tile key={u.id} label={u.username} state="Ringing…">
            <span className="ringing rounded-full">
              <Avatar seed={u.avatarSeed} size={avatar} />
            </span>
          </Tile>
        ))}
        <Tile label="You" muted={muted} speaking={speaking[me.id]}>
          {camera && !screen && preview ? (
            <Video track={preview} className="-scale-x-100 object-cover" />
          ) : (
            <Avatar seed={me.avatarSeed} size={avatar} />
          )}
        </Tile>
      </div>

      <div className="flex items-center justify-center gap-2">
        <CallStatus className="mr-1 min-w-11 text-[12.5px] text-slate max-md:hidden" />
        <MicButton />
        <CameraButton />
        <ScreenButton />
        <ControlButton
          label="Audio and video settings"
          onClick={() => navigate({ to: ".", search: (p) => ({ ...p, settings: "devices" }) })}
        >
          <SlidersHorizontal />
        </ControlButton>
        <button
          type="button"
          onClick={leaveCall}
          className="ml-2 flex h-11 items-center gap-2 rounded-full bg-red-solid px-4 text-sm font-medium text-white transition-[filter,scale] duration-150 ease-out hover:brightness-110 active:scale-[0.96] sm:ml-4 sm:px-5"
        >
          <PhoneX weight="fill" className="text-lg" />
          <span className="max-sm:sr-only">Leave</span>
        </button>
      </div>
      <p className="text-center text-[12.5px] text-slate md:hidden">
        <CallStatus />
      </p>
    </m.section>
  );
}

function RemoteTile({
  peer,
  user,
  on,
  avatar,
}: {
  peer: Remote;
  user?: PublicUser;
  on?: boolean;
  avatar: number;
}) {
  const showVideo = (peer.camera || peer.screen) && peer.video;
  const state =
    peer.connection === "failed"
      ? "Can't connect. Their network or yours blocks direct calls."
      : peer.connection === "disconnected"
        ? "Reconnecting…"
        : peer.connection !== "connected"
          ? "Connecting…"
          : undefined;
  return (
    <Tile
      label={user?.username ?? "Someone"}
      muted={peer.muted}
      speaking={on}
      state={state}
      icon={peer.screen ? <Screencast /> : undefined}
      className={peer.screen ? "order-first col-span-full" : undefined}
    >
      {showVideo && peer.video ? (
        <Video track={peer.video} className={peer.screen ? "object-contain" : "object-cover"} />
      ) : (
        <Avatar seed={user?.avatarSeed ?? peer.userId} size={avatar} />
      )}
    </Tile>
  );
}

/** Video surfaces are dark in both themes, like any player. */
function Tile({
  label,
  muted,
  speaking,
  state,
  icon,
  className,
  children,
}: {
  label: string;
  muted?: boolean;
  speaking?: boolean;
  state?: string;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <figure
      className={cx(
        "relative grid min-h-[72px] place-items-center overflow-hidden rounded-xl bg-[#0d0d0d]",
        className,
      )}
    >
      <div className="absolute inset-0 grid min-h-0 place-items-center">{children}</div>
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_0_2px_var(--cyan)] transition-opacity duration-150",
          speaking ? "opacity-100" : "opacity-0",
        )}
      />
      {state && (
        <p className="absolute top-2 max-w-[calc(100%-16px)] rounded-full bg-black/55 px-2.5 py-1 text-center text-xs text-white/90">
          {state}
        </p>
      )}
      <figcaption className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        {muted && <MicrophoneSlash weight="fill" aria-label="Muted" className="text-[#ff7b7b]" />}
        {icon}
        <span className="truncate">{label}</span>
        {speaking && <span className="sr-only">(speaking)</span>}
      </figcaption>
    </figure>
  );
}
