<?php
/**
 * Panel de Activación y Renovación de Token Meta WhatsApp - Realty ONE Group Bolivia
 * Permite ingresar o renovar el Access Token de Meta directamente desde la web.
 */

$CONFIG_FILE = __DIR__ . '/meta_config.json';

// Cargar configuración existente o por defecto
$config = [
    'token'           => 'EAAS6vrSHBuUBSckrwVb5DSRn7MZAynRKuCQDVjZCSa0NQqghUs5VTlnIxbuILZAgznr2Bu4EGH9v6YC24gYfrknB02KxxZBBxWqrdSy8So9fgIg1FXQZC0iZAZAfTq7dpqpzGIEA575WcQGWV6e119rgxjEYrly7N6yQpNjSPxi2ZBkjDPoXa3suSH65s0cHFASzaAZDZD',
    'phone_number_id' => '1347227495132840',
    'waba_id'         => '2311864615885312',
    'verify_token'    => 'realty_one_whatsapp_verify_token_2026'
];

if (file_exists($CONFIG_FILE)) {
    $saved = json_decode(file_get_contents($CONFIG_FILE), true);
    if ($saved) $config = array_merge($config, $saved);
}

$notice = '';
$response = '';
$httpCode = 0;

// Procesar formulario de actualización de Token
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $newToken = trim($_POST['token'] ?? '');
    $newPhoneId = trim($_POST['phone_number_id'] ?? '');
    $newWabaId = trim($_POST['waba_id'] ?? '');

    if (!empty($newToken)) {
        $config['token'] = $newToken;
    }
    if (!empty($newPhoneId)) {
        $config['phone_number_id'] = $newPhoneId;
    }
    if (!empty($newWabaId)) {
        $config['waba_id'] = $newWabaId;
    }
    $config['updated_at'] = date('Y-m-d H:i:s');

    file_put_contents($CONFIG_FILE, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    $notice = '✅ Configuración guardada en meta_config.json. Ejecutando verificación con Meta...';
}

