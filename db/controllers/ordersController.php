
<?php

require_once __DIR__ . '/../models/Order.php';
require_once __DIR__ . '/../utils/mongoUtils.php';
require_once __DIR__ . '/productsController.php';


// Obtener todos los pedidos pendientes (ADMIN)
function getPendingOrders($db, $adminId)
{
    if (!isAdmin($db, $adminId)) {
        http_response_code(403);
        echo json_encode(['message' => 'No tienes permisos']);
        return;
    }

    $pendingOrders = $db->orders->find(
        ['status' => 'pending'],
        ['sort' => ['_id' => -1]]
    );

    $orders = [];

    foreach ($pendingOrders as $order) {

        // Obtener información del cliente
        $user = $db->users->findOne([
            '_id' => $order['user_id']
        ]);

        // Preparar los datos del cliente
        $userData = [
            'id' => isset($order['user_id'])
                ? (string) $order['user_id']
                : '',
            'name' => $user['name'] ?? 'Usuario desconocido',
            'email' => $user['email'] ?? ''
        ];

        $products = [];
        $calculatedTotal = 0;

        // Obtener los productos del pedido
        foreach ($order['products'] ?? [] as $item) {

            $product = $db->products->findOne([
                '_id' => $item['product_id']
            ]);

            if (!$product) {
                $products[] = [
                    'product_id' => (string) $item['product_id'],
                    'name' => 'Producto eliminado',
                    'image' => '',
                    'price' => 0,
                    'quantity' => (int) $item['quantity']
                ];

                continue;
            }

            $price = (float) $product['price'];
            $quantity = (int) $item['quantity'];

            $products[] = [
                'product_id' => (string) $product['_id'],
                'name' => $product['name'],
                'image' => $product['image'] ?? '',
                'price' => $price,
                'quantity' => $quantity
            ];

            $calculatedTotal += $price * $quantity;
        }

        $orders[] = [
            'id' => (string) $order['_id'],
            'user' => $userData,
            'products' => $products,
            'total' => isset($order['total'])
                ? (float) $order['total']
                : $calculatedTotal,
            'status' => $order['status']
        ];
    }

    echo json_encode([
        'orders' => $orders,
        'total' => count($orders)
    ]);
}

// Obtener el historial de pedidos de un usuario
function getOrdersByUser($db, $userId)
{
    if (!isValidObjectId($userId)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID de usuario no válido']);
        return;
    }

    $userObjectId = new MongoDB\BSON\ObjectId($userId);
    $user = $db->users->findOne(['_id' => $userObjectId]);
    $cursor = $db->orders->find(
        [
            'user_id' => $userObjectId,
            'status' => ['$in' => ['pending', 'accepted', 'cancelled']]
        ],
        ['sort' => ['created_at' => -1, '_id' => -1]]
    );

    $orders = [];

    foreach ($cursor as $order) {
        $orders[] = [
            'name' => $user['name'] ?? 'Usuario desconocido',
            'email' => $user['email'] ?? '',
            'total' => isset($order['total']) ? (float) $order['total'] : 0,
            'status' => $order['status'] ?? 'pending'
        ];
    }

    echo json_encode([
        'orders' => $orders,
        'total' => count($orders)
    ]);
}

// Obtener el historial de pedidos aceptados y cancelados (ADMIN)
function getHistoryOrdersAdmin($db, $adminId)
{
    if (!isAdmin($db, $adminId)) {
        http_response_code(403);
        echo json_encode(['message' => 'No tienes permisos']);
        return;
    }

    $cursor = $db->orders->find(
        ['status' => ['$in' => ['accepted', 'cancelled']]],
        ['sort' => ['created_at' => -1, '_id' => -1]]
    );

    $orders = [];

    foreach ($cursor as $order) {
        $user = $db->users->findOne([
            '_id' => $order['user_id']
        ]);

        $orders[] = [
            'name' => $user['name'] ?? 'Usuario desconocido',
            'email' => $user['email'] ?? '',
            'total' => isset($order['total']) ? (float) $order['total'] : 0,
            'status' => $order['status']
        ];
    }

    echo json_encode([
        'orders' => $orders,
        'total' => count($orders)
    ]);
}

