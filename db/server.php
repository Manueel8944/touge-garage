<?php
$publicRoot = realpath(__DIR__ . '/../public');
$requestedPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestedFile = realpath(
$publicRoot . DIRECTORY_SEPARATOR . ltrim($requestedPath, '/\\')
);

if (
    $requestedFile !== false &&
    is_file($requestedFile) &&
    strpos($requestedFile, $publicRoot . DIRECTORY_SEPARATOR) === 0
) {
    return false;
}

header('Content-Type: application/json; charset=utf-8');

// Conectar con la base de datos
require_once __DIR__ . '/config/database.php';

// Obtener la ruta solicitada
$route = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Quitar /api si está presente
$route = preg_replace('#^api/?#', '', $route);

// Enlazar las rutas
switch ($route) {

    case 'users':
        require_once __DIR__ . '/routes/usersRoutes.php';
        break;

    case 'products':
        require_once __DIR__ . '/routes/productsRoutes.php';
        break;

    case 'orders':
        require_once __DIR__ . '/routes/ordersRoutes.php';
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'message' => 'Ruta no encontrada'
        ]);
        break;
}
