# ARCHITECTURE.md — DOZZIER HelpDesk Mobile

> **Estado:** Aprobado (Fase 0)
> **Autor:** 🏛️ Arquitecto
> **Fecha:** 2026-06-02
> **Stack:** React Native + Expo + TypeScript (ver `STACK_DECISION.md`)

## 1. Principios

1. **Clean Architecture por capas:** Presentation → Domain → Data. Las dependencias apuntan **hacia adentro**; el dominio no conoce React, ni WatermelonDB, ni axios.
2. **Offline-first:** la fuente de verdad para lectura es la **BD local**. La red es un mecanismo de sincronización, no un prerequisito de uso.
3. **Inversión de dependencias:** la capa de dominio define **interfaces** (puertos); la capa de datos las **implementa** (adaptadores).
4. **Reemplazo de API = cambio de implementación, no de arquitectura.** La API real entra cambiando un data source, sin tocar dominio ni UI.

## 2. Diagrama de capas

```
┌──────────────────────────────────────────────────────────────┐
│ PRESENTATION                                                   │
│  screens/ (Home, List, Detail, NewCase, Login)                │
│  components/ (design-system)                                   │
│  navigation/  ·  hooks/  ·  stores (Zustand) · i18n           │
│         │ usa casos de uso, nunca repos directamente          │
└─────────┼────────────────────────────────────────────────────┘
          ▼
┌──────────────────────────────────────────────────────────────┐
│ DOMAIN  (puro TypeScript, sin dependencias de framework)      │
│  entities/      (Case, Comment, Attachment, catálogos)        │
│  repositories/  (INTERFACES: CaseRepository, AuthRepository…) │
│  usecases/      (CreateCase, ListCases, AddComment, Login…)   │
│  value-objects/ (CaseId #DZ-AAAA-NNNN, CaseStatus…)           │
└─────────┼────────────────────────────────────────────────────┘
          ▼  (implementa las interfaces del dominio)
┌──────────────────────────────────────────────────────────────┐
│ DATA                                                          │
│  repositories/   (implementaciones offline-first)            │
│  datasources/                                                │
│    local/   WatermelonDB (SQLCipher), modelos, migraciones   │
│    remote/  ApiClient (axios), DTOs, mappers                 │
│  sync/      SyncEngine, PendingOperation queue, conflict res. │
│  security/  SecureTokenStore, interceptors, pinning          │
└──────────────────────────────────────────────────────────────┘
          ▼
┌──────────────────────────────────────────────────────────────┐
│ INFRA / SERVICES (transversal)                               │
│  services/api/  (interfaz desacoplada de la API REST)        │
│  mock/ (MSW)  ·  logger  ·  config/env  ·  di/ (container)   │
└──────────────────────────────────────────────────────────────┘
```

## 3. Estructura de carpetas

```
dozzier-app/
├── docs/                      # Documentos Fase 0 + ADRs
│   └── adr/
├── src/
│   ├── presentation/
│   │   ├── screens/
│   │   │   ├── home/
│   │   │   ├── cases-list/
│   │   │   ├── case-detail/
│   │   │   ├── new-case/
│   │   │   └── login/
│   │   ├── navigation/        # RootNavigator, BottomTabs, FAB
│   │   ├── stores/            # Zustand: auth, syncStatus, ui
│   │   ├── hooks/
│   │   └── i18n/              # es/, en/
│   ├── design-system/         # tokens, theme, componentes atómicos
│   │   ├── tokens/            # colors, typography, spacing, radii…
│   │   ├── theme/
│   │   └── components/        # Button, Input, Select, Badge, Card…
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/      # interfaces (puertos)
│   │   └── usecases/
│   ├── data/
│   │   ├── repositories/      # implementaciones
│   │   ├── datasources/
│   │   │   ├── local/         # WatermelonDB: schema, models, migrations
│   │   │   └── remote/        # DTOs, mappers, endpoints
│   │   ├── sync/              # SyncEngine, queue, conflict resolution
│   │   └── security/          # token store, interceptors, pinning
│   ├── services/
│   │   └── api/               # ApiClient interface + axios impl
│   ├── core/
│   │   ├── di/                # contenedor de inyección de dependencias
│   │   ├── config/            # env, constantes
│   │   ├── logger/            # logging estructurado sin PII
│   │   └── errors/            # error boundary + tipos de error
│   └── mock/                  # MSW handlers + seed data
├── __tests__/                 # unit, component, integration
├── e2e/                       # Maestro/Detox happy path
├── coverage/                  # reporte de cobertura (generado)
├── .env.development | .staging | .production
└── app.config.ts              # Expo config + plugins
```

