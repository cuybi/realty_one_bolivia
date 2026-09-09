<?php
/**
 * Anti-Sleep Pinger para Render.com - Realty ONE Group Bolivia
 * Mantiene la instancia de Render despierta 24/7 sin dormirse.
 */

$RENDER_URL = isset($_GET['url']) ? trim($_GET['url']) : 'https://realty-one-bolivia.onrender.com';

$ch = curl_init($RENDER_URL . '/api/health');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => false
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'render_url' => $RENDER_URL,
    'http_code'  => $httpCode,
    'status'     => ($httpCode === 200) ? 'DESPIERTO_24_7' : 'ERROR_O_REINICIANDO',
    'timestamp'  => date('Y-m-d H:i:s'),
    'response'   => json_decode($response, true) ?: $response
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
