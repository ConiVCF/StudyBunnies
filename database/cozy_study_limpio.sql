
CREATE DATABASE IF NOT EXISTS cozy_study DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE cozy_study;


CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: General, 1: Administrador',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS misiones (
    id_mision INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    texto_tarea VARCHAR(255) NOT NULL,
    estado_completado TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0: Pendiente, 1: Completada',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_mision FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS contactos (
    id_contacto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_remitente VARCHAR(50) NOT NULL,
    email_remitente VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    fecha DATE NOT NULL,
    recordatorios VARCHAR(50) NOT NULL DEFAULT '' COMMENT 'Dias de aviso separados por coma, ej: 7,3,1,0',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_evento FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS jugadores_online (
    id_usuario INT PRIMARY KEY,
    nombre_usuario VARCHAR(30) NOT NULL,
    pos_x FLOAT NOT NULL DEFAULT 200,
    pos_y FLOAT NOT NULL DEFAULT 100,
    direccion VARCHAR(5) NOT NULL DEFAULT 'right',
    estado VARCHAR(10) NOT NULL DEFAULT 'idle',
    avatar_base VARCHAR(30) NOT NULL DEFAULT 'copo',
    avatar_clothing VARCHAR(30) NOT NULL DEFAULT 'none',
    avatar_accessory VARCHAR(30) NOT NULL DEFAULT 'none',
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_online FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS chat_historial (
    id_mensaje INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    rol ENUM('user','model') NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_chat FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;


-- =========================================
--   USUARIOS DE PRUEBA (credenciales conocidas para la defensa del proyecto)
-- =========================================
-- Admin      -> usuario: Profesor Admin | password: Admin123!
-- General 1  -> usuario: juan           | password: Estudiante123!
-- General 2  -> usuario: maria          | password: Estudiante123!
-- Las contraseñas están guardadas encriptadas con password_hash() (bcrypt).

INSERT INTO usuarios (nombre_usuario, email, password, rol)
VALUES ('Profesor Admin', 'admin@cozystudy.com', '$2b$12$55ALcpVKo/zfIGgyYTPd4ejDDZLJRVZGBoYh8x7/Mprl6vmg6yCae', 1);

INSERT INTO usuarios (nombre_usuario, email, password, rol)
VALUES ('juan', 'juan@cozystudy.com', '$2b$12$WNYi.cHsYsysnE7K/w8ZG.gSbPdfpgKFcbR40TXXC38Xl.CVSolFe', 0);

INSERT INTO usuarios (nombre_usuario, email, password, rol)
VALUES ('maria', 'maria@cozystudy.com', '$2b$12$23A6zuu91akz7K8LpV7R2Osp1Eu2GKH/v/RaKRRCxJy3dTn68616e', 0);