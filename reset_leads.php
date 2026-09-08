<?php
/**
 * Script para reiniciar y limpiar la base de datos de prospectos (leads.json / leads.csv / sessions.json)
 * Realty ONE Group Bolivia
 */

$LEADS_FILE    = __DIR__ . '/leads.json';
$LEADS_CSV     = __DIR__ . '/leads.csv';
$SESSIONS_FILE = __DIR__ . '/sessions.json';

// Limpiar archivos
file_put_contents($LEADS_FILE, json_encode([], JSON_PRETTY_PRINT));
file_put_contents($SESSIONS_FILE, json_encode([], JSON_PRETTY_PRINT));

$fp = fopen($LEADS_CSV, 'w');
if ($fp) {
    fputs($fp, "\xEF\xBB\xBF"); // UTF-8 BOM
    fputcsv($fp, [
        'ID Prospecto', 'Prioridad', 'Score', 'Nombre Cliente', 'Celular', 'Email',
        'Tipo Interes', 'Zona Interes', 'Presupuesto', 'Fecha Completa', 'Año', 'Mes', 'Día',
        'Día Semana', 'Hora', 'Estado Comercial', 'Canal Origen', 'Campaña', 'Accion Sugerida', 'Resumen IA', 'Ultimo Mensaje'
    ]);
    fclose($fp);
}

header("Content-Type: text/html; charset=utf-8");
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Base de Datos Reiniciada - CRM ONE</title>
  <style>
    body { background: #0b0f12; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #12191f; border: 1px solid #D4AF37; border-radius: 12px; padding: 30px; text-align: center; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { color: #D4AF37; margin-bottom: 12px; font-size: 1.4rem; }
    p { color: #a9b7c6; font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px; }
    .btn { background: linear-gradient(135deg, #f3cf55, #D4AF37); color: #000; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🧹 ¡Base de Datos y Sesiones Limpiadas con Éxito!</h1>
    <p>Se han eliminado todos los registros de prueba antiguos (incluyendo Carlos Mendoza). La base de datos ahora está 100% limpia y lista para registrar tus datos reales de WhatsApp.</p>
    <a href="ingreso_leads.html" class="btn">👉 Ir al Ingreso de Leads en Vivo</a>
  </div>
</body>
</html>
