// Archivo: src/models/initDb.js

const fs = require('fs');
const path = require('path');
// Importamos la conexión a tu base de datos
const pool = require('../config/db');

async function inicializarBaseDeDatos() {
    try {
        console.log('Iniciando la creacion de tablas...');
        
        // Leemos el contenido del archivo schema.sql
        const rutaSql = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(rutaSql, 'utf8');
        
        // Ejecutamos el código SQL en tu base de datos Neon
        await pool.query(sql);
        
        console.log('Tablas creadas exitosamente.');
    } catch (error) {
        console.error('Ocurrio un error al crear las tablas:', error);
    } finally {
        // Cerramos la conexión al terminar
        await pool.end();
    }
}

// Ejecutamos la función
inicializarBaseDeDatos();