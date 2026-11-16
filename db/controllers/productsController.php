
<?php

require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../utils/mongoUtils.php';


// Obtener todos los productos
function getProducts($db)
{
    $products = $db->products->find()->toArray();

    echo json_encode($products);
}


// Obtener un producto por ID
function getProductById($db, $id)
{
    if (!isValidObjectId($id)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    $product = $db->products->findOne([
        '_id' => new MongoDB\BSON\ObjectId($id)
    ]);

    if (!$product) {
        http_response_code(404);
        echo json_encode(['message' => 'Producto no encontrado']);
        return;
    }

    echo json_encode($product);
}

// Comprobar si un usuario es administrador
function isAdmin($db, $userId)
{
    if (!isValidObjectId($userId)) {
        return false;
    }

    $user = $db->users->findOne([
        '_id' => new MongoDB\BSON\ObjectId($userId),
        'admin' => true
    ]);

    return $user !== null;
}

// Crear un producto
function createProduct($db, $data, $userId)
{
    if (!isAdmin($db, $userId)) {
        http_response_code(403);
        echo json_encode(['message' => 'No tienes permisos']);
        return;
    }

    if (
        empty($data['name']) ||
        !isset($data['price']) ||
        !isset($data['stock'])
    ) {
        http_response_code(400);
        echo json_encode(['message' => 'Faltan campos obligatorios']);
        return;
    }

    if (!is_numeric($data['price']) || $data['price'] < 0) {
        http_response_code(400);
        echo json_encode(['message' => 'Precio no válido']);
        return;
    }

    if (filter_var($data['stock'], FILTER_VALIDATE_INT) === false || $data['stock'] < 0) {
        http_response_code(400);
        echo json_encode(['message' => 'Stock no válido']);
        return;
    }

    $product = [
        'name' => $data['name'],
        'description' => $data['description'] ?? '',
        'price' => (float) $data['price'],
        'image' => $data['image'] ?? '',
        'category' => $data['category'] ?? '',
        'stock' => (int) $data['stock']
    ];

    $result = $db->products->insertOne($product);

    http_response_code(201);

    echo json_encode([
        'message' => 'Producto creado correctamente',
        'id' => (string) $result->getInsertedId()
    ]);
}


// Modificar un producto
function updateProduct($db, $id, $data, $userId)
{
    if (!isAdmin($db, $userId)) {
        http_response_code(403);
        echo json_encode(['message' => 'No tienes permisos']);
        return;
    }

    if (!isValidObjectId($id)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    $updates = [];

    if (isset($data['name'])) {
        $updates['name'] = $data['name'];
    }

    if (isset($data['description'])) {
        $updates['description'] = $data['description'];
    }

    if (isset($data['price'])) {
        if (!is_numeric($data['price']) || $data['price'] < 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Precio no válido']);
            return;
        }

        $updates['price'] = (float) $data['price'];
    }

    if (isset($data['image'])) {
        $updates['image'] = $data['image'];
    }

    if (isset($data['category'])) {
        $updates['category'] = $data['category'];
    }

    if (isset($data['stock'])) {
        if (filter_var($data['stock'], FILTER_VALIDATE_INT) === false || $data['stock'] < 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Stock no válido']);
            return;
        }

        $updates['stock'] = (int) $data['stock'];
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['message' => 'No hay datos para actualizar']);
        return;
    }

    $result = $db->products->updateOne(
        ['_id' => new MongoDB\BSON\ObjectId($id)],
        ['$set' => $updates]
    );

    if ($result->getMatchedCount() === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Producto no encontrado']);
        return;
    }

    echo json_encode([
        'message' => 'Producto actualizado correctamente'
    ]);
}


// Eliminar un producto
function deleteProduct($db, $id, $userId)
{
    if (!isAdmin($db, $userId)) {
        http_response_code(403);
        echo json_encode(['message' => 'No tienes permisos']);
        return;
    }

    if (!isValidObjectId($id)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    $result = $db->products->deleteOne([
        '_id' => new MongoDB\BSON\ObjectId($id)
    ]);

    if ($result->getDeletedCount() === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Producto no encontrado']);
        return;
    }

    // Eliminamos de los carritos de todos los usuarios el producto
    $db->orders->updateMany(
        ['status' => 'cart'],
        ['$pull' => [
            'products' => ['product_id' => new MongoDB\BSON\ObjectId($id)]
        ]]
    );

    echo json_encode([
        'message' => 'Producto eliminado correctamente'
    ]);
}