// Obtener el carrito de un usuario
function getCart($db, $userId)
{
    if (!isValidObjectId($userId)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID de usuario no válido']);
        return;
    }

    $cart = $db->orders->findOne([
        'user_id' => new MongoDB\BSON\ObjectId($userId),
        'status' => 'cart'
    ]);

    if (!$cart) {
        echo json_encode([
            'products' => [],
            'total' => 0
        ]);
        return;
    }

    $products = [];
    $total = 0;

    foreach ($cart['products'] as $item) {

        $product = $db->products->findOne([
            '_id' => $item['product_id']
        ]);

        if ($product) {
            $productData = [
                'product_id' => (string) $product['_id'],
                'name' => $product['name'],
                'description' => $product['description'],
                'price' => $product['price'],
                'image' => $product['image'],
                'quantity' => $item['quantity']
            ];

            $products[] = $productData;

            $total += $product['price'] * $item['quantity'];
        }
    }

    echo json_encode([
        'products' => $products,
        'total' => $total
    ]);
}


// Añadir un producto al carrito
function addToCart($db, $userId, $data)
{
    if (
        !isValidObjectId($userId) ||
        !isValidObjectId($data['product_id'] ?? '')
    ) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    $quantity = $data['quantity'] ?? 1;

    if (filter_var($quantity, FILTER_VALIDATE_INT) === false || $quantity < 1) {
        http_response_code(400);
        echo json_encode(['message' => 'Cantidad no válida']);
        return;
    }

    $productId = new MongoDB\BSON\ObjectId($data['product_id']);

    // Comprobar si existe el producto
    $product = $db->products->findOne([
        '_id' => $productId
    ]);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['message' => 'Producto no encontrado']);
        return;
    }

    // Descontar stock si hay unidades suficientes
    $result = $db->products->updateOne(
        [
            '_id' => $productId,
            'stock' => ['$gte' => (int) $quantity]
        ],
        [
            '$inc' => ['stock' => -(int) $quantity]
        ]
    );

    if ($result->getModifiedCount() === 0) {
        http_response_code(400);
        echo json_encode(['message' => 'No hay stock suficiente']);
        return;
    }

    // Buscar el carrito del usuario
    $cart = $db->orders->findOne([
        'user_id' => new MongoDB\BSON\ObjectId($userId),
        'status' => 'cart'
    ]);

    if ($cart) {

        // Comprobar si el producto ya está en el carrito
        $existingProduct = false;

        foreach ($cart['products'] as $item) {
            if ($item['product_id'] == $productId) {
                $existingProduct = true;
                break;
            }
        }

        if ($existingProduct) {

            // Aumentar la cantidad del producto
            $db->orders->updateOne(
                [
                    '_id' => $cart['_id'],
                    'products.product_id' => $productId
                ],
                [
                    '$inc' => ['products.$.quantity' => (int) $quantity]
                ]
            );

        } else {

            // Añadir un producto nuevo al carrito
            $db->orders->updateOne(
                ['_id' => $cart['_id']],
                [
                    '$push' => [
                        'products' => [
                            'product_id' => $productId,
                            'quantity' => (int) $quantity
                        ]
                    ]
                ]
            );
        }

    } else {

        // Crear un carrito nuevo
        $db->orders->insertOne([
            'user_id' => new MongoDB\BSON\ObjectId($userId),
            'products' => [
                [
                    'product_id' => $productId,
                    'quantity' => (int) $quantity
                ]
            ],
            'total' => 0,
            'status' => 'cart'
        ]);
    }

    echo json_encode([
        'message' => 'Producto añadido al carrito'
    ]);
}


