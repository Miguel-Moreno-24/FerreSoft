<?php
session_start();
require_once '../models/AppDb.php';

header('Content-Type: application/json; charset=utf-8');

// Solo administradores
if (!isset($_SESSION['user_rol']) || $_SESSION['user_rol'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
    exit;
}

$action = $_GET['action'] ?? 'stats';

switch ($action) {
    case 'stats':
        // Total productos
        $res = mysqli_query($conn, "SELECT COUNT(*) as total FROM productos");
        $total_productos = mysqli_fetch_assoc($res)['total'];

        // Total usuarios
        $res = mysqli_query($conn, "SELECT COUNT(*) as total FROM usuarios");
        $total_usuarios = mysqli_fetch_assoc($res)['total'];

        // Total pedidos
        $res = mysqli_query($conn, "SELECT COUNT(*) as total FROM pedidos");
        $total_pedidos = mysqli_fetch_assoc($res)['total'];

        echo json_encode([
            'success' => true,
            'stats' => [
                'productos' => $total_productos,
                'usuarios' => $total_usuarios,
                'pedidos' => $total_pedidos
            ]
        ]);
        break;

    case 'list_pedidos':
        $sql = "SELECT p.id, p.numero_pedido, p.subtotal, p.total, p.estado, p.fecha_pedido, u.nombre as usuario_nombre, u.email as usuario_email
                FROM pedidos p
                INNER JOIN usuarios u ON p.usuario_id = u.id
                ORDER BY p.fecha_pedido DESC";
        $res = mysqli_query($conn, $sql);
        $pedidos = [];
        while ($row = mysqli_fetch_assoc($res)) {
            $pedido_id = $row['id'];
            $sql_det = "SELECT d.cantidad, COALESCE(pr.nombre, d.producto_nombre) AS nombre
                        FROM detalles_pedido d
                        LEFT JOIN productos pr ON d.producto_id = pr.id
                        WHERE d.pedido_id = ?";
            $stmt = $conn->prepare($sql_det);
            $stmt->bind_param("i", $pedido_id);
            $stmt->execute();
            $det_res = $stmt->get_result();
            $detalles = [];
            while ($det_row = $det_res->fetch_assoc()) {
                $detalles[] = $det_row['cantidad'] . "x " . $det_row['nombre'];
            }
            $row['resumen_productos'] = implode(", ", $detalles);
            $pedidos[] = $row;
        }
        echo json_encode(['success' => true, 'pedidos' => $pedidos]);
        break;

    case 'update_pedido':
        $id = $_POST['id'] ?? 0;
        $estado = $_POST['estado'] ?? '';
        $stmt = $conn->prepare("UPDATE pedidos SET estado = ? WHERE id = ?");
        $stmt->bind_param("si", $estado, $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Estado actualizado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar']);
        }
        break;

    case 'list_usuarios':
        $res = mysqli_query($conn, "
            SELECT
                u.id,
                u.nombre,
                u.email,
                COALESCE(MIN(r.nombre), u.rol, 'cliente') AS rol,
                u.fecha_registro
            FROM usuarios u
            LEFT JOIN usuario_roles ur ON ur.usuario_id = u.id
            LEFT JOIN roles r ON r.id = ur.rol_id
            GROUP BY u.id, u.nombre, u.email, u.rol, u.fecha_registro
            ORDER BY u.id DESC
        ");
        $usuarios = [];
        while ($row = mysqli_fetch_assoc($res)) {
            $usuarios[] = $row;
        }
        echo json_encode(['success' => true, 'usuarios' => $usuarios]);
        break;

    case 'delete_usuario':
        $id = $_POST['id'] ?? 0;
        // No permitir borrar el admin logueado
        if ($id == $_SESSION['user_id']) {
            echo json_encode(['success' => false, 'message' => 'No puedes eliminarte a ti mismo']);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Usuario eliminado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar usuario']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
