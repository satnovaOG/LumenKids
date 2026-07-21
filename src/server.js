// Archivo: src/server.js

const express = require('express');
const path = require('path');
require('dotenv').config();

const pool = require('./config/db');

// Importamos las herramientas actuales de Clerk
const { clerkMiddleware, getAuth, clerkClient } = require('@clerk/express');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuramos los middlewares básicos para entender JSON
app.use(express.json());

// Es obligatorio iniciar clerkMiddleware antes de cualquier ruta
app.use(clerkMiddleware());

// Configuramos la carpeta de la interfaz visual
app.use(express.static(path.join(__dirname, 'public')));

// Prueba de conexión a la base de datos de Neon
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error conectando a la base de datos de Neon:', err);
    } else {
        console.log('Conexion exitosa a la base de datos. Hora del servidor:', res.rows[0].now);
    }
});

function generarCodigoVinculacion() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return codigo;
}

// Función para generar una contraseña aleatoria segura para los docentes
function generarPasswordTemporal() {
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const especiales = '!@#$%&*';

    let password = '';
    
    // Garantizamos que la contraseña cumpla con los requisitos mínimos de seguridad
    password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length));
    password += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
    password += numeros.charAt(Math.floor(Math.random() * numeros.length));
    password += especiales.charAt(Math.floor(Math.random() * especiales.length));

    // Rellenamos el resto de la contraseña hasta alcanzar 12 caracteres
    const todosLosCaracteres = mayusculas + minusculas + numeros + especiales;
    for (let i = 0; i < 8; i++) {
        password += todosLosCaracteres.charAt(Math.floor(Math.random() * todosLosCaracteres.length));
    }

    // Mezclamos los caracteres para que el orden sea completamente aleatorio
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Ruta 1: Registro Autónomo del Estudiante
app.post('/api/registro-estudiante', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { nombre } = req.body;
    let codigoUnico = generarCodigoVinculacion();
    let guardadoExitoso = false;

    try {
        // Bucle para asegurar que el código generado no exista ya en la base de datos
        while (!guardadoExitoso) {
            try {
                await pool.query(
                    'INSERT INTO Estudiante (id_estudiante, nombre, codigo_vinculacion) VALUES ($1, $2, $3)',
                    [idUsuario, nombre, codigoUnico]
                );
                guardadoExitoso = true;
            } catch (dbError) {
                // Si el error es código duplicado (23505), generamos uno nuevo y el bucle repite
                if (dbError.code === '23505' && dbError.constraint === 'estudiante_codigo_vinculacion_key') {
                    codigoUnico = generarCodigoVinculacion();
                } else {
                    throw dbError; // Si es otro error, detenemos el proceso
                }
            }
        }
        res.status(200).json({ mensaje: 'Estudiante registrado', codigo: codigoUnico });
    } catch (error) {
        console.error('Error en registro de estudiante:', error);
        res.status(500).json({ error: 'Fallo al registrar estudiante.' });
    }
});

// Ruta 2: Registro del Padre con Validación
// Archivo: src/server.js (Reemplazar la Ruta 2: Registro del Padre)