// Eliminar un producto del carrito
function removeFromCart($db, $userId, $productId)
{
    if (
        !isValidObjectId($userId) ||
        !isValidObjectId($productId)
    ) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    $cart = $db->orders->findOne([
        'user_id' => new MongoDB\BSON\ObjectId($userId),
        'status' => 'cart'
    ]);

    if (!$cart) {
        http_response_code(404);
        echo json_encode(['message' => 'Carrito no encontrado']);
        return;
    }

    $productId = new MongoDB\BSON\ObjectId($productId);
    $quantity = 0;

    // Buscar la cantidad del producto en el carrito
    foreach ($cart['products'] as $item) {
        if ($item['product_id'] == $productId) {
            $quantity = $item['quantity'];
            break;
        }
    }

    if ($quantity === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Producto no encontrado en el carrito']);
        return;
    }

    // Devolver el stock
    $db->products->updateOne(
        ['_id' => $productId],
        ['$inc' => ['stock' => $quantity]]
    );

    // Eliminar el producto del carrito
    $db->orders->updateOne(
        ['_id' => $cart['_id']],
        [
            '$pull' => [
                'products' => ['product_id' => $productId]
            ]
        ]
    );

    echo json_encode([
        'message' => 'Producto eliminado del carrito'
    ]);
}

// Finalizar compra: convertir el carrito en un pedido pendiente
function checkoutCart($db, $userId)
{
    if (!isValidObjectId($userId)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID de usuario no válido']);
        return;
    }

    $userObjectId = new MongoDB\BSON\ObjectId($userId);

    // Buscar el carrito del usuario
    $cart = $db->orders->findOne([
        'user_id' => $userObjectId,
        'status' => 'cart'
    ]);

    if (!$cart || empty($cart['products'])) {
        http_response_code(400);
        echo json_encode(['message' => 'El carrito está vacío']);
        return;
    }

    // Calcular el total con los precios actuales de MongoDB
    $total = 0;

    foreach ($cart['products'] as $item) {
        $product = $db->products->findOne([
            '_id' => $item['product_id']
        ]);

        if (!$product) {
            http_response_code(400);
            echo json_encode([
                'message' => 'Uno de los productos ya no está disponible'
            ]);
            return;
        }

        $total += (float) $product['price'] * (int) $item['quantity'];
    }

    // Cambiar el carrito a pedido pendiente
    $result = $db->orders->updateOne(
        [
            '_id' => $cart['_id'],
            'user_id' => $userObjectId,
            'status' => 'cart'
        ],
        [
            '$set' => [
                'status' => 'pending',
                'total' => $total,
                'created_at' => new MongoDB\BSON\UTCDateTime()
            ]
        ]
    );

    if ($result->getModifiedCount() === 0) {
        http_response_code(409);
        echo json_encode([
            'message' => 'No se pudo finalizar el pedido'
        ]);
        return;
    }

    echo json_encode([
        'message' => 'Pedido enviado correctamente',
        'status' => 'pending',
        'total' => $total
    ]);
}

// Actualizar estado de un pedido (ADMIN)
function updateOrderStatus($db, $orderId, $newStatus, $adminId)
{
    if (!isAdmin($db, $adminId)) {
        http_response_code(403);
        echo json_encode(['message' => 'No tienes permisos']);
        return;
    }

    if (!isValidObjectId($orderId)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    // Solo permitimos estos cambios
    if (!in_array($newStatus, ['accepted', 'cancelled'], true)) {
        http_response_code(400);
        echo json_encode(['message' => 'Estado no válido']);
        return;
    }

    $orderObjectId = new MongoDB\BSON\ObjectId($orderId);

    // Buscar pedido pendiente
    $order = $db->orders->findOne([
        '_id' => $orderObjectId,
        'status' => 'pending'
    ]);

    if (!$order) {
        http_response_code(404);
        echo json_encode(['message' => 'Pedido no encontrado o ya gestionado']);
        return;
    }

    // Cambiar estado
    $result = $db->orders->updateOne(
        [
            '_id' => $orderObjectId,
            'status' => 'pending'
        ],
        [
            '$set' => [
                'status' => $newStatus
            ]
        ]
    );

    if ($result->getModifiedCount() === 0) {
        http_response_code(409);
        echo json_encode(['message' => 'No se pudo actualizar el pedido']);
        return;
    }

    // Si se cancela, devolver el stock
    if ($newStatus === 'cancelled') {

        foreach ($order['products'] as $item) {

            $db->products->updateOne(
                ['_id' => $item['product_id']],
                [
                    '$inc' => [
                        'stock' => (int) $item['quantity']
                    ]
                ]
            );
        }
    }

    echo json_encode([
        'message' => 'Pedido actualizado correctamente',
        'status' => $newStatus
    ]);
}
