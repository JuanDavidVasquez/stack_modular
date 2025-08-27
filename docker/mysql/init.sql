-- Configuración inicial de MySQL
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Usar la base de datos creada automáticamente
USE api_main_db;

-- Configuraciones de seguridad y performance
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- Crear usuario adicional si es necesario (opcional)
-- CREATE USER IF NOT EXISTS 'readonly'@'%' IDENTIFIED BY 'readonly_password';
-- GRANT SELECT ON api_main_db.* TO 'readonly'@'%';

-- Log de inicialización
SELECT 'Database initialized successfully for API Main' as message;
SELECT 'Charset: utf8mb4, Collation: utf8mb4_unicode_ci' as charset_info;
SELECT 'Timezone: UTC' as timezone_info;
