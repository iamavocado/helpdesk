const MONTHS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const pad = (n: number): string => n.toString().padStart(2, '0');

/** Fecha y hora legible: "27 may 2026, 09:14". */
export function formatDateTime(epoch: number): string {
  const d = new Date(epoch);
  return `${d.getDate()} ${MONTHS_ES[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Hora corta: "09:14". */
export function formatTime(epoch: number): string {
  const d = new Date(epoch);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Tiempo relativo en español (aprox.) para listas de casos. */
export function timeAgo(epoch: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - epoch);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} sem`;
  const months = Math.floor(days / 30);
  return `Hace ${months} meses`;
}
