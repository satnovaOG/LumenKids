# LumenKids - Ecosistema Educativo Inteligente

(Este nombre es provisional y no definitivo)
LumenKids es una plataforma web gratuita orientada a niños y jóvenes (10–18 años) de zonas vulnerables de Barranquilla. Conecta **estudiantes**, **padres/acudientes**, **mentores**  en un mismo ecosistema de aprendizaje: rutas externas (Coursera), cursos propios con lecciones y quizzes, retos gamificados, seguimiento pedagógico y paneles por rol.

**Stack:** Node.js · Express · PostgreSQL (Neon) · Clerk (autenticación) · HTML/CSS/JS estático

---

## Estructura del proyecto

```text
LumenKids/
├── src/
│   ├── config/
│   │   └── db.js              # Conexión Pool a Neon (PostgreSQL)
│   ├── models/
│   │   ├── schema.sql         # Tablas y migraciones
│   │   ├── initDb.js          # Aplica schema.sql
│   │   ├── crearAdmin.js      # Registra el administrador principal
│   │   ├── seedDatos.js       # Datos de demostración (mockups)
│   │   └── verificarDatos.js  # Utilidad de inspección
│   ├── public/                # Interfaz (HTML, CSS, JS del cliente)
│   │   ├── index.html         # Landing + acceso (Clerk)
│   │   ├── dashboard.html     # Paneles por rol (estudiante, padre, mentor)
│   │   ├── admin.html         # Panel de administración
│   │   ├── crear-curso.html   # Constructor de cursos (docente)
│   │   ├── mis-cursos.html    # Listado de cursos del docente
│   │   ├── styles.css
│   │   ├── dashboard.js
│   │   ├── admin.js
│   │   ├── crear-curso.js
│   │   └── mis-cursos.js
│   └── server.js              # Servidor Express + API REST
├── tests/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Requisitos previos

* Node.js 18 o superior
* Cuenta en [Neon](https://neon.tech) (PostgreSQL)
* Cuenta en [Clerk](https://clerk.com) (autenticación)

> **Nota (Windows):** Si usas WSL/Ubuntu, ejecuta los comandos desde esa terminal y trabaja en la carpeta del proyecto (`/mnt/c/Users/.../LumenKids` o tu copia local). Asegúrate de hacer `npm install` en el mismo directorio desde el que lanzas el servidor.

---

## Instalación y configuración

1. **Instalar dependencias**

```bash
npm install
```

2. **Variables de entorno**

```bash
cp .env.example .env
```

Completa `.env` con tus credenciales:

```env
PORT=3000
NEON_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require

CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_publica
CLERK_SECRET_KEY=sk_test_tu_clave_privada

