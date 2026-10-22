/**
 * Alerta de lead nuevo por Telegram (paso 6 del flujo: aviso al asesor).
 *
 * Gratis y sin tarjeta: el bot avisa al grupo del equipo en cuanto se capta
 * un lead. Si no esta configurado (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID),
 * no hace nada: el bot nunca se rompe por una alerta.
 */

const API = 'https://api.telegram.org';

const PANEL_POR_DEFECTO =
  'https://realyonegroupbolivia.e-techgroupbolivia.com/ingreso_leads.html?key=ONE2026';

function valor(lead, campo, defecto = '—') {
  const v = lead && lead[campo];
  return v === undefined || v === null || v === '' || v === 'Pendiente' || v === 'Por identificar'
    ? defecto
    : v;
}

/** Texto corto para el celular del asesor. */
function buildMessage(lead, panelUrl) {
  const lineas = [
    '🔔 Nuevo lead - Realty ONE Group Bolivia',
    '',
    `👤 ${valor(lead, 'cliente_nombre')}`,
    `📱 ${valor(lead, 'numero_celular')}`,
    `✉️ ${valor(lead, 'email')}`,
    `🏷️ ${valor(lead, 'tipo_interes')}`,
    `📍 ${valor(lead, 'zona_interes')}`,
    `📣 ${valor(lead, 'campana')}`,
    `💬 "${valor(lead, 'ultimo_mensaje')}"`,
  ];
  if (lead && lead.e_realtor_asignado) lineas.push(`🏷️ Asignado a: ${lead.e_realtor_asignado}`);
  if (panelUrl) lineas.push('', `📊 Ver en el CRM: ${panelUrl}`);
  return lineas.join('\n');
}

/**
 * Envia el aviso. Nunca lanza: un fallo de Telegram no puede tumbar el bot.
 * Devuelve { sent, status?, reason? }.
 */
async function notifyNewLead(lead, opciones = {}) {
  const env = opciones.env || process.env;
  const token = (opciones.token || env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (opciones.chatId || env.TELEGRAM_CHAT_ID || '').trim();
  const panelUrl = (opciones.panelUrl || env.CRM_PANEL_URL || PANEL_POR_DEFECTO).trim();
  const fetchImpl = opciones.fetchImpl || globalThis.fetch;

  if (!token || !chatId) {
    return { sent: false, reason: 'sin-configuracion' };
  }
  if (typeof fetchImpl !== 'function') {
    return { sent: false, reason: 'sin-fetch' };
  }

  try {
    const response = await fetchImpl(`${API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage(lead, panelUrl),
        disable_web_page_preview: true,
      }),
    });
    if (!response || !response.ok) {
      const status = response ? response.status : 0;
      console.warn(`[Telegram] Aviso no enviado (HTTP ${status}). Revisar token/chat id.`);
      return { sent: false, status };
    }
    console.log(`[Telegram] Lead avisado al equipo: ${valor(lead, 'cliente_nombre')}`);
    return { sent: true, status: response.status };
  } catch (error) {
    console.warn('[Telegram] Error enviando el aviso:', error && error.message);
    return { sent: false, error: error && error.message };
  }
}

module.exports = { notifyNewLead, buildMessage, PANEL_POR_DEFECTO };
