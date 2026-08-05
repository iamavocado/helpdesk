/**
 * Persona asignable a un caso (del directorio Ultimus/AD, vía
 * `GET /api/ultimus-user-members`). No es una tabla de la BD del helpdesk.
 */
export interface Member {
  /** Nombre para mostrar en el select "Asignar a". */
  fullName: string;
  /** Identificador de dominio, p. ej. "DESA/emanrique". */
  userName: string;
  email: string | null;
  jobFunction: string | null;
}

/**
 * Datos de la reasignación de un caso (modal "Reasignar Caso").
 * Todos opcionales salvo el técnico: solo se envían los que cambian.
 */
export interface ReassignInput {
  /** Nombre del técnico asignado (campo `technician` del caso). */
  technician: string;
  statusCaseId?: number | null;
  statusCaseDesc?: string | null;
  statusCaseSubStatusId?: number | null;
  statusCaseSubStatusDesc?: string | null;
  equipmentTypeId?: number | null;
  equipmentTypeDesc?: string | null;
  serviceTypeId?: number | null;
  serviceTypeDesc?: string | null;
  caseDetails?: string | null;
}
