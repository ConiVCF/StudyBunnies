<?php
// backend/models/ChatMensaje.php
require_once __DIR__ . '/../config/Database.php';

class ChatMensaje {
    private $conn;
    private $table_name = "chat_historial";

    // Cuántos mensajes recordar (10 intercambios = 20 mensajes)
    const MAX_HISTORIAL = 20;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    public function guardar($idUsuario, $rol, $mensaje) {
        $query = "INSERT INTO " . $this->table_name . " (id_usuario, rol, mensaje) VALUES (:id_usuario, :rol, :mensaje)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->bindParam(':rol', $rol, PDO::PARAM_STR);
        $stmt->bindParam(':mensaje', $mensaje, PDO::PARAM_STR);

        return $stmt->execute();
    }

    // Devuelve los últimos mensajes del usuario, en orden cronológico (del más viejo al más nuevo).
    public function obtenerRecientes($idUsuario, $limite = self::MAX_HISTORIAL) {
        $query = "SELECT rol, mensaje
                  FROM " . $this->table_name . "
                  WHERE id_usuario = :id_usuario
                  ORDER BY id_mensaje DESC
                  LIMIT :limite";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->bindValue(':limite', (int) $limite, PDO::PARAM_INT);
        $stmt->execute();

        $filas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return array_reverse($filas); // los devolvemos en orden cronológico
    }
}
