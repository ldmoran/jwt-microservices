# JWT Microservices — Autenticación Stateless con RS256

**Universidad de las Fuerzas Armadas ESPE**  
Departamento de Ciencias de la Computación | Arquitectura de Seguridad Avanzada

---

## Arquitectura del Proyecto

```
jwt-microservices/
├── keys/                          # Par de llaves RSA (generadas por keypair.sh)
│   ├── private.pem                # Llave privada PKCS#8 — firma de tokens
│   └── public.pem                 # Llave pública    — verificación stateless
│
├── services/
│   └── jwt.service.js             # Capa criptográfica: signToken / verifyToken
│
├── middlewares/
│   └── auth.middleware.js         # Interceptor de autenticación Bearer JWT
│
├── controllers/
│   ├── auth.controller.js         # Lógica de login y emisión de tokens
│   └── services.controller.js     # Respuestas de los microservicios simulados
│
├── routes/
│   ├── auth.routes.js             # POST /auth/login
│   └── services.routes.js         # GET /v1/service-alpha|beta/private
│
├── server.js                      # Punto de entrada Express
├── keypair.sh                     # Script OpenSSL para generación de llaves
├── .env.example                   # Plantilla de variables de entorno
└── .gitignore                     # Excluye .env, keys/ y node_modules/
```

### Principio de Responsabilidad Única (SRP — SOLID)

Cada módulo tiene **una única razón para cambiar**:

| Módulo | Responsabilidad exclusiva |
|---|---|
| `jwt.service.js` | Operaciones criptográficas: firmar y verificar tokens |
| `auth.middleware.js` | Interceptar peticiones y validar la identidad del portador |
| `auth.controller.js` | Orquestar el flujo de login y emitir respuestas HTTP |
| `services.controller.js` | Responder con recursos protegidos de cada microservicio |
| `*.routes.js` | Mapear URLs a controladores con sus middlewares |
| `server.js` | Inicializar y conectar todos los módulos |

---

## Instalación y Ejecución

### 1. Instalar dependencias

```bash
npm install
```

### 2. Generar el par de llaves criptográficas (RS256)

```bash
chmod +x keypair.sh
./keypair.sh
```

Esto genera `keys/private.pem` y `keys/public.pem` usando OpenSSL con formato PKCS#8.

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

El `.env` ya apunta a las llaves en `./keys/`. No necesitas modificar nada.

### 4. Iniciar el servidor

```bash
npm start
# o para desarrollo con hot-reload:
npm run dev
```

---

## Pruebas con Postman / Insomnia

### Login — Obtener JWT

```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "ana@espe.edu.ec",
  "password": "password123"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Autenticación exitosa.",
  "algorithm": "RS256",
  "expiresIn": "60 segundos",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Acceder a Microservicio Alpha

```
GET http://localhost:3000/v1/service-alpha/private
Authorization: Bearer <pega_tu_token_aquí>
```

### Acceder a Microservicio Beta

```
GET http://localhost:3000/v1/service-beta/private
Authorization: Bearer <pega_tu_token_aquí>
```

### Simular token expirado

Espera 60 segundos y vuelve a usar el mismo token. Recibirás:

```json
{
  "error": "TOKEN_EXPIRED",
  "message": "El token JWT ha expirado. Solicita un nuevo token de acceso.",
  "expiredAt": "2026-06-18T..."
}
```

---

## Investigación Teórica: Integración de Refresh Tokens

### Pregunta 1: ¿Cómo solucionaría un Refresh Token la experiencia del usuario sin comprometer la seguridad?

Los JWT de corta duración (1 minuto en esta práctica) representan una decisión de seguridad deliberada: si un **Access Token** es interceptado, su ventana de explotación es mínima. Sin embargo, obligar al usuario a autenticarse con credenciales cada 60 segundos es una experiencia completamente inviable en producción.

El **Refresh Token** resuelve esta tensión mediante una separación de responsabilidades entre dos tipos de tokens con ciclos de vida distintos:

| Característica | Access Token | Refresh Token |
|---|---|---|
| Duración | Corta (1–15 min) | Larga (7–30 días) |
| Contenido | Claims de identidad | Referencia opaca al servidor |
| Uso | Cada request a microservicios | Solo para renovar Access Tokens |
| Almacenamiento | Memoria del cliente | Cookie HttpOnly segura |
| Revocable | No (stateless) | Sí (persiste en BD) |

**Flujo técnico de renovación transparente:**

```
Cliente                    Auth Server              Microservicio
   |                           |                         |
   |--- POST /auth/login ----→|                         |
   |←-- Access Token (1min)  --|                         |
   |    Refresh Token (30d)    |                         |
   |                           |                         |
   |--- GET /v1/service-alpha/private [Access Token] --→|
   |←------- 200 OK -----------------------------------|
   |                           |                         |
   | [60 segundos después...] |                         |
   |                           |                         |
   |--- GET /v1/service-beta/private [Access Token] ---→|
   |←------- 401 TOKEN_EXPIRED ------------------------|
   |                           |                         |
   |--- POST /auth/refresh --→|                         |
   |    [Refresh Token en      |                         |
   |     cookie HttpOnly]      |                         |
   |←-- Nuevo Access Token ----|                         |
   |                           |                         |
   |--- GET /v1/service-beta/private [Nuevo Token] ----→|
   |←------- 200 OK -----------------------------------|
