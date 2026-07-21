// Archivo: src/public/crear-curso.js

window.addEventListener('load', async function () {
    await window.Clerk.load();

    if (!window.Clerk.user) {
        window.location.href = '/index.html';
        return;
    }

    const userButtonDiv = document.getElementById('user-button');
    window.Clerk.mountUserButton(userButtonDiv, { afterSignOutUrl: '/index.html' });

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
        inicializarConstructorCursos(token);
    } else {
        document.querySelector('.panel-section').innerHTML = '<h2>Acceso denegado. Solo para docentes.</h2>';
    }
});

let contadorTemas = 0;

function inicializarConstructorCursos(token) {
    const btnAddTema = document.getElementById('btn-add-tema');
    const contenedorTemas = document.getElementById('contenedor-temas');
    const formCrearCurso = document.getElementById('form-crear-curso');
    const mensaje = document.getElementById('crear-curso-message');

    btnAddTema.addEventListener('click', () => {
        contadorTemas++;
        const idActual = contadorTemas;
        
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
        contenedorTemas.insertAdjacentHTML('beforeend', temaHTML);
    });

    formCrearCurso.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const idRutaBase = document.getElementById('id-ruta-base').value;
        const tarjetasTemas = document.querySelectorAll('.tema-card');
        const estructura = { temas: [] };

        tarjetasTemas.forEach(tarjeta => {
            const nombreTema = tarjeta.querySelector('.tema-nombre').value;
            const contenidoLeccion = tarjeta.querySelector('.leccion-contenido').value;
            const tituloEval = tarjeta.querySelector('.evaluacion-titulo').value;
            const enunciadoPregunta = tarjeta.querySelector('.pregunta-enunciado').value;
            const respuestaCorrecta = tarjeta.querySelector('.opcion-correcta').value;
            const respuestaIncorrecta = tarjeta.querySelector('.opcion-incorrecta').value;

            estructura.temas.push({
                nombre: nombreTema,
                lecciones: [{ titulo: 'Lección principal', contenido: contenidoLeccion }],
                evaluaciones: [{
                    titulo: tituloEval,
                    preguntas: [{
                        enunciado: enunciadoPregunta,
                        tipo: 'multiple',
                        opciones: [
                            { texto: respuestaCorrecta, es_correcta: true },
                            { texto: respuestaIncorrecta, es_correcta: false }
                        ]
                    }]
                }]
            });
        });

        try {
            const response = await fetch('/api/crear-curso-complejo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ idRuta: idRutaBase, estructura: estructura })
            });
            
            const data = await response.json();
            mensaje.classList.remove('hidden');
            
            if(response.ok) {
                mensaje.innerHTML = '¡El curso ha sido guardado exitosamente!';
                mensaje.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
                mensaje.style.color = '#4ade80';
                formCrearCurso.reset();
                contenedorTemas.innerHTML = '';
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