<?php
/**
 * Extractor y Activador Automático 1-Clic para SiteGround
 * Realty ONE Group Bolivia
 * Visita: https://realyonegroupbolivia.e-techgroupbolivia.com/extraer.php?key=ONE2026
 */

if (($_GET['key'] ?? '') !== 'ONE2026') {
    http_response_code(403);
    die('Acceso no autorizado. Ingrese con ?key=ONE2026');
}

header('Content-Type: text/plain; charset=utf-8');
echo "🦁 ========================================================\n";
echo "🦁 REALTY ONE GROUP - EXTRACTOR & ACTIVADOR EN SITEGROUND\n";
echo "🦁 ========================================================\n\n";

$dir = __DIR__;
chdir($dir);

// 1. Extraer ZIP si existe
$zipFile = null;
if (file_exists($dir . '/parche_rapido_siteground.zip')) {
    $zipFile = $dir . '/parche_rapido_siteground.zip';
} elseif (file_exists($dir . '/siteground_deploy.zip')) {
    $zipFile = $dir . '/siteground_deploy.zip';
}

if ($zipFile && class_exists('ZipArchive')) {
    echo "📦 [1/3] Extrayendo " . basename($zipFile) . "...\n";
    $zip = new ZipArchive;
    if ($zip->open($zipFile) === TRUE) {
        $zip->extractTo($dir);
        $zip->close();
        echo "✅ Archivos extraídos correctamente en $dir\n";
        if (file_exists($dir . '/sanear_leads.php')) {
            echo "🧹 Saneando base de datos de leads antiguos...\n";
            include_once $dir . '/sanear_leads.php';
            echo "\n✅ Leads antiguos saneados correctamente.\n";
        }
    } else {
        echo "⚠️ Error al abrir $zipFile\n";
    }
} else {
    echo "ℹ️ No se encontró ZIP para extraer o ZipArchive no está habilitado. Continuando con arranque...\n";
}

// 2. Dar permisos a keepalive.sh
if (file_exists($dir . '/keepalive.sh')) {
    chmod($dir . '/keepalive.sh', 0755);
    echo "✅ Permisos 0755 asignados a keepalive.sh\n";
}

// 3. Matar procesos anteriores y arrancar bot
echo "\n🚀 [2/3] Reiniciando bot con keepalive.sh...\n";
exec("kill -9 $(ps aux 2>/dev/null | grep -E 'node.*server\\.js' | grep -v grep | awk '{print $2}') 2>/dev/null");
@unlink($dir . '/bot.pid');

$keepCmd = "cd " . escapeshellarg($dir) . " && /bin/bash keepalive.sh 2>&1";
$keepOutput = [];
$keepCode = 0;
exec($keepCmd, $keepOutput, $keepCode);
echo implode("\n", $keepOutput) . "\n";

sleep(3);

// 4. Ver logs
echo "\n📄 [3/3] Últimas líneas de bot.log:\n";
$logFile = $dir . '/bot.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -25);
    echo implode("", $lastLines);
}

$statusFile = $dir . '/qr_status.json';
if (file_exists($statusFile)) {
    echo "\n📊 Estado en qr_status.json:\n";
    echo file_get_contents($statusFile) . "\n";
}

echo "\n========================================================\n";
echo "🎉 ¡LISTO! Abre tu conector en:\n";
echo "https://realyonegroupbolivia.e-techgroupbolivia.com/qr_connect.html?key=ONE2026\n";
echo "========================================================\n";
