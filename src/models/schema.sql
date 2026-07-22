-- Archivo: src/models/schema.sql

-- 1. Limpieza de tablas anteriores (Útil durante el desarrollo)

-- 2. Creación de la nueva estructura

CREATE TABLE IF NOT EXISTS Administrador (
    id_admin VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS Mentor (
    id_mentor VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE,
    id_admin VARCHAR(255),
    CONSTRAINT fk_admin 
        FOREIGN KEY(id_admin) 
        REFERENCES Administrador(id_admin)
);

CREATE TABLE IF NOT EXISTS Padre (
    id_padre VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS Estudiante (
    id_estudiante VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    edad INTEGER,
    nivel VARCHAR(50),
    codigo_vinculacion VARCHAR(10) UNIQUE NOT NULL,
    id_padre VARCHAR(255),
    CONSTRAINT fk_padre 
        FOREIGN KEY(id_padre) 
        REFERENCES Padre(id_padre) 
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Clase (
    id_clase SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    id_mentor VARCHAR(255) NOT NULL,
    CONSTRAINT fk_mentor 
        FOREIGN KEY(id_mentor) 
        REFERENCES Mentor(id_mentor)
);

CREATE TABLE IF NOT EXISTS Clase_Estudiante (
    id_clase INTEGER NOT NULL,
    id_estudiante VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_clase, id_estudiante),
    CONSTRAINT fk_clase 
        FOREIGN KEY(id_clase) 
        REFERENCES Clase(id_clase),
    CONSTRAINT fk_estudiante_clase 
        FOREIGN KEY(id_estudiante) 
        REFERENCES Estudiante(id_estudiante)
);

CREATE TABLE IF NOT EXISTS Ruta_Aprendizaje (
    id_ruta SERIAL PRIMARY KEY,
    nombre_curso VARCHAR(255) NOT NULL,
    area VARCHAR(100) NOT NULL,
    url_coursera VARCHAR(508) NOT NULL,
    id_mentor VARCHAR(255) NOT NULL,
    CONSTRAINT fk_mentor_ruta 
        FOREIGN KEY(id_mentor) 
        REFERENCES Mentor(id_mentor) 
        ON DELETE CASCADE
);

-- Tabla de relación para asociar estudiantes con sus rutas activas
CREATE TABLE IF NOT EXISTS Estudiante_Ruta (
    id_estudiante VARCHAR(255) NOT NULL,
    id_ruta INTEGER NOT NULL,
    progreso_porcentaje INTEGER DEFAULT 0,
    PRIMARY KEY (id_estudiante, id_ruta),
    CONSTRAINT fk_estudiante_ruta 
        FOREIGN KEY(id_estudiante) 
        REFERENCES Estudiante(id_estudiante) 
        ON DELETE CASCADE,
    CONSTRAINT fk_ruta_estudiante 
        FOREIGN KEY(id_ruta) 
        REFERENCES Ruta_Aprendizaje(id_ruta) 
        ON DELETE CASCADE
);

-- =========================================================================
-- AMPLIACIÓN: CREACIÓN DE CURSOS COMPLEJOS Y EVALUACIONES 
-- =========================================================================

-- 1. Tabla para los Módulos/Temas del curso
CREATE TABLE IF NOT EXISTS Tema (
    id_tema SERIAL PRIMARY KEY,
    nombre_tema VARCHAR(255) NOT NULL,
    id_ruta INTEGER NOT NULL,
    CONSTRAINT fk_ruta_tema 
        FOREIGN KEY(id_ruta) 
        REFERENCES Ruta_Aprendizaje(id_ruta) 
        ON DELETE CASCADE
);

-- 2. Tabla para el material de lectura o contenido teórico
CREATE TABLE IF NOT EXISTS Leccion (
    id_leccion SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    id_tema INTEGER NOT NULL,
    CONSTRAINT fk_tema_leccion 
        FOREIGN KEY(id_tema) 
        REFERENCES Tema(id_tema) 
        ON DELETE CASCADE
);

-- 3. Tabla principal para los Quizzes/Exámenes
CREATE TABLE IF NOT EXISTS Evaluacion (
    id_evaluacion SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    id_tema INTEGER NOT NULL,
    CONSTRAINT fk_tema_evaluacion 
        FOREIGN KEY(id_tema) 
        REFERENCES Tema(id_tema) 
        ON DELETE CASCADE
);

-- 4. Tabla para las preguntas de la evaluación
CREATE TABLE IF NOT EXISTS Pregunta (
    id_pregunta SERIAL PRIMARY KEY,
    enunciado TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- Ej: 'multiple', 'verdadero_falso'
    id_evaluacion INTEGER NOT NULL,
    CONSTRAINT fk_evaluacion_pregunta 
        FOREIGN KEY(id_evaluacion) 
        REFERENCES Evaluacion(id_evaluacion) 
        ON DELETE CASCADE
);

-- 5. Tabla para las respuestas (calificación automática)
CREATE TABLE IF NOT EXISTS Opcion (
    id_opcion SERIAL PRIMARY KEY,
    texto_opcion TEXT NOT NULL,
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
    id_pregunta INTEGER NOT NULL,
    CONSTRAINT fk_pregunta_opcion 
        FOREIGN KEY(id_pregunta) 
        REFERENCES Pregunta(id_pregunta) 
        ON DELETE CASCADE
);

-- Eliminamos la restricción anterior que obligaba a usar una ruta de Coursera
ALTER TABLE Tema DROP CONSTRAINT IF EXISTS fk_ruta_tema;
ALTER TABLE Tema DROP COLUMN IF EXISTS id_ruta;

-- Añadimos la nueva columna para que los módulos pertenezcan a una Clase
ALTER TABLE Tema ADD COLUMN id_clase INTEGER;
ALTER TABLE Tema ADD CONSTRAINT fk_clase_tema FOREIGN KEY (id_clase) REFERENCES Clase(id_clase) ON DELETE CASCADE;