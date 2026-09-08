<?php
/**
 * Realty ONE Group Bolivia - CMS Persistence API for SiteGround / PHP Hosting
 * Permite guardar y recuperar todos los datos del CMS dinámico.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, x-admin-key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = __DIR__ . '/cms_data.json';

// Cargar datos
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        echo $content ?: json_encode(['status' => 'empty']);
    } else {
        echo json_encode(['status' => 'not_found', 'message' => 'No custom CMS data yet, using local defaults']);
    }
    exit;
}

// Guardar datos
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    if (!$rawInput) {
        http_response_code(400);
        echo json_encode(['error' => 'No data received']);
        exit;
    }

    $decoded = json_decode($rawInput, true);
    if ($decoded === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    // Guardado atómico con bloqueo
    $fp = fopen($dataFile, 'w');
    if ($fp && flock($fp, LOCK_EX)) {
        fwrite($fp, json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        echo json_encode(['success' => true, 'message' => 'Contenidos guardados exitosamente', 'timestamp' => date('Y-m-d H:i:s')]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo escribir en el archivo de datos']);
    }
    exit;
}
