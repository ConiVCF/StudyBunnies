<?php
// backend/controllers/MisionController.php
// Controlador del ABM de misiones (contenido principal del usuario General).

require_once __DIR__ . '/../config/AuthGuard.php';
require_once __DIR__ . '/../models/Mision.php';

class MisionController {

    private $misionModel;

    public function __construct() {
        $this->misionModel = new Mision();
    }

    // Crea una misión para el usuario logueado.
    // Responde en texto plano ("Exito|id" o "Error: ...") porque así
    // lo espera hoy MissionManager.js en el frontend.
    public function crear() {
        // Corta con 401 si no hay sesión activa (reutiliza el guard de la Fase 2)
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $texto = trim($_POST['tarea'] ?? '');

        if ($texto === '') {
            http_response_code(400);
            echo "Error: la tarea no puede estar vacía.";
            return;
        }

        if (mb_strlen($texto) > 255) {
            http_response_code(400);
            echo "Error: la tarea es demasiado larga (máximo 255 caracteres).";
            return;
        }

        $idMision = $this->misionModel->crear($idUsuario, $texto);

        if ($idMision !== false) {
            echo "Exito|" . $idMision;
        } else {
            http_response_code(500);
            echo "Error: no se pudo guardar la misión en la base de datos.";
        }
    }

    // Devuelve en JSON las misiones del usuario logueado.
    public function listar() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $misiones = $this->misionModel->listarPorUsuario($idUsuario);

        header('Content-Type: application/json');
        echo json_encode($misiones);
    }

    // Marca una misión como completada o pendiente.
    public function actualizarEstado() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $idMision = (int) ($_POST['id_mision'] ?? 0);
        $completado = (isset($_POST['completado']) && $_POST['completado'] === '1') ? 1 : 0;

        if ($idMision <= 0) {
            http_response_code(400);
            echo "Error: falta el id de la misión.";
            return;
        }

        $ok = $this->misionModel->actualizarEstado($idMision, $idUsuario, $completado);
        echo $ok ? "Exito" : "Error: no se pudo actualizar la misión.";
    }

    // Elimina una misión del usuario logueado.
    public function eliminar() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $idMision = (int) ($_POST['id_mision'] ?? 0);

        if ($idMision <= 0) {
            http_response_code(400);
            echo "Error: falta el id de la misión.";
            return;
        }

        $ok = $this->misionModel->eliminar($idMision, $idUsuario);
        echo $ok ? "Exito" : "Error: no se pudo eliminar la misión.";
    }

    // =========================================
    //   ACCIONES DE ADMINISTRADOR
    // =========================================

    // Lista TODAS las misiones del sistema, con el nombre de cada dueño (JOIN).
    public function listarTodasAdmin() {
        AuthGuard::requireRoleApi(AuthGuard::ROL_ADMIN);

        $misiones = $this->misionModel->listarTodasConUsuario();

        header('Content-Type: application/json');
        echo json_encode($misiones);
    }

    // Crea una misión asignada a cualquier usuario (elegido por el admin).
    public function crearAdmin() {
        AuthGuard::requireRoleApi(AuthGuard::ROL_ADMIN);

        $idUsuarioDestino = (int) ($_POST['id_usuario'] ?? 0);
        $texto = trim($_POST['tarea'] ?? '');

        if ($idUsuarioDestino <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Debés elegir a qué usuario asignarle la tarea.']);
            return;
        }

        if ($texto === '' || mb_strlen($texto) > 255) {
            http_response_code(400);
            echo json_encode(['error' => 'La tarea no puede estar vacía ni superar 255 caracteres.']);
            return;
        }

        $idMision = $this->misionModel->crear($idUsuarioDestino, $texto);

        header('Content-Type: application/json');
        if ($idMision !== false) {
            echo json_encode(['ok' => true, 'id_mision' => $idMision]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo crear la misión.']);
        }
    }

    // Actualiza el estado de CUALQUIER misión.
    public function actualizarEstadoAdminAccion() {
        AuthGuard::requireRoleApi(AuthGuard::ROL_ADMIN);

        $idMision = (int) ($_POST['id_mision'] ?? 0);
        $completado = (isset($_POST['completado']) && $_POST['completado'] === '1') ? 1 : 0;

        header('Content-Type: application/json');
        if ($idMision <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id de la misión.']);
            return;
        }

        $ok = $this->misionModel->actualizarEstadoAdmin($idMision, $completado);
        echo json_encode(['ok' => $ok]);
    }

    // Elimina CUALQUIER misión.
    public function eliminarAdminAccion() {
        AuthGuard::requireRoleApi(AuthGuard::ROL_ADMIN);

        $idMision = (int) ($_POST['id_mision'] ?? 0);

        header('Content-Type: application/json');
        if ($idMision <= 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Falta el id de la misión.']);
            return;
        }

        $ok = $this->misionModel->eliminarAdmin($idMision);
        echo json_encode(['ok' => $ok]);
    }

    // Busca en las misiones del usuario logueado (usuario General).
    public function buscar() {
        AuthGuard::requireLoginApi();

        $idUsuario = (int) $_SESSION['id_usuario'];
        $termino = trim($_GET['q'] ?? '');

        header('Content-Type: application/json');

        if ($termino === '') {
            echo json_encode([]);
            return;
        }

        $resultados = $this->misionModel->buscarPorUsuario($idUsuario, $termino);
        echo json_encode($resultados);
    }

    // Busca en TODAS las misiones del sistema (Administrador).
    public function buscarAdmin() {
        AuthGuard::requireRoleApi(AuthGuard::ROL_ADMIN);

        $termino = trim($_GET['q'] ?? '');

        header('Content-Type: application/json');

        if ($termino === '') {
            echo json_encode([]);
            return;
        }

        $resultados = $this->misionModel->buscarTodas($termino);
        echo json_encode($resultados);
    }
}
