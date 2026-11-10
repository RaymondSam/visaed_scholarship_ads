export const TIMEZONES = [
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Toronto",
  "Asia/Baghdad",
  "Asia/Bangkok",
  "Asia/Dhaka",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jakarta",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
  "Europe/Rome",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "UTC",
];

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const bag = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = bag.hour === "24" ? "00" : bag.hour;
  return Date.UTC(
    Number(bag.year),
    Number(bag.month) - 1,
    Number(bag.day),
    Number(hour),
    Number(bag.minute),
    Number(bag.second),
  );
}

/** Interpret a `datetime-local` value as wall time in `timeZone` and return UTC. */
export function zonedLocalToUtc(localValue: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localValue.trim());
  if (!match || !isValidTimeZone(timeZone)) return null;
  const [, year, month, day, hour, minute] = match;
  const guessed = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0);
  const offset = zoneParts(new Date(guessed), timeZone) - guessed;
  const corrected = guessed - offset;
  const offsetAgain = zoneParts(new Date(corrected), timeZone) - corrected;
  return new Date(guessed - offsetAgain);
}

/** Value for an `<input type="datetime-local">` showing the instant in `timeZone`. */
export function utcToZonedLocalInput(iso: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const bag = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = bag.hour === "24" ? "00" : bag.hour;
  return `${bag.year}-${bag.month}-${bag.day}T${hour}:${bag.minute}`;
}

export function formatInZone(iso: string, timeZone: string): string {
  const when = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
  return `${when} (${timeZone})`;
}
