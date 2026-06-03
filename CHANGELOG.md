# Changelog

Todos los cambios notables de DOZZIER HelpDesk Mobile se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto adopta [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Fase 3 — Capa de datos

- Capa de dominio: entidades (`Case`, `Comment`, `Catalogs`), value objects (clasificación de estados, `SyncStatus`, `Result`) e interfaces de repositorio (puertos).
- DTOs del servidor (reflejan `BPMHelpDesk`) + mappers DTO ↔ dominio.
- `LocalDataSource` (interfaz) + `InMemoryLocalDataSource` (implementación de trabajo/tests con upsert por `serverId`).
- Esquema WatermelonDB + migraciones (`schemaVersion 1`) como artefacto del DBA; su activación con SQLCipher queda para el build nativo.
- Cola de operaciones pendientes con backoff exponencial y `SyncEngine` que drena respetando dependencias (caso → comentario).
- Repositorios offline-first (`CaseRepositoryImpl`, `CommentRepositoryImpl`, `CatalogRepositoryImpl`): lectura local, escritura encolada, refresh tolerante a falta de red.
- Capa de servicios `ApiClient` desacoplada con `MockApiClient` (en proceso, seed realista ≥50 casos) y `HttpApiClient` (esqueleto para la API real).
- Mock con catálogos reales del `.sql` y seed determinista; documentado en `docs/MOCK_SERVER.md`.
- 36 tests (Jest) incl. flujo offline→online; cobertura `domain` 100% y `services` ~84%.
- Tooling: resolver de imports TypeScript para ESLint; `eqeqeq` permite `== null`.

### Fase 2 — Sistema de diseño

- Design tokens extraídos 1:1 del prototipo: colores (marca, estados, superficies), tipografía (Inter Tight + Fraunces), espaciado, radios y sombras (`src/design-system/tokens/`).
- Carga de fuentes Inter Tight y Fraunces vía `@expo-google-fonts` + `expo-font` (plugin añadido a `app.config.ts`).
- Tema único (`theme`) con `ThemeProvider`/`useTheme` (preparado para theming dinámico).
- Componentes atómicos: `Text`, `Button`, `Input`, `Select` (modal picker), `Badge`, `Card`, `Avatar`, `Chip` — con accesibilidad básica (roles, labels, toque ≥44pt).
- Catálogo navegable de componentes (`DesignSystemCatalog`) montado temporalmente en `App.tsx` para revisión visual.

### Fase 1 — Andamiaje del proyecto

- Inicialización del proyecto con Expo SDK 51, React Native 0.74 y TypeScript estricto.
- Configuración de ESLint (`eslint-config-expo`) + Prettier + reglas de seguridad (`no-console`).
- Husky + lint-staged para pre-commit.
- Estructura de carpetas por capas (Presentation → Domain → Data) conforme a `ARCHITECTURE.md`.
- Internacionalización (i18n) base con español e inglés (`i18next` + `react-i18next` + `expo-localization`).
- Variables de entorno por ambiente (`.env.development` / `.staging` / `.production`) inyectadas vía `app.config.ts` y leídas con tipado en `src/core/config/env.ts`.
- Alias de importación `@/*` → `src/*` (TypeScript + Babel).
- Configuración base de Jest (`jest-expo`) con umbrales de cobertura para `domain` y `services`.
- `README.md` con instrucciones de setup, build y test.

### Fase 0 — Descubrimiento y decisiones

- `docs/STACK_DECISION.md`: elección de React Native + Expo justificada.
- `docs/ARCHITECTURE.md`: arquitectura por capas, estructura, flujo offline-first, ADRs.
- `docs/DATA_MODEL.md`: modelo de datos alineado al esquema real `BPMHelpDesk` (SQL Server).
- `docs/SECURITY.md`: threat model, JWT, secure storage, pinning, mapeo OWASP MASVS.
