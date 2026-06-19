'use strict';

/**
 * @module AuthController
 * @description Controlador para el flujo de autenticación.
 * Responsabilidad única: orquestar la petición de login y delegar la firma del token
 * al servicio criptográfico correspondiente.
 */

const { signToken, ALGORITHM } = require('../services/jwt.service');

// Base de datos simulada de usuarios (en producción sería una BD real)
const USERS_DB = [
  { id: 1, name: 'Ana Torres',   email: 'ana@espe.edu.ec',    password: 'password123' },
  { id: 2, name: 'Carlos Ruiz',  email: 'carlos@espe.edu.ec', password: 'securepass'  },
];

/**
 * POST /auth/login
 * Autentica un usuario y emite un JWT firmado con RS256.
 *
 * Body esperado: { email, password }
 */
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error:   'MISSING_CREDENTIALS',
      message: 'Se requieren los campos email y password.',
    });
  }

  const user = USERS_DB.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      error:   'INVALID_CREDENTIALS',
      message: 'Credenciales incorrectas.',
    });
  }

  const token = signToken({ id: user.id, name: user.name });

  return res.status(200).json({
    message:   'Autenticación exitosa.',
    algorithm: ALGORITHM,
    expiresIn: '60 segundos',
    token,
  });
}

module.exports = { login };
