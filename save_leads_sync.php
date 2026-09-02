<?php
/**
 * Sincronizador de Leads en Tiempo Real - Realty ONE Group Bolivia
 * Permite que el bot de WhatsApp (Node.js/Baileys o Webhook), el formulario de registro y el CRM Web
 * sincronicen inmediatamente los prospectos con sus números reales.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$LEADS_FILE    = __DIR__ . '/leads.json';
$LEADS_CSV     = __DIR__ . '/leads.csv';
$BACKEND_LEADS = __DIR__ . '/backend/leads.json';

$raw = file_get_contents('php://input');

if (!empty($raw)) {
    $data = json_decode($raw, true);
    if (is_array($data)) {
        // Cargar leads actuales
        $existingLeads = [];
        if (file_exists($LEADS_FILE)) {
            $existingLeads = json_decode(file_get_contents($LEADS_FILE), true) ?: [];
        }

        // Caso A: Envío individual desde formulario de registro (registro.html)
        if (isset($data['nombre']) || isset($data['telefono'])) {
            $nombre = trim($data['nombre'] ?? 'Por identificar');
            $rawPhone = preg_replace('/\D/', '', $data['telefono'] ?? '');
            if (strlen($rawPhone) === 8 && ($rawPhone[0] === '6' || $rawPhone[0] === '7' || $rawPhone[0] === '3')) {
                $phone = '+591' . $rawPhone;
            } elseif (strlen($rawPhone) >= 8) {
                $phone = '+' . $rawPhone;
            } else {
                $phone = '+591' . $rawPhone;
            }
            $email = trim($data['email'] ?? 'Pendiente');
            $fechaVisita = trim($data['fecha_visita'] ?? date('Y-m-d'));
            $horaVisita = trim($data['hora_visita'] ?? '10:00 AM');
            $visitaCompleta = "Visita: {$fechaVisita} {$horaVisita}";

            $dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            $meses = [
                1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
                5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
                9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
            ];
            $t = time();
            $w = (int)date('w', $t);
            $n = (int)date('n', $t);

            $newLead = [
                'id' => 'lead_' . round(microtime(true) * 1000) . '_' . substr(md5($phone), 0, 4),
                'numero_celular' => $phone,
                'cliente_nombre' => $nombre,
                'email' => $email,
                'fecha_creacion' => date('c'),
                'fecha_completa' => date('Y-m-d'),
                'hora' => date('H:i:s'),
                'dia' => date('d'),
                'dia_semana' => $dias[$w],
                'mes' => $meses[$n],
                'mes_numero' => date('m'),
                'anio' => date('Y'),
                'canal_origen' => 'WhatsApp (+591 60937050)',
                'campana' => 'Formulario de Registro Web',
                'estado_comercial' => 'Visita Agendada',
                'etapa_embudo' => 'VISITA_AGENDADA',
                'notas_asesor' => '',
                'ultimo_mensaje' => "Formulario completado: {$nombre}, {$rawPhone}, {$email}, {$visitaCompleta}",
                'total_mensajes' => 1,
                'historial' => [
                    [
                        'rol' => 'usuario',
                        'texto' => "Formulario completado: {$nombre}, {$rawPhone}, {$email}, {$visitaCompleta}",
                        'fecha' => date('Y-m-d'),
                        'hora' => date('H:i:s')
                    ],
                    [
                        'rol' => 'bot',
                        'texto' => 'Formulario completado y visita agendada',
                        'fecha' => date('Y-m-d'),
                        'hora' => date('H:i:s')
                    ]
                ],
                'zona_interes' => 'Santa Cruz (General)',
                'tipo_interes' => 'Consulta General',
                'presupuesto' => 'Por definir',
                'horario_visita_solicitado' => $visitaCompleta,
                'formulario_datos' => [
                    'nombre' => $nombre,
                    'telefono' => $phone,
                    'email' => $email,
                    'zona' => 'Santa Cruz (General)',
                    'operacion' => 'Consulta General',
                    'presupuesto' => 'Por definir',
                    'horario_visita' => $visitaCompleta,
                    'completado' => true
                ],
                'e_realtor_asignado' => 'Carlos Rodríguez',
                'e_realtor_id' => 'carlos_rodriguez',
                'e_realtor_telefono' => '+591 70123456',
                'e_realtor_email' => 'carlos@realtyonebolivia.com.bo',
                'e_realtor_especialidad' => 'Venta de Lujo & Casas Exclusivas',
                'e_realtor_avatar' => 'assets/agente_carlos.png',
                'prioridad' => 'POTENCIAL',
                'prioridad_label' => '🔥 Potencial (Alta)',
                'prioridad_badge' => 'badge-potencial',
                'score' => 100,
                'accion_sugerida' => 'Atención urgente de e-Realtor vía WhatsApp para confirmar visita y enviar ficha técnica.',
                'resumen' => 'Prospecto con datos completos y alta intención comercial. Listo para atención de e-Realtor.'
            ];

            // Reemplazar o agregar al inicio
            $found = false;
            foreach ($existingLeads as $idx => $el) {
                if (($el['numero_celular'] ?? '') === $phone || ($el['id'] ?? '') === $newLead['id']) {
                    $existingLeads[$idx] = $newLead;
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                array_unshift($existingLeads, $newLead);
            }
            $leadsToSave = $existingLeads;
        } else {
            // Caso B: Sincronización completa de leads desde CRM
            $leadsToSave = isset($data['leads']) && is_array($data['leads']) 
                ? $data['leads'] 
                : (isset($data['all_leads']) && is_array($data['all_leads']) ? $data['all_leads'] : $data);
            $leadsToSave = array_values($leadsToSave);
        }
        
        file_put_contents($LEADS_FILE, json_encode($leadsToSave, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        if (file_exists($BACKEND_LEADS)) {
            @file_put_contents($BACKEND_LEADS, json_encode($leadsToSave, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        }
        
        // Actualizar CSV
        $fp = @fopen($LEADS_CSV, 'w');
        if ($fp) {
            fprintf($fp, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($fp, [
                'ID Prospecto', 'Prioridad', 'Score', 'e-Realtor Asignado', 'Nombre Cliente', 'Celular', 'Email',
                'Tipo Interes', 'Zona Interes', 'Presupuesto', 'Fecha Completa', 'Año', 'Mes', 'Día',
                'Día Semana', 'Hora', 'Estado Comercial', 'Etapa Embudo', 'Canal Origen', 'Campaña', 'Accion Sugerida', 'Resumen IA', 'Ultimo Mensaje'
            ]);
            foreach ($leadsToSave as $l) {
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

        echo json_encode([
            'success' => true, 
            'message' => 'Leads sincronizados en vivo con números reales',
            'total' => count($leadsToSave),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        exit;
    }
}

// Si es GET, devolver leads actuales
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($LEADS_FILE)) {
        echo file_get_contents($LEADS_FILE);
    } else {
        echo json_encode([]);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'No valid data received']);
