<?php
// listar_chat.php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/backend/config/AuthGuard.php';
require_once __DIR__ . '/backend/models/ChatMensaje.php';

AuthGuard::requireLoginApi();

$idUsuario = (int) $_SESSION['id_usuario'];

$chatModel = new ChatMensaje();
$mensajes = $chatModel->obtenerRecientes($idUsuario);

echo json_encode($mensajes);
