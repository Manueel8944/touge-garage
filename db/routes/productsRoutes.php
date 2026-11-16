<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/productsController.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';

// Obtener todos los productos
if ($method === 'GET' && !isset($_GET['id'])) {
    getProducts($db);
}

// Obtener un producto por ID
elseif ($method === 'GET' && isset($_GET['id'])) {
    getProductById($db, $_GET['id']);
}

// Crear un producto
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    createProduct($db, $data, $data['userId'] ?? '');
}

// Modificar un producto
elseif ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);

    updateProduct($db, $_GET['id'], $data, $data['userId'] ?? '');
}

// Eliminar un producto
elseif ($method === 'DELETE' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);

    deleteProduct($db, $_GET['id'], $data['userId'] ?? '');
}

// Ruta no encontrada
else {
    http_response_code(404);
    echo json_encode(['message' => 'Ruta no encontrada']);
}
