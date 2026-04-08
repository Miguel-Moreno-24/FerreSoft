<?php
session_start();
header('Content-Type: application/json');
require_once '../models/Db.php';

$action = $_GET['action'] ?? 'list';

/**
 * Valida los datos de un producto.
 */
function validateProductData(&$errors, &$nombre, &$descripcion, &$precio, &$stock, &$imagen) {
    // Nombre: letras, espacios, longitud 1-60
    $nombre = trim($nombre);
    if ($nombre === '' || !preg_match('/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{1,60}$/u', $nombre)) {
        $errors[] = 'Nombre inválido. Solo letras y espacios (máx 60 caracteres).';
    }

    // Precio: número >= 0
    $precio = filter_var($precio, FILTER_VALIDATE_FLOAT);
    if ($precio === false || $precio < 0) {
        $errors[] = 'Precio inválido. Debe ser un número no negativo.';
    }

    // Stock: entero >= 0
    $stock = filter_var($stock, FILTER_VALIDATE_INT);
    if ($stock === false || $stock < 0) {
        $errors[] = 'Stock inválido. Debe ser un entero no negativo.';
    }

    // Descripción y ruta de imagen
    $descripcion = trim($descripcion);
    $imagen = trim($imagen);

    if ($imagen !== '' && strpos($imagen, 'uploads/') !== 0) {
        if (!filter_var($imagen, FILTER_VALIDATE_URL)) {
            $errors[] = 'La URL de la imagen no es válida.';
        }
    }
}

/**
 * Maneja la subida de archivos de imagen.
 */
function handleUploadedImage(&$imagen, &$errors) {
    if (isset($_FILES['imagen_file']) && isset($_FILES['imagen_file']['tmp_name']) && is_uploaded_file($_FILES['imagen_file']['tmp_name'])) {
        $file = $_FILES['imagen_file'];
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed, true)) {
            $errors[] = 'Tipo de imagen no permitido. Usa JPG, PNG, GIF o WEBP.';
            return;
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'Error al subir la imagen.';
            return;
        }

        $uploadDir = __DIR__ . '/../uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filename = uniqid('img_', true) . '.' . $ext;
        $destPath = $uploadDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            $errors[] = 'No se pudo guardar la imagen subida.';
            return;
        }

        $scriptDir = dirname($_SERVER['SCRIPT_NAME']);
        $appBase = str_replace('/controllers', '', $scriptDir);
        $appBase = rtrim($appBase, '/');
        $imagen = $appBase . '/uploads/' . $filename;
    }
}

switch ($action) {
    case 'list':
        $sql = "SELECT * FROM productos ORDER BY id ASC";
        $result = mysqli_query($conn, $sql);
        
        if (!$result) {
            $error = mysqli_error($conn);
            echo json_encode(['success' => false, 'message' => "Error en consulta: $error"]);
            break;
        }

        $productos = array();
        while ($row = mysqli_fetch_assoc($result)) {
            $productos[] = $row;
        }

        echo json_encode($productos);
        break;
        
    case 'get':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID requerido']);
            break;
        }
        $stmt = $conn->prepare("SELECT * FROM productos WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($row = $result->fetch_assoc()) {
            echo json_encode(['success' => true, 'product' => $row]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Producto no encontrado']);
        }
        break;
        
    case 'add':
        if (!isset($_SESSION['user_rol']) || $_SESSION['user_rol'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            break;
        }

        $nombre = $_POST['nombre'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $precio = $_POST['precio'] ?? 0;
        $stock = $_POST['stock'] ?? 0;
        $imagen = $_POST['imagen'] ?? '';

        $errors = [];
        validateProductData($errors, $nombre, $descripcion, $precio, $stock, $imagen);
        handleUploadedImage($imagen, $errors);

        if ($imagen === '') {
            $errors[] = 'Debes proporcionar una imagen (URL o archivo).';
        }

        if (!empty($errors)) {
            echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
            break;
        }

        $stmt = $conn->prepare("INSERT INTO productos (nombre, descripcion, precio, stock, imagen) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssdis", $nombre, $descripcion, $precio, $stock, $imagen);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Producto agregado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al agregar producto']);
        }
        break;
        
    case 'update':
        if (!isset($_SESSION['user_rol']) || $_SESSION['user_rol'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            break;
        }
        
        $id = $_POST['id'] ?? 0;
        $nombre = $_POST['nombre'] ?? '';
        $descripcion = $_POST['descripcion'] ?? '';
        $precio = $_POST['precio'] ?? 0;
        $stock = $_POST['stock'] ?? 0;
        $imagen = $_POST['imagen'] ?? '';

        if ($imagen === '' && !isset($_FILES['imagen_file'])) {
            $stmt = $conn->prepare("SELECT imagen FROM productos WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($row = $result->fetch_assoc()) {
                $imagen = $row['imagen'];
            }
        }

        $errors = [];
        validateProductData($errors, $nombre, $descripcion, $precio, $stock, $imagen);
        handleUploadedImage($imagen, $errors);

        if ($imagen === '') {
            $errors[] = 'Debes proporcionar una imagen (URL o archivo).';
        }

        if (!empty($errors)) {
            echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
            break;
        }

        $stmt = $conn->prepare("UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen = ? WHERE id = ?");
        $stmt->bind_param("ssdisi", $nombre, $descripcion, $precio, $stock, $imagen, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Producto actualizado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar producto']);
        }
        break;
        
    case 'delete':
        if (!isset($_SESSION['user_rol']) || $_SESSION['user_rol'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            break;
        }
        
        $id = $_POST['id'] ?? 0;
        $stmt = $conn->prepare("DELETE FROM productos WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Producto eliminado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar producto']);
        }
        break;
        
    case 'reset_ids':
        if (!isset($_SESSION['user_rol']) || $_SESSION['user_rol'] !== 'admin') {
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            break;
        }
        
        $resProd = mysqli_query($conn, "SELECT COUNT(*) as c FROM productos");
        $countProd = mysqli_fetch_assoc($resProd)['c'];
        
        $resUser = mysqli_query($conn, "SELECT COUNT(*) as c FROM usuarios");
        $countUser = mysqli_fetch_assoc($resUser)['c'];
        
        $msg = "";
        if ($countProd == 0) {
            mysqli_query($conn, "ALTER TABLE productos AUTO_INCREMENT = 1");
            $msg .= "Productos reset. ";
        }
        if ($countUser == 0) {
            mysqli_query($conn, "ALTER TABLE usuarios AUTO_INCREMENT = 1");
            $msg .= "Usuarios reset. ";
        }
        
        echo json_encode(['success' => true, 'message' => $msg ?: "Nada que reiniciar"]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
