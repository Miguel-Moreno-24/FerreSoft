<?php
require_once __DIR__ . '/Db.php';

function appEnsureColumn(mysqli $conn, string $table, string $column, string $definition): void
{
    $tableEscaped = mysqli_real_escape_string($conn, $table);
    $columnEscaped = mysqli_real_escape_string($conn, $column);
    $result = mysqli_query($conn, "SHOW COLUMNS FROM `{$tableEscaped}` LIKE '{$columnEscaped}'");

    if ($result && mysqli_num_rows($result) === 0) {
        mysqli_query($conn, "ALTER TABLE `{$tableEscaped}` ADD COLUMN {$definition}");
    }
}

function appEnsureSchema(mysqli $conn): void
{
    appEnsureColumn($conn, 'usuarios', 'telefono', '`telefono` VARCHAR(30) NULL DEFAULT NULL AFTER `email`');
    appEnsureColumn($conn, 'usuarios', 'ciudad', '`ciudad` VARCHAR(120) NULL DEFAULT NULL AFTER `telefono`');
    appEnsureColumn($conn, 'usuarios', 'direccion', '`direccion` TEXT NULL AFTER `ciudad`');
    appEnsureColumn($conn, 'usuarios', 'tipo_documento', '`tipo_documento` VARCHAR(60) NULL DEFAULT NULL AFTER `direccion`');
    appEnsureColumn($conn, 'usuarios', 'numero_documento', '`numero_documento` VARCHAR(30) NULL DEFAULT NULL AFTER `tipo_documento`');
    appEnsureColumn($conn, 'usuarios', 'theme_preference', "`theme_preference` ENUM('light','dark') NOT NULL DEFAULT 'light' AFTER `numero_documento`");

    $pedidosTable = mysqli_query($conn, "SHOW TABLES LIKE 'pedidos'");
    if ($pedidosTable && mysqli_num_rows($pedidosTable) === 0) {
        mysqli_query($conn, "
            CREATE TABLE pedidos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                total DECIMAL(10,2) NOT NULL DEFAULT 0,
                estado VARCHAR(30) NOT NULL DEFAULT 'Pendiente',
                fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        ");
    }

    $detallesTable = mysqli_query($conn, "SHOW TABLES LIKE 'detalles_pedido'");
    if ($detallesTable && mysqli_num_rows($detallesTable) === 0) {
        mysqli_query($conn, "
            CREATE TABLE detalles_pedido (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pedido_id INT NOT NULL,
                producto_id INT NOT NULL,
                cantidad INT NOT NULL DEFAULT 1,
                precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
            )
        ");
    }
}

appEnsureSchema($conn);
