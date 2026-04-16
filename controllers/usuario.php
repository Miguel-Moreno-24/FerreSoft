<?php
session_start();
require_once '../models/AppDb.php';

header('Content-Type: application/json; charset=utf-8');

$maxNameLength = 60;
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

$usuario_id = (int) $_SESSION['user_id'];
$action = $_GET['action'] ?? '';
$allowedDocumentTypes = [
    'Cédula de ciudadanía',
    'Tarjeta de identidad',
    'Cédula de extranjería',
    'Pasaporte',
];

function fetchCurrentUser(mysqli $conn, int $usuarioId): ?array
{
    $stmt = $conn->prepare('SELECT id, nombre, email, telefono, ciudad, direccion, tipo_documento, numero_documento, theme_preference, language_preference FROM usuarios WHERE id = ?');
    $stmt->bind_param('i', $usuarioId);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->fetch_assoc() ?: null;
}

switch ($action) {
    case 'get':
        $user = fetchCurrentUser($conn, $usuario_id);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            break;
        }

        echo json_encode([
            'success' => true,
            'user' => $user,
        ]);
        break;

    case 'update':
        $nombre = trim($_POST['nombre'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $telefono = trim($_POST['telefono'] ?? '');
        $ciudad = trim($_POST['ciudad'] ?? '');
        $direccion = trim($_POST['direccion'] ?? '');
        $tipo_documento = trim($_POST['tipo_documento'] ?? '');
        $numero_documento = trim($_POST['numero_documento'] ?? '');
        $password = $_POST['password'] ?? '';

        $telefono = preg_replace('/\s+/', ' ', $telefono);
        $ciudad = preg_replace('/\s+/', ' ', $ciudad);
        $direccion = preg_replace('/\s+/', ' ', $direccion);

        $errors = [];

        if ($nombre === '') {
            $errors[] = 'El nombre es obligatorio';
        } elseif (mb_strlen($nombre) > $maxNameLength) {
            $errors[] = 'El nombre no puede superar los 60 caracteres';
        } elseif (!preg_match('/^[\p{L}\s\'-]+$/u', $nombre)) {
            $errors[] = 'El nombre solo puede contener letras y espacios';
        }

        if ($email === '') {
            $errors[] = 'El correo es obligatorio';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'El correo no es válido';
        } else {
            $stmt = $conn->prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?');
            $stmt->bind_param('si', $email, $usuario_id);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                $errors[] = 'Este correo ya está registrado';
            }
        }

        if ($telefono !== '' && !preg_match('/^\+?[0-9\s-]{7,20}$/', $telefono)) {
            $errors[] = 'El teléfono debe contener entre 7 y 20 caracteres numéricos';
        }

        if ($ciudad !== '' && !preg_match('/^[\p{L}0-9\s.,#-]{2,120}$/u', $ciudad)) {
            $errors[] = 'La ciudad contiene caracteres no permitidos';
        }

        if ($direccion !== '' && mb_strlen($direccion) < 5) {
            $errors[] = 'La dirección debe tener al menos 5 caracteres';
        }

        if (($tipo_documento === '') xor ($numero_documento === '')) {
            $errors[] = 'Debes indicar tipo y número de documento juntos';
        }

        if ($tipo_documento !== '' && !in_array($tipo_documento, $allowedDocumentTypes, true)) {
            $errors[] = 'El tipo de documento seleccionado no es válido';
        }

        if ($numero_documento !== '' && !preg_match('/^[0-9A-Za-z-]{5,20}$/', $numero_documento)) {
            $errors[] = 'El número de documento debe tener entre 5 y 20 caracteres válidos';
        }

        if ($password !== '') {
            $hasUpper = preg_match('/[A-Z]/', $password);
            $hasNumber = preg_match('/\d/', $password);
            $hasSpecial = preg_match('/[^A-Za-z0-9]/', $password);
            $hasMinLength = strlen($password) >= 8;

            if (!($hasUpper && $hasNumber && $hasSpecial && $hasMinLength)) {
                $errors[] = 'La contraseña debe tener al menos 8 caracteres e incluir mayúscula, número y carácter especial';
            }
        }

        if (!empty($errors)) {
            echo json_encode(['success' => false, 'message' => implode(' | ', $errors)]);
            break;
        }

        if ($password !== '') {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare('UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, ciudad = ?, direccion = ?, tipo_documento = ?, numero_documento = ?, password = ? WHERE id = ?');
            $stmt->bind_param('ssssssssi', $nombre, $email, $telefono, $ciudad, $direccion, $tipo_documento, $numero_documento, $newHash, $usuario_id);
        } else {
            $stmt = $conn->prepare('UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, ciudad = ?, direccion = ?, tipo_documento = ?, numero_documento = ? WHERE id = ?');
            $stmt->bind_param('sssssssi', $nombre, $email, $telefono, $ciudad, $direccion, $tipo_documento, $numero_documento, $usuario_id);
        }

        if (!$stmt->execute()) {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar los datos']);
            break;
        }

        $_SESSION['user_nombre'] = $nombre;
        $_SESSION['user_email'] = $email;

        $currentUser = fetchCurrentUser($conn, $usuario_id);
        echo json_encode([
            'success' => true,
            'message' => 'Datos actualizados correctamente',
            'user' => $currentUser,
        ]);
        break;

    case 'theme':
        $theme = $_POST['theme'] ?? '';
        if (!in_array($theme, ['light', 'dark'], true)) {
            echo json_encode(['success' => false, 'message' => 'Tema no válido']);
            break;
        }

        $stmt = $conn->prepare('UPDATE usuarios SET theme_preference = ? WHERE id = ?');
        $stmt->bind_param('si', $theme, $usuario_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Tema actualizado', 'theme' => $theme]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No se pudo actualizar el tema']);
        }
        break;

    case 'language':
        $language = $_POST['language'] ?? '';
        if (!in_array($language, ['es', 'en'], true)) {
            echo json_encode(['success' => false, 'message' => 'Idioma no válido']);
            break;
        }

        $stmt = $conn->prepare('UPDATE usuarios SET language_preference = ? WHERE id = ?');
        $stmt->bind_param('si', $language, $usuario_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Idioma actualizado', 'language' => $language]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No se pudo actualizar el idioma']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
