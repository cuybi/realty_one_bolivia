<?php
/**
 * Puente PHP hacia el Bot Node.js (Port 3000 / File Bridge) en SiteGround
 * Realty ONE Group Bolivia
 * Permite a qr_connect.html comunicarse con el bot aún sin puertos de red abiertos.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$port = 3000;
$action = $_GET['action'] ?? 'status';

// Si es POST (Pairing code o Desconectar)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $postData = json_decode($rawInput, true) ?? [];
    $endpoint = ($action === 'pairing') ? '/api/whatsapp/pairing-code' : '/api/whatsapp/desconectar';
    
    // 1. Intento por Socket HTTP local (si el puerto está abierto)
    $ch = curl_init("http://127.0.0.1:{$port}{$endpoint}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $rawInput);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 3);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response && $httpCode >= 200 && $httpCode < 400) {
        echo $response;
        exit;
    }
    
    // 2. Fallback de alta resiliencia: File-IPC vía qr_command.json
    $cmd = [
        'action' => $action,
        'phoneNumber' => $postData['phoneNumber'] ?? '59160937050',
        'timestamp' => time()
    ];
    file_put_contents(__DIR__ . '/qr_command.json', json_encode($cmd, JSON_PRETTY_PRINT));
    
    // Esperar hasta 3 segundos a que Node procese el comando y actualice qr_status.json
    $statusFile = __DIR__ . '/qr_status.json';
    for ($i = 0; $i < 6; $i++) {
        usleep(500000); // 0.5s
        if (file_exists($statusFile)) {
            $statusData = json_decode(file_get_contents($statusFile), true);
            if ($action === 'pairing' && !empty($statusData['pairingCode'])) {
                echo json_encode(['success' => true, 'code' => $statusData['pairingCode']]);
                exit;
            }
            if ($action === 'desconectar' && ($statusData['status'] ?? '') === 'desconectado') {
                echo json_encode(['success' => true, 'message' => 'Sesión desconectada exitosamente']);
                exit;
            }
        }
    }

    echo json_encode([
        'success' => false,
        'error' => 'Comando enviado, pero el bot aún está reconectando. Reintenta en 3 segundos.'
    ]);
    exit;
}

// GET: Consultar estado actual del QR / WhatsApp

// 1. Intentar HTTP local si Node tiene puerto abierto
$ch = curl_init("http://127.0.0.1:{$port}/api/whatsapp/qr-real?key=ONE2026");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 2);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($response && $httpCode === 200) {
    echo $response;
    exit;
}

// 2. Si no responde por HTTP, leer directamente qr_status.json en disco
$jsonFile = __DIR__ . '/qr_status.json';
if (file_exists($jsonFile)) {
    $content = file_get_contents($jsonFile);
    if (!empty($content)) {
        echo $content;
        exit;
    }
}

// 3. Si ni Node ni qr_status.json responden
echo json_encode([
    'status' => 'servidor_apagado',
    'qr' => null,
    'numeroConectado' => null,
    'pairingCode' => null,
    'mensaje' => 'El servidor del bot en Node.js aún no está activo en SiteGround. Visita instalar.php?key=ONE2026 para activarlo.'
]);
