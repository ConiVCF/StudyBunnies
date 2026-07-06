<?php
// listar_jugadores.php
require_once __DIR__ . '/backend/controllers/JugadorOnlineController.php';

$controller = new JugadorOnlineController();
$controller->listar();
