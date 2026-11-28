// Fixed, realistic data for every shot: one evening, four chats, eleven people.
import type { ChatSummary, Me, Message, PublicUser, SearchHit } from "@sonora/shared";

/** Today at hh:mm, so day labels read "Today" and clocks read the time written here. */
const at = (hm: string, dayOffset = 0) => {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};

const user = (username: string, presence: PublicUser["presence"] = "online"): PublicUser => ({
  id: username,
  username,
  avatarSeed: username,
  about: "",
  presence,
  lastSeenAt: presence === "offline" ? at("17:40") : null,
});

export const people = {
  osama: { ...user("osama"), username: "ahmed" },
  karim: user("karim"),
  jonas: user("jonas", "idle"),
  dev: user("dev"),
  omar: user("omar"),
  dad: user("dad", "offline"),
  yusuf: user("yusuf"),
  theo: user("theo"),
  sami: user("sami"),
  marco: user("marco", "dnd"),
  kenji: user("kenji"),
  ravi: user("ravi"),
};

export const me: Me = {
  id: "osama",
  email: "ahmed@sonora.test",
  username: "ahmed",
  avatarSeed: "osama",
  about: "",
  status: "online",
  createdAt: at("12:00", 200),
};

let seq = 0;
const msg = (
  chatId: string,
  senderId: string,
  time: string,
  body: string,
  extra: Partial<Message> = {},
  dayOffset = 0,
): Message => ({
  id: `m${String(++seq).padStart(3, "0")}`,
  chatId,
  senderId,
  clientId: null,
  body,
  replyToId: null,
  attachments: [],
  reactions: [],
  createdAt: at(time, dayOffset),
  editedAt: null,
  deletedAt: null,
  ...extra,
});

/* ── Lisbon in May: four friends booking a flat ── */
const lisbonOld = [
  msg("lisbon", "jonas", "21:14", "lisbon flights are cheaper if we fly out on the tuesday", {}, 1),
  msg("lisbon", "dev", "21:20", "lisbon in may is going to be so good", {}, 1),
];
const lisbonBase = [
  msg("lisbon", "jonas", "18:41", "ok who's actually booking the flat"),
  msg("lisbon", "dev", "18:42", "I can, just need everyone's yes by tonight"),
  msg("lisbon", "osama", "18:44", "yes from me. the one near Alfama?"),
  msg("lisbon", "karim", "18:52", "wait, the one with the rooftop?"),
];
const lisbonLanded = msg("lisbon", "karim", "19:01", "found it. 4 nights, €148 each with the rooftop");
const lisbonReply = msg("lisbon", "jonas", "19:01", "yes yes, book it", {
  replyToId: lisbonBase[1].id,
});
export const flatPhoto = {
  id: "a1",
  name: "living-room.jpg",
  mime: "image/jpeg",
  size: 159_842,
  width: 1600,
  height: 1068,
  url: "/stock/flat.jpg",
};
const lisbonPhoto = msg("lisbon", "osama", "19:03", "this is the living room", {
  attachments: [flatPhoto],
});

/* ── Family ── */
const family = [
  msg("family", "dad", "18:30", "who's coming sunday? mum is making maqluba"),
  msg("family", "yusuf", "18:33", "me obviously"),
  msg("family", "osama", "18:51", "count me in, I'll bring dessert"),
  msg("family", "dad", "18:56", "last time you brought one cake for nine people", {
    reactions: [{ emoji: "😂", userIds: ["yusuf", "osama"] }],
  }),
  msg("family", "dad", "17:10", "your uncle was in lisbon last year, ask him", {}, 2),
];

/* ── DM with omar ── */
const dm = [
  msg("omar", "omar", "18:20", "did you finish the networking problem set?"),
  msg("omar", "osama", "18:22", "half. q4 is about TCP congestion windows, no idea yet"),
  msg("omar", "omar", "18:24", "same lol"),
  msg("omar", "osama", "18:58", "sent you my notes for thursday"),
];

/* ── standup ── */
const standup = [
  msg("standup", "theo", "16:58", "standup in 2, joining from the train"),
  msg("standup", "kenji", "17:12", "notes from today are in the doc"),
];

const members = {
  lisbon: [people.osama, people.karim, people.jonas, people.dev],
  family: [people.osama, people.dad, people.yusuf],
  omar: [people.osama, people.omar],
  standup: [people.osama, people.theo, people.sami, people.marco, people.kenji, people.ravi],
};

const chat = (
  id: keyof typeof members,
  kind: ChatSummary["kind"],
  name: string | null,
  thread: Message[],
  unread = 0,
  readBy: Record<string, string | null> = {},
): ChatSummary => {
  const last = [...thread].sort((a, b) => a.createdAt - b.createdAt).at(-1) ?? null;
  return {
    id,
    kind,
    name,
    members: members[id],
    lastMessage: last,
    lastActivityAt: last?.createdAt ?? 0,
    unread,
    readBy: { osama: last?.id ?? null, ...readBy },
  };
};

/** Every state a shot can ask for, by name. Threads are oldest first. */
export function world(state: string) {
  const lisbonThread = [...lisbonOld, ...lisbonBase];
  if (state !== "typing" && state !== "before") lisbonThread.push(lisbonLanded, lisbonReply);
  if (state === "sent") lisbonThread.push(lisbonPhoto);
  const familyThread = [family[4], ...family.slice(0, 4)];
  const seen = state === "seen" || state === "incoming";
  const chats = [
    chat("lisbon", "group", "Lisbon in May", lisbonThread, state === "after" ? 4 : 2),
    chat("omar", "dm", null, dm, 0, { omar: seen ? dm[3].id : dm[2].id }),
    chat("family", "group", "Family", familyThread, 1),
    chat("standup", "group", "standup", standup),
  ];
  chats.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  return {
    chats,
    threads: { lisbon: lisbonThread, family: familyThread, omar: dm, standup } as Record<
      string,
      Message[]
    >,
  };
}

export const searchHits: SearchHit[] = [
  { chatId: "lisbon", message: lisbonOld[0] },
  { chatId: "lisbon", message: lisbonOld[1] },
  { chatId: "family", message: family[4] },
];
