<?php
/**
 * Script de Saneamiento de Prospectos en SiteGround
 * Realty ONE Group Bolivia
 * URL: /sanear_leads.php?key=ONE2026
 */

header('Content-Type: application/json; charset=utf-8');

$ADMIN_KEY = getenv('ADMIN_KEY') ?: 'ONE2026';
$key = $_GET['key'] ?? '';
if ($key !== $ADMIN_KEY) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Acceso denegado']);
    exit;
}

$files = [
    __DIR__ . '/leads.json',
    __DIR__ . '/backend/leads.json'
];

$results = [];

foreach ($files as $file) {
    if (!file_exists($file)) continue;

    $content = file_get_contents($file);
    $leads = json_decode($content, true);
    if (!is_array($leads)) continue;

    $dirtyNames = [
        'espero', 'buen día', 'buen dia', 'buenos días', 'buenos dias',
        'buenas tardes', 'buenas noches', 'buenas', 'hola', 'hola buen dia',
        'feliz cumpleaños amiga querida', 'feliz cumpleanos amiga querida',
        'feliz cumpleaños', 'feliz cumpleanos', 'feliz cumple', 'felicidades',
        'duc', 'cliente', 'desconocido', 'saludos', 'gracias', 'muchas gracias',
        'amigo', 'amiga', 'por identificar'
    ];

    foreach ($leads as &$l) {
        $nombre = strtolower(trim($l['cliente_nombre'] ?? ''));
        if (in_array($nombre, $dirtyNames)) {
            $l['cliente_nombre'] = 'Por identificar';
        }

        $phone = $l['numero_celular'] ?? '';
        if (strpos($phone, '77800939') !== false) {
            $l['cliente_nombre'] = 'Por identificar';
            $l['tipo_interes'] = 'Departamento (Co-Brokering Century21)';
            $l['presupuesto'] = '100.000 $us';
            $l['notas_asesor'] = 'Colega Asesor Century21 - Requerimiento cliente: Depto 2 dorms max piso 5 hasta $100.000 $us';
            $l['etapa_embudo'] = 'SOLICITUD';
            $l['score'] = 85;
            $l['prioridad'] = 'POTENCIAL';
            $l['prioridad_label'] = '🔥 Potencial (Alta)';
        }

        if (strpos($phone, '78999234') !== false) {
            $l['cliente_nombre'] = 'Por identificar';
            $l['horario_visita_solicitado'] = null;
            if (isset($l['formulario_datos'])) {
                $l['formulario_datos']['horario_visita'] = null;
            }
            $l['etapa_embudo'] = 'SOLICITUD';
            $l['score'] = 15;
            $l['prioridad'] = 'PASIVO';
            $l['prioridad_label'] = '❄️ Pasivo (Baja)';
        }

        if (!empty($l['horario_visita_solicitado'])) {
            $hv = strtolower($l['horario_visita_solicitado']);
            if (strpos($hv, 'cumpleaños') !== false || strpos($hv, 'cumpleanos') !== false || strpos($hv, 'amiga') !== false || strpos($hv, 'por ahora') !== false) {
                $l['horario_visita_solicitado'] = null;
                if (isset($l['formulario_datos'])) {
                    $l['formulario_datos']['horario_visita'] = null;
                }
                if (($l['etapa_embudo'] ?? '') === 'VISITA_AGENDADA') {
                    $l['etapa_embudo'] = 'SOLICITUD';
                }
            }
        }
    }
    unset($l);

    file_put_contents($file, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    $results[$file] = count($leads) . ' prospectos saneados';
}

echo json_encode(['success' => true, 'sanitizados' => $results]);
