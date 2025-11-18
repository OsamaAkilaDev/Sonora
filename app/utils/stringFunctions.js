export function isOnlyEmojis(str) {
  if (!str) return false;

  const noEmojis = str.replace(
    /\p{Extended_Pictographic}|\p{Emoji_Component}|\u200D/gu,
    ""
  );

  return noEmojis.length === 0;
}

export function countEmojis(str) {
  const emojiRegex =
    /\p{Extended_Pictographic}(?:\u200D\p{Extended_Pictographic})*/gu;
  const matches = str.match(emojiRegex);
  return matches ? matches.length : 0;
}
