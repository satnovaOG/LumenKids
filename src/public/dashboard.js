// Archivo: src/public/dashboard.js

let tokenGlobal = null;

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
    tokenGlobal = await window.Clerk.session.getToken();
    let rolUsuario = 'estudiante'; // Rol por defecto por seguridad

    try {
        const checkRes = await fetch('/api/verificar-rol', {
            headers: { 'Authorization': `Bearer ${tokenGlobal}` }
        });
        const dataCheck = await checkRes.json();
        rolUsuario = dataCheck.rol; // Será 'admin', 'mentor', 'padre' o 'estudiante'
    } catch (error) {
        console.error('Error verificando rol en el servidor:', error);
    }

    const titulo = document.getElementById('titulo-panel');
    const subtitulo = document.getElementById('subtitulo-panel');
    const nombre = window.Clerk.user.firstName || 'Usuario';

    // 5. Mostramos el panel adecuado según el rol de la base de datos
    if (rolUsuario === 'mentor' || rolUsuario === 'admin') {
        titulo.textContent = `Panel de Mentoría`;
        subtitulo.textContent = `Hola, ${nombre}. Acompaña y orienta a tus estudiantes.`;
        document.getElementById('teacher-panel').classList.remove('hidden');
        configurarPanelDocente();
    } else if (rolUsuario === 'padre') {
        titulo.textContent = `Panel Familiar`;
        subtitulo.textContent = `Hola, ${nombre}. Sigue el progreso de tus hijos.`;
        document.getElementById('parent-panel').classList.remove('hidden');
        configurarPanelPadre();
    } else {
        titulo.textContent = `¡Hola, ${nombre}! ✨`;
        subtitulo.textContent = 'Este es tu espacio de aprendizaje.';
        document.getElementById('student-panel').classList.remove('hidden');
        configurarPanelEstudiante();
    }
});

// ---------------------------------------------------------------
// Utilidades compartidas
// ---------------------------------------------------------------

async function apiFetch(url, opciones = {}) {
    // El token de Clerk expira cada ~60 segundos: hay que pedir uno fresco en cada
    // petición (getToken lo cachea y renueva automáticamente), de lo contrario las
    // acciones hechas después de un minuto fallan con "No autorizado".
    const token = await window.Clerk.session.getToken();
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(opciones.headers || {})
        }
    });
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(data.error || 'Error de comunicación con el servidor.');
    return data;
}

function mostrarMensaje(idElemento, texto, esError = false) {
    const el = document.getElementById(idElemento);
    el.classList.remove('hidden', 'exito', 'error');
    el.classList.add(esError ? 'error' : 'exito');
    el.innerHTML = texto;
    setTimeout(() => el.classList.add('hidden'), 6000);
}

// Navegación por pestañas (mismo comportamiento en todos los paneles)
function activarTabs(idNav) {
    const nav = document.getElementById(idNav);
    nav.querySelectorAll('button').forEach(boton => {
        boton.addEventListener('click', () => {
            nav.querySelectorAll('button').forEach(b => b.classList.remove('activa'));
            boton.classList.add('activa');
            const panelPadre = nav.closest('main');
            panelPadre.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
            document.getElementById(boton.dataset.tab).classList.remove('hidden');
        });
    });
}

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML.replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------
// PANEL INTEGRAL DEL ESTUDIANTE (RF5) + GAMIFICACIÓN (RF2)
// ---------------------------------------------------------------

function configurarPanelEstudiante() {
    activarTabs('tabs-estudiante');
    cargarPanelEstudiante();
    cargarRetos();
    cargarClasesEstudiante();
}

