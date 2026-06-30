import { fireEvent, render } from '@testing-library/react-native';

import { catalogsDtoToDomain } from '@/data';
import { mockCatalogs } from '@/mock';
import { NewCaseScreen } from '@/presentation/screens/new-case';

const catalogs = catalogsDtoToDomain(mockCatalogs);

const baseProps = {
  catalogs,
  userName: 'Saulo Bravo',
  userEmail: 'saulo@ita-sa.com',
  onCancel: jest.fn(),
  onSubmit: jest.fn(),
};

describe('NewCaseScreen', () => {
  it('renderiza el registro y los datos del solicitante', () => {
    const { getByText, getByDisplayValue } = render(<NewCaseScreen {...baseProps} />);
    expect(getByText('Nuevo caso')).toBeTruthy();
    expect(getByText('Registro')).toBeTruthy();
    expect(getByText('Cliente')).toBeTruthy();
    expect(getByDisplayValue('Saulo Bravo')).toBeTruthy();
  });

  it('valida categoría y asunto obligatorios', () => {
    const onSubmit = jest.fn();
    const { getByText } = render(<NewCaseScreen {...baseProps} onSubmit={onSubmit} />);
    fireEvent.press(getByText('Solicitar'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(getByText('Selecciona una categoría')).toBeTruthy();
    expect(getByText('Describe el caso (mín. 5 caracteres)')).toBeTruthy();
  });

  it('muestra campos condicionales (Ambiente/Módulo) al elegir Software', () => {
    const { getByLabelText, getByText, queryByText } = render(<NewCaseScreen {...baseProps} />);
    expect(queryByText('Módulo')).toBeNull();

    fireEvent.press(getByLabelText('Categoría')); // abre el select
    fireEvent.press(getByText('Software')); // elige Software

    expect(getByText('Ambiente')).toBeTruthy();
    expect(getByText('Módulo')).toBeTruthy();
  });

  it('envía el caso con la categoría y el asunto', () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByText } = render(
      <NewCaseScreen {...baseProps} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByLabelText('Categoría'));
    fireEvent.press(getByText('Software'));
    fireEvent.changeText(getByLabelText('Asunto'), 'No carga el reporte mensual');
    fireEvent.press(getByText('Solicitar'));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentTypeId: 2,
        equipmentTypeDesc: 'Software',
        caseDetails: 'No carga el reporte mensual',
      }),
    );
  });
});
