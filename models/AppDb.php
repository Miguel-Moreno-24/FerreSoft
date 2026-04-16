<?php
require_once __DIR__ . '/Db.php';

function appTableExists(mysqli $conn, string $table): bool
{
    $tableEscaped = mysqli_real_escape_string($conn, $table);
    $result = mysqli_query($conn, "SHOW TABLES LIKE '{$tableEscaped}'");
    return (bool) ($result && mysqli_num_rows($result) > 0);
}

function appColumnExists(mysqli $conn, string $table, string $column): bool
{
    $tableEscaped = mysqli_real_escape_string($conn, $table);
    $columnEscaped = mysqli_real_escape_string($conn, $column);
    $result = mysqli_query($conn, "SHOW COLUMNS FROM `{$tableEscaped}` LIKE '{$columnEscaped}'");
    return (bool) ($result && mysqli_num_rows($result) > 0);
}

function appIndexExists(mysqli $conn, string $table, string $index): bool
{
    $tableEscaped = mysqli_real_escape_string($conn, $table);
    $indexEscaped = mysqli_real_escape_string($conn, $index);
    $result = mysqli_query($conn, "SHOW INDEX FROM `{$tableEscaped}` WHERE Key_name = '{$indexEscaped}'");
    return (bool) ($result && mysqli_num_rows($result) > 0);
}

