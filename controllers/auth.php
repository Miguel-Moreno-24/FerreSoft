<?php
session_start();
require_once '../models/AppDb.php';

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? '';
$maxNameLength = 60;

function buildUserPayload(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'nombre' => $user['nombre'],
        'email' => $user['email'],
        'rol' => $user['rol'],
        'theme_preference' => $user['theme_preference'] ?? 'light',
        'language_preference' => $user['language_preference'] ?? 'es',
    ];
}

function emailExists(mysqli $conn, string $email): bool
{
    return appGetUserByEmail($conn, $email) !== null;
}

switch ($action) {
    case 'email_exists':
        $email = trim($_GET['email'] ?? '');
        echo json_encode([
            'success' => true,
            'exists' => $email !== '' && emailExists($conn, $email),
        ]);
        break;

    case 'login':
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        $user = appGetUserByEmail($conn, $email);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            break;
        }

        if (password_verify($password, $user['password'])) {
            $valid = true;
        } elseif ($password === $user['password'] && !preg_match('/^\$2[ayb]\$/', $user['password'])) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $upd = $conn->prepare('UPDATE usuarios SET password = ? WHERE id = ?');
            $upd->bind_param('si', $newHash, $user['id']);
            $upd->execute();
            $valid = true;
            $user['password'] = $newHash;
        } else {
            $valid = false;
        }

        if (!$valid) {
            echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
            break;
        }

        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['user_nombre'] = $user['nombre'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_rol'] = $user['rol'];

        echo json_encode([
            'success' => true,
            'message' => 'Inicio de sesión exitoso',
            'user' => buildUserPayload($user),
        ]);
        break;

    case 'register':
        $nombre = trim($_POST['nombre'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if ($nombre === '' || $email === '' || $password === '') {
            echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
            break;
        }

        if (mb_strlen($nombre) > $maxNameLength) {
            echo json_encode(['success' => false, 'message' => 'El nombre no puede superar los 60 caracteres']);
            break;
        }

        if (!preg_match('/^[\p{L}\s\'-]+$/u', $nombre)) {
            echo json_encode(['success' => false, 'message' => 'El nombre solo puede contener letras y espacios']);
            break;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Ingresa un correo válido']);
            break;
        }

        if (emailExists($conn, $email)) {
            echo json_encode(['success' => false, 'message' => 'El correo ya está registrado']);
            break;
        }

        $hasUpper = preg_match('/[A-Z]/', $password);
        $hasNumber = preg_match('/\d/', $password);
        $hasSpecial = preg_match('/[^A-Za-z0-9]/', $password);
        $hasMinLength = strlen($password) >= 8;
        if (!($hasUpper && $hasNumber && $hasSpecial && $hasMinLength)) {
            echo json_encode([
                'success' => false,
                'message' => 'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, un número y un carácter especial',
            ]);
            break;
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);

        $newUserId = appGetNextExistingId($conn, 'usuarios');
        $stmt = $conn->prepare("INSERT INTO usuarios (id, nombre, email, password, rol, theme_preference, language_preference) VALUES (?, ?, ?, ?, 'cliente', 'light', 'es')");
        $stmt->bind_param('isss', $newUserId, $nombre, $email, $hashed);

        if (!$stmt->execute()) {
            if (isset($conn->errno) && $conn->errno === 1062) {
                echo json_encode(['success' => false, 'message' => 'El correo ya está registrado']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al registrar el usuario']);
            }
            break;
        }

        appAssignUserRole($conn, $newUserId, 'cliente');
        $_SESSION['user_id'] = $newUserId;
        $_SESSION['user_nombre'] = $nombre;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_rol'] = 'cliente';

        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'user' => [
                'id' => $newUserId,
                'nombre' => $nombre,
                'email' => $email,
                'rol' => 'cliente',
                'theme_preference' => 'light',
                'language_preference' => 'es',
            ],
        ]);
        break;

    case 'logout':
        $_SESSION = [];
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
        break;

    case 'check':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => true, 'logged_in' => false]);
            break;
        }

        $user = appGetUserById($conn, (int) $_SESSION['user_id']);
        if (!$user) {
            $_SESSION = [];
            session_destroy();
            echo json_encode(['success' => true, 'logged_in' => false]);
            break;
        }

        $_SESSION['user_nombre'] = $user['nombre'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_rol'] = $user['rol'];

        echo json_encode([
            'success' => true,
            'logged_in' => true,
            'user' => buildUserPayload($user),
        ]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
