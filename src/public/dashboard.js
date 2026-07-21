// Archivo: src/public/dashboard.js

window.addEventListener('load', async function () {
    // 1. Esperamos a que Clerk (el sistema de autenticación) se inicialice
    await window.Clerk.load();

    // 2. Si no hay una sesión activa, expulsamos al usuario a la pantalla de inicio
    if (!window.Clerk.user) {
        window.location.href = '/index.html';
        return;
    }

    // 3. Montamos el botón de perfil de usuario en la esquina superior
    const userButtonDiv = document.getElementById('user-button');
    window.Clerk.mountUserButton(userButtonDiv, {
        afterSignOutUrl: '/index.html'
    });

   // 4. Consultamos el rol real y seguro desde el servidor
    const token = await window.Clerk.session.getToken();
    let rolUsuario = 'estudiante'; // Rol por defecto por seguridad
    
    try {
        const checkRes = await fetch('/api/verificar-rol', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataCheck = await checkRes.json();
        rolUsuario = dataCheck.rol; // Será 'admin', 'mentor', 'padre' o 'estudiante'
    } catch (error) {
        console.error('Error verificando rol en el servidor:', error);
    }

    const teacherPanel = document.getElementById('teacher-panel');
    const studentPanel = document.getElementById('student-panel');
    
    // 5. Mostramos el panel adecuado según el rol de la base de datos
    if (rolUsuario === 'mentor' || rolUsuario === 'admin') {
        teacherPanel.classList.remove('hidden');
        configurarPanelDocente();
    } else if (rolUsuario === 'estudiante') {
        studentPanel.classList.remove('hidden');
        cargarRutasEstudiante();
    } else {
        // En caso de ser padre (rolUsuario === 'padre')
        studentPanel.classList.remove('hidden');
        studentPanel.innerHTML = '<h2>Bienvenido. El panel de seguimiento para padres está en construcción.</h2>';
    }
});

// Función para inicializar los formularios del docente
function configurarPanelDocente() {
    const formCrearRuta = document.getElementById('form-crear-ruta');
    const formAsignarRuta = document.getElementById('form-asignar-ruta');
    const teacherMessage = document.getElementById('teacher-message');

    // Evento: Crear Ruta
    formCrearRuta.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombreCurso = document.getElementById('nombre-curso').value;
        const area = document.getElementById('area-curso').value;
        const urlCoursera = document.getElementById('url-coursera').value;
        const token = await window.Clerk.session.getToken();

        try {
            const response = await fetch('/api/crear-ruta-coursera', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nombreCurso, area, urlCoursera })
            });

            const data = await response.json();
            teacherMessage.classList.remove('hidden');
            
            if (response.ok) {
                teacherMessage.innerHTML = `¡Éxito! Ruta creada. <strong>Anota su ID numérico: ${data.id_ruta}</strong>`;
                teacherMessage.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
                teacherMessage.style.color = '#4ade80';
                formCrearRuta.reset();
            } else {
                teacherMessage.innerHTML = `Error: ${data.error}`;
                teacherMessage.style.backgroundColor = 'rgba(248, 113, 113, 0.2)';
                teacherMessage.style.color = '#f87171';
            }
        } catch (error) {
            console.error('Fallo en la petición:', error);
            teacherMessage.classList.remove('hidden');
            teacherMessage.innerHTML = 'Error de conexión con el servidor.';
        }
    });

    // Evento: Asignar Ruta a un alumno
    formAsignarRuta.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idEstudiante = document.getElementById('id-estudiante').value;
        const idRuta = document.getElementById('id-ruta').value;
        const token = await window.Clerk.session.getToken();

        try {
            const response = await fetch('/api/asignar-ruta-estudiante', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ idEstudiante, idRuta })
            });

            const data = await response.json();
            teacherMessage.classList.remove('hidden');
            
            if (response.ok) {
                teacherMessage.innerHTML = `¡Ruta vinculada exitosamente al estudiante!`;
                teacherMessage.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
                teacherMessage.style.color = '#4ade80';
                formAsignarRuta.reset();
            } else {
                teacherMessage.innerHTML = `Error: ${data.error}`;
                teacherMessage.style.backgroundColor = 'rgba(248, 113, 113, 0.2)';
                teacherMessage.style.color = '#f87171';
            }
        } catch (error) {
            console.error('Fallo en la petición:', error);
            teacherMessage.classList.remove('hidden');
            teacherMessage.innerHTML = 'Error de conexión con el servidor.';
        }
    });

    cargarCursosDocente();
    // Agrega esta línea al final de la función configurarPanelDocente()
    inicializarConstructorCursos();
}