function appConstraintExists(mysqli $conn, string $table, string $constraint): bool
{
    $tableEscaped = mysqli_real_escape_string($conn, $table);
    $constraintEscaped = mysqli_real_escape_string($conn, $constraint);
    $result = mysqli_query($conn, "
        SELECT CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = '{$tableEscaped}'
          AND CONSTRAINT_NAME = '{$constraintEscaped}'
    ");
    return (bool) ($result && mysqli_num_rows($result) > 0);
}

function appEnsureColumn(mysqli $conn, string $table, string $column, string $definition): void
{
    if (!appColumnExists($conn, $table, $column)) {
        mysqli_query($conn, "ALTER TABLE `{$table}` ADD COLUMN {$definition}");
    }
}

function appEnsureEngine(mysqli $conn, string $table): void
{
    if (!appTableExists($conn, $table)) {
        return;
    }

    mysqli_query($conn, "ALTER TABLE `{$table}` ENGINE=InnoDB");
}

function appEnsureTableCollation(mysqli $conn, string $table): void
{
    if (!appTableExists($conn, $table)) {
        return;
    }

    mysqli_query($conn, "ALTER TABLE `{$table}` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}

function appEnsureUsuariosTable(mysqli $conn): void
{
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            telefono VARCHAR(30) DEFAULT NULL,
            ciudad VARCHAR(120) DEFAULT NULL,
            direccion TEXT DEFAULT NULL,
            tipo_documento VARCHAR(60) DEFAULT NULL,
            numero_documento VARCHAR(30) DEFAULT NULL,
            theme_preference ENUM('light', 'dark') NOT NULL DEFAULT 'light',
            language_preference ENUM('es', 'en') NOT NULL DEFAULT 'es',
            password VARCHAR(255) NOT NULL,
            rol ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
            fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    appEnsureEngine($conn, 'usuarios');
    appEnsureTableCollation($conn, 'usuarios');
    appEnsureColumn($conn, 'usuarios', 'telefono', '`telefono` VARCHAR(30) NULL DEFAULT NULL AFTER `email`');
    appEnsureColumn($conn, 'usuarios', 'ciudad', '`ciudad` VARCHAR(120) NULL DEFAULT NULL AFTER `telefono`');
    appEnsureColumn($conn, 'usuarios', 'direccion', '`direccion` TEXT NULL AFTER `ciudad`');
    appEnsureColumn($conn, 'usuarios', 'tipo_documento', '`tipo_documento` VARCHAR(60) NULL DEFAULT NULL AFTER `direccion`');
    appEnsureColumn($conn, 'usuarios', 'numero_documento', '`numero_documento` VARCHAR(30) NULL DEFAULT NULL AFTER `tipo_documento`');
    appEnsureColumn($conn, 'usuarios', 'theme_preference', "`theme_preference` ENUM('light','dark') NOT NULL DEFAULT 'light' AFTER `numero_documento`");
    appEnsureColumn($conn, 'usuarios', 'language_preference', "`language_preference` ENUM('es','en') NOT NULL DEFAULT 'es' AFTER `theme_preference`");
    appEnsureColumn($conn, 'usuarios', 'rol', "`rol` ENUM('admin','cliente') NOT NULL DEFAULT 'cliente' AFTER `password`");
    appEnsureColumn($conn, 'usuarios', 'fecha_registro', '`fecha_registro` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `rol`');
}

function appEnsureRolesSchema(mysqli $conn): void
{
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(50) NOT NULL UNIQUE,
            descripcion VARCHAR(150) DEFAULT NULL,
            creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS usuario_roles (
            usuario_id INT NOT NULL,
            rol_id INT NOT NULL,
            asignado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (usuario_id, rol_id),
            CONSTRAINT fk_usuario_roles_usuario
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            CONSTRAINT fk_usuario_roles_rol
                FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    mysqli_query($conn, "
        INSERT INTO roles (nombre, descripcion)
        VALUES
            ('admin', 'Administrador del sistema'),
            ('cliente', 'Usuario cliente de la tienda')
        ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)
    ");

    appEnsureEngine($conn, 'roles');
    appEnsureEngine($conn, 'usuario_roles');
    appEnsureTableCollation($conn, 'roles');
    appEnsureTableCollation($conn, 'usuario_roles');

    if (!appConstraintExists($conn, 'usuario_roles', 'fk_usuario_roles_usuario')) {
        mysqli_query($conn, 'ALTER TABLE usuario_roles ADD CONSTRAINT fk_usuario_roles_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE');
    }

    if (!appConstraintExists($conn, 'usuario_roles', 'fk_usuario_roles_rol')) {
        mysqli_query($conn, 'ALTER TABLE usuario_roles ADD CONSTRAINT fk_usuario_roles_rol FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE');
    }
}

function appEnsureProductosTable(mysqli $conn): void
{
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT DEFAULT NULL,
            precio DECIMAL(10,2) NOT NULL,
            stock INT NOT NULL DEFAULT 0,
            imagen VARCHAR(255) DEFAULT NULL,
            fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    appEnsureEngine($conn, 'productos');
    appEnsureTableCollation($conn, 'productos');
}

function appEnsureCarritoTable(mysqli $conn): void
{
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS carrito (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            producto_id INT NOT NULL,
            cantidad INT NOT NULL DEFAULT 1,
            fecha_agregado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_carrito_usuario
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            CONSTRAINT fk_carrito_producto
                FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    appEnsureEngine($conn, 'carrito');
    appEnsureTableCollation($conn, 'carrito');

    mysqli_query($conn, "
        DELETE c1 FROM carrito c1
        INNER JOIN carrito c2
            ON c1.usuario_id = c2.usuario_id
           AND c1.producto_id = c2.producto_id
           AND c1.id > c2.id
    ");

    mysqli_query($conn, "
        UPDATE carrito destino
        INNER JOIN (
            SELECT MIN(id) AS id, usuario_id, producto_id, SUM(cantidad) AS cantidad_total
            FROM carrito
            GROUP BY usuario_id, producto_id
        ) agrupado ON agrupado.id = destino.id
        SET destino.cantidad = agrupado.cantidad_total
    ");

    if (!appIndexExists($conn, 'carrito', 'uk_carrito_usuario_producto')) {
        mysqli_query($conn, 'ALTER TABLE carrito ADD UNIQUE KEY uk_carrito_usuario_producto (usuario_id, producto_id)');
    }

    if (!appConstraintExists($conn, 'carrito', 'fk_carrito_usuario')) {
        mysqli_query($conn, 'ALTER TABLE carrito ADD CONSTRAINT fk_carrito_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE');
    }

    if (!appConstraintExists($conn, 'carrito', 'fk_carrito_producto')) {
        mysqli_query($conn, 'ALTER TABLE carrito ADD CONSTRAINT fk_carrito_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE');
    }
}

function appEnsurePedidosTable(mysqli $conn): void
{
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS pedidos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            numero_pedido VARCHAR(30) DEFAULT NULL UNIQUE,
            usuario_id INT NOT NULL,
            nombre_cliente VARCHAR(120) DEFAULT NULL,
            correo_cliente VARCHAR(120) DEFAULT NULL,
            direccion_entrega VARCHAR(180) DEFAULT NULL,
            ciudad_entrega VARCHAR(120) DEFAULT NULL,
            metodo_pago VARCHAR(50) DEFAULT NULL,
            referencia_pago VARCHAR(80) DEFAULT NULL,
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
            total DECIMAL(10,2) NOT NULL DEFAULT 0,
            estado ENUM('Pendiente', 'Pagado', 'Enviado', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
            fecha_pedido TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_pedidos_usuario
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    appEnsureEngine($conn, 'pedidos');
    appEnsureTableCollation($conn, 'pedidos');
    appEnsureColumn($conn, 'pedidos', 'numero_pedido', '`numero_pedido` VARCHAR(30) NULL UNIQUE AFTER `id`');
    appEnsureColumn($conn, 'pedidos', 'nombre_cliente', '`nombre_cliente` VARCHAR(120) NULL DEFAULT NULL AFTER `usuario_id`');
    appEnsureColumn($conn, 'pedidos', 'correo_cliente', '`correo_cliente` VARCHAR(120) NULL DEFAULT NULL AFTER `nombre_cliente`');
    appEnsureColumn($conn, 'pedidos', 'direccion_entrega', '`direccion_entrega` VARCHAR(180) NULL DEFAULT NULL AFTER `correo_cliente`');
    appEnsureColumn($conn, 'pedidos', 'ciudad_entrega', '`ciudad_entrega` VARCHAR(120) NULL DEFAULT NULL AFTER `direccion_entrega`');
    appEnsureColumn($conn, 'pedidos', 'metodo_pago', '`metodo_pago` VARCHAR(50) NULL DEFAULT NULL AFTER `ciudad_entrega`');
    appEnsureColumn($conn, 'pedidos', 'referencia_pago', '`referencia_pago` VARCHAR(80) NULL DEFAULT NULL AFTER `metodo_pago`');
    appEnsureColumn($conn, 'pedidos', 'subtotal', '`subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `referencia_pago`');
    appEnsureColumn($conn, 'pedidos', 'fecha_actualizacion', '`fecha_actualizacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `fecha_pedido`');

    if (!appConstraintExists($conn, 'pedidos', 'fk_pedidos_usuario')) {
        mysqli_query($conn, 'ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE');
    }
}

function appEnsureDetallesPedidoTable(mysqli $conn): void
{
    mysqli_query($conn, "
        CREATE TABLE IF NOT EXISTS detalles_pedido (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pedido_id INT NOT NULL,
            producto_id INT DEFAULT NULL,
            producto_nombre VARCHAR(100) NOT NULL,
            producto_imagen VARCHAR(255) DEFAULT NULL,
            cantidad INT NOT NULL DEFAULT 1,
            precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
            CONSTRAINT fk_detalles_pedido_pedido
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
            CONSTRAINT fk_detalles_pedido_producto
                FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    appEnsureEngine($conn, 'detalles_pedido');
    appEnsureTableCollation($conn, 'detalles_pedido');
    if (appColumnExists($conn, 'detalles_pedido', 'producto_id')) {
        mysqli_query($conn, 'ALTER TABLE detalles_pedido MODIFY producto_id INT NULL');
    }
    appEnsureColumn($conn, 'detalles_pedido', 'producto_nombre', "`producto_nombre` VARCHAR(100) NOT NULL DEFAULT '' AFTER `producto_id`");
    appEnsureColumn($conn, 'detalles_pedido', 'producto_imagen', '`producto_imagen` VARCHAR(255) NULL DEFAULT NULL AFTER `producto_nombre`');
    appEnsureColumn($conn, 'detalles_pedido', 'subtotal', '`subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `precio_unitario`');

    if (!appConstraintExists($conn, 'detalles_pedido', 'fk_detalles_pedido_pedido')) {
        mysqli_query($conn, 'ALTER TABLE detalles_pedido ADD CONSTRAINT fk_detalles_pedido_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE');
    }

    if (!appConstraintExists($conn, 'detalles_pedido', 'fk_detalles_pedido_producto')) {
        mysqli_query($conn, 'ALTER TABLE detalles_pedido ADD CONSTRAINT fk_detalles_pedido_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL');
    }
}

function appEnsurePedidoNumbers(mysqli $conn): void
{
    if (!appColumnExists($conn, 'pedidos', 'numero_pedido')) {
        return;
    }

    $result = mysqli_query($conn, "SELECT id FROM pedidos WHERE numero_pedido IS NULL OR numero_pedido = ''");
    if (!$result) {
        return;
    }

    while ($row = mysqli_fetch_assoc($result)) {
        $pedidoId = (int) $row['id'];
        $numeroPedido = 'PED-' . str_pad((string) $pedidoId, 6, '0', STR_PAD_LEFT);
        $stmt = $conn->prepare('UPDATE pedidos SET numero_pedido = ? WHERE id = ?');
        if ($stmt) {
            $stmt->bind_param('si', $numeroPedido, $pedidoId);
            $stmt->execute();
        }
    }
}

function appBackfillPedidosTotals(mysqli $conn): void
{
    if (!appColumnExists($conn, 'pedidos', 'subtotal')) {
        return;
    }

    mysqli_query($conn, "
        UPDATE pedidos
        SET subtotal = total
        WHERE subtotal IS NULL OR subtotal = 0
    ");
}

function appBackfillPedidoSnapshots(mysqli $conn): void
{
    if (!appColumnExists($conn, 'pedidos', 'nombre_cliente')) {
        return;
    }

    mysqli_query($conn, "
        UPDATE pedidos p
        INNER JOIN usuarios u ON u.id = p.usuario_id
        SET
            p.nombre_cliente = COALESCE(NULLIF(p.nombre_cliente, ''), u.nombre),
            p.correo_cliente = COALESCE(NULLIF(p.correo_cliente, ''), u.email),
            p.direccion_entrega = COALESCE(NULLIF(p.direccion_entrega, ''), u.direccion),
            p.ciudad_entrega = COALESCE(NULLIF(p.ciudad_entrega, ''), u.ciudad),
            p.metodo_pago = COALESCE(NULLIF(p.metodo_pago, ''), 'Pago simulado')
    ");
}

function appBackfillDetallesPedidoSnapshots(mysqli $conn): void
{
    if (!appColumnExists($conn, 'detalles_pedido', 'producto_nombre')) {
        return;
    }

    mysqli_query($conn, "
        UPDATE detalles_pedido d
        LEFT JOIN productos p ON p.id = d.producto_id
        SET
            d.producto_nombre = COALESCE(NULLIF(d.producto_nombre, ''), p.nombre, 'Producto'),
            d.producto_imagen = COALESCE(NULLIF(d.producto_imagen, ''), p.imagen, d.producto_imagen),
            d.subtotal = CASE
                WHEN d.subtotal IS NULL OR d.subtotal = 0 THEN d.cantidad * d.precio_unitario
                ELSE d.subtotal
            END
    ");
}

function appSyncUserRoles(mysqli $conn): void
{
    mysqli_query($conn, "
        INSERT IGNORE INTO usuario_roles (usuario_id, rol_id)
        SELECT u.id, r.id
        FROM usuarios u
        INNER JOIN roles r ON r.nombre = (COALESCE(NULLIF(u.rol, ''), 'cliente') COLLATE utf8mb4_unicode_ci)
    ");

    mysqli_query($conn, "
        UPDATE usuarios u
        INNER JOIN (
            SELECT ur.usuario_id, MIN(r.nombre) AS nombre_rol
            FROM usuario_roles ur
            INNER JOIN roles r ON r.id = ur.rol_id
            GROUP BY ur.usuario_id
        ) roles_usuario ON roles_usuario.usuario_id = u.id
        SET u.rol = roles_usuario.nombre_rol
    ");
}

function appAssignUserRole(mysqli $conn, int $usuarioId, string $roleName): bool
{
    $stmt = $conn->prepare('SELECT id FROM roles WHERE nombre = ? LIMIT 1');
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param('s', $roleName);
    $stmt->execute();
    $role = $stmt->get_result()->fetch_assoc();
    if (!$role) {
        return false;
    }

    $stmt = $conn->prepare('DELETE FROM usuario_roles WHERE usuario_id = ?');
    if ($stmt) {
        $stmt->bind_param('i', $usuarioId);
        $stmt->execute();
    }

    $stmt = $conn->prepare('INSERT IGNORE INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)');
    if (!$stmt) {
        return false;
    }

    $roleId = (int) $role['id'];
    $stmt->bind_param('ii', $usuarioId, $roleId);
    $ok = $stmt->execute();

    $stmt = $conn->prepare('UPDATE usuarios SET rol = ? WHERE id = ?');
    if ($stmt) {
        $stmt->bind_param('si', $roleName, $usuarioId);
        $stmt->execute();
    }

    return $ok;
}

function appGetUserByEmail(mysqli $conn, string $email): ?array
{
    $stmt = $conn->prepare("
        SELECT
            u.id,
            u.nombre,
            u.email,
            u.password,
            u.theme_preference,
            u.language_preference,
            COALESCE(MIN(r.nombre), u.rol, 'cliente') AS rol
        FROM usuarios u
        LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
        LEFT JOIN roles r ON r.id = ur.rol_id
        WHERE u.email = ?
        GROUP BY u.id, u.nombre, u.email, u.password, u.theme_preference, u.language_preference, u.rol
        LIMIT 1
    ");

    if (!$stmt) {
        return null;
    }

    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? ($result->fetch_assoc() ?: null) : null;
}

function appGetUserById(mysqli $conn, int $userId): ?array
{
    $stmt = $conn->prepare("
        SELECT
            u.id,
            u.nombre,
            u.email,
            u.theme_preference,
            u.language_preference,
            COALESCE(MIN(r.nombre), u.rol, 'cliente') AS rol
        FROM usuarios u
        LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
        LEFT JOIN roles r ON r.id = ur.rol_id
        WHERE u.id = ?
        GROUP BY u.id, u.nombre, u.email, u.theme_preference, u.language_preference, u.rol
        LIMIT 1
    ");

    if (!$stmt) {
        return null;
    }

    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? ($result->fetch_assoc() ?: null) : null;
}

function appEnsureSchema(mysqli $conn): void
{
    appEnsureUsuariosTable($conn);
    appEnsureRolesSchema($conn);
    appEnsureProductosTable($conn);
    appEnsureCarritoTable($conn);
    appEnsurePedidosTable($conn);
    appEnsureDetallesPedidoTable($conn);
    appEnsurePedidoNumbers($conn);
    appBackfillPedidosTotals($conn);
    appBackfillPedidoSnapshots($conn);
    appBackfillDetallesPedidoSnapshots($conn);
    appSyncUserRoles($conn);
}

appEnsureSchema($conn);
