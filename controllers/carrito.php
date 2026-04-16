<?php
session_start();
require_once '../models/AppDb.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Debes iniciar sesión']);
    exit;
}

$usuario_id = (int) $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

function obtenerResumenCarrito(mysqli $conn, int $usuarioId): array
{
    $sql = "SELECT c.id, c.producto_id, c.cantidad, p.nombre, p.precio, p.stock, p.imagen
            FROM carrito c
            INNER JOIN productos p ON c.producto_id = p.id
            WHERE c.usuario_id = ?
            ORDER BY c.id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $usuarioId);
    $stmt->execute();
    $result = $stmt->get_result();

    $items = [];
    $total = 0.0;
    while ($row = $result->fetch_assoc()) {
        $subtotal = (float) $row['precio'] * (int) $row['cantidad'];
        $row['subtotal'] = $subtotal;
        $items[] = $row;
        $total += $subtotal;
    }

    return [
        'items' => $items,
        'total' => $total,
    ];
}

function obtenerDatosUsuario(mysqli $conn, int $usuarioId): ?array
{
    $stmt = $conn->prepare('SELECT id, nombre, email, telefono, ciudad, direccion FROM usuarios WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $usuarioId);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result ? ($result->fetch_assoc() ?: null) : null;
}

switch ($action) {
    case 'add':
        $producto_id = (int) ($_POST['producto_id'] ?? 0);
        $cantidad = (int) ($_POST['cantidad'] ?? 1);

        $stmt = $conn->prepare('INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE cantidad = cantidad + VALUES(cantidad)');
        $stmt->bind_param('iii', $usuario_id, $producto_id, $cantidad);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Producto agregado al carrito']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al agregar al carrito']);
        }
        break;

    case 'list':
        $summary = obtenerResumenCarrito($conn, $usuario_id);
        echo json_encode(['success' => true, 'items' => $summary['items'], 'total' => $summary['total']]);
        break;

    case 'summary':
        $summary = obtenerResumenCarrito($conn, $usuario_id);
        if (count($summary['items']) === 0) {
            echo json_encode(['success' => false, 'message' => 'El carrito está vacío']);
            break;
        }

        $user = obtenerDatosUsuario($conn, $usuario_id);
        echo json_encode([
            'success' => true,
            'items' => $summary['items'],
            'total' => $summary['total'],
            'user' => $user,
        ]);
        break;

    case 'remove':
        $id = (int) ($_POST['id'] ?? 0);

        $stmt = $conn->prepare('DELETE FROM carrito WHERE id = ? AND usuario_id = ?');
        $stmt->bind_param('ii', $id, $usuario_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Producto eliminado del carrito']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al eliminar del carrito']);
        }
        break;

    case 'clear':
        $stmt = $conn->prepare('DELETE FROM carrito WHERE usuario_id = ?');
        $stmt->bind_param('i', $usuario_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Carrito vaciado']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al vaciar el carrito']);
        }
        break;

    case 'update':
        $id = (int) ($_POST['id'] ?? 0);
        $cantidad = (int) ($_POST['cantidad'] ?? 1);

        if ($cantidad < 1) {
            echo json_encode(['success' => false, 'message' => 'La cantidad debe ser al menos 1']);
            exit;
        }

        $stmt = $conn->prepare('SELECT id FROM carrito WHERE id = ? AND usuario_id = ?');
        $stmt->bind_param('ii', $id, $usuario_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Producto no encontrado en el carrito']);
            exit;
        }

        $stmt = $conn->prepare('UPDATE carrito SET cantidad = ? WHERE id = ? AND usuario_id = ?');
        $stmt->bind_param('iii', $cantidad, $id, $usuario_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Cantidad actualizada']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al actualizar la cantidad']);
        }
        break;

    case 'checkout':
        $direccionEntrega = trim($_POST['direccion_entrega'] ?? '');
        $ciudadEntrega = trim($_POST['ciudad_entrega'] ?? '');
        $metodoPago = trim($_POST['metodo_pago'] ?? '');
        $referenciaPago = trim($_POST['referencia_pago'] ?? '');

        if (mb_strlen($direccionEntrega) < 5) {
            echo json_encode(['success' => false, 'message' => 'La dirección de entrega debe tener al menos 5 caracteres']);
            exit;
        }

        if (!preg_match('/^[\p{L}0-9\s.,#-]{2,120}$/u', $ciudadEntrega)) {
            echo json_encode(['success' => false, 'message' => 'La ciudad de entrega no es válida']);
            exit;
        }

        $metodosValidos = ['tarjeta', 'transferencia', 'contraentrega'];
        if (!in_array($metodoPago, $metodosValidos, true)) {
            echo json_encode(['success' => false, 'message' => 'Selecciona un método de pago válido']);
            exit;
        }

        if ($metodoPago !== 'contraentrega' && mb_strlen($referenciaPago) < 4) {
            echo json_encode(['success' => false, 'message' => 'Ingresa una referencia de pago válida']);
            exit;
        }

        $summary = obtenerResumenCarrito($conn, $usuario_id);
        if (count($summary['items']) === 0) {
            echo json_encode(['success' => false, 'message' => 'El carrito está vacío']);
            exit;
        }

        foreach ($summary['items'] as $item) {
            if ((int) $item['stock'] < (int) $item['cantidad']) {
                echo json_encode(['success' => false, 'message' => 'Stock insuficiente para algunos productos']);
                exit;
            }
        }

        $user = obtenerDatosUsuario($conn, $usuario_id);
        if (!$user) {
            echo json_encode(['success' => false, 'message' => 'No se pudieron obtener los datos del usuario']);
            exit;
        }

        $conn->begin_transaction();

        try {
            $numeroPedidoTemporal = 'PED-' . date('YmdHis') . '-' . $usuario_id;
            $estadoInicial = 'Pagado';
            $metodoPagoTexto = match ($metodoPago) {
                'tarjeta' => 'Tarjeta',
                'transferencia' => 'Transferencia',
                default => 'Contraentrega',
            };

            $stmt = $conn->prepare('INSERT INTO pedidos (numero_pedido, usuario_id, nombre_cliente, correo_cliente, direccion_entrega, ciudad_entrega, metodo_pago, referencia_pago, subtotal, total, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->bind_param(
                'sissssssdds',
                $numeroPedidoTemporal,
                $usuario_id,
                $user['nombre'],
                $user['email'],
                $direccionEntrega,
                $ciudadEntrega,
                $metodoPagoTexto,
                $referenciaPago,
                $summary['total'],
                $summary['total'],
                $estadoInicial
            );
            $stmt->execute();
            $pedido_id = $conn->insert_id;

            if ($pedido_id > 0) {
                $numeroPedidoFinal = 'PED-' . str_pad((string) $pedido_id, 6, '0', STR_PAD_LEFT);
                $stmt = $conn->prepare('UPDATE pedidos SET numero_pedido = ? WHERE id = ?');
                $stmt->bind_param('si', $numeroPedidoFinal, $pedido_id);
                $stmt->execute();
            } else {
                $numeroPedidoFinal = $numeroPedidoTemporal;
            }

            foreach ($summary['items'] as $item) {
                $detalle_sql = '
                    INSERT INTO detalles_pedido (
                        pedido_id,
                        producto_id,
                        producto_nombre,
                        producto_imagen,
                        cantidad,
                        precio_unitario,
                        subtotal
                    )
                    SELECT ?, p.id, p.nombre, p.imagen, ?, ?, ?
                    FROM productos p
                    WHERE p.id = ?
                ';
                $detalleSubtotal = (int) $item['cantidad'] * (float) $item['precio'];
                $stmt = $conn->prepare($detalle_sql);
                $stmt->bind_param('iiddi', $pedido_id, $item['cantidad'], $item['precio'], $detalleSubtotal, $item['producto_id']);
                $stmt->execute();

                $stmt = $conn->prepare('UPDATE productos SET stock = stock - ? WHERE id = ?');
                $stmt->bind_param('ii', $item['cantidad'], $item['producto_id']);
                $stmt->execute();
            }

            $stmt = $conn->prepare('DELETE FROM carrito WHERE usuario_id = ?');
            $stmt->bind_param('i', $usuario_id);
            $stmt->execute();

            $conn->commit();
            echo json_encode([
                'success' => true,
                'message' => 'Pago procesado correctamente',
                'pedido_id' => $pedido_id,
                'numero_pedido' => $numeroPedidoFinal,
            ]);
        } catch (Throwable $exception) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Error al procesar el pago']);
        }
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
}
?>
