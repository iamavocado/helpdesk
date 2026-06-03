# PROMPT MAESTRO — DOZZIER HelpDesk Mobile

> Copia y pega este prompt completo en Claude Code para iniciar el proyecto.
> El prototipo HTML de referencia está en el archivo adjunto `dozzier-mobile.html`.

---

## 🎯 CONTEXTO DEL PROYECTO

Vas a construir **DOZZIER HelpDesk Mobile**, una aplicación móvil nativa para gestión de tickets de soporte (helpdesk) que reemplaza el flujo web actual con una experiencia optimizada para dispositivos móviles.

**Cliente:** ITA S.A.
**Producto:** DOZZIER (sistema interno de helpdesk)
**Usuario objetivo:** Personal técnico y solicitantes de soporte que necesitan reportar, consultar y dar seguimiento a casos desde cualquier lugar.

### Referencia visual obligatoria

Tomarás como **única fuente de verdad para el diseño visual** el archivo adjunto `dozzier-mobile.html`. Este es el prototipo aprobado por el cliente y debes respetar:

- Paleta de colores: azul marino `#1e2a3a`, teal `#2d9b8f` / `#3eb5a7`
- Estados con colores oficiales: Pendiente (naranja `#f0934a`), En Cola (rojo `#e53935`), Resuelto (verde `#7cb342`), Cerrado (gris `#6c757d`)
- Tipografía: Inter Tight para UI, Fraunces serif para títulos
- Identidad DOZZIER (logo + nomenclatura `#DZ-AAAA-NNNN`)
- Las 5 pantallas: Home (dashboard 2x2), Lista filtrable, Detalle con conversación, Nuevo caso (formulario por secciones), Comentarios
- Bottom navigation con FAB central

---

## 🏗️ REQUISITOS TÉCNICOS NO NEGOCIABLES

### 1. Multiplataforma real

- Debe correr en **Android (mín. API 24 / Android 7.0)** e **iOS (mín. 14.0)**
- **Tú eliges el stack óptimo** entre React Native + Expo, Flutter, o Kotlin Multiplatform. Justifica tu elección en un documento `STACK_DECISION.md` antes de escribir código (criterios: madurez, soporte offline, biblioteca de UI, comunidad, tiempo de build, tamaño del binario).

### 2. Funcionamiento offline-first

- Toda la app debe ser **usable sin conexión**. El usuario debe poder:
  - Consultar sus casos previamente sincronizados
  - Crear nuevos casos que se encolan localmente
  - Agregar comentarios offline que se sincronizan al recuperar red
- Implementar:
  - Base de datos local (SQLite/WatermelonDB/Drift según stack)
  - Cola de operaciones pendientes con reintento exponencial
  - Indicador visual claro de estado de sincronización
  - Resolución de conflictos last-write-wins documentada

### 3. Seguridad (nivel básico, profesional)

- Autenticación con **JWT** (access + refresh token)
- **Almacenamiento seguro de tokens** usando Keychain (iOS) / EncryptedSharedPreferences o Keystore (Android). NUNCA AsyncStorage en claro.
- **HTTPS obligatorio** con certificate pinning configurable
- Logout automático por inactividad (30 min configurable)
- Sanitización de inputs en cliente
- No loguear datos sensibles (tokens, emails, contenido de casos)
- Cifrado de la base de datos local en reposo

### 4. API externa

- La API REST será proporcionada por el cliente más adelante.
- Diseña una **capa de servicios desacoplada** (`/src/services/api/`) con interfaces claras para que conectar la API real sea cambio de implementación, no de arquitectura.
- Mientras tanto, usa un **mock server local** (json-server, MSW o equivalente) con los siguientes endpoints simulados:
  ```
  POST   /auth/login
  POST   /auth/refresh
  GET    /cases?status=&page=
  GET    /cases/:id
  POST   /cases
  POST   /cases/:id/comments
  GET    /catalogs/clients
  GET    /catalogs/categories
  ```

### 5. Buenas prácticas de desarrollo

- Arquitectura limpia por capas: **Presentation → Domain → Data**
- Inyección de dependencias
- State management profesional (Redux Toolkit / Zustand / Riverpod / Bloc según stack)
- TypeScript estricto (si RN) o null-safety estricto (si Flutter)
- Linter + formatter configurados (ESLint+Prettier / dart analyze)
- Pre-commit hooks con Husky o equivalente
- Variables de entorno por ambiente (`.env.development`, `.env.staging`, `.env.production`)
- Internacionalización lista (i18n) — empezar con español, dejar inglés preparado
- Accesibilidad básica: labels, contraste WCAG AA, tamaños de toque ≥44pt
- Logging estructurado (sin PII)
- Manejo de errores centralizado con boundary

