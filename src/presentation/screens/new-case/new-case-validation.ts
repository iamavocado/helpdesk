export interface NewCaseDraft {
  client: string;
  reportingUser: string;
  endUserEmail: string;
  equipmentTypeId: number | undefined;
  environmentId: number | undefined;
  moduleId: number | undefined;
  hardwareEquipmentId: number | undefined;
  caseDetails: string;
}

export type NewCaseErrors = Partial<Record<keyof NewCaseDraft, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida el formulario de nuevo caso (campos requeridos + email del usuario final). */
export function validateNewCase(draft: NewCaseDraft): NewCaseErrors {
  const errors: NewCaseErrors = {};
  if (draft.equipmentTypeId == null) errors.equipmentTypeId = 'Selecciona una categoría';
  if (draft.caseDetails.trim().length < 5)
    errors.caseDetails = 'Describe el caso (mín. 5 caracteres)';
  if (draft.endUserEmail.trim() && !EMAIL_RE.test(draft.endUserEmail.trim())) {
    errors.endUserEmail = 'Correo no válido';
  }
  return errors;
}

export const EQUIPMENT_SOFTWARE_ID = 2;
export const EQUIPMENT_HARDWARE_ID = 1;
