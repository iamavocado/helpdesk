/**
 * Generador de IDs locales (UUID v4 simplificado).
 * Uso: claves primarias locales antes de tener el `serverId`.
 * No es criptográficamente seguro (no se usa para secretos).
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** ID local estable para registros originados en el servidor (upsert por serverId). */
export function serverLocalId(serverId: number): string {
  return `srv-${serverId}`;
}
