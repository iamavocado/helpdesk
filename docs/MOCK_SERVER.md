# MOCK_SERVER.md — DOZZIER HelpDesk Mobile

> **Estado:** Fase 3
> **Autores:** ⚙️ Backend (mock) · 📱 Mobile

## 1. Qué es y por qué

La app necesita una fuente de datos mientras el cliente entrega la API REST real. El contrato está aislado tras la interfaz **`ApiClient`** (`src/services/api/api-client.ts`); existen dos implementaciones intercambiables:

| Implementación      | Uso                                                                           |
| ------------------- | ----------------------------------------------------------------------------- |
| **`MockApiClient`** | Mock en proceso, sembrado con datos realistas. Default en desarrollo y tests. |
| **`HttpApiClient`** | Cliente fetch contra la API real (se cablea con auth en Fase 4).              |

El cambio entre una y otra es configuración (`USE_MOCK_API`, `API_BASE_URL`), no arquitectura.

### Por qué `MockApiClient` y no MSW

`STACK_DECISION.md` previó **"MSW o equivalente"**. Se eligió un **mock en proceso** porque MSW tiene soporte frágil en el runtime de React Native (requiere polyfills de red y es inestable en dispositivo). `MockApiClient`:

- ofrece el **mismo desacople** (implementa `ApiClient`),
- corre en **dispositivo y en Jest** sin riesgo nativo,
- simula asignación de IDs del servidor, paginación, filtros y errores 404,
- es **100% testeable** (ver `__tests__/services/` y `__tests__/data/`).

## 2. Endpoints simulados (contrato `ApiClient`)

Mapea a los endpoints del prompt, alineados al esquema real `BPMHelpDesk`:

| Método `ApiClient`                           | Endpoint REST equivalente  | Descripción                                           |
| -------------------------------------------- | -------------------------- | ----------------------------------------------------- |
| `getCases({classificationId,page,pageSize})` | `GET /cases?status=&page=` | Lista paginada, filtrable por clasificación           |
| `getCase(serverId)`                          | `GET /cases/:id`           | Detalle de un caso (404 si no existe)                 |
| `createCase(dto)`                            | `POST /cases`              | Crea caso; asigna `Id` incremental y estado Pendiente |
| `getComments(caseServerId)`                  | `GET /cases/:id/comments`  | Comentarios del caso (orden ascendente)               |
| `addComment(dto)`                            | `POST /cases/:id/comments` | Agrega comentario; numera por caso                    |
| `getCatalogs()`                              | `GET /catalogs/*`          | Catálogos (categorías, módulos, etc.) + clientes      |

> Autenticación (`POST /auth/login`, `POST /auth/refresh`) se añade en la Fase 4.

## 3. Datos seed

Generados de forma **determinista** (PRNG con semilla fija) en `src/mock/seed.ts`:

- **60 casos** distribuidos en las 3 clasificaciones reales: **30 Pendiente, 15 Cola, 15 Cerrado** (≥50 requerido).
- **1–4 comentarios por caso**, algunos privados (`IsPrivate`).
- Categorías, módulos, ambientes, equipos, prioridades y tipos de servicio = **valores reales** extraídos de `Script_Data_Estructura_BPMHelpDesk.sql` (`src/mock/catalogs.ts`).
- Clientes: `SPA`, `Órgano Judicial (OJ)`, `Defensa Pública`, `Ministerio Público`.

## 4. Mapeo al modelo de datos

- DTOs del servidor en `src/data/datasources/remote/dto.ts` (PascalCase, reflejan columnas SQL).
- Mappers DTO ↔ dominio en `mappers.ts`.
- Detalles del esquema y decisiones (ID entero, título compuesto, 3 clasificaciones) en `DATA_MODEL.md`.

## 5. Conexión de la API real (futuro)

1. Implementar/usar `HttpApiClient` con `API_BASE_URL`.
2. Ajustar mappers si el contrato real difiere de los DTOs supuestos.
3. Poner `USE_MOCK_API=false` en `.env.staging` / `.env.production`.

No se toca el dominio, los repositorios ni la UI.
