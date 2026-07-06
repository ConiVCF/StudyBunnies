<?php
// backend/models/Contacto.php
require_once __DIR__ . '/../config/Database.php';

class Contacto {
    private $conn;
    private $table_name = "contactos";

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    // Guarda un mensaje de contacto. Devuelve true/false.
    public function guardar($nombre, $email, $mensaje) {
        $query = "INSERT INTO " . $this->table_name . " (nombre_remitente, email_remitente, mensaje)
                  VALUES (:nombre, :email, :mensaje)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->bindParam(':mensaje', $mensaje, PDO::PARAM_STR);

        return $stmt->execute();
    }
}
