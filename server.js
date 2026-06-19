'use strict';

/**
 * @file server.js
 * @description Punto de entrada del servidor Express.
 * Configura las capas de middleware globales y registra los routers.
 * SRP: este archivo solo inicializa y conecta los módulos; no contiene lógica de negocio.
 */

require('dotenv').config();

const express       = require('express');
const authRoutes    = require('./routes/auth.routes');
const serviceRoutes = require('./routes/services.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware globales ────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Registro de rutas ──────────────────────────────────────────────────────────
app.use('/auth',  authRoutes);     // Servidor de identidad (público)
app.use('/v1',    serviceRoutes);  // Microservicios simulados (protegidos)

// ── Ruta raíz informativa ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    project:   'JWT Microservices — ESPE Seguridad Avanzada',
    endpoints: {
      login:        'POST /auth/login',
      serviceAlpha: 'GET  /v1/service-alpha/private  (Bearer JWT requerido)',
      serviceBeta:  'GET  /v1/service-beta/private   (Bearer JWT requerido)',
    },
    users_demo: [
      { email: 'ana@espe.edu.ec',    password: 'password123' },
      { email: 'carlos@espe.edu.ec', password: 'securepass'  },
    ],
  });
});

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: `Ruta ${req.method} ${req.path} no existe.` });
});

// ── Arranque ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor activo en http://localhost:${PORT}`);
  console.log(`   POST /auth/login           → obtener JWT`);
  console.log(`   GET  /v1/service-alpha/private → microservicio Alpha`);
  console.log(`   GET  /v1/service-beta/private  → microservicio Beta\n`);
});

module.exports = app;
