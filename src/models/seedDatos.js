// Archivo: src/models/seedDatos.js
// Llena la base de datos con datos de demostración (mockups).
// Es idempotente: se puede ejecutar varias veces sin duplicar registros.
// Uso: node src/models/seedDatos.js

const pool = require('../config/db');

// IDs ficticios para las cuentas demo (no tienen login real en Clerk,
// pero permiten ver los paneles con información realista).
const ID_MENTOR = 'mentor_demo_lumen';
const ID_PADRE = 'padre_demo_lumen';

const estudiantes = [
    // ultima_actividad se calcula con un desfase en días (0 = hoy)
    { id: 'estudiante_demo_1', nombre: 'Valentina Ríos',   edad: 12, nivel: 'Básico',     codigo: 'DEMO01', padre: ID_PADRE, diasInactivo: 0 },
    { id: 'estudiante_demo_2', nombre: 'Samuel Charris',   edad: 14, nivel: 'Intermedio', codigo: 'DEMO02', padre: ID_PADRE, diasInactivo: 10 },
    { id: 'estudiante_demo_3', nombre: 'María José Pérez', edad: 11, nivel: 'Básico',     codigo: 'DEMO03', padre: null,     diasInactivo: 1 },
    { id: 'estudiante_demo_4', nombre: 'Andrés Molina',    edad: 15, nivel: 'Avanzado',   codigo: 'DEMO04', padre: null,     diasInactivo: 2 },
    { id: 'estudiante_demo_5', nombre: 'Luciana Ortega',   edad: 13, nivel: 'Intermedio', codigo: 'DEMO05', padre: null,     diasInactivo: 0 },
    { id: 'estudiante_demo_6', nombre: 'Deivis Barrios',   edad: 16, nivel: 'Avanzado',   codigo: 'DEMO06', padre: null,     diasInactivo: 4 },
];

const rutas = [
    {
        nombre: 'Introducción a la Teoría de Grafos',
        area: 'Matemática Elemental',
        url: 'https://www.coursera.org/learn/graphs',
        asignaciones: [
            { estudiante: 'estudiante_demo_1', progreso: 40 },
            { estudiante: 'estudiante_demo_4', progreso: 85 },
            { estudiante: 'estudiante_demo_5', progreso: 20 },
        ],
    },
    {
        nombre: 'Programación para Todos (Python)',
        area: 'Pensamiento Computacional',
        url: 'https://www.coursera.org/learn/python',
        asignaciones: [
            { estudiante: 'estudiante_demo_2', progreso: 15 },
            { estudiante: 'estudiante_demo_3', progreso: 55 },
            { estudiante: 'estudiante_demo_6', progreso: 70 },
        ],
    },
    {
        nombre: 'Finanzas Personales para Jóvenes',
        area: 'Cultura Financiera',
        url: 'https://www.coursera.org/learn/financial-planning',
        asignaciones: [
            { estudiante: 'estudiante_demo_1', progreso: 10 },
            { estudiante: 'estudiante_demo_6', progreso: 30 },
        ],
    },
];

const cursos = [
    {
        nombre: 'Matemáticas Creativas 7°',
        estudiantes: ['estudiante_demo_1', 'estudiante_demo_3', 'estudiante_demo_5'],
        modulos: [
            {
                nombre: 'Unidad 1: Patrones y secuencias',
                leccion: {
                    titulo: 'Descubriendo patrones',
                    contenido: 'Un patrón es una regla que se repite. En esta lección aprenderás a identificar secuencias numéricas y geométricas observando cómo cambian sus elementos paso a paso. Por ejemplo, en la secuencia 2, 4, 8, 16... cada número es el doble del anterior.',
                },
                quiz: {
                    titulo: 'Quiz de patrones',
                    pregunta: '¿Cuál es el siguiente número en la secuencia 3, 6, 12, 24, ...?',
                    opciones: [
                        { texto: '48', correcta: true },
                        { texto: '36', correcta: false },
                        { texto: '30', correcta: false },
                    ],
                },
            },
            {
                nombre: 'Unidad 2: Fracciones en la vida real',
                leccion: {
                    titulo: 'Fracciones cotidianas',
                    contenido: 'Las fracciones están en todas partes: al repartir una pizza, al medir ingredientes o al leer descuentos. Aquí aprenderás a sumar y comparar fracciones usando ejemplos del día a día en tu barrio.',
                },
                quiz: {
                    titulo: 'Quiz de fracciones',
                    pregunta: 'Si repartes una torta en 8 partes iguales y comes 2, ¿qué fracción comiste?',
                    opciones: [
                        { texto: '1/4', correcta: true },
                        { texto: '1/8', correcta: false },
                        { texto: '1/2', correcta: false },
                    ],
                },
            },
        ],
    },
    {
        nombre: 'Pensamiento Computacional 8°',
        estudiantes: ['estudiante_demo_2', 'estudiante_demo_4', 'estudiante_demo_6'],
        modulos: [
            {
                nombre: 'Módulo 1: ¿Qué es un algoritmo?',
                leccion: {
                    titulo: 'Algoritmos paso a paso',
                    contenido: 'Un algoritmo es una lista ordenada de pasos para resolver un problema, como una receta de cocina. En este módulo escribirás tus primeros algoritmos en lenguaje natural para tareas cotidianas.',
                },
                quiz: {
                    titulo: 'Quiz de algoritmos',
                    pregunta: '¿Cuál de estas opciones describe mejor un algoritmo?',
                    opciones: [
                        { texto: 'Una secuencia ordenada de pasos para resolver un problema', correcta: true },
                        { texto: 'Un lenguaje de programación', correcta: false },
                        { texto: 'Un tipo de computador', correcta: false },
                    ],
                },
            },
            {
                nombre: 'Módulo 2: Descomposición de problemas',
                leccion: {
                    titulo: 'Divide y vencerás',
                    contenido: 'Los problemas grandes se resuelven mejor dividiéndolos en partes pequeñas. Aprenderás la técnica de descomposición, base del pensamiento computacional, con retos prácticos.',
                },
                quiz: null,
            },
        ],
    },
];

