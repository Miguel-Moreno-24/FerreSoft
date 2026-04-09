<?php
session_start();
require_once '../models/AppDb.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

$usuario_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        // Listar pedidos del usuario
        $sql = "SELECT p.id, p.numero_pedido, p.subtotal, p.total, p.estado, p.fecha_pedido 
                FROM pedidos p 
                WHERE p.usuario_id = ? 
                ORDER BY p.fecha_pedido DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $pedidos = [];
        while ($row = $result->fetch_assoc()) {
            // Para cada pedido, obtener sus productos
            $pedido_id = $row['id'];
            $sql_detalles = "SELECT
                                d.cantidad,
                                d.precio_unitario,
                                d.subtotal,
                                COALESCE(pr.nombre, d.producto_nombre) AS nombre,
                                COALESCE(pr.imagen, d.producto_imagen) AS imagen,
                                d.producto_id
                             FROM detalles_pedido d 
                             LEFT JOIN productos pr ON d.producto_id = pr.id 
                             WHERE d.pedido_id = ?";
            $stmt_det = $conn->prepare($sql_detalles);
            $stmt_det->bind_param("i", $pedido_id);
            $stmt_det->execute();
            $det_res = $stmt_det->get_result();
            
            $productos = [];
            while ($det_row = $det_res->fetch_assoc()) {
                $productos[] = $det_row;
            }
            $row['productos'] = $productos;
            $pedidos[] = $row;
        }
        
        echo json_encode(['success' => true, 'pedidos' => $pedidos]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
