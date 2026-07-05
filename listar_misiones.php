<?php
// listar_misiones.php
// Mismo patrón que guardar_mision.php: punto de entrada en la raíz que
// delega toda la lógica real al controlador MVC.

require_once __DIR__ . '/backend/controllers/MisionController.php';

$controller = new MisionController();
$controller->listar();
