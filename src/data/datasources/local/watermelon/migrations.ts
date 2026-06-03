import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

/**
 * Migraciones del esquema local. Versión inicial (1) sin migraciones previas.
 * Al evolucionar el esquema se añade aquí un bloque { toVersion, steps: [...] }
 * y se incrementa LOCAL_SCHEMA_VERSION en schema.ts.
 */
export const localMigrations = schemaMigrations({
  migrations: [],
});
