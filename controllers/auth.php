<?php
session_start();
require_once '../models/Db.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        
        $stmt = $conn->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            
            // principal verificación con hash
            if (password_verify($password, $user['password'])) {
                $valid = true;
            } else {
                // si la contraseña en la base de datos parece estar en texto plano
                // (no comienza con el prefijo estándar de bcrypt) y coincide con
                // la facilitada por el usuario, asumimos que alguien escribió
                // la contraseña sin hashear. La actualizamos y permitimos el login.
                if ($password === $user['password'] && !preg_match('/^\$2[ayb]\$/', $user['password'])) {
                    $newHash = password_hash($password, PASSWORD_DEFAULT);
                    $upd = $conn->prepare("UPDATE usuarios SET password = ? WHERE id = ?");
                    $upd->bind_param("si", $newHash, $user['id']);
                    $upd->execute();
                    $valid = true;
                } else {
                    $valid = false;
                }
            }

            if ($valid) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_nombre'] = $user['nombre'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_rol'] = $user['rol'];
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Login exitoso',
                    'user' => [
                        'id' => $user['id'],
                        'nombre' => $user['nombre'],
                        'email' => $user['email'],
                        'rol' => $user['rol']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        }
        break;
        
    case 'register':
        $nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        
        if (empty($nombre) || empty($email) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
            break;
        }
        if (!preg_match('/^[A-Za-zÁÉÍÓÚáéíóúÑñ\\s\'-]+$/u', $nombre)) {
            echo json_encode(['success' => false, 'message' => 'El nombre solo puede contener letras y espacios']);
            break;
        }
        
        $tieneMayuscula = preg_match('/[A-Z]/', $password);
        $tieneNumero = preg_match('/\\d/', $password);
        $tieneEspecial = preg_match('/[^A-Za-z0-9]/', $password);
        $tieneAlMenos8 = strlen($password) >= 8;
        if (!($tieneMayuscula && $tieneNumero && $tieneEspecial && $tieneAlMenos8)) {
            echo json_encode([
                'success' => false,
                'message' => 'La contraseña debe tener al menos 8 caracteres e incluir una mayúscula, un número y un carácter especial'
            ]);
            break;
        }
        
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result && $result->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'El correo ya está registrado']);
            break;
        }
        
        $hashed = password_hash($password, PASSWORD_DEFAULT);

        // Si no hay usuarios en la tabla, reiniciamos AUTO_INCREMENT para que el siguiente ID sea 1
        $countResult = mysqli_query($conn, "SELECT COUNT(*) AS c FROM usuarios");
        if ($countResult) {
            $countRow = mysqli_fetch_assoc($countResult);
            if (isset($countRow['c']) && intval($countRow['c']) === 0) {
                mysqli_query($conn, "ALTER TABLE usuarios AUTO_INCREMENT = 1");
            }
        }

        $stmt = $conn->prepare("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'cliente')");
        $stmt->bind_param("sss", $nombre, $email, $hashed);
        
        if ($stmt->execute()) {
            $newUserId = $stmt->insert_id;
            // Iniciar sesión automáticamente después del registro
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
                    'rol' => 'cliente'
                ]
            ]);
        } else {
            if (isset($conn->errno) && $conn->errno === 1062) {
                echo json_encode(['success' => false, 'message' => 'El correo ya está registrado']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al registrar usuario']);
            }
        }
        break;
        
    case 'logout':
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Sesión cerrada']);
        break;
        
    case 'check':
        if (isset($_SESSION['user_id'])) {
            echo json_encode([
                'success' => true,
                'logged_in' => true,
                'user' => [
                    'id' => $_SESSION['user_id'],
                    'nombre' => $_SESSION['user_nombre'],
                    'email' => $_SESSION['user_email'],
                    'rol' => $_SESSION['user_rol']
                ]
            ]);
        } else {
            echo json_encode(['success' => true, 'logged_in' => false]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
