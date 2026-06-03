# Changelog

Todos los cambios notables de DOZZIER HelpDesk Mobile se documentan aquí.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto adopta [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

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
