<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/ordersController.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';

// Obtener el historial de pedidos de un usuario
if (
    $method === 'GET' &&
    ($_GET['history'] ?? '') === 'user' &&
    isset($_GET['userId'])
) {
    getOrdersByUser($db, $_GET['userId']);
}

// Obtener el historial de pedidos aceptados y cancelados (ADMIN)
elseif (
    $method === 'GET' &&
    ($_GET['history'] ?? '') === 'admin' &&
    isset($_GET['adminId'])
) {
    getHistoryOrdersAdmin($db, $_GET['adminId']);
}

// Obtener todos los pedidos pendientes (ADMIN)
elseif ($method === 'GET' && isset($_GET['adminId'])) {
    
    getPendingOrders($db, $_GET['adminId']);
}

// Obtener el carrito de un usuario
elseif ($method === 'GET' && isset($_GET['userId']) && !isset($_GET['id'])) {

    getCart($db, $_GET['userId']);

}

// Añadir un producto al carrito
elseif ($method === 'POST' && !isset($_GET['id'])) {

    $data = json_decode(file_get_contents('php://input'), true);

    addToCart($db, $data['userId'] ?? '', $data);

}

// Eliminar un producto del carrito
elseif ($method === 'DELETE' && isset($_GET['productId'])) {

    $data = json_decode(file_get_contents('php://input'), true);

    removeFromCart(
        $db,
        $data['userId'] ?? '',
        $_GET['productId']
    );

}

// Finalizar compra
elseif ($method === 'PUT' && isset($_GET['checkout'])) {

    $data = json_decode(file_get_contents('php://input'), true);

    checkoutCart(
        $db,
        $data['userId'] ?? ''
    );

}

// Actualizar el estado de un pedido (ADMIN)
elseif ($method === 'PUT' && isset($_GET['id'])) {

    $data = json_decode(file_get_contents('php://input'), true);

    updateOrderStatus(
        $db,
        $_GET['id'],
        $data['status'] ?? '',
        $data['adminId'] ?? ''
    );

}

// Ruta no encontrada
else {

    http_response_code(404);
    echo json_encode(['message' => 'Ruta no encontrada']);

}