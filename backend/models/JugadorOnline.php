<?php
// backend/models/JugadorOnline.php
require_once __DIR__ . '/../config/Database.php';

class JugadorOnline {
    private $conn;
    private $table_name = "jugadores_online";

    // Si un jugador no manda su heartbeat en este tiempo, se lo considera desconectado.
    const SEGUNDOS_ACTIVO = 8;

    public function __construct() {
        $this->conn = Database::getInstance()->getConnection();
    }

    // Crea o actualiza la posición del usuario (heartbeat). Un usuario = una sola fila.
    public function actualizar($idUsuario, $nombre, $x, $y, $direccion, $estado, array $avatar) {
        $query = "INSERT INTO " . $this->table_name . "
                    (id_usuario, nombre_usuario, pos_x, pos_y, direccion, estado, avatar_base, avatar_clothing, avatar_accessory, ultima_actualizacion)
                  VALUES
                    (:id_usuario, :nombre, :x, :y, :direccion, :estado, :base, :clothing, :accessory, NOW())
                  ON DUPLICATE KEY UPDATE
                    nombre_usuario = VALUES(nombre_usuario),
                    pos_x = VALUES(pos_x),
                    pos_y = VALUES(pos_y),
                    direccion = VALUES(direccion),
                    estado = VALUES(estado),
                    avatar_base = VALUES(avatar_base),
                    avatar_clothing = VALUES(avatar_clothing),
                    avatar_accessory = VALUES(avatar_accessory),
                    ultima_actualizacion = NOW()";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);
        $stmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $stmt->bindParam(':x', $x);
        $stmt->bindParam(':y', $y);
        $stmt->bindParam(':direccion', $direccion, PDO::PARAM_STR);
        $stmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $stmt->bindParam(':base', $avatar['base'], PDO::PARAM_STR);
        $stmt->bindParam(':clothing', $avatar['clothing'], PDO::PARAM_STR);
        $stmt->bindParam(':accessory', $avatar['accessory'], PDO::PARAM_STR);

        return $stmt->execute();
    }

    // Devuelve los demás jugadores activos (heartbeat reciente), sin incluir al propio usuario.
    public function listarActivos($idUsuarioPropio) {
        $query = "SELECT id_usuario, nombre_usuario, pos_x, pos_y, direccion, estado,
                         avatar_base, avatar_clothing, avatar_accessory
                  FROM " . $this->table_name . "
                  WHERE id_usuario != :id_propio
                    AND ultima_actualizacion >= (NOW() - INTERVAL " . self::SEGUNDOS_ACTIVO . " SECOND)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_propio', $idUsuarioPropio, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Elimina el registro del usuario (al cerrar sesión, para que desaparezca al toque).
    public function eliminar($idUsuario) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id_usuario = :id_usuario";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_usuario', $idUsuario, PDO::PARAM_INT);

        return $stmt->execute();
    }
}
