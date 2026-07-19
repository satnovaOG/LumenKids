# LumenKids

(Este nombre es provisional y no definitivo)

Prototipo del módulo de gamificación académica para un ecosistema educativo inteligente enfocado en aprendizaje autónomo, pensamiento lógico, habilidades tecnológicas y resolución colaborativa de problemas.

La aplicación incluye panel para crear cuentas e iniciar sesión, perfiles activos y un tablero por curso/grupo para visualizar progreso individual y de clase. Las cuentas y el progreso se almacenan en Neon PostgreSQL a través del backend en `server.js`.

## Qué incluye

- Retos semanales con puntuación y progreso persistente.
- Olimpiada matemática con evaluación por rondas.
- Sistema de roles para cooperación en problemas abiertos.
- Panel para crear cuentas e iniciar sesión.
- Tablero de curso/grupo con indicadores de clase.
- Progreso independiente por perfil.
- Panel docente para editar cursos, grupos, asignaciones y ranking.
- Insignias digitales por constancia, precisión y trabajo en equipo.

## Neon PostgreSQL

1. Crea una base de datos en Neon y copia tu cadena de conexión.
2. Duplica `.env.example` como `.env` y define `NEON_DATABASE_URL`.
3. Ejecuta `npm install` y luego `npm start`.
4. Abre `http://localhost:3000` para usar la app con cuentas y progreso remotos.

Si Neon no está configurado, el servidor devuelve el estado inicial incorporado, pero la creación de cuentas e inicio de sesión requieren la base de datos.

## Cómo abrirlo

1. Inicia el servidor con Neon configurado.
2. Abre `http://localhost:3000` en el navegador.
3. Crea una cuenta o inicia sesión, luego usa el panel para gestionar el progreso.
