export function isOnlyEmojis(str) {
  if (!str) return false;

  // Remove actual emojis (not emoji components like digits)
  const noEmojis = str.replace(/\p{Extended_Pictographic}|\u200D/gu, "");

  // If anything is left (numbers, spaces, text, etc.), return false
  return noEmojis.length === 0;
}

export function countEmojis(str) {
  const emojiRegex =
    /\p{Extended_Pictographic}(?:\u200D\p{Extended_Pictographic})*/gu;
  const matches = str.match(emojiRegex);
  return matches ? matches.length : 0;
}

console.log(isOnlyEmojis("123")); // false
console.log(isOnlyEmojis("😂")); // true
console.log(isOnlyEmojis("😂😂")); // true
console.log(isOnlyEmojis("😂1")); // false
console.log(isOnlyEmojis("1️⃣")); // true (keycap emoji)
console.log(isOnlyEmojis("🔥 💀")); // false (space)
