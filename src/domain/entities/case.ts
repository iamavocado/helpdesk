import type { Classification, SyncStatus } from '../value-objects';

/**
 * Caso de soporte (dominio). Deriva de `Desk.Cases` (ver DATA_MODEL.md §4),
 * en camelCase y con un subconjunto orientado a las pantallas de la app.
 * `id` es UUID local; `serverId` es el entero IDENTITY del servidor (null si no sincronizado).
 */
export interface Case {
  id: string;
  serverId: number | null;

  // Solicitante / reporte
  userRequester: string;
  requesterEmail: string | null;
  reportingUser: string | null;
  reportingUserEmail: string | null;

  // Fechas (epoch ms)
  creationDate: number;
  modificationDate: number;
  solutionDate: number | null;

  // Estado
  classificationId: number;
  classification: Classification;
  statusCaseId: number;
  statusCaseDesc: string;
  subStatusId: number | null;

  // Clasificación / categoría
  equipmentTypeId: number;
  equipmentTypeDesc: string;
  softwareModuleId: number | null;
  softwareModuleDesc: string | null;
  softwareEnvironmentId: number | null;
  softwareEnvironmentDesc: string | null;
  hardwareEquipmentId: number | null;
  hardwareEquipmentDesc: string | null;
  priorityId: number | null;
  priorityDesc: string | null;
  serviceTypeId: number | null;
  serviceTypeDesc: string | null;

  // Contenido
  caseDetails: string;
  technician: string | null;
  location: string | null;

  // Ubicación / cliente
  client: string | null;
  countryDesc: string | null;
  departmentDesc: string | null;

  // Sincronización (solo cliente)
  syncStatus: SyncStatus;
}

/**
 * Datos para crear un caso desde la app (campos que el usuario aporta).
 * El resto (fechas, estado inicial, identidad) los completa el caso de uso.
 */
export interface NewCaseInput {
  equipmentTypeId: number;
  softwareModuleId?: number | null;
  softwareEnvironmentId?: number | null;
  hardwareEquipmentId?: number | null;
  serviceTypeId?: number | null;
  priorityId?: number | null;
  caseDetails: string;
  client?: string | null;
  /** Solicitante = username de login. La API lo exige y filtra los casos por él. */
  userRequester?: string | null;
  emailRequester?: string | null;
  /** Oficina o usuario que reporta. */
  reportingUser?: string | null;
  /** Correo del usuario final que reporta. */
  reportingUserEmail?: string | null;
  location?: string | null;
  countryId?: number | null;
  departmentId?: number | null;
  /** Nuevos campos requeridos por el endpoint */
  statusCaseId?: number | null;
  classificationCaseId?: number | null;
  serial?: string | null;
  technician?: string | null;
  positionRequester?: string | null;
  departmentRequester?: string | null;
  subDepartment?: string | null;
}

/**
 * Título derivado para listas (la BD no tiene "asunto"):
 * Categoría + (Módulo | Equipo | Tipo de servicio). Ver DATA_MODEL.md §7.
 */
export function caseTitle(
  c: Pick<
    Case,
    'equipmentTypeDesc' | 'softwareModuleDesc' | 'hardwareEquipmentDesc' | 'serviceTypeDesc'
  >,
): string {
  const secondary = c.softwareModuleDesc ?? c.hardwareEquipmentDesc ?? c.serviceTypeDesc ?? null;
  return secondary ? `${c.equipmentTypeDesc} · ${secondary}` : c.equipmentTypeDesc;
}

/** Identificador legible: entero del servidor o marcador offline. */
export function caseDisplayId(c: Pick<Case, 'serverId'>): string {
  return c.serverId != null ? `Caso #${c.serverId}` : 'Caso (pendiente de número)';
}
