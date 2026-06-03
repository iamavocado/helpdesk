import { z } from 'zod';

/** Esquema de validación del formulario de login. */
export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Ingresa tu usuario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export type LoginFields = z.infer<typeof loginSchema>;

export type LoginErrors = Partial<Record<keyof LoginFields, string>>;

/** Valida y devuelve errores por campo (vacío si es válido). */
export function validateLogin(values: LoginFields): LoginErrors {
  const result = loginSchema.safeParse(values);
  if (result.success) return {};
  const errors: LoginErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof LoginFields;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