app.post('/api/registro-padre', async (req, res) => {
    console.log('--- INICIO: Procesando registro de Padre ---');
    
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    
    if (!idUsuario) {
        console.log('Fallo: No se detectó autenticación de Clerk.');
        return res.status(401).json({ error: 'No autorizado' });
    }

    const { nombre, correo, codigoHijo } = req.body;
    
    // Medidas de seguridad y limpieza de datos
    const codigoLimpio = codigoHijo ? codigoHijo.trim().toUpperCase() : '';
    const correoSeguro = correo || `sin-correo-${idUsuario}@lumenkids.local`;

    console.log('Datos recibidos:', { nombre, correoSeguro, codigoLimpio });

    try {
        // 1. Verificar si el código ingresado existe
        console.log('Paso 1: Buscando al estudiante con el código proporcionado...');
        const resEstudiante = await pool.query(
            'SELECT id_estudiante FROM Estudiante WHERE codigo_vinculacion = $1',
            [codigoLimpio]
        );

        if (resEstudiante.rows.length === 0) {
            console.log('Fallo: El código no existe en la tabla Estudiante.');
            return res.status(404).json({ error: 'Código de vinculación inválido o estudiante no encontrado.' });
        }

        const idEstudiante = resEstudiante.rows[0].id_estudiante;
        console.log('Paso 1 Completado: Estudiante encontrado (ID:', idEstudiante, ')');

        // 2. Guardar al padre en la base de datos
        console.log('Paso 2: Insertando datos del Padre en PostgreSQL...');
        await pool.query(
            'INSERT INTO Padre (id_padre, nombre, correo) VALUES ($1, $2, $3) ON CONFLICT (id_padre) DO NOTHING',
            [idUsuario, nombre, correoSeguro]
        );
        console.log('Paso 2 Completado: Padre guardado exitosamente.');

        // 3. Vincular al hijo con su nuevo padre
        console.log('Paso 3: Actualizando el registro del estudiante con el ID del padre...');
        await pool.query(
            'UPDATE Estudiante SET id_padre = $1 WHERE id_estudiante = $2',
            [idUsuario, idEstudiante]
        );
        console.log('Paso 3 Completado: Vinculación familiar guardada.');

        console.log('--- FIN: Registro de Padre procesado con éxito ---');
        res.status(200).json({ mensaje: 'Vinculación familiar exitosa.' });
    } catch (error) {
        console.error('Error crítico en registro de padre:', error);
        res.status(500).json({ error: 'Fallo al registrar al padre.' });
    }
});

app.post('/api/crear-mentor', async (req, res) => {
    console.log('--- INICIO: Procesando creación de Mentor ---');
    const auth = getAuth(req);
    const idUsuario = auth.userId;

    if (!idUsuario) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }

    const { nombre, correo } = req.body;

    try {
        // 1. Verificación estricta de privilegios
        console.log('Verificando privilegios de Administrador para el ID:', idUsuario);
        const resAdmin = await pool.query(
            'SELECT id_admin FROM Administrador WHERE id_admin = $1',
            [idUsuario]
        );

        if (resAdmin.rows.length === 0) {
            console.log('Fallo: Intento de acceso no autorizado a funciones de administrador.');
            return res.status(403).json({ error: 'Acceso denegado. No posees permisos de Administrador.' });
        }

        console.log('Privilegios confirmados. Creando cuenta en Clerk...');
        
        // 2. Crear la cuenta real en el sistema de Clerk
        // Se asigna una contraseña temporal estándar que el docente podrá cambiar luego
        const passwordAleatoria = generarPasswordTemporal();
        
        const nuevoUsuarioClerk = await clerkClient.users.createUser({
            firstName: nombre,
            emailAddress: [correo],
            password: passwordAleatoria
        });
        
        const idMentorReal = nuevoUsuarioClerk.id;
        console.log('Cuenta creada en Clerk exitosamente con el ID:', idMentorReal);

        // 3. Insertar el mentor en la base de datos vinculándolo con el administrador que lo creó
        console.log('Guardando al docente en PostgreSQL...');
        await pool.query(
            'INSERT INTO Mentor (id_mentor, nombre, correo, id_admin) VALUES ($1, $2, $3, $4)',
            [idMentorReal, nombre, correo, idUsuario]
        );

        console.log('--- FIN: Docente creado con éxito ---');
        
        // Devolvemos la contraseña generada al panel del administrador
        res.status(200).json({ 
            mensaje: `Docente registrado exitosamente.<br>Su contraseña temporal es: <strong>${passwordAleatoria}</strong>` 
        });
    } catch (error) {
        console.error('Error al intentar registrar al docente:', error);
        
        // Si el error viene de Clerk (ej. el correo ya existe), extraemos el mensaje
        if (error.errors && error.errors.length > 0) {
            return res.status(400).json({ error: error.errors[0].message });
        }
        
        res.status(500).json({ error: 'Fallo interno al registrar al docente.' });
    }
});

