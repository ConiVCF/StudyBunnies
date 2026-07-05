<?php
// backend/controllers/UsuarioController.php

require_once __DIR__ . '/../config/AuthGuard.php';
require_once __DIR__ . '/../models/Usuario.php';

class UsuarioController {

    private $usuarioModel;

    public function __construct() {
        $this->usuarioModel = new Usuario();
    }

    // Devuelve en JSON los usuarios Generales, para el selector del admin.
    public function listarGenerales() {
        AuthGuard::requireRoleApi(AuthGuard::ROL_ADMIN);

        $usuarios = $this->usuarioModel->listarGenerales();

        header('Content-Type: application/json');
        echo json_encode($usuarios);
    }
}
