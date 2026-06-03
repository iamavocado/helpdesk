import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * Esquema local WatermelonDB (artefacto del DBA, ver DATA_MODEL.md §4).
 *
 * ACTIVACIÓN: este esquema se conecta a un adaptador SQLite cifrado con
 * SQLCipher en el build nativo (Dev Client). Mientras tanto, la app y los
 * tests usan InMemoryLocalDataSource. No lo importa App ni los tests todavía.
 *
 * schemaVersion 1. Toda evolución futura se hace por migración incremental
 * (ver migrations.ts); nunca se recrea la BD para no perder datos offline.
 */
export const LOCAL_SCHEMA_VERSION = 1;

export const localSchema = appSchema({
  version: LOCAL_SCHEMA_VERSION,
  tables: [
    tableSchema({
      name: 'cases',
      columns: [
        { name: 'server_id', type: 'number', isOptional: true, isIndexed: true },
        { name: 'user_requester', type: 'string' },
        { name: 'requester_email', type: 'string', isOptional: true },
        { name: 'reporting_user', type: 'string', isOptional: true },
        { name: 'reporting_user_email', type: 'string', isOptional: true },
        { name: 'creation_date', type: 'number', isIndexed: true },
        { name: 'modification_date', type: 'number' },
        { name: 'solution_date', type: 'number', isOptional: true },
        { name: 'classification_id', type: 'number', isIndexed: true },
        { name: 'status_case_id', type: 'number', isIndexed: true },
        { name: 'status_case_desc', type: 'string' },
        { name: 'sub_status_id', type: 'number', isOptional: true },
        { name: 'equipment_type_id', type: 'number', isIndexed: true },
        { name: 'equipment_type_desc', type: 'string' },
        { name: 'software_module_id', type: 'number', isOptional: true },
        { name: 'software_module_desc', type: 'string', isOptional: true },
        { name: 'software_environment_id', type: 'number', isOptional: true },
        { name: 'software_environment_desc', type: 'string', isOptional: true },
        { name: 'hardware_equipment_id', type: 'number', isOptional: true },
        { name: 'hardware_equipment_desc', type: 'string', isOptional: true },
        { name: 'priority_id', type: 'number', isOptional: true },
        { name: 'priority_desc', type: 'string', isOptional: true },
        { name: 'service_type_id', type: 'number', isOptional: true },
        { name: 'service_type_desc', type: 'string', isOptional: true },
        { name: 'case_details', type: 'string' },
        { name: 'technician', type: 'string', isOptional: true },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'client', type: 'string', isOptional: true },
        { name: 'country_desc', type: 'string', isOptional: true },
        { name: 'department_desc', type: 'string', isOptional: true },
        { name: 'sync_status', type: 'string', isIndexed: true },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'comments',
      columns: [
        { name: 'server_id', type: 'number', isOptional: true },
        { name: 'case_id', type: 'string', isIndexed: true },
        { name: 'case_server_id', type: 'number', isOptional: true },
        { name: 'body', type: 'string' },
        { name: 'creation_date', type: 'number', isIndexed: true },
        { name: 'author_name', type: 'string' },
        { name: 'author_role', type: 'string', isOptional: true },
        { name: 'is_private', type: 'boolean' },
        { name: 'status_case_id', type: 'number', isOptional: true },
        { name: 'status_desc', type: 'string', isOptional: true },
        { name: 'has_attachment', type: 'boolean' },
        { name: 'sync_status', type: 'string', isIndexed: true },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'pending_operations',
      columns: [
        { name: 'entity_type', type: 'string', isIndexed: true },
        { name: 'entity_id', type: 'string' },
        { name: 'operation', type: 'string' },
        { name: 'payload', type: 'string' }, // JSON serializado
        { name: 'retry_count', type: 'number' },
        { name: 'next_attempt_at', type: 'number', isIndexed: true },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'sync_meta',
      columns: [
        { name: 'table_name', type: 'string', isIndexed: true },
        { name: 'last_pulled_at', type: 'number', isOptional: true },
      ],
    }),
  ],
});
