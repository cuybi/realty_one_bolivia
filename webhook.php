<?php
/**
 * Webhook Oficial de WhatsApp Business - Realty ONE Group Bolivia
 * Sistema Inteligente con Detección Automática de Campañas (Parque Industrial / G77),
 * Catálogo General, Consultas Inmobiliarias y Captura de Leads.
 */

date_default_timezone_set('America/La_Paz');

// Archivos de persistencia en SiteGround
$LOG_FILE       = __DIR__ . '/webhook_log.txt';
$SESSIONS_FILE  = __DIR__ . '/sessions.json';
$LEADS_FILE     = __DIR__ . '/leads.json';
$LEADS_CSV      = __DIR__ . '/leads.csv';
$PROCESSED_FILE = __DIR__ . '/processed_messages.json';

$CONFIG_FILE    = __DIR__ . '/meta_config.json';

// Configuración de Tokens por Defecto
$VERIFY_TOKEN    = "realty_one_whatsapp_verify_token_2026";
$WHATSAPP_TOKEN  = "EAAS6vrSHBuUBSckrwVb5DSRn7MZAynRKuCQDVjZCSa0NQqghUs5VTlnIxbuILZAgznr2Bu4EGH9v6YC24gYfrknB02KxxZBBxWqrdSy8So9fgIg1FXQZC0iZAZAfTq7dpqpzGIEA575WcQGWV6e119rgxjEYrly7N6yQpNjSPxi2ZBkjDPoXa3suSH65s0cHFASzaAZDZD";
$PHONE_NUMBER_ID = "1347227495132840";

