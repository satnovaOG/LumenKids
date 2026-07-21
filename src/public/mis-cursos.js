// Archivo: src/public/mis-cursos.js

window.addEventListener('load', async function () {
    await window.Clerk.load();

    if (!window.Clerk.user) {
        window.location.href = '/index.html';
        return;
    }

    const userButtonDiv = document.getElementById('user-button');
    window.Clerk.mountUserButton(userButtonDiv, { afterSignOutUrl: '/index.html' });

    // Verificamos seguridad
    const token = await window.Clerk.session.getToken();
    let rolUsuario = 'estudiante';
    
    try {
        const checkRes = await fetch('/api/verificar-rol', { headers: { 'Authorization': `Bearer ${token}` } });
        const dataCheck = await checkRes.json();
        rolUsuario = dataCheck.rol;
    } catch (error) {
        console.error('Error verificando rol:', error);
    }

    if (rolUsuario === 'mentor' || rolUsuario === 'admin') {
        cargarCursosDocente(token);
    } else {
        document.querySelector('.panel-section').innerHTML = '<h2>Acceso denegado. Solo para docentes.</h2>';
    }
});

async function cargarCursosDocente(token) {
    const contenedorCursos = document.getElementById('lista-cursos-docente');

    try {
        const response = await fetch('/api/cursos-docente', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const cursos = await response.json();

            if (cursos.length === 0) {
                contenedorCursos.innerHTML = '<p>No tienes cursos creados actualmente.</p>';
                return;
            }

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