import { fireEvent, render } from '@testing-library/react-native';

import type { Case } from '@/domain';
import { HomeScreen } from '@/presentation/screens/home';

const sampleCase = (overrides: Partial<Case> = {}): Case => ({
  id: 'c1',
  serverId: 341,
  userRequester: 'Saulo Bravo',
  requesterEmail: null,
  reportingUser: null,
  reportingUserEmail: null,
  creationDate: Date.now() - 3 * 3600_000,
  modificationDate: Date.now(),
  solutionDate: null,
  classificationId: 2,
  classification: 'cola',
  statusCaseId: 2,
  statusCaseDesc: 'Devolver a cola',
  subStatusId: null,
  equipmentTypeId: 2,
  equipmentTypeDesc: 'Software',
  softwareModuleId: 11,
  softwareModuleDesc: 'Programación de Audiencia',
  softwareEnvironmentId: 3,
  softwareEnvironmentDesc: 'Producción',
  hardwareEquipmentId: null,
  hardwareEquipmentDesc: null,
  priorityId: 1,
  priorityDesc: 'Baja',
  serviceTypeId: 1,
  serviceTypeDesc: 'Correctivo',
  caseDetails: 'Error al generar reporte',
  technician: null,
  location: null,
  client: 'SPA',
  countryDesc: null,
  departmentDesc: null,
  syncStatus: 'synced',
  ...overrides,
});

const baseProps = {
  userName: 'Saulo',
  counts: { pendiente: 5, cola: 2, cerrado: 3, total: 10 },
  recentCases: [sampleCase()],
  onOpenList: jest.fn(),
  onOpenCase: jest.fn(),
  onCreateCase: jest.fn(),
};

describe('HomeScreen', () => {
  it('muestra el saludo y los totales del dashboard', () => {
    const { getByText } = render(<HomeScreen {...baseProps} />);
    expect(getByText('Saulo')).toBeTruthy();
    expect(getByText('5')).toBeTruthy(); // pendientes
    expect(getByText('10')).toBeTruthy(); // total
    expect(getByText('Casos en Cola')).toBeTruthy();
  });

  it('CTA crea un caso', () => {
    const onCreateCase = jest.fn();
    const { getByText } = render(<HomeScreen {...baseProps} onCreateCase={onCreateCase} />);
    fireEvent.press(getByText('Crear nuevo caso'));
    expect(onCreateCase).toHaveBeenCalled();
  });

  it('abre la lista filtrada al tocar una tarjeta de estado', () => {
    const onOpenList = jest.fn();
    const { getByLabelText } = render(<HomeScreen {...baseProps} onOpenList={onOpenList} />);
    fireEvent.press(getByLabelText('Casos Pendientes: 5'));
    expect(onOpenList).toHaveBeenCalledWith('pendiente');
  });

  it('abre el detalle al tocar un caso reciente', () => {
    const onOpenCase = jest.fn();
    const { getByLabelText } = render(<HomeScreen {...baseProps} onOpenCase={onOpenCase} />);
    fireEvent.press(getByLabelText('Software · Programación de Audiencia'));
    expect(onOpenCase).toHaveBeenCalledWith('c1');
  });
});
