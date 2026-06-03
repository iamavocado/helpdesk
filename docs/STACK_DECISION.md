# STACK_DECISION.md — DOZZIER HelpDesk Mobile

> **Estado:** Aprobado (Fase 0)
> **Autor:** 🏛️ Arquitecto
> **Fecha:** 2026-06-02

## 1. Decisión

Se construirá la app con **React Native + Expo (workflow con Dev Client / Prebuild)** y **TypeScript en modo estricto**.

| Parámetro      | Valor objetivo                 |
| -------------- | ------------------------------ |
| Expo SDK       | 51 (RN 0.74)                   |
| React Native   | 0.74.x                         |
| Lenguaje       | TypeScript 5.x, `strict: true` |
| Android mínimo | API 24 (Android 7.0)           |
| iOS mínimo     | 14.0                           |

> Se usa **Expo Prebuild + Dev Client** (no Expo Go) porque necesitamos módulos nativos no incluidos en Go: SQLCipher (BD cifrada), certificate pinning y secure storage avanzado. Esto conserva la DX de Expo (EAS Build, OTA, config plugins) sin renunciar a código nativo.

## 2. Criterios de evaluación

Se evaluaron tres candidatos contra los seis criterios que exige el prompt maestro, más dos que el proyecto vuelve críticos (secure storage y fidelidad con el prototipo HTML).

Escala: ⭐ (1) a ⭐⭐⭐⭐⭐ (5).

| Criterio                                     | RN + Expo  | Flutter    | Kotlin Multiplatform |
| -------------------------------------------- | ---------- | ---------- | -------------------- |
| Madurez / estabilidad                        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐               |
| Soporte offline (BD local + cola)            | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐               |
| Biblioteca de UI / fidelidad al prototipo    | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐                 |
| Comunidad / ecosistema                       | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐               |
| Tiempo de build / DX                         | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐               |
| Tamaño del binario                           | ⭐⭐⭐     | ⭐⭐⭐     | ⭐⭐⭐⭐⭐           |
| Secure storage (Keychain/Keystore) + pinning | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐             |
| Fit con el equipo / mantenibilidad           | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | ⭐⭐⭐               |

### Notas por criterio

- **Madurez:** RN y Flutter son ambos production-grade. KMP es estable en lógica compartida, pero la capa de UI (Compose Multiplatform para iOS) todavía es joven para producción.
- **Offline:** RN tiene WatermelonDB y `op-sqlite`/`expo-sqlite` con SQLCipher. Flutter tiene Drift + sqlcipher. Empate técnico.
- **UI / prototipo:** El prototipo es HTML/CSS plano (flexbox, border-radius, gradientes, fuentes Google). Se traduce 1:1 a estilos RN. Flutter daría aún mayor control de píxel, pero la diferencia no justifica el cambio de lenguaje.
- **Secure storage + pinning:** `expo-secure-store` envuelve Keychain (iOS) y Keystore/EncryptedSharedPreferences (Android) de forma directa; el pinning se configura con un config plugin sobre la capa nativa.
- **Tamaño de binario:** KMP gana (binario nativo puro). Para una demo de helpdesk no es un factor decisivo.

## 3. Justificación de la elección

1. **Un solo lenguaje (TypeScript) en toda la pila** — UI, dominio, servicios, mock server (MSW también en TS) y tests. Reduce fricción y acelera la entrega de la demo.
2. **Ecosistema offline-first más probado** para el patrón exacto que pide el prompt (BD local + cola de operaciones + reintento + indicador de sync).
3. **Secure storage nativo de primera clase** sin escribir puentes propios — requisito no negociable de seguridad.
4. **EAS Build** resuelve la Fase 8 (builds firmados `.apk` / `.ipa simulator`) sin infraestructura local de Xcode/Android Studio compleja.
5. **El prototipo es web** — la traducción mental web→RN es directa para el equipo.

### ¿Por qué no Flutter?

Técnicamente empata o supera a RN en varios criterios, pero introduce un segundo lenguaje (Dart) sin ventaja decisiva para este alcance, y el pinning/secure storage requiere algo más de plomería. Se mantiene como **alternativa de respaldo documentada** si más adelante el rendimiento de UI se vuelve crítico.

### ¿Por qué no KMP?

La lógica compartida sería excelente, pero obliga a mantener **dos UIs nativas** (SwiftUI + Compose) o adoptar Compose Multiplatform (inmaduro en iOS). Multiplica el esfuerzo de las Fases 2 y 5 sin beneficio para una demo.

## 4. Librerías clave seleccionadas

| Área              | Librería                                              | Motivo                                                                                |
| ----------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Navegación        | `@react-navigation/native` (stack + bottom-tabs)      | Estándar de facto; soporta el bottom-nav + FAB                                        |
| Estado            | **Zustand** + React Query (`@tanstack/react-query`)   | Zustand para estado de UI/sesión; React Query para cache de servidor y sincronización |
| BD local          | **WatermelonDB** sobre SQLite (con SQLCipher)         | Reactiva, pensada para offline-first y sync; índices y migraciones                    |
| Cifrado BD        | SQLCipher vía adaptador nativo                        | Cifrado en reposo (requisito de seguridad)                                            |
| Secure storage    | `expo-secure-store`                                   | Keychain / Keystore para tokens JWT                                                   |
| HTTP              | `axios` + interceptores                               | Manejo central de 401 → refresh → reintento                                           |
| Cert pinning      | config plugin + `react-native-ssl-pinning` (o nativo) | HTTPS con pinning configurable                                                        |
| Conectividad      | `@react-native-community/netinfo`                     | Detector de red para drenar la cola                                                   |
| i18n              | `i18next` + `react-i18next`                           | Español base, inglés preparado                                                        |
| Formularios       | `react-hook-form` + `zod`                             | Validación y sanitización declarativa                                                 |
| Mock server       | **MSW** (Mock Service Worker)                         | Intercepta a nivel de red; cero servidor aparte; se apaga al conectar API real        |
| Testing unit/comp | **Jest** + **React Native Testing Library**           | Estándar; coverage integrado                                                          |
| Testing E2E       | **Maestro** (o Detox)                                 | Happy path login→caso→lista→comentario                                                |
| Lint/format       | ESLint + Prettier                                     | Calidad de código                                                                     |
| Hooks             | Husky + lint-staged                                   | Pre-commit                                                                            |
| Env               | `react-native-dotenv` / Expo env                      | `.env.development/.staging/.production`                                               |
| Logging           | logger propio sin PII (wrapper)                       | Logging estructurado, scrubbing de datos sensibles                                    |

## 5. Riesgos y mitigaciones

| Riesgo                                       | Mitigación                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| WatermelonDB tiene curva de aprendizaje      | Encapsular tras la capa de repositorios (Data); el dominio no la conoce  |
| SQLCipher requiere build nativo (no Expo Go) | Ya decidido Dev Client + Prebuild desde Fase 1                           |
| Certificate pinning rompe si rota el cert    | Pinning **configurable** por entorno; documentar rotación en SECURITY.md |
| Diferencias iOS/Android en secure storage    | `expo-secure-store` abstrae; tests en ambas plataformas en Fase 7        |

## 6. Alternativa de respaldo

Si en revisión se prioriza fidelidad de UI/rendimiento sobre velocidad de entrega: **Flutter 3.x + Drift + flutter_secure_storage + Riverpod**. La arquitectura por capas (ver `ARCHITECTURE.md`) es portable: solo cambia la implementación, no el diseño.
