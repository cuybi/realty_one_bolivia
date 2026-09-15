/**
 * marketingHub.js — Suite de Automatización y Marketing WhatsApp
 * Realty ONE Group Bolivia
 * 
 * Gestiona:
 * 1. Campañas masivas (Broadcast) con protección anti-bloqueo
 * 2. Mensajes multimedia (texto, audio, foto, video, fichas PDF)
 * 3. Embudos automáticos 1-clic
 * 4. Respuestas automáticas por palabras clave y chatbot guiado
 * 5. Publicación de estados (WhatsApp Status)
 * 6. Organización por etiquetas y marcaciones
 * 7. Agendamiento y programación de envíos
 * 8. Exportación de reportes a Excel
 */

const fs = require('fs');
const path = require('path');
const leadClassifier = require('./leadClassifier');
const excelService = require('./excelService');
const whatsappService = require('./whatsappService');

const SCHEDULE_FILE = path.join(__dirname, '..', 'scheduled_messages.json');
const CAMPAIGNS_LOG_FILE = path.join(__dirname, '..', 'broadcast_campaigns.json');
const RULES_FILE = path.join(__dirname, '..', 'auto_reply_rules.json');

// Referencia al socket activo de Baileys
let baileysSock = null;

function setBaileysSocket(sock) {
  baileysSock = sock;
}

function getBaileysSocket() {
  return baileysSock;
}

// ─── 1. PERSISTENCIA DE DATOS ──────────────────────────────────────────────
function readJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`Error guardando ${filePath}:`, e.message);
    return false;
  }
}

// ─── 2. REGLAS DE RESPUESTA AUTOMÁTICA Y CHATBOT ───────────────────────────
const DEFAULT_RULES = [
  {
    id: 'rule_precio',
    nombre: 'Consulta de Precios',
    palabras_clave: ['precio', 'costo', 'cuanto cuesta', 'valor', 'presupuesto'],
    respuesta: '¡Hola! 🦁 Te comparto nuestros rangos de inversión:\n\n🌊 *Mar Adentro (Urubó)*: Lotes desde $112.500 y deptos con playa cristalina.\n🏢 *Terreno G77 (7.000 m²)*: Bs 16.800.000 ideal empresas.\n🏠 *Casas y Departamentos*: Equipetrol, Las Palmas y Zona Norte.\n\n¿Qué tipo de inmueble buscas?',
    activa: true
  },
  {
    id: 'rule_mar_adentro',
    nombre: 'Ficha Condominio Mar Adentro',
    palabras_clave: ['mar adentro', 'laguna', 'urubo', 'crystal lagoons', 'playa'],
    respuesta: '🌊 *Condominio Mar Adentro - Urubó*:\n- Laguna de aguas cristalinas de 3.5 hectáreas\n- Club House, canchas de tenis y fútbol\n- Seguridad 24/7 y áreas verdes\n\n¿Deseas agendar una visita guiada para hoy o mañana?',
    media_url: 'assets/images/mar_adentro.jpg',
    media_tipo: 'image',
    activa: true
  },
  {
    id: 'rule_visita',
    nombre: 'Agendamiento de Citas',
    palabras_clave: ['visita', 'ver la casa', 'agendar', 'conocer', 'cita', 'ir a ver'],
    respuesta: '📅 ¡Con gusto coordinamos la visita! Nuestro e-Realtor especialista puede recibirte hoy por la tarde o mañana en la mañana. ¿Qué horario te queda mejor?',
    activa: true
  },
  {
    id: 'rule_requisitos',
    nombre: 'Requisitos Anticrético / Compra',
    palabras_clave: ['requisitos', 'papeles', 'ddrr', 'documentos', 'legal'],
    respuesta: '📋 *Requisitos y Asesoría Legal Realty ONE*:\n1. Cédula de Identidad vigente\n2. Verificación de Folio Real en DDRR sin gravamen\n3. Contrato con reconocimiento de firmas ante Notario.\n\nNuestro equipo legal revisa todo antes de que entregues dinero.',
    activa: true
  }
];

