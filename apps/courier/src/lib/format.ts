const timeFmt = new Intl.DateTimeFormat("en-CA", { hour: "numeric", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("en-CA", { weekday: "short", month: "short", day: "numeric" });

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return dateFmt.format(new Date(y, m - 1, d));
}

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export function minutesUntil(iso: string) {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 60_000));
}

export function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
