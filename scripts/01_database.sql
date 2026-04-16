CREATE DATABASE IF NOT EXISTS ferresoft;
USE ferresoft;

SET NAMES utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(150) DEFAULT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    asignado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usuario_id, rol_id),
    CONSTRAINT fk_usuario_roles_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_roles_rol
        FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    imagen VARCHAR(255) DEFAULT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_carrito_usuario_producto UNIQUE (usuario_id, producto_id),
    CONSTRAINT fk_carrito_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_carrito_producto
        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(30) NOT NULL UNIQUE,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles (nombre, descripcion)
VALUES
    ('admin', 'Administrador del sistema'),
    ('cliente', 'Usuario cliente de la tienda')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

INSERT INTO usuarios (nombre, email, password, rol, theme_preference, language_preference)
VALUES ('Admin', 'admin@ferresoft.com', '$2y$10$Kdnm0HDgOSbkss2q.BE2E.mTtJeA0ywycS4mxLnirGnFE1l6bda62', 'admin', 'light', 'es')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT IGNORE INTO usuario_roles (usuario_id, rol_id)
SELECT u.id, r.id
FROM usuarios u
INNER JOIN roles r ON r.nombre = 'admin'
WHERE u.email = 'admin@ferresoft.com';

INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES
('Martillo', 'Martillo de acero forjado', 25.99, 50, 'https://casaferretera.vtexassets.com/arquivos/ids/158537-1200-1200?v=637995684305100000&width=1200&height=1200&aspect=true'),
('Destornillador', 'Set de destornilladores 6 piezas', 15.50, 100, 'https://http2.mlstatic.com/D_NQ_NP_2X_698997-MLA99955540921_112025-F.webp'),
('Taladro', 'Taladro eléctrico 500W', 89.99, 25, 'https://media.falabella.com/sodimacCO/680578_01/w=1500,h=1500,fit=cover'),
('Llave Inglesa', 'Llave ajustable de 10 pulgadas', 18.75, 75, 'https://belltec.com.co/6480-large_default/llave-ajustable-10-pulg-uso-general-visegrip-irwin-1864063.jpg');
