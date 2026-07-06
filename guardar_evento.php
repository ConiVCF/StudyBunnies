<?php
// guardar_evento.php
require_once __DIR__ . '/backend/controllers/EventoController.php';

$controller = new EventoController();
$controller->crear();
