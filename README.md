# DOZZIER HelpDesk Mobile

App móvil **offline-first** de gestión de tickets de soporte (helpdesk) para **ITA S.A.**, construida con **React Native + Expo + TypeScript**. Reemplaza el flujo web de DOZZIER con una experiencia optimizada para Android e iOS.

> Estado: **Fase 1 — Andamiaje**. La app compila y arranca vacía. Sistema de diseño, datos, autenticación y pantallas llegan en fases posteriores.

## Stack

- **Expo SDK 54** (RN 0.81, React 19) + **TypeScript** estricto
- Android mín. **API 24** (7.0) · iOS mín. **14.0**
- Arquitectura limpia por capas: Presentation → Domain → Data (ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md))
- Decisiones de Fase 0 en [`docs/`](docs/): `STACK_DECISION.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `SECURITY.md`

## Requisitos previos

| Herramienta               | Versión                                         |
| ------------------------- | ----------------------------------------------- |
| Node.js                   | ≥ 20 (requerido por Expo SDK 54)                |
| npm                       | ≥ 9                                             |
| Expo CLI                  | vía `npx expo` (no requiere instalación global) |
| Android Studio (emulador) | para correr en Android                          |
| Xcode (solo macOS)        | para correr en iOS                              |

> Este proyecto usa **Expo Prebuild / Dev Client** (no Expo Go) porque incluirá módulos nativos (BD cifrada, secure storage, pinning) en fases posteriores.

## Puesta en marcha (< 15 min)

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno de desarrollo (ya incluido; o copiar la plantilla)
cp .env.example .env.development   # en Windows: copy .env.example .env.development

# 3. Verificar que tipa y lintea
npm run typecheck
npm run lint

# 4. Arrancar el bundler
npm start            # Dev Client
# o, para probar rápido en Expo Go (sin módulos nativos):
npm run start:go
```

### Correr en dispositivo / emulador

```bash
npm run android      # compila y ejecuta en Android (expo run:android)
npm run ios          # compila y ejecuta en iOS (solo macOS)
```

## Variables de entorno

La app selecciona el archivo `.env.<APP_ENV>` mediante la variable `APP_ENV` (default `development`). Los valores se inyectan vía `app.config.ts → extra` y se leen de forma tipada en [`src/core/config/env.ts`](src/core/config/env.ts).

```bash
APP_ENV=staging npm start
```

| Variable                     | Descripción                                |
| ---------------------------- | ------------------------------------------ |
| `APP_ENV`                    | `development` \| `staging` \| `production` |
| `API_BASE_URL`               | URL de la API REST (vacío ⇒ mock local)    |
| `USE_MOCK_API`               | Usar mock server (MSW)                     |
| `ENABLE_CERT_PINNING`        | Certificate pinning (true en staging/prod) |
| `INACTIVITY_TIMEOUT_MINUTES` | Logout por inactividad                     |

> Solo se versiona `.env.example`. Los `.env.*` reales están en `.gitignore`.

## Scripts

| Script                            | Acción                               |
| --------------------------------- | ------------------------------------ |
| `npm start`                       | Bundler con Dev Client               |
| `npm run android` / `ios`         | Build + run nativo                   |
| `npm run typecheck`               | `tsc --noEmit` (TypeScript estricto) |
| `npm run lint` / `lint:fix`       | ESLint (0 warnings permitidos)       |
| `npm run format` / `format:check` | Prettier                             |
| `npm test` / `test:coverage`      | Jest + cobertura                     |

## Estructura del proyecto

```
src/
├── presentation/   # screens, navigation, stores (Zustand), hooks, i18n
├── design-system/  # tokens, theme, componentes atómicos
├── domain/         # entities, value-objects, repositories (interfaces), usecases
├── data/           # repositories (impl), datasources (local/remote), sync, security
├── services/api/   # capa de API desacoplada
├── core/           # di, config, logger, errors
└── mock/           # MSW handlers + seed
```

## Calidad de código

- **TypeScript estricto** (`strict: true`, sin `any` implícito).
- **ESLint + Prettier** con `eslint-config-expo`.
- **Husky + lint-staged**: en cada commit se lintea y formatea el staged.

## Documentación

- [`docs/STACK_DECISION.md`](docs/STACK_DECISION.md) — por qué Expo
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — capas y flujo de datos
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — modelo alineado al backend real `BPMHelpDesk`
- [`docs/SECURITY.md`](docs/SECURITY.md) — JWT, secure storage, pinning, OWASP MASVS
- [`CHANGELOG.md`](CHANGELOG.md) — historial de cambios
