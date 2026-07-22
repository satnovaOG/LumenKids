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

// Variable global para evitar identificadores repetidos en el HTML
let idCounter = 0; 
function getUniqueId() { idCounter++; return idCounter; }

// Función para cargar los alumnos en los checkboxes
async function cargarEstudiantes(token) {
    const contenedor = document.getElementById('contenedor-estudiantes');
    try {
        const res = await fetch('/api/estudiantes-disponibles', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const estudiantes = await res.json();
            if (estudiantes.length === 0) {
                contenedor.innerHTML = '<p>No hay estudiantes registrados en el sistema.</p>';
                return;
            }
            contenedor.innerHTML = estudiantes.map(est => `
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.95rem;">
                    <input type="checkbox" class="estudiante-checkbox" value="${est.id_estudiante}">
                    ${est.nombre} (Nivel: ${est.nivel || 'N/A'} - Código: ${est.codigo_vinculacion})
                </label>
            `).join('');
        }
    } catch (e) {
        contenedor.innerHTML = 'Error al cargar estudiantes.';
    }
}

function inicializarConstructorCursos(token) {
    cargarEstudiantes(token); // Cargamos alumnos al iniciar

    const btnAddModulo = document.getElementById('btn-add-modulo');
    const contenedorModulos = document.getElementById('contenedor-modulos');
    const formCrearCurso = document.getElementById('form-crear-curso-dinamico');
    const mensaje = document.getElementById('crear-curso-message');

    // LÓGICA DE INTERFAZ: Agregar Módulo
    btnAddModulo.addEventListener('click', () => {
        const modId = getUniqueId();
        const moduloHTML = `
            <div class="modulo-card" id="modulo-${modId}" style="border: 1px solid rgba(255,255,255,0.3); padding: 20px; margin-top: 20px; border-radius: 8px; background: rgba(0,0,0,0.15);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="color: #60a5fa; font-size: 1.2rem; margin:0;">Módulo de Aprendizaje</h4>
                    <button type="button" onclick="document.getElementById('modulo-${modId}').remove()" style="background: transparent; border: none; color: #f87171; cursor: pointer; font-weight: bold;">X Eliminar Módulo</button>
                </div>
                
                <input type="text" class="custom-input modulo-titulo" placeholder="Título del Módulo (Ej. Unidad 1: Fracciones)" required style="width: 100%; margin-bottom: 15px;">
                
                <label style="font-size: 0.9rem; margin-bottom:5px; display:block;">Contenido / Lectura:</label>
                <textarea class="custom-input modulo-leccion" placeholder="Escribe aquí el material que el alumno debe estudiar..." style="width: 100%; height: 100px; resize: vertical; margin-bottom: 15px;"></textarea>
                
                <div class="quiz-container" id="quiz-container-${modId}">
                    <!-- El quiz aparecerá aquí si el docente lo habilita -->
                </div>
                
                <button type="button" class="custom-button btn-add-quiz" onclick="habilitarQuiz(${modId})" style="background-color: #f59e0b; width: 100%; padding: 8px; font-size: 0.9rem;">📝 Habilitar Quiz para este Módulo</button>
            </div>
        `;
        contenedorModulos.insertAdjacentHTML('beforeend', moduloHTML);
    });

    // RECOLECCIÓN Y ENVÍO DE DATOS
    formCrearCurso.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nombreCurso = document.getElementById('nombre-curso-general').value.trim();
        if(!nombreCurso) { alert("Ponle un nombre al curso."); return; }

        // Recolectar estudiantes seleccionados
        const checkboxes = document.querySelectorAll('.estudiante-checkbox:checked');
        const estudiantesSeleccionados = Array.from(checkboxes).map(cb => cb.value);

        // Recolectar la estructura del DOM
        const estructura = [];
        document.querySelectorAll('.modulo-card').forEach(moduloCard => {
            const tituloModulo = moduloCard.querySelector('.modulo-titulo').value;
            const leccionTexto = moduloCard.querySelector('.modulo-leccion').value;
            
            let quizData = null;
            const quizWrapper = moduloCard.querySelector('.quiz-wrapper');
            
            if (quizWrapper) {
                const quizTitulo = quizWrapper.querySelector('.quiz-titulo').value;
                const preguntasData = [];
                
                quizWrapper.querySelectorAll('.pregunta-card').forEach(pregCard => {
                    const enunciado = pregCard.querySelector('.pregunta-enunciado').value;
                    const tipo = pregCard.querySelector('.pregunta-tipo').value;
                    const opcionesData = [];
                    
                    pregCard.querySelectorAll('.opcion-item').forEach(opcionItem => {
                        opcionesData.push({
                            texto: opcionItem.querySelector('.opcion-texto').value,
                            esCorrecta: opcionItem.querySelector('.opcion-correcta').checked
                        });
                    });
                    
                    preguntasData.push({ enunciado, tipo, opciones: opcionesData });
                });
                
                quizData = { titulo: quizTitulo, preguntas: preguntasData };
            }

            estructura.push({
                nombre: tituloModulo,
                leccion: leccionTexto,
                quiz: quizData
            });
        });

        // Petición al servidor
        try {
            const response = await fetch('/api/crear-curso-dinamico', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nombreCurso, estudiantesSeleccionados, estructura })
            });
            
            const data = await response.json();
            mensaje.classList.remove('hidden');
            
            if(response.ok) {
                mensaje.innerHTML = '¡El curso se ha creado y publicado con éxito!';
                mensaje.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
                mensaje.style.color = '#166534';
                formCrearCurso.reset();
                document.getElementById('contenedor-modulos').innerHTML = ''; // Limpiamos pantalla
            } else {
                mensaje.innerHTML = `Error: ${data.error}`;
                mensaje.style.backgroundColor = 'rgba(248, 113, 113, 0.2)';
                mensaje.style.color = '#991b1b';
            }
        } catch(error) {
            mensaje.classList.remove('hidden');
            mensaje.innerHTML = 'Error de conexión con el servidor.';
        }
    });
}

