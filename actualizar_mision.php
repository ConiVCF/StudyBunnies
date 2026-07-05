<?php
// actualizar_mision.php
// Mismo patrón que guardar_mision.php / listar_misiones.php.

require_once __DIR__ . '/backend/controllers/MisionController.php';

$controller = new MisionController();
$controller->actualizarEstado();
