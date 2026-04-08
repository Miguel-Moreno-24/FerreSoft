<?php
session_start();
require_once '../models/Db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

$usuario_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'get':
        // Obtener datos del usuario actual
        $stmt = $conn->prepare("SELECT id, nombre, email, telefono, ciudad, direccion, tipo_documento, numero_documento FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            echo json_encode([
                'success' => true,
                'user' => $row
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        break;
        
    case 'update':
        $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $telefono = isset($_POST['telefono']) ? trim($_POST['telefono']) : '';
        $ciudad = isset($_POST['ciudad']) ? trim($_POST['ciudad']) : '';
        $direccion = isset($_POST['direccion']) ? trim($_POST['direccion']) : '';
        $tipo_documento = isset($_POST['tipo_documento']) ? trim($_POST['tipo_documento']) : '';
        $numero_documento = isset($_POST['numero_documento']) ? trim($_POST['numero_documento']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        
        $errors = [];
        
        // Validar nombre
        if ($nombre === '') {
            $errors[] = 'El nombre es requerido';
        } elseif (!preg_match('/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s\'-]+$/u', $nombre)) {
            $errors[] = 'El nombre solo puede contener letras y espacios';
        }
        
        // Validar email
        if ($email === '') {
            $errors[] = 'El correo es requerido';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'El correo no es válido';
        } else {
            // Verificar que el email no esté registrado a otro usuario
            $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
            $stmt->bind_param("si", $email, $usuario_id);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                $errors[] = 'Este correo ya está registrado';
            }
        }
        
        // Si se proporciona contraseña nueva, validarla
        if ($password !== '') {
            $tieneMayuscula = preg_match('/[A-Z]/', $password);
            $tieneNumero = preg_match('/\d/', $password);
            $tieneEspecial = preg_match('/[^A-Za-z0-9]/', $password);
            $tieneAlMenos8 = strlen($password) >= 8;
            
            if (!($tieneMayuscula && $tieneNumero && $tieneEspecial && $tieneAlMenos8)) {
                $errors[] = 'La contraseña debe tener al menos 8 caracteres e incluir mayúscula, número y carácter especial';
            }
        }
        
        if (!empty($errors)) {
            echo json_encode(['success' => false, 'message' => implode(' | ', $errors)]);
            break;
        }
        
        // Actualizar usuario
        if ($password !== '') {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, ciudad = ?, direccion = ?, tipo_documento = ?, numero_documento = ?, password = ? WHERE id = ?");
            $stmt->bind_param("ssssssssi", $nombre, $email, $telefono, $ciudad, $direccion, $tipo_documento, $numero_documento, $newHash, $usuario_id);
        } else {
            $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, ciudad = ?, direccion = ?, tipo_documento = ?, numero_documento = ? WHERE id = ?");
            $stmt->bind_param("sssssssi", $nombre, $email, $telefono, $ciudad, $direccion, $tipo_documento, $numero_documento, $usuario_id);
        }
        
        if ($stmt->execute()) {
            // Actualizar sesión con nuevo nombre y email
            $_SESSION['user_nombre'] = $nombre;
            $_SESSION['user_email'] = $email;
            
            echo json_encode([
                'success' => true,
                'message' => 'Datos actualizados correctamente',
                'user' => [
                    'id' => $usuario_id,
                    'nombre' => $nombre,
                    'email' => $email,
                    'telefono' => $telefono,
                    'ciudad' => $ciudad,
                    'direccion' => $direccion,
                    'tipo_documento' => $tipo_documento,
                    'numero_documento' => $numero_documento
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar datos']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
