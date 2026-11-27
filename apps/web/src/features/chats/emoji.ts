/** One tap from the toolbar. */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/**
 * The picker. Curated rather than the full Unicode set: reactions cluster on a few dozen emoji,
 * and the OS emoji keyboard still covers everything when typing.
 * ponytail: swap for a full searchable picker if people ask for more.
 */
export const EMOJI_GROUPS: { label: string; emoji: string[] }[] = [
  {
    label: "Feelings",
    emoji: [
      "😀",
      "😁",
      "😅",
      "🤣",
      "😊",
      "😍",
      "🥰",
      "😘",
      "😎",
      "🤩",
      "🥳",
      "😌",
      "🤔",
      "🫡",
      "😴",
      "🙄",
      "😬",
      "😭",
      "😤",
      "🥺",
      "😡",
      "🤯",
      "😱",
      "🫠",
    ],
  },
  {
    label: "Hands",
    emoji: ["👍", "👎", "👏", "🙌", "🤝", "🙏", "👋", "✌️", "🤞", "💪", "🫶", "👀"],
  },
  {
    label: "Things",
    emoji: [
      "❤️",
      "🔥",
      "✨",
      "🎉",
      "💯",
      "✅",
      "❌",
      "⭐",
      "☕",
      "🍕",
      "🌯",
      "🎧",
      "🎮",
      "⚽",
      "🏜️",
      "🌙",
    ],
  },
];
