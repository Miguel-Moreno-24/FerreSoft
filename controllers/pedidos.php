<?php
session_start();
require_once '../models/AppDb.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

$usuario_id = (int) $_SESSION['user_id'];
$action = $_GET['action'] ?? 'list';

function consultarDetallesPedido(mysqli $conn, int $pedidoId): array
{
    $sql = "SELECT
                d.cantidad,
                d.precio_unitario,
                d.subtotal,
                COALESCE(pr.nombre, d.producto_nombre) AS nombre,
                COALESCE(pr.imagen, d.producto_imagen) AS imagen,
                d.producto_id
            FROM detalles_pedido d
            LEFT JOIN productos pr ON d.producto_id = pr.id
            WHERE d.pedido_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $pedidoId);
    $stmt->execute();
    $result = $stmt->get_result();

    $productos = [];
    while ($row = $result->fetch_assoc()) {
        $productos[] = $row;
    }

    return $productos;
}

switch ($action) {
    case 'list':
        $sql = "SELECT
                    p.id,
                    p.numero_pedido,
                    p.nombre_cliente,
                    p.correo_cliente,
                    p.direccion_entrega,
                    p.ciudad_entrega,
                    p.metodo_pago,
                    p.referencia_pago,
                    p.subtotal,
                    p.total,
                    p.estado,
                    p.fecha_pedido
                FROM pedidos p
                WHERE p.usuario_id = ?
                ORDER BY p.fecha_pedido DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $pedidos = [];
        while ($row = $result->fetch_assoc()) {
            $row['productos'] = consultarDetallesPedido($conn, (int) $row['id']);
            $pedidos[] = $row;
        }

        echo json_encode(['success' => true, 'pedidos' => $pedidos]);
        break;

    case 'get':
        $pedidoId = (int) ($_GET['id'] ?? 0);
        if ($pedidoId < 1) {
            echo json_encode(['success' => false, 'message' => 'Pedido no válido']);
            break;
        }

        $stmt = $conn->prepare("SELECT
                p.id,
                p.numero_pedido,
                p.nombre_cliente,
                p.correo_cliente,
                p.direccion_entrega,
                p.ciudad_entrega,
                p.metodo_pago,
                p.referencia_pago,
                p.subtotal,
                p.total,
                p.estado,
                p.fecha_pedido,
                u.id AS usuario_id,
                u.nombre AS usuario_actual,
                u.email AS correo_actual
            FROM pedidos p
            INNER JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.id = ? AND (p.usuario_id = ? OR ? = 'admin')
            LIMIT 1");
        $rol = (string) ($_SESSION['user_rol'] ?? 'cliente');
        $stmt->bind_param('iis', $pedidoId, $usuario_id, $rol);
        $stmt->execute();
        $result = $stmt->get_result();
        $pedido = $result ? ($result->fetch_assoc() ?: null) : null;

        if (!$pedido) {
            echo json_encode(['success' => false, 'message' => 'Pedido no encontrado']);
            break;
        }

        $pedido['productos'] = consultarDetallesPedido($conn, $pedidoId);
        echo json_encode(['success' => true, 'pedido' => $pedido]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