async function cargarPanelEstudiante() {
    try {
        const panel = await apiFetch('/api/panel-estudiante');

        // Estadísticas de desempeño
        document.getElementById('stats-estudiante').innerHTML = `
            <div class="stat-card"><span class="stat-icono">⭐</span><span class="stat-valor">${panel.puntos}</span><span class="stat-nombre">Puntos</span></div>
            <div class="stat-card"><span class="stat-icono">🎯</span><span class="stat-valor">${panel.respuestasCorrectas}</span><span class="stat-nombre">Aciertos</span></div>
            <div class="stat-card"><span class="stat-icono">🎮</span><span class="stat-valor">${panel.retosPendientes}</span><span class="stat-nombre">Retos pendientes</span></div>
            <div class="stat-card"><span class="stat-icono">🚀</span><span class="stat-valor">${panel.promedioProgreso}%</span><span class="stat-nombre">Avance en rutas</span></div>
        `;

        // Nivel y barra de progreso
        document.getElementById('nivel-actual').textContent = panel.nivel;
        document.getElementById('barra-nivel').style.width = `${panel.progresoNivel}%`;
        document.getElementById('progreso-nivel-texto').textContent = `${panel.progresoNivel} / 100 pts para el siguiente nivel`;

        // Rutas de aprendizaje activas (RF1)
        const rutasContainer = document.getElementById('rutas-container');
        if (panel.rutas.length === 0) {
            rutasContainer.innerHTML = '<p>No tienes rutas asignadas por tu mentor todavía.</p>';
        } else {
            rutasContainer.innerHTML = panel.rutas.map(ruta => `
                <article class="reto-card">
                    <span class="chip">${escapeHtml(ruta.area)}</span>
                    <h4>${escapeHtml(ruta.nombre_curso)}</h4>
                    <div class="progress-track"><div class="progress-fill" style="width: ${ruta.progreso_porcentaje}%;"></div></div>
                    <p>Progreso: ${ruta.progreso_porcentaje}%</p>
                    <a href="${escapeHtml(ruta.url_coursera)}" target="_blank" rel="noopener noreferrer" class="custom-button" style="text-align: center; text-decoration: none;">Abrir curso</a>
                    <button type="button" class="custom-button secundario" data-avanzar-ruta="${ruta.id_ruta}" data-progreso="${ruta.progreso_porcentaje}">+10% de avance</button>
                </article>
            `).join('');

            rutasContainer.querySelectorAll('[data-avanzar-ruta]').forEach(boton => {
                boton.addEventListener('click', async () => {
                    try {
                        const nuevoProgreso = Math.min(100, parseInt(boton.dataset.progreso, 10) + 10);
                        await apiFetch(`/api/rutas/${boton.dataset.avanzarRuta}/progreso`, {
                            method: 'POST',
                            body: JSON.stringify({ progreso: nuevoProgreso })
                        });
                        cargarPanelEstudiante();
                    } catch (error) {
                        mostrarMensaje('student-message', error.message, true);
                    }
                });
            });
        }

        // Insignias / logros
        document.getElementById('insignias-container').innerHTML = panel.insignias.map(insignia => `
            <div class="insignia-card ${insignia.obtenida ? '' : 'bloqueada'}">
                <span class="insignia-icono">${insignia.icono}</span>
                <h5>${escapeHtml(insignia.titulo)}</h5>
                <p>${escapeHtml(insignia.descripcion)}</p>
            </div>
        `).join('');

        // Recomendaciones personalizadas
        document.getElementById('lista-recomendaciones').innerHTML = panel.recomendaciones
            .map(rec => `<li class="recomendacion">${escapeHtml(rec)}</li>`).join('');

        // Orientaciones del mentor
        if (panel.orientaciones.length > 0) {
            document.getElementById('lista-orientaciones-estudiante').innerHTML = panel.orientaciones.map(o => `
                <li>${escapeHtml(o.mensaje)}<span class="meta">${escapeHtml(o.nombre_mentor || 'Mentor')} · ${new Date(o.fecha).toLocaleDateString('es-CO')}</span></li>
            `).join('');
        }
    } catch (error) {
        // Situación anormal: error en la carga de estadísticas con opción de reintento
        document.getElementById('stats-estudiante').innerHTML = `
            <div class="form-card" style="grid-column: 1 / -1; text-align: center;">
                <p style="margin-bottom: 12px;">${escapeHtml(error.message)}</p>
                <button type="button" class="custom-button" style="width: auto;" onclick="cargarPanelEstudiante()">Reintentar</button>
            </div>
        `;
    }
}