```

Desde la perspectiva del usuario, este flujo es completamente transparente: el cliente (SPA, app móvil) detecta el `401 TOKEN_EXPIRED`, ejecuta la renovación automáticamente en segundo plano y reintenta la petición original sin interrumpir la sesión.

La seguridad no se compromete porque:

1. El **Access Token** sigue siendo de corta duración. Un adversario que lo intercepte solo tiene una ventana mínima de explotación.
2. El **Refresh Token** nunca viaja en headers de peticiones ordinarias; se almacena en una cookie con atributos `HttpOnly; Secure; SameSite=Strict`, haciéndolo inaccesible desde JavaScript y protegido contra ataques XSS y CSRF.
3. Los microservicios permanecen **completamente stateless**: solo validan el Access Token con la llave pública. No conocen la existencia del Refresh Token ni necesitan consultarlo.
4. El servidor de identidad puede **revocar Refresh Tokens** individualmente (logout, detección de anomalías) sin necesidad de invalidar todos los tokens activos del sistema.

### Pregunta 2: ¿Dónde se debe almacenar y gestionar el ciclo de vida del Refresh Token?

#### En el lado del Servidor (Auth Server)

El servidor de identidad debe **persistir** cada Refresh Token emitido en una base de datos (Redis o PostgreSQL son opciones comunes). El registro incluye:

- Hash del Refresh Token (nunca el valor en texto plano)
- ID del usuario asociado
- Fecha de emisión y expiración
- Indicador de revocación (`is_revoked`)
- Metadatos de sesión (IP, user-agent) para detección de anomalías

Esto introduce un elemento de **estado controlado** únicamente en el servidor de identidad, manteniendo a todos los demás microservicios completamente stateless.

```
POST /auth/refresh
→ Servidor valida que el Refresh Token existe en BD y no está revocado
→ Emite nuevo Access Token (RS256, 1 minuto)
→ Opcionalmente rota el Refresh Token (genera uno nuevo, invalida el anterior)
```

La **rotación de Refresh Tokens** es una buena práctica: cada uso del Refresh Token genera uno nuevo, invalidando el anterior. Si se detecta que un token rotado es usado nuevamente, el servidor puede asumir compromiso de seguridad y revocar toda la familia de tokens.

#### En el lado del Cliente

El Refresh Token **nunca** debe almacenarse en `localStorage` ni `sessionStorage`. Estas APIs son accesibles desde JavaScript y cualquier script XSS podría exfiltrarlos.

La alternativa recomendada según las mejores prácticas (OWASP, RFC 6749) es una **cookie con los siguientes atributos de seguridad**:

```http
Set-Cookie: refresh_token=<valor_opaco>;
  HttpOnly;           ← Inaccesible desde JavaScript
  Secure;             ← Solo transmitida sobre HTTPS
  SameSite=Strict;    ← Protección contra CSRF
  Path=/auth/refresh; ← Solo enviada al endpoint de renovación
  Max-Age=2592000;    ← 30 días en segundos
```

Con esta configuración:
- **`HttpOnly`**: JavaScript no puede leer ni acceder a la cookie, mitigando ataques XSS completamente.
- **`Secure`**: la cookie solo se transmite sobre conexiones TLS, previniendo interceptación en canales no cifrados.
- **`SameSite=Strict`**: la cookie no se incluye en requests cross-site, eliminando el vector de ataque CSRF.
- **`Path=/auth/refresh`**: la cookie solo se envía al endpoint de renovación, reduciendo la superficie de exposición.

El **Access Token**, en cambio, puede vivir en memoria de la aplicación (variable de estado en React, por ejemplo) ya que su corta duración lo hace de bajo riesgo incluso si es inspeccionado en memoria.

#### Resumen arquitectónico

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser/App)                     │
│                                                                  │
│  Memoria RAM          │  Cookie HttpOnly+Secure+SameSite        │
│  ┌─────────────────┐  │  ┌──────────────────────────────────┐   │
│  │  Access Token   │  │  │  Refresh Token (opaco, hasheado) │   │
│  │  (1 minuto)     │  │  │  (30 días, inaccesible por JS)   │   │
│  │  → Cada request │  │  │  → Solo POST /auth/refresh       │   │
│  └─────────────────┘  │  └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────────────┐
              ↓               ↓                       ↓
    ┌──────────────┐  ┌──────────────┐      ┌──────────────────┐
    │ Auth Server  │  │ Service Alpha│      │  Service Beta    │
    │ (estado:     │  │ (stateless:  │      │  (stateless:     │
    │  Refresh DB) │  │  llave pub)  │      │   llave pub)     │
    └──────────────┘  └──────────────┘      └──────────────────┘
```

Esta arquitectura logra el equilibrio óptimo entre seguridad y usabilidad: tokens de acceso de corta duración que minimizan el impacto de una interceptación, refresh tokens de larga duración que mantienen la sesión del usuario de forma transparente, y microservicios completamente stateless que escalan horizontalmente sin compartir estado de sesión.

---

## Dependencias

| Paquete | Versión | Uso |
|---|---|---|
| `express` | ^4.19.2 | Framework HTTP |
| `jsonwebtoken` | ^9.0.2 | Firmado y verificación JWT (RS256/HS256) |
| `dotenv` | ^16.4.5 | Carga de variables de entorno desde `.env` |
| `nodemon` | ^3.1.4 | Hot-reload en desarrollo (devDependency) |