const retos = [
    {
        titulo: 'Reto semanal: La secuencia escondida',
        descripcion: 'Observa el patrón con atención antes de responder.',
        tipo: 'semanal', area: 'Lógica', puntos: 50,
        pregunta: '¿Cuál es el siguiente número en la serie 1, 1, 2, 3, 5, 8, ...?',
        opciones: '11|13|15',
        respuesta: '13',
    },
    {
        titulo: 'Reto semanal: Ecuación exprés',
        descripcion: 'Resuelve la ecuación y escribe solo el número.',
        tipo: 'semanal', area: 'Álgebra', puntos: 40,
        pregunta: 'Si 4x - 8 = 20, ¿cuánto vale x?',
        opciones: '',
        respuesta: '7',
    },
    {
        titulo: 'Reto semanal: Geometría del barrio',
        descripcion: 'Piensa en las áreas de las figuras que ves todos los días.',
        tipo: 'semanal', area: 'Geometría', puntos: 45,
        pregunta: 'Una cancha rectangular mide 20 m por 12 m. ¿Cuál es su área?',
        opciones: '240 m²|120 m²|64 m²',
        respuesta: '240 m²',
    },
    {
        titulo: 'Olimpiada LumenKids: Ronda de números',
        descripcion: 'Primera ronda de la olimpiada interna. ¡Suerte!',
        tipo: 'olimpiada', area: 'Aritmética', puntos: 100,
        pregunta: '¿Cuál es el menor número primo mayor que 50?',
        opciones: '51|53|57',
        respuesta: '53',
    },
    {
        titulo: 'Olimpiada LumenKids: Ronda de lógica',
        descripcion: 'Segunda ronda: razona antes de elegir.',
        tipo: 'olimpiada', area: 'Lógica', puntos: 120,
        pregunta: 'Tres amigos se reparten 100 dulces. Ana recibe el doble que Beto y Beto el doble que Caro. ¿Cuántos recibe Ana? (Aproxima al entero más cercano)',
        opciones: '57|50|60',
        respuesta: '57',
    },
    {
        titulo: 'Juego: El cruce del río',
        descripcion: 'Clásico acertijo inspirado en 100 años de juegos matemáticos.',
        tipo: 'juego', area: 'Ingenio', puntos: 60,
        pregunta: 'Un granjero debe cruzar un río con un lobo, una cabra y una col. Su bote solo lleva una cosa a la vez. ¿Cuál debe cruzar primero?',
        opciones: 'La cabra|El lobo|La col',
        respuesta: 'La cabra',
    },
    {
        titulo: 'Juego: Cuadrado mágico',
        descripcion: 'En un cuadrado mágico 3x3 con los números del 1 al 9, todas las filas suman lo mismo.',
        tipo: 'juego', area: 'Ingenio', puntos: 55,
        pregunta: '¿Cuánto suma cada fila de un cuadrado mágico 3x3 con los números del 1 al 9?',
        opciones: '',
        respuesta: '15',
    },
];