// Sobrescribir con meta_config.json si existe
if (file_exists($CONFIG_FILE)) {
    $dynConfig = json_decode(file_get_contents($CONFIG_FILE), true);
    if (!empty($dynConfig['token'])) $WHATSAPP_TOKEN = $dynConfig['token'];
    if (!empty($dynConfig['phone_number_id'])) $PHONE_NUMBER_ID = $dynConfig['phone_number_id'];
    if (!empty($dynConfig['verify_token'])) $VERIFY_TOKEN = $dynConfig['verify_token'];
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: text/plain; charset=utf-8");

function writeLog($msg) {
    global $LOG_FILE;
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL;
    file_put_contents($LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}

// ╔══════════════════════════════════════════════════════════════╗
// ║ Control anti-repetición con BLOQUEO ATÓMICO (flock)          ║
// ║ Garantiza que dos peticiones simultáneas de Meta              ║
// ║ NO procesen el mismo mensaje dos veces en paralelo.           ║
// ╚══════════════════════════════════════════════════════════════╝
function isMessageAlreadyProcessed($msgId) {
    global $PROCESSED_FILE;
    if (empty($msgId)) return false;

    // Un archivo de lock EXCLUSIVO por message_id para atomicidad
    $lockFile = sys_get_temp_dir() . '/wa_msg_' . md5($msgId) . '.lock';
    $fp = fopen($lockFile, 'c');
    if (!$fp) {
        // Si no podemos crear el lock, usamos el método anterior como fallback
        $processed = file_exists($PROCESSED_FILE)
            ? (json_decode(file_get_contents($PROCESSED_FILE), true) ?: [])
            : [];
        if (in_array($msgId, $processed)) return true;
        $processed[] = $msgId;
        if (count($processed) > 500) $processed = array_slice($processed, -500);
        file_put_contents($PROCESSED_FILE, json_encode($processed), LOCK_EX);
        return false;
    }

    // Intentar obtener el lock exclusivo (bloqueante hasta 3 segundos)
    $locked = flock($fp, LOCK_EX | LOCK_NB, $wouldBlock);
    if (!$locked) {
        // Otro proceso ya tiene el lock → este mensaje está siendo procesado → duplicado
        fclose($fp);
        return true;
    }

    // Tenemos el lock: leer el archivo de procesados
    $processed = [];
    if (file_exists($PROCESSED_FILE)) {
        $data = file_get_contents($PROCESSED_FILE);
        $processed = json_decode($data, true) ?: [];
    }

    if (in_array($msgId, $processed)) {
        flock($fp, LOCK_UN);
        fclose($fp);
        return true;
    }

    // Registrar como procesado y guardar
    $processed[] = $msgId;
    if (count($processed) > 500) {
        $processed = array_slice($processed, -500);
    }
    file_put_contents($PROCESSED_FILE, json_encode($processed), LOCK_EX);

    // Liberar lock después de 2 segundos (tiempo suficiente para evitar duplicados)
    sleep(0); // No bloquear, el lock de archivo ya garantiza atomicidad
    flock($fp, LOCK_UN);
    fclose($fp);
    return false;
}

// Helpers para sesiones en JSON
function loadSessions() {
    global $SESSIONS_FILE;
    if (file_exists($SESSIONS_FILE)) {
        $data = file_get_contents($SESSIONS_FILE);
        return json_decode($data, true) ?: [];
    }
    return [];
}

function saveSessions($sessions) {
    global $SESSIONS_FILE;
    file_put_contents($SESSIONS_FILE, json_encode($sessions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

// Nombres en español para meses y días
function getSpanishDateBreakdown($timestamp = null) {
    if (!$timestamp) $timestamp = time();
    $dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    $meses = [
        1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
        5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
        9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
    ];

    $w = (int)date('w', $timestamp);
    $n = (int)date('n', $timestamp);

    return [
        'fecha_completa' => date('Y-m-d', $timestamp),
        'hora'           => date('H:i:s', $timestamp),
        'dia'            => date('d', $timestamp),
        'dia_semana'     => $dias[$w],
        'mes'            => $meses[$n],
        'mes_numero'     => date('m', $timestamp),
        'anio'           => date('Y', $timestamp)
    ];
}

// Clasificar lead y guardar en JSON y CSV
function trackAndClassifyLeadPHP($sender, $userMsg, $botReply = '', $referral = null, $pushName = '') {
    global $LEADS_FILE, $LEADS_CSV;

    $cleanPhone = preg_replace('/\D/', '', $sender);
    if (strlen($cleanPhone) === 8 && (strpos($cleanPhone, '7') === 0 || strpos($cleanPhone, '6') === 0)) {
        $cleanPhone = '591' . $cleanPhone;
    }
    $phone = '+' . $cleanPhone;

    $timeData = getSpanishDateBreakdown();
    $m = normalizeStr($userMsg);

    // 1. Cargar leads existentes
    $leads = [];
    if (file_exists($LEADS_FILE)) {
        $leads = json_decode(file_get_contents($LEADS_FILE), true) ?: [];
    }

    $leadIndex = -1;
    foreach ($leads as $idx => $l) {
        if ($l['numero_celular'] === $phone || $l['id'] === $sender) {
            $leadIndex = $idx;
            break;
        }
    }

    if ($leadIndex >= 0) {
        $lead = &$leads[$leadIndex];
        if (!empty($pushName) && ($lead['cliente_nombre'] === 'Por identificar' || empty($lead['cliente_nombre']))) {
            $lead['cliente_nombre'] = $pushName;
        }
        $lead['historial'][] = ['rol' => 'usuario', 'texto' => $userMsg, 'hora' => $timeData['hora']];
        if ($botReply) {
            $lead['historial'][] = ['rol' => 'bot', 'texto' => $botReply, 'hora' => $timeData['hora']];
        }
        $lead['total_mensajes'] = count($lead['historial']);
        $lead['ultimo_mensaje'] = $userMsg;
        $lead['fecha_completa'] = $timeData['fecha_completa'];
        $lead['hora']           = $timeData['hora'];
        $lead['dia']            = $timeData['dia'];
        $lead['dia_semana']     = $timeData['dia_semana'];
        $lead['mes']            = $timeData['mes'];
        $lead['mes_numero']     = $timeData['mes_numero'];
        $lead['anio']           = $timeData['anio'];

        // Mover al inicio de la lista
        if ($leadIndex > 0) {
            $curr = $lead;
            array_splice($leads, $leadIndex, 1);
            array_unshift($leads, $curr);
            $lead = &$leads[0];
        }
    } else {
        $initialName = !empty($pushName) ? $pushName : 'Por identificar';
        $lead = [
            'id'             => 'lead_' . time() . '_' . substr(md5($sender), 0, 4),
            'numero_celular' => $phone,
            'cliente_nombre' => $initialName,
            'email'          => 'Pendiente',
            'fecha_completa' => $timeData['fecha_completa'],
            'hora'           => $timeData['hora'],
            'dia'            => $timeData['dia'],
            'dia_semana'     => $timeData['dia_semana'],
            'mes'            => $timeData['mes'],
            'mes_numero'     => $timeData['mes_numero'],
            'anio'           => $timeData['anio'],
            'canal_origen'   => $referral ? 'Facebook Ads' : 'WhatsApp Cloud API',
            'campana'        => 'Catálogo General',
            'estado_comercial'=> 'Nuevo',
            'notas_asesor'   => '',
            'ultimo_mensaje' => $userMsg,
            'total_mensajes' => 1,
            'historial'      => [
                ['rol' => 'usuario', 'texto' => $userMsg, 'hora' => $timeData['hora']]
            ]
        ];
        if ($botReply) {
            $lead['historial'][] = ['rol' => 'bot', 'texto' => $botReply, 'hora' => $timeData['hora']];
        }
        array_unshift($leads, $lead);
        $lead = &$leads[0];
    }

    // Extraer datos directos si el mensaje actual viene separado por comas (Ej: "Carlos Perez, 67890987, carlos@gmail.com")
    $commaParts = array_map('trim', explode(',', $userMsg));
    if (count($commaParts) >= 2) {
        foreach ($commaParts as $cp) {
            if (strpos($cp, '@') !== false && preg_match('/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/i', $cp, $eMat)) {
                $lead['email'] = strtolower($eMat[0]);
            } elseif (preg_match('/\b[67]\d{7}\b/', preg_replace('/\D/', '', $cp), $phMat)) {
                $lead['telefono_contacto'] = '+591' . $phMat[0];
            } elseif (preg_match('/^[a-záéíóúñA-ZÁÉÍÓÚÑ\s]{3,35}$/u', $cp) && !preg_match('/\d/', $cp)) {
                $lead['cliente_nombre'] = ucwords(strtolower($cp));
            }
        }
    }

    // Concatenar texto completo
    $allText = '';
    foreach ($lead['historial'] as $h) {
        if ($h['rol'] === 'usuario') $allText .= ' ' . $h['texto'];
    }
    $nAll = normalizeStr($allText);

    // Extraer Email si no está
    if (empty($lead['email']) || $lead['email'] === 'Pendiente') {
        if (preg_match('/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i', $allText, $emMatch)) {
            $lead['email'] = strtolower($emMatch[1]);
        }
    }

    // Extraer Nombre si no está
    if (empty($lead['cliente_nombre']) || $lead['cliente_nombre'] === 'Por identificar') {
        if (preg_match('/(?:mi\s+nombre\s+es|me\s+llamo|soy|habla|atte:?)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,3})/i', $allText, $nmMatch)) {
            $cand = trim($nmMatch[1]);
            if (!in_array(strtolower($cand), ['interesado', 'cliente', 'amigo', 'alguien'])) {
                $lead['cliente_nombre'] = ucwords(strtolower($cand));
            }
        }
    }

    // Extraer Teléfono de Contacto Alternativo
    foreach ($lead['historial'] as $h) {
        if ($h['rol'] === 'usuario') {
            if (preg_match('/(?:cel(?:ular)?|tel(?:efono)?|contacto|wa)?[:\s,]*([67]\d{7})/i', $h['texto'], $phMatch)) {
                $lead['telefono_contacto'] = '+591' . $phMatch[1];
            }
        }
    }

    // Extraer Día y Hora de Visita Solicitada
    if (preg_match('/(?:lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|manana|mañana|hoy)\s*(?:[0-9]{1,2})?\s*(?:a\s*las\s*)?([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm|hrs)?)/i', $allText, $visMatch)) {
        $sch = substr(trim($visMatch[0]), 0, 45);
        $lead['horario_visita_solicitada'] = $sch;
        $lead['horario_visita_solicitado'] = $sch;
        $lead['estado_comercial'] = 'Visita Agendada';
        $lead['notas_asesor'] = 'Visita presencial solicitada: ' . $sch . '. Contactar al cliente.';
    }

    // Extraer Zona y Operación
    if (strpos($nAll, 'parque industrial') !== false || strpos($nAll, 'g77') !== false) {
        $lead['zona_interes'] = 'Parque Industrial / G77';
        $lead['tipo_interes'] = 'Terreno Industrial (G77)';
        $lead['presupuesto']  = 'Bs 16.800.000';
        $lead['campana']      = 'Terreno Industrial 7.000 m² (Salida G77)';
    } elseif (strpos($nAll, 'urubo') !== false) {
        $lead['zona_interes'] = 'Urubó';
    } elseif (strpos($nAll, 'equipetrol') !== false) {
        $lead['zona_interes'] = 'Equipetrol';
    } elseif (strpos($nAll, 'sirari') !== false) {
        $lead['zona_interes'] = 'Sirari';
    } elseif (strpos($nAll, 'hamacas') !== false || strpos($nAll, 'norte') !== false) {
        $lead['zona_interes'] = 'Zona Norte / Hamacas';
    }

    if (strpos($nAll, 'anticret') !== false) {
        $lead['tipo_interes'] = 'Anticrético';
    } elseif (strpos($nAll, 'alquil') !== false) {
        $lead['tipo_interes'] = 'Alquiler';
    } elseif (strpos($nAll, 'terren') !== false || strpos($nAll, 'lote') !== false) {
        $lead['tipo_interes'] = 'Terrenos / Lotes';
    } elseif (strpos($nAll, 'vender mi') !== false || strpos($nAll, 'consignar') !== false) {
        $lead['tipo_interes'] = 'Consignación / Propietario';
    } elseif (strpos($nAll, 'comprar') !== false || strpos($nAll, 'venta') !== false) {
        $lead['tipo_interes'] = 'Venta / Compra';
    }

    // Calcular Prioridad
    if (strpos($nAll, 'vender mi') !== false || strpos($nAll, 'alquilar mi') !== false || strpos($nAll, 'consignar') !== false) {
        $lead['prioridad']       = 'PROPIETARIO';
        $lead['prioridad_label'] = '💼 Propietario (Captación)';
        $lead['score']           = 95;
        $lead['accion_sugerida'] = 'Asignar a asesor de captaciones para avalúo comercial y firma de autorización.';
        $lead['resumen']         = 'Propietario interesado en consignar inmueble para venta/alquiler.';
    } elseif (
        ($lead['cliente_nombre'] !== 'Por identificar' && $lead['email'] !== 'Pendiente') ||
        strpos($nAll, 'visita') !== false ||
        strpos($nAll, 'agendar') !== false ||
        strpos($nAll, 'coordinar') !== false ||
        strpos($nAll, 'asesor') !== false ||
        strpos($nAll, 'humano') !== false ||
        strpos($nAll, 'srl') !== false ||
        strpos($nAll, 'al contado') !== false
    ) {
        $lead['prioridad']       = 'POTENCIAL';
        $lead['prioridad_label'] = '🔥 Potencial (Alta)';
        $lead['score']           = 100;
        $lead['accion_sugerida'] = 'Contactar urgentemente para coordinar visita técnica presencial o reunión comercial.';
        $lead['resumen']         = 'Cliente dejó datos de contacto (Nombre, Celular y Correo) y solicitó visita presencial.';
    } elseif (
        strpos($nAll, 'precio') !== false ||
        strpos($nAll, 'cuanto') !== false ||
        strpos($nAll, 'ubicacion') !== false ||
        strpos($nAll, 'medida') !== false ||
        strpos($nAll, 'fotos') !== false ||
        strpos($nAll, 'requisito') !== false ||
        strpos($nAll, 'folio') !== false
    ) {
        $lead['prioridad']       = 'INDECISO';
        $lead['prioridad_label'] = '⚡ Indeciso (Media)';
        $lead['score']           = 55;
        $lead['accion_sugerida'] = 'Enviar ficha técnica, dossier en PDF y realizar seguimiento en 24h.';
        $lead['resumen']         = 'Prospecto consultando precios, medidas y requerimientos legales.';
    } else {
        $lead['prioridad']       = 'PASIVO';
        $lead['prioridad_label'] = '❄️ Pasivo (Baja)';
        $lead['score']           = 25;
        $lead['accion_sugerida'] = 'Mantener en base de datos de nutrición y re-contactar con catálogo.';
        $lead['resumen']         = 'Contacto inicial o saludo general.';
    }

    // Asignación Inteligente de CRM IA a e-Realtor
    $eRealtor = [
        'nombre' => 'Carlos Rodríguez',
        'telefono' => '+591 70123456',
        'email' => 'carlos@realtyonebolivia.com.bo',
        'especialidad' => 'Venta de Lujo & Casas Exclusivas',
        'id' => 'carlos_rodriguez',
        'avatar' => 'assets/agente_carlos.png'
    ];

    if (strpos($nAll, 'propietario') !== false || strpos($nAll, 'consignar') !== false || strpos($nAll, 'vender mi') !== false) {
        $eRealtor = [
            'nombre' => 'Robert Oliva',
            'telefono' => '+591 60937050',
            'email' => 'info@realtyonegroup.com.bo',
            'especialidad' => 'Master Broker / Captaciones & Inversiones VIP',
            'id' => 'robert_oliva',
            'avatar' => 'assets/logo_bolivia.png'
        ];
    } elseif (strpos($nAll, 'terren') !== false || strpos($nAll, 'g77') !== false || strpos($nAll, 'industrial') !== false) {
        $eRealtor = [
            'nombre' => 'Andrés Montaño',
            'telefono' => '+591 70345678',
            'email' => 'andres@realtyonebolivia.com.bo',
            'especialidad' => 'Terrenos, Loteamientos & Parque Industrial',
            'id' => 'andres_montano',
            'avatar' => 'assets/agente_andres.png'
        ];
    } elseif (strpos($nAll, 'anticret') !== false) {
        $eRealtor = [
            'nombre' => 'Lucía Vaca',
            'telefono' => '+591 70456789',
            'email' => 'lucia@realtyonebolivia.com.bo',
            'especialidad' => 'Anticréticos Seguros & Asesoría Legal DDRR',
            'id' => 'lucia_vaca',
            'avatar' => 'assets/agente_lucia.png'
        ];
    } elseif (strpos($nAll, 'alquil') !== false) {
        $eRealtor = [
            'nombre' => 'Valeria Suárez',
            'telefono' => '+591 70234567',
            'email' => 'valeria@realtyonebolivia.com.bo',
            'especialidad' => 'Alquileres Corporativos & Departamentos',
            'id' => 'valeria_suarez',
            'avatar' => 'assets/agente_valeria.png'
        ];
    }

    $lead['e_realtor_asignado']     = $eRealtor['nombre'];
    $lead['e_realtor_id']           = $eRealtor['id'];
    $lead['e_realtor_telefono']     = $eRealtor['telefono'];
    $lead['e_realtor_email']        = $eRealtor['email'];
    $lead['e_realtor_especialidad'] = $eRealtor['especialidad'];
    $lead['e_realtor_avatar']       = $eRealtor['avatar'];

    if (!empty($lead['horario_visita_solicitada'])) {
        $lead['etapa_embudo'] = 'VISITA_AGENDADA';
    } elseif ($lead['cliente_nombre'] !== 'Por identificar' && $lead['email'] !== 'Pendiente') {
        $lead['etapa_embudo'] = 'ASIGNADO_E_REALTOR';
    } else {
        $lead['etapa_embudo'] = 'SOLICITUD';
    }

    // 2. Guardar JSON
    file_put_contents($LEADS_FILE, json_encode($leads, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

    // 3. Guardar CSV (Reescribir completo con UTF-8 BOM)
    $fp = fopen($LEADS_CSV, 'w');
    if ($fp) {
        fputs($fp, "\xEF\xBB\xBF"); // UTF-8 BOM
        fputcsv($fp, [
            'ID Prospecto', 'Prioridad', 'Score', 'e-Realtor Asignado', 'Nombre Cliente', 'Celular', 'Email',
            'Tipo Interes', 'Zona Interes', 'Presupuesto', 'Fecha Completa', 'Año', 'Mes', 'Día',
            'Día Semana', 'Hora', 'Estado Comercial', 'Etapa Embudo', 'Canal Origen', 'Campaña', 'Accion Sugerida', 'Resumen IA', 'Ultimo Mensaje'
        ]);
        foreach ($leads as $l) {
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

    writeLog("LEAD ACTUALIZADO: Celular: $phone | Prioridad: {$lead['prioridad']} | e-Realtor: {$lead['e_realtor_asignado']}");
}

// ==========================================================
// 1. VERIFICACIÓN DEL WEBHOOK (GET)
// ==========================================================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode      = $_GET['hub_mode']         ?? $_GET['hub.mode']         ?? '';
    $token     = $_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '';
    $challenge = $_GET['hub_challenge']    ?? $_GET['hub.challenge']    ?? '';

    writeLog("GET - mode=$mode | token=$token");

    if ($mode === 'subscribe' && $token === $VERIFY_TOKEN) {
        http_response_code(200);
        echo $challenge;
    } else {
        http_response_code(403);
        echo "Token de verificación inválido";
    }
    exit;
}

// ==========================================================
// 2. RECEPCIÓN DE MENSAJES (POST)
// ==========================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    
    // Responder HTTP 200 INMEDIATAMENTE a Meta para evitar reintentos automáticos
    http_response_code(200);
    echo "EVENT_RECEIVED";

    // Forzar el envío inmediato de los encabezados HTTP a Meta
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } elseif (function_exists('ob_end_flush')) {
        @ob_end_flush();
        @flush();
    }

    $body = json_decode($input, true);

    if (!isset($body['object']) || $body['object'] !== 'whatsapp_business_account') {
        exit;
    }

    foreach (($body['entry'] ?? []) as $entry) {
        foreach (($entry['changes'] ?? []) as $change) {
            $value    = $change['value'] ?? [];

            // REGLA 1: Ignorar eventos de estado/entrega/lectura (status webhooks del BOT)
            if (!empty($value['statuses'])) {
                continue;
            }

            $messages = $value['messages'] ?? [];
            if (empty($messages)) continue;

            $msg    = $messages[0];
            $msgId  = $msg['id'] ?? '';
            $sender = preg_replace('/\D/', '', $msg['from'] ?? '');
            $type   = $msg['type'] ?? '';

            // ╔══════════════════════════════════════════════════════════╗
            // ║ REGLA 2 CORREGIDA: ANTI-BUCLE por número real del negocio║
            // ║ display_phone_number = número real (ej: 15551234567)     ║
            // ║ PHONE_NUMBER_ID      = ID interno Meta (no es un número) ║
            // ╚══════════════════════════════════════════════════════════╝
            $displayPhone = preg_replace('/\D/', '', $value['metadata']['display_phone_number'] ?? '');
            if (!empty($sender) && !empty($displayPhone) && $sender === $displayPhone) {
                writeLog("ANTI-BUCLE: El bot se habría respondido a sí mismo. Sender=$sender === Negocio=$displayPhone. IGNORADO.");
                continue;
            }

            // REGLA 3: Ignorar tipos de mensajes no procesables
            $tiposIgnorados = ['system', 'reaction', 'ephemeral', 'unsupported', 'unknown'];
            if (in_array($type, $tiposIgnorados)) {
                writeLog("TIPO IGNORADO: $type de $sender");
                continue;
            }

            // ╔══════════════════════════════════════════════════════════╗
            // ║ REGLA 4: Anti-repetición ATÓMICA por message_id         ║
            // ║ fopen('x') es una operación ATÓMICA en Linux — garantiza ║
            // ║ que solo UN proceso PHP procese cada message_id.         ║
            // ╚══════════════════════════════════════════════════════════╝
            if (!empty($msgId)) {
                $lockDir  = __DIR__ . '/msg_locks';
                if (!is_dir($lockDir)) @mkdir($lockDir, 0755, true);
                $lockPath = $lockDir . '/msg_' . preg_replace('/[^a-zA-Z0-9_-]/', '', $msgId) . '.lock';
                $lockFp   = @fopen($lockPath, 'x'); // 'x' falla si el archivo ya existe (ATÓMICO)
                if ($lockFp === false) {
                    writeLog("DUPLICADO ATÓMICO: $msgId ya tiene lock → descartado.");
                    continue;
                }
                fwrite($lockFp, date('Y-m-d H:i:s'));
                fclose($lockFp);
                // Limpiar locks antiguos (más de 10 minutos)
                foreach (glob($lockDir . '/msg_*.lock') as $old) {
                    if (filemtime($old) < time() - 600) @unlink($old);
                }
            }

            $text     = '';
            $referral = $msg['referral'] ?? null;

            if ($type === 'text') {
                $text = $msg['text']['body'] ?? '';
            } elseif ($type === 'interactive') {
                $text = $msg['interactive']['button_reply']['title']
                     ?? $msg['interactive']['list_reply']['title']
                     ?? '';
            } elseif ($type === 'button') {
                $text = $msg['button']['text'] ?? '';
            } elseif (in_array($type, ['image', 'audio', 'video', 'document', 'sticker'])) {
                $text = 'hola';
            }

            $contacts = $value['contacts'] ?? [];
            $pushName = trim($contacts[0]['profile']['name'] ?? '');

            if (!empty($sender) && !empty(trim($text))) {
                writeLog("PROCESANDO [{$sender}] nombre='{$pushName}' tipo={$type}: " . substr($text, 0, 80));
                $reply = processConversation($sender, $text, $referral, $pushName);
                trackAndClassifyLeadPHP($sender, $text, $reply, $referral, $pushName);
                $result = sendWhatsAppMessage($sender, $reply, $WHATSAPP_TOKEN, $PHONE_NUMBER_ID);
                writeLog("Respuesta enviada a $sender: " . $result);
            }
        }
    }
    exit;
}

// ==========================================================
// 3. MOTOR INTELIGENTE DE CONVERSACIÓN
// ==========================================================
function normalizeStr($str) {
    $str = mb_strtolower(trim($str), 'UTF-8');
    $unwanted_array = [
        'á'=>'a', 'é'=>'e', 'í'=>'i', 'ó'=>'o', 'ú'=>'u',
        'Á'=>'a', 'É'=>'e', 'Í'=>'i', 'Ó'=>'o', 'Ú'=>'u',
        'ñ'=>'n', 'Ñ'=>'n'
    ];
    return strtr($str, $unwanted_array);
}

function getFirstName($fullName) {
    $parts = explode(' ', trim($fullName));
    return !empty($parts[0]) ? ucwords(mb_strtolower($parts[0], 'UTF-8')) : '';
}

function processConversation($sender, $userMsg, $referral = null, $pushName = '') {
    $rawMsg = trim($userMsg);
    $m = normalizeStr($rawMsg);
    $sessions = loadSessions();
    $session = $sessions[$sender] ?? [];

    // Determinar nombre del cliente
    $clientName = '';
    if (!empty($session['cliente_nombre']) && $session['cliente_nombre'] !== 'Por identificar') {
        $clientName = $session['cliente_nombre'];
    } elseif (!empty($pushName)) {
        $clientName = $pushName;
    }

    $refText = '';
    if ($referral) {
        $refText = normalizeStr(($referral['headline'] ?? '') . ' ' . ($referral['body'] ?? '') . ' ' . ($referral['source_url'] ?? '') . ' ' . ($referral['description'] ?? ''));
    }
    $searchCorpus = $m . ' ' . $refText;
    
    // A) DETECCIÓN PRIORITARIA 1: CAMPAÑA DEL TERRENO INDUSTRIAL EN PARQUE INDUSTRIAL (G77)
    $isParqueIndustrial = (
        strpos($searchCorpus, 'parque industrial') !== false ||
        strpos($searchCorpus, 'terreno industrial') !== false ||
        strpos($searchCorpus, 'g77') !== false ||
        strpos($searchCorpus, '16.800.000') !== false ||
        strpos($searchCorpus, '16800000') !== false ||
        strpos($searchCorpus, '60937050') !== false ||
        strpos($searchCorpus, '77930116') !== false ||
        strpos($searchCorpus, 'pi-46') !== false ||
        (strpos($searchCorpus, '7000') !== false && (strpos($searchCorpus, 'terren') !== false || strpos($searchCorpus, 'm2') !== false || strpos($searchCorpus, 'metro') !== false || strpos($searchCorpus, 'industrial') !== false)) ||
        (strpos($searchCorpus, '185') !== false && strpos($searchCorpus, '150') !== false) ||
        (isset($session['context']) && $session['context'] === 'parque_industrial' && !preg_match('/^(menu principal|ver todo el catalogo|menu|inicio|cancelar)$/i', $m))
    );

    if ($isParqueIndustrial) {
        $session['context'] = 'parque_industrial';
        $session['cliente_nombre'] = $clientName;
        $session['updated'] = time();
        $reply = getRespuestaParqueIndustrial($rawMsg, $sender, $clientName, $session);
        $sessions[$sender] = $session;
        saveSessions($sessions);
        return $reply;
    }

    // B) DETECCIÓN PRIORITARIA 2: CAMPAÑA LOTE CONDOMINIO MAR ADENTRO
    $isMarAdentro = (
        strpos($searchCorpus, 'mar adentro') !== false ||
        strpos($searchCorpus, '112500') !== false ||
        strpos($searchCorpus, '112.500') !== false ||
        strpos($searchCorpus, '79878853') !== false ||
        (strpos($searchCorpus, 'laguna') !== false && (strpos($searchCorpus, 'lote') !== false || strpos($searchCorpus, '300') !== false || strpos($searchCorpus, '450') !== false)) ||
        (strpos($searchCorpus, '450') !== false && (strpos($searchCorpus, 'lote') !== false || strpos($searchCorpus, 'condominio') !== false)) ||
        (isset($session['context']) && $session['context'] === 'mar_adentro' && !preg_match('/^(menu principal|ver todo el catalogo|menu|inicio|cancelar)$/i', $m))
    );

    if ($isMarAdentro) {
        $session['context'] = 'mar_adentro';
        $session['cliente_nombre'] = $clientName;
        $session['updated'] = time();
        $reply = getRespuestaMarAdentro($rawMsg, $sender, $clientName, $session);
        $sessions[$sender] = $session;
        saveSessions($sessions);
        return $reply;
    }

    // C) SALUDO GENÉRICO / REINICIO (Solo si no corresponde a una campaña publicitaria)
    $isGreeting = preg_match('/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|saludos|ola|menu|inicio|reiniciar|hi|hello)/i', $m);
    if ($isGreeting && !preg_match('/(@|visitar|agendar|\bopcion\b|\bla\s*[1-4]\b)/i', $m)) {
        $sessions[$sender] = ['step' => 'menu', 'context' => null, 'cliente_nombre' => $clientName, 'updated' => time()];
        saveSessions($sessions);
        return getMenuPrincipal($sender);
    }

    // C) CAPTURA DE DATOS OBLIGATORIA AL ELEGIR UNA OPCIÓN (1, 2, 3, 4, 5)
    if ($m === '1' || preg_match('/^comprar/i', $m)) {
        $sessions[$sender] = ['step' => 'esperando_datos', 'context' => 'comprar', 'opcion_texto' => '1️⃣ Comprar una Propiedad', 'cliente_nombre' => $clientName, 'updated' => time()];
        saveSessions($sessions);
        return "🏢 *Realty ONE Group Bolivia* 🏠✨\n" .
               "Has seleccionado: *1️⃣ Comprar una Propiedad (Casas, Terrenos, Departamentos)*\n\n" .
               "Para brindarte una atención personalizada y mostrarte las opciones exclusivas disponibles, por favor compártenos tus datos de contacto en un solo mensaje:\n\n" .
               "👤 1. *Nombre y Apellido completo:*\n" .
               "📱 2. *Número de Celular o Teléfono de contacto:*\n" .
               "✉️ 3. *Correo electrónico (E-mail):*\n\n" .
               "✍️ *Ejemplo:*\n" .
               "_" . (!empty($clientName) ? $clientName : "Marcos Antezana") . ", 77012345, marcos@gmail.com_";
    }

    if ($m === '2' || preg_match('/^alquilar/i', $m)) {
        $sessions[$sender] = ['step' => 'esperando_datos', 'context' => 'alquiler', 'opcion_texto' => '2️⃣ Alquilar un Inmueble', 'cliente_nombre' => $clientName, 'updated' => time()];
        saveSessions($sessions);
        return "🏢 *Realty ONE Group Bolivia* 🏢✨\n" .
               "Has seleccionado: *2️⃣ Alquilar un Inmueble*\n\n" .
               "Para mostrarte las opciones disponibles en alquiler y asignarte al asesor de tu zona, por favor compártenos tus datos en un solo mensaje:\n\n" .
               "👤 1. *Nombre y Apellido completo:*\n" .
               "📱 2. *Número de Celular o Teléfono de contacto:*\n" .
               "✉️ 3. *Correo electrónico (E-mail):*\n\n" .
               "✍️ *Ejemplo:*\n" .
               "_" . (!empty($clientName) ? $clientName : "Marcos Antezana") . ", 77012345, marcos@gmail.com_";
    }

    if ($m === '3' || strpos($m, 'anticret') !== false) {
        $sessions[$sender] = ['step' => 'esperando_datos', 'context' => 'anticretico', 'opcion_texto' => '3️⃣ Anticrético Seguro', 'cliente_nombre' => $clientName, 'updated' => time()];
        saveSessions($sessions);
        return "🏢 *Realty ONE Group Bolivia* 🔑✨\n" .
               "Has seleccionado: *3️⃣ Anticrético Seguro*\n\n" .
               "Para mostrarte los inmuebles con Folio Real saneado e información legal, por favor compártenos tus datos en un solo mensaje:\n\n" .
               "👤 1. *Nombre y Apellido completo:*\n" .
               "📱 2. *Número de Celular o Teléfono de contacto:*\n" .
               "✉️ 3. *Correo electrónico (E-mail):*\n\n" .
               "✍️ *Ejemplo:*\n" .
               "_" . (!empty($clientName) ? $clientName : "Marcos Antezana") . ", 77012345, marcos@gmail.com_";
    }

    if ($m === '4' || strpos($m, 'vender') !== false || strpos($m, 'consignar') !== false) {
        $sessions[$sender] = ['step' => 'esperando_datos', 'context' => 'vender', 'opcion_texto' => '4️⃣ Vender o Consignar mi Propiedad', 'cliente_nombre' => $clientName, 'updated' => time()];
        saveSessions($sessions);
        return "🏢 *Realty ONE Group Bolivia* 💼✨\n" .
               "Has seleccionado: *4️⃣ Vender o Consignar mi Propiedad*\n\n" .
               "Para que nuestro equipo de captaciones realice un avalúo comercial sin costo de tu inmueble, por favor compártenos tus datos:\n\n" .
               "👤 1. *Nombre y Apellido completo:*\n" .
               "📱 2. *Número de Celular o Teléfono de contacto:*\n" .
               "✉️ 3. *Correo electrónico (E-mail):*\n\n" .
               "✍️ *Ejemplo:*\n" .
               "_" . (!empty($clientName) ? $clientName : "Marcos Antezana") . ", 77012345, marcos@gmail.com_";
    }

    if ($m === '5' || strpos($m, 'legal') !== false || strpos($m, 'requisito') !== false || strpos($m, 'impuesto') !== false) {
        $sessions[$sender] = ['step' => 'esperando_datos', 'context' => 'legal', 'opcion_texto' => '5️⃣ Consultas Legales', 'cliente_nombre' => $clientName, 'updated' => time()];
        saveSessions($sessions);
        return "🏢 *Realty ONE Group Bolivia* ⚖️✨\n" .
               "Has seleccionado: *5️⃣ Consultas Legales (Impuestos, DDRR, Requisitos)*\n\n" .
               "Para conectarte con nuestro departamento legal inmobiliario, por favor compártenos tus datos:\n\n" .
               "👤 1. *Nombre y Apellido completo:*\n" .
               "📱 2. *Número de Celular o Teléfono de contacto:*\n" .
               "✉️ 3. *Correo electrónico (E-mail):*\n\n" .
               "✍️ *Ejemplo:*\n" .
               "_" . (!empty($clientName) ? $clientName : "Marcos Antezana") . ", 77012345, marcos@gmail.com_";
    }

    // D) CONSULTAS DIRECTAS DE TERRENOS
    if (strpos($m, 'terren') !== false || strpos($m, 'lote') !== false) {
        $sessions[$sender] = ['step' => 'esperando_datos', 'context' => 'terrenos', 'opcion_texto' => 'Terrenos y Lotes', 'cliente_nombre' => $clientName, 'updated' => time()];
        saveSessions($sessions);
        return "🏢 *Realty ONE Group Bolivia* 🌳✨\n" .
               "Has seleccionado: *Terrenos y Lotes en Santa Cruz*\n\n" .
               "Para enviarte el catálogo de terrenos urbanos e industriales, por favor compártenos tus datos:\n\n" .
               "👤 1. *Nombre y Apellido completo:*\n" .
               "📱 2. *Número de Celular o Teléfono de contacto:*\n" .
               "✉️ 3. *Correo electrónico (E-mail):*\n\n" .
               "✍️ *Ejemplo:*\n" .
               "_" . (!empty($clientName) ? $clientName : "Marcos Antezana") . ", 77012345, marcos@gmail.com_";
    }

    // E) RESPUESTA AL ENVIAR DATOS DE CONTACTO (Guarda en CRM y Envía el Catálogo)
    if (
        (isset($session['step']) && $session['step'] === 'esperando_datos') ||
        (count(explode(',', $rawMsg)) >= 2 && !preg_match('/^(1|2|3|4|5|menu)$/', $m)) ||
        preg_match('/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/i', $rawMsg)
    ) {
        $nombre = 'Estimado/a cliente';
        $parts = array_map('trim', explode(',', $rawMsg));
        if (count($parts) >= 1 && preg_match('/^[A-ZÁÉÍÓÚÑa-záéíóúñ\s]{3,40}$/u', $parts[0])) {
            $nombre = ucwords(strtolower($parts[0]));
        } elseif (!empty($clientName)) {
            $nombre = $clientName;
        }

        $contexto = $session['opcion_texto'] ?? 'nuestro Catálogo Inmobiliario';
        $sessions[$sender] = ['step' => 'datos_recibidos', 'nombre' => $nombre, 'cliente_nombre' => $nombre, 'updated' => time()];
        saveSessions($sessions);

        return "🦁 *¡Muchas gracias, {$nombre}!* ✨\n\n" .
               "Hemos registrado tus datos con éxito en *Realty ONE Group Bolivia*.\n" .
               "Te hemos asignado a un *e-Realtor especialista* para atender tu solicitud de: *{$contexto}*.\n\n" .
               "🌐 *Catálogo Oficial en Vivo (con fotos, precios y recorridos):*\n" .
               "https://realyonegroupbolivia.e-techgroupbolivia.com/buscar.html\n\n" .
               "📱 *En breve nuestro asesor se comunicará contigo vía WhatsApp o llamada para coordinar.*";
    }

    // F) RESPUESTA POR DEFECTO
    return getMenuPrincipal($sender);
}

// ==========================================================
// 4. RESPUESTAS ESPECÍFICAS DE CAMPAÑA: PARQUE INDUSTRIAL
// ==========================================================
function getRespuestaParqueIndustrial($userMsg, $sender = '', $clientName = '', &$session = []) {
    $cleanMsg = explode('|', $userMsg)[0];
    $m = normalizeStr($cleanMsg);
    $firstName = getFirstName($clientName);
    $saludoNom = !empty($firstName) ? " {$firstName}" : "";
    $dirNom = !empty($firstName) ? "{$firstName}, " : "";

    $hasCapturedData = !empty($session['datos_capturados']) || (!empty($session['email']) && $session['email'] !== 'Pendiente');

    // Verificar si el mensaje actual contiene datos de contacto
    $hasEmail = preg_match('/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/i', $cleanMsg);
    $hasCommaData = count(explode(',', $cleanMsg)) >= 2;
    if ($hasEmail || $hasCommaData) {
        $session['datos_capturados'] = true;
        $hasCapturedData = true;
    }

    $isAdClick = (
        strpos($cleanMsg, 'fb.me') !== false ||
        strpos($cleanMsg, '7.000') !== false ||
        strpos($cleanMsg, 'Parque Industrial') !== false ||
        strpos($cleanMsg, 'G77') !== false ||
        strpos($cleanMsg, 'Quiero más información') !== false ||
        strpos($cleanMsg, 'quiero mas informacion') !== false ||
        strpos($cleanMsg, 'vi la publicidad') !== false
    );

    if ($isAdClick) {
        unset($session['visita_confirmada_g77']);
        unset($session['esperando_horario_g77']);
        unset($session['ficha_entregada_g77']);
    }

    $isInitial = (
        empty($m) ||
        strlen($m) < 3 ||
        $isAdClick ||
        preg_match('/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|ola|hi|hello)/i', $m) ||
        strpos($m, 'mas informacion') !== false ||
        strpos($m, 'mas info') !== false ||
        strpos($m, 'quiero informacion') !== false ||
        strpos($m, 'quiero mas informacion') !== false ||
        strpos($m, 'informacion') !== false ||
        strpos($m, 'interesado') !== false ||
        strpos($m, 'me interesa') !== false ||
        strpos($m, 'vi la publicidad') !== false ||
        strpos($m, 'vi el anuncio') !== false ||
        strpos($m, 'sobre la publicacion') !== false
    );

    // 0. SI LA CITA YA FUE CONFIRMADA Y EL USUARIO SE DESPIDE
    $isGoodbye = (
        strpos($m, 'gracias') !== false || strpos($m, 'muchas gracias') !== false ||
        strpos($m, 'chau') !== false || strpos($m, 'hasta luego') !== false ||
        strpos($m, 'nos vemos') !== false || strpos($m, 'adios') !== false
    );
    if (!empty($session['visita_confirmada_g77']) && $isGoodbye && !$isInitial) {
        return "¡A ti{$saludoNom}! ✨ Quedamos a su completa disposición para la inspección técnica. ¡Que tenga un excelente día! ✨";
    }

    // 0b. SI EL USUARIO ENVÍA EL DÍA Y HORA DE LA VISITA (Ej: "martes, a las 11:00")
    $isDateTime = (
        strpos($m, 'lunes') !== false || strpos($m, 'martes') !== false || strpos($m, 'miercoles') !== false ||
        strpos($m, 'jueves') !== false || strpos($m, 'viernes') !== false || strpos($m, 'sabado') !== false ||
        strpos($m, 'domingo') !== false || strpos($m, 'manana') !== false || strpos($m, 'hoy') !== false ||
        strpos($m, 'fin de semana') !== false || strpos($m, 'a las') !== false ||
        preg_match('/\b\d{1,2}:\d{2}\b/', $m) || preg_match('/\b\d{1,2}\s*(am|pm|hrs|de la)\b/i', $m) ||
        !empty($session['esperando_horario_g77'])
    );

    if ($isDateTime && !$isInitial && strpos($m, 'precio') === false && strpos($m, 'medida') === false && strpos($m, 'ubicacion') === false) {
        $session['esperando_horario_g77'] = false;
        $session['visita_confirmada_g77'] = true;
        $session['horario_visita'] = $cleanMsg;
        return "📅 *¡Perfecto{$saludoNom}! Cita agendada con éxito.* ✨\n\n" .
               "Le esperamos el *{$cleanMsg}* en el *Terreno Industrial de 7.000 m² (Salida G77)*.\n\n" .
               "El asesor *Robert Oliva* (+591 60937050) le enviará la ubicación exacta por GPS y le esperará puntualmente en la propiedad.\n\n" .
               "¡Muchas gracias y que tenga un excelente día! 🤝";
    }

    // PASO 1: Si es primer contacto y no tenemos sus datos, pedir Nombre, Celular y Correo
    if ($isInitial && !$hasCapturedData) {
        $session['step'] = 'esperando_datos_g77';
        return "¡Hola{$saludoNom}! 👋 Gracias por comunicarte con *Realty ONE Group Bolivia* ✨\n\n" .
               "Nos alegra tu interés en el *Terreno Industrial de 7.000 m² en Parque Industrial (Salida G77)*.\n\n" .
               "Para brindarte la ficha técnica completa, plano aprobado y asignarte atención prioritaria con nuestro asesor industrial, por favor compártenos tus datos en un solo mensaje:\n\n" .
               "1. 👤 *Nombre y Apellido:* \n" .
               "2. 📱 *Número de Celular o WhatsApp:* \n" .
               "3. ✉️ *Correo Electrónico (E-mail):* \n\n" .
               "✍️ _Ejemplo: " . (!empty($firstName) ? $firstName : "Carlos") . " Mendoza, 60937050, carlos@empresa.com_";
    }

    // PASO 2: Si ya tenemos sus datos o acaba de enviarlos, entregar la ficha
    if ((($hasEmail || $hasCommaData) && !isset($session['ficha_entregada_g77'])) || ($isInitial && $hasCapturedData)) {
        $session['ficha_entregada_g77'] = true;
        return "¡Muchas gracias{$saludoNom}! ✨ Aquí tienes la información oficial del *Terreno Industrial de 7.000 m² (Salida G77)*:\n\n" .
               "📍 *Ubicación:* Parque Industrial, 1ra Transversal Norte S/N, Mza. PI-46 (Salida directa a Av. G77)\n" .
               "📐 *Superficie:* *7.000 m²* (185 metros de frente × 150 metros de fondo)\n" .
               "💰 *Precio de Venta:* *Bs 16.800.000*\n" .
               "⚡ *Servicios:* Factibilidad inmediata de Energía Trifásica y Agua Industrial continua\n" .
               "🏗️ *Uso de Suelo:* Industrial y Comercial de alto impacto (apto para galpones, fábricas, logística y CEDIS)\n" .
               "📑 *Estado Legal:* Documentación 100% regularizada con Folio Real vigente en DDRR, listo para transferencia inmediata a empresas (SRL, SA)\n\n" .
               "👤 *Asesor a Cargo:* Robert Oliva (+591 60937050)\n" .
               "🏢 *Oficina:* Equipetrol Norte, Santa Cruz de la Sierra\n\n" .
               "👉 *{$dirNom}¿deseas conocer las facilidades de pago o coordinamos una visita técnica al terreno?*";
    }

    // 1. Dimensiones, frente, fondo, m2
    if (!$isInitial && (strpos($m, 'medida') !== false || strpos($m, 'dimension') !== false || strpos($m, 'cuanto mide') !== false || strpos($m, 'superficie') !== false || strpos($m, 'tamano') !== false || strpos($m, 'frente') !== false || strpos($m, 'fondo') !== false || strpos($m, 'm2') !== false || strpos($m, 'hectarea') !== false)) {
        return "📐 *Dimensiones y Superficie del Terreno Industrial:*\n\n" .
               "Hola{$saludoNom}, el terreno cuenta con:\n" .
               "• *Superficie Total:* *7.000 m²*\n" .
               "• *Frente (Norte):* *185 metros* sobre vía pavimentada de alto tonelaje\n" .
               "• *Fondo (Este/Oeste):* *150 metros*\n" .
               "• *Topografía:* Terreno plano, nivelado y listo para edificación industrial o logística.\n" .
               "• *Colindancias:* Norte: 1ra Transversal Norte | Sur: Parque Industrial.\n\n" .
               "👉 {$dirNom}¿requiere este metraje para almacenamiento, silos, centro de distribución o planta de producción?";
    }

    // 2. Precio y formas de pago
    if (!$isInitial && (strpos($m, 'precio') !== false || strpos($m, 'cuanto cuesta') !== false || strpos($m, 'cuanto piden') !== false || strpos($m, 'valor') !== false || strpos($m, 'costo') !== false || strpos($m, 'bs') !== false || strpos($m, 'boliviano') !== false || strpos($m, 'pago') !== false || strpos($m, 'credito') !== false || strpos($m, 'financiamiento') !== false)) {
        return "💰 *Inversión y Condiciones Financieras:*\n\n" .
               "Hola{$saludoNom}, el precio de venta es de *Bs 16.800.000* (Dieciséis Millones Ochocientos Mil Bolivianos).\n\n" .
               "• *Superficie:* 7.000 m² (Bs 2.400 / m² en zona industrial consolidada)\n\n" .
               "• *Modalidades de Pago Aceptadas:*\n" .
               "  ✅ Pago al contado vía transferencia bancaria.\n" .
               "  ✅ Financiamiento bancario empresarial / Carta de crédito.\n" .
               "  ✅ Evaluación de cartas de intención de compra (LOI) y propuestas formales.\n\n" .
               "👉 {$dirNom}¿desea que le facilitemos la proforma comercial o coordinamos una reunión con el asesor *Robert Oliva* (+591 60937050)?";
    }

    // 3. Ubicación y acceso a G77
    if (!$isInitial && (strpos($m, 'ubicacion') !== false || strpos($m, 'donde queda') !== false || strpos($m, 'donde esta') !== false || strpos($m, 'direccion') !== false || strpos($m, 'acceso') !== false || strpos($m, 'g77') !== false || strpos($m, 'mapa') !== false || strpos($m, 'llegar') !== false || strpos($m, 'gps') !== false)) {
        return "📍 *Ubicación y Accesibilidad Estratégica:*\n\n" .
               "Hola{$saludoNom}, la ubicación del predio es inmejorable:\n" .
               "🏢 *Dirección:* Parque Industrial, 1ra Transversal Norte S/N, Mza. PI-46, Santa Cruz de la Sierra.\n" .
               "🛣️ *Acceso Principal:* Salida directa a la *Av. G77* (vía pavimentada de alto flujo).\n" .
               "🚚 *Transporte Pesado:* Vía apta para camiones de alto tonelaje, trailers y maquinaria pesada.\n\n" .
               "🔗 *Google Maps:* https://maps.google.com/?q=Parque+Industrial+Av+G77+Santa+Cruz+de+la+Sierra+Bolivia\n\n" .
               "👉 {$dirNom}¿desea coordinar una visita técnica para conocer el terreno en persona?";
    }

    // 4. Servicios básicos (Trifásica, Agua Industrial)
    if (!$isInitial && (strpos($m, 'servicio') !== false || strpos($m, 'luz') !== false || strpos($m, 'trifasica') !== false || strpos($m, 'agua') !== false || strpos($m, 'energia') !== false || strpos($m, 'electricidad') !== false)) {
        return "⚡ *Servicios e Infraestructura Técnica:*\n\n" .
               "Hola{$saludoNom}, el terreno cuenta con:\n" .
               "✅ *Energía Eléctrica:* Factibilidad inmediata de *Energía Trifásica* de alta potencia.\n" .
               "✅ *Agua:* Red de agua industrial para procesos productivos continuos.\n" .
               "✅ *Vías:* Pavimento de alto tonelaje para transporte pesado.\n" .
               "✅ *Telecomunicaciones:* Factibilidad de fibra óptica empresarial.\n\n" .
               "👉 {$dirNom}¿requiere alguna capacidad eléctrica específica para su maquinaria o nave industrial?";
    }

    // 5. Documentación y Folio Real
    if (!$isInitial && (strpos($m, 'papel') !== false || strpos($m, 'document') !== false || strpos($m, 'folio real') !== false || strpos($m, 'alodial') !== false || strpos($m, 'legal') !== false || strpos($m, 'empresa') !== false || strpos($m, 'ddrr') !== false)) {
        return "📑 *Situación Legal y Documentación Verificada:*\n\n" .
               "Hola{$saludoNom}, el estado legal está 100% garantizado:\n" .
               "✅ *Folio Real:* Vigente, 100% saneado e inscrito en Derechos Reales (DDRR).\n" .
               "✅ *Gravámenes:* Inmueble libre de hipotecas, anotaciones preventivas o litigios.\n" .
               "✅ *Impuestos:* Al día en el Municipio de Santa Cruz.\n" .
               "✅ *Transferencia:* Listo para protocolización notarial inmediata a nombre de **Empresas (SRL, SA)** o personas particulares.\n\n" .
               "👉 {$dirNom}¿desea que su equipo legal revise copias del Folio Real y planos aprobados?";
    }

    // 6. Coordinación de Visita Técnica, Agendar, Respuestas afirmativas
    if (!$isInitial && (
        strpos($m, 'gustaria') !== false ||
        strpos($m, 'visita') !== false ||
        strpos($m, 'agendar') !== false ||
        strpos($m, 'coordinar') !== false ||
        strpos($m, 'quiero ir') !== false ||
        strpos($m, 'conocer') !== false ||
        strpos($m, 'cita') !== false ||
        strpos($m, 'reunion') !== false ||
        strpos($m, 'ir a ver') !== false ||
        strpos($m, 'cuando puedo') !== false ||
        strpos($m, 'horario') !== false ||
        strpos($m, 'si por favor') !== false ||
        strpos($m, 'si, por favor') !== false ||
        $m === 'si' || $m === 'si!'
    )) {
        return "¡Con mucho gusto{$saludoNom}! 🦁✨\n\n" .
               "Le esperamos para realizar la inspección técnica del *Terreno Industrial de 7.000 m² (Salida G77)*.\n\n" .
               "¿Qué día y hora le queda más conveniente? (Por ejemplo: *mañana a las 15:30* o *sábado por la mañana*).\n\n" .
               "El asesor *Robert Oliva* (+591 60937050) le esperará en la propiedad y le compartirá la ubicación exacta por GPS.";
    }

    // 7. Asesor a cargo y Oficina
    if (!$isInitial && (strpos($m, 'asesor') !== false || strpos($m, 'oficina') !== false || strpos($m, 'robert') !== false || strpos($m, 'itaguazu') !== false || strpos($m, 'contacto') !== false || strpos($m, 'telefono') !== false)) {
        return "🏢 *Realty ONE Group Bolivia*\n\n" .
               "Hola{$saludoNom}, nuestros datos de atención son:\n" .
               "📍 *Oficina:* Equipetrol Norte, Santa Cruz de la Sierra.\n" .
               "👤 *Asesor a Cargo:* Robert Oliva\n" .
               "📞 *Teléfono / WhatsApp:* +591 60937050\n" .
               "✉️ *Email:* info@realtyonegroup.com.bo\n" .
               "🌐 *Web:* realtyonegroup.com.bo\n\n" .
               "👉 {$dirNom}¿desea agendar una llamada directa o coordinamos por aquí?";
    }

    // 8. Ficha completa
    return "¡Hola{$saludoNom}! Gracias por comunicarte con *Realty ONE Group Bolivia* 🦁✨\n\n" .
           "Detalles del *Terreno Industrial de 7.000 m² en Parque Industrial (Salida G77)*:\n\n" .
           "📍 *Ubicación:* Parque Industrial, 1ra Transversal Norte S/N, Mza. PI-46 (Salida directa a Av. G77)\n" .
           "📐 *Superficie:* *7.000 m²* (185 m de frente × 150 m de fondo)\n" .
           "💰 *Precio de Venta:* *Bs 16.800.000*\n" .
           "⚡ *Servicios:* Factibilidad inmediata de Energía Trifásica y Agua Industrial\n" .
           "🏗️ *Uso de Suelo:* Industrial y Comercial (alto impacto, galpones, fábricas, CEDIS)\n" .
           "📑 *Estado Legal:* Documentación 100% regularizada con Folio Real vigente\n\n" .
           "👤 *Asesor a cargo:* Robert Oliva (+591 60937050)\n" .
           "🏢 *Oficina:* Equipetrol Norte, Santa Cruz de la Sierra\n\n" .
           "👉 *{$dirNom}¿desea conocer el precio, las dimensiones exactas o coordinar una visita técnica al terreno?*";
}

// ==========================================================
// 5. RESPUESTAS ESPECÍFICAS DE CAMPAÑA: LOTE MAR ADENTRO
// ==========================================================
function getRespuestaMarAdentro($userMsg, $sender = '', $clientName = '', &$session = []) {
    $cleanMsg = explode('|', $userMsg)[0];
    $m = normalizeStr($cleanMsg);
    $firstName = getFirstName($clientName);
    $saludoNom = !empty($firstName) ? " {$firstName}" : "";
    $dirNom = !empty($firstName) ? "{$firstName}, " : "";

    $hasCapturedData = !empty($session['datos_capturados']) || (!empty($session['email']) && $session['email'] !== 'Pendiente');

    // Verificar si el mensaje actual contiene datos de contacto
    $hasEmail = preg_match('/[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/i', $cleanMsg);
    $hasCommaData = count(explode(',', $cleanMsg)) >= 2;
    if ($hasEmail || $hasCommaData) {
        $session['datos_capturados'] = true;
        $hasCapturedData = true;
    }

    $isAdClick = (
        strpos($cleanMsg, 'fb.me') !== false ||
        strpos($cleanMsg, 'MAR ADENTRO') !== false ||
        strpos($cleanMsg, 'Mar Adentro') !== false ||
        strpos($cleanMsg, 'mar adentro') !== false ||
        strpos($cleanMsg, 'OPORTUNIDAD ÚNICA') !== false ||
        strpos($cleanMsg, 'OPORTUNIDAD UNICA') !== false ||
        strpos($cleanMsg, 'Quiero más información') !== false ||
        strpos($cleanMsg, 'quiero mas informacion') !== false ||
        strpos($cleanMsg, 'vi la publicidad') !== false
    );

    if ($isAdClick) {
        unset($session['visita_confirmada_mar_adentro']);
        unset($session['esperando_horario_mar_adentro']);
        unset($session['ficha_entregada_mar_adentro']);
    }

    $isInitial = (
        empty($m) ||
        strlen($m) < 3 ||
        $isAdClick ||
        preg_match('/^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|ola|hi|hello)/i', $m) ||
        strpos($m, 'mas informacion') !== false ||
        strpos($m, 'mas info') !== false ||
        strpos($m, 'quiero informacion') !== false ||
        strpos($m, 'quiero mas informacion') !== false ||
        strpos($m, 'informacion') !== false ||
        strpos($m, 'interesado') !== false ||
        strpos($m, 'me interesa') !== false ||
        strpos($m, 'vi la publicidad') !== false ||
        strpos($m, 'vi el anuncio') !== false ||
        strpos($m, 'sobre la publicacion') !== false
    );

    // 0. SI LA CITA YA FUE CONFIRMADA Y EL USUARIO SE DESPIDE
    $isGoodbye = (
        strpos($m, 'gracias') !== false || strpos($m, 'muchas gracias') !== false ||
        strpos($m, 'chau') !== false || strpos($m, 'hasta luego') !== false ||
        strpos($m, 'nos vemos') !== false || strpos($m, 'adios') !== false
    );
    if (!empty($session['visita_confirmada_mar_adentro']) && $isGoodbye && !$isInitial) {
        return "¡A ti{$saludoNom}! ✨ Quedamos a tu completa disposición para la visita. ¡Que tengas un excelente día! ✨";
    }

    // 0b. SI EL USUARIO ENVÍA EL DÍA Y HORA DE LA VISITA (Ej: "martes, a las 11:00")
    $isDateTime = (
        strpos($m, 'lunes') !== false || strpos($m, 'martes') !== false || strpos($m, 'miercoles') !== false ||
        strpos($m, 'jueves') !== false || strpos($m, 'viernes') !== false || strpos($m, 'sabado') !== false ||
        strpos($m, 'domingo') !== false || strpos($m, 'manana') !== false || strpos($m, 'hoy') !== false ||
        strpos($m, 'fin de semana') !== false || strpos($m, 'a las') !== false ||
        preg_match('/\b\d{1,2}:\d{2}\b/', $m) || preg_match('/\b\d{1,2}\s*(am|pm|hrs|de la)\b/i', $m) ||
        !empty($session['esperando_horario_mar_adentro'])
    );

    if ($isDateTime && !$isInitial && strpos($m, 'precio') === false && strpos($m, 'medida') === false && strpos($m, 'ubicacion') === false) {
        $session['esperando_horario_mar_adentro'] = false;
        $session['visita_confirmada_mar_adentro'] = true;
        $session['horario_visita'] = $cleanMsg;
        return "📅 *¡Perfecto{$saludoNom}! Cita agendada con éxito.* ✨\n\n" .
               "Te esperamos el *{$cleanMsg}* en el *Lote de 450 m² en Condominio Mar Adentro*.\n\n" .
               "El asesor de Realty ONE Itaguazú (+591 60937050) te enviará la ubicación exacta por GPS y te registrará el ingreso autorizado en portería.\n\n" .
               "¡Muchas gracias y que tengas un excelente día! 🤝";
    }

    // PASO 1: Si es primer contacto y no tenemos sus datos, pedir Nombre, Celular y Correo
    if ($isInitial && !$hasCapturedData) {
        $session['step'] = 'esperando_datos_mar_adentro';
        return "¡Hola{$saludoNom}! 👋 Gracias por comunicarte con *Realty ONE Group Itaguazú* 🌊✨\n\n" .
               "Nos alegra mucho tu interés en el *Lote de 450 m² en Condominio Mar Adentro* (a solo 300 m de la Laguna Cristalina navegable).\n\n" .
               "Para brindarte la ficha técnica detallada, planos y asignarte atención personalizada con nuestro asesor especialista, por favor compártenos tus datos en un solo mensaje:\n\n" .
               "1. 👤 *Nombre y Apellido:* \n" .
               "2. 📱 *Número de Celular o WhatsApp:* \n" .
               "3. ✉️ *Correo Electrónico:* \n\n" .
               "✍️ _Ejemplo: " . (!empty($firstName) ? $firstName : "Luis") . " Pérez, 60937050, correo@gmail.com_";
    }

    // PASO 2: Si ya tenemos sus datos o acaba de enviarlos, entregar la ficha completa
    if ((($hasEmail || $hasCommaData) && !isset($session['ficha_entregada_mar_adentro'])) || ($isInitial && $hasCapturedData)) {
        $session['ficha_entregada_mar_adentro'] = true;
        return "¡Muchas gracias{$saludoNom}! ✨ Aquí tienes la información completa del *Lote de 450 m² en Condominio Mar Adentro*:\n\n" .
               "📍 *Ubicación:* Condominio Mar Adentro, Urubó (a solo 300 metros caminando de la laguna cristalina navegable)\n" .
               "📐 *Superficie:* *450 m²* (15 metros de frente × 30 metros de fondo - terreno plano y regular)\n" .
               "💰 *Precio de Venta:* *Bs 782.000* ($112,500 USD)\n" .
               "⚡ *Servicios:* Agua potable, energía eléctrica subterránea, alcantarillado, gas domiciliario y fibra óptica\n" .
               "🏖️ *Amenidades:* Laguna cristalina navegable estilo Crystal Lagoons con playa de arena blanca, Club House de lujo, canchas de tenis y fútbol, gimnasio, parques infantiles y seguridad privada 24/7\n" .
               "📑 *Estado Legal:* Documentación 100% al día con Folio Real individualizado libre de gravamen, listo para transferencia inmediata en Notaría\n\n" .
               "👤 *Asesor Asignado:* Asesor Realty ONE Itaguazú (+591 60937050)\n\n" .
               "👉 *{$dirNom}¿te gustaría coordinar una visita presencial para conocer el lote y la laguna este fin de semana o consultar formas de pago?*";

    // 1. Dimensiones y medidas
    if (!$isInitial && (strpos($m, 'medida') !== false || strpos($m, 'dimension') !== false || strpos($m, 'cuanto mide') !== false || strpos($m, 'superficie') !== false || strpos($m, 'tamano') !== false || strpos($m, 'area') !== false || strpos($m, 'frente') !== false || strpos($m, 'fondo') !== false || strpos($m, 'm2') !== false)) {
        return "📐 *Dimensiones y Superficie del Lote:*\n\n" .
               "Hola{$saludoNom}, el lote en Condominio Mar Adentro cuenta con:\n" .
               "• *Superficie Total:* *450 m²*\n" .
               "• *Dimensiones:* *15 metros de frente × 30 metros de fondo*\n" .
               "• *Topografía:* Terreno regular, totalmente plano y listo para edificar.\n" .
               "📍 *Ubicación en el Condominio:* A solo *300 metros* de la laguna cristalina navegable.\n\n" .
               "👉 {$dirNom}¿deseas construir una casa vacacional de fin de semana o tu residencia familiar permanente?";
    }

    // 2. Precio y formas de pago
    if (!$isInitial && (strpos($m, 'precio') !== false || strpos($m, 'cuanto cuesta') !== false || strpos($m, 'cuanto piden') !== false || strpos($m, 'valor') !== false || strpos($m, 'costo') !== false || strpos($m, 'bs') !== false || strpos($m, 'boliviano') !== false || strpos($m, 'pago') !== false || strpos($m, 'credito') !== false || strpos($m, 'financiamiento') !== false)) {
        return "💰 *Precio y Modalidades de Pago:*\n\n" .
               "Hola{$saludoNom}, el precio de venta es de *Bs 782.000*.\n\n" .
               "• *Superficie:* 450 m² (a 300 metros de la laguna)\n\n" .
               "• *Modalidades Aceptadas:*\n" .
               "  ✅ Pago al contado vía transferencia bancaria.\n" .
               "  ✅ Apto para Crédito Bancario / Financiamiento de Vivienda.\n" .
               "  ✅ Se pueden evaluar propuestas serias.\n\n" .
               "👉 {$dirNom}¿deseas coordinar para conocer las opciones de financiamiento o agendamos una visita al condominio?";
    }

    // 3. Envío directo de Google Maps y Ubicación
    if (!$isInitial && (strpos($m, 'ubicacion') !== false || strpos($m, 'donde queda') !== false || strpos($m, 'donde esta') !== false || strpos($m, 'direccion') !== false || strpos($m, 'acceso') !== false || strpos($m, 'mapa') !== false || strpos($m, 'gps') !== false || strpos($m, 'llegar') !== false || strpos($m, 'maps') !== false || strpos($m, 'google maps') !== false || strpos($m, 'link') !== false)) {
        return "📍 *Ubicación Exacta y Accesibilidad:*\n\n" .
               "Hola{$saludoNom}, el *Condominio Mar Adentro* se encuentra en el Urubó, Santa Cruz de la Sierra:\n" .
               "🏄‍♂️ *Distancia a la Laguna:* A solo *300 metros caminando* del espejo de agua cristalina.\n" .
               "🛣️ *Accesos:* Carretera totalmente pavimentada con doble vía, pórtico de ingreso controlado y seguridad privada 24/7.\n\n" .
               "🔗 *Toca aquí para ver en Google Maps:*\n" .
               "https://maps.google.com/?q=Condominio+Mar+Adentro+Urubo+Santa+Cruz+Bolivia\n\n" .
               "👉 {$dirNom}¿te gustaría coordinar una visita presencial para conocer el lote y la laguna este fin de semana?";
    }

    // 4. Laguna y Amenidades
    if (!$isInitial && (strpos($m, 'laguna') !== false || strpos($m, 'amenidad') !== false || strpos($m, 'playa') !== false || strpos($m, 'club') !== false || strpos($m, 'piscina') !== false || strpos($m, 'cancha') !== false || strpos($m, 'deporte') !== false)) {
        return "🏖️ *Amenidades Exclusivas en Condominio Mar Adentro:*\n\n" .
               "Hola{$saludoNom}, el condominio ofrece estilo de vida resort:\n" .
               "🌊 *Laguna Cristalina:* Espectacular laguna navegable estilo Crystal Lagoons con aguas turquesas.\n" .
               "🏖️ *Playas de Arena Blanca:* Áreas de descanso, sombrillas y solárium.\n" .
               "🏄‍♂️ *Deportes Acuáticos:* Kayak, paddle surf, natación y actividades náuticas sin motor.\n" .
               "🏰 *Club House de Lujo:* Restaurante, bar, salas de eventos y áreas de recreación.\n" .
               "⚽ *Deportes:* Canchas de tenis, fútbol, básquetbol y gimnasio equipado.\n" .
               "👮‍♂️ *Seguridad:* Control de acceso estricto, cámaras de vigilancia y patrullaje 24/7.\n\n" .
               "👉 {$dirNom}¿te gustaría coordinar un pase de visita para conocer el condominio y la laguna este fin de semana?";
    }

    // 5. Servicios Básicos
    if (!$isInitial && (strpos($m, 'servicio') !== false || strpos($m, 'luz') !== false || strpos($m, 'agua') !== false || strpos($m, 'gas') !== false || strpos($m, 'internet') !== false || strpos($m, 'fibra') !== false || strpos($m, 'alcantarillado') !== false)) {
        return "⚡ *Servicios e Infraestructura Disponible:*\n\n" .
               "Hola{$saludoNom}, el lote cuenta con todos los servicios listos para conexión:\n" .
               "✅ *Agua potable:* Red centralizada de alta calidad.\n" .
               "✅ *Energía eléctrica:* Red subterránea moderna.\n" .
               "✅ *Alcantarillado:* Red sanitaria completa.\n" .
               "✅ *Gas domiciliario y Fibra óptica:* Disponibles para instalación inmediata.\n\n" .
               "👉 {$dirNom}¿tienes alguna consulta adicional sobre la construcción?";
    }

    // 6. Documentación y Folio Real
    if (!$isInitial && (strpos($m, 'papel') !== false || strpos($m, 'document') !== false || strpos($m, 'folio real') !== false || strpos($m, 'alodial') !== false || strpos($m, 'legal') !== false || strpos($m, 'ddrr') !== false)) {
        return "📑 *Situación Legal y Documentación Verificada:*\n\n" .
               "Hola{$saludoNom}, la propiedad está 100% saneada y al día:\n" .
               "✅ *Folio Real:* Individualizado, vigente y saneado en Derechos Reales (DDRR).\n" .
               "✅ *Gravámenes:* Inmueble libre de hipotecas, anotaciones preventivas o litigios.\n" .
               "✅ *Impuestos:* Al día en el Municipio correspondiente.\n" .
               "✅ *Transferencia:* Listo para protocolización notarial inmediata a tu nombre.\n\n" .
               "👉 {$dirNom}si requieres copias del Folio Real para revisión bancaria o legal, te las facilitamos con gusto.";
    }

    // 7. Coordinar Visita Presencial, Agendar, Respuestas afirmativas
    if (!$isInitial && (
        strpos($m, 'gustaria') !== false ||
        strpos($m, 'visita') !== false ||
        strpos($m, 'agendar') !== false ||
        strpos($m, 'coordinar') !== false ||
        strpos($m, 'quiero ir') !== false ||
        strpos($m, 'conocer') !== false ||
        strpos($m, 'cita') !== false ||
        strpos($m, 'pase') !== false ||
        strpos($m, 'ir a ver') !== false ||
        strpos($m, 'fin de semana') !== false ||
        strpos($m, 'cuando puedo') !== false ||
        strpos($m, 'horario') !== false ||
        strpos($m, 'si por favor') !== false ||
        strpos($m, 'si, por favor') !== false ||
        $m === 'si' || $m === 'si!' ||
        strpos($m, 'claro') !== false ||
        strpos($m, 'dale') !== false
    )) {
        return "¡Con mucho gusto{$saludoNom}! 🌊✨\n\n" .
               "Te esperamos para conocer el *Lote de 450 m² en Condominio Mar Adentro* y la laguna cristalina.\n\n" .
               "¿Qué día y hora te queda mejor para pasar? (Por ejemplo: *este sábado a las 10:00 am* o *domingo por la tarde*).\n\n" .
               "El asesor de Realty ONE Itaguazú (+591 60937050) te registrará el pase de ingreso en portería y te esperará en el lugar.";
    }

    // 8. Asesor a cargo y Oficina
    if (!$isInitial && (strpos($m, 'asesor') !== false || strpos($m, 'oficina') !== false || strpos($m, 'contacto') !== false || strpos($m, 'telefono') !== false || strpos($m, 'itaguazu') !== false)) {
        return "🏢 *Realty ONE Group Itaguazú*\n\n" .
               "Hola{$saludoNom}, nuestros datos oficiales son:\n" .
               "📍 *Oficina:* Santa Cruz de la Sierra / Urubó.\n" .
               "👤 *Asesor a Cargo:* Asesor Especialista Realty ONE\n" .
               "📞 *Teléfono / WhatsApp:* +591 79878853\n" .
               "✉️ *Email:* info@realtyonegroup.com.bo\n\n" .
               "👉 {$dirNom}¿deseas que un asesor te contacte por llamada o coordinamos por aquí?";
    }

    // 9. Ficha completa
    return "¡Hola{$saludoNom}! 👋 Gracias por comunicarte con *Realty ONE Group Itaguazú* 🌊✨\n\n" .
           "Detalles del *Lote de 450 m² en Condominio Mar Adentro*:\n\n" .
           "📍 *Ubicación:* Condominio Mar Adentro (a solo 300 m de la laguna cristalina)\n" .
           "📐 *Superficie:* *450 m²* (15 m de frente × 30 m de fondo)\n" .
           "💰 *Precio de Venta:* *Bs 782.000*\n" .
           "🏄‍♂️ *Laguna & Playa:* Laguna cristalina Crystal Lagoons con playa de arena blanca y deportes acuáticos\n" .
           "🏰 *Amenidades:* Club House de lujo, canchas de tenis/fútbol, gimnasio, restaurante y seguridad 24/7\n" .
           "📑 *Documentación:* Documentación 100% al día con Folio Real individualizado libre de gravamen\n\n" .
           "👤 *Asesor a Cargo:* Asesor Realty ONE Itaguazú (Tel: +591 79878853)\n\n" .
           "👉 *{$dirNom}¿qué consulta adicional tienes o te gustaría agendar una visita para conocer el lote y la laguna?*";
}

// ==========================================================
// 5. RESPUESTAS GENERALES DEL PORTAL INMOBILIARIO
// ==========================================================
function getMenuPrincipal($sender = '') {
    global $LEADS_FILE;
    $nombreCliente = '';
    if (!empty($sender) && file_exists($LEADS_FILE)) {
        $leads = json_decode(file_get_contents($LEADS_FILE), true) ?: [];
        $cleanSender = preg_replace('/\D/', '', $sender);
        foreach ($leads as $l) {
            $lPhone = preg_replace('/\D/', '', $l['numero_celular'] ?? '');
            if ($lPhone === $cleanSender || ($l['id'] ?? '') === $sender) {
                if (!empty($l['cliente_nombre']) && $l['cliente_nombre'] !== 'Por identificar') {
                    $nombreCliente = $l['cliente_nombre'];
                    break;
                }
            }
        }
    }
    $saludoNombre = !empty($nombreCliente) ? " *" . $nombreCliente . "*" : "";

    return "👋 ¡Hola{$saludoNombre}! Bienvenido a *Realty ONE Group Bolivia* 🦁✨\n\n" .
           "Soy tu asesor inmobiliario virtual. ¿En qué te podemos ayudar hoy?\n\n" .
           "1️⃣ *Comprar* una propiedad (Casas, Departamentos, Terrenos)\n" .
           "2️⃣ *Alquilar* un inmueble\n" .
           "3️⃣ *Anticrético* seguro\n" .
           "4️⃣ *Vender o consignar* mi propiedad\n" .
           "5️⃣ *Consultas legales* (Requisitos, Impuestos, Derechos Reales)\n\n" .
           "👉 *Escribe el número de tu opción (1, 2, 3, 4 o 5) o cuéntanos qué estás buscando.*";
}

function getOpcionesVenta() {
    return "🏡 *Propiedades destacadas en Venta disponibles en Santa Cruz:*\n\n" .
           "🌟 *1. Mansión Contemporánea - Urubó*\n" .
           "📍 *Zona:* Urubó | 💰 *Precio:* $450.000\n" .
           "🛏 5 Dormitorios | 🚿 6 Baños | Piscina infinita\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=1\n\n" .
           "🌟 *2. Casa Minimalista - Equipetrol*\n" .
           "📍 *Zona:* Equipetrol | 💰 *Precio:* $320.000\n" .
           "🛏 4 Dormitorios | 🚿 4 Baños | Acabados premium\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=2\n\n" .
           "🌟 *3. Penthouse de Lujo - Sirari*\n" .
           "📍 *Zona:* Sirari | 💰 *Precio:* $280.000\n" .
           "🛏 3 Dormitorios | 🚿 4 Baños | Terraza con jacuzzi\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=3\n\n" .
           "🌟 *4. Terreno Industrial 7.000 m² - Parque Industrial*\n" .
           "📍 *Zona:* Parque Industrial (Salida G77) | 💰 *Precio:* Bs 16.800.000\n" .
           "📐 185m frente x 150m fondo | Trifásica | Folio Real\n\n" .
           "━━━━━━━━━━━━━━━━━━━━\n" .
           "📅 *¿CÓMO AGENDAR TU VISITA PRESENCIAL?*\n" .
           "👉 *Responde directamente a este mensaje indicando:*\n" .
           "1️⃣ El número o nombre de la propiedad (ej: *'Quiero visitar la 1'* o *'Ver la casa de Equipetrol'*)\n" .
           "2️⃣ El día y hora que prefieras (ej: *'Mañana a las 16:00'* o *'Sábado por la mañana'*)\n\n" .
           "🦁 *Un asesor especialista de Realty ONE Group te contactará de inmediato para confirmar la cita y enviarte la ubicación GPS.*";
}

function getOpcionesAlquiler() {
    return "🏢 *Opciones disponibles en Alquiler:*\n\n" .
           "🌟 *1. Dpto Executive - Equipetrol*\n" .
           "📍 *Zona:* Equipetrol | 💰 *Precio:* $1.200 /mes\n" .
           "🛏 2 Dormitorios | 🚿 2 Baños | Completamente Amoblado\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=7\n\n" .
           "🌟 *2. Casa en Condominio - Urubó*\n" .
           "📍 *Zona:* Urubó | 💰 *Precio:* $2.500 /mes\n" .
           "🛏 4 Dormitorios | 🚿 4 Baños | Galería y piscina\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=10\n\n" .
           "🌟 *3. Oficina Corporativa - Centro Financiero*\n" .
           "📍 *Zona:* Centro | 💰 *Precio:* $1.500 /mes (200 m²)\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=9\n\n" .
           "━━━━━━━━━━━━━━━━━━━━\n" .
           "📅 *¿CÓMO AGENDAR TU VISITA PRESENCIAL?*\n" .
           "👉 *Responde indicando el número de opción (ej: 'Quiero visitar la opción 1') junto con el día y hora que tengas disponible.*";
}

function getOpcionesAnticretico() {
    return "🔑 *¿Cómo funciona el Anticrético en Bolivia?*\n\n" .
           "Entregas un capital en dólares al propietario por el uso de la vivienda *sin pagar alquiler mensual*. Al término del contrato (1 año forzoso + 1 voluntario), se te devuelve el *100% de tu capital*.\n\n" .
           "🛡️ *Garantía Realty ONE:* Verificamos Folio Real actualizado en DDRR libre de gravamen e inscribimos la Escritura Pública Notariada.\n\n" .
           "🏡 *Opciones en Anticrético disponibles:*\n\n" .
           "🌟 *1. Casa 2 Plantas - Hamacas (Zona Norte)*\n" .
           "💰 *Precio:* $45.000 | 🛏 4 Dorm | 🚿 3 Baños | 📐 350 m²\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=13\n\n" .
           "🌟 *2. Dpto 3 Dormitorios - Urbarí*\n" .
           "💰 *Precio:* $30.000 | 🛏 3 Dorm | 🚿 3 Baños | 📐 160 m²\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=14\n\n" .
           "🌟 *3. Monoambiente - Sirari*\n" .
           "💰 *Precio:* $18.000 | 🛏 1 Dorm | 🚿 1 Baño\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=16\n\n" .
           "━━━━━━━━━━━━━━━━━━━━\n" .
           "📅 *¿CÓMO AGENDAR TU VISITA?*\n" .
           "👉 *Responde con el número de inmueble (ej: 'Quiero ver la 1 en Hamacas') y tu horario preferido para coordinar con el asesor.*";
}

function getOpcionesTerrenos() {
    return "🌳 *Terrenos y Lotes disponibles en Santa Cruz:*\n\n" .
           "🌟 *1. Terreno Industrial 7.000 m² - Parque Industrial (Salida G77)*\n" .
           "📍 *Ubicación:* Parque Industrial | 💰 *Precio:* Bs 16.800.000\n" .
           "📐 185m frente x 150m fondo | Energía Trifásica | Agua Industrial | Folio Real\n\n" .
           "🌟 *2. Lote Urbanizado - Urubó Golf*\n" .
           "📍 *Zona:* Urubó | 💰 *Precio:* $120.000 (800 m²)\n" .
           "🔗 https://realyonegroupbolivia.e-techgroupbolivia.com/propiedad.html?id=17\n\n" .
           "🌟 *3. Terreno Comercial - Warnes (Zona Norte)*\n" .
           "📍 *Zona:* Warnes | 💰 *Precio:* $85.000 (1.500 m²)\n\n" .
           "━━━━━━━━━━━━━━━━━━━━\n" .
           "📅 *¿DESEAS AGENDAR UNA INSPECCIÓN TÉCNICA EN TERRENO?*\n" .
           "👉 *Indícanos qué opción deseas visitar (ej: 'Visitar Terreno G77') y qué día te queda cómodo para esperarte en el lugar con el asesor Robert Oliva.*";
}

function getInfoConsignacion() {
    return "🤝 *¡Excelente! En Realty ONE Group te ayudamos a vender o alquilar tu inmueble al mejor valor de mercado.* 🦁✨\n\n" .
           "📸 *Lo que incluye nuestro servicio:*\n" .
           "• Fotografía y video profesional\n" .
           "• Campañas publicitarias en Facebook, Instagram y portales web\n" .
           "• Red de más de 100 agentes en Bolivia\n" .
           "• Asesoría legal, avalúo comercial y filtro de compradores\n\n" .
           "📞 Por favor indícanos: *¿En qué zona está ubicado tu inmueble y de qué tipo es?* (Casa, Departamento, Terreno).";
}

function getInfoLegal() {
    return "📑 *Documentación y Requisitos Clave en Bolivia:*\n\n" .
           "1. *Folio Real actualizado:* Certificado alodial emitido por Derechos Reales (DDRR) que acredita titularidad y libertad de gravamen.\n" .
           "2. *Plano de Uso de Suelo / Catastral:* Aprobado por el Municipio.\n" .
           "3. *Impuestos Municipales:* Comprobantes de pago al día de los últimos 5 años.\n" .
           "4. *Impuesto a la Transferencia (IT / IMT):* 3% sobre el valor catastral o de venta.\n" .
           "5. *Cédulas de Identidad:* Vigentes de los propietarios.\n\n" .
           "⚖️ *En Realty ONE Group blindamos legalmente cada operación.* ¿Tienes alguna consulta específica sobre tu documentación?";
}

// ==========================================================
// 6. ENVÍO DE MENSAJE VIA META CLOUD API
// ==========================================================
function sendWhatsAppMessage($to, $text, $token, $phoneId) {
    $url     = "https://graph.facebook.com/v20.0/" . $phoneId . "/messages";
    $payload = [
        "messaging_product" => "whatsapp",
        "recipient_type"    => "individual",
        "to"                => preg_replace('/\D/', '', $to),
        "type"              => "text",
        "text"              => ["preview_url" => true, "body" => $text]
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer $token", "Content-Type: application/json"],
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) return "cURL ERROR: $curlErr";
    return "HTTP $httpCode: $response";
}
?>
