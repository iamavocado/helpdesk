import type { Case } from '@/domain';

/** Un valor "vacío" del servidor no debe pisar un dato local ya conocido. */
const isEmpty = (v: unknown): boolean => v == null || v === '' || v === 0;

/**
 * Mezcla un caso entrante del servidor sobre el existente en local.
 *
 * La **lista liviana** (`GET /api/Case`) no trae taxonomía (categoría, módulo,
 * equipo, país/provincia, subestado…) y el backend tampoco devuelve las
 * descripciones de un caso recién creado. Sin este merge, un `upsert` con la
 * versión liviana borraría lo que el usuario eligió al crear el caso (la card
 * quedaría en blanco). Regla: se toma el valor del servidor salvo que venga
 * vacío, en cuyo caso se conserva el local. Los campos que el servidor sí trae
 * con valor (estado, técnico, fechas, sync) siempre ganan.
 */
export function mergeServerCase(existing: Case, incoming: Case): Case {
  const merged = { ...incoming } as Record<string, unknown>;
  const prev = existing as unknown as Record<string, unknown>;
  for (const key of Object.keys(prev)) {
    if (key === 'id' || key === 'serverId') continue; // los resuelve el upsert
    if (isEmpty(merged[key]) && !isEmpty(prev[key])) {
      merged[key] = prev[key];
    }
  }
  return merged as unknown as Case;
}
