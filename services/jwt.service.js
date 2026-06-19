'use strict';

/**
 * @module JwtService
 * @description Capa de servicio criptográfico para firmado y verificación de JWT.
 * Implementa algoritmo asimétrico RS256 (llave privada/pública) como método principal,
 * con fallback a HS256 simétrico si no se configuran las llaves.
 *
 * Principio de Responsabilidad Única (SRP): este módulo se ocupa exclusivamente
 * de la lógica criptográfica de tokens. No conoce rutas, peticiones HTTP ni usuarios.
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// ── Carga de llaves criptográficas desde variables de entorno ──────────────────

/**
 * Lee un archivo de llave desde la ruta especificada en .env.
 * Retorna null si la variable no está definida o el archivo no existe.
 * @param {string} envVar - Nombre de la variable de entorno con la ruta
 * @returns {Buffer|null}
 */
function loadKey(envVar) {
  const keyPath = process.env[envVar];
  if (!keyPath) return null;

  const resolvedPath = path.resolve(keyPath);
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`⚠️  [JwtService] Llave no encontrada en: ${resolvedPath}`);
    return null;
  }

  return fs.readFileSync(resolvedPath);
}

const PRIVATE_KEY = loadKey('PRIVATE_KEY_PATH');
const PUBLIC_KEY  = loadKey('PUBLIC_KEY_PATH');
const JWT_SECRET  = process.env.JWT_SECRET || 'fallback_secret_sin_env';

// Algoritmo seleccionado según disponibilidad de llaves asimétricas
const ALGORITHM = PRIVATE_KEY ? 'RS256' : 'HS256';

console.log(`🔐 [JwtService] Algoritmo activo: ${ALGORITHM}`);

// ── Funciones públicas del servicio ───────────────────────────────────────────

/**
 * Firma un JWT con los claims estándar requeridos.
 *
 * Claims estructurados:
 *  - sub  → ID único del usuario (estándar JWT RFC 7519)
 *  - name → Nombre completo del perfil
 *  - exp  → Expiración: exactamente 60 segundos desde la emisión
 *
 * @param {{ id: string|number, name: string }} user
 * @returns {string} Token JWT firmado
 */
function signToken(user) {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    sub:  String(user.id),
    name: user.name,
    exp:  now + 60,          // exactamente 1 minuto
    iat:  now,               // issued at (buena práctica)
  };

  if (PRIVATE_KEY) {
    // Firma asimétrica RS256 — usa llave privada generada por OpenSSL (PKCS#8)
    return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'RS256' });
  }

  // Fallback simétrico HS256
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256' });
}

/**
 * Verifica y decodifica un JWT.
 * Usa la llave pública para validación asimétrica RS256 si está disponible.
 * Lanza excepción de jsonwebtoken ante token expirado, inválido o algoritmo incorrecto.
 *
 * @param {string} token
 * @returns {object} Payload decodificado y verificado
 * @throws {JsonWebTokenError | TokenExpiredError}
 */
function verifyToken(token) {
  if (PUBLIC_KEY) {
    // Validación asimétrica — solo necesita la llave pública (stateless)
    return jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
  }

  // Fallback simétrico
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken, ALGORITHM };
