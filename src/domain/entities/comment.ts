import type { SyncStatus } from '../value-objects';

/**
 * Comentario de un caso (dominio). Deriva de `Desk.CasesComments`.
 * Los comentarios son append-only (inmutables) → no generan conflictos de sync.
 */
export interface Comment {
  id: string;
  serverId: number | null;
  caseId: string; // FK local → Case.id
  caseServerId: number | null;
  body: string;
  creationDate: number; // epoch ms
  authorName: string;
  authorRole: string | null;
  isPrivate: boolean;
  statusCaseId: number | null;
  statusDesc: string | null;
  hasAttachment: boolean;
  syncStatus: SyncStatus;
}

/** Datos para agregar un comentario desde la app. */
export interface NewCommentInput {
  caseId: string;
  body: string;
  isPrivate: boolean;
  statusCaseId?: number | null;
  statusDesc?: string | null;
  /** Username de login del autor: el backend lo guarda como userRequester. */
  authorUsername?: string | null;
}

/** Iniciales para el avatar a partir del nombre del autor. */
export function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