// Intentos de reto de los estudiantes demo: [índice del reto, estudiante, respuesta dada]
const intentos = [
    { reto: 0, estudiante: 'estudiante_demo_1', respuesta: '13' },
    { reto: 1, estudiante: 'estudiante_demo_1', respuesta: '7' },
    { reto: 5, estudiante: 'estudiante_demo_1', respuesta: 'La cabra' },
    { reto: 0, estudiante: 'estudiante_demo_2', respuesta: '11' },
    { reto: 0, estudiante: 'estudiante_demo_3', respuesta: '13' },
    { reto: 3, estudiante: 'estudiante_demo_4', respuesta: '53' },
    { reto: 4, estudiante: 'estudiante_demo_4', respuesta: '57' },
    { reto: 0, estudiante: 'estudiante_demo_4', respuesta: '13' },
    { reto: 1, estudiante: 'estudiante_demo_4', respuesta: '7' },
    { reto: 6, estudiante: 'estudiante_demo_4', respuesta: '15' },
    { reto: 2, estudiante: 'estudiante_demo_5', respuesta: '120 m²' },
    { reto: 3, estudiante: 'estudiante_demo_6', respuesta: '53' },
    { reto: 5, estudiante: 'estudiante_demo_6', respuesta: 'El lobo' },
];

const orientaciones = [
    { estudiante: 'estudiante_demo_1', tipo: 'orientacion', mensaje: '¡Excelente semana, Valentina! Tu precisión en los retos de lógica mejoró mucho. Te recomiendo avanzar en tu ruta de grafos.' },
    { estudiante: 'estudiante_demo_2', tipo: 'orientacion', mensaje: 'Samuel, te extrañamos en la plataforma. Esta semana hay un juego nuevo de ingenio que te va a encantar, ¡anímate a intentarlo!' },
    { estudiante: 'estudiante_demo_2', tipo: 'nota', mensaje: 'Lleva varios días inactivo. Coordinar llamada con el acudiente para entender la situación.' },
    { estudiante: 'estudiante_demo_4', tipo: 'orientacion', mensaje: 'Andrés, tu desempeño en la olimpiada fue sobresaliente. Vamos a prepararte material de nivel avanzado.' },
];

