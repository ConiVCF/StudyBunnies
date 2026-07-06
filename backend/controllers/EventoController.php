<?php
// backend/controllers/EventoController.php

require_once __DIR__ . '/../config/AuthGuard.php';
require_once __DIR__ . '/../models/Evento.php';

class EventoController {

    private $eventoModel;

    public function __construct() {
        $this->eventoModel = new Evento();
    }

    // Crea un evento para el usuario logueado.
    // Responde en texto plano ("Exito|id" o "Error: ..."), igual que las misiones.
    public function crear() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $titulo = trim($_POST['titulo'] ?? '');
        $tipo = trim($_POST['tipo'] ?? '');
        $fecha = trim($_POST['fecha'] ?? '');
        $recordatoriosRaw = trim($_POST['recordatorios'] ?? '');

        if ($titulo === '' || $fecha === '') {
            http_response_code(400);
            echo "Error: faltan datos para agendar el evento.";
            return;
        }

        if (mb_strlen($titulo) > 100) {
            http_response_code(400);
            echo "Error: el título es demasiado largo (máximo 100 caracteres).";
            return;
        }

        if (!in_array($tipo, Evento::TIPOS_VALIDOS, true)) {
            http_response_code(400);
            echo "Error: tipo de evento inválido.";
            return;
        }

        $fechaObj = DateTime::createFromFormat('Y-m-d', $fecha);
        if (!$fechaObj || $fechaObj->format('Y-m-d') !== $fecha) {
            http_response_code(400);
            echo "Error: fecha inválida.";
            return;
        }

        // Los recordatorios llegan como "7,3,1,0" (o vacío)
        $recordatorios = $recordatoriosRaw === ''
            ? []
            : array_filter(array_map('intval', explode(',', $recordatoriosRaw)), fn($n) => $n >= 0);

        $idEvento = $this->eventoModel->crear($idUsuario, $titulo, $tipo, $fecha, $recordatorios);

        if ($idEvento !== false) {
            echo "Exito|" . $idEvento;
        } else {
            http_response_code(500);
            echo "Error: no se pudo guardar el evento en la base de datos.";
        }
    }

    // Devuelve en JSON los eventos del usuario logueado.
    public function listar() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $eventos = $this->eventoModel->listarPorUsuario($idUsuario);

        header('Content-Type: application/json');
        echo json_encode($eventos);
    }

    // Elimina un evento del usuario logueado.
    public function eliminar() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $idEvento = (int) ($_POST['id_evento'] ?? 0);

        if ($idEvento <= 0) {
            http_response_code(400);
            echo "Error: falta el id del evento.";
            return;
        }

        $ok = $this->eventoModel->eliminar($idEvento, $idUsuario);
        echo $ok ? "Exito" : "Error: no se pudo eliminar el evento.";
    }
}
