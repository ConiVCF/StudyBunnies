# 🐰 Cozy Study - Bunny World

Proyecto Integrador (Segundo Parcial) - Desarrollo Web.
Sala de estudio gamificada: armá tu conejito, organizá tus tareas académicas
en una pizarra de misiones, usá un temporizador Pomodoro, llevá una agenda
de eventos y pedile ayuda a un tutor con IA cuando te trabes con algo.

## Tecnologías utilizadas

- HTML5 + CSS3 (Flexbox)
- JavaScript (ES6, POO, módulos)
- PHP (POO, patrón MVC)
- MySQL (con relaciones entre tablas y `JOIN`)
- XAMPP (Apache + MySQL local)
- Sesiones PHP + control de acceso por rol
- Contraseñas encriptadas (`password_hash` / `password_verify`)
- Git / GitHub

## Estructura del proyecto

```
Proyecto_3.0/
├── assets/            # imágenes, sprites, audio, mapas
├── backend/
│   ├── config/        # conexión a BD, configuración, control de acceso
│   ├── controllers/   # controladores MVC
│   └── models/        # modelos MVC (Usuario, Mision, Contacto)
├── css/
├── database/          # script SQL para crear e inicializar la BD
├── js/
│   ├── core/          # GameManager (orquesta todo el juego)
│   ├── entities/      # Player, AITeacher
│   ├── scenes/        # StudyRoom
│   ├── systems/       # Timer, Misiones, Calendario, Inventario, Audio, API, Admin
│   └── utils/         # Physics, Sanitizer
├── index.php          # página principal (home, login, registro, juego)
├── contacto.php        # página de contacto (form + mapa)
├── admin.php           # panel de Administrador (ABM de misiones de todos los usuarios)
└── *.php (raíz)        # endpoints puntuales (guardar/listar/actualizar/eliminar/buscar misiones)
```

## Instalación (XAMPP)

1. Copiar la carpeta `Proyecto_3.0` dentro de `htdocs`.
2. Crear la base de datos importando `database/cozy_study_limpio.sql` en phpMyAdmin.
3. Copiar `backend/config/config.example.php` como `backend/config/config.php`
   y completar tu propia API key de Gemini (para el chat con el Profesor Michi).
4. Levantar Apache y MySQL desde el panel de XAMPP.
5. Entrar a `http://localhost/Proyecto_3.0/index.php`.

## Usuarios de prueba

| Rol       | Usuario         | Contraseña       |
|-----------|-----------------|------------------|
| Admin     | Profesor Admin  | Admin123!        |
| General   | juan            | Estudiante123!   |
| General   | maria           | Estudiante123!   |

## Roles y funcionalidades

- **Usuario General**: gestiona sus propias misiones (Altas, Bajas, Modificaciones)
  contra MySQL, con buscador propio.
- **Administrador**: panel con ABM de las misiones de **todos** los usuarios
  (`admin.php`), con buscador por tarea o por usuario.

## Seguridad

- Contraseñas encriptadas con `password_hash` / `password_verify`.
- Consultas SQL con *prepared statements* en todos los modelos.
- Control de acceso por sesión y por rol (`AuthGuard`), tanto para páginas
  completas como para endpoints AJAX.
- Textos de usuario escapados antes de insertarse en el DOM (`Sanitizer`),
  para prevenir XSS en la pizarra de misiones, el calendario y el chat de IA.
- La API key de terceros (Gemini) vive únicamente en el servidor
  (`backend/config/config.php`, excluido de git vía `.gitignore`), nunca en el frontend.
