<?php
// guardar_mision.php
// Se mantiene este nombre y esta ubicación (raíz del proyecto) porque
// MissionManager.js ya hace fetch('guardar_mision.php', ...) desde acá.
// Toda la lógica real vive en el controlador MVC correspondiente.

require_once __DIR__ . '/backend/controllers/MisionController.php';

$controller = new MisionController();
$controller->crear();
