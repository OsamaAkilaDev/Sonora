import {
  CaretUp,
  CornersIn,
  CornersOut,
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
import { useFullscreen } from "./fullscreen";
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
  const cameraTrack = useCall((s) => s.cameraTrack);
  const screenTrack = useCall((s) => s.screenTrack);
  const muted = useCall((s) => s.muted);
  const speaking = useCall((s) => s.speaking);
  const ringing = useCalls((s) => (s.byChat[chat.id]?.ringsUntil ?? 0) > Date.now());
  const navigate = useNavigate();
  const full = useFullscreen<HTMLElement>();

  const member = (id: string) => chat.members.find((u) => u.id === id);
  const remotes = Object.values(peers);
  // Still ringing: show who we're waiting for.
  const awaited =
    !remotes.length && ringing ? chat.members.filter((u) => u.id !== me.id).slice(0, 5) : [];
  // Shared screens get most of the room; everyone's face lines up in a strip underneath.
  const sharers = remotes.filter((p) => p.screen && p.screenTrack);
  const shares = sharers.length + (screenTrack ? 1 : 0);
  const faces = remotes.length + awaited.length + 1;
  const avatar = shares ? 44 : 72;

  return (
    <m.section
      ref={full.ref}
      aria-label="Call"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className={cx(
        "flex shrink-0 flex-col gap-2.5 border-b border-line bg-inset p-3",
        shares ? "h-[clamp(300px,62dvh,640px)]" : "h-[clamp(260px,46dvh,460px)]",
        "[&:fullscreen]:h-dvh [&:fullscreen]:border-b-0",
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

      <div className="flex min-h-0 flex-1 flex-col gap-2.5">
        {shares > 0 && (
          <div
            className={cx(
              "grid min-h-0 flex-[2.4] auto-rows-fr grid-cols-1 gap-2.5",
              shares > 1 && "sm:grid-cols-2",
            )}
          >
            {sharers.map((p) => (
              <Tile
                key={`screen-${p.peerId}`}
                label={`${member(p.userId)?.username ?? "Someone"}'s screen`}
                icon={<Screencast />}
                expandable
              >
                {p.screenTrack && <Video track={p.screenTrack} className="object-contain" />}
              </Tile>
            ))}
            {screenTrack && (
              <Tile label="Your screen" icon={<Screencast />} expandable>
                <Video track={screenTrack} className="object-contain" />
              </Tile>
            )}
          </div>
        )}
        <div
          className={cx(
            "grid min-h-0 flex-1 auto-rows-fr gap-2.5 overflow-y-auto",
            (shares ? stripColumns : faceColumns)[Math.min(faces, 6)],
          )}
        >
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
          <Tile label="You" muted={muted} speaking={speaking[me.id]} expandable={!!cameraTrack}>
            {cameraTrack ? (
              <Video track={cameraTrack} className="-scale-x-100 object-cover" />
            ) : (
              <Avatar seed={me.avatarSeed} size={avatar} />
            )}
          </Tile>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <CallStatus className="mr-1 min-w-11 text-[12.5px] text-slate max-md:hidden" />
        <MicButton />
        <CameraButton />
        <ScreenButton />
        <ControlButton
          label="Audio and video settings"
          onClick={() => {
            // Dialogs live outside the full-screen element, so leave full screen first.
            if (document.fullscreenElement) void document.exitFullscreen();
            navigate({ to: ".", search: (p) => ({ ...p, settings: "devices" }) });
          }}
        >
          <SlidersHorizontal />
        </ControlButton>
        {full.supported && (
          <ControlButton
            label={full.active ? "Exit full screen" : "Full screen"}
            className="max-md:hidden"
            onClick={full.toggle}
          >
            {full.active ? <CornersIn /> : <CornersOut />}
          </ControlButton>
        )}
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
  const video = peer.camera ? peer.cameraTrack : undefined;
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
      expandable={!!video}
    >
      {video ? (
        <Video track={video} className="object-cover" />
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
  expandable,
  className,
  children,
}: {
  label: string;
  muted?: boolean;
  speaking?: boolean;
  state?: string;
  icon?: ReactNode;
  /** Offers a full-screen button (video only). */
  expandable?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const full = useFullscreen<HTMLElement>();
  const canExpand = full.supported && (expandable || full.active);
  return (
    <figure
      ref={full.ref}
      onDoubleClick={canExpand ? full.toggle : undefined}
      className={cx(
        "group relative grid min-h-[72px] place-items-center overflow-hidden rounded-xl bg-[#0d0d0d]",
        // Nothing gets cropped when it has the whole screen.
        "[&:fullscreen]:rounded-none [&:fullscreen_video]:object-contain",
        className,
      )}
    >
      {/* Definite tracks, so a video fits the tile instead of taking its own aspect height. */}
      <div className="absolute inset-0 grid grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] place-items-center">
        {children}
      </div>
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
      {canExpand && (
        <button
          type="button"
          onClick={full.toggle}
          aria-label={full.active ? "Exit full screen" : `Show ${label} full screen`}
          title={full.active ? "Exit full screen" : "Full screen"}
          className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-black/55 text-lg text-white opacity-0 backdrop-blur-sm transition-[opacity,scale] duration-150 group-hover:opacity-100 focus-visible:opacity-100 active:scale-[0.96] pointer-coarse:opacity-100"
          style={full.active ? { opacity: 1 } : undefined}
        >
          {full.active ? <CornersIn /> : <CornersOut />}
        </button>
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
