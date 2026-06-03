/**
 * Modelo de estados alineado a la BD real `BPMHelpDesk`.
 * La UI agrupa por las 3 clasificaciones reales (ClassificationStatusCase);
 * `resuelto` existe solo como clave visual (subestado), no como clasificación.
 * Ver DATA_MODEL.md §6.
 */
export type Classification = 'pendiente' | 'cola' | 'cerrado';

/** Claves visuales (incluye `resuelto` para badges/colores). */
export type StatusVisualKey = 'pendiente' | 'cola' | 'resuelto' | 'cerrado';

/** ClassificationStatusCase.Id → clave de clasificación. */
export const CLASSIFICATION_BY_ID: Readonly<Record<number, Classification>> = {
  1: 'pendiente',
  2: 'cola',
  3: 'cerrado',
};

export const CLASSIFICATION_LABEL: Readonly<Record<Classification, string>> = {
  pendiente: 'Pendiente',
  cola: 'En Cola',
  cerrado: 'Cerrado',
};

/**
 * Mapea el `ClassificationCaseId` del servidor a una clasificación de UI.
 * Regla determinista documentada; los ids fuera de {1,2,3} caen en `pendiente`
 * hasta validar el contrato real de la API (DATA_MODEL.md §6, punto abierto).
 */
export function classificationFromId(id: number | null | undefined): Classification {
  if (id == null) return 'pendiente';
  return CLASSIFICATION_BY_ID[id] ?? 'pendiente';
}

export function classificationLabel(c: Classification): string {
  return CLASSIFICATION_LABEL[c];
}
