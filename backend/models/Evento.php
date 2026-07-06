<?php
// backend/models/Evento.php
require_once __DIR__ . '/../config/Database.php';

class Evento {
    private $conn;
    private $table_name = "eventos";

    const TIPOS_VALIDOS = ['Examen', 'Final', 'TP', 'Proyecto', 'Personal'];

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    // Crea un evento para el usuario indicado. $recordatorios es un array de enteros.
    // Devuelve el id_evento creado, o false si falló.
    public function crear($idUsuario, $titulo, $tipo, $fecha, array $recordatorios) {
        $recordatoriosTexto = implode(',', array_map('intval', $recordatorios));

        $query = "INSERT INTO " . $this->table_name . "
                  (id_usuario, titulo, tipo, fecha, recordatorios)
                  VALUES (:id_usuario, :titulo, :tipo, :fecha, :recordatorios)";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->bindParam(':titulo', $titulo, PDO::PARAM_STR);
        $stmt->bindParam(':tipo', $tipo, PDO::PARAM_STR);
        $stmt->bindParam(':fecha', $fecha, PDO::PARAM_STR);
        $stmt->bindParam(':recordatorios', $recordatoriosTexto, PDO::PARAM_STR);

        if ($stmt->execute()) {
            return (int) $this->conn->lastInsertId();
        }
        return false;
    }

    // Devuelve todos los eventos de un usuario, ordenados por fecha más próxima.
    public function listarPorUsuario($idUsuario) {
        $query = "SELECT id_evento, titulo, tipo, fecha, recordatorios
                  FROM " . $this->table_name . "
                  WHERE id_usuario = :id_usuario
                  ORDER BY fecha ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Elimina un evento. Filtra también por id_usuario (nadie borra eventos ajenos).
    public function eliminar($idEvento, $idUsuario) {
        $query = "DELETE FROM " . $this->table_name . "
                  WHERE id_evento = :id_evento AND id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_evento', $idEvento, PDO::PARAM_INT);
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }
}
