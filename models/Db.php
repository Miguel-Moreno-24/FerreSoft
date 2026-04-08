<?php
// Configuración de la base de datos para XAMPP
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'ferresoft';

// Crear conexión
$conn = mysqli_connect($host, $user, $pass, $db);

// Verificar conexión
if (!$conn) {
    die("Error de conexión: " . mysqli_connect_error());
}

// Establecer charset UTF-8
mysqli_set_charset($conn, "utf8");
?>
