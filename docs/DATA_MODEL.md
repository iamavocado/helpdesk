# DATA_MODEL.md — DOZZIER HelpDesk Mobile

> **Estado:** Aprobado (Fase 0) — **alineado al esquema real `BPMHelpDesk` (SQL Server)**
> **Autor:** 🗄️ DBA / Data Engineer
> **Fecha:** 2026-06-02
> **Motor local:** WatermelonDB sobre SQLite + SQLCipher (cifrado en reposo)
> **Fuente:** `Script_Data_Estructura_BPMHelpDesk.sql` (estructura + datos del aplicativo actual)

## 1. Origen del modelo

El modelo local se deriva del **esquema real de producción** `BPMHelpDesk`, no del prototipo HTML. El prototipo se usa solo para el diseño visual. Donde prototipo y BD difieren, **manda la BD** y las decisiones tomadas en Fase 0 (ver §10).

## 2. Esquema real del servidor (resumen)

Dos esquemas SQL Server: `Catalogs` (maestros) y `Desk` (transaccional).

### Tablas transaccionales (`Desk`)

| Tabla                      | Filas | PK                             | Notas                                                              |
| -------------------------- | ----- | ------------------------------ | ------------------------------------------------------------------ |
| `Desk.Cases`               | 953   | `Id` INT **IDENTITY**          | Diseño **desnormalizado**: guarda `*Id` + `*Desc` de cada catálogo |
| `Desk.CasesComments`       | 3.886 | **compuesta** (`Id`, `IdCase`) | `Id` es secuencial **por caso**, no global. Tiene `IsPrivate`      |
| `Desk.CasesCommentsAttach` | 1.136 | `Id`                           | Adjuntos; FK (`IdCaseComment`,`IdCase`)                            |

### Catálogos (`Catalogs`)