// Ejecutar suscripción WABA con Meta API
$wabaId = $config['waba_id'];
$token  = $config['token'];
$url    = "https://graph.facebook.com/v20.0/{$wabaId}/subscribed_apps";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        "Authorization: Bearer {$token}",
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS     => "{}",
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT        => 15
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$isSuccess = ($httpCode === 200 && strpos($response, '"success":true') !== false);
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activación & Token de WhatsApp - Realty ONE Group Bolivia</title>
  <link rel="icon" type="image/png" href="assets/favicon.png?v=2">
  <link rel="shortcut icon" href="assets/favicon.png?v=2">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --bg-main: #0b0f12;
      --bg-card: #12191f;
      --bg-card-header: #18222a;
      --gold-primary: #D4AF37;
      --gold-gradient: linear-gradient(135deg, #f3cf55 0%, #D4AF37 50%, #aa820a 100%);
      --text-main: #f0f4f8;
      --text-muted: #8a9ba8;
      --border-color: #22303c;
      --wa-green: #25D366;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Outfit', sans-serif; }
    body { background: var(--bg-main); color: var(--text-main); min-height: 100vh; display: flex; flex-direction: column; padding: 30px 20px; }
    .container { max-width: 780px; margin: 0 auto; width: 100%; }
    .card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-bottom: 24px; }
    .card-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 20px; }
    .brand-title { font-size: 1.3rem; font-weight: 700; color: #fff; }
    .brand-title span { color: var(--gold-primary); }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 700; }
    .status-badge.ok { background: rgba(37,211,102,0.15); color: var(--wa-green); border: 1px solid rgba(37,211,102,0.3); }
    .status-badge.err { background: rgba(255,77,79,0.15); color: #ff7875; border: 1px solid rgba(255,77,79,0.3); }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.6px; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; }
    .form-input { width: 100%; background: #0b0f12; border: 1px solid var(--border-color); color: #fff; padding: 10px 14px; border-radius: 8px; font-size: 0.88rem; outline: none; }
    .form-input:focus { border-color: var(--gold-primary); }
    textarea.form-input { font-family: monospace; font-size: 0.8rem; line-height: 1.4; resize: vertical; }
    .btn-submit { background: var(--gold-gradient); color: #000; font-weight: 700; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; width: 100%; font-size: 0.95rem; transition: transform 0.2s, box-shadow 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-submit:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212,175,55,0.4); }
    pre { background: #0b0f12; border: 1px solid var(--border-color); padding: 14px; border-radius: 8px; font-size: 0.8rem; overflow-x: auto; color: #a9b7c6; margin-top: 10px; }
    .help-box { background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.25); border-radius: 10px; padding: 16px 20px; font-size: 0.85rem; color: #d0d7de; line-height: 1.5; margin-top: 20px; }
    .help-box ol { margin-left: 20px; margin-top: 8px; }
    .help-box li { margin-bottom: 6px; }
    .quick-links { display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
    .quick-link { color: var(--gold-primary); text-decoration: none; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; }
    .quick-link:hover { text-decoration: underline; }
  </style>
</head>
<body>

  <div class="container">
    <div class="card">
      <div class="card-header">
        <div class="brand-title" style="display:flex; align-items:center; gap:10px;"><img src="assets/logo_one_circle.png?v=2" alt="ONE" style="width:32px; height:32px; border-radius:50%; object-fit:cover; vertical-align:middle; box-shadow:0 0 10px rgba(212,175,55,0.4);"> Realty ONE Group <span>WhatsApp Activator</span></div>
        <div>
          <?php if ($isSuccess): ?>
            <span class="status-badge ok"><i class="fa-solid fa-circle-check"></i> Webhook Activo (HTTP 200)</span>
          <?php else: ?>
            <span class="status-badge err"><i class="fa-solid fa-triangle-exclamation"></i> Token Expirado (HTTP <?php echo $httpCode ?: 'Error'; ?>)</span>
          <?php endif; ?>
        </div>
      </div>

      <?php if (!empty($notice)): ?>
        <div style="background: rgba(37,211,102,0.15); border: 1px solid rgba(37,211,102,0.3); color: #25d366; padding: 12px 16px; border-radius: 8px; font-size: 0.88rem; margin-bottom: 16px;">
          <?php echo htmlspecialchars($notice); ?>
        </div>
      <?php endif; ?>

      <!-- Formulario para pegar y renovar Token -->
      <form method="POST">
        <div class="form-group">
          <label><i class="fa-solid fa-key"></i> Token de Acceso de Meta Developers (Access Token):</label>
          <textarea name="token" class="form-input" rows="4" placeholder="Pega aquí el nuevo token que empieza con EAA..."><?php echo htmlspecialchars($config['token']); ?></textarea>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
            Última actualización guardada: <strong><?php echo $config['updated_at'] ?? 'Por defecto'; ?></strong>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px;">
          <div class="form-group" style="margin:0;">
            <label><i class="fa-solid fa-phone"></i> Phone Number ID:</label>
            <input type="text" name="phone_number_id" class="form-input" value="<?php echo htmlspecialchars($config['phone_number_id']); ?>">
          </div>
          <div class="form-group" style="margin:0;">
            <label><i class="fa-solid fa-building"></i> WABA ID (Business Account):</label>
            <input type="text" name="waba_id" class="form-input" value="<?php echo htmlspecialchars($config['waba_id']); ?>">
          </div>
        </div>

        <button type="submit" class="btn-submit">
          <i class="fa-solid fa-bolt"></i> Guardar Token y Activar Webhook en Vivo
        </button>
      </form>

      <!-- Respuesta en vivo de Meta -->
      <div style="margin-top: 24px;">
        <label><i class="fa-solid fa-terminal"></i> Respuesta del Servidor de Meta (Graph API):</label>
        <pre><?php echo htmlspecialchars($response ?: 'Sin respuesta de Meta', ENT_QUOTES, 'UTF-8'); ?></pre>
      </div>

      <!-- Guía para obtener el Token permanente o temporal -->
      <div class="help-box">
        <strong>💡 ¿Cómo obtener un nuevo Token en Meta for Developers?</strong>
        <ol>
          <li>Ingresa a <a href="https://developers.facebook.com/apps" target="_blank" style="color:var(--gold-primary); font-weight:700;">Meta for Developers ➔ Mis Apps</a>.</li>
          <li>Selecciona tu App de WhatsApp ➔ Ve al menú izquierdo: <strong>WhatsApp ➔ Configuración de la API (API Setup)</strong>.</li>
          <li>En la sección <strong>"Token de acceso temporal"</strong>, haz clic en <strong>Generar / Copiar</strong>.</li>
          <li>Pega el token arriba y haz clic en <strong>"Guardar Token y Activar"</strong>.</li>
          <li><em>(Recomendado para producción):</em> Para que el token <strong>nunca expire</strong>, crea un <strong>Token Permanente de Usuario del Sistema</strong> en Meta Business Manager (en Configuración del Negocio ➔ Usuarios del Sistema ➔ Generar Token con permisos <code>whatsapp_business_messaging</code> y <code>whatsapp_business_management</code>).</li>
        </ol>
      </div>

      <div class="quick-links">
        <a href="ingreso_leads.html" class="quick-link"><i class="fa-solid fa-table-columns"></i> Ir al Panel Ingreso Leads & Excel</a>
        <a href="diagnostico.php" class="quick-link"><i class="fa-solid fa-stethoscope"></i> Ver Diagnóstico Completo</a>
        <a href="publicidades.html" class="quick-link"><i class="fa-solid fa-bullhorn"></i> Ver Campañas Ads</a>
      </div>
    </div>
  </div>

</body>
</html>
