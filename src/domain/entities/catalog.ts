/**
 * Ítem de catálogo genérico (Catalogs.* en la BD real).
 * Estructura común: Id + Description (+ Enable).
 */
export interface CatalogItem {
  id: number;
  description: string;
  enable: boolean;
}

/** Prioridad incluye SLA (HoursToClose). */
export interface PriorityItem extends CatalogItem {
  hoursToClose: number | null;
}

/**
 * Conjunto de catálogos que la app necesita para los formularios.
 * `clients` no es una tabla: se deriva de `DISTINCT Cases.Client`.
 */
export interface Catalogs {
  equipmentTypes: CatalogItem[]; // categoría
  modules: CatalogItem[];
  environments: CatalogItem[];
  hardwareEquipment: CatalogItem[];
  serviceTypes: CatalogItem[];
  priorities: PriorityItem[];
  subStatuses: CatalogItem[];
  clients: string[];
}
