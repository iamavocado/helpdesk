/** Tipo de entidad que puede encolarse para sincronizar. */
export type PendingEntityType = 'case' | 'comment';

/** Operación encolada para enviar al servidor (ver DATA_MODEL.md §4.2). */
export interface PendingOperation {
  id: string;
  entityType: PendingEntityType;
  entityId: string; // id local de la entidad
  operation: 'create' | 'update';
  payload: unknown; // DTO serializable
  retryCount: number;
  nextAttemptAt: number; // epoch ms
  lastError: string | null;
  createdAt: number; // epoch ms (orden FIFO)
}
