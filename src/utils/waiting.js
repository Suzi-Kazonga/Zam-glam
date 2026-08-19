// How long a parcel has been sitting since the shop released it. Used to age the courier
// pool, warn the shop, and show the admin what has stalled.
export const ESCALATION_MINUTES = 60;

export function minutesSince(timestamp) {
  if (!timestamp) return 0;
  const started = new Date(timestamp).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 60000));
}

export function formatWaiting(timestamp) {
  const minutes = minutesSince(timestamp);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

// Past the escalation threshold a parcel is overdue and should stand out.
export function isOverdue(timestamp, threshold = ESCALATION_MINUTES) {
  return minutesSince(timestamp) >= threshold;
}
