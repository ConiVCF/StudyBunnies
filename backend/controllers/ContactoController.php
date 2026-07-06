<?php
// backend/controllers/ContactoController.php

require_once __DIR__ . '/../models/Contacto.php';

class ContactoController {

    private $contactoModel;
    const EMAIL_DESTINO = 'contacto@StudysBunnies.com';

    public function __construct() {
        $this->contactoModel = new Contacto();
    }

    public function enviar() {
        $nombre = trim($_POST['nombre'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $mensaje = trim($_POST['mensaje'] ?? '');

        // Validaciones del lado del servidor (nunca confiar solo en el HTML)
        if ($nombre === '' || $email === '' || $mensaje === '') {
            $this->redirigirConError('faltan_datos');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->redirigirConError('email_invalido');
        }

        if (mb_strlen($nombre) > 50 || mb_strlen($mensaje) > 2000) {
            $this->redirigirConError('datos_invalidos');
        }

        // 1) Guardamos el mensaje en la base de datos (esto es lo permanente)
        $guardado = $this->contactoModel->guardar($nombre, $email, $mensaje);

        if (!$guardado) {
            $this->redirigirConError('error_bd');
        }

        // 2) Intentamos enviar el mail a la dirección simulada del sitio.
        // Nota: en XAMPP local sin SMTP configurado, mail() normalmente
        // devuelve false. Igual se llama, tal como pide la consigna, y el
        // mensaje ya quedó guardado en el paso anterior sin depender de esto.
        $nombreSeguro = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');
        $mensajeSeguro = htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');

        $asunto = "Nuevo mensaje de contacto - Cozy Study";
        $cuerpo = "Nombre: {$nombreSeguro}\nEmail: {$email}\n\nMensaje:\n{$mensajeSeguro}";
        $cabeceras = "From: {$email}\r\nReply-To: {$email}\r\n";

        @mail(self::EMAIL_DESTINO, $asunto, $cuerpo, $cabeceras);

        header("Location: contacto.php?ok=exito");
        exit;
    }

    private function redirigirConError($clave) {
        header("Location: contacto.php?error={$clave}");
        exit;
    }
}
