<?php
session_start();
require_once '../models/AppDb.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

$usuario_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'add':
        $producto_id = $_POST['producto_id'] ?? 0;
        $cantidad = $_POST['cantidad'] ?? 1;
        
        $stmt = $conn->prepare("SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?");
        $stmt->bind_param("ii", $usuario_id, $producto_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $nueva_cantidad = $row['cantidad'] + $cantidad;
            
            $stmt = $conn->prepare("UPDATE carrito SET cantidad = ? WHERE id = ?");
            $stmt->bind_param("ii", $nueva_cantidad, $row['id']);
        } else {
            $stmt = $conn->prepare("INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $usuario_id, $producto_id, $cantidad);
        }
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Producto agregado al carrito']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al agregar al carrito']);
        }
        break;
        
    case 'list':
        $sql = "SELECT c.id, c.cantidad, p.nombre, p.precio, p.imagen, p.id as producto_id
                FROM carrito c 
                INNER JOIN productos p ON c.producto_id = p.id 
                WHERE c.usuario_id = ?";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $items = array();
        $total = 0;
        
        while($row = $result->fetch_assoc()) {
            $subtotal = $row['precio'] * $row['cantidad'];
            $row['subtotal'] = $subtotal;
            $total += $subtotal;
            $items[] = $row;
        }
        
        echo json_encode(['success' => true, 'items' => $items, 'total' => $total]);
        break;
        
    case 'remove':
        $id = $_POST['id'] ?? 0;
        
        $stmt = $conn->prepare("DELETE FROM carrito WHERE id = ? AND usuario_id = ?");
        $stmt->bind_param("ii", $id, $usuario_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Producto eliminado del carrito']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar del carrito']);
        }
        break;
        
    case 'clear':
        $stmt = $conn->prepare("DELETE FROM carrito WHERE usuario_id = ?");
        $stmt->bind_param("i", $usuario_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Carrito vaciado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al vaciar carrito']);
        }
        break;
        
    case 'update':
        $id = $_POST['id'] ?? 0;
        $cantidad = $_POST['cantidad'] ?? 1;
        
        // Validar cantidad
        $cantidad = intval($cantidad);
        if ($cantidad < 1) {
            echo json_encode(['success' => false, 'message' => 'La cantidad debe ser al menos 1']);
            exit;
        }
        
        // Verificar que el artículo del carrito pertenezca al usuario
        $stmt = $conn->prepare("SELECT id FROM carrito WHERE id = ? AND usuario_id = ?");
        $stmt->bind_param("ii", $id, $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Producto no encontrado en carrito']);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE carrito SET cantidad = ? WHERE id = ? AND usuario_id = ?");
        $stmt->bind_param("iii", $cantidad, $id, $usuario_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Cantidad actualizada']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar cantidad']);
        }
        break;

    case 'checkout':
        // Obtener items del carrito
        $sql = "SELECT c.producto_id, c.cantidad, p.precio, p.stock 
                FROM carrito c 
                INNER JOIN productos p ON c.producto_id = p.id 
                WHERE c.usuario_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'El carrito está vacío']);
            exit;
        }

        $items = [];
        $total = 0;
        while ($row = $result->fetch_assoc()) {
            if ($row['stock'] < $row['cantidad']) {
                echo json_encode(['success' => false, 'message' => 'Stock insuficiente para algunos productos']);
                exit;
            }
            $total += $row['precio'] * $row['cantidad'];
            $items[] = $row;
        }

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            // Crear pedido
            $stmt = $conn->prepare("INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, 'Pendiente')");
            $stmt->bind_param("id", $usuario_id, $total);
            $stmt->execute();
            $pedido_id = $conn->insert_id;

            // Insertar detalles y actualizar stock
            foreach ($items as $item) {
                $stmt = $conn->prepare("INSERT INTO detalles_pedido (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("iiid", $pedido_id, $item['producto_id'], $item['cantidad'], $item['precio']);
                $stmt->execute();

                $stmt = $conn->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");
                $stmt->bind_param("ii", $item['cantidad'], $item['producto_id']);
                $stmt->execute();
            }

            // Vaciar carrito
            $stmt = $conn->prepare("DELETE FROM carrito WHERE usuario_id = ?");
            $stmt->bind_param("i", $usuario_id);
            $stmt->execute();

            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Pedido realizado con éxito']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Error al procesar el pedido']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
