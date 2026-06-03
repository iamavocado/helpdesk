import type { CaseDto, CommentDto, CatalogsDto } from '@/data/datasources/remote/dto';

import { mockCatalogs, statusByClassification } from './catalogs';

export interface SeedData {
  cases: CaseDto[];
  comments: CommentDto[];
  catalogs: CatalogsDto;
}

/** PRNG determinista (mulberry32) para que el seed sea estable. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REQUESTERS = [
  'Saulo Bravo',
  'Adalberto Ariano',
  'María Rodríguez',
  'Carlos Pérez',
  'Lucía Gómez',
  'Jorge Mendoza',
  'Ana Castillo',
  'Roberto Díaz',
];
const SUPPORT = ['María Rodríguez', 'Xoftix Soporte', 'Equipo N2'];
const DETAILS = [
  'Error al generar el reporte mensual; el sistema arroja error 500.',
  'Solicitud de acceso al módulo de inventario para nuevo usuario.',
  'La impresora no responde en la sala de audiencia 3.',
  'Audio intermitente durante la grabación de audiencia.',
  'Actualización de licencia de Office vencida.',
  'Lentitud al cargar la bandeja de entrada de notificaciones.',
  'No se puede agendar una nueva audiencia desde el módulo.',
  'El proyector del tablero no enciende.',
  'Cambio de contraseña de correo institucional.',
  'Falla al registrar actuaciones procesales.',
];
const LOCATIONS = [
  'Oficina principal',
  'Sala de Audiencia 1',
  'Sala de Audiencia 3',
  'Piso 4',
  'Anexo',
];
const DAY = 86400000;

const desc = (list: { Id: number; Description: string | null }[], id: number): string =>
  list.find((x) => x.Id === id)?.Description ?? '';

/** Genera el conjunto de datos del mock (≥50 casos en las 3 clasificaciones). */
export function generateSeed(now: number = Date.now()): SeedData {
  const rnd = mulberry32(20260602);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]!;

  const cases: CaseDto[] = [];
  const comments: CommentDto[] = [];

  // Distribución determinista: 30 pendiente, 15 cola, 15 cerrado = 60 casos.
  const plan: number[] = [
    ...Array<number>(30).fill(1),
    ...Array<number>(15).fill(2),
    ...Array<number>(15).fill(3),
  ];

  plan.forEach((classificationId, index) => {
    const id = index + 1;
    const status = pick(statusByClassification[classificationId]!);
    const equipment = pick(mockCatalogs.equipmentTypes);
    const requester = pick(REQUESTERS);
    const createdAt = now - Math.floor(rnd() * 120) * DAY - Math.floor(rnd() * DAY);
    const isSoftware = equipment.Id === 2;
    const isHardware = equipment.Id === 1;
    const priority = pick(mockCatalogs.priorities);
    const service = pick(mockCatalogs.serviceTypes);
    const solved = classificationId === 3;

    const dto: CaseDto = {
      Id: id,
      UserRequester: requester,
      EmailRequester: `${requester.split(' ')[0]!.toLowerCase()}@ita-sa.com`,
      ReportingUser: requester,
      ReportingUserEmail: null,
      CreationDate: new Date(createdAt).toISOString(),
      ModificationDate: new Date(createdAt + Math.floor(rnd() * 3) * DAY).toISOString(),
      SolutionDate: solved ? new Date(createdAt + 4 * DAY).toISOString() : null,
      ClassificationCaseId: classificationId,
      StatusCaseId: status.id,
      StatusCaseDesc: status.desc,
      SubStatusCaseId: pick(mockCatalogs.subStatuses).Id,
      EquipmentTypeId: equipment.Id,
      EquipmentTypeDesc: equipment.Description,
      SoftwareModuleId: isSoftware ? pick(mockCatalogs.modules).Id : null,
      SoftwareModuleDesc: null,
      SoftwareEnvironmentId: isSoftware ? pick(mockCatalogs.environments).Id : null,
      SoftwareEnvironmentDesc: null,
      HardwareEquipmentId: isHardware ? pick(mockCatalogs.hardwareEquipment).Id : null,
      HardwareEquipmentDesc: null,
      PriorityId: priority.Id,
      PriorityDesc: priority.Description,
      ServiceTypeId: service.Id,
      ServiceTypeDesc: service.Description,
      CaseDetails: pick(DETAILS),
      Technician: classificationId === 1 ? null : pick(SUPPORT),
      Location: pick(LOCATIONS),
      Client: pick(mockCatalogs.clients),
      CountryDesc: 'PANAMÁ',
      DepartmentDesc: null,
    };
    // Rellena las descripciones condicionales a partir de los ids elegidos.
    dto.SoftwareModuleDesc = dto.SoftwareModuleId
      ? desc(mockCatalogs.modules, dto.SoftwareModuleId)
      : null;
    dto.SoftwareEnvironmentDesc = dto.SoftwareEnvironmentId
      ? desc(mockCatalogs.environments, dto.SoftwareEnvironmentId)
      : null;
    dto.HardwareEquipmentDesc = dto.HardwareEquipmentId
      ? desc(mockCatalogs.hardwareEquipment, dto.HardwareEquipmentId)
      : null;
    cases.push(dto);

    // Comentarios: 1 del solicitante + 0..3 respuestas de soporte.
    const total = 1 + Math.floor(rnd() * 4);
    for (let c = 1; c <= total; c++) {
      const fromSupport = c > 1;
      comments.push({
        Id: c,
        IdCase: id,
        Comment: fromSupport
          ? 'Estamos revisando el caso. ¿Podrías ampliar el detalle del problema?'
          : dto.CaseDetails,
        CreationDate: new Date(createdAt + c * 3600000).toISOString(),
        StatusCaseId: status.id,
        StatusDesc: status.desc,
        ClassificationCaseId: classificationId,
        SubStatusCaseId: dto.SubStatusCaseId,
        UserRequester: fromSupport ? pick(SUPPORT) : requester,
        IsPrivate: fromSupport && rnd() < 0.25,
        AttachedFile: null,
      });
    }
  });

  return { cases, comments, catalogs: mockCatalogs };
}
