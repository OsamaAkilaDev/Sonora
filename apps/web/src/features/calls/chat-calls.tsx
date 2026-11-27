import { Phone, VideoCamera } from "@phosphor-icons/react";
import type { ChatSummary, Me } from "@sonora/shared";
import * as m from "motion/react-m";
import { Button, IconButton } from "../../ui/button";
import { joinCall } from "./session";
import { useCall, useCalls } from "./store";

/** The chat header's call buttons. */
export function CallButtons({ chatId, meId }: { chatId: string; meId: string }) {
  const inThis = useCall((s) => s.chatId === chatId);
  return (
    <div className="flex gap-0.5">
      <IconButton
        label="Start voice call"
        disabled={inThis}
        onClick={() => joinCall(chatId, meId, false)}
      >
        <Phone />
      </IconButton>
      <IconButton
        label="Start video call"
        disabled={inThis}
        onClick={() => joinCall(chatId, meId, true)}
      >
        <VideoCamera />
      </IconButton>
    </div>
  );
}

/** A call is running in this chat and you're not in it here. */
export function JoinBanner({ chat, me }: { chat: ChatSummary; me: Me }) {
  const call = useCalls((s) => s.byChat[chat.id]);
  const inThis = useCall((s) => s.chatId === chat.id);
  if (!call || inThis || !call.userIds.length) return null;
  const elsewhere = call.userIds.includes(me.id);
  const names = call.userIds
    .filter((id) => id !== me.id)
    .map((id) => chat.members.find((u) => u.id === id)?.username)
    .filter(Boolean)
    .join(", ");

  return (
    <m.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="flex items-center gap-3 border-b border-line bg-cyan-wash py-2 pr-3 pl-3.5"
    >
      <span className="size-[7px] shrink-0 rounded-full bg-cyan shadow-[0_0_0_3px_color-mix(in_oklab,var(--cyan)_25%,transparent)]" />
      <p className="min-w-0 flex-1 truncate text-[13px]">
        <span className="font-semibold">Call in progress</span>
        <span className="text-slate">
          {elsewhere ? " · you're in it on another device" : names && ` · ${names}`}
        </span>
      </p>
      <Button size="sm" onClick={() => joinCall(chat.id, me.id, false, call.callId)}>
        {elsewhere ? "Move here" : "Join"}
      </Button>
    </m.div>
  );
}
