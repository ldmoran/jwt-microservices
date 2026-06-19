'use strict';

/**
 * @module AuthRoutes
 * @description Rutas públicas del servidor de identidad.
 * SRP: este módulo solo define el mapeo URL → controlador para autenticación.
 */

const express        = require('express');
const { login }      = require('../controllers/auth.controller');

const router = express.Router();

// POST /auth/login → emite JWT firmado
router.post('/login', login);

module.exports = router;
