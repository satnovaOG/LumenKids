# LumenKids - Ecosistema Educativo Inteligente

(Este nombre es provisional y no definitivo)

LumenKids es una plataforma web diseñada para conectar estudiantes, padres y mentores mediante un ecosistema de aprendizaje seguro. Este proyecto utiliza Node.js, Express y PostgreSQL para gestionar los datos, integrando Clerk para una autenticación moderna e inyectando un diseño centrado en la usabilidad.

## Estructura del Proyecto

El código está organizado siguiendo una adaptación del patrón Modelo-Vista-Controlador (MVC) para facilitar su escalabilidad:

```text
LumenKids/
├── src/
│   ├── config/      # Configuración de conexiones (ej. base de datos)
│   ├── controllers/ # Lógica de negocio de la aplicación
│   ├── models/      # Esquemas SQL y scripts de inicialización
│   ├── public/      # Interfaz gráfica estática (HTML, CSS, JS del cliente)
│   ├── routes/      # Definición de endpoints de la API
│   └── server.js    # Archivo principal de ejecución del servidor Express
├── tests/           # Directorio para futuras pruebas unitarias
├── .env.example     # Plantilla de variables de entorno
├── .gitignore       # Archivos ignorados por el control de versiones
└── package.json     # Dependencias del proyecto
```

## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:
* Node.js (Versión 18 o superior recomendada)
* Una cuenta en Neon para la base de datos PostgreSQL
* Una cuenta en Clerk para la gestión de autenticación

## Instalación y Configuración

1. **Instalar dependencias:**
   Abre una terminal en la raíz del proyecto y ejecuta:
   ```bash
   npm install
   ```

2. **Configurar las Variables de Entorno:**
   Copia el archivo de plantilla para crear tu propio archivo de configuración local:
   ```bash
   cp .env.example .env
   ```
   Abre el archivo `.env` y completa las variables con tus credenciales reales:
   ```env
   PORT=3000
   NEON_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=verify-full
   
   CLERK_PUBLISHABLE_KEY=pk_test_tu_clave_publica
   CLERK_SECRET_KEY=sk_test_tu_clave_privada
   
   ADMIN_CLERK_ID=user_tu_id_de_clerk
   ADMIN_NOMBRE=Tu Nombre
   ADMIN_CORREO=tu_correo@ejemplo.com
   ```

## Configuración de la Base de Datos

El proyecto cuenta con scripts automatizados para levantar la estructura de datos sin necesidad de consolas SQL externas.

1. **Crear las tablas relacionales:**
   Este comando construye las tablas para Administradores, Mentores, Padres, Estudiantes y Clases, respetando las llaves foráneas.
   ```bash
   node src/models/initDb.js
   ```

2. **Registrar al Administrador Principal:**
   Para poder acceder al panel de gestión, debes registrar tu cuenta de Clerk en la base de datos ejecutando:
   ```bash
   node src/models/crearAdmin.js
   ```

## Ejecución del Servidor

Una vez completada la configuración, inicia el servidor de desarrollo:
```bash
node src/server.js
```
El ecosistema estará disponible en tu navegador visitando: `http://localhost:3000`

## Características Implementadas

* **Autenticación Centralizada:** Inicio de sesión y registro gestionados mediante Clerk, con interfaz completamente traducida al español.
* **Redirección por Roles:** El sistema detecta automáticamente si el usuario es un Administrador y lo redirige a su panel exclusivo de gestión.
* **Vinculación Familiar Automática:** Al registrarse, el estudiante recibe un código alfanumérico único. El padre utiliza este código durante su propio registro para vincular ambas cuentas en PostgreSQL de forma segura.
* **Gestión Segura de Docentes:** El Administrador puede crear cuentas de Mentores. El sistema registra al docente en Clerk generándole una contraseña aleatoria de 12 caracteres, asegurando altos estándares de integridad.
