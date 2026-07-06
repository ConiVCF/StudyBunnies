<?php
session_start();
require_once __DIR__ . '/../models/Usuario.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $usuarioModel = new Usuario();
    
    // Leemos el campo oculto que agregamos en tu HTML
    $accion = $_POST['auth_action'] ?? 'login';
    
    // --- LÓGICA DE REGISTRO ---
    if ($accion === 'register') {
        $nombre = trim($_POST['usuario_reg']);
        $email = trim($_POST['email_reg']);
        $password = $_POST['password_reg'];
        
        if ($usuarioModel->registrar($nombre, $email, $password)) {
            header("Location: ../../index.php?msg=registro_exitoso");
            exit;
        } else {
            header("Location: ../../index.php?error=credenciales_invalidas");
            exit;
        }
    }
    
    // --- LÓGICA DE LOGIN ---
    if ($accion === 'login') {
        // En tu formulario usas "usuario_reg" tanto para el nombre como para el login
        $nombre = trim($_POST['usuario_reg']); 
        $password = $_POST['password_reg'];
        
        // Modificamos el login para que busque por nombre de usuario en lugar de email
        $userData = $usuarioModel->login($nombre, $password);
        
        if ($userData) {
            $_SESSION['id_usuario'] = $userData['id_usuario'];
            $_SESSION['nombre'] = $userData['nombre_usuario'];
            $_SESSION['rol'] = $userData['rol'];
            header("Location: ../../index.php");
            exit;
        } else {
            header("Location: ../../index.php?error=credenciales_invalidas");
            exit;
        }
    }
}

// --- LOGOUT ---
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    session_start();
    session_destroy();
    header("Location: ../../index.php");
    exit;
}
?>