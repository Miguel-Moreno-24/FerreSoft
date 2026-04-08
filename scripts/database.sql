-- Crear base de datos
CREATE DATABASE IF NOT EXISTS ferresoft;
USE ferresoft;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    imagen VARCHAR(255)
);

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, precio, stock, imagen) VALUES
('Martillo', 15.50, 20, '/placeholder.svg?height=200&width=200'),
('Destornillador', 8.00, 35, '/placeholder.svg?height=200&width=200'),
('Taladro', 89.99, 10, '/placeholder.svg?height=200&width=200'),
('Llave inglesa', 12.50, 25, '/placeholder.svg?height=200&width=200'),
('Cinta métrica', 6.75, 40, '/placeholder.svg?height=200&width=200'),
('Sierra', 22.00, 15, '/placeholder.svg?height=200&width=200');