// Función para cargar y desplegar los cursos y estudiantes del docente
async function cargarCursosDocente() {
    const contenedorCursos = document.getElementById('lista-cursos-docente');
    const token = await window.Clerk.session.getToken();

    try {
        const response = await fetch('/api/cursos-docente', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const cursos = await response.json();

            if (cursos.length === 0) {
                contenedorCursos.innerHTML = '<p>No tienes cursos creados actualmente.</p>';
                return;
            }

            // Pintamos la lista de cursos
            contenedorCursos.innerHTML = cursos.map(curso => `
                <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: left;">
                    <h4 style="color: #4ade80; font-size: 1.1rem; margin-bottom: 8px;">📚 ${curso.nombre_clase} (ID Clase: ${curso.id_clase})</h4>
                    <p style="font-size: 0.9rem; font-weight: bold; margin-bottom: 5px;">Estudiantes inscritos (${curso.estudiantes.length}):</p>
                    ${
                        curso.estudiantes.length === 0 
                        ? '<p style="font-size: 0.85rem; color: #cbd5e1;">No hay estudiantes inscritos en este curso.</p>'
                        : `<ul style="list-style-type: disc; padding-left: 20px; font-size: 0.9rem;">
                            ${curso.estudiantes.estudiantes || curso.estudiantes.map(est => `
                                <li><strong>${est.nombre}</strong> (Nivel: ${est.nivel || 'Básico'} | Código: ${est.codigo_vinculacion})</li>
                            `).join('')}
                           </ul>`
                    }
                </div>
            `).join('');
        } else {
            contenedorCursos.innerHTML = '<p>Error al obtener la información de los cursos.</p>';
        }
    } catch (error) {
        console.error('Error de red:', error);
        contenedorCursos.innerHTML = '<p>Error de conexión con el servidor.</p>';
    }
}

// Función para descargar y mostrar las rutas si el usuario es estudiante
async function cargarRutasEstudiante() {
    const rutasContainer = document.getElementById('rutas-container');
    const token = await window.Clerk.session.getToken();

    try {
        const response = await fetch('/api/mis-rutas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const rutas = await response.json();
            
            // Si el arreglo está vacío
            if (rutas.length === 0) {
                rutasContainer.innerHTML = '<p>No tienes módulos de Coursera asignados por tu docente aún.</p>';
                return;
            }

            // Mapeamos el arreglo y creamos componentes HTML (Tarjetas) por cada ruta
            rutasContainer.innerHTML = rutas.map(ruta => `
                <article class="form-card" style="text-align: left;">
                    <span style="background: #7C3AED; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">
                        ${ruta.area}
                    </span>
                    <h4 style="margin: 15px 0 5px 0; font-size: 1.2rem;">${ruta.nombre_curso}</h4>
                    <p style="margin-bottom: 20px; color: #E2E8F0;">Progreso actual: ${ruta.progreso_porcentaje}%</p>
                    <a href="${ruta.url_coursera}" target="_blank" rel="noopener noreferrer" class="custom-button" style="display: block; text-align: center; text-decoration: none;">
                        Abrir en Coursera
                    </a>
                </article>
            `).join('');
        } else {
            rutasContainer.innerHTML = '<p>Error al cargar las rutas desde la base de datos.</p>';
        }
    } catch (error) {
        console.error('Fallo en la petición:', error);
        rutasContainer.innerHTML = '<p>Error de comunicación con el servidor.</p>';
    }
}

// Variable global para contar cuántos temas agregamos
let contadorTemas = 0;

