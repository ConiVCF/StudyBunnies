<?php
// salir_online.php
require_once __DIR__ . '/backend/controllers/JugadorOnlineController.php';

$controller = new JugadorOnlineController();
$controller->salir();
