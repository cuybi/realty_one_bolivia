<?php
/**
 * reset_session.php — Borra el estado de sesión de un número de WhatsApp
 * Uso: https://tudominio.com/reset_session.php?phone=59179XXXXXX
 * O sin parámetro: borra TODAS las sesiones
 */

$SESSIONS_FILE = __DIR__ . '/sessions.json';
$phone = $_GET['phone'] ?? null;

if (!file_exists($SESSIONS_FILE)) {
    die('sessions.json no existe en el servidor.');
}

$sessions = json_decode(file_get_contents($SESSIONS_FILE), true) ?: [];

if ($phone) {
    // Buscar la clave que contenga ese número
    $deleted = 0;
    foreach (array_keys($sessions) as $key) {
        if (strpos($key, preg_replace('/\D/', '', $phone)) !== false) {
            unset($sessions[$key]);
            $deleted++;
        }
    }
    file_put_contents($SESSIONS_FILE, json_encode($sessions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    echo "✅ Sesión borrada para '$phone'. Sesiones eliminadas: $deleted<br>";
    echo "Sesiones restantes: " . count($sessions);
} else {
    // Borrar todo
    file_put_contents($SESSIONS_FILE, json_encode([], JSON_PRETTY_PRINT), LOCK_EX);
    echo "✅ Todas las sesiones borradas (" . count($sessions) . " sesiones eliminadas).";
}
