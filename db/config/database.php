
<?php

require_once __DIR__ . '/../../vendor/autoload.php';

// Cargar el archivo .env de la raíz
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__, 2));
$dotenv->load();

try {

    // Conectar con MongoDB Atlas
    $client = new MongoDB\Client($_ENV['MONGODB_URI']);

    // Seleccionar la base de datos
    $db = $client->selectDatabase('online-shop');

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'message' => 'Error al conectar con MongoDB Atlas'
    ]);

    exit;
}