ADMIN_CLERK_ID=user_tu_id_de_clerk
ADMIN_NOMBRE=Tu Nombre
ADMIN_CORREO=tu_correo@ejemplo.com
```

---

## Base de datos

1. **Crear / actualizar tablas**

```bash
node src/models/initDb.js
```

Crea (o actualiza) tablas de Administrador, Mentor, Padre, Estudiante, Clase, Rutas, Temas, Lecciones, Evaluaciones, Retos, Seguimiento, etc.

2. **Registrar el administrador principal**

Debes haber creado primero tu usuario en Clerk. Luego:

```bash
node src/models/crearAdmin.js
```

3. **(Opcional) Cargar datos de demostración**

```bash
node src/models/seedDatos.js
```

Inserta mentor/padre demo, 6 estudiantes (`DEMO01`–`DEMO06`), 2 cursos con módulos, 3 rutas Coursera, 7 retos, intentos y orientaciones. El script es idempotente (se puede ejecutar varias veces).

---

## Ejecución

```bash
node src/server.js
```

Abre: [http://localhost:3000](http://localhost:3000)

Si el puerto 3000 está ocupado (`EADDRINUSE`), libera el proceso o cambia `PORT` en `.env`.

---

## Roles y paneles

| Rol | Cómo se obtiene | Panel |
|-----|-----------------|--------|
| **Estudiante** | Registro en la landing | Dashboard: rutas Coursera, cursos del docente, retos, insignias, recomendaciones |
| **Padre** | Registro + código de vinculación del hijo | Progreso, fortalezas, alertas de desmotivación, contenido educativo |
| **Mentor** | Solo lo crea el administrador | Seguimiento, publicación de retos, rutas Coursera, constructor de cursos |
| **Administrador** | Script `crearAdmin.js` | Crear mentores, ver cuentas, eliminar rutas y cursos |


---

## Características implementadas

### Landing y autenticación
* Página de inicio con misión, oferta y flujo de acceso (sin menús desplegables)
* Login / registro con Clerk (español)
* Selección de rol con tarjetas (Estudiante / Padre)
* Código de vinculación familiar al registrar padres

### Estudiante (RF1, RF2, RF5)
* Rutas de aprendizaje externas (Coursera) con progreso
* **Mis Cursos:** ver cursos creados por docentes (módulos, lecciones y quizzes con calificación automática)
* Retos semanales, olimpiadas y juegos con puntaje inmediato
* Insignias, nivel, estadísticas y recomendaciones personalizadas
* Orientaciones enviadas por el mentor

### Padre (RF3)
* Seguimiento del hijo vinculado
* Fortalezas en lenguaje sencillo y alertas de baja actividad
* Vinculación posterior por código si no se usó al registrarse
* Artículos sobre IA y tecnología

### Mentor (RF4)
* Tabla de estudiantes de sus clases y seguimiento pedagógico
* Orientaciones (visibles a estudiante/familia) y notas privadas
* Publicación de retos
* Creación y asignación de rutas Coursera
* Constructor de cursos dinámicos (módulos, lecciones, quizzes) e inscripción de alumnos

### Administrador
* Crear docentes (cuenta Clerk + contraseña temporal)
* Visualizar cuentas de estudiantes, mentores y padres
* Listar y **eliminar** rutas de aprendizaje
* Listar y **eliminar** cursos (incluye módulos e inscripciones)

---

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm install` | Instala dependencias |
| `node src/models/initDb.js` | Aplica el esquema SQL |
| `node src/models/crearAdmin.js` | Registra el admin del `.env` |
| `node src/models/seedDatos.js` | Carga datos demo |
| `node src/server.js` | Inicia el servidor |

---

## API (resumen)

Autenticación: todas las rutas `/api/*` (excepto `/api/config`) requieren el Bearer token de Clerk.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/config` | Publishable key de Clerk |
| GET | `/api/verificar-rol` | `admin` / `mentor` / `padre` / `estudiante` |
| POST | `/api/registro-estudiante` | Alta de estudiante + código |
| POST | `/api/registro-padre` | Alta de padre (+ vinculación opcional) |
| POST | `/api/crear-mentor` | Solo admin |
| GET/POST | `/api/retos` | Listar / publicar retos |
| POST | `/api/retos/:id/responder` | Responder reto |
| GET | `/api/panel-estudiante` | Stats, rutas, insignias, recomendaciones |
| GET | `/api/panel-padre` | Hijos, alertas, fortalezas |
| GET | `/api/mis-clases` | Cursos del estudiante |
| GET | `/api/clases/:id/contenido` | Módulos, lecciones, quizzes |
| POST | `/api/evaluaciones/:id/responder` | Calificar quiz |
| GET | `/api/admin/cuentas` | Listado de cuentas (admin) |
| GET/DELETE | `/api/admin/rutas[/:id]` | Gestionar rutas (admin) |
| GET/DELETE | `/api/admin/cursos[/:id]` | Gestionar cursos (admin) |

---

## Probar con datos demo

Tras `seedDatos.js`:

1. Inicia sesión / regístrate como **estudiante** y verás los 7 retos activos.
2. Como **padre**, usa un código libre como `DEMO03` o `DEMO04` para vincular un hijo demo (o el código de un estudiante real).
3. Como **admin**, entra a `/admin.html` para ver cuentas y gestionar rutas/cursos.
4. Los mentores se crean solo desde el panel admin; luego inician sesión con el correo y la contraseña temporal generada.