| Catálogo                                  | Valores reales                                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ClassificationStatusCase`                | **3**: 1 Pendiente · 2 Cola · 3 Cerrado                                                               |
| `StatusCase` (PK `IdClassification`,`Id`) | 6: En espera resp. soporte · Devolver a cola · Resuelto · Cerrado · En espera AIG · En espera cliente |
| `SubStatusCase`                           | 2: A Tiempo · Tardío                                                                                  |
| `EquipmentType`                           | 5: Hardware · Software · Sala de Audiencia · Capacitación · Otro                                      |
| `Environment`                             | 4: Capacitación · Pre Producción · Producción · Pruebas                                               |
| `Module`                                  | 14: Actuaciones · Defensa Pública · Programación de Audiencia · … (dominio judicial)                  |
| `HardwareEquipment`                       | 11: Teclado · Micrófono · Consola · Monitor · …                                                       |
| `Priority`                                | 3: Baja (8h) · Media (3h) · Alta (1h) — con `HoursToClose` (SLA)                                      |
| `ServiceType`                             | 9: Correctivo · Preventivo · Ajuste de datos · …                                                      |
| `Country`                                 | 247                                                                                                   |
| `Department`                              | 288 (PK compuesta `Id`,`IdCountry`; FK → Country)                                                     |

### Llaves foráneas relevantes (`Desk.Cases`)

- `EquipmentTypeId` → `EquipmentType.Id`
- `PriorityId` → `Priority.Id`
- `ServiceTypeId` → `ServiceType.Id`
- (`ClassificationCaseId`,`StatusCaseId`) → `StatusCase`(`IdClassification`,`Id`)
- `SubStatusCaseId` → `SubStatusCase.Id`
- `CasesComments.IdCase` → `Cases.Id`
- `CasesCommentsAttach`(`IdCaseComment`,`IdCase`) → `CasesComments`(`Id`,`IdCase`)

> **No existen** tablas de **usuarios/autenticación** ni de **clientes** ni de **categorías** separadas. El "cliente" es el campo de texto `Cases.Client` (ej. `'SPA'`, `'Organo Judicial (OJ)'`). La "categoría" es `EquipmentType`. La identidad del solicitante son campos de texto libre (`UserRequester`, `EmailRequester`, `ReportingUser`).

## 3. Estrategia: la BD local NO es un espejo 1:1

La BD del servidor tiene ~50 columnas en `Cases` y catálogos de cientos de filas (países). La app móvil persiste un **subconjunto** optimizado para offline + campos de sincronización. Aprovechamos el **diseño desnormalizado** (los `*Desc` ya vienen en `Cases`) para mostrar etiquetas sin joins remotos.

## 4. Esquema local (WatermelonDB)

> Convención local: snake_case. Toda tabla sincronizable lleva `server_id`, `sync_status`, `updated_at`, `deleted_at`. `server_id` mapea al `Id` (entero) del servidor.

### Tabla `cases` (← `Desk.Cases`)

| Columna local                   | Origen servidor                 | Tipo local             | Notas                                                      |
| ------------------------------- | ------------------------------- | ---------------------- | ---------------------------------------------------------- |
| id                              | —                               | string (UUID)          | PK local; permite crear offline antes de tener `server_id` |
| server_id                       | `Id` (INT IDENTITY)             | number nullable        | Identificador real; null hasta sincronizar                 |
| user_requester                  | `UserRequester`                 | string                 | Solicitante (texto)                                        |
| requester_email                 | `EmailRequester`                | string nullable        |                                                            |
| reporting_user                  | `ReportingUser`                 | string nullable        | Usuario que reporta                                        |
| reporting_user_email            | `ReportingUserEmail`            | string nullable        |                                                            |
| creation_date                   | `CreationDate`                  | number (epoch)         |                                                            |
| modification_date               | `ModificationDate`              | number (epoch)         | Reloj lógico LWW                                           |
| solution_date                   | `SolutionDate`                  | number nullable        |                                                            |
| classification_id               | `ClassificationCaseId`          | number                 | Agrupación de estado (UI) — ver §6                         |
| status_case_id                  | `StatusCaseId`                  | number                 | Subestado detallado                                        |
| status_case_desc                | `StatusCaseDesc`                | string                 | Desnormalizado para render                                 |
| sub_status_id                   | `SubStatusCaseId`               | number nullable        | A Tiempo / Tardío                                          |
| equipment_type_id               | `EquipmentTypeId`               | number                 | **Categoría**                                              |
| equipment_type_desc             | `EquipmentTypeDesc`             | string                 |                                                            |
| software_module_id              | `SoftwareModuleId`              | number nullable        | Solo Software                                              |
| software_module_desc            | `SoftwareModuleDesc`            | string nullable        |                                                            |
| software_environment_id         | `SoftwareEnvironmentId`         | number nullable        | Solo Software                                              |
| software_environment_desc       | `SoftwareEnvironmentDesc`       | string nullable        |                                                            |
| hardware_equipment_id           | `HardwareEquipmentId`           | number nullable        | Solo Hardware                                              |
| hardware_equipment_desc         | `HardwareEquipmentDesc`         | string nullable        |                                                            |
| priority_id                     | `PriorityId`                    | number nullable        |                                                            |
| priority_desc                   | `PriorityDesc`                  | string nullable        |                                                            |
| service_type_id                 | `ServiceTypeId`                 | number nullable        |                                                            |
| service_type_desc               | `ServiceTypeDesc`               | string nullable        |                                                            |
| case_details                    | `CaseDetails`                   | text                   | **Descripción** (no hay "asunto" en BD)                    |
| technician                      | `Technician`                    | string nullable        |                                                            |
| serial                          | `Serial`                        | string nullable        |                                                            |
| location                        | `Location`                      | string nullable        |                                                            |
| position_requester              | `PositionRequester`             | string nullable        |                                                            |
| department_requester            | `DepartmentRequester`           | string nullable        |                                                            |
| country_id / country_desc       | `CountryId`/`CountryDesc`       | number/string nullable |                                                            |
| department_id / department_desc | `DepartmentId`/`DepartmentDesc` | number/string nullable |                                                            |
| client                          | `Client`                        | string nullable        | Texto libre (no catálogo)                                  |
| sub_department                  | `SubDepartment`                 | string nullable        |                                                            |
| id_case_client                  | `IdCaseClient`                  | number nullable        |                                                            |
| sync_status                     | —                               | string enum            | `synced` \| `pending` \| `error` (solo local)              |
| deleted_at                      | —                               | number nullable        | soft delete (solo local)                                   |

**Campos del servidor omitidos en local** (no usados por la app móvil): banderas de StoreRoom (`StoreRoom_*`), `TechnicianNotificationSent`, `TechnicianFirstAssign`. Se documentan aquí para trazabilidad; si la API los expone, se ignoran en el mapeo.

**Índices locales:** `classification_id`, `status_case_id`, `equipment_type_id`, `creation_date`, `sync_status`, `server_id`.

### Tabla `comments` (← `Desk.CasesComments`)

| Columna local     | Origen                 | Tipo                    | Notas                                                            |
| ----------------- | ---------------------- | ----------------------- | ---------------------------------------------------------------- |
| id                | —                      | string (UUID)           | PK local                                                         |
| server_id         | `Id`                   | number nullable         | **Secuencial por caso** en el servidor (PK compuesta con IdCase) |
| case_id           | —                      | string (FK→cases.id)    | Relación local                                                   |
| case_server_id    | `IdCase`               | number nullable         | Para reconstruir la PK compuesta al sincronizar                  |
| body              | `Comment`              | text                    |                                                                  |
| creation_date     | `CreationDate`         | number (epoch)          |                                                                  |
| status_case_id    | `StatusCaseId`         | number nullable         | El comentario puede cambiar el estado                            |
| status_desc       | `StatusDesc`           | string nullable         |                                                                  |
| classification_id | `ClassificationCaseId` | number nullable         |                                                                  |
| sub_status_id     | `SubStatusCaseId`      | number nullable         |                                                                  |
| user_requester    | `UserRequester`        | string                  | Autor (texto)                                                    |
| is_private        | `IsPrivate`            | boolean                 | Comentario privado (estilo amarillo)                             |
| has_attachment    | `AttachedFile`         | boolean/string nullable |                                                                  |
| sync_status       | —                      | string enum             | solo local                                                       |
| deleted_at        | —                      | number nullable         | solo local                                                       |

**Índices:** `case_id`, `creation_date`, `sync_status`.

### Tabla `comment_attachments` (← `Desk.CasesCommentsAttach`)

| Columna           | Origen          | Notas                          |
| ----------------- | --------------- | ------------------------------ |
| id                | —               | UUID local                     |
| server_id         | `Id`            | nullable                       |
| comment_id        | —               | FK→comments.id                 |
| comment_server_id | `IdCaseComment` | parte de PK compuesta remota   |
| case_server_id    | `IdCase`        | parte de PK compuesta remota   |
| file_ref          | `AttachedFile`  | ruta/identificador del archivo |

### Catálogos locales (cacheados, solo lectura)

Una tabla local por catálogo, sincronizada en el pull: `classification_status`, `status_case`, `sub_status_case`, `equipment_type`, `environment`, `module`, `hardware_equipment`, `priority`, `service_type`, `country`, `department`. Estructura común: `id`, `description`, `enable` (+ campos propios como `hours_to_close` en priority, `id_country` en department).

> **"Clientes":** como no hay catálogo, la lista de clientes para el formulario se obtiene de `SELECT DISTINCT Client FROM Cases` (lo expondrá el endpoint `/catalogs/clients` del mock / API).

### Tablas exclusivas locales (offline)

- `pending_operations` — cola FIFO de sincronización: `id`, `entity_type` (`case`|`comment`), `entity_id`, `operation` (`create`|`update`), `payload` (JSON), `retry_count`, `next_attempt_at`, `last_error`, `created_at`.
- `sync_meta` — `id` (nombre de tabla), `last_pulled_at`.

## 5. Mapeo de tipos SQL Server → local

| SQL Server                     | Local (WatermelonDB) | Nota                                     |
| ------------------------------ | -------------------- | ---------------------------------------- |
| `int` / `int IDENTITY`         | number               | IDs                                      |
| `varchar(n)` / `nvarchar(max)` | string / text        |                                          |
| `bit`                          | boolean              | `IsPrivate`, `Enable`                    |
| `datetime`                     | number (epoch ms)    | Se serializa ISO-8601 en los DTOs de API |

## 6. Modelo de estados (decisión Fase 0)

La UI se organiza por las **3 clasificaciones reales** (`ClassificationStatusCase`):

| Clasificación | Color (design tokens) |
| ------------- | --------------------- |
| Pendiente     | naranja `#f0934a`     |
| Cola          | rojo `#e53935`        |
| Cerrado       | gris `#6c757d`        |

