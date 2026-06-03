import type { CatalogsDto } from '@/data/datasources/remote/dto';

/**
 * Catálogos reales extraídos de `Script_Data_Estructura_BPMHelpDesk.sql`.
 * Estos valores deben coincidir con los del backend de producción.
 */
const item = (Id: number, Description: string, extra: Record<string, unknown> = {}) => ({
  Id,
  Description,
  Enable: true,
  ...extra,
});

export const mockCatalogs: CatalogsDto = {
  // EquipmentType (categoría)
  equipmentTypes: [
    item(1, 'Hardware'),
    item(2, 'Software'),
    item(3, 'Sala de Audiencia'),
    item(4, 'Capacitación'),
    item(5, 'Otro'),
  ],
  modules: [
    item(1, 'Actuaciones'),
    item(2, 'Bandeja de Entrada'),
    item(3, 'Defensa Pública'),
    item(4, 'Defensa de Víctimas'),
    item(5, 'Defensa Privada'),
    item(6, 'Gestión del caso'),
    item(7, 'Noticia Criminal'),
    item(8, 'Notificaciones'),
    item(9, 'Comunicación'),
    item(10, 'Perfilación'),
    item(11, 'Programación de Audiencia'),
    item(12, 'Registro de actuaciones'),
    item(13, 'Estadísticas y Reportes'),
    item(14, 'VTS'),
  ],
  environments: [
    item(1, 'Capacitación'),
    item(2, 'Pre Producción'),
    item(3, 'Producción'),
    item(4, 'Pruebas'),
  ],
  hardwareEquipment: [
    item(1, 'Teclado'),
    item(2, 'Micrófono cuello de ganso'),
    item(3, 'Consola'),
    item(4, 'Monitor'),
    item(5, 'Cámaras'),
    item(6, 'Proyector del tablero'),
    item(7, 'Rasberry'),
    item(8, 'Swicht'),
    item(9, 'Televisor'),
    item(10, 'UPS'),
    item(11, 'N/A'),
  ],
  serviceTypes: [
    item(1, 'Correctivo'),
    item(2, 'Preventivo'),
    item(3, 'Otros'),
    item(4, 'Ajuste de datos'),
    item(5, 'Auditoría'),
    item(6, 'Lentitud'),
    item(7, 'Parametrización'),
    item(8, 'Procedimental'),
    item(9, 'Desarrollo'),
  ],
  priorities: [
    { ...item(1, 'Baja'), HoursToClose: 8 },
    { ...item(2, 'Media'), HoursToClose: 3 },
    { ...item(3, 'Alta'), HoursToClose: 1 },
  ],
  subStatuses: [item(1, 'A Tiempo'), item(2, 'Tardío')],
  clients: ['SPA', 'Órgano Judicial (OJ)', 'Defensa Pública', 'Ministerio Público'],
};

/** StatusCase reales por clasificación (para sembrar estados coherentes). */
export const statusByClassification: Record<number, { id: number; desc: string }[]> = {
  1: [
    { id: 1, desc: 'En espera de respuesta soporte' },
    { id: 6, desc: 'En espera de respuesta cliente' },
  ],
  2: [{ id: 2, desc: 'Devolver a cola' }],
  3: [
    { id: 3, desc: 'Resuelto' },
    { id: 4, desc: 'Cerrado' },
  ],
};
