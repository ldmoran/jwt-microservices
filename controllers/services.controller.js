'use strict';

/**
 * @module ServicesController
 * @description Controlador que simula dos microservicios autónomos e independientes.
 * Cada endpoint valida la identidad del solicitante de forma stateless, usando
 * únicamente la llave pública compartida — sin consultar ningún almacenamiento central.
 *
 * SRP: este módulo solo gestiona las respuestas de los recursos protegidos.
 * La verificación del token ocurre en el middleware, no aquí.
 */

/**
 * GET /v1/service-alpha/private
 * Microservicio Alpha — Simula un servicio de datos de usuario.
 * Valida identidad de forma autónoma vía llave pública (RS256 stateless).
 */
function serviceAlphaPrivate(req, res) {
  // req.user fue poblado por authMiddleware tras verificar la firma RS256
  const { sub, name, exp, iat } = req.user;

  return res.status(200).json({
    service:   'SERVICE-ALPHA',
    status:    'ACCESO CONCEDIDO ✅',
    message:   `Bienvenido al Microservicio Alpha, ${name}.`,
    identity: {
      userId:    sub,
      name,
      issuedAt:  new Date(iat  * 1000).toISOString(),
      expiresAt: new Date(exp  * 1000).toISOString(),
    },
    note: 'Este servicio validó tu identidad de forma autónoma usando solo la llave pública. Cero consultas al servidor de identidad.',
  });
}

/**
 * GET /v1/service-beta/private
 * Microservicio Beta — Simula un servicio de auditoría/reportes.
 * Independiente de Service Alpha; valida el mismo token por su cuenta.
 */
function serviceBetaPrivate(req, res) {
  const { sub, name, exp, iat } = req.user;

  return res.status(200).json({
    service:   'SERVICE-BETA',
    status:    'ACCESO CONCEDIDO ✅',
    message:   `Identidad verificada en Microservicio Beta, ${name}.`,
    identity: {
      userId:    sub,
      name,
      issuedAt:  new Date(iat  * 1000).toISOString(),
      expiresAt: new Date(exp  * 1000).toISOString(),
    },
    note: 'Service Beta opera de forma completamente independiente. Misma llave pública, validación stateless aislada.',
  });
}

module.exports = { serviceAlphaPrivate, serviceBetaPrivate };
