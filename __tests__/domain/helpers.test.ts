import {
  authorInitials,
  caseDisplayId,
  caseTitle,
  classificationFromId,
  classificationLabel,
  err,
  isOk,
  ok,
} from '@/domain';

describe('helpers de dominio', () => {
  describe('caseTitle', () => {
    it('compone Categoría + secundario (módulo/equipo/servicio)', () => {
      expect(
        caseTitle({
          equipmentTypeDesc: 'Software',
          softwareModuleDesc: 'Actuaciones',
          hardwareEquipmentDesc: null,
          serviceTypeDesc: 'Correctivo',
        }),
      ).toBe('Software · Actuaciones');
    });

    it('usa solo la categoría si no hay secundario', () => {
      expect(
        caseTitle({
          equipmentTypeDesc: 'Otro',
          softwareModuleDesc: null,
          hardwareEquipmentDesc: null,
          serviceTypeDesc: null,
        }),
      ).toBe('Otro');
    });

    it('cae al equipo de hardware cuando no hay módulo', () => {
      expect(
        caseTitle({
          equipmentTypeDesc: 'Hardware',
          softwareModuleDesc: null,
          hardwareEquipmentDesc: 'Monitor',
          serviceTypeDesc: null,
        }),
      ).toBe('Hardware · Monitor');
    });
  });

  describe('caseDisplayId', () => {
    it('muestra el idCaseClient del servidor', () => {
      expect(caseDisplayId({ caseClientId: 28 })).toBe('Caso #28');
    });
    it('muestra marcador cuando no hay caseClientId', () => {
      expect(caseDisplayId({ caseClientId: null })).toBe('Caso (pendiente de número)');
    });
  });

  describe('clasificación', () => {
    it('mapea ids 1/2/3 y cae en pendiente para otros', () => {
      expect(classificationFromId(1)).toBe('pendiente');
      expect(classificationFromId(2)).toBe('cola');
      expect(classificationFromId(3)).toBe('cerrado');
      expect(classificationFromId(6)).toBe('pendiente');
      expect(classificationFromId(null)).toBe('pendiente');
    });
    it('etiqueta legible', () => {
      expect(classificationLabel('cola')).toBe('En Cola');
    });
  });

  describe('authorInitials', () => {
    it('toma iniciales de nombre y apellido', () => {
      expect(authorInitials('Saulo Bravo')).toBe('SB');
      expect(authorInitials('María de los Ángeles Pérez')).toBe('MP');
    });
    it('maneja un solo nombre y vacío', () => {
      expect(authorInitials('Xoftix')).toBe('XO');
      expect(authorInitials('   ')).toBe('?');
    });
  });

  describe('Result', () => {
    it('ok/err/isOk', () => {
      expect(isOk(ok(5))).toBe(true);
      const e = err(new Error('x'));
      expect(isOk(e)).toBe(false);
    });
  });
});
