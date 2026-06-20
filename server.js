'use strict';

require('dotenv').config();
require('./instrument');

const Sentry = require('@sentry/node');
const express = require('express');

const authRoutes = require('./routes/auth.routes');
const serviceRoutes = require('./routes/services.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 SENTRY (NUEVO SDK)
Sentry.setupExpressErrorHandler(app);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/auth', authRoutes);
app.use('/v1', serviceRoutes);

// TEST ERROR
app.get('/debug-sentry', () => {
  throw new Error('🔥 ERROR DE PRUEBA SENTRY');
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND' });
});

// Sentry final handler
app.use(Sentry.expressErrorHandler());

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});

module.exports = app;