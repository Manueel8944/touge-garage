<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/usersController.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';

// Obtener todos los usuarios
if ($method === 'GET' && !isset($_GET['id'])) {
    getUsers($db);
}

// Obtener un usuario por ID
elseif ($method === 'GET' && isset($_GET['id'])) {
    getUserById($db, $_GET['id']);
}

// Registrar un usuario
elseif ($method === 'POST' && ($_GET['action'] ?? '') === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    createUser($db, $data);
}

// Iniciar sesión
elseif ($method === 'POST' && ($_GET['action'] ?? '') === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    loginUser($db, $data);
}

// Modificar un usuario
elseif ($method === 'PUT' && isset($_GET['id'])) {
    $data = json_decode(file_get_contents('php://input'), true);
    updateUser($db, $_GET['id'], $data);
}

// Eliminar un usuario
elseif ($method === 'DELETE' && isset($_GET['id'])) {
    deleteUser($db, $_GET['id']);
}

// Ruta no encontrada
else {
    http_response_code(404);
    echo json_encode(['message' => 'Ruta no encontrada']);
}
