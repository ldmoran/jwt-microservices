#!/bin/bash

# ============================================================
# Script de generación de par de llaves criptográficas RSA
# Algoritmo: RS256 | Formato: PKCS#8
# Universidad de las Fuerzas Armadas ESPE
# ============================================================

KEYS_DIR="./keys"

echo "🔐 Generando par de llaves RSA (PKCS#8) con OpenSSL..."

mkdir -p $KEYS_DIR

# Generar llave privada RSA de 2048 bits en formato PKCS#8
openssl genpkey -algorithm RSA \
  -pkeyopt rsa_keygen_bits:2048 \
  -out $KEYS_DIR/private.pem

# Extraer llave pública desde la llave privada
openssl rsa \
  -pubout \
  -in $KEYS_DIR/private.pem \
  -out $KEYS_DIR/public.pem

echo ""
echo "✅ Llaves generadas exitosamente:"
echo "   🔑 Llave privada : $KEYS_DIR/private.pem"
echo "   🔓 Llave pública : $KEYS_DIR/public.pem"
echo ""
echo "⚠️  IMPORTANTE: Nunca subas el archivo .env ni las llaves a Git."