- El **subestado detallado** (`StatusCase`, ej. "Resuelto", "En espera de respuesta cliente") se muestra como **badge/etiqueta** en el detalle y como filtro secundario, pero **no** es una de las tarjetas principales del dashboard.
- ⚠️ **Punto abierto a validar con la API real:** en los datos, `Cases.ClassificationCaseId` toma valores (p. ej. 6) que no mapean directamente a las 3 filas de `ClassificationStatusCase`, y `StatusCase.IdClassification` es 1:1 con su `Id`. La regla exacta de agrupación estado→clasificación debe confirmarse contra el contrato de la API. Para el **mock** se definirá un mapeo determinista documentado.

## 7. Identificador y título del caso (decisión Fase 0)

- **Identificador:** se muestra el **entero real** (`server_id`), p. ej. `Caso #28`. Se descarta el formato `#DZ-AAAA-NNNN` del prototipo (no existe en la BD). Para casos creados **offline** sin `server_id`, se muestra un marcador "pendiente de número" hasta sincronizar.
- **Título de lista (no hay "asunto" en BD):** se compone como **`EquipmentTypeDesc` + (`SoftwareModuleDesc` | `HardwareEquipmentDesc` | `ServiceTypeDesc`)**; `CaseDetails` se muestra como cuerpo en el detalle.

