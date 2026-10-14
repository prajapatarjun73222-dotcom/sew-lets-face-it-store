export const UK_TIME_ZONE = 'Europe/London';

const partsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: UK_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
});

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock parts of an instant as seen in the UK. */
export function ukParts(date = new Date()) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS[parts.weekday],
  };
}

/** Minutes the UK is ahead of UTC at a given instant (0 in winter, 60 in summer). */
function ukOffsetMinutes(date) {
  const p = ukParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Converts a UK wall-clock time to the matching UTC instant, following the clock changes. */
export function ukLocalToUtc(year, month, day, hour, minute) {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  let result = naive - ukOffsetMinutes(new Date(naive)) * 60000;
  const corrected = naive - ukOffsetMinutes(new Date(result)) * 60000;
  if (corrected !== result) result = corrected;
  return new Date(result);
}

/** Calendar days (UK) starting today, as { year, month, day, weekday }. */
export function upcomingUkDays(count, from = new Date()) {
  const today = ukParts(from);
  const days = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date(Date.UTC(today.year, today.month - 1, today.day + i));
    days.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay() });
  }
  return days;
}
