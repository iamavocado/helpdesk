import { fireEvent, render } from '@testing-library/react-native';

import type { Case } from '@/domain';
import { CasesListScreen } from '@/presentation/screens/cases-list';

const makeCase = (
  id: string,
  classification: Case['classification'],
  overrides: Partial<Case> = {},
): Case => ({
  id,
  serverId: Number(id),
  userRequester: 'Tester',
  requesterEmail: null,
  reportingUser: null,
  reportingUserEmail: null,
  creationDate: Date.now(),
  modificationDate: Date.now(),
  solutionDate: null,
  classificationId: 1,
  classification,
  statusCaseId: 1,
  statusCaseDesc: '',
  subStatusId: null,
  equipmentTypeId: 1,
  equipmentTypeDesc: 'Hardware',
  softwareModuleId: null,
  softwareModuleDesc: null,
  softwareEnvironmentId: null,
  softwareEnvironmentDesc: null,
  hardwareEquipmentId: 4,
  hardwareEquipmentDesc: 'Monitor',
  priorityId: null,
  priorityDesc: null,
  serviceTypeId: null,
  serviceTypeDesc: null,
  caseDetails: 'detalle',
  technician: null,
  location: null,
  client: null,
  countryDesc: null,
  departmentDesc: null,
  syncStatus: 'synced',
  ...overrides,
});

const baseProps = {
  cases: [
    makeCase('1', 'pendiente' as const),
    makeCase('2', 'cola' as const, {
      equipmentTypeDesc: 'Software',
      hardwareEquipmentId: null,
      hardwareEquipmentDesc: null,
      softwareModuleId: 1,
      softwareModuleDesc: 'Actuaciones',
    }),
  ],
  filter: 'todos' as const,
  total: 2,
  onChangeFilter: jest.fn(),
  onOpenCase: jest.fn(),
};

describe('CasesListScreen', () => {
  it('renderiza el título, el total y los casos', () => {
    const { getByText } = render(<CasesListScreen {...baseProps} />);
    expect(getByText('Mis casos')).toBeTruthy();
    expect(getByText('2 casos · Todos los casos')).toBeTruthy();
    expect(getByText('Hardware · Monitor')).toBeTruthy();
  });

  it('cambia el filtro al tocar un chip', () => {
    const onChangeFilter = jest.fn();
    const { getAllByText } = render(
      <CasesListScreen {...baseProps} onChangeFilter={onChangeFilter} />,
    );
    // "En Cola" aparece como chip (en el header) y como badge del caso; el chip va primero.
    fireEvent.press(getAllByText('En Cola')[0]);
    expect(onChangeFilter).toHaveBeenCalledWith('cola');
  });

  it('muestra el título del filtro activo', () => {
    const { getAllByText, getByText } = render(
      <CasesListScreen {...baseProps} filter="pendiente" total={5} />,
    );
    // "Pendientes" aparece como título y como chip.
    expect(getAllByText('Pendientes').length).toBeGreaterThan(0);
    expect(getByText('5 casos · Casos pendientes')).toBeTruthy();
  });

  it('abre el detalle al tocar un caso', () => {
    const onOpenCase = jest.fn();
    const { getByLabelText } = render(<CasesListScreen {...baseProps} onOpenCase={onOpenCase} />);
    fireEvent.press(getByLabelText('Hardware · Monitor'));
    expect(onOpenCase).toHaveBeenCalledWith('1');
  });
});
