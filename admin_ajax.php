<?php
// admin_ajax.php
// Punto de entrada único (raíz del proyecto) para las acciones AJAX
// del panel de Administrador. Despacha hacia el controlador correspondiente.

require_once __DIR__ . '/backend/controllers/MisionController.php';
require_once __DIR__ . '/backend/controllers/UsuarioController.php';

$accion = $_POST['accion'] ?? $_GET['accion'] ?? '';

$misionController = new MisionController();
$usuarioController = new UsuarioController();

switch ($accion) {
    case 'listar_misiones':
        $misionController->listarTodasAdmin();
        break;

    case 'crear_mision':
        $misionController->crearAdmin();
        break;

    case 'actualizar_estado':
        $misionController->actualizarEstadoAdminAccion();
        break;

    case 'eliminar_mision':
        $misionController->eliminarAdminAccion();
        break;

    case 'listar_usuarios':
        $usuarioController->listarGenerales();
        break;

    case 'buscar_misiones':
        $misionController->buscarAdmin();
        break;

    default:
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Acción no reconocida.']);
}