### 6. Testing obligatorio

- **Tests unitarios** de lógica de negocio (mínimo 70% coverage en `/domain` y `/services`)
- **Tests de componentes** de las 5 pantallas principales
- **Tests de integración** del flujo offline → online
- **Tests E2E** del happy path (login → crear caso → ver lista → agregar comentario)
- Reporte de cobertura generado en `/coverage/`

---

## 👥 EQUIPO DE AGENTES ESPECIALIZADOS

Trabajarás como **orquestador de un equipo virtual**. Antes de cada fase activa, indica explícitamente qué agente está actuando con el formato:

```
🤖 [AGENTE: nombre] — fase X
```

### Agentes disponibles

| Agente                              | Responsabilidad                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| **🏛️ Arquitecto**                   | Decide stack, estructura de carpetas, capas, patrones, flujo de datos, ADRs       |
| **🎨 Diseñador UX/UI**              | Traduce el prototipo HTML a componentes nativos, design tokens, sistema de diseño |
| **🗄️ DBA / Data Engineer**          | Modela la BD local y el esquema de sincronización, índices, migraciones           |
| **🔐 Especialista en Seguridad**    | Define autenticación, almacenamiento seguro, pinning, auditoría OWASP MASVS       |
| **⚙️ Desarrollador Backend (mock)** | Construye y mantiene el mock server con datos realistas                           |
| **📱 Desarrollador Mobile**         | Implementa pantallas, navegación, integración con servicios                       |
| **🧪 QA / Tester**                  | Diseña casos de prueba, ejecuta suite, valida criterios de aceptación             |
| **🚀 DevOps**                       | CI/CD básica, scripts de build, configuración de ambientes                        |

**Regla:** ningún código se escribe sin que el agente correspondiente haya firmado su sección del plan.

---

## 📋 PLAN DE EJECUCIÓN POR FASES

Ejecuta las fases **en orden estricto**. Al final de cada fase, presenta un resumen y **espera confirmación antes de avanzar** a la siguiente.

### FASE 0 — Descubrimiento y decisiones

- 🤖 **Arquitecto** produce `STACK_DECISION.md` con la elección de tecnología justificada
- 🤖 **Arquitecto** produce `ARCHITECTURE.md` con diagrama de capas, módulos y flujo de datos
- 🤖 **DBA** produce `DATA_MODEL.md` con entidades, relaciones, estrategia de sincronización
- 🤖 **Seguridad** produce `SECURITY.md` con el threat model y controles aplicados
- 📦 Entregable: 4 documentos en `/docs/`

### FASE 1 — Andamiaje del proyecto

- Inicializar proyecto con el stack elegido
- Configurar linter, formatter, hooks, TypeScript/null-safety estricto
- Estructura de carpetas conforme a `ARCHITECTURE.md`
- Configurar i18n base
- Configurar variables de entorno
- Crear `README.md` con instrucciones de setup, build y test
- 📦 Entregable: proyecto que compila vacío en iOS y Android

### FASE 2 — Sistema de diseño

- 🤖 **Diseñador** extrae design tokens del HTML adjunto: colores, tipografías, espaciados, radios, sombras
- Crear `/src/design-system/` con: theme, tokens, componentes atómicos (Button, Input, Select, Badge, Card, Avatar, Chip)
- Storybook o catálogo navegable de componentes
- 📦 Entregable: galería de componentes funcionando

### FASE 3 — Capa de datos

- 🤖 **DBA** implementa esquema local con migraciones
- 🤖 **Backend mock** levanta el mock server con datos seed realistas (mín. 50 casos en distintos estados)
- 🤖 **Desarrollador Mobile** crea capa de repositorios con patrón offline-first
- Cola de operaciones pendientes con persistencia
- 📦 Entregable: tests de repositorios pasando, mock server documentado

### FASE 4 — Autenticación y seguridad

- 🤖 **Seguridad** implementa login JWT, refresh automático, almacenamiento seguro
- Pantalla de login con validaciones
- Interceptor HTTP con manejo de 401 → refresh → reintento
- Logout por inactividad
- 📦 Entregable: flujo de login completo + tests de seguridad

### FASE 5 — Pantallas principales

Implementar **una pantalla a la vez**, cada una con sus tests, antes de pasar a la siguiente:

