<?php


class Database {
    private $host = "localhost";
    private $db_name = "cozy_study";
    private $username = "root";
    private $password = ""; 
    private $conn;

    
    private static $instance = null;

    
    private function __construct() {}

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4", 
                $this->username, 
                $this->password
            );
            
            
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
           
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch(PDOException $exception) {
            
            die(json_encode([
                "status" => "error", 
                "message" => "Error crítico de conexión a la base de datos."
            ]));
        }

        return $this->conn;
    }
}
?>