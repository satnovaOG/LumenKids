// Archivo: src/models/verificarDatos.js

// Importamos la conexión a tu base de datos
const pool = require('../config/db');

async function verificarTablas() {
    try {
        console.log('Iniciando verificacion de datos en PostgreSQL...');

        // Consultamos la tabla Estudiante
        const resEstudiantes = await pool.query('SELECT * FROM Estudiante');
        console.log('--- Datos en la tabla Estudiante ---');
        console.log(resEstudiantes.rows.length > 0 ? resEstudiantes.rows : 'La tabla está vacía.');

        // Consultamos la tabla Padre
        const resPadres = await pool.query('SELECT * FROM Padre');
        console.log('\n--- Datos en la tabla Padre ---');
        console.log(resPadres.rows.length > 0 ? resPadres.rows : 'La tabla está vacía.');

        // Consultamos la tabla Mentor
        const resMentores = await pool.query('SELECT * FROM Mentor');
        console.log('\n--- Datos en la tabla Mentor ---');
        console.log(resMentores.rows.length > 0 ? resMentores.rows : 'La tabla está vacía.');

    } catch (error) {
        console.error('Ocurrio un error al consultar las tablas:', error);
    } finally {
        // Cerramos la conexión para que el programa termine correctamente
        await pool.end();
    }
}

// Ejecutamos la funcion
verificarTablas();