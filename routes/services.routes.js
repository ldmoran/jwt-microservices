'use strict';

/**
 * @module ServicesRoutes
 * @description Rutas protegidas que simulan los dos microservicios autónomos.
 * Cada ruta aplica el middleware de autenticación de forma independiente,
 * reflejando el patrón real donde cada microservicio valida por su cuenta.
 *
 * SRP: este módulo solo mapea URLs a controladores con su middleware correspondiente.
 */

const express            = require('express');
const authMiddleware     = require('../middlewares/auth.middleware');
const {
  serviceAlphaPrivate,
  serviceBetaPrivate,
} = require('../controllers/services.controller');

const router = express.Router();

// GET /v1/service-alpha/private — Microservicio Alpha (protegido con JWT RS256)
router.get('/service-alpha/private', authMiddleware, serviceAlphaPrivate);

// GET /v1/service-beta/private  — Microservicio Beta  (protegido con JWT RS256)
router.get('/service-beta/private',  authMiddleware, serviceBetaPrivate);

module.exports = router;