// Retos, olimpiadas y juegos matemáticos con validación automática (RF2)
async function cargarRetos() {
    const contenedor = document.getElementById('retos-container');
    try {
        const retos = await apiFetch('/api/retos');
        if (retos.length === 0) {
            contenedor.innerHTML = '<p>No hay retos activos por ahora. ¡Vuelve pronto!</p>';
            return;
        }

        contenedor.innerHTML = retos.map(reto => {
            const opciones = (reto.opciones || '').split('|').map(o => o.trim()).filter(Boolean);
            let cuerpo;

            if (reto.respondido) {
                cuerpo = `<p style="font-weight: 800; color: ${reto.es_correcta ? 'var(--exito)' : 'var(--peligro)'};">
                    ${reto.es_correcta ? `✔ Resuelto (+${reto.puntos_obtenidos} pts)` : '✘ Respondido sin acierto'}
                </p>`;
            } else if (opciones.length > 0) {
                cuerpo = `<div class="reto-opciones">${opciones.map(op =>
                    `<button type="button" class="reto-opcion" data-reto="${reto.id_reto}" data-respuesta="${escapeHtml(op)}">${escapeHtml(op)}</button>`
                ).join('')}</div>`;
            } else {
                cuerpo = `
                    <div style="display: flex; gap: 8px;">
                        <input type="text" class="custom-input" id="respuesta-reto-${reto.id_reto}" placeholder="Tu respuesta...">
                        <button type="button" class="custom-button" style="width: auto;" data-reto-abierto="${reto.id_reto}">Enviar</button>
                    </div>`;
            }

            return `
                <article class="reto-card ${reto.respondido ? 'resuelto' : ''}">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <span class="chip ${reto.tipo}">${escapeHtml(reto.tipo)}</span>
                        <span class="chip puntos">+${reto.puntos} pts</span>
                    </div>
                    <h4>${escapeHtml(reto.titulo)}</h4>
                    ${reto.descripcion ? `<p>${escapeHtml(reto.descripcion)}</p>` : ''}
                    <p style="font-weight: 700; color: var(--texto);">${escapeHtml(reto.pregunta)}</p>
                    ${cuerpo}
                </article>
            `;
        }).join('');

        contenedor.querySelectorAll('.reto-opcion').forEach(boton => {
            boton.addEventListener('click', () => responderReto(boton.dataset.reto, boton.dataset.respuesta));
        });
        contenedor.querySelectorAll('[data-reto-abierto]').forEach(boton => {
            boton.addEventListener('click', () => {
                const respuesta = document.getElementById(`respuesta-reto-${boton.dataset.retoAbierto}`).value;
                responderReto(boton.dataset.retoAbierto, respuesta);
            });
        });
    } catch (error) {
        contenedor.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
}

async function responderReto(idReto, respuesta) {
    try {
        const data = await apiFetch(`/api/retos/${idReto}/responder`, {
            method: 'POST',
            body: JSON.stringify({ respuesta })
        });
        mostrarMensaje('student-message', data.mensaje, !data.correcta);
        cargarRetos();
        cargarPanelEstudiante(); // Actualizamos puntos, nivel e insignias en tiempo real
    } catch (error) {
        mostrarMensaje('student-message', error.message, true);
    }
}

// ---------------------------------------------------------------
// CURSOS DEL DOCENTE (Clases con módulos, lecciones y quizzes)
// ---------------------------------------------------------------

async function cargarClasesEstudiante() {
    const contenedor = document.getElementById('clases-container');
    try {
        const clases = await apiFetch('/api/mis-clases');
        if (clases.length === 0) {
            contenedor.innerHTML = '<p>Aún no estás inscrito en ningún curso. Tu docente puede inscribirte desde su panel.</p>';
            return;
        }

        contenedor.innerHTML = clases.map(clase => `
            <article class="reto-card">
                <span class="chip">📚 Curso</span>
                <h4>${escapeHtml(clase.nombre)}</h4>
                <p>Docente: ${escapeHtml(clase.nombre_mentor || 'Sin asignar')}</p>
                <p>${clase.total_modulos} módulo(s) de aprendizaje</p>
                <button type="button" class="custom-button" data-abrir-clase="${clase.id_clase}">Abrir curso</button>
            </article>
        `).join('');

        contenedor.querySelectorAll('[data-abrir-clase]').forEach(boton => {
            boton.addEventListener('click', () => abrirClase(boton.dataset.abrirClase));
        });
    } catch (error) {
        contenedor.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
}

async function abrirClase(idClase) {
    const lista = document.getElementById('clases-container');
    const detalle = document.getElementById('detalle-curso');
    detalle.classList.remove('hidden');
    detalle.innerHTML = '<p>Cargando el contenido del curso...</p>';

    try {
        const curso = await apiFetch(`/api/clases/${idClase}/contenido`);
        lista.classList.add('hidden');

        detalle.innerHTML = `
            <button type="button" class="custom-button secundario" id="btn-volver-cursos" style="width: auto; margin-bottom: 18px;">← Volver a mis cursos</button>
            <div class="form-card">
                <h3>📚 ${escapeHtml(curso.nombre)}</h3>
                <p style="color: var(--texto-suave); font-size: 0.9rem;">Docente: ${escapeHtml(curso.nombre_mentor || 'Sin asignar')}</p>
            </div>
            ${curso.temas.length === 0 ? '<div class="form-card"><p>Este curso todavía no tiene módulos publicados.</p></div>' : ''}
            ${curso.temas.map(tema => `
                <details class="form-card modulo-detalle">
                    <summary style="cursor: pointer; font-size: 1.1rem; font-weight: 800;">📖 ${escapeHtml(tema.nombre_tema)}</summary>

                    ${tema.lecciones.map(leccion => `
                        <div style="margin-top: 16px;">
                            <h4 style="margin-bottom: 8px; color: var(--acento);">${escapeHtml(leccion.titulo)}</h4>
                            <p style="color: var(--texto-suave); line-height: 1.7; white-space: pre-wrap;">${escapeHtml(leccion.contenido)}</p>
                        </div>
                    `).join('')}

                    ${tema.evaluaciones.map(evaluacion => `
                        <form class="form-quiz" data-evaluacion="${evaluacion.id_evaluacion}" style="margin-top: 20px; background: rgba(2, 6, 23, 0.3); border: 1px solid var(--cristal-borde); border-radius: var(--radio-sm); padding: 18px;">
                            <h4 style="margin-bottom: 14px;">📝 ${escapeHtml(evaluacion.titulo)}</h4>
                            ${evaluacion.preguntas.map(pregunta => `
                                <fieldset data-pregunta="${pregunta.id_pregunta}" style="border: none; margin-bottom: 16px;">
                                    <legend style="font-weight: 800; margin-bottom: 8px;">${escapeHtml(pregunta.enunciado)}</legend>
                                    <div class="reto-opciones">
                                        ${pregunta.opciones.map(opcion => `
                                            <label class="reto-opcion" style="display: flex; align-items: center; gap: 10px;">
                                                <input type="${pregunta.tipo === 'multiple' ? 'checkbox' : 'radio'}"
                                                       name="pregunta-${pregunta.id_pregunta}"
                                                       value="${opcion.id_opcion}">
                                                <span>${escapeHtml(opcion.texto_opcion)}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </fieldset>
                            `).join('')}
                            <button type="submit" class="custom-button" style="width: auto;">Enviar respuestas</button>
                            <p class="resultado-quiz" style="margin-top: 10px; font-weight: 800;"></p>
                        </form>
                    `).join('')}
                </details>
            `).join('')}
        `;

        document.getElementById('btn-volver-cursos').addEventListener('click', () => {
            detalle.classList.add('hidden');
            detalle.innerHTML = '';
            lista.classList.remove('hidden');
        });

        detalle.querySelectorAll('.form-quiz').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const resultado = form.querySelector('.resultado-quiz');

                // Recolectamos las opciones marcadas por pregunta
                const respuestas = {};
                form.querySelectorAll('[data-pregunta]').forEach(fieldset => {
                    const marcadas = Array.from(fieldset.querySelectorAll('input:checked')).map(input => input.value);
                    respuestas[fieldset.dataset.pregunta] = marcadas;
                });

                try {
                    const data = await apiFetch(`/api/evaluaciones/${form.dataset.evaluacion}/responder`, {
                        method: 'POST',
                        body: JSON.stringify({ respuestas })
                    });

                    resultado.textContent = data.mensaje;
                    resultado.style.color = data.correctas === data.total ? 'var(--exito)' : 'var(--alerta)';

                    // Coloreamos cada pregunta según el resultado
                    data.detalle.forEach(item => {
                        const fieldset = form.querySelector(`[data-pregunta="${item.id_pregunta}"]`);
                        if (fieldset) {
                            fieldset.querySelector('legend').style.color = item.correcta ? 'var(--exito)' : 'var(--peligro)';
                        }
                    });
                } catch (error) {
                    resultado.textContent = error.message;
                    resultado.style.color = 'var(--peligro)';
                }
            });
        });
    } catch (error) {
        detalle.innerHTML = `<div class="form-card"><p>${escapeHtml(error.message)}</p></div>`;
    }
}

// ---------------------------------------------------------------
// PANEL PARA PADRES (RF3)
// ---------------------------------------------------------------

const articulosPadres = [
    {
        titulo: '¿Qué es la Inteligencia Artificial?',
        resumen: 'Una guía sencilla para entender la IA y cómo la usan tus hijos a diario.',
        url: 'https://www.unicef.org/parenting/child-care/artificial-intelligence-parenting'
    },
    {
        titulo: 'Pensamiento computacional en casa',
        resumen: 'Actividades simples para desarrollar la lógica de tus hijos sin pantallas.',
        url: 'https://code.org/athome'
    },
    {
        titulo: 'Seguridad digital para menores',
        resumen: 'Consejos prácticos para acompañar la vida digital de tu familia.',
        url: 'https://www.commonsensemedia.org/articles'
    },
    {
        titulo: 'Cultura financiera para niños',
        resumen: 'Cómo hablar de dinero y ahorro con los más jóvenes del hogar.',
        url: 'https://www.khanacademy.org/college-careers-more/personal-finance'
    }
];

function configurarPanelPadre() {
    // Contenido educativo dinámico para padres
    document.getElementById('articulos-container').innerHTML = articulosPadres.map(articulo => `
        <article class="articulo-card">
            <h4>${articulo.titulo}</h4>
            <p style="color: var(--texto-suave); font-size: 0.9rem;">${articulo.resumen}</p>
            <a href="${articulo.url}" target="_blank" rel="noopener noreferrer">Leer artículo →</a>
        </article>
    `).join('');

    // Formulario de vinculación (situación anormal: cuenta no vinculada)
    document.getElementById('form-vincular').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await apiFetch('/api/vincular-estudiante', {
                method: 'POST',
                body: JSON.stringify({ codigo: document.getElementById('codigo-vinculacion').value })
            });
            mostrarMensaje('parent-message', data.mensaje);
            cargarPanelPadre();
        } catch (error) {
            mostrarMensaje('parent-message', error.message, true);
        }
    });

    cargarPanelPadre();
}

async function cargarPanelPadre() {
    const contenedor = document.getElementById('hijos-container');
    try {
        const data = await apiFetch('/api/panel-padre');

        if (data.hijos.length === 0) {
            document.getElementById('vinculacion-card').classList.remove('hidden');
            contenedor.innerHTML = '';
            return;
        }

        document.getElementById('vinculacion-card').classList.add('hidden');

        contenedor.innerHTML = data.hijos.map(hijo => `
            <div class="form-card">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                    <h3 style="margin: 0;">👦 ${escapeHtml(hijo.nombre)}</h3>
                    <span class="chip">Nivel ${hijo.nivel} · ${hijo.puntos} pts</span>
                </div>

                <div class="stats-grid" style="margin-top: 16px;">
                    <div class="stat-card"><span class="stat-icono">🎮</span><span class="stat-valor">${hijo.retosCompletados}</span><span class="stat-nombre">Retos intentados</span></div>
                    <div class="stat-card"><span class="stat-icono">🚀</span><span class="stat-valor">${hijo.promedioProgreso}%</span><span class="stat-nombre">Avance en rutas</span></div>
                    <div class="stat-card"><span class="stat-icono">🏅</span><span class="stat-valor">${hijo.insignias.length}</span><span class="stat-nombre">Insignias</span></div>
                    <div class="stat-card"><span class="stat-icono">📅</span><span class="stat-valor">${hijo.diasInactivo ?? '—'}</span><span class="stat-nombre">Días sin actividad</span></div>
                </div>

                ${hijo.alertas.length > 0 ? `
                    <h4 style="margin: 16px 0 10px;">⚠️ Alertas</h4>
                    <ul class="lista-simple">${hijo.alertas.map(a => `<li class="alerta">${escapeHtml(a)}</li>`).join('')}</ul>
                ` : ''}

                <h4 style="margin: 16px 0 10px;">💪 Fortalezas</h4>
                <ul class="lista-simple">${hijo.fortalezas.map(f => `<li class="fortaleza">${escapeHtml(f)}</li>`).join('')}</ul>

                ${hijo.orientaciones.length > 0 ? `
                    <h4 style="margin: 16px 0 10px;">🧭 Orientaciones del mentor</h4>
                    <ul class="lista-simple">${hijo.orientaciones.map(o => `
                        <li>${escapeHtml(o.mensaje)}<span class="meta">${escapeHtml(o.nombre_mentor || 'Mentor')} · ${new Date(o.fecha).toLocaleDateString('es-CO')}</span></li>
                    `).join('')}</ul>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        contenedor.innerHTML = `<div class="form-card"><p>${escapeHtml(error.message)}</p></div>`;
    }
}

// ---------------------------------------------------------------
// PANEL DE MENTORÍA Y GESTIÓN DOCENTE (RF4)
// ---------------------------------------------------------------

function configurarPanelDocente() {
    activarTabs('tabs-docente');

    cargarEstudiantesMentor();
    cargarSelectorEstudiantes();

    // Historial de seguimiento al cambiar de estudiante
    document.getElementById('seguimiento-estudiante').addEventListener('change', (e) => {
        if (e.target.value) cargarHistorialSeguimiento(e.target.value);
    });

    // Registro de orientaciones y notas (RF4)
    document.getElementById('form-seguimiento').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const idEstudiante = document.getElementById('seguimiento-estudiante').value;
            const data = await apiFetch('/api/seguimiento', {
                method: 'POST',
                body: JSON.stringify({
                    idEstudiante,
                    tipo: document.getElementById('seguimiento-tipo').value,
                    mensaje: document.getElementById('seguimiento-mensaje').value
                })
            });
            mostrarMensaje('teacher-message', data.mensaje);
            document.getElementById('seguimiento-mensaje').value = '';
            if (idEstudiante) cargarHistorialSeguimiento(idEstudiante);
        } catch (error) {
            mostrarMensaje('teacher-message', error.message, true);
        }
    });

    // Publicación de retos (RF2)
    document.getElementById('form-crear-reto').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await apiFetch('/api/retos', {
                method: 'POST',
                body: JSON.stringify({
                    titulo: document.getElementById('reto-titulo').value,
                    descripcion: document.getElementById('reto-descripcion').value,
                    tipo: document.getElementById('reto-tipo').value,
                    area: document.getElementById('reto-area').value,
                    puntos: parseInt(document.getElementById('reto-puntos').value, 10) || 50,
                    pregunta: document.getElementById('reto-pregunta').value,
                    opciones: document.getElementById('reto-opciones').value,
                    respuestaCorrecta: document.getElementById('reto-respuesta').value
                })
            });
            mostrarMensaje('teacher-message', data.mensaje);
            document.getElementById('form-crear-reto').reset();
        } catch (error) {
            mostrarMensaje('teacher-message', error.message, true);
        }
    });

    // Creación de rutas de Coursera (RF1)
    document.getElementById('form-crear-ruta').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await apiFetch('/api/crear-ruta-coursera', {
                method: 'POST',
                body: JSON.stringify({
                    nombreCurso: document.getElementById('nombre-curso').value,
                    area: document.getElementById('area-curso').value,
                    urlCoursera: document.getElementById('url-coursera').value
                })
            });
            mostrarMensaje('teacher-message', `¡Éxito! Ruta creada con el ID numérico: <strong>${data.id_ruta}</strong>`);
            document.getElementById('form-crear-ruta').reset();
        } catch (error) {
            mostrarMensaje('teacher-message', error.message, true);
        }
    });

    // Asignación de rutas a estudiantes
    document.getElementById('form-asignar-ruta').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await apiFetch('/api/asignar-ruta-estudiante', {
                method: 'POST',
                body: JSON.stringify({
                    idEstudiante: document.getElementById('id-estudiante').value,
                    idRuta: document.getElementById('id-ruta').value
                })
            });
            mostrarMensaje('teacher-message', data.mensaje);
            document.getElementById('form-asignar-ruta').reset();
        } catch (error) {
            mostrarMensaje('teacher-message', error.message, true);
        }
    });
}

// Tabla de estudiantes del mentor con sus indicadores
async function cargarEstudiantesMentor() {
    const wrapper = document.getElementById('tabla-estudiantes-wrapper');
    try {
        const estudiantes = await apiFetch('/api/estudiantes-mentor');
        if (estudiantes.length === 0) {
            wrapper.innerHTML = '<p>Aún no tienes estudiantes en tus clases. Crea un curso e inscríbelos desde el Constructor de Cursos.</p>';
            return;
        }

        wrapper.innerHTML = `
            <table class="tabla-estudiantes">
                <thead><tr><th>Estudiante</th><th>Nivel</th><th>Puntos</th><th>Retos</th><th>Aciertos</th><th>Última actividad</th></tr></thead>
                <tbody>
                    ${estudiantes.map(est => `
                        <tr>
                            <td><strong>${escapeHtml(est.nombre)}</strong></td>
                            <td>${escapeHtml(est.nivel || 'Básico')}</td>
                            <td>${est.puntos}</td>
                            <td>${est.retos}</td>
                            <td>${est.correctas}</td>
                            <td>${est.ultima_actividad ? new Date(est.ultima_actividad).toLocaleDateString('es-CO') : 'Sin registro'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Poblamos el selector de seguimiento con los estudiantes asignados
        const selector = document.getElementById('seguimiento-estudiante');
        selector.innerHTML = '<option value="">Selecciona un estudiante...</option>' +
            estudiantes.map(est => `<option value="${est.id_estudiante}">${escapeHtml(est.nombre)}</option>`).join('');
    } catch (error) {
        wrapper.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
}

// Selector de todos los estudiantes para asignar rutas
async function cargarSelectorEstudiantes() {
    try {
        const estudiantes = await apiFetch('/api/estudiantes-disponibles');
        const selector = document.getElementById('id-estudiante');
        selector.innerHTML = '<option value="">Selecciona un estudiante...</option>' +
            estudiantes.map(est => `<option value="${est.id_estudiante}">${escapeHtml(est.nombre)} (${est.codigo_vinculacion})</option>`).join('');
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
    }
}

async function cargarHistorialSeguimiento(idEstudiante) {
    const lista = document.getElementById('historial-seguimiento');
    try {
        const historial = await apiFetch(`/api/seguimiento/${idEstudiante}`);
        if (historial.length === 0) {
            lista.innerHTML = '<li>Este estudiante no tiene registros de seguimiento todavía.</li>';
            return;
        }
        lista.innerHTML = historial.map(registro => `
            <li class="${registro.tipo === 'nota' ? 'alerta' : ''}">
                ${registro.tipo === 'nota' ? '🔒 <em>Nota privada:</em> ' : '🧭 '}${escapeHtml(registro.mensaje)}
                <span class="meta">${escapeHtml(registro.nombre_mentor || 'Docente')} · ${new Date(registro.fecha).toLocaleString('es-CO')}</span>
            </li>
        `).join('');
    } catch (error) {
        lista.innerHTML = `<li class="alerta">${escapeHtml(error.message)}</li>`;
    }
}
