'use strict';

/**
 * @module AuthMiddleware
 * @description Middleware de autenticación stateless para recursos restringidos.
 * Intercepta peticiones HTTP, extrae el Bearer Token del encabezado Authorization,
 * lo verifica criptográficamente y gestiona todas las excepciones posibles.
 *
 * SRP: este módulo solo se encarga de validar la identidad del portador del token.
 * No firma tokens ni conoce la lógica de negocio de los servicios.
 */

const jwt          = require('jsonwebtoken');
const { verifyToken } = require('../services/jwt.service');

/**
 * Middleware de autenticación Bearer JWT.
 *
 * Flujo:
 *  1. Extrae el header Authorization
 *  2. Valida el esquema "Bearer <token>"
 *  3. Verifica la firma y expiración con la llave pública (RS256 stateless)
 *  4. Adjunta el payload verificado en req.user
 *  5. Maneja excepciones con códigos HTTP apropiados
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  // 1. Verificar presencia del encabezado
  if (!authHeader) {
    return res.status(401).json({
      error:   'MISSING_TOKEN',
      message: 'Se requiere el encabezado Authorization con un Bearer Token.',
    });
  }

  // 2. Validar esquema Bearer
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      error:   'INVALID_TOKEN_FORMAT',
      message: 'Formato inválido. Use: Authorization: Bearer <token>',
    });
  }

  const token = parts[1];

  // 3. Verificar firma y expiración
  try {
    const payload  = verifyToken(token);
    req.user       = payload;   // disponible para los controladores downstream
    next();

  } catch (err) {

    // Token expirado (exp superado)
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error:     'TOKEN_EXPIRED',
        message:   'El token JWT ha expirado. Solicita un nuevo token de acceso.',
        expiredAt: err.expiredAt,
      });
    }

    // Algoritmo inválido o firma manipulada
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error:   'INVALID_TOKEN',
        message: `Token inválido o algoritmo no permitido: ${err.message}`,
      });
    }

    // Error inesperado
    return res.status(500).json({
      error:   'AUTH_ERROR',
      message: 'Error interno durante la verificación del token.',
    });
  }
}

module.exports = authMiddleware;
