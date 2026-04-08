-- Crear base de datos
CREATE DATABASE IF NOT EXISTS ferresoft;
USE ferresoft;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'cliente') DEFAULT 'cliente',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    stock INT DEFAULT 0,
    imagen VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de carrito
CREATE TABLE IF NOT EXISTS carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- Insertar usuario admin
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
('Admin', 'admin@ferresoft.com', 'Admin_123', 'admin');
-- Password: Admin_123

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES 
('Martillo', 'Martillo de acero forjado', 25.99, 50, 'https://casaferretera.vtexassets.com/arquivos/ids/158537-1200-1200?v=637995684305100000&width=1200&height=1200&aspect=true'),
('Destornillador', 'Set de destornilladores 6 piezas', 15.50, 100, 'https://http2.mlstatic.com/D_NQ_NP_2X_698997-MLA99955540921_112025-F.webp'),
('Taladro', 'Taladro eléctrico 500W', 89.99, 25, 'https://media.falabella.com/sodimacCO/680578_01/w=1500,h=1500,fit=cover'),
('Llave Inglesa', 'Llave ajustable 10 pulgadas', 18.75, 75, 'https://belltec.com.co/6480-large_default/llave-ajustable-10-pulg-uso-general-visegrip-irwin-1864063.jpg');