## 4. Flujo de datos offline-first

### Lectura (ej. listar casos)

```
Screen → useCases() hook → ListCasesUseCase
   → CaseRepository.observe()  [interfaz]
   → CaseRepositoryImpl
       → LocalDataSource (WatermelonDB)  ← FUENTE DE VERDAD para UI
   (en paralelo, si hay red)
       → SyncEngine refresca desde RemoteDataSource → escribe en local
       → la UI se re-renderiza reactivamente
```

La UI **siempre** lee de local; nunca espera a la red para mostrar datos.

### Escritura (ej. crear caso / comentario offline)

```
Screen → CreateCaseUseCase
   → CaseRepositoryImpl.create()
       1. Escribe en BD local (estado syncStatus = 'pending')
       2. Encola PendingOperation { type, payload, retryCount }
   → UI muestra el caso inmediatamente con badge "pendiente de sync"

Cuando vuelve la red (NetInfo):
   SyncEngine.drain()
       → por cada PendingOperation: llama RemoteDataSource
       → éxito  → marca registro 'synced', elimina de la cola
       → 401    → interceptor refresca token y reintenta
       → fallo  → reintento exponencial (backoff), incrementa retryCount
       → conflicto → resolución last-write-wins (ver DATA_MODEL.md)
```

## 5. Inyección de dependencias

Contenedor ligero en `src/core/di/`. Registra implementaciones contra interfaces del dominio. Los casos de uso reciben sus repositorios por constructor; los hooks de presentación resuelven casos de uso desde el contenedor. Esto permite **inyectar mocks en tests** sin tocar el código de producción.

```
container.register('CaseRepository', () => new CaseRepositoryImpl(local, remote, sync))
container.register('CreateCaseUseCase', () => new CreateCaseUseCase(container.get('CaseRepository')))
```

## 6. State management

| Tipo de estado               | Herramienta              | Ejemplos                                  |
| ---------------------------- | ------------------------ | ----------------------------------------- |
| Sesión / auth                | Zustand                  | usuario actual, estado de login           |
| Estado de sincronización     | Zustand                  | online/offline, nº operaciones pendientes |
| UI efímera                   | Zustand / local          | filtros activos, toasts                   |
| Datos de servidor (cache)    | React Query              | catálogos; orquesta refetch               |
| Datos persistentes reactivos | WatermelonDB observables | casos, comentarios                        |

## 7. Manejo de errores

- **Error boundary** global en Presentation (pantalla de fallback).
- Tipos de error de dominio (`NetworkError`, `AuthError`, `ValidationError`, `ConflictError`) en `core/errors`.
- Los casos de uso devuelven `Result<T, DomainError>` en vez de lanzar excepciones no controladas.
- El logger registra errores **sin PII** (ver `SECURITY.md`).

## 8. Capa de servicios API (desacoplada)

`src/services/api/` define una **interfaz** (`ApiClient`) con métodos por endpoint del prompt:

```
login, refresh, getCases, getCase, createCase, addComment, getClients, getCategories
```

Dos implementaciones intercambiables:

- **MSW** (mock, Fases 3–7).
- **AxiosApiClient** (API real del cliente, cuando llegue).

El cambio entre una y otra es una variable de entorno; ni dominio ni UI se enteran.

> **Mapeo a la BD real `BPMHelpDesk`:** los endpoints de catálogos resuelven contra los catálogos reales — `categories` → `EquipmentType`, más `module`, `environment`, `priority`, `serviceType`, `hardwareEquipment`, `subStatusCase`, `country`, `department`. `clients` → `DISTINCT Cases.Client` (no hay tabla de clientes). No existe tabla de usuarios/auth en la BD: `/auth/*` lo provee la API del cliente (mock en Fases 3–7). Ver `DATA_MODEL.md` §2 y §8.

## 9. ADRs (Architecture Decision Records)

Se registran en `docs/adr/`. Decisiones iniciales:

- **ADR-0001:** Stack React Native + Expo (ver `STACK_DECISION.md`).
- **ADR-0002:** Clean Architecture en 3 capas con inversión de dependencias.
- **ADR-0003:** Offline-first con BD local como fuente de verdad de lectura.
- **ADR-0004:** Resolución de conflictos last-write-wins (ver `DATA_MODEL.md`).
- **ADR-0005:** MSW como mock server intercambiable por la API real.

> Los ADRs detallados se crean como archivos individuales en la Fase 1.
