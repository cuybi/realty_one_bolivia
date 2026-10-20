<?php
/**
 * Instalador y Activador Automático 1-Clic para SiteGround
 * Realty ONE Group Bolivia
 * Ejecuta npm install y activa keepalive.sh sin necesidad de configurar SSH.
 */

if (($_GET['key'] ?? '') !== 'ONE2026') {
    http_response_code(403);
    die('Acceso no autorizado. Ingrese con ?key=ONE2026');
}

header('Content-Type: text/plain; charset=utf-8');
echo "🦁 ========================================================\n";
echo "🦁 REALTY ONE GROUP - ACTIVADOR EN VIVO (SITEGROUND)\n";
echo "🦁 ========================================================\n\n";

$dir = __DIR__;
chdir($dir);

// 1. Permisos ejecutables a keepalive.sh
$keepalivePath = $dir . '/keepalive.sh';
if (file_exists($keepalivePath)) {
    chmod($keepalivePath, 0755);
    echo "✅ Permisos de ejecución (0755) aplicados a keepalive.sh\n";
} else {
    echo "⚠️ keepalive.sh no encontrado en $dir\n";
}

// 2. Instalar dependencias npm
echo "\n📦 [1/3] Instalando dependencias de producción (npm install)...\n";
$npmCmd = "cd " . escapeshellarg($dir) . " && npm install --omit=dev 2>&1";
$npmOutput = [];
$npmCode = 0;
exec($npmCmd, $npmOutput, $npmCode);
echo implode("\n", $npmOutput) . "\n";
echo "Estado npm: " . ($npmCode === 0 ? "OK ✅" : "Código: $npmCode ⚠️") . "\n";

// 3. Limpiar procesos previos y arrancar el bot con keepalive.sh
echo "\n🚀 [2/3] Reiniciando y arrancando bot en segundo plano con keepalive.sh...\n";
exec("kill -9 $(ps aux 2>/dev/null | grep -E 'node.*server\\.js' | grep -v grep | awk '{print $2}') 2>/dev/null");
@unlink($dir . '/bot.pid');

$keepCmd = "cd " . escapeshellarg($dir) . " && /bin/bash keepalive.sh 2>&1";
$keepOutput = [];
$keepCode = 0;
exec($keepCmd, $keepOutput, $keepCode);
echo implode("\n", $keepOutput) . "\n";

// 4. Leer logs en vivo y verificar estado
sleep(3);
echo "\n📄 [3/3] Verificando arranque en bot.log:\n";
$logFile = $dir . '/bot.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -25);
    echo implode("", $lastLines);
} else {
    echo "El archivo bot.log aún no se ha generado.\n";
}

$statusFile = $dir . '/qr_status.json';
if (file_exists($statusFile)) {
    echo "\n📊 Estado de sincronización en qr_status.json:\n";
    echo file_get_contents($statusFile) . "\n";
} else {
    echo "\n⚠️ qr_status.json aún no se ha generado.\n";
}

echo "\n========================================================\n";
echo "🎉 ¡LISTO! El bot ya quedó activo 24/7 en SiteGround.\n";
echo "🔒 Por seguridad, puedes eliminar este archivo (instalar.php) desde el Gestor de Archivos.\n";
echo "========================================================\n";
