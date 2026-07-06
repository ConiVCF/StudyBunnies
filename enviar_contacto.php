<?php
// enviar_contacto.php
require_once __DIR__ . '/backend/controllers/ContactoController.php';

$controller = new ContactoController();
$controller->enviar();
