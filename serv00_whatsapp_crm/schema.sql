-- ==============================================================================
-- REALTY ONE / CRM WHATSAPP — ESQUEMA DE BASE DE DATOS MYSQL (SERV00)
-- ==============================================================================

-- 1. Crear tabla de leads con índices para consultas rápidas
CREATE TABLE IF NOT EXISTS `leads` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(150) NOT NULL,
    `telefono` VARCHAR(30) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `servicio` VARCHAR(255) NOT NULL,
    `origen` VARCHAR(50) DEFAULT 'Facebook Ads',
    `estado` ENUM('NUEVO', 'CONTACTADO', 'EN_NEGOCIACION', 'CERRADO', 'DESCARTADO') DEFAULT 'NUEVO',
    `fecha_creacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `fecha_actualizacion` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_telefono` (`telefono`),
    INDEX `idx_fecha` (`fecha_creacion`),
    INDEX `idx_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