app.get('/api/verificar-rol', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;

    if (!idUsuario) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        // Consultamos si el usuario actual está registrado como Administrador
        const resAdmin = await pool.query(
            'SELECT id_admin FROM Administrador WHERE id_admin = $1',
            [idUsuario]
        );

        if (resAdmin.rows.length > 0) {
            return res.status(200).json({ rol: 'admin' });
        }

        // Si en el futuro necesitas redirigir a otros roles, puedes agregar las consultas aquí.
        // Por ahora, si no es administrador, devolvemos un rol general.
        res.status(200).json({ rol: 'usuario' });
    } catch (error) {
        console.error('Error al verificar el rol:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta 3: Crear una nueva Ruta de Aprendizaje (Coursera)
app.post('/api/crear-ruta-coursera', async (req, res) => {
    console.log('--- INICIO: Procesando creación de Ruta de Aprendizaje ---');
    const auth = getAuth(req);
    const idUsuario = auth.userId;

    if (!idUsuario) {
        return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });
    }

    // Extraemos los datos que nos enviará el panel visual
    const { nombreCurso, area, urlCoursera } = req.body;

    try {
        // 1. Verificamos que el usuario tenga privilegios de Mentor o Administrador
        const resPrivilegios = await pool.query(
            'SELECT id_mentor FROM Mentor WHERE id_mentor = $1 UNION SELECT id_admin FROM Administrador WHERE id_admin = $1',
            [idUsuario]
        );

        if (resPrivilegios.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado. Solo el personal docente puede crear rutas.' });
        }

        // 2. Insertamos la nueva ruta en la base de datos
        const nuevaRuta = await pool.query(
            'INSERT INTO Ruta_Aprendizaje (nombre_curso, area, url_coursera, id_mentor) VALUES ($1, $2, $3, $4) RETURNING id_ruta',
            [nombreCurso, area, urlCoursera, idUsuario]
        );

        console.log('--- FIN: Ruta de Coursera creada exitosamente ---');
        res.status(200).json({ 
            mensaje: 'Ruta de aprendizaje creada exitosamente.', 
            id_ruta: nuevaRuta.rows[0].id_ruta 
        });
    } catch (error) {
        console.error('Error al crear la ruta:', error);
        res.status(500).json({ error: 'Fallo interno al procesar la ruta en el servidor.' });
    }
});

// Ruta 4: Asignar Ruta de Aprendizaje a un Estudiante
app.post('/api/asignar-ruta-estudiante', async (req, res) => {
    console.log('--- INICIO: Asignando ruta a estudiante ---');
    const auth = getAuth(req);
    const idUsuario = auth.userId;

    if (!idUsuario) {
        return res.status(401).json({ error: 'No autorizado.' });
    }

    const { idEstudiante, idRuta } = req.body;

    try {
         // 1. Verificamos nuevamente los privilegios de seguridad
         const resPrivilegios = await pool.query(
            'SELECT id_mentor FROM Mentor WHERE id_mentor = $1 UNION SELECT id_admin FROM Administrador WHERE id_admin = $1',
            [idUsuario]
        );

        if (resPrivilegios.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado.' });
        }

        // 2. Insertamos la relación en la tabla intermedia (ignora si ya existe)
        await pool.query(
            'INSERT INTO Estudiante_Ruta (id_estudiante, id_ruta) VALUES ($1, $2) ON CONFLICT (id_estudiante, id_ruta) DO NOTHING',
            [idEstudiante, idRuta]
        );

        console.log('--- FIN: Ruta asignada correctamente ---');
        res.status(200).json({ mensaje: 'Ruta vinculada al estudiante de forma exitosa.' });
    } catch (error) {
        console.error('Error al asignar ruta:', error);
        res.status(500).json({ error: 'Fallo interno al vincular la ruta.' });
    }
});

// Ruta 5: Obtener las rutas de aprendizaje del estudiante activo (Coursera)
app.get('/api/mis-rutas', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    
    if (!idUsuario) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        // Consultamos las rutas asignadas uniendo la tabla de Rutas y la tabla intermedia
        const query = `
            SELECT r.id_ruta, r.nombre_curso, r.area, r.url_coursera, er.progreso_porcentaje
            FROM Ruta_Aprendizaje r
            JOIN Estudiante_Ruta er ON r.id_ruta = er.id_ruta
            WHERE er.id_estudiante = $1
        `;
        const result = await pool.query(query, [idUsuario]);
        
        // Enviamos el arreglo de rutas al frontend
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener rutas:', error);
        res.status(500).json({ error: 'Fallo al obtener las rutas de aprendizaje.' });
    }
});

app.get('/api/config', (req, res) => {
    // Es seguro enviar la Publishable Key, pero NUNCA envíes la Secret Key aquí.
    res.json({ 
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY 
    });
});

// Inicializamos el servidor
app.listen(PORT, () => {
    console.log(`Servidor de LumenKids ejecutandose y escuchando en http://localhost:${PORT}`);
});