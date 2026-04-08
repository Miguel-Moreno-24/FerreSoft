<?php
session_start();
require_once '../models/AppDb.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

function buildUserPayload(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'nombre' => $user['nombre'],
        'email' => $user['email'],
        'rol' => $user['rol'],
        'theme_preference' => $user['theme_preference'] ?? 'light',
    ];
}

function emailExists(mysqli $conn, string $email): bool
{
    $stmt = $conn->prepare('SELECT id FROM usuarios WHERE email = ?');
    if (!$stmt) {
        return false;
    }

    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result && $result->num_rows > 0;
}

switch ($action) {
    case 'login':
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        $stmt = $conn->prepare('SELECT id, nombre, email, password, rol, theme_preference FROM usuarios WHERE email = ?');
        if (!$stmt) {
            echo json_encode(['success' => false, 'message' => 'Error al preparar el inicio de sesion']);
            break;
        }

        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            break;
        }

        $user = $result->fetch_assoc();

        if (password_verify($password, $user['password'])) {
            $valid = true;
        } elseif ($password === $user['password'] && !preg_match('/^\$2[ayb]\$/', $user['password'])) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $upd = $conn->prepare('UPDATE usuarios SET password = ? WHERE id = ?');
            if ($upd) {
                $upd->bind_param('si', $newHash, $user['id']);
                $upd->execute();
            }
            $valid = true;
            $user['password'] = $newHash;
        } else {
            $valid = false;
        }

        if (!$valid) {
            echo json_encode(['success' => false, 'message' => 'Contrasena incorrecta']);
            break;
        }

        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['user_nombre'] = $user['nombre'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_rol'] = $user['rol'];

        echo json_encode([
            'success' => true,
            'message' => 'Login exitoso',
            'user' => buildUserPayload($user),
        ]);
        break;

    case 'register':
        $nombre = trim($_POST['nombre'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if ($nombre === '' || $email === '' || $password === '') {
            echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
            break;
        }

        if (!preg_match('/^[\\p{L}\\s\'-]+$/u', $nombre)) {
            echo json_encode(['success' => false, 'message' => 'El nombre solo puede contener letras y espacios']);
            break;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Ingresa un correo valido']);
            break;
        }

        if (emailExists($conn, $email)) {
            echo json_encode(['success' => false, 'message' => 'El correo ya esta registrado']);
            break;
        }

        $hasUpper = preg_match('/[A-Z]/', $password);
        $hasNumber = preg_match('/\d/', $password);
        $hasSpecial = preg_match('/[^A-Za-z0-9]/', $password);
        $hasMinLength = strlen($password) >= 8;
        if (!($hasUpper && $hasNumber && $hasSpecial && $hasMinLength)) {
            echo json_encode([
                'success' => false,
                'message' => 'La contrasena debe tener al menos 8 caracteres e incluir una mayuscula, un numero y un caracter especial',
            ]);
            break;
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);

        $countResult = mysqli_query($conn, 'SELECT COUNT(*) AS c FROM usuarios');
        if ($countResult) {
            $countRow = mysqli_fetch_assoc($countResult);
            if (isset($countRow['c']) && intval($countRow['c']) === 0) {
                mysqli_query($conn, 'ALTER TABLE usuarios AUTO_INCREMENT = 1');
            }
        }

        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, rol, theme_preference) VALUES (?, ?, ?, 'cliente', 'light')");
        if (!$stmt) {
            echo json_encode([
                'success' => false,
                'message' => 'Error al preparar el registro: ' . mysqli_error($conn),
            ]);
            break;
        }

        $stmt->bind_param('sss', $nombre, $email, $hashed);

        if (!$stmt->execute()) {
            if ((int) $conn->errno === 1062) {
                echo json_encode(['success' => false, 'message' => 'El correo ya esta registrado']);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Error al registrar usuario: ' . $stmt->error,
                ]);
            }
            break;
        }

        $newUserId = $stmt->insert_id;
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
            ],
        ]);
        break;

    case 'email_exists':
        $email = trim($_GET['email'] ?? '');
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(['success' => false, 'message' => 'Ingresa un correo valido']);
            break;
        }

        echo json_encode([
            'success' => true,
            'exists' => emailExists($conn, $email),
        ]);
        break;

    case 'logout':
        $_SESSION = [];
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Sesion cerrada']);
        break;

    case 'check':
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['success' => true, 'logged_in' => false]);
            break;
        }

        $stmt = $conn->prepare('SELECT id, nombre, email, rol, theme_preference FROM usuarios WHERE id = ?');
        if (!$stmt) {
            echo json_encode(['success' => true, 'logged_in' => false]);
            break;
        }

        $stmt->bind_param('i', $_SESSION['user_id']);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

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
        echo json_encode(['success' => false, 'message' => 'Accion no valida']);
}
?>
