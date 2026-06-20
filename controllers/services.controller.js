'use strict';
const Sentry = require('@sentry/node');

/**
 * @module ServicesController
 * @description Controlador de microservicios Alpha y Beta con observabilidad Sentry
 */

/**
 * ERROR OPERACIONAL → Sentry automático
 */
function serviceAlphaPrivate(req, res) {
  throw new Error('Conexión perdida con la BDD');
}

/**
 * ERROR CONTROLADO → Sentry manual + tags + context
 */
function serviceBetaPrivate(req, res) {
  try {

    throw new Error('Fallo controlado para observabilidad');

  } catch (err) {

    // 🔥 TAG obligatorio
    Sentry.setTag('service', 'service-beta');

    // 🔥 CONTEXTO del usuario (NO sensible)
    Sentry.setContext('user', {
      id: req.user?.sub,
      name: req.user?.name
    });

    // 🔥 Captura manual
    Sentry.captureException(err);

    return res.status(500).json({
      error: 'SERVICE_BETA_ERROR',
      message: 'Error enviado a Sentry'
    });
  }
}

module.exports = { serviceAlphaPrivate, serviceBetaPrivate };