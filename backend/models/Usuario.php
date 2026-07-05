<?php
// backend/models/Usuario.php
require_once __DIR__ . '/../config/Database.php';

class Usuario {
    private $conn;
    private $table_name = "usuarios";

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    // Método para registrar usuario general
    public function registrar($nombre, $email, $password) {
        // rol 0 es Usuario General por defecto
        $query = "INSERT INTO " . $this->table_name . " (nombre_usuario, email, password, rol) VALUES (:nombre, :email, :password, 0)";
        $stmt = $this->conn->prepare($query);
        
        $password_hash = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':password', $password_hash);
        
        try {
            return $stmt->execute();
        } catch(PDOException $e) {
            return false; // Falla si el email ya existe (UNIQUE)
        }
    }

    // Método para iniciar sesión
    // Método para iniciar sesión (buscando por nombre de usuario)
    public function login($nombre_usuario, $password) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE nombre_usuario = :nombre LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $nombre_usuario);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if(password_verify($password, $row['password'])) {
                return $row; 
            }
        }
        return false;
    }

    // Devuelve los usuarios Generales (rol 0), para que el admin elija
    // a quién asignarle una misión nueva.
    public function listarGenerales() {
        $query = "SELECT id_usuario, nombre_usuario FROM " . $this->table_name . " WHERE rol = 0 ORDER BY nombre_usuario ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>