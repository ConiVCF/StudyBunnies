<?php
// buscar_misiones.php
// Mismo patrón que listar_misiones.php. Recibe ?q=termino por GET.

require_once __DIR__ . '/backend/controllers/MisionController.php';

$controller = new MisionController();
$controller->buscar();
