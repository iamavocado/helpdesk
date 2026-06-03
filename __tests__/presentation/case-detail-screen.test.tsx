import { fireEvent, render } from '@testing-library/react-native';

import type { Case, Comment } from '@/domain';
import { CaseDetailScreen } from '@/presentation/screens/case-detail';

const caseItem: Case = {
  id: 'c1',
  serverId: 341,
  userRequester: 'Saulo Bravo',
  requesterEmail: null,
  reportingUser: null,
  reportingUserEmail: null,
  creationDate: Date.parse('2026-05-27T09:14:00.000Z'),
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
};

const comments: Comment[] = [
  {
    id: 'm1',
    serverId: 1,
    caseId: 'c1',
    caseServerId: 341,
    body: 'El reporte arroja error 500.',
    creationDate: Date.now(),
    authorName: 'Saulo Bravo',
    authorRole: null,
    isPrivate: false,
    statusCaseId: null,
    statusDesc: null,
    hasAttachment: false,
    syncStatus: 'synced',
  },
  {
    id: 'm2',
    serverId: 2,
    caseId: 'c1',
    caseServerId: 341,
    body: 'Nota interna: falta índice.',
    creationDate: Date.now(),
    authorName: 'María Rodríguez',
    authorRole: 'Soporte N2',
    isPrivate: true,
    statusCaseId: null,
    statusDesc: null,
    hasAttachment: false,
    syncStatus: 'synced',
  },
];

describe('CaseDetailScreen', () => {
  it('muestra la información del caso y la conversación', () => {
    const { getByText } = render(
      <CaseDetailScreen
        caseItem={caseItem}
        comments={comments}
        onBack={jest.fn()}
        onSubmitComment={jest.fn()}
      />,
    );
    expect(getByText('Caso #341')).toBeTruthy();
    expect(getByText('Software · Programación de Audiencia')).toBeTruthy();
    expect(getByText('SPA')).toBeTruthy();
    expect(getByText('El reporte arroja error 500.')).toBeTruthy();
    expect(getByText('Privado')).toBeTruthy(); // comentario privado
  });

  it('valida que el comentario no esté vacío', () => {
    const onSubmitComment = jest.fn();
    const { getByText } = render(
      <CaseDetailScreen
        caseItem={caseItem}
        comments={[]}
        onBack={jest.fn()}
        onSubmitComment={onSubmitComment}
      />,
    );
    fireEvent.press(getByText('Enviar comentario'));
    expect(onSubmitComment).not.toHaveBeenCalled();
    expect(getByText('Escribe un comentario')).toBeTruthy();
  });

  it('envía el comentario escrito', () => {
    const onSubmitComment = jest.fn();
    const { getByText, getByLabelText } = render(
      <CaseDetailScreen
        caseItem={caseItem}
        comments={[]}
        onBack={jest.fn()}
        onSubmitComment={onSubmitComment}
      />,
    );
    fireEvent.changeText(getByLabelText('Descripción'), 'Revisado, todo OK');
    fireEvent.press(getByText('Enviar comentario'));
    expect(onSubmitComment).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'Revisado, todo OK', isPrivate: false }),
    );
  });

  it('invoca onBack', () => {
    const onBack = jest.fn();
    const { getByLabelText } = render(
      <CaseDetailScreen
        caseItem={caseItem}
        comments={[]}
        onBack={onBack}
        onSubmitComment={jest.fn()}
      />,
    );
    fireEvent.press(getByLabelText('Atrás'));
    expect(onBack).toHaveBeenCalled();
  });
});