1. **Home (dashboard)** — 4 tarjetas de estado + casos recientes + CTA
2. **Lista de casos** — con filtros por estado, paginación, pull-to-refresh
3. **Detalle del caso** — info + conversación
4. **Nuevo caso** — formulario por secciones, validación, campos condicionales por categoría
5. **Agregar comentario** — desde el detalle, con flag privado

Cada pantalla debe respetar **píxel a píxel** el prototipo HTML.

### FASE 6 — Sincronización offline ↔ online

- Detector de conectividad
- Worker/Service que drena la cola al recuperar red
- Indicador visual global de estado de sync
- Pantalla de "operaciones pendientes" para que el usuario vea qué falta enviar
- 📦 Entregable: video corto demostrando: avión modo on → crear caso → avión modo off → ver caso sincronizado

### FASE 7 — Testing integral

- 🤖 **QA** ejecuta la suite completa
- Coverage report
- Pruebas manuales en al menos 1 dispositivo Android real y 1 iPhone (o emuladores físicos si no hay hardware)
- Checklist de accesibilidad
- Auditoría rápida con `npm audit` / `pub outdated`
- 📦 Entregable: `TEST_REPORT.md` con resultados y bugs encontrados

### FASE 8 — Empaquetado demo

- Builds firmados de debug para Android (.apk) e iOS (.ipa simulator build)
- Instrucciones para que el cliente lo instale
- Credenciales demo
- 📦 Entregable: artefactos descargables + `DEMO_GUIDE.md`

---

## 🔒 DISCIPLINA DE CAMBIOS (REGLA CRÍTICA)

Cuando reciba solicitudes de modificación en iteraciones futuras, **debes**:

1. **Identificar quirúrgicamente** el archivo o función afectados.
2. **NO refactorizar** código colateral aunque te parezca mejorable.
3. **NO cambiar estilos, nombres, estructura, dependencias** fuera del scope del cambio pedido.
4. **NO actualizar versiones de paquetes** salvo que el cambio lo exija explícitamente.
5. **Diff mínimo:** la PR ideal toca el menor número de líneas posible.
6. **Si detectas un problema fuera del scope**, lo reportas como TODO en una sección al final de tu respuesta llamada `## 🔎 Observaciones (fuera de scope)`, pero **no lo tocas**.
7. **Antes de aplicar el cambio**, muestra:
   - Qué archivo/s vas a modificar
   - Qué líneas
   - Por qué ese cambio resuelve la petición
     Y espera confirmación si el cambio afecta más de 1 archivo.

---

## ✅ CRITERIOS DE ACEPTACIÓN FINAL

Antes de entregar el código final, **debes verificar y reportar uno por uno**:

- [ ] La app compila y corre en Android sin warnings críticos
- [ ] La app compila y corre en iOS sin warnings críticos
- [ ] Las 5 pantallas coinciden visualmente con el prototipo HTML
- [ ] Login funciona y maneja errores correctamente
- [ ] Tokens se guardan cifrados (mostrar prueba)
- [ ] Modo avión: la app sigue navegable y permite crear casos
- [ ] Al volver online: la cola se drena automáticamente
- [ ] Tests unitarios pasan (mostrar reporte de cobertura)
- [ ] Tests E2E del happy path pasan
- [ ] No hay credenciales hardcodeadas
- [ ] No hay `console.log`/`print` con datos sensibles
- [ ] README permite a un dev nuevo correr el proyecto en <15 min
- [ ] Existe `CHANGELOG.md`

---

## 📤 FORMATO DE ENTREGA POR FASE

Al cerrar cada fase, responde con esta plantilla:

```
## ✅ Fase X completada — [nombre]

### 🤖 Agentes que participaron
- [lista]

### 📦 Entregables
- archivo1.ext
- archivo2.ext

### 🧪 Pruebas ejecutadas
- [lista con resultado]

### ⚠️ Riesgos o pendientes
- [si aplica]

### ➡️ Próxima fase
Espero confirmación para iniciar la Fase X+1.
```

---

## 🚦 EMPIEZA AHORA

1. Lee este prompt completo.
2. Confirma que entiendes todos los requisitos repitiendo: **stack a elegir**, **plataformas**, **modo offline**, **seguridad JWT**, **disciplina de cambios**.
3. Adjunto el prototipo de referencia (`dozzier-mobile.html`). Léelo antes de empezar la Fase 0.
4. Inicia la **Fase 0 — Descubrimiento y decisiones**.

**No escribas código de producción hasta haber completado la Fase 0 y recibido mi confirmación.**
