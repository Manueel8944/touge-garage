
<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/mongoUtils.php';


// Obtener todos los usuarios
function getUsers($db)
{
    $users = $db->users->find()->toArray();
    echo json_encode($users);
}


// Obtener un usuario por ID
function getUserById($db, $id)
{
    if (!isValidObjectId($id)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    $user = $db->users->findOne([
        '_id' => new MongoDB\BSON\ObjectId($id)
    ]);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['message' => 'Usuario no encontrado']);
        return;
    }

    echo json_encode($user);
}


// Registrar un usuario
function createUser($db, $data)
{
    if (
        empty($data['name']) ||
        empty($data['email']) ||
        empty($data['password'])
    ) {
        http_response_code(400);
        echo json_encode(['message' => 'Faltan campos obligatorios']);
        return;
    }

    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['message' => 'Email no válido']);
        return;
    }

    // Comprobar si el email ya existe
    $existingUser = $db->users->findOne([
        'email' => $data['email']
    ]);

    if ($existingUser) {
        http_response_code(409);
        echo json_encode(['message' => 'El email ya está registrado']);
        return;
    }

    // Crear usuario como comprador por defecto
    $user = [
        'name' => $data['name'],
        'email' => $data['email'],
        'password' => $data['password'],
        'admin' => false,
        'image' => $data['image'] ?? null
    ];

    $result = $db->users->insertOne($user);

    http_response_code(201);

    echo json_encode([
        'message' => 'Usuario registrado correctamente',
        'id' => (string) $result->getInsertedId()
    ]);
}


// Modificar un usuario
function updateUser($db, $id, $data)
{
    if (!isValidObjectId($id)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    // Campos que se pueden modificar
    $updates = [];

    if (isset($data['name'])) {
        $updates['name'] = $data['name'];
    }

    if (isset($data['email'])) {
        $updates['email'] = $data['email'];
    }

    if (isset($data['password'])) {
        $updates['password'] = $data['password'];
    }

    if (isset($data['image'])) {
        $updates['image'] = $data['image'];
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['message' => 'No hay datos para actualizar']);
        return;
    }

    if (isset($updates['email'])) {

        // Comprobar que el email tenga un formato válido
        if (!filter_var($updates['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'Email no válido']);
            return;
        }

        // Comprobar si el email ya esta registrado por otro usuario
        $existingUser = $db->users->findOne([
            'email' => $updates['email'],
            '_id' => ['$ne' => new MongoDB\BSON\ObjectId($id)]
        ]);

        if ($existingUser) {
            http_response_code(409);
            echo json_encode(['message' => 'El email ya está registrado']);
            return;
        }
    }

    $result = $db->users->updateOne(
        ['_id' => new MongoDB\BSON\ObjectId($id)],
        ['$set' => $updates]
    );

    if ($result->getMatchedCount() === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Usuario no encontrado']);
        return;
    }

    echo json_encode([
        'message' => 'Usuario actualizado correctamente'
    ]);
}


// Eliminar un usuario
function deleteUser($db, $id)
{
    if (!isValidObjectId($id)) {
        http_response_code(400);
        echo json_encode(['message' => 'ID no válido']);
        return;
    }

    $result = $db->users->deleteOne([
        '_id' => new MongoDB\BSON\ObjectId($id)
    ]);

    if ($result->getDeletedCount() === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Usuario no encontrado']);
        return;
    }

    echo json_encode([
        'message' => 'Usuario eliminado correctamente'
    ]);
}


// Iniciar sesión
function loginUser($db, $data)
{
    if (empty($data['email']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Email y contraseña obligatorios']);
        return;
    }

    $user = $db->users->findOne([
        'email' => $data['email'],
        'password' => $data['password']
    ]);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['message' => 'Credenciales incorrectas']);
        return;
    }

    unset($user['password']);

    echo json_encode([
        'message' => 'Inicio de sesión correcto',
        'user' => $user
    ]);
}
