<?php
// backend/controllers/JugadorOnlineController.php

require_once __DIR__ . '/../config/AuthGuard.php';
require_once __DIR__ . '/../models/JugadorOnline.php';

class JugadorOnlineController {

    private $model;

    public function __construct() {
        $this->model = new JugadorOnline();
    }

    // Heartbeat: el cliente manda su posición actual cada pocos milisegundos.
    public function actualizar() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $nombre = $_SESSION['nombre'];

        $x = (float) ($_POST['x'] ?? 0);
        $y = (float) ($_POST['y'] ?? 0);
        $direccion = ($_POST['direccion'] ?? 'right') === 'left' ? 'left' : 'right';
        $estado = ($_POST['estado'] ?? 'idle') === 'walking' ? 'walking' : 'idle';

        // Solo permitimos caracteres válidos de nombre de archivo de sprite
        $avatar = [
            'base'      => preg_replace('/[^a-z0-9_]/i', '', $_POST['avatar_base'] ?? 'copo'),
            'clothing'  => preg_replace('/[^a-z0-9_]/i', '', $_POST['avatar_clothing'] ?? 'none'),
            'accessory' => preg_replace('/[^a-z0-9_]/i', '', $_POST['avatar_accessory'] ?? 'none'),
        ];

        header('Content-Type: application/json');
        $ok = $this->model->actualizar($idUsuario, $nombre, $x, $y, $direccion, $estado, $avatar);
        echo json_encode(['ok' => $ok]);
    }

    // Devuelve los demás jugadores activos (para dibujarlos en pantalla).
    public function listar() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $jugadores = $this->model->listarActivos($idUsuario);

        header('Content-Type: application/json');
        echo json_encode($jugadores);
    }

    // Se llama al cerrar sesión / cerrar la pestaña, para desaparecer del mapa al toque.
    public function salir() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];

        header('Content-Type: application/json');
        echo json_encode(['ok' => $this->model->eliminar($idUsuario)]);
    }
}
