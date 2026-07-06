<?php
// admin.php
// Panel de Administrador: ABM de las misiones de todos los usuarios.

require_once __DIR__ . '/backend/config/AuthGuard.php';

// Si no estás logueado o no sos Administrador, esto redirige antes de mostrar nada.
AuthGuard::requireRole(AuthGuard::ROL_ADMIN);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cozy Study - Panel de Administrador</title>
    <link rel="icon" type="image/png" href="assets/img/favicon.png">
    <link rel="shortcut icon" type="image/x-icon" href="assets/img/favicon.ico">
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
    <div class="container">
        <div class="admin-topbar">
            <h1>🐾 Panel de Administrador</h1>
            <div style="display:flex; gap:10px;">
                <a class="volver-link" href="index.php">← Volver al juego</a>
                <a class="volver-link" href="backend/controllers/AuthController.php?action=logout">Salir</a>
            </div>
        </div>

        <section class="admin-panel">
            <h2>Asignar nueva misión</h2>
            <div class="form-nueva-mision">
                <select id="admin-select-usuario"></select>
                <input type="text" id="admin-input-tarea" placeholder="Descripción de la tarea..." maxlength="255">
                <button id="admin-btn-crear" type="button">➕ Crear</button>
            </div>
            <div id="admin-mensaje"></div>
        </section>

        <section class="admin-panel">
            <h2>Todas las misiones del sistema</h2>
            <div class="form-nueva-mision" style="margin-bottom: 15px;">
                <input type="text" id="admin-search-input" placeholder="🔍 Buscar por tarea o usuario..." autocomplete="off">
                <button id="admin-btn-search" type="button">Buscar</button>
                <button id="admin-btn-clear-search" type="button">Ver todas</button>
            </div>
            <div class="tabla-wrapper">
                <table class="tabla-misiones">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Tarea</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="admin-tabla-body">
                        <!-- Se completa dinámicamente desde admin_ajax.php -->
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <script src="js/systems/AdminPanel.js"></script>
</body>
</html>
