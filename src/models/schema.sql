-- Archivo: src/models/schema.sql

-- 1. Limpieza de tablas anteriores (Útil durante el desarrollo)
DROP TABLE IF EXISTS Clase_Estudiante CASCADE;
DROP TABLE IF EXISTS Clase CASCADE;
DROP TABLE IF EXISTS Estudiante CASCADE;
DROP TABLE IF EXISTS Padre CASCADE;
DROP TABLE IF EXISTS Mentor CASCADE;
DROP TABLE IF EXISTS Administrador CASCADE;

-- 2. Creación de la nueva estructura

CREATE TABLE Administrador (
    id_admin VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE Mentor (
    id_mentor VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE,
    id_admin VARCHAR(255),
    CONSTRAINT fk_admin 
        FOREIGN KEY(id_admin) 
        REFERENCES Administrador(id_admin)
);

CREATE TABLE Padre (
    id_padre VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE Estudiante (
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

CREATE TABLE Clase (
    id_clase SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    id_mentor VARCHAR(255) NOT NULL,
    CONSTRAINT fk_mentor 
        FOREIGN KEY(id_mentor) 
        REFERENCES Mentor(id_mentor)
);

CREATE TABLE Clase_Estudiante (
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