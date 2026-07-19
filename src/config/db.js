// Archivo: src/config/db.js

// Importamos la clase 'Pool' desde la librería 'pg' que acabamos de instalar.
const { Pool } = require('pg');

// Configuramos dotenv para que Node.js pueda leer nuestro archivo .env
require('dotenv').config();

// Creamos una nueva "piscina" (Pool) de conexiones
const pool = new Pool({
  // Le pasamos la URL de conexión que tienes en tu archivo .env
  connectionString: process.env.NEON_DATABASE_URL,
  // Neon requiere conexiones seguras (SSL), por lo que lo activamos aquí
  ssl: {
    rejectUnauthorized: false
  }
});

// Exportamos esta conexión para poder usarla en otros archivos de nuestro proyecto
module.exports = pool;