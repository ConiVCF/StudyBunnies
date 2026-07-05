<?php
// backend/models/Mision.php
require_once __DIR__ . '/../config/Database.php';

class Mision {
    private $conn;
    private $table_name = "misiones";

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    // Crea una nueva misión para el usuario indicado. Devuelve el id_mision
    // creado, o false si falló.
    public function crear($idUsuario, $textoTarea) {
        $query = "INSERT INTO " . $this->table_name . " (id_usuario, texto_tarea) VALUES (:id_usuario, :texto_tarea)";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->bindParam(':texto_tarea', $textoTarea, PDO::PARAM_STR);

        if ($stmt->execute()) {
            return (int) $this->conn->lastInsertId();
        }
        return false;
    }

    // Devuelve todas las misiones de un usuario, las más nuevas al final.
    public function listarPorUsuario($idUsuario) {
        $query = "SELECT id_mision, texto_tarea, estado_completado
                  FROM " . $this->table_name . "
                  WHERE id_usuario = :id_usuario
                  ORDER BY fecha_creacion ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Actualiza el estado (completada/pendiente) de una misión.
    // Filtra también por id_usuario para que nadie pueda tocar misiones ajenas.
    public function actualizarEstado($idMision, $idUsuario, $completado) {
        $query = "UPDATE " . $this->table_name . "
                  SET estado_completado = :estado
                  WHERE id_mision = :id_mision AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':estado', $completado, PDO::PARAM_INT);
        $stmt->bindParam(':id_mision', $idMision, PDO::PARAM_INT);
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    // Elimina una misión. Igual que arriba, filtra también por id_usuario.
    public function eliminar($idMision, $idUsuario) {
        $query = "DELETE FROM " . $this->table_name . "
                  WHERE id_mision = :id_mision AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_mision', $idMision, PDO::PARAM_INT);
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    // =========================================
    //   MÉTODOS PARA EL PANEL DE ADMINISTRADOR
    //   (ven y tocan las misiones de TODOS los usuarios)
    // =========================================

    // Trae todas las misiones del sistema junto con el nombre de su dueño.
    // Este es el JOIN que pide la consigna.
    public function listarTodasConUsuario() {
        $query = "SELECT
                        m.id_mision,
                        m.texto_tarea,
                        m.estado_completado,
                        m.fecha_creacion,
                        u.id_usuario,
                        u.nombre_usuario
                  FROM " . $this->table_name . " m
                  JOIN usuarios u ON m.id_usuario = u.id_usuario
                  ORDER BY m.fecha_creacion DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Actualiza el estado de CUALQUIER misión (sin filtrar por dueño).
    public function actualizarEstadoAdmin($idMision, $completado) {
        $query = "UPDATE " . $this->table_name . "
                  SET estado_completado = :estado
                  WHERE id_mision = :id_mision";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':estado', $completado, PDO::PARAM_INT);
        $stmt->bindParam(':id_mision', $idMision, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    // Elimina CUALQUIER misión (sin filtrar por dueño).
    public function eliminarAdmin($idMision) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id_mision = :id_mision";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_mision', $idMision, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    // =========================================
    //   BUSCADOR
    // =========================================

    // Escapa % y _ para que el LIKE no interprete esos caracteres como comodines
    // si el usuario los escribe literalmente en su búsqueda.
    private function escaparLike($termino) {
        return str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $termino);
    }

    // Busca, dentro de las misiones de UN usuario, las que contengan el término.
    public function buscarPorUsuario($idUsuario, $termino) {
        $query = "SELECT id_mision, texto_tarea, estado_completado
                  FROM " . $this->table_name . "
                  WHERE id_usuario = :id_usuario AND texto_tarea LIKE :termino ESCAPE '\\\\'
                  ORDER BY fecha_creacion ASC";
        $stmt = $this->conn->prepare($query);
        $like = '%' . $this->escaparLike($termino) . '%';
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->bindParam(':termino', $like, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Busca en TODAS las misiones (Administrador), por texto de tarea o nombre de usuario.
    public function buscarTodas($termino) {
        $query = "SELECT
                        m.id_mision, m.texto_tarea, m.estado_completado, m.fecha_creacion,
                        u.id_usuario, u.nombre_usuario
                  FROM " . $this->table_name . " m
                  JOIN usuarios u ON m.id_usuario = u.id_usuario
                  WHERE m.texto_tarea LIKE :termino ESCAPE '\\\\'
                     OR u.nombre_usuario LIKE :termino2 ESCAPE '\\\\'
                  ORDER BY m.fecha_creacion DESC";
        $stmt = $this->conn->prepare($query);
        $like = '%' . $this->escaparLike($termino) . '%';
        $stmt->bindParam(':termino', $like, PDO::PARAM_STR);
        $stmt->bindParam(':termino2', $like, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
