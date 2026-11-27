import { Phone, PhoneX, VideoCamera } from "@phosphor-icons/react";
import type { Me } from "@sonora/shared";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { api, unwrap } from "../../lib/api";
import { play, startLoop } from "../../lib/sound";
import { Avatar } from "../../ui/avatar";
import { meQuery } from "../auth/queries";
import { chatTitle, GroupAvatar, peerOf } from "../chats/chat-list";
import { chatsQuery } from "../chats/queries";
import { ringIncoming } from "../notifications/alert";
import { ControlButton } from "./controls";
import { RemoteAudio } from "./media";
import { joinCall, leaveCall } from "./session";
import { calls, useCall, useCalls } from "./store";

/** Everything about calls that must outlive any one screen: sound, ringing, and cleanup. */
export function CallLayer() {
  const me = useQuery(meQuery).data;
  const peers = useCall((s) => s.peers);
  useEffect(() => () => void leaveCall(), []); // signing out hangs up
  if (!me) return null;
  return (
    <>
      {Object.values(peers).map((p) => p.audio && <RemoteAudio key={p.peerId} track={p.audio} />)}
      <Announcer />
      <Ringback meId={me.id} />
      <Incoming me={me} />
    </>
  );
}

/** Screen readers hear the call's progress from one region that's always there. */
function Announcer() {
  const text = useCall((s) => {
    if (!s.chatId) return "";
    if (s.status === "reconnecting") return "Reconnecting the call";
    if (s.status === "live") {
      const n = Object.keys(s.peers).length;
      return `In a call with ${n} ${n === 1 ? "person" : "people"}`;
    }
    return s.status === "waiting" ? "Waiting for others to join" : "Starting the call";
  });
  return (
    <p role="status" className="sr-only">
      {text}
    </p>
  );
}

/** Re-renders when the next ringing call times out. */
function useNow(deadline: number) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!deadline) return;
    const t = setTimeout(() => setNow(Date.now()), Math.max(0, deadline - Date.now()) + 50);
    return () => clearTimeout(t);
  }, [deadline]);
  return Math.max(now, Date.now());
}

function Ringback({ meId }: { meId: string }) {
  const chatId = useCall((s) => s.chatId);
  const alone = useCall((s) => !Object.keys(s.peers).length);
  const call = useCalls((s) => (chatId ? s.byChat[chatId] : undefined));
  const until = call?.startedBy === meId ? call.ringsUntil : 0;
  const now = useNow(until);
  const ringing = alone && until > now;
  useEffect(() => (ringing ? startLoop("ringback") : undefined), [ringing]);
  return null;
}

function Incoming({ me }: { me: Me }) {
  const byChat = useCalls((s) => s.byChat);
  const dismissed = useCalls((s) => s.dismissed);
  const current = useCall((s) => s.chatId);
  const chats = useQuery(chatsQuery).data;
  const navigate = useNavigate();

  const candidates = Object.values(byChat).filter(
    (c) =>
      c.chatId !== current &&
      c.startedBy !== me.id &&
      !c.userIds.includes(me.id) &&
      !dismissed[c.callId],
  );
  const now = useNow(
    Math.min(...candidates.map((c) => c.ringsUntil).filter((t) => t > Date.now())) || 0,
  );
  const call = candidates.find((c) => c.ringsUntil > now);
  const chat = chats?.find((c) => c.id === call?.chatId);
  const callId = call?.callId;
  const caller = chat ? chatTitle(chat, me.id) : "";
  const body = call?.video ? "Incoming video call" : "Incoming voice call";
  useEffect(() => {
    if (!callId || !caller) return;
    return ringIncoming({ callId, title: caller, body });
  }, [callId, caller, body]);

  const answer = (video: boolean) => {
    if (!call) return;
    calls.dismiss(call.callId);
    joinCall(call.chatId, me.id, video, call.callId);
    navigate({ to: "/c/$chatId", params: { chatId: call.chatId } });
  };
  const decline = () => {
    if (!call) return;
    calls.dismiss(call.callId);
    play("hangup");
    // If this fails the caller simply gets "No answer" when ringing times out.
    void unwrap(
      api.calls[":chatId"].decline.$post({
        param: { chatId: call.chatId },
        json: { callId: call.callId },
      }),
    ).catch(() => {});
  };

  const peer = chat ? peerOf(chat, me.id) : null;
  return (
    <>
      <p role="status" className="sr-only">
        {call && chat
          ? `Incoming ${call.video ? "video" : "voice"} call from ${chatTitle(chat, me.id)}`
          : ""}
      </p>
      <AnimatePresence>
        {call && chat && (
          <m.div
            key={call.callId}
            role="alertdialog"
            aria-labelledby="incoming-title"
            aria-describedby="incoming-body"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.15 } }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-x-0 top-[max(12px,env(safe-area-inset-top))] z-60 mx-auto flex w-[min(420px,calc(100vw-24px))] items-center gap-3 rounded-2xl bg-panel py-3 pr-3 pl-3.5 shadow-pop"
          >
            <span className="ringing rounded-full">
              {peer ? (
                <Avatar seed={peer.avatarSeed} size={44} />
              ) : (
                <GroupAvatar chat={chat} meId={me.id} size={44} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p id="incoming-title" className="truncate text-sm font-semibold">
                {chatTitle(chat, me.id)}
              </p>
              <p id="incoming-body" className="truncate text-[13px] text-slate">
                {call.video ? "Video" : "Voice"} call…
              </p>
            </div>
            <ControlButton
              label="Decline"
              onClick={decline}
              className="bg-red-solid text-white hover:bg-red-solid hover:brightness-110"
            >
              <PhoneX weight="fill" />
            </ControlButton>
            {call.video && (
              <ControlButton label="Answer with voice only" onClick={() => answer(false)}>
                <Phone weight="fill" />
              </ControlButton>
            )}
            <ControlButton
              label={call.video ? "Answer with video" : "Answer"}
              onClick={() => answer(call.video)}
              className="bg-green-solid text-white hover:bg-green-solid hover:brightness-110"
            >
              {call.video ? <VideoCamera weight="fill" /> : <Phone weight="fill" />}
            </ControlButton>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