async function sembrarDatos() {
    try {
        console.log('--- Iniciando carga de datos de demostración ---');

        // 1. Mentor y padre demo
        await pool.query(
            `INSERT INTO Mentor (id_mentor, nombre, correo) VALUES ($1, $2, $3) ON CONFLICT (id_mentor) DO NOTHING`,
            [ID_MENTOR, 'Prof. Carlos Mendoza', 'carlos.mendoza@lumenkids.demo']
        );
        await pool.query(
            `INSERT INTO Padre (id_padre, nombre, correo) VALUES ($1, $2, $3) ON CONFLICT (id_padre) DO NOTHING`,
            [ID_PADRE, 'Rosa Charris', 'rosa.charris@lumenkids.demo']
        );
        console.log('Mentor y padre demo creados.');

        // 2. Estudiantes
        for (const est of estudiantes) {
            await pool.query(
                `INSERT INTO Estudiante (id_estudiante, nombre, edad, nivel, codigo_vinculacion, id_padre, ultima_actividad)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW() - make_interval(days => $7))
                 ON CONFLICT (id_estudiante) DO NOTHING`,
                [est.id, est.nombre, est.edad, est.nivel, est.codigo, est.padre, est.diasInactivo]
            );
        }
        console.log(`${estudiantes.length} estudiantes demo creados.`);

        // 3. Rutas de aprendizaje y asignaciones
        for (const ruta of rutas) {
            let idRuta;
            const existente = await pool.query(
                'SELECT id_ruta FROM Ruta_Aprendizaje WHERE nombre_curso = $1 AND id_mentor = $2',
                [ruta.nombre, ID_MENTOR]
            );
            if (existente.rows.length > 0) {
                idRuta = existente.rows[0].id_ruta;
            } else {
                const nueva = await pool.query(
                    'INSERT INTO Ruta_Aprendizaje (nombre_curso, area, url_coursera, id_mentor) VALUES ($1, $2, $3, $4) RETURNING id_ruta',
                    [ruta.nombre, ruta.area, ruta.url, ID_MENTOR]
                );
                idRuta = nueva.rows[0].id_ruta;
            }

            for (const asignacion of ruta.asignaciones) {
                await pool.query(
                    `INSERT INTO Estudiante_Ruta (id_estudiante, id_ruta, progreso_porcentaje)
                     VALUES ($1, $2, $3) ON CONFLICT (id_estudiante, id_ruta) DO NOTHING`,
                    [asignacion.estudiante, idRuta, asignacion.progreso]
                );
            }
        }
        console.log(`${rutas.length} rutas de aprendizaje creadas y asignadas.`);

        // 4. Cursos (Clases) con módulos, lecciones y quizzes
        for (const curso of cursos) {
            let idClase;
            const claseExistente = await pool.query(
                'SELECT id_clase FROM Clase WHERE nombre = $1 AND id_mentor = $2',
                [curso.nombre, ID_MENTOR]
            );
            if (claseExistente.rows.length > 0) {
                idClase = claseExistente.rows[0].id_clase;
            } else {
                const nuevaClase = await pool.query(
                    'INSERT INTO Clase (nombre, id_mentor) VALUES ($1, $2) RETURNING id_clase',
                    [curso.nombre, ID_MENTOR]
                );
                idClase = nuevaClase.rows[0].id_clase;

                // Los módulos solo se crean junto con la clase para no duplicarlos
                for (const modulo of curso.modulos) {
                    const resTema = await pool.query(
                        'INSERT INTO Tema (nombre_tema, id_clase) VALUES ($1, $2) RETURNING id_tema',
                        [modulo.nombre, idClase]
                    );
                    const idTema = resTema.rows[0].id_tema;

                    await pool.query(
                        'INSERT INTO Leccion (titulo, contenido, id_tema) VALUES ($1, $2, $3)',
                        [modulo.leccion.titulo, modulo.leccion.contenido, idTema]
                    );

                    if (modulo.quiz) {
                        const resEval = await pool.query(
                            'INSERT INTO Evaluacion (titulo, id_tema) VALUES ($1, $2) RETURNING id_evaluacion',
                            [modulo.quiz.titulo, idTema]
                        );
                        const resPreg = await pool.query(
                            'INSERT INTO Pregunta (enunciado, tipo, id_evaluacion) VALUES ($1, $2, $3) RETURNING id_pregunta',
                            [modulo.quiz.pregunta, 'unica', resEval.rows[0].id_evaluacion]
                        );
                        for (const opcion of modulo.quiz.opciones) {
                            await pool.query(
                                'INSERT INTO Opcion (texto_opcion, es_correcta, id_pregunta) VALUES ($1, $2, $3)',
                                [opcion.texto, opcion.correcta, resPreg.rows[0].id_pregunta]
                            );
                        }
                    }
                }
            }

            for (const idEstudiante of curso.estudiantes) {
                await pool.query(
                    `INSERT INTO Clase_Estudiante (id_clase, id_estudiante) VALUES ($1, $2) ON CONFLICT (id_clase, id_estudiante) DO NOTHING`,
                    [idClase, idEstudiante]
                );
            }
        }
        console.log(`${cursos.length} cursos creados con sus módulos y estudiantes inscritos.`);

        // 5. Retos (visibles para todos los estudiantes de la plataforma)
        const idsRetos = [];
        for (const reto of retos) {
            const existente = await pool.query('SELECT id_reto FROM Reto WHERE titulo = $1', [reto.titulo]);
            if (existente.rows.length > 0) {
                idsRetos.push(existente.rows[0].id_reto);
            } else {
                const nuevo = await pool.query(
                    `INSERT INTO Reto (titulo, descripcion, tipo, area, puntos, pregunta, opciones, respuesta_correcta, creado_por)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_reto`,
                    [reto.titulo, reto.descripcion, reto.tipo, reto.area, reto.puntos, reto.pregunta, reto.opciones, reto.respuesta, ID_MENTOR]
                );
                idsRetos.push(nuevo.rows[0].id_reto);
            }
        }
        console.log(`${retos.length} retos publicados (semanales, olimpiadas y juegos).`);

        // 6. Intentos de reto con validación automática
        for (const intento of intentos) {
            const reto = retos[intento.reto];
            const esCorrecta = intento.respuesta.trim().toLowerCase() === reto.respuesta.trim().toLowerCase();
            await pool.query(
                `INSERT INTO Reto_Intento (id_reto, id_estudiante, respuesta, es_correcta, puntos_obtenidos)
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id_reto, id_estudiante) DO NOTHING`,
                [idsRetos[intento.reto], intento.estudiante, intento.respuesta, esCorrecta, esCorrecta ? reto.puntos : 0]
            );
        }
        console.log(`${intentos.length} intentos de reto registrados.`);

        // 7. Orientaciones y notas de seguimiento
        for (const registro of orientaciones) {
            const existente = await pool.query(
                'SELECT 1 FROM Seguimiento WHERE id_mentor = $1 AND id_estudiante = $2 AND mensaje = $3',
                [ID_MENTOR, registro.estudiante, registro.mensaje]
            );
            if (existente.rows.length === 0) {
                await pool.query(
                    'INSERT INTO Seguimiento (id_mentor, id_estudiante, tipo, mensaje) VALUES ($1, $2, $3, $4)',
                    [ID_MENTOR, registro.estudiante, registro.tipo, registro.mensaje]
                );
            }
        }
        console.log(`${orientaciones.length} registros de seguimiento creados.`);

        console.log('\n--- Datos de demostración cargados exitosamente ---');
        console.log('Códigos de vinculación disponibles para probar el registro de padres: DEMO01 a DEMO06');
    } catch (error) {
        console.error('Error al cargar los datos de demostración:', error);
    } finally {
        await pool.end();
    }
}

sembrarDatos();
