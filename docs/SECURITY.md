# SECURITY.md — DOZZIER HelpDesk Mobile

> **Estado:** Aprobado (Fase 0)
> **Autor:** 🔐 Especialista en Seguridad
> **Fecha:** 2026-06-02
> **Referencia:** OWASP MASVS (nivel L1 + controles seleccionados de L2)

## 1. Alcance

Seguridad de nivel **básico profesional** para una app móvil de helpdesk con datos internos del cliente (ITA S.A.). No se manejan datos de pago ni PII de alta sensibilidad, pero el contenido de los casos se considera **confidencial corporativo**.

## 2. Threat Model (STRIDE resumido)

| Amenaza                    | Vector                                    | Control aplicado                                                |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| **S**poofing               | Robo/uso de credenciales                  | JWT con expiración corta + refresh; logout por inactividad      |
| **T**ampering              | Modificación de tráfico (MITM)            | HTTPS obligatorio + **certificate pinning**                     |
| **R**epudiation            | Acción no atribuible                      | Comentarios con autor + timestamp; logs estructurados           |
| **I**nfo disclosure        | Lectura de tokens/datos en el dispositivo | Secure storage (Keychain/Keystore) + **BD cifrada (SQLCipher)** |
| **D**enial of Service      | Reintentos descontrolados                 | Backoff exponencial con tope (ver DATA_MODEL.md)                |
| **E**levation of privilege | Acceso a endpoints sin token válido       | Interceptor que adjunta y valida el access token; 401 → refresh |

### Activos a proteger

1. Tokens JWT (access + refresh).
2. Clave de cifrado de la BD local.
3. Contenido de casos y comentarios (incl. comentarios privados).
4. Credenciales de login en tránsito.

## 3. Autenticación (JWT)

> **Nota sobre el esquema real:** la BD `BPMHelpDesk` **no contiene tablas de usuarios ni credenciales**. La autenticación la provee la API del cliente; el mock simula `/auth/login` y `/auth/refresh`. La identidad del usuario (nombre/email del solicitante en los casos) se deriva del token JWT.

- **Flujo:** `POST /auth/login` → `{ accessToken, refreshToken }`.
- **Access token:** vida corta (config, ~15 min). Se adjunta como `Authorization: Bearer` en cada request vía interceptor.
- **Refresh token:** vida más larga (config, ~7 días). Solo se usa contra `POST /auth/refresh`.
- **Interceptor 401:** ante un `401`, se intenta **un** refresh; si tiene éxito, se reintenta la request original; si falla, se fuerza logout y se limpia secure storage.
- **Anti-bucle:** el refresh no se reintenta a sí mismo; un 401 en `/auth/refresh` → logout inmediato.

## 4. Almacenamiento seguro de tokens

| Plataforma | Mecanismo                                                           |
| ---------- | ------------------------------------------------------------------- |
| iOS        | **Keychain** (vía `expo-secure-store`)                              |
| Android    | **Keystore / EncryptedSharedPreferences** (vía `expo-secure-store`) |

- **Prohibido:** `AsyncStorage`, `localStorage`, archivos planos, o variables en memoria persistidas. Nunca tokens en claro.
- Los tokens **nunca** se escriben en la BD local ni en logs.
- Al logout (manual, por inactividad o por refresh fallido) → `SecureTokenStore.clear()`.

## 5. Cifrado de la base de datos local

- BD SQLite cifrada con **SQLCipher** (AES-256).
- **Clave de cifrado:** generada aleatoriamente en el primer arranque (CSPRNG), guardada en **secure storage**, nunca derivada de datos predecibles ni hardcodeada.
- Resultado: si el dispositivo es comprometido en reposo, los casos/comentarios offline no son legibles sin la clave del Keychain/Keystore.

## 6. Transporte (HTTPS + Certificate Pinning)

- **HTTPS obligatorio.** Tráfico HTTP plano bloqueado (ATS en iOS, `cleartextTrafficPermitted=false` en Android).
- **Certificate pinning configurable** por entorno (`.env.*`): se fija el hash de la clave pública (SPKI) del servidor.
- **Rotación:** se soportan **múltiples pines** (actual + siguiente) para permitir rotación de certificado sin romper la app. Procedimiento de rotación documentado aquí y aplicado en Fase 4.
- En **desarrollo** el pinning puede deshabilitarse por flag de entorno para usar el mock local; en **staging/production** es obligatorio.

## 7. Sesión e inactividad

- **Logout automático por inactividad:** temporizador configurable (default **30 min**). Cualquier interacción lo reinicia. Al expirar → limpiar secure storage + navegar a Login.
- Al pasar la app a segundo plano por tiempo prolongado, revalidar sesión al volver.

## 8. Validación y sanitización de inputs

- Validación en cliente con **zod** (longitudes, formato de email, campos requeridos del formulario de nuevo caso/comentario).
- Sanitización de texto libre (asunto, detalle, comentario) para neutralizar payloads de inyección antes de persistir/enviar.
- Los campos condicionales por categoría (ambiente/módulo/equipo) se validan según la categoría seleccionada.

## 9. Logging sin PII

- Logger estructurado propio (`core/logger`) con niveles.
- **Scrubbing obligatorio:** nunca se loguean tokens, contraseñas, emails, ni contenido de casos/comentarios.
- En `production` el nivel de log se reduce; los logs no se envían a terceros sin consentimiento.
- Prohibido `console.log`/`print` con datos sensibles (verificado en Fase 7, criterio de aceptación).

## 10. Gestión de secretos y configuración

- Sin credenciales hardcodeadas en el código (criterio de aceptación final).
- Configuración por entorno en `.env.development | .env.staging | .env.production` (no versionados; se versiona `.env.example`).
- Las claves de pinning y URLs de API viven en config de entorno, no en el binario en claro cuando sea evitable.

## 11. Mapeo OWASP MASVS (resumen)

| Control MASVS    | Cómo se cumple                                                                        |
| ---------------- | ------------------------------------------------------------------------------------- |
| MASVS-STORAGE    | Secure storage para tokens; SQLCipher para BD; sin PII en logs                        |
| MASVS-CRYPTO     | AES-256 (SQLCipher); clave en Keychain/Keystore; CSPRNG                               |
| MASVS-AUTH       | JWT access/refresh; logout por inactividad; manejo de 401                             |
| MASVS-NETWORK    | HTTPS forzado; certificate pinning configurable con rotación                          |
| MASVS-PLATFORM   | Permisos mínimos; ATS / cleartext bloqueado                                           |
| MASVS-CODE       | Validación de inputs; manejo central de errores; deps auditadas (`npm audit`, Fase 7) |
| MASVS-RESILIENCE | Pinning; no exponer secretos; ofuscación básica en release (opcional)                 |

## 12. Controles fuera de alcance (declarados)

Para esta demo NO se implementan (se documentan como mejoras futuras):

- Biometría (FaceID/Huella) para desbloqueo de app.
- Detección de root/jailbreak.
- Ofuscación avanzada / anti-tampering del binario.
- Rotación automática de claves de cifrado de BD.

## 13. Verificación (Fase 7)

- Prueba de que los tokens están cifrados (inspección de Keychain/Keystore, no AsyncStorage).
- Prueba de que la BD local no es legible sin clave.
- Revisión de ausencia de `console.log` con PII.
- `npm audit` sin vulnerabilidades críticas.
- Validación del flujo 401 → refresh → reintento → logout.
