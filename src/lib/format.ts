const TZ = "America/Santiago";
const LOCALE = "es-CL";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString(LOCALE, { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatTimeRange(entry: Date | string, exit?: Date | string | null): string {
  const e = formatTime(entry);
  if (!exit) return e;
  return `${e} — ${formatTime(exit)}`;
}

export function formatCLP(amount: number): string {
  return `$${amount.toLocaleString(LOCALE)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes} min`;
}
