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

// Ruta 2: Registro del Padre con Validación Mejorada
// Ruta 2: Registro del Padre con Validación Mejorada y Rastreo
app.post('/api/registro-padre', async (req, res) => {
    console.log('\n--- INICIO: Procesando registro de Padre ---');
    
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    
    // RASTREO: Imprimimos exactamente lo que el frontend nos envió
    console.log('Datos recibidos en el servidor (req.body):', req.body);
    console.log('ID del usuario detectado por Clerk:', idUsuario);
    
    if (!idUsuario) {
        console.log('Fallo: No se detectó autenticación de Clerk.');
        return res.status(401).json({ error: 'No autorizado' });
    }

    const { nombre, correo, codigoHijo } = req.body;
    
    // Medidas de seguridad y limpieza de datos
    const codigoLimpio = codigoHijo ? codigoHijo.trim().toUpperCase() : '';
    const correoSeguro = correo || `sin-correo-${idUsuario}@lumenkids.local`;

    try {
        // PASO 1: Guardar SIEMPRE al padre en la base de datos primero
        console.log('Paso 1: Intentando insertar en PostgreSQL...');
        console.log(`Valores a guardar -> ID: ${idUsuario}, Nombre: ${nombre}, Correo: ${correoSeguro}`);
        
        const resultado = await pool.query(
            'INSERT INTO Padre (id_padre, nombre, correo) VALUES ($1, $2, $3) ON CONFLICT (id_padre) DO NOTHING RETURNING *',
            [idUsuario, nombre, correoSeguro]
        );
        
        if (resultado.rowCount > 0) {
            console.log('¡Éxito! Nuevo Padre guardado exitosamente en Neon.');
        } else {
            console.log('Aviso: El Padre ya existía en la base de datos (se ignoró la inserción).');
        }
        // PASO 2: Verificar si proporcionó un código de estudiante
        if (!codigoLimpio) {
            console.log('Aviso: El padre se registró sin código de estudiante.');
            return res.status(200).json({ 
                mensaje: 'Cuenta creada. Aún no has vinculado a un estudiante porque el código estaba vacío.' 
            });
        }

        console.log('Paso 2: Buscando al estudiante con el código proporcionado...');
        const resEstudiante = await pool.query(
            'SELECT id_estudiante FROM Estudiante WHERE codigo_vinculacion = $1',
            [codigoLimpio]
        );

        if (resEstudiante.rows.length === 0) {
            console.log('Advertencia: El código no existe en la tabla Estudiante.');
            return res.status(200).json({ 
                mensaje: 'Cuenta de padre creada, pero el código de estudiante es inválido. Podrás vincularlo después.' 
            });
        }

        const idEstudiante = resEstudiante.rows[0].id_estudiante;

        // PASO 3: Vincular al hijo con su nuevo padre
        console.log('Paso 3: Actualizando el registro del estudiante con el ID del padre...');
        await pool.query(
            'UPDATE Estudiante SET id_padre = $1 WHERE id_estudiante = $2',
            [idUsuario, idEstudiante]
        );
        console.log('Paso 3 Completado: Vinculación familiar guardada.');

        console.log('--- FIN: Registro de Padre procesado con éxito ---');
        res.status(200).json({ mensaje: 'Cuenta creada y vinculación familiar exitosa.' });
    } catch (error) {
        console.error('Error crítico en registro de padre:', error);
        res.status(500).json({ error: 'Fallo al registrar al padre en la base de datos.' });
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
        // 1. Verificamos si es Administrador
        const resAdmin = await pool.query('SELECT id_admin FROM Administrador WHERE id_admin = $1', [idUsuario]);
        if (resAdmin.rows.length > 0) return res.status(200).json({ rol: 'admin' });

        // 2. Verificamos si es Docente (Mentor)
        const resMentor = await pool.query('SELECT id_mentor FROM Mentor WHERE id_mentor = $1', [idUsuario]);
        if (resMentor.rows.length > 0) return res.status(200).json({ rol: 'mentor' });

        // 3. Verificamos si es Padre
        const resPadre = await pool.query('SELECT id_padre FROM Padre WHERE id_padre = $1', [idUsuario]);
        if (resPadre.rows.length > 0) return res.status(200).json({ rol: 'padre' });

        // 4. Si no está en las anteriores, asumimos que es Estudiante
        res.status(200).json({ rol: 'estudiante' });
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

// Ruta 6: Obtener los cursos del docente y sus estudiantes inscritos
app.get('/api/cursos-docente', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;

    if (!idUsuario) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        // 1. Consultamos todas las clases asociadas al mentor actual
        const resClases = await pool.query(
            'SELECT id_clase, nombre FROM Clase WHERE id_mentor = $1',
            [idUsuario]
        );

        const clasesConEstudiantes = [];

        // 2. Para cada clase, buscamos los estudiantes inscritos
        for (let clase of resClases.rows) {
            const resEstudiantes = await pool.query(
                `SELECT e.id_estudiante, e.nombre, e.edad, e.nivel, e.codigo_vinculacion
                 FROM Estudiante e
                 JOIN Clase_Estudiante ce ON e.id_estudiante = ce.id_estudiante
                 WHERE ce.id_clase = $1`,
                [clase.id_clase]
            );

            clasesConEstudiantes.push({
                id_clase: clase.id_clase,
                nombre_clase: clase.nombre,
                estudiantes: resEstudiantes.rows
            });
        }

        res.status(200).json(clasesConEstudiantes);
    } catch (error) {
        console.error('Error al obtener cursos del docente:', error);
        res.status(500).json({ error: 'Fallo al obtener los cursos y estudiantes.' });
    }
});

// Ruta 7: Guardar la estructura de un curso complejo (Temas, Lecciones, Evaluaciones)
app.post('/api/crear-curso-complejo', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;

    if (!idUsuario) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    // Recibimos el ID de la ruta (curso base) y la estructura anidada generada en el frontend
    const { idRuta, estructura } = req.body;

    try {
        // 1. Validamos que el usuario sea Docente o Administrador
        const resPrivilegios = await pool.query(
            'SELECT id_mentor FROM Mentor WHERE id_mentor = $1 UNION SELECT id_admin FROM Administrador WHERE id_admin = $1',
            [idUsuario]
        );
        if (resPrivilegios.rows.length === 0) return res.status(403).json({ error: 'Acceso denegado.' });

        // 2. Iniciamos una TRANSACCIÓN SQL. Si algo falla, todo se deshace para mantener la integridad.
        await pool.query('BEGIN');

        // 3. Recorremos y guardamos cada Tema
        for (const tema of estructura.temas) {
            const resTema = await pool.query(
                'INSERT INTO Tema (nombre_tema, id_ruta) VALUES ($1, $2) RETURNING id_tema',
                [tema.nombre, idRuta]
            );
            const idTema = resTema.rows[0].id_tema;

            // 4. Guardamos las Lecciones (lecturas) de este Tema
            if (tema.lecciones && tema.lecciones.length > 0) {
                for (const leccion of tema.lecciones) {
                    await pool.query(
                        'INSERT INTO Leccion (titulo, contenido, id_tema) VALUES ($1, $2, $3)',
                        [leccion.titulo, leccion.contenido, idTema]
                    );
                }
            }

            // 5. Guardamos las Evaluaciones de este Tema
            if (tema.evaluaciones && tema.evaluaciones.length > 0) {
                for (const evaluacion of tema.evaluaciones) {
                    const resEval = await pool.query(
                        'INSERT INTO Evaluacion (titulo, id_tema) VALUES ($1, $2) RETURNING id_evaluacion',
                        [evaluacion.titulo, idTema]
                    );
                    const idEvaluacion = resEval.rows[0].id_evaluacion;

                    // 6. Guardamos las Preguntas de esta Evaluación
                    if (evaluacion.preguntas && evaluacion.preguntas.length > 0) {
                        for (const pregunta of evaluacion.preguntas) {
                            const resPreg = await pool.query(
                                'INSERT INTO Pregunta (enunciado, tipo, id_evaluacion) VALUES ($1, $2, $3) RETURNING id_pregunta',
                                [pregunta.enunciado, pregunta.tipo, idEvaluacion]
                            );
                            const idPregunta = resPreg.rows[0].id_pregunta;

                            // 7. Guardamos las Opciones de respuesta para la calificación automática
                            if (pregunta.opciones && pregunta.opciones.length > 0) {
                                for (const opcion of pregunta.opciones) {
                                    await pool.query(
                                        'INSERT INTO Opcion (texto_opcion, es_correcta, id_pregunta) VALUES ($1, $2, $3)',
                                        [opcion.texto, opcion.es_correcta, idPregunta]
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }

        // Si todo el proceso anterior fue exitoso, confirmamos los cambios en la base de datos
        await pool.query('COMMIT');
        res.status(200).json({ mensaje: 'Estructura del curso guardada exitosamente.' });

    } catch (error) {
        // Si hubo algún error (ej. falta un dato), deshacemos todo
        await pool.query('ROLLBACK');
        console.error('Error al guardar el curso complejo:', error);
        res.status(500).json({ error: 'Fallo al procesar y guardar la estructura del curso.' });
    }
});

// Ruta para obtener todos los estudiantes disponibles para inscribir
app.get('/api/estudiantes-disponibles', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_estudiante, nombre, nivel, codigo_vinculacion FROM Estudiante');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener estudiantes:', error);
        res.status(500).json({ error: 'Fallo al cargar la lista de estudiantes.' });
    }
});

// Ruta para guardar un curso dinámico completo
app.post('/api/crear-curso-dinamico', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;

    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { nombreCurso, estudiantesSeleccionados, estructura } = req.body;

    try {
        await pool.query('BEGIN'); // Iniciamos la transacción segura

        // 1. Creamos el curso general (Clase) asignado a este docente
        const resClase = await pool.query(
            'INSERT INTO Clase (nombre, id_mentor) VALUES ($1, $2) RETURNING id_clase',
            [nombreCurso, idUsuario]
        );
        const idClase = resClase.rows[0].id_clase;

        // 2. Inscribimos a los estudiantes seleccionados
        if (estudiantesSeleccionados && estudiantesSeleccionados.length > 0) {
            for (const idEstudiante of estudiantesSeleccionados) {
                await pool.query(
                    'INSERT INTO Clase_Estudiante (id_clase, id_estudiante) VALUES ($1, $2)',
                    [idClase, idEstudiante]
                );
            }
        }

        // 3. Guardamos los módulos (Temas)
        for (const modulo of estructura) {
            const resTema = await pool.query(
                'INSERT INTO Tema (nombre_tema, id_clase) VALUES ($1, $2) RETURNING id_tema',
                [modulo.nombre, idClase]
            );
            const idTema = resTema.rows[0].id_tema;

            // 4. Guardamos la lección (texto) del módulo
            if (modulo.leccion) {
                await pool.query(
                    'INSERT INTO Leccion (titulo, contenido, id_tema) VALUES ($1, $2, $3)',
                    ['Lección Principal', modulo.leccion, idTema]
                );
            }

            // 5. Si el módulo tiene un quiz, lo guardamos
            if (modulo.quiz) {
                const resEval = await pool.query(
                    'INSERT INTO Evaluacion (titulo, id_tema) VALUES ($1, $2) RETURNING id_evaluacion',
                    [modulo.quiz.titulo, idTema]
                );
                const idEvaluacion = resEval.rows[0].id_evaluacion;

                // 6. Guardamos preguntas y opciones del quiz
                for (const pregunta of modulo.quiz.preguntas) {
                    const resPreg = await pool.query(
                        'INSERT INTO Pregunta (enunciado, tipo, id_evaluacion) VALUES ($1, $2, $3) RETURNING id_pregunta',
                        [pregunta.enunciado, pregunta.tipo, idEvaluacion]
                    );
                    const idPregunta = resPreg.rows[0].id_pregunta;

                    for (const opcion of pregunta.opciones) {
                        await pool.query(
                            'INSERT INTO Opcion (texto_opcion, es_correcta, id_pregunta) VALUES ($1, $2, $3)',
                            [opcion.texto, opcion.esCorrecta, idPregunta]
                        );
                    }
                }
            }
        }

        await pool.query('COMMIT'); // Guardamos todo permanentemente
        res.status(200).json({ mensaje: '¡Curso dinámico creado exitosamente!' });
    } catch (error) {
        await pool.query('ROLLBACK'); // Revertimos si hay error
        console.error('Error en transacción de curso:', error);
        res.status(500).json({ error: 'Error interno al guardar el curso.' });
    }
});

// =========================================================================
// GAMIFICACIÓN Y RETOS (RF2)
// =========================================================================

// Insignias del ecosistema: se calculan automáticamente a partir del desempeño
function calcularInsignias(stats) {
    return [
        { icono: '⚡', titulo: 'Primer impulso', descripcion: 'Completa tu primer reto.', obtenida: stats.retosCompletados >= 1 },
        { icono: '🧠', titulo: 'Constructor lógico', descripcion: 'Completa 3 retos o más.', obtenida: stats.retosCompletados >= 3 },
        { icono: '🏅', titulo: 'Campeón de olimpiada', descripcion: 'Responde correctamente un reto de olimpiada.', obtenida: stats.olimpiadasGanadas >= 1 },
        { icono: '🎯', titulo: 'Precisión total', descripcion: 'Logra 5 respuestas correctas.', obtenida: stats.respuestasCorrectas >= 5 },
        { icono: '🚀', titulo: 'Explorador de rutas', descripcion: 'Ten una ruta de aprendizaje activa.', obtenida: stats.rutasActivas >= 1 },
        { icono: '🧩', titulo: 'Arquitecto del conocimiento', descripcion: 'Supera los 300 puntos.', obtenida: stats.puntosTotales >= 300 }
    ];
}

// Crear un reto, olimpiada o juego matemático (solo Mentores y Administradores)
app.post('/api/retos', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { titulo, descripcion, tipo, area, puntos, pregunta, opciones, respuestaCorrecta } = req.body;

    if (!titulo || !pregunta || !respuestaCorrecta) {
        return res.status(400).json({ error: 'El título, la pregunta y la respuesta correcta son obligatorios.' });
    }

    try {
        const resPrivilegios = await pool.query(
            'SELECT id_mentor FROM Mentor WHERE id_mentor = $1 UNION SELECT id_admin FROM Administrador WHERE id_admin = $1',
            [idUsuario]
        );
        if (resPrivilegios.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado. Solo el personal docente puede crear retos.' });
        }

        const nuevoReto = await pool.query(
            `INSERT INTO Reto (titulo, descripcion, tipo, area, puntos, pregunta, opciones, respuesta_correcta, creado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_reto`,
            [titulo, descripcion || '', tipo || 'semanal', area || 'General', puntos || 50, pregunta, opciones || '', respuestaCorrecta.trim(), idUsuario]
        );

        res.status(200).json({ mensaje: 'Reto publicado exitosamente.', id_reto: nuevoReto.rows[0].id_reto });
    } catch (error) {
        console.error('Error al crear el reto:', error);
        res.status(500).json({ error: 'Fallo interno al crear el reto.' });
    }
});

// Listar los retos activos, indicando si el estudiante ya los resolvió
app.get('/api/retos', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    try {
        const result = await pool.query(
            `SELECT r.id_reto, r.titulo, r.descripcion, r.tipo, r.area, r.puntos, r.pregunta, r.opciones,
                    i.es_correcta, i.puntos_obtenidos,
                    (i.id_intento IS NOT NULL) AS respondido
             FROM Reto r
             LEFT JOIN Reto_Intento i ON r.id_reto = i.id_reto AND i.id_estudiante = $1
             WHERE r.activo = TRUE
             ORDER BY r.fecha_creacion DESC`,
            [idUsuario]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener retos:', error);
        res.status(500).json({ error: 'Fallo al cargar los retos.' });
    }
});

// Responder un reto: validación automática de la respuesta y asignación inmediata del puntaje
app.post('/api/retos/:idReto/responder', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { idReto } = req.params;
    const { respuesta } = req.body;

    if (respuesta === undefined || respuesta === null || String(respuesta).trim() === '') {
        return res.status(400).json({ error: 'Debes escribir o seleccionar una respuesta.' });
    }

    try {
        const resReto = await pool.query('SELECT respuesta_correcta, puntos FROM Reto WHERE id_reto = $1 AND activo = TRUE', [idReto]);
        if (resReto.rows.length === 0) {
            return res.status(404).json({ error: 'El reto no existe o ya no está disponible.' });
        }

        const reto = resReto.rows[0];
        const esCorrecta = String(respuesta).trim().toLowerCase() === reto.respuesta_correcta.trim().toLowerCase();
        const puntosObtenidos = esCorrecta ? reto.puntos : 0;

        const intento = await pool.query(
            `INSERT INTO Reto_Intento (id_reto, id_estudiante, respuesta, es_correcta, puntos_obtenidos)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id_reto, id_estudiante) DO NOTHING
             RETURNING id_intento`,
            [idReto, idUsuario, String(respuesta).trim(), esCorrecta, puntosObtenidos]
        );

        if (intento.rowCount === 0) {
            return res.status(400).json({ error: 'Ya habías respondido este reto anteriormente.' });
        }

        // Registramos la actividad para las alertas de desmotivación del panel de padres
        await pool.query('UPDATE Estudiante SET ultima_actividad = NOW() WHERE id_estudiante = $1', [idUsuario]);

        res.status(200).json({
            correcta: esCorrecta,
            puntos: puntosObtenidos,
            mensaje: esCorrecta
                ? `¡Respuesta correcta! Ganaste ${puntosObtenidos} puntos.`
                : 'Respuesta incorrecta. ¡Sigue practicando para el próximo reto!'
        });
    } catch (error) {
        console.error('Error al responder el reto:', error);
        res.status(500).json({ error: 'Fallo al procesar tu respuesta.' });
    }
});

// =========================================================================
// PANEL INTEGRAL DEL ESTUDIANTE (RF5)
// =========================================================================

// Consulta reutilizable: estadísticas completas de un estudiante
async function obtenerEstadisticasEstudiante(idEstudiante) {
    const resEstudiante = await pool.query(
        'SELECT nombre, nivel, codigo_vinculacion, ultima_actividad FROM Estudiante WHERE id_estudiante = $1',
        [idEstudiante]
    );
    if (resEstudiante.rows.length === 0) return null;

    const resIntentos = await pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE es_correcta)::int AS correctas,
                COALESCE(SUM(puntos_obtenidos), 0)::int AS puntos,
                COUNT(*) FILTER (WHERE es_correcta AND id_reto IN (SELECT id_reto FROM Reto WHERE tipo = 'olimpiada'))::int AS olimpiadas
         FROM Reto_Intento WHERE id_estudiante = $1`,
        [idEstudiante]
    );

    const resRutas = await pool.query(
        `SELECT r.id_ruta, r.nombre_curso, r.area, r.url_coursera, er.progreso_porcentaje
         FROM Ruta_Aprendizaje r JOIN Estudiante_Ruta er ON r.id_ruta = er.id_ruta
         WHERE er.id_estudiante = $1`,
        [idEstudiante]
    );

    const resRetosPendientes = await pool.query(
        `SELECT COUNT(*)::int AS pendientes FROM Reto r
         WHERE r.activo = TRUE AND NOT EXISTS (
            SELECT 1 FROM Reto_Intento i WHERE i.id_reto = r.id_reto AND i.id_estudiante = $1
         )`,
        [idEstudiante]
    );

    const resOrientaciones = await pool.query(
        `SELECT s.mensaje, s.fecha, m.nombre AS nombre_mentor
         FROM Seguimiento s LEFT JOIN Mentor m ON s.id_mentor = m.id_mentor
         WHERE s.id_estudiante = $1 AND s.tipo = 'orientacion'
         ORDER BY s.fecha DESC LIMIT 5`,
        [idEstudiante]
    );

    const intentos = resIntentos.rows[0];
    const stats = {
        retosCompletados: intentos.total,
        respuestasCorrectas: intentos.correctas,
        olimpiadasGanadas: intentos.olimpiadas,
        puntosTotales: intentos.puntos,
        rutasActivas: resRutas.rows.length
    };

    const promedioProgreso = resRutas.rows.length
        ? Math.round(resRutas.rows.reduce((suma, ruta) => suma + ruta.progreso_porcentaje, 0) / resRutas.rows.length)
        : 0;

    return {
        perfil: resEstudiante.rows[0],
        puntos: stats.puntosTotales,
        nivel: Math.floor(stats.puntosTotales / 100) + 1,
        progresoNivel: stats.puntosTotales % 100,
        retosCompletados: stats.retosCompletados,
        respuestasCorrectas: stats.respuestasCorrectas,
        retosPendientes: resRetosPendientes.rows[0].pendientes,
        promedioProgreso: promedioProgreso,
        rutas: resRutas.rows,
        insignias: calcularInsignias(stats),
        orientaciones: resOrientaciones.rows
    };
}

// Recomendaciones personalizadas según el desempeño reciente del estudiante
function generarRecomendaciones(panel) {
    const recomendaciones = [];
    if (panel.retosPendientes > 0) {
        recomendaciones.push(`Tienes ${panel.retosPendientes} reto(s) pendiente(s). ¡Resuélvelos para ganar puntos!`);
    }
    const rutaRezagada = panel.rutas.find(ruta => ruta.progreso_porcentaje < 50);
    if (rutaRezagada) {
        recomendaciones.push(`Retoma la ruta "${rutaRezagada.nombre_curso}" (${rutaRezagada.area}), vas en ${rutaRezagada.progreso_porcentaje}%.`);
    }
    if (panel.retosCompletados > 0 && panel.respuestasCorrectas / panel.retosCompletados < 0.5) {
        recomendaciones.push('Repasa las lecciones de tus rutas antes de intentar el próximo reto: la precisión es clave.');
    }
    if (panel.rutas.length === 0) {
        recomendaciones.push('Aún no tienes rutas de aprendizaje. Pídele a tu mentor que te asigne una.');
    }
    if (recomendaciones.length === 0) {
        recomendaciones.push('¡Excelente trabajo! Mantén tu ritmo y busca el siguiente nivel.');
    }
    return recomendaciones;
}

// Panel personalizado: progreso, rutas, logros, retos, estadísticas y recomendaciones
app.get('/api/panel-estudiante', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado. Debes iniciar sesión.' });

    try {
        const panel = await obtenerEstadisticasEstudiante(idUsuario);
        if (!panel) return res.status(404).json({ error: 'No se encontró tu perfil de estudiante.' });

        panel.recomendaciones = generarRecomendaciones(panel);

        // Actualizamos el registro de actividad del estudiante
        await pool.query('UPDATE Estudiante SET ultima_actividad = NOW() WHERE id_estudiante = $1', [idUsuario]);

        res.status(200).json(panel);
    } catch (error) {
        console.error('Error al cargar el panel del estudiante:', error);
        res.status(500).json({ error: 'La información no está disponible temporalmente. Intenta de nuevo.' });
    }
});

// Actualizar el progreso de una ruta de aprendizaje del estudiante
app.post('/api/rutas/:idRuta/progreso', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { idRuta } = req.params;
    const progreso = Math.max(0, Math.min(100, parseInt(req.body.progreso, 10) || 0));

    try {
        const result = await pool.query(
            'UPDATE Estudiante_Ruta SET progreso_porcentaje = $1 WHERE id_estudiante = $2 AND id_ruta = $3',
            [progreso, idUsuario, idRuta]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'No tienes asignada esa ruta.' });

        await pool.query('UPDATE Estudiante SET ultima_actividad = NOW() WHERE id_estudiante = $1', [idUsuario]);
        res.status(200).json({ mensaje: 'Progreso actualizado.', progreso });
    } catch (error) {
        console.error('Error al actualizar progreso:', error);
        res.status(500).json({ error: 'Fallo al guardar el progreso.' });
    }
});

// =========================================================================
// PANEL PARA PADRES (RF3)
// =========================================================================

// Vincular un estudiante después del registro (manejo de cuenta no vinculada)
app.post('/api/vincular-estudiante', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const codigoLimpio = (req.body.codigo || '').trim().toUpperCase();
    if (!codigoLimpio) return res.status(400).json({ error: 'Debes ingresar el código de vinculación.' });

    try {
        const resPadre = await pool.query('SELECT id_padre FROM Padre WHERE id_padre = $1', [idUsuario]);
        if (resPadre.rows.length === 0) {
            return res.status(403).json({ error: 'Solo las cuentas de padre pueden vincular estudiantes.' });
        }

        const result = await pool.query(
            'UPDATE Estudiante SET id_padre = $1 WHERE codigo_vinculacion = $2 RETURNING nombre',
            [idUsuario, codigoLimpio]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'El código ingresado no corresponde a ningún estudiante.' });
        }

        res.status(200).json({ mensaje: `Vinculación exitosa con ${result.rows[0].nombre}.` });
    } catch (error) {
        console.error('Error al vincular estudiante:', error);
        res.status(500).json({ error: 'Fallo al procesar la vinculación.' });
    }
});

// Panel del padre: progreso, fortalezas y alertas de desmotivación de sus hijos
app.get('/api/panel-padre', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    try {
        const resHijos = await pool.query('SELECT id_estudiante FROM Estudiante WHERE id_padre = $1', [idUsuario]);

        const hijos = [];
        for (const hijo of resHijos.rows) {
            const panel = await obtenerEstadisticasEstudiante(hijo.id_estudiante);
            if (!panel) continue;

            // Alerta de desmotivación: más de 7 días sin actividad registrada
            const diasInactivo = panel.perfil.ultima_actividad
                ? Math.floor((Date.now() - new Date(panel.perfil.ultima_actividad).getTime()) / (1000 * 60 * 60 * 24))
                : null;

            const alertas = [];
            if (diasInactivo === null || diasInactivo > 7) {
                alertas.push('Posible desmotivación: lleva más de una semana sin actividad en la plataforma.');
            }
            if (panel.retosCompletados >= 3 && panel.respuestasCorrectas / panel.retosCompletados < 0.4) {
                alertas.push('Está intentando los retos pero con baja precisión. Podría necesitar acompañamiento.');
            }

            // Fortalezas explicadas en lenguaje sencillo
            const fortalezas = [];
            if (panel.respuestasCorrectas >= 3) fortalezas.push('Resuelve problemas matemáticos con buena precisión.');
            if (panel.promedioProgreso >= 50) fortalezas.push('Avanza de forma constante en sus rutas de aprendizaje.');
            if (panel.insignias.filter(i => i.obtenida).length >= 2) fortalezas.push('Se motiva con los logros y colecciona insignias.');
            if (fortalezas.length === 0) fortalezas.push('Está comenzando su camino: anímalo a completar su primer reto.');

            hijos.push({
                id_estudiante: hijo.id_estudiante,
                nombre: panel.perfil.nombre,
                nivel: panel.nivel,
                puntos: panel.puntos,
                retosCompletados: panel.retosCompletados,
                promedioProgreso: panel.promedioProgreso,
                rutas: panel.rutas,
                insignias: panel.insignias.filter(i => i.obtenida),
                diasInactivo: diasInactivo,
                alertas: alertas,
                fortalezas: fortalezas,
                orientaciones: panel.orientaciones
            });
        }

        res.status(200).json({ hijos });
    } catch (error) {
        console.error('Error al cargar el panel del padre:', error);
        res.status(500).json({ error: 'Fallo al cargar la información de seguimiento.' });
    }
});

// =========================================================================
// PANEL DE MENTORÍA Y GESTIÓN DOCENTE (RF4)
// =========================================================================

// Listar los estudiantes asignados al mentor (a través de sus clases) con sus estadísticas
app.get('/api/estudiantes-mentor', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    try {
        const resPrivilegios = await pool.query(
            'SELECT id_mentor FROM Mentor WHERE id_mentor = $1 UNION SELECT id_admin FROM Administrador WHERE id_admin = $1',
            [idUsuario]
        );
        if (resPrivilegios.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado. Solo para personal docente.' });
        }

        const resEstudiantes = await pool.query(
            `SELECT DISTINCT e.id_estudiante, e.nombre, e.nivel, e.ultima_actividad
             FROM Estudiante e
             JOIN Clase_Estudiante ce ON e.id_estudiante = ce.id_estudiante
             JOIN Clase c ON ce.id_clase = c.id_clase
             WHERE c.id_mentor = $1`,
            [idUsuario]
        );

        const estudiantes = [];
        for (const est of resEstudiantes.rows) {
            const resPuntos = await pool.query(
                `SELECT COALESCE(SUM(puntos_obtenidos), 0)::int AS puntos,
                        COUNT(*)::int AS retos,
                        COUNT(*) FILTER (WHERE es_correcta)::int AS correctas
                 FROM Reto_Intento WHERE id_estudiante = $1`,
                [est.id_estudiante]
            );
            estudiantes.push({ ...est, ...resPuntos.rows[0] });
        }

        res.status(200).json(estudiantes);
    } catch (error) {
        console.error('Error al obtener estudiantes del mentor:', error);
        res.status(500).json({ error: 'Fallo al cargar los estudiantes.' });
    }
});

// Registrar una orientación personalizada o una nota privada de seguimiento
app.post('/api/seguimiento', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { idEstudiante, tipo, mensaje } = req.body;

    // Manejo de situación anormal: orientación vacía o sin destinatario
    if (!idEstudiante || !mensaje || !mensaje.trim()) {
        return res.status(400).json({ error: 'Los campos de comunicación son obligatorios: selecciona un estudiante y escribe un mensaje.' });
    }

    try {
        const resMentor = await pool.query('SELECT id_mentor FROM Mentor WHERE id_mentor = $1', [idUsuario]);
        const resAdmin = await pool.query('SELECT id_admin FROM Administrador WHERE id_admin = $1', [idUsuario]);
        if (resMentor.rows.length === 0 && resAdmin.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado. Solo para personal docente.' });
        }

        // Manejo de situación anormal: estudiante no asignado al mentor (los admins no tienen restricción)
        if (resAdmin.rows.length === 0) {
            const resAsignado = await pool.query(
                `SELECT 1 FROM Clase_Estudiante ce
                 JOIN Clase c ON ce.id_clase = c.id_clase
                 WHERE c.id_mentor = $1 AND ce.id_estudiante = $2`,
                [idUsuario, idEstudiante]
            );
            if (resAsignado.rows.length === 0) {
                return res.status(403).json({ error: 'No tienes permisos para registrar información sobre ese estudiante: no está asignado a tus clases.' });
            }
        }

        await pool.query(
            'INSERT INTO Seguimiento (id_mentor, id_estudiante, tipo, mensaje) VALUES ($1, $2, $3, $4)',
            [idUsuario, idEstudiante, tipo === 'nota' ? 'nota' : 'orientacion', mensaje.trim()]
        );

        res.status(200).json({ mensaje: tipo === 'nota' ? 'Nota de seguimiento registrada.' : 'Orientación enviada al estudiante.' });
    } catch (error) {
        console.error('Error al registrar seguimiento:', error);
        res.status(500).json({ error: 'Fallo al guardar el seguimiento.' });
    }
});

// Consultar el historial de seguimiento de un estudiante (restringido al personal docente)
app.get('/api/seguimiento/:idEstudiante', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { idEstudiante } = req.params;

    try {
        const resPrivilegios = await pool.query(
            'SELECT id_mentor FROM Mentor WHERE id_mentor = $1 UNION SELECT id_admin FROM Administrador WHERE id_admin = $1',
            [idUsuario]
        );
        if (resPrivilegios.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso denegado. Los reportes pedagógicos son exclusivos del personal docente.' });
        }

        const result = await pool.query(
            `SELECT s.tipo, s.mensaje, s.fecha, m.nombre AS nombre_mentor
             FROM Seguimiento s LEFT JOIN Mentor m ON s.id_mentor = m.id_mentor
             WHERE s.id_estudiante = $1 ORDER BY s.fecha DESC`,
            [idEstudiante]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al consultar seguimiento:', error);
        res.status(500).json({ error: 'Fallo al cargar el historial.' });
    }
});

// =========================================================================
// CURSOS DEL DOCENTE VISTOS POR EL ESTUDIANTE
// =========================================================================

// Listar las clases en las que está inscrito el estudiante
app.get('/api/mis-clases', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    try {
        const result = await pool.query(
            `SELECT c.id_clase, c.nombre, m.nombre AS nombre_mentor,
                    (SELECT COUNT(*)::int FROM Tema t WHERE t.id_clase = c.id_clase) AS total_modulos
             FROM Clase c
             JOIN Clase_Estudiante ce ON c.id_clase = ce.id_clase
             LEFT JOIN Mentor m ON c.id_mentor = m.id_mentor
             WHERE ce.id_estudiante = $1
             ORDER BY c.id_clase`,
            [idUsuario]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error al obtener las clases del estudiante:', error);
        res.status(500).json({ error: 'Fallo al cargar tus cursos.' });
    }
});

// Contenido completo de una clase: módulos, lecciones y quizzes.
// Las opciones se envían SIN el campo es_correcta: la calificación es del servidor.
app.get('/api/clases/:idClase/contenido', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { idClase } = req.params;

    try {
        // El estudiante debe estar inscrito, o el usuario ser el mentor dueño / un admin
        const resAcceso = await pool.query(
            `SELECT 1 FROM Clase_Estudiante WHERE id_clase = $1 AND id_estudiante = $2
             UNION SELECT 1 FROM Clase WHERE id_clase = $1 AND id_mentor = $2
             UNION SELECT 1 FROM Administrador WHERE id_admin = $2`,
            [idClase, idUsuario]
        );
        if (resAcceso.rows.length === 0) {
            return res.status(403).json({ error: 'No estás inscrito en este curso.' });
        }

        const resClase = await pool.query(
            `SELECT c.nombre, m.nombre AS nombre_mentor
             FROM Clase c LEFT JOIN Mentor m ON c.id_mentor = m.id_mentor
             WHERE c.id_clase = $1`,
            [idClase]
        );
        if (resClase.rows.length === 0) return res.status(404).json({ error: 'El curso no existe.' });

        const resTemas = await pool.query(
            'SELECT id_tema, nombre_tema FROM Tema WHERE id_clase = $1 ORDER BY id_tema',
            [idClase]
        );

        const temas = [];
        for (const tema of resTemas.rows) {
            const resLecciones = await pool.query(
                'SELECT titulo, contenido FROM Leccion WHERE id_tema = $1 ORDER BY id_leccion',
                [tema.id_tema]
            );

            const resEvaluaciones = await pool.query(
                'SELECT id_evaluacion, titulo FROM Evaluacion WHERE id_tema = $1 ORDER BY id_evaluacion',
                [tema.id_tema]
            );

            const evaluaciones = [];
            for (const evaluacion of resEvaluaciones.rows) {
                const resPreguntas = await pool.query(
                    'SELECT id_pregunta, enunciado, tipo FROM Pregunta WHERE id_evaluacion = $1 ORDER BY id_pregunta',
                    [evaluacion.id_evaluacion]
                );

                const preguntas = [];
                for (const pregunta of resPreguntas.rows) {
                    const resOpciones = await pool.query(
                        'SELECT id_opcion, texto_opcion FROM Opcion WHERE id_pregunta = $1 ORDER BY id_opcion',
                        [pregunta.id_pregunta]
                    );
                    preguntas.push({ ...pregunta, opciones: resOpciones.rows });
                }

                evaluaciones.push({ ...evaluacion, preguntas });
            }

            temas.push({
                id_tema: tema.id_tema,
                nombre_tema: tema.nombre_tema,
                lecciones: resLecciones.rows,
                evaluaciones: evaluaciones
            });
        }

        res.status(200).json({ ...resClase.rows[0], temas });
    } catch (error) {
        console.error('Error al cargar el contenido del curso:', error);
        res.status(500).json({ error: 'Fallo al cargar el contenido del curso.' });
    }
});

// Calificación automática de un quiz del curso.
// Recibe { respuestas: { idPregunta: [idOpcion, ...] } } y devuelve el puntaje.
app.post('/api/evaluaciones/:idEvaluacion/responder', async (req, res) => {
    const auth = getAuth(req);
    const idUsuario = auth.userId;
    if (!idUsuario) return res.status(401).json({ error: 'No autorizado' });

    const { idEvaluacion } = req.params;
    const respuestas = req.body.respuestas || {};

    try {
        // Verificamos que el estudiante esté inscrito en la clase dueña de esta evaluación
        const resAcceso = await pool.query(
            `SELECT 1 FROM Evaluacion e
             JOIN Tema t ON e.id_tema = t.id_tema
             JOIN Clase_Estudiante ce ON t.id_clase = ce.id_clase
             WHERE e.id_evaluacion = $1 AND ce.id_estudiante = $2`,
            [idEvaluacion, idUsuario]
        );
        if (resAcceso.rows.length === 0) {
            return res.status(403).json({ error: 'No estás inscrito en el curso de esta evaluación.' });
        }

        const resPreguntas = await pool.query(
            'SELECT id_pregunta FROM Pregunta WHERE id_evaluacion = $1',
            [idEvaluacion]
        );

        let correctas = 0;
        const detalle = [];

        for (const pregunta of resPreguntas.rows) {
            const resCorrectas = await pool.query(
                'SELECT id_opcion FROM Opcion WHERE id_pregunta = $1 AND es_correcta = TRUE',
                [pregunta.id_pregunta]
            );
            const idsCorrectos = resCorrectas.rows.map(o => o.id_opcion).sort();
            const idsMarcados = (respuestas[pregunta.id_pregunta] || []).map(Number).sort();

            const acierto = idsCorrectos.length === idsMarcados.length &&
                idsCorrectos.every((id, i) => id === idsMarcados[i]);

            if (acierto) correctas++;
            detalle.push({ id_pregunta: pregunta.id_pregunta, correcta: acierto });
        }

        await pool.query('UPDATE Estudiante SET ultima_actividad = NOW() WHERE id_estudiante = $1', [idUsuario]);

        res.status(200).json({
            total: resPreguntas.rows.length,
            correctas: correctas,
            detalle: detalle,
            mensaje: `Obtuviste ${correctas} de ${resPreguntas.rows.length} respuestas correctas.`
        });
    } catch (error) {
        console.error('Error al calificar la evaluación:', error);
        res.status(500).json({ error: 'Fallo al calificar la evaluación.' });
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