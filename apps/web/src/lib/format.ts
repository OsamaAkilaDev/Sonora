const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const units: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "5 minutes ago", "yesterday"; under a minute is "just now". */
export function timeAgo(ts: number, now = Date.now()) {
  const diff = ts - now;
  for (const [unit, ms] of units) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

const startOfDay = (t: number) => new Date(t).setHours(0, 0, 0, 0);
const daysAgo = (t: number) => Math.round((startOfDay(Date.now()) - startOfDay(t)) / 86_400_000);
const hm = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/** Clock time: "10:42 AM". */
export const clock = (t: number) => hm.format(t);

/** Clock time without AM/PM, for tight spaces: "10:42". */
export const shortClock = (t: number) =>
  hm
    .formatToParts(t)
    .filter((p) => p.type !== "dayPeriod")
    .map((p) => p.value)
    .join("")
    .trim();

/** Day divider: "Today", "Yesterday", "Monday, Nov 24". */
export function dayLabel(t: number) {
  const d = daysAgo(t);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return new Date(t).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Compact list time: "10:42 AM", "Yesterday", "Tue", "Nov 24". */
export function listTime(t: number) {
  const d = daysAgo(t);
  if (d === 0) return clock(t);
  if (d === 1) return "Yesterday";
  if (d < 7) return new Date(t).toLocaleDateString(undefined, { weekday: "short" });
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Human device label from a user agent: "Chrome on Windows". */
export function describeDevice(ua: string) {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "an unknown system";
  return { label: `${browser} on ${os}`, mobile: /Mobi|iPhone|Android/.test(ua) };
}