// FUNCIONES GLOBALES PARA EL DOM DE LOS QUIZZES (Inyectadas como strings)

window.habilitarQuiz = function(modId) {
    const quizContainer = document.getElementById(`quiz-container-${modId}`);
    const botonActivar = quizContainer.nextElementSibling; 
    botonActivar.style.display = 'none'; // Ocultamos el botón de "Habilitar Quiz"

    quizContainer.innerHTML = `
        <div class="quiz-wrapper" style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h5 style="color: #facc15; margin:0; font-size: 1.1rem;">Evaluación / Quiz</h5>
                <button type="button" onclick="eliminarQuiz(${modId})" style="background: transparent; border: none; color: #f87171; cursor: pointer;">Eliminar Quiz</button>
            </div>
            <input type="text" class="custom-input quiz-titulo" placeholder="Título del Quiz (Ej. Examen de Fracciones)" required style="width: 100%; margin-bottom: 15px;">
            
            <div id="preguntas-container-${modId}"></div>
            
            <button type="button" class="custom-button" onclick="agregarPregunta(${modId})" style="background-color: transparent; border: 1px dashed #facc15; color: #facc15; padding: 8px; font-size: 0.9rem;">+ Agregar Pregunta</button>
        </div>
    `;
};

window.eliminarQuiz = function(modId) {
    document.getElementById(`quiz-container-${modId}`).innerHTML = '';
    document.getElementById(`quiz-container-${modId}`).nextElementSibling.style.display = 'block';
};

window.agregarPregunta = function(modId) {
    const container = document.getElementById(`preguntas-container-${modId}`);
    const pregId = getUniqueId();
    
    const preguntaHTML = `
        <div class="pregunta-card" id="pregunta-${pregId}" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <input type="text" class="custom-input pregunta-enunciado" placeholder="Escribe la pregunta..." required style="flex-grow: 1;">
                <select class="custom-input pregunta-tipo" style="width: auto;">
                    <option value="unica">Única Respuesta</option>
                    <option value="multiple">Múltiple Respuesta</option>
                    <option value="verdadero_falso">Verdadero / Falso</option>
                </select>
                <button type="button" onclick="document.getElementById('pregunta-${pregId}').remove()" style="background: #ef4444; color: white; border: none; border-radius: 4px; padding: 0 10px; cursor: pointer;">X</button>
            </div>
            
            <div class="opciones-container" id="opciones-container-${pregId}" style="padding-left: 20px;"></div>
            
            <button type="button" onclick="agregarOpcion(${pregId})" style="background: transparent; border: none; color: #4ade80; cursor: pointer; font-size: 0.85rem; margin-top: 10px; text-decoration: underline;">+ Añadir Opción de Respuesta</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', preguntaHTML);
    // Agregamos dos opciones por defecto
    agregarOpcion(pregId);
    agregarOpcion(pregId);
};

window.agregarOpcion = function(pregId) {
    const container = document.getElementById(`opciones-container-${pregId}`);
    const opId = getUniqueId();
    const opcionHTML = `
        <div class="opcion-item" id="opcion-${opId}" style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <input type="checkbox" class="opcion-correcta" title="Marcar como respuesta correcta" style="transform: scale(1.3); cursor: pointer;">
            <input type="text" class="custom-input opcion-texto" placeholder="Escribe una opción..." required style="flex-grow: 1; padding: 6px; font-size: 0.9rem;">
            <button type="button" onclick="document.getElementById('opcion-${opId}').remove()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 1.2rem;">×</button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', opcionHTML);
};