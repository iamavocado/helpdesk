/**
 * DTOs que reflejan el contrato del servidor (`BPMHelpDesk`, esquema `Desk`).
 * Nombres en PascalCase como los devolvería una API .NET sobre esas columnas.
 * Las fechas viajan como ISO-8601 (string).
 */
export interface CaseDto {
  Id: number;
  UserRequester: string | null;
  EmailRequester: string | null;
  ReportingUser: string | null;
  ReportingUserEmail: string | null;
  CreationDate: string;
  ModificationDate: string | null;
  SolutionDate: string | null;
  ClassificationCaseId: number | null;
  StatusCaseId: number | null;
  StatusCaseDesc: string | null;
  SubStatusCaseId: number | null;
  EquipmentTypeId: number | null;
  EquipmentTypeDesc: string | null;
  SoftwareModuleId: number | null;
  SoftwareModuleDesc: string | null;
  SoftwareEnvironmentId: number | null;
  SoftwareEnvironmentDesc: string | null;
  HardwareEquipmentId: number | null;
  HardwareEquipmentDesc: string | null;
  PriorityId: number | null;
  PriorityDesc: string | null;
  ServiceTypeId: number | null;
  ServiceTypeDesc: string | null;
  CaseDetails: string | null;
  Technician: string | null;
  Location: string | null;
  Client: string | null;
  CountryDesc: string | null;
  DepartmentDesc: string | null;
}

export interface CommentDto {
  Id: number;
  IdCase: number;
  Comment: string | null;
  CreationDate: string;
  StatusCaseId: number | null;
  StatusDesc: string | null;
  ClassificationCaseId: number | null;
  SubStatusCaseId: number | null;
  UserRequester: string | null;
  IsPrivate: boolean | null;
  AttachedFile: string | null;
}

/** Cuerpo para crear un caso en el servidor. */
export interface CreateCaseDto {
  EquipmentTypeId: number;
  EquipmentTypeDesc: string;
  SoftwareModuleId?: number | null;
  SoftwareModuleDesc?: string | null;
  SoftwareEnvironmentId?: number | null;
  SoftwareEnvironmentDesc?: string | null;
  HardwareEquipmentId?: number | null;
  HardwareEquipmentDesc?: string | null;
  ServiceTypeId?: number | null;
  ServiceTypeDesc?: string | null;
  PriorityId?: number | null;
  PriorityDesc?: string | null;
  CaseDetails: string;
  Client?: string | null;
  ReportingUser?: string | null;
  ReportingUserEmail?: string | null;
  Location?: string | null;
}

/** Cuerpo para agregar un comentario en el servidor. */
export interface CreateCommentDto {
  IdCase: number;
  Comment: string;
  IsPrivate: boolean;
  StatusCaseId?: number | null;
  StatusDesc?: string | null;
}

export interface CatalogItemDto {
  Id: number;
  Description: string | null;
  Enable: boolean | null;
}

export interface PriorityDto extends CatalogItemDto {
  HoursToClose: number | null;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface AuthUserDto {
  username: string;
  name: string;
  email: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export interface CatalogsDto {
  equipmentTypes: CatalogItemDto[];
  modules: CatalogItemDto[];
  environments: CatalogItemDto[];
  hardwareEquipment: CatalogItemDto[];
  serviceTypes: CatalogItemDto[];
  priorities: PriorityDto[];
  subStatuses: CatalogItemDto[];
  clients: string[];
}