// Función para inicializar el Constructor de Cursos
function inicializarConstructorCursos() {
    const btnAddTema = document.getElementById('btn-add-tema');
    const contenedorTemas = document.getElementById('contenedor-temas');
    const formCursoComplejo = document.getElementById('form-curso-complejo');
    const mensaje = document.getElementById('curso-complejo-message');

    // 1. Agregar un nuevo bloque de Tema cuando se hace clic en el botón
    btnAddTema.addEventListener('click', () => {
        contadorTemas++;
        const idActual = contadorTemas;
        
        // Bloque HTML que representa un módulo completo (Tema + Lección + Quiz básico)
        const temaHTML = `
            <div class="tema-card" id="tema-card-${idActual}" style="border: 1px solid rgba(255,255,255,0.3); padding: 15px; margin-top: 15px; border-radius: 8px; background: rgba(0,0,0,0.1);">
                <h4 style="margin-bottom: 10px; color: #E2E8F0;">Módulo ${idActual}</h4>
                
                <input type="text" class="custom-input tema-nombre" placeholder="Título del Módulo (Ej. Introducción)" required style="width: 100%; margin-bottom: 10px;">
                
                <label style="font-size: 0.85rem;">Material de Lectura / Lección:</label>
                <textarea class="custom-input leccion-contenido" placeholder="Escribe aquí todo el texto de la lección..." required style="width: 100%; height: 80px; margin-bottom: 15px; resize: vertical;"></textarea>
                
                <div style="padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                    <h5 style="margin-bottom: 10px; color: #facc15;">Quiz Integrado (Calificación Automática)</h5>
                    <input type="text" class="custom-input evaluacion-titulo" placeholder="Nombre del Quiz" required style="width: 100%; margin-bottom: 10px;">
                    <input type="text" class="custom-input pregunta-enunciado" placeholder="Pregunta (Ej. ¿Qué es un algoritmo?)" required style="width: 100%; margin-bottom: 10px;">
                    <input type="text" class="custom-input opcion-correcta" placeholder="Respuesta CORRECTA" required style="width: 100%; margin-bottom: 10px; border-left: 3px solid #4ade80;">
                    <input type="text" class="custom-input opcion-incorrecta" placeholder="Respuesta INCORRECTA" required style="width: 100%; margin-bottom: 10px; border-left: 3px solid #f87171;">
                </div>
                
                <button type="button" class="custom-button" onclick="document.getElementById('tema-card-${idActual}').remove()" style="margin-top: 15px; background-color: #f87171; width: auto; padding: 5px 15px; font-size: 0.9rem;">Eliminar Módulo</button>
            </div>
        `;
        
        // Inyectamos el bloque en el contenedor
        contenedorTemas.insertAdjacentHTML('beforeend', temaHTML);
    });

    // 2. Procesar el formulario al guardar
    formCursoComplejo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const idRutaBase = document.getElementById('id-ruta-base').value;
        const tarjetasTemas = document.querySelectorAll('.tema-card');
        
        // Preparamos el objeto JSON principal
        const estructura = { temas: [] };

        // Recorremos cada módulo creado visualmente y extraemos sus valores
        tarjetasTemas.forEach(tarjeta => {
            const nombreTema = tarjeta.querySelector('.tema-nombre').value;
            const contenidoLeccion = tarjeta.querySelector('.leccion-contenido').value;
            const tituloEval = tarjeta.querySelector('.evaluacion-titulo').value;
            const enunciadoPregunta = tarjeta.querySelector('.pregunta-enunciado').value;
            const respuestaCorrecta = tarjeta.querySelector('.opcion-correcta').value;
            const respuestaIncorrecta = tarjeta.querySelector('.opcion-incorrecta').value;

            // Armamos la jerarquía para este tema específico
            estructura.temas.push({
                nombre: nombreTema,
                lecciones: [
                    { titulo: 'Lección principal', contenido: contenidoLeccion }
                ],
                evaluaciones: [
                    {
                        titulo: tituloEval,
                        preguntas: [
                            {
                                enunciado: enunciadoPregunta,
                                tipo: 'multiple',
                                opciones: [
                                    { texto: respuestaCorrecta, es_correcta: true },
                                    { texto: respuestaIncorrecta, es_correcta: false }
                                ]
                            }
                        ]
                    }
                ]
            });
        });

        const token = await window.Clerk.session.getToken();
        
        try {
            // Enviamos el objeto complejo al servidor
            const response = await fetch('/api/crear-curso-complejo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ idRuta: idRutaBase, estructura: estructura })
            });
            
            const data = await response.json();
            mensaje.classList.remove('hidden');
            
            if(response.ok) {
                mensaje.innerHTML = '¡La estructura del curso ha sido guardada en la base de datos!';
                mensaje.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
                mensaje.style.color = '#4ade80';
                formCursoComplejo.reset();
                contenedorTemas.innerHTML = ''; // Limpiamos el constructor
                contadorTemas = 0;
            } else {
                mensaje.innerHTML = `Error: ${data.error}`;
                mensaje.style.backgroundColor = 'rgba(248, 113, 113, 0.2)';
                mensaje.style.color = '#f87171';
            }
        } catch(error) {
            console.error('Error de red:', error);
            mensaje.classList.remove('hidden');
            mensaje.innerHTML = 'Error de conexión con el servidor.';
        }
    });
}