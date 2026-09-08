<?php
/**
 * delete_lead.php — Eliminar Prospecto del CRM en SiteGround / Servidor PHP
 * Realty ONE Group Bolivia
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0");
header("Pragma: no-cache");
header("Expires: 0");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$LEADS_FILE    = __DIR__ . '/leads.json';
$LEADS_CSV     = __DIR__ . '/leads.csv';
$BACKEND_LEADS = __DIR__ . '/backend/leads.json';
$SESSIONS_FILE = __DIR__ . '/sessions.json';

$id     = $_GET['id'] ?? $_POST['id'] ?? '';
$phone  = $_GET['phone'] ?? $_POST['phone'] ?? '';
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$allLeadsPost = null;

// Si viene por JSON body (POST / DELETE)
$raw = file_get_contents('php://input');
if (!empty($raw)) {
    $data = json_decode($raw, true);
    if (is_array($data)) {
        if (!empty($data['id'])) $id = $data['id'];
        if (!empty($data['phone'])) $phone = $data['phone'];
        if (!empty($data['action'])) $action = $data['action'];
        
        if (isset($data['all_leads']) && is_array($data['all_leads'])) {
            $allLeadsPost = $data['all_leads'];
        } elseif (isset($data['leads']) && is_array($data['leads'])) {
            $allLeadsPost = $data['leads'];
        } elseif (array_values($data) === $data) {
            // Es un array numérico directo: [ {...}, {...} ]
            $allLeadsPost = $data;
        }
    }
}

// ==========================================
// 1. ACCIÓN: LIMPIAR / VACIAR TODO EL CRM
// ==========================================
if ($action === 'clear_all' || $action === 'reset' || isset($_GET['clear_all'])) {
    file_put_contents($LEADS_FILE, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    if (file_exists($BACKEND_LEADS)) {
        @file_put_contents($BACKEND_LEADS, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
    if (file_exists($SESSIONS_FILE)) {
        @file_put_contents($SESSIONS_FILE, json_encode([], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
    updateCsvFile($LEADS_CSV, []);

    echo json_encode([
        'success' => true,
        'message' => 'Todos los prospectos y sesiones han sido eliminados del CRM con éxito.',
        'total' => 0,
        'leads' => []
    ]);
    exit;
}

// ==========================================
// 2. GUARDAR LISTA COMPLETA DIRECTAMENTE
// ==========================================
if ($allLeadsPost !== null && is_array($allLeadsPost)) {
    $cleanList = array_values($allLeadsPost);
    file_put_contents($LEADS_FILE, json_encode($cleanList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    if (file_exists($BACKEND_LEADS)) {
        @file_put_contents($BACKEND_LEADS, json_encode($cleanList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
    updateCsvFile($LEADS_CSV, $cleanList);

    echo json_encode([
        'success' => true,
        'message' => 'Lista de prospectos sincronizada con éxito',
        'total' => count($cleanList),
        'leads' => $cleanList
    ]);
    exit;
}

// ==========================================
// 3. ELIMINAR POR ID Y/O NÚMERO DE TELÉFONO
// ==========================================
if (empty($id) && empty($phone)) {
    echo json_encode(['success' => false, 'error' => 'ID o teléfono requerido para eliminar']);
    exit;
}

$leads = [];
if (file_exists($LEADS_FILE)) {
    $leads = json_decode(file_get_contents($LEADS_FILE), true) ?: [];
}

$beforeCount = count($leads);
$deletedCount = 0;

$cleanTargetPhone = preg_replace('/\D/', '', (string)$phone);
// Extraer últimos 8 dígitos si es número largo boliviano/internacional
$shortPhone = strlen($cleanTargetPhone) >= 8 ? substr($cleanTargetPhone, -8) : $cleanTargetPhone;

$leads = array_values(array_filter($leads, function($l) use ($id, $cleanTargetPhone, $shortPhone, &$deletedCount) {
    // Coincidencia por ID exacto o numérico
    if (!empty($id) && isset($l['id']) && (string)$l['id'] === (string)$id) {
        $deletedCount++;
        return false;
    }
    
    // Coincidencia por teléfono
    if (!empty($cleanTargetPhone)) {
        $leadPhone = preg_replace('/\D/', '', (string)($l['numero_celular'] ?? ''));
        $formPhone = preg_replace('/\D/', '', (string)($l['formulario_datos']['telefono'] ?? ''));

        if ($leadPhone) {
            if ($leadPhone === $cleanTargetPhone || 
                (!empty($shortPhone) && strpos($leadPhone, $shortPhone) !== false) ||
                (!empty($shortPhone) && strpos($cleanTargetPhone, substr($leadPhone, -8)) !== false)) {
                $deletedCount++;
                return false;
            }
        }

        if ($formPhone) {
            if ($formPhone === $cleanTargetPhone || 
                (!empty($shortPhone) && strpos($formPhone, $shortPhone) !== false)) {
                $deletedCount++;
                return false;
            }
        }
    }
    
    return true;
}));

$afterCount = count($leads);

// Guardar siempre el resultado en los archivos
file_put_contents($LEADS_FILE, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
if (file_exists($BACKEND_LEADS)) {
    @file_put_contents($BACKEND_LEADS, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}
updateCsvFile($LEADS_CSV, $leads);

echo json_encode([
    'success' => true,
    'message' => $deletedCount > 0 ? "Prospecto(s) eliminado(s) con éxito ({$deletedCount})" : "Operación completada",
    'deleted_count' => $deletedCount,
    'total' => $afterCount,
    'leads' => $leads
]);

function updateCsvFile($csvPath, $leadsList) {
    $fp = @fopen($csvPath, 'w');
    if ($fp) {
        fprintf($fp, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($fp, [
            'ID Prospecto', 'Prioridad', 'Score', 'e-Realtor Asignado', 'Nombre Cliente', 'Celular', 'Email',
            'Tipo Interes', 'Zona Interes', 'Presupuesto', 'Fecha Completa', 'Año', 'Mes', 'Día',
            'Día Semana', 'Hora', 'Estado Comercial', 'Etapa Embudo', 'Canal Origen', 'Campaña', 'Accion Sugerida', 'Resumen IA', 'Ultimo Mensaje'
        ]);
        foreach ($leadsList as $l) {
            fputcsv($fp, [
                $l['id'] ?? '',
                $l['prioridad_label'] ?? $l['prioridad'] ?? '',
                $l['score'] ?? '',
                $l['e_realtor_asignado'] ?? 'Carlos Rodríguez',
                $l['cliente_nombre'] ?? 'Por identificar',
                $l['numero_celular'] ?? '',
                $l['email'] ?? 'Pendiente',
                $l['tipo_interes'] ?? 'General',
                $l['zona_interes'] ?? 'Santa Cruz',
                $l['presupuesto'] ?? 'Por definir',
                $l['fecha_completa'] ?? '',
                $l['anio'] ?? '',
                $l['mes'] ?? '',
                $l['dia'] ?? '',
                $l['dia_semana'] ?? '',
                $l['hora'] ?? '',
                $l['estado_comercial'] ?? 'Nuevo',
                $l['etapa_embudo'] ?? 'SOLICITUD',
                $l['canal_origen'] ?? 'WhatsApp',
                $l['campana'] ?? 'General',
                $l['accion_sugerida'] ?? '',
                $l['resumen'] ?? '',
                $l['ultimo_mensaje'] ?? ''
            ]);
        }
        fclose($fp);
    }
}
