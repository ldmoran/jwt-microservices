'use strict';

const Sentry = require('@sentry/node');

const jwt = require('jsonwebtoken');
const { verifyToken } = require('../services/jwt.service');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      error: 'MISSING_TOKEN',
      message: 'Se requiere Bearer Token',
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      error: 'INVALID_TOKEN_FORMAT',
      message: 'Formato inválido',
    });
  }

  const token = parts[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();

  } catch (err) {

    // 🔴 ERROR LÓGICO (NO SENTRY)
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Token expirado',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'INVALID_TOKEN',
        message: 'Token inválido',
      });
    }

    // 🔥 ERROR OPERACIONAL (SÍ SENTRY)
    Sentry.captureException(err);

    return res.status(500).json({
      error: 'AUTH_ERROR',
      message: 'Error interno de autenticación',
    });
  }
}

module.exports = authMiddleware;