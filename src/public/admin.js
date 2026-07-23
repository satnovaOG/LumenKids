// Archivo: src/public/admin.js

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML.replace(/"/g, '&quot;');
}

async function apiFetch(url, opciones = {}) {
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

function mostrarMensaje(texto, esError = false) {
    const el = document.getElementById('admin-message');
    el.classList.remove('hidden', 'exito', 'error');
    el.classList.add(esError ? 'error' : 'exito');
    el.innerHTML = texto;
    setTimeout(() => el.classList.add('hidden'), 6000);
}

function activarTabs() {
    const nav = document.getElementById('tabs-admin');
    nav.querySelectorAll('button').forEach(boton => {
        boton.addEventListener('click', () => {
            nav.querySelectorAll('button').forEach(b => b.classList.remove('activa'));
            boton.classList.add('activa');
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
            document.getElementById(boton.dataset.tab).classList.remove('hidden');

            if (boton.dataset.tab === 'tab-cuentas') cargarCuentas();
            if (boton.dataset.tab === 'tab-rutas') cargarRutas();
            if (boton.dataset.tab === 'tab-cursos') cargarCursos();
        });
    });
}

window.addEventListener('load', async function () {
    await window.Clerk.load();

    if (!window.Clerk.user) {
        window.location.href = '/index.html';
        return;
    }

    window.Clerk.mountUserButton(document.getElementById('user-button'), {
        afterSignOutUrl: '/index.html'
    });

    // Verificamos que el usuario sea administrador
    try {
        const rolData = await apiFetch('/api/verificar-rol');
        if (rolData.rol !== 'admin') {
            document.querySelector('.dashboard-wrapper').innerHTML =
                '<div class="form-card"><h2>Acceso denegado</h2><p>Este panel es exclusivo de administradores.</p><a href="/dashboard.html" class="back-link">Volver al panel</a></div>';
            return;
        }
    } catch (error) {
        document.querySelector('.dashboard-wrapper').innerHTML =
            `<div class="form-card"><p>${escapeHtml(error.message)}</p></div>`;
        return;
    }

    activarTabs();
    configurarCrearMentor();
});

function configurarCrearMentor() {
    document.getElementById('form-crear-mentor').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await apiFetch('/api/crear-mentor', {
                method: 'POST',
                body: JSON.stringify({
                    nombre: document.getElementById('nombre-mentor').value,
                    correo: document.getElementById('correo-mentor').value
                })
            });
            mostrarMensaje(data.mensaje);
            document.getElementById('form-crear-mentor').reset();
        } catch (error) {
            mostrarMensaje(error.message, true);
        }
    });
}

async function cargarCuentas() {
    try {
        const data = await apiFetch('/api/admin/cuentas');

        document.getElementById('count-estudiantes').textContent = data.estudiantes.length;
        document.getElementById('count-mentores').textContent = data.mentores.length;
        document.getElementById('count-padres').textContent = data.padres.length;

        document.getElementById('lista-estudiantes').innerHTML = data.estudiantes.length === 0
            ? '<p>No hay estudiantes registrados.</p>'
            : `<table class="tabla-estudiantes">
                <thead><tr><th>Nombre</th><th>Nivel</th><th>Edad</th><th>Código</th><th>Última actividad</th></tr></thead>
                <tbody>
                    ${data.estudiantes.map(e => `
                        <tr>
                            <td><strong>${escapeHtml(e.nombre)}</strong></td>
                            <td>${escapeHtml(e.nivel || '—')}</td>
                            <td>${e.edad ?? '—'}</td>
                            <td><span class="chip">${escapeHtml(e.codigo_vinculacion)}</span></td>
                            <td>${e.ultima_actividad ? new Date(e.ultima_actividad).toLocaleDateString('es-CO') : 'Sin registro'}</td>
                        </tr>
                    `).join('')}
                </tbody>
               </table>`;

        document.getElementById('lista-mentores').innerHTML = data.mentores.length === 0
            ? '<p>No hay mentores registrados.</p>'
            : `<table class="tabla-estudiantes">
                <thead><tr><th>Nombre</th><th>Correo</th></tr></thead>
                <tbody>
                    ${data.mentores.map(m => `
                        <tr>
                            <td><strong>${escapeHtml(m.nombre)}</strong></td>
                            <td>${escapeHtml(m.correo || '—')}</td>
                        </tr>
                    `).join('')}
                </tbody>
               </table>`;

        document.getElementById('lista-padres').innerHTML = data.padres.length === 0
            ? '<p>No hay padres registrados.</p>'
            : `<table class="tabla-estudiantes">
                <thead><tr><th>Nombre</th><th>Correo</th></tr></thead>
                <tbody>
                    ${data.padres.map(p => `
                        <tr>
                            <td><strong>${escapeHtml(p.nombre)}</strong></td>
                            <td>${escapeHtml(p.correo || '—')}</td>
                        </tr>
                    `).join('')}
                </tbody>
               </table>`;
    } catch (error) {
        mostrarMensaje(error.message, true);
    }
}

async function cargarRutas() {
    const contenedor = document.getElementById('lista-rutas');
    try {
        const rutas = await apiFetch('/api/admin/rutas');
        if (rutas.length === 0) {
            contenedor.innerHTML = '<p>No hay rutas de aprendizaje creadas.</p>';
            return;
        }

        contenedor.innerHTML = `
            <table class="tabla-estudiantes">
                <thead><tr><th>ID</th><th>Curso</th><th>Área</th><th>Mentor</th><th>Asignados</th><th></th></tr></thead>
                <tbody>
                    ${rutas.map(r => `
                        <tr>
                            <td>${r.id_ruta}</td>
                            <td><strong>${escapeHtml(r.nombre_curso)}</strong><br>
                                <a href="${escapeHtml(r.url_coursera)}" target="_blank" rel="noopener noreferrer" style="color: var(--acento); font-size: 0.8rem;">Ver enlace</a>
                            </td>
                            <td><span class="chip">${escapeHtml(r.area)}</span></td>
                            <td>${escapeHtml(r.nombre_mentor || '—')}</td>
                            <td>${r.estudiantes_asignados}</td>
                            <td>
                                <button type="button" class="custom-button" style="width: auto; padding: 6px 12px; font-size: 0.85rem; background: linear-gradient(135deg, #ef4444, #b91c1c);"
                                    data-eliminar-ruta="${r.id_ruta}" data-nombre="${escapeHtml(r.nombre_curso)}">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;

        contenedor.querySelectorAll('[data-eliminar-ruta]').forEach(boton => {
            boton.addEventListener('click', async () => {
                if (!confirm(`¿Eliminar la ruta "${boton.dataset.nombre}"? Esta acción no se puede deshacer.`)) return;
                try {
                    const data = await apiFetch(`/api/admin/rutas/${boton.dataset.eliminarRuta}`, { method: 'DELETE' });
                    mostrarMensaje(data.mensaje);
                    cargarRutas();
                } catch (error) {
                    mostrarMensaje(error.message, true);
                }
            });
        });
    } catch (error) {
        contenedor.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
}

async function cargarCursos() {
    const contenedor = document.getElementById('lista-cursos');
    try {
        const cursos = await apiFetch('/api/admin/cursos');
        if (cursos.length === 0) {
            contenedor.innerHTML = '<p>No hay cursos creados.</p>';
            return;
        }

        contenedor.innerHTML = `
            <table class="tabla-estudiantes">
                <thead><tr><th>ID</th><th>Curso</th><th>Docente</th><th>Módulos</th><th>Inscritos</th><th></th></tr></thead>
                <tbody>
                    ${cursos.map(c => `
                        <tr>
                            <td>${c.id_clase}</td>
                            <td><strong>${escapeHtml(c.nombre)}</strong></td>
                            <td>${escapeHtml(c.nombre_mentor || '—')}</td>
                            <td>${c.total_modulos}</td>
                            <td>${c.estudiantes_inscritos}</td>
                            <td>
                                <button type="button" class="custom-button" style="width: auto; padding: 6px 12px; font-size: 0.85rem; background: linear-gradient(135deg, #ef4444, #b91c1c);"
                                    data-eliminar-curso="${c.id_clase}" data-nombre="${escapeHtml(c.nombre)}">Eliminar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;

        contenedor.querySelectorAll('[data-eliminar-curso]').forEach(boton => {
            boton.addEventListener('click', async () => {
                if (!confirm(`¿Eliminar el curso "${boton.dataset.nombre}"? Se borrarán módulos, lecciones e inscripciones.`)) return;
                try {
                    const data = await apiFetch(`/api/admin/cursos/${boton.dataset.eliminarCurso}`, { method: 'DELETE' });
                    mostrarMensaje(data.mensaje);
                    cargarCursos();
                } catch (error) {
                    mostrarMensaje(error.message, true);
                }
            });
        });
    } catch (error) {
        contenedor.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
    }
}