function getAutoRules() {
  const rules = readJson(RULES_FILE, null);
  if (!rules || rules.length === 0) {
    writeJson(RULES_FILE, DEFAULT_RULES);
    return DEFAULT_RULES;
  }
  return rules;
}

function saveAutoRules(rules) {
  return writeJson(RULES_FILE, rules);
}

function matchAutoRule(messageText = '') {
  const rules = getAutoRules();
  const text = messageText.toLowerCase().trim();
  for (const rule of rules) {
    if (!rule.activa) continue;
    const match = rule.palabras_clave.some(kw => text.includes(kw.toLowerCase()));
    if (match) return rule;
  }
  return null;
}

// ─── 3. ENVÍO DE MENSAJES INDIVIDUALES (BAILEYS + META FALLBACK) ───────────
async function sendWhatsAppDirect(toPhone, messageText, media = null) {
  let cleanPhone = String(toPhone || '').replace(/\D/g, '');
  if (!cleanPhone) return { success: false, error: 'Teléfono inválido' };

  // Auto-completar prefijo internacional de Bolivia si solo tiene 8 dígitos
  if (cleanPhone.length === 8) {
    cleanPhone = '591' + cleanPhone;
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;

  // 1. Intentar vía Baileys si está conectado
  if (baileysSock) {
    try {
      if (media && media.url) {
        let fileBuffer = null;
        let filePath = media.url;

        if (!fs.existsSync(filePath)) {
          const rootPath = path.resolve(__dirname, '..', media.url);
          if (fs.existsSync(rootPath)) filePath = rootPath;
        }

        if (fs.existsSync(filePath)) {
          fileBuffer = fs.readFileSync(filePath);
        } else if (media.url.startsWith('http')) {
          const resp = await fetch(media.url);
          const ab = await resp.arrayBuffer();
          fileBuffer = Buffer.from(ab);
        }

        if (fileBuffer) {
          if (media.tipo === 'image') {
            await baileysSock.sendMessage(jid, { image: fileBuffer, caption: messageText });
            return { success: true, channel: 'baileys_image' };
          } else if (media.tipo === 'document' || media.tipo === 'pdf') {
            await baileysSock.sendMessage(jid, {
              document: fileBuffer,
              mimetype: 'application/pdf',
              fileName: media.nombre || 'Ficha_RealtyONE.pdf',
              caption: messageText
            });
            return { success: true, channel: 'baileys_document' };
          } else if (media.tipo === 'video') {
            await baileysSock.sendMessage(jid, { video: fileBuffer, caption: messageText });
            return { success: true, channel: 'baileys_video' };
          }
        }
      }

      await baileysSock.sendMessage(jid, { text: messageText });
      return { success: true, channel: 'baileys' };
    } catch (e) {
      console.warn(`[MarketingHub] Fallo Baileys a ${cleanPhone}:`, e.message);
    }
  }

  // 2. Fallback vía Meta Cloud API
  try {
    if (media && media.tipo === 'image' && media.url && media.url.startsWith('http')) {
      return await whatsappService.sendImageMessage(cleanPhone, media.url, messageText);
    }
    return await whatsappService.sendTextMessage(cleanPhone, messageText);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─── 4. CAMPAÑAS EN MASA (BROADCAST) ───────────────────────────────────────
let activeBroadcast = null;

async function startBroadcastCampaign({
  nombreCampana,
  destinatarios = [], // Array de { id, nombre, telefono, zona, ... }
  plantillaMensaje,
  media = null,
  delayMinSeg = 4,
  delayMaxSeg = 8
}) {
  if (activeBroadcast && activeBroadcast.enProgreso) {
    throw new Error('Ya hay una campaña masiva en ejecución. Espera a que termine.');
  }

  const campaignId = `camp_${Date.now()}`;
  const campaign = {
    id: campaignId,
    nombre: nombreCampana || `Difusión ${new Date().toLocaleDateString()}`,
    total: destinatarios.length,
    enviados: 0,
    fallidos: 0,
    enProgreso: true,
    fecha_inicio: new Date().toISOString(),
    fecha_fin: null,
    log: []
  };

  activeBroadcast = campaign;

  // Ejecución en segundo plano sin bloquear el hilo
  (async () => {
    for (let i = 0; i < destinatarios.length; i++) {
      const dest = destinatarios[i];
      const phone = dest.numero_celular || dest.telefono || dest.telefono_cliente;
      const name = dest.cliente_nombre || dest.nombre || dest.cliente || 'Cliente';
      const realtor = dest.e_realtor_asignado || 'Asesor Realty ONE';
      const zone = dest.zona_interes || dest.tipo_interes || 'Santa Cruz';

      // Interpolación dinámica de variables
      let text = plantillaMensaje
        .replace(/{nombre}/gi, name)
        .replace(/{cliente}/gi, name)
        .replace(/{telefono}/gi, phone || '')
        .replace(/{celular}/gi, phone || '')
        .replace(/{asesor}/gi, realtor)
        .replace(/{realtor}/gi, realtor)
        .replace(/{zona}/gi, zone);

      try {
        const res = await sendWhatsAppDirect(phone, text, media);
        if (res.success) {
          campaign.enviados++;
          campaign.log.push({ telefono: phone, nombre: name, estado: 'ENVIADO', fecha: new Date().toISOString() });
        } else {
          campaign.fallidos++;
          campaign.log.push({ telefono: phone, nombre: name, estado: 'FALLO', error: res.error, fecha: new Date().toISOString() });
        }
      } catch (err) {
        campaign.fallidos++;
        campaign.log.push({ telefono: phone, nombre: name, estado: 'ERROR', error: err.message, fecha: new Date().toISOString() });
      }

      // Intervalo anti-bloqueo aleatorio (entre delayMin y delayMax)
      if (i < destinatarios.length - 1) {
        const delayMs = Math.floor((Math.random() * (delayMaxSeg - delayMinSeg + 1) + delayMinSeg) * 1000);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }

    campaign.enProgreso = false;
    campaign.fecha_fin = new Date().toISOString();

    // Guardar en historial
    const history = readJson(CAMPAIGNS_LOG_FILE, []);
    history.unshift(campaign);
    writeJson(CAMPAIGNS_LOG_FILE, history.slice(0, 50)); // Guardar últimas 50
    activeBroadcast = null;
  })();

  return { exito: true, campaignId, total: destinatarios.length };
}

function getBroadcastStatus() {
  if (activeBroadcast) return activeBroadcast;
  const history = readJson(CAMPAIGNS_LOG_FILE, []);
  return history[0] || null;
}

function getBroadcastHistory() {
  return readJson(CAMPAIGNS_LOG_FILE, []);
}

// ─── 5. PUBLICACIÓN DE ESTADOS (WHATSAPP STORIES) ──────────────────────────
async function publishWhatsAppStatus({ text = '', mediaUrl = null, mediaType = 'image' }) {
  if (!baileysSock) {
    return { success: false, error: 'WhatsApp Web Bot no está conectado para publicar estados.' };
  }

  try {
    const statusJid = 'status@broadcast';
    if (mediaUrl) {
      let fileBuffer = null;
      if (fs.existsSync(mediaUrl)) {
        fileBuffer = fs.readFileSync(mediaUrl);
      } else if (mediaUrl.startsWith('http')) {
        const resp = await fetch(mediaUrl);
        fileBuffer = Buffer.from(await resp.arrayBuffer());
      }

      if (fileBuffer) {
        if (mediaType === 'image') {
          await baileysSock.sendMessage(statusJid, { image: fileBuffer, caption: text });
          return { success: true, message: 'Estado con imagen publicado con éxito en WhatsApp' };
        } else if (mediaType === 'video') {
          await baileysSock.sendMessage(statusJid, { video: fileBuffer, caption: text });
          return { success: true, message: 'Estado con video publicado con éxito en WhatsApp' };
        }
      }
    }

    await baileysSock.sendMessage(statusJid, { text });
    return { success: true, message: 'Estado de texto publicado con éxito en WhatsApp' };
  } catch (error) {
    console.error('[MarketingHub] Error publicando estado:', error);
    return { success: false, error: error.message };
  }
}

// ─── 6. AGENDAMIENTO DE MENSAJES (SCHEDULER) ──────────────────────────────
function getScheduledMessages() {
  return readJson(SCHEDULE_FILE, []);
}

function addScheduledMessage(msg) {
  const list = getScheduledMessages();
  const newMsg = {
    id: `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    destinatario_nombre: msg.nombre || 'Cliente',
    telefono: msg.telefono,
    mensaje: msg.mensaje,
    media: msg.media || null,
    fecha_programada: msg.fecha_programada, // ISO string o formato YYYY-MM-DDTHH:mm
    estado: 'PENDIENTE',
    creado_en: new Date().toISOString()
  };
  list.push(newMsg);
  writeJson(SCHEDULE_FILE, list);
  return newMsg;
}

function cancelScheduledMessage(id) {
  let list = getScheduledMessages();
  list = list.filter(m => m.id !== id);
  writeJson(SCHEDULE_FILE, list);
  return true;
}

// Tarea periódica de revisión del scheduler (cada 20 segundos)
setInterval(async () => {
  const list = getScheduledMessages();
  const now = new Date();
  let modified = false;

  for (const item of list) {
    if (item.estado === 'PENDIENTE') {
      const schedTime = new Date(item.fecha_programada);
      if (schedTime <= now) {
        console.log(`[Scheduler] Ejecutando envío programado para ${item.telefono}...`);
        item.estado = 'PROCESANDO';
        try {
          const res = await sendWhatsAppDirect(item.telefono, item.mensaje, item.media);
          item.estado = res.success ? 'ENVIADO' : 'FALLIDO';
          item.ejecutado_en = new Date().toISOString();
        } catch (err) {
          item.estado = 'ERROR';
          item.error = err.message;
        }
        modified = true;
      }
    }
  }

  if (modified) {
    writeJson(SCHEDULE_FILE, list);
  }
}, 20000);

// ─── 7. APLICACIÓN DE EMBUDOS EN 1 CLIC ────────────────────────────────────
const FUNNEL_TEMPLATES = {
  INVERSIONISTA_VIP: {
    nombre: 'Inversionista VIP (Mar Adentro / Inversiones)',
    etapa: 'VISITA_AGENDADA',
    prioridad: 'POTENCIAL',
    etiqueta: '🔥 VIP',
    mensaje: '¡Hola {nombre}! 🌊 Te reservamos atención prioritaria con nuestro Master Broker para presentarte las opciones de inversión de alta plusvalía en Condominio Mar Adentro. ¿Te queda bien revisar los planos hoy?'
  },
  CAPTACION_PROPIETARIO: {
    nombre: 'Captación de Propietario',
    etapa: 'SOLICITUD',
    prioridad: 'PROPIETARIO',
    etiqueta: '🏠 Propietario',
    mensaje: 'Estimado/a {nombre}, gracias por confiar en Realty ONE Group Bolivia 🦁. Para iniciar la comercialización de su inmueble con nuestra red de más de 500 compradores calificados, agendamos una visita técnica de tasación sin costo. ¿Qué día le resulta más cómodo?'
  },
  ANTICRETICO_EXPRESS: {
    nombre: 'Anticrético Seguro',
    etapa: 'CONTACTADO',
    prioridad: 'POTENCIAL',
    etiqueta: '📋 Anticrético',
    mensaje: '¡Hola {nombre}! Verificamos opciones de anticrético disponibles en {zona}. Todas nuestras opciones cuentan con respaldo legal y gravamen limpio en DDRR. ¿Cuál es tu presupuesto máximo?'
  }
};

async function applyFunnelToOneClick(leadIds = [], funnelKey = 'INVERSIONISTA_VIP', enviarMensaje = false) {
  const template = FUNNEL_TEMPLATES[funnelKey];
  if (!template) throw new Error(`Embudo no reconocido: ${funnelKey}`);

  const allLeads = await leadClassifier.getLeadsAsync();
  const updatedLeads = [];

  for (const leadId of leadIds) {
    const lead = allLeads.find(l => l.id === leadId);
    if (lead) {
      lead.etapa_embudo = template.etapa;
      lead.prioridad = template.prioridad;
      lead.estado_comercial = template.nombre;
      
      // Añadir etiqueta
      if (!Array.isArray(lead.etiquetas)) lead.etiquetas = [];
      if (!lead.etiquetas.includes(template.etiqueta)) {
        lead.etiquetas.push(template.etiqueta);
      }

      updatedLeads.push(lead);

      if (enviarMensaje) {
        const phone = lead.numero_celular || lead.telefono;
        const name = lead.cliente_nombre || lead.nombre || 'Cliente';
        const msg = template.mensaje.replace(/{nombre}/gi, name).replace(/{zona}/gi, lead.zona_interes || 'Santa Cruz');
        sendWhatsAppDirect(phone, msg).catch(e => console.warn('Error envio embudo:', e.message));
      }
    }
  }

  await leadClassifier.saveLeads(allLeads);
  return { exito: true, actualizados: updatedLeads.length, embudo: template.nombre };
}

// ─── 8. ETIQUETAS Y MARCACIONES ────────────────────────────────────────────
async function toggleLeadTag(leadId, tag) {
  const allLeads = await leadClassifier.getLeadsAsync();
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return { success: false, error: 'Lead no encontrado' };

  if (!Array.isArray(lead.etiquetas)) lead.etiquetas = [];
  const index = lead.etiquetas.indexOf(tag);
  if (index >= 0) {
    lead.etiquetas.splice(index, 1);
  } else {
    lead.etiquetas.push(tag);
  }

  await leadClassifier.saveLeads(allLeads);
  return { success: true, etiquetas: lead.etiquetas };
}

// ─── 9. EXPORTACIÓN DE REPORTES A EXCEL ────────────────────────────────────
function exportCampaignExcelXML(campaignId) {
  const history = getBroadcastHistory();
  const camp = history.find(c => c.id === campaignId) || history[0];
  if (!camp) return null;

  const rows = (camp.log || []).map((l, idx) => `
    <Row>
      <Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
      <Cell><Data ss:Type="String">${excelService.escapeXml(l.nombre || 'Cliente')}</Data></Cell>
      <Cell><Data ss:Type="String">${excelService.escapeXml(l.telefono || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${excelService.escapeXml(l.estado || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${excelService.escapeXml(l.fecha || '')}</Data></Cell>
      <Cell><Data ss:Type="String">${excelService.escapeXml(l.error || 'Ninguno')}</Data></Cell>
    </Row>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Reporte Difusion">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">#</Data></Cell>
    <Cell><Data ss:Type="String">Nombre</Data></Cell>
    <Cell><Data ss:Type="String">Celular</Data></Cell>
    <Cell><Data ss:Type="String">Estado</Data></Cell>
    <Cell><Data ss:Type="String">Fecha Envio</Data></Cell>
    <Cell><Data ss:Type="String">Detalles / Error</Data></Cell>
   </Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
}

module.exports = {
  setBaileysSocket,
  getBaileysSocket,
  sendWhatsAppDirect,
  startBroadcastCampaign,
  getBroadcastStatus,
  getBroadcastHistory,
  publishWhatsAppStatus,
  getScheduledMessages,
  addScheduledMessage,
  cancelScheduledMessage,
  FUNNEL_TEMPLATES,
  applyFunnelToOneClick,
  toggleLeadTag,
  getAutoRules,
  saveAutoRules,
  matchAutoRule,
  exportCampaignExcelXML
};
