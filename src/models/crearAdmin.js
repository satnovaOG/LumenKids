// Archivo: src/models/crearAdmin.js

const pool = require('../config/db');
// Importamos dotenv para poder leer los datos desde el archivo .env
require('dotenv').config();

async function registrarAdministradorPrincipal() {
    console.log('--- INICIO: Creación de Administrador ---');

    // Extraemos los datos de las variables de entorno
    const idClerkAdmin = process.env.ADMIN_CLERK_ID; 
    const nombreAdmin = process.env.ADMIN_NOMBRE;
    const correoAdmin = process.env.ADMIN_CORREO;

    // Validación de seguridad para evitar insertar datos nulos
    if (!idClerkAdmin || !nombreAdmin || !correoAdmin) {
        console.error('Error: Faltan las variables del Administrador en el archivo .env');
        return;
    }

    try {
        await pool.query(
            'INSERT INTO Administrador (id_admin, nombre, correo) VALUES ($1, $2, $3) ON CONFLICT (id_admin) DO NOTHING',
            [idClerkAdmin, nombreAdmin, correoAdmin]
        );
        
        console.log(`Exito! El usuario ${nombreAdmin} ha sido registrado como Administrador.`);
    } catch (error) {
        console.error('Ocurrio un error al registrar el administrador:', error);
    } finally {
        await pool.end();
        console.log('--- FIN: Proceso finalizado ---');
    }
}

registrarAdministradorPrincipal();