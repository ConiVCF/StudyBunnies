<?php
// backend/config/AuthGuard.php
// Control de acceso reutilizable: sesión y roles.
// Se usa al principio de cualquier página o endpoint que necesite protección.

class AuthGuard {

    const ROL_GENERAL = 0;
    const ROL_ADMIN = 1;

    private static function asegurarSesionIniciada() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    // Para PÁGINAS COMPLETAS: si no hay sesión activa, redirige.
    public static function requireLogin($redirectTo = 'index.php') {
        self::asegurarSesionIniciada();

        if (!isset($_SESSION['id_usuario'])) {
            header("Location: {$redirectTo}?error=sesion_requerida");
            exit;
        }
    }

    // Para PÁGINAS COMPLETAS que además exigen un rol puntual (ej: Administrador).
    public static function requireRole($rolRequerido, $redirectTo = 'index.php') {
        self::requireLogin($redirectTo);

        if ((int)($_SESSION['rol'] ?? -1) !== (int)$rolRequerido) {
            header("Location: {$redirectTo}?error=acceso_denegado");
            exit;
        }
    }

    // Para ENDPOINTS AJAX/JSON (fetch): en vez de redirigir, corta con 401 + JSON.
    public static function requireLoginApi() {
        self::asegurarSesionIniciada();

        if (!isset($_SESSION['id_usuario'])) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Debes iniciar sesión para usar esta función.']);
            exit;
        }
    }

    // Para ENDPOINTS AJAX/JSON que además exigen un rol puntual (ej: panel de Administrador).
    public static function requireRoleApi($rolRequerido) {
        self::requireLoginApi();

        if ((int)($_SESSION['rol'] ?? -1) !== (int)$rolRequerido) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'No tenés permisos para realizar esta acción.']);
            exit;
        }
    }

    // Consulta simple sin cortar ejecución (útil dentro de una vista para mostrar/ocultar partes).
    public static function tieneRol($rolRequerido) {
        self::asegurarSesionIniciada();
        return isset($_SESSION['rol']) && (int)$_SESSION['rol'] === (int)$rolRequerido;
    }
}