## 8. Autenticación (sin tabla de usuarios en la BD)

El script no incluye usuarios ni credenciales. **Supuesto Fase 0:** la autenticación JWT la provee la API del cliente (endpoints `/auth/login`, `/auth/refresh`). La identidad del usuario autenticado se obtiene del token; los campos `UserRequester`/`EmailRequester` del caso se rellenan a partir de esa identidad. El **mock** simulará login/refresh. Detalles en `SECURITY.md`.

## 9. Sincronización

### Pull (servidor → local)

- Tras login y al recuperar red, pull incremental por `ModificationDate` (cuando la API lo soporte; con el mock, paginado completo).
- Upsert por `server_id`.

### Push (local → servidor) — cola FIFO

1. Escritura offline → fila en `pending_operations` + entidad `sync_status='pending'`.
2. `SyncEngine.drain()` procesa en orden, respetando dependencias (un `comment` no se envía hasta que su `case` tenga `server_id`; lo mismo para `comment_attachments`).
3. Por operación: éxito → asigna `server_id`, marca `synced`; `401` → refresh + reintento; `5xx`/red → backoff; `409` → resolución (§11).

### Backoff exponencial

```
delay = min(BASE * 2^retry_count, MAX) ± jitter
BASE = 2 s · MAX = 5 min · jitter = ±20% · MAX_RETRIES = 8 → estado 'error'
```

## 10. Diferencias prototipo ↔ BD (resueltas en Fase 0)

| Tema          | Prototipo          | BD real                        | Decisión                                |
| ------------- | ------------------ | ------------------------------ | --------------------------------------- |
| ID de caso    | `#DZ-2026-0341`    | entero IDENTITY                | Mostrar entero (`Caso #28`)             |
| Asunto        | campo separado     | no existe (solo `CaseDetails`) | Título = Categoría + Módulo/Servicio    |
| Estados       | 4 (incl. Resuelto) | 3 clasificaciones              | Usar las 3 reales; subestado como badge |
| Categoría     | 3                  | `EquipmentType` (5)            | Usar las 5 reales                       |
| Cliente       | catálogo           | texto `Client`                 | `DISTINCT` para el dropdown             |
| Usuarios/Auth | tabla users        | no existe                      | Auth vía API/JWT (mock)                 |
| Módulos       | ventas/inventario  | dominio judicial (14)          | Usar los reales                         |

## 11. Resolución de conflictos — Last-Write-Wins (LWW)

- Reloj lógico = `modification_date` (cases) / `creation_date` (comments).
- **Comentarios y adjuntos son append-only** (inmutables) → no generan conflicto; solo se insertan.
- Para `cases`: LWW por `modification_date` (local > servidor gana local; si no, gana servidor).
- Riesgo aceptado documentado: edición concurrente del mismo caso puede perder cambios del lado más antiguo. Mitigado porque la edición offline de casos es mínima.

## 12. Cifrado en reposo

- SQLite cifrada con SQLCipher (AES-256); clave aleatoria (CSPRNG) en secure storage (Keychain/Keystore). Ver `SECURITY.md`.

## 13. Migraciones

- WatermelonDB `schemaVersion: 1` con las tablas de §4. Evolución por migraciones incrementales; nunca se recrea la BD en producción (se perdería trabajo offline no sincronizado).

## 14. Datos seed del mock (Fase 3)

- El mock sembrará un subconjunto realista derivado de `Script_Data_Estructura_BPMHelpDesk.sql`: **≥ 50 casos** repartidos en las 3 clasificaciones, con comentarios (incluyendo privados, `IsPrivate=1`), catálogos reales y clientes (`DISTINCT Client`). Coherente con los datos de producción (ej. cliente `SPA` / `Organo Judicial (OJ)`, módulos judiciales).

```

```
