import { fireEvent, render } from '@testing-library/react-native';

import { LoginScreen } from '@/presentation/screens/login';

describe('LoginScreen', () => {
  it('muestra la versión y la fecha al fondo de la tarjeta', () => {
    const { getByText, getByTestId } = render(<LoginScreen onSubmit={jest.fn()} />);

    expect(getByText('Versión 1.0')).toBeTruthy();
    expect(getByText('14/09/2026')).toBeTruthy();
    expect(getByTestId('login-version-footer').props.style).toEqual(
      expect.objectContaining({ marginTop: 'auto' }),
    );
  });

  it('muestra error de validación y no envía si los campos están vacíos', () => {
    const onSubmit = jest.fn();
    const { getByText, queryByText } = render(<LoginScreen onSubmit={onSubmit} />);

    fireEvent.press(getByText('Ingresar'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(queryByText('Ingresa tu usuario')).toBeTruthy();
  });

  it('envía las credenciales cuando son válidas', () => {
    const onSubmit = jest.fn();
    const { getByText, getByLabelText } = render(<LoginScreen onSubmit={onSubmit} />);

    fireEvent.changeText(getByLabelText('Usuario'), 'saulo');
    fireEvent.changeText(getByLabelText('Contraseña'), 'dozzier');
    fireEvent.press(getByText('Ingresar'));

    expect(onSubmit).toHaveBeenCalledWith({ username: 'saulo', password: 'dozzier' });
  });

  it('alterna la visibilidad de la contraseña con el botón de ojo', () => {
    const { getByLabelText } = render(<LoginScreen onSubmit={jest.fn()} />);

    const passwordInput = getByLabelText('Contraseña');
    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(getByLabelText('Mostrar contraseña'));
    expect(passwordInput.props.secureTextEntry).toBe(false);

    fireEvent.press(getByLabelText('Ocultar contraseña'));
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it('muestra el mensaje de error del servidor', () => {
    const { getByText } = render(
      <LoginScreen onSubmit={jest.fn()} errorMessage="Usuario o contraseña incorrectos" />,
    );
    expect(getByText('Usuario o contraseña incorrectos')).toBeTruthy();
  });
});
