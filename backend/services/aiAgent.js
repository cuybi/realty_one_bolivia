/**
 * Cerebro de Inteligencia Artificial para el Chatbot Inmobiliario
 * Realty ONE Group Bolivia
 *
 * ARQUITECTURA HÍBRIDA UNIFICADA:
 * 1. Flujo de Campañas y Facebook Ads (CTWA / externalAdReply):
 *    - Respuestas automáticas por publicación (Mar Adentro, Terreno G77, Depto 4D, etc.).
 *    - Extracción dinámica para cualquier anuncio nuevo (Westgate Tower, Buenavista, etc.).
 *    - Asesoría sobre crédito bancario, permutas, expensas, planos y fotos.
 *    - Captura de datos, asignación de e-Realtors y confirmación de visitas.
 *
 * 2. Asistente Virtual de Atención al Cliente (Canal Orgánico / General):
 *    - 5 Estados (1. Saludo, 2. Datos: teléfono, correo y ciudad, 3. Agendamiento, 4. Recordatorio, 5. Despedida).
 *    - 6 Reglas estrictas:
 *      1. Sin listas de opciones ni menús ni viñetas. Preguntas abiertas y libres.
 *      2. Flujo secuencial paso a paso estricto.
 *      3. Validación de datos: teléfono, correo y ciudad antes de Estado 3.
 *      4. Manejo de objeciones a compartir datos.
 *      5. Validación de fecha: día de la semana, fecha exacta y hora.
 *      6. Tono cordial y directo con frase obligatoria de despedida: "Cualquier duda o inquietud no dude en llamar."
 */

const db = require('../database');
const campaignService = require('./campaignService');
const leadClassifier = require('./leadClassifier');

const SYSTEM_INSTRUCTION = `
Eres ONEBot, el asesor virtual de atención al cliente de Realty ONE Group Bolivia.
Tu objetivo es atender consultas sobre compra, alquiler y anticrético de propiedades en Santa Cruz de la Sierra y Urubó, asesorar sobre publicaciones de Facebook Ads, recopilar datos de contacto calificados y agendar visitas presenciales.
Reglas:
- Trato cordial, profesional y directo.
- En atención general sin anuncio previo, recopila teléfono, correo y ciudad antes de agendar y finaliza con: "Cualquier duda o inquietud no dude en llamar."
`;

// Memoria acotada de sesiones (máximo 500 por tipo con TTL de 24 horas)
const MAX_SESSIONS = 500;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Sesiones de Atención al Cliente (Orgánicas)
const customerServiceSessions = new Map();

// Sesiones de Campañas / Facebook Ads
const userFlowSessions = new Map();

// Historial para Gemini
const conversationSessions = new Map();

// Limpieza periódica cada hora de sesiones inactivas
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of customerServiceSessions.entries()) {
    if (now - val.lastActivity > SESSION_TTL_MS) customerServiceSessions.delete(key);
  }
  for (const [key, val] of userFlowSessions.entries()) {
    if (now - val.lastActivity > SESSION_TTL_MS) userFlowSessions.delete(key);
  }
  for (const [key, val] of conversationSessions.entries()) {
    if (now - val.lastActivity > SESSION_TTL_MS) conversationSessions.delete(key);
  }
}, 60 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

function getSessionHistory(userId) {
  const now = Date.now();
  if (conversationSessions.has(userId)) {
    const s = conversationSessions.get(userId);
    s.lastActivity = now;
    return s.history;
  }
  if (conversationSessions.size >= MAX_SESSIONS) {
    const firstKey = conversationSessions.keys().next().value;
    conversationSessions.delete(firstKey);
  }
  const newS = { history: [], lastActivity: now };
  conversationSessions.set(userId, newS);
  return newS.history;
}

// ---- Validadores y Extractores para Atención al Cliente ----

function extractPhone(text) {
  const match = text.match(/(?:\+?591\s*)?[67]\d{7}\b|\b\d{7,15}\b/);
  return match ? match[0].replace(/\s+/g, '') : null;
}

function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].trim() : null;
}

function extractCity(text) {
  const cities = [
    'santa cruz', 'la paz', 'cochabamba', 'tarija', 'sucre', 'oruro', 'potosi', 'potosí',
    'beni', 'trinidad', 'pando', 'cobija', 'montero', 'warnes', 'urubo', 'urubó', 'el alto',
    'quillacollo', 'sacaba', 'yacuiba', 'riberalta'
  ];
  const lower = text.toLowerCase();
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(lower)) {
      return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  const vivoMatch = text.match(/(?:vivo en|ciudad de|desde|en la ciudad de|de la ciudad de|en)\s+([A-Za-zÁÉÍÓÚñáéíóú\s]{3,20})/i);
  if (vivoMatch && !/(?:lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado|domingo|gmail|hotmail)/i.test(vivoMatch[1])) {
    return vivoMatch[1].trim();
  }
  const parts = text.split(/[,;\n]/).map(p => p.trim()).filter(Boolean);
  for (const p of parts) {
    if (!extractEmail(p) && !extractPhone(p) && p.length >= 3 && p.length <= 30 && !/\d{4}/.test(p)) {
      return p;
    }
  }
  return null;
}

function isRefusal(text) {
  const lower = text.toLowerCase().trim();
  const patterns = [
    /\bno\s+(quiero|voy|dar[eé]|dar|te\s+doy|deseo|pienso)\b/,
    /\bprefiero\s+no\b/,
    /\bpor\s+qu[eé]\s+(tengo|debo|quieren)\b/,
    /\bpara\s+qu[eé]\s+quieren\b/,
    /\bsin\s+dar\s+datos\b/,
    /\bno\s+doy\s+(mis\s+)?datos\b/,
    /\bno\s+insistas\b/,
    /\bdije\s+que\s+no\b/,
    /\bno\s+quiero\s+dar\s+mis\s+datos\b/
  ];
  if (patterns.some(p => p.test(lower))) return true;
  if (lower === 'no' || lower === 'no quiero' || lower === 'no gracias' || lower === 'no los daré' || lower === 'no los dare') return true;
  return false;
}

function isNegativeScheduling(text) {
  const lower = text.toLowerCase().trim();
  if (/^(no|no gracias|todav[ií]a no|a[uú]n no|por ahora no|por el momento no|paso|no deseo|m[aá]s adelante|mas adelante|despu[eé]s|despues|ninguna|no por ahora)\b/i.test(lower)) {
    if (!/(lunes|martes|mi[eé]rcoles|miercoles|jueves|viernes|s[aá]bado|sabado|domingo)/i.test(lower)) {
      return true;
    }
  }
  return false;
}

function validateSchedulingDate(text) {
  const lower = text.toLowerCase();
  const hasDayOfWeek = /(lunes|martes|mi[eé]rcoles|miercoles|jueves|viernes|s[aá]bado|sabado|domingo)/i.test(lower);
  const hasExactDate = (
    /\b\d{1,2}\s+(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/i.test(lower) ||
    /\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?\b/.test(lower) ||
    /\b(el\s+)?\d{1,2}\b/.test(lower)
  );
  const hasHour = (
    /\b\d{1,2}(:\d{2})?\s*(am|pm|hrs|horas|h)\b/i.test(lower) ||
    /a\s+las\s+\d{1,2}(:\d{2})?/i.test(lower) ||
    /\b\d{1,2}:\d{2}\b/.test(lower) ||
    /\b\d{1,2}\s*(de la ma[nñ]ana|de la tarde|de la noche)\b/i.test(lower)
  );
  return hasDayOfWeek && hasExactDate && hasHour;
}

function getCustomerServiceSession(userId, pushName = '') {
  if (!customerServiceSessions.has(userId)) {
    if (customerServiceSessions.size >= MAX_SESSIONS) {
      const firstKey = customerServiceSessions.keys().next().value;
      customerServiceSessions.delete(firstKey);
    }
    const cleanName = (pushName && pushName !== 'Cliente' && pushName !== 'Por identificar') ? pushName.trim() : '';
    customerServiceSessions.set(userId, {
      state: 'ESTADO_1_GREETING',
      clientName: cleanName,
      phone: null,
      email: null,
      city: null,
      dataRequested: false,
      scheduledVisit: null,
      refusalCount: 0,
      reminderChoice: null,
      lastActivity: Date.now()
    });
  }
  const s = customerServiceSessions.get(userId);
  if (pushName && pushName !== 'Cliente' && pushName !== 'Por identificar' && !s.clientName) {
    s.clientName = pushName.trim();
  }
  s.lastActivity = Date.now();
  return s;
}

// ---- Funciones para Campañas de Facebook Ads y Anuncios Genéricos ----

function extractAdPropertyTopic(referralData, userMessage = '') {
  const text = (referralData?.body || referralData?.headline || userMessage || '').trim();
  if (!text) return 'la propiedad de nuestra publicación';

  const clean = text
    .replace(/^(realty one group itaguazu|realty one group bolivia)[|\s:—-]*/i, '')
    .trim();

  const dashParts = clean.split(/(?:—|-)/);
  if (dashParts.length > 1) {
    const afterDash = dashParts[1].trim();
    const capsAfter = afterDash.match(/^([A-ZÁÉÍÓÚÑ0-9\s]{3,35})\b/);
    if (capsAfter && capsAfter[1].trim().length >= 3) {
      return capsAfter[1].replace(/[🏢🌿🏖️🔥📍💰✨👉]/g, '').trim();
    }
    const wordsAfter = afterDash.split(/\s+/).slice(0, 4).join(' ');
    if (wordsAfter && wordsAfter.length >= 3 && wordsAfter.length <= 35) {
      return wordsAfter.replace(/[🏢🌿🏖️🔥📍💰✨👉.,]/g, '').trim();
    }
  }

  const hectMatch = clean.match(/(\d+\s*hect[aá]reas)/i);
  if (hectMatch) {
    const lugarMatch = clean.match(/en\s+([A-Za-zÁÉÍÓÚñáéíóú]{4,20})/i);
    const sufijo = lugarMatch ? ` en ${lugarMatch[1].trim()}` : '';
    return `${hectMatch[1].trim()}${sufijo}`.replace(/[🏢🌿🏖️🔥📍💰✨👉]/g, '').trim();
  }

  const promoMatch = clean.match(/\b(torre\s+[A-Za-z0-9ÁÉÍÓÚÑñ\s]{3,25}|condominio\s+[A-Za-z0-9ÁÉÍÓÚÑñ\s]{3,25}|edificio\s+[A-Za-z0-9ÁÉÍÓÚÑñ\s]{3,25}|urbanizaci[oó]n\s+[A-Za-z0-9ÁÉÍÓÚÑñ\s]{3,25}|parque\s+industrial[A-Za-z0-9ÁÉÍÓÚÑñ\s]{0,20})\b/i);
  if (promoMatch) {
    return promoMatch[0].replace(/[🏢🌿🏖️🔥📍💰✨👉]/g, '').trim();
  }

  const exclMatch = clean.match(/¡([^!]+)!/);
  if (exclMatch && exclMatch[1].length > 4 && exclMatch[1].length < 45) {
    return exclMatch[1].replace(/[🏢🌿🏖️🔥📍💰✨👉]/g, '').trim();
  }

  const firstSentence = clean.split(/[.\n\r!]/)[0].trim();
  if (firstSentence && firstSentence.length > 5 && firstSentence.length < 50) {
    return firstSentence.replace(/[🏢🌿🏖️🔥📍💰✨👉]/g, '').trim();
  }

  return 'la propiedad de nuestra publicación';
}

function handleGenericAdFlow(userId, rawMsg, lowerMsg, referralData, pushName, session, nomSaludo) {
  // A. Inversión
  if (lowerMsg.includes('inversion') || lowerMsg.includes('inversión') || lowerMsg.includes('invertir') || lowerMsg.includes('renta') || lowerMsg.includes('plusvalia') || lowerMsg.includes('plusvalía') || lowerMsg.includes('negocio') || lowerMsg.includes('retorno')) {
    session.state = 'AD_DISCUSSED';
    userFlowSessions.set(userId, session);
    const adTopic = session.adTopic || 'esta propiedad';
    return `¡Excelente visión de inversión${nomSaludo}! 📈 *${adTopic}* cuenta con un gran atractivo de plusvalía y retorno en su zona.\n\n` +
      `Para darte la información precisa, ¿te gustaría que coordinemos una visita presencial para conocerla esta semana, o prefieres que nuestro e-Realtor especialista te prepare la propuesta de rentabilidad y planos por aquí mismo? 🤝`;
  }

  // B. Vivienda familiar
  if (lowerMsg.includes('vivienda') || lowerMsg.includes('vivir') || lowerMsg.includes('familiar') || lowerMsg.includes('mi familia') || lowerMsg.includes('propio') || lowerMsg.includes('para mi')) {
    session.state = 'AD_DISCUSSED';
    userFlowSessions.set(userId, session);
    const adTopic = session.adTopic || 'esta propiedad';
    return `¡Excelente elección${nomSaludo}! 🏡 *${adTopic}* es una excelente opción para disfrutar en familia por su comodidad, seguridad y comodidades.\n\n` +
      `Será un verdadero gusto coordinar una visita presencial para que conozcas la propiedad en persona. ¿Qué día y horario te queda más cómodo (ej: *mañana por la tarde* o *este sábado por la mañana*)? 🤝`;
  }

  // C. Agendar visita
  if (lowerMsg.includes('visita') || lowerMsg.includes('agendar') || lowerMsg.includes('coordinar') || lowerMsg.includes('ir a ver') || lowerMsg.includes('verla') || lowerMsg.includes('conocerla')) {
    session.state = 'WAITING_VISIT_TIME';
    userFlowSessions.set(userId, session);
    const adTopic = session.adTopic || 'la propiedad';
    return `¡Con mucho gusto${nomSaludo}! 🤝✨\n\n` +
      `Será un placer coordinar tu visita presencial a *${adTopic}*.\n\n` +
      `¿Qué día y hora te queda más cómodo pasar? (Por ejemplo: *este sábado a las 10:00 am* o *mañana por la tarde*).\n\n` +
      `Nuestro e-Realtor de Realty ONE (+591 60937050) te enviará la ubicación exacta por GPS y te esperará en el lugar.`;
  }

  // D. Horario de visita
  const hasTimeIndicator = (
    lowerMsg.includes('lunes') || lowerMsg.includes('martes') || lowerMsg.includes('miercoles') || lowerMsg.includes('miércoles') ||
    lowerMsg.includes('jueves') || lowerMsg.includes('viernes') || lowerMsg.includes('sabado') || lowerMsg.includes('sábado') ||
    lowerMsg.includes('domingo') || lowerMsg.includes('mañana') || lowerMsg.includes('manana') || lowerMsg.includes('hoy') ||
    lowerMsg.includes('fin de semana') || lowerMsg.includes('a las') ||
    /\b\d{1,2}:\d{2}\b/.test(lowerMsg) || /\b\d{1,2}\s*(am|pm|hrs|de la)\b/i.test(lowerMsg)
  );

  if ((session.state === 'WAITING_VISIT_TIME' || session.state === 'AD_DISCUSSED') && hasTimeIndicator) {
    session.state = 'FINISHED';
    userFlowSessions.set(userId, session);
    const adTopic = session.adTopic || 'la propiedad';

    try {
      leadClassifier.trackAndClassifyLead(userId, rawMsg, `Visita confirmada para: ${adTopic}`, {
        campana: adTopic,
        canal: 'Facebook Ads (+591 60937050)',
        pushName: pushName,
        status: 'Visita Agendada',
        zonaInteres: adTopic
      }).catch(() => {});
    } catch (_) {}

    return `📅 *¡Perfecto${nomSaludo}! Cita agendada con éxito.* ✨\n\n` +
      `Te esperamos el *${rawMsg}* en *${adTopic}*.\n\n` +
      `El asesor de Realty ONE (+591 60937050) te enviará la ubicación exacta por GPS y te registrará el ingreso autorizado.\n\n` +
      `¡Muchas gracias y que tengas un excelente día! 🤝`;
  }

  // E. Fotos, planos o ficha técnica
  if (lowerMsg.includes('foto') || lowerMsg.includes('imagen') || lowerMsg.includes('plano') || lowerMsg.includes('precio') || lowerMsg.includes('cuanto') || lowerMsg.includes('ficha') || lowerMsg.includes('carpeta')) {
    const adTopic = session.adTopic || 'la propiedad';
    return `¡Con mucho gusto${nomSaludo}! 📁✨\n\n` +
      `Le estamos notificando a nuestro e-Realtor especialista de *${adTopic}* (+591 60937050) para que te envíe la carpeta digital con todos los detalles técnicos, planos y precios actualizados.\n\n` +
      `¿Deseas que te lo comparta directamente por este chat o prefieres una breve llamada explicativa? 📲`;
  }

  // F. Entrada inicial del anuncio
  const adTopic = extractAdPropertyTopic(referralData, rawMsg);
  session.state = 'AD_QUALIFYING';
  session.adTopic = adTopic;
  userFlowSessions.set(userId, session);

  const fullAdText = `${referralData?.body || ''} ${referralData?.headline || ''} ${rawMsg}`;
  const priceMatch = fullAdText.match(/(?:us\$|\$|bs\.?)\s*[\d.,]+(?:\s*por\s*hect[aá]rea)?/i);
  const precioTxt = priceMatch ? `\n💰 *Inversión anunciada:* ${priceMatch[0].trim()}` : '';

  try {
    leadClassifier.trackAndClassifyLead(userId, rawMsg, `Consulta de Anuncio: ${adTopic}`, {
      campana: adTopic,
      canal: 'Facebook Ads (+591 60937050)',
      pushName: pushName || referralData?.pushName || '',
      status: 'Nuevo',
      zonaInteres: adTopic
    }).catch(() => {});
  } catch (_) {}

  return `¡Hola${nomSaludo}! 👋 Gracias por comunicarte con *Realty ONE Group Bolivia* 🦁\n\n` +
    `Con gusto te comparto información y la ficha técnica sobre *${adTopic}* ✨${precioTxt}\n\n` +
    `Para que un asesor especializado te comparta todos los detalles y planos, cuéntame si buscas esta opción para inversión o vivienda propia, o si prefieres agendar una visita presencial. 🤝`;
}

// ---- Helpers de Catálogo y Gemini ----

function queryProperties({ tipo, operacion, ubicacion, minHabitaciones, search } = {}) {
  try {
    let rows = db.prepare('SELECT * FROM propiedades WHERE activo = 1').all();
    const op = (operacion || tipo || '').toLowerCase();
    if (op) {
      rows = rows.filter(p => {
        const pTipo = (p.tipo || '').toLowerCase();
        if (op.includes('anticret') || op.includes('anticr')) return pTipo.includes('anticret');
        if (op.includes('alquil') || op.includes('rent')) return pTipo.includes('alquil');
        if (op.includes('terren') || op.includes('lote')) return pTipo.includes('terren');
        if (op.includes('vent') || op.includes('compr')) return pTipo.includes('vent');
        return pTipo.includes(op);
      });
    }
    if (ubicacion) {
      const u = ubicacion.toLowerCase();
      rows = rows.filter(p => (p.ubicacion || '').toLowerCase().includes(u) || (p.titulo || '').toLowerCase().includes(u));
    }
    if (minHabitaciones && Number(minHabitaciones) > 0) {
      rows = rows.filter(p => Number(p.habitaciones || 0) >= Number(minHabitaciones));
    }
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(p =>
        (p.titulo || '').toLowerCase().includes(s) ||
        (p.descripcion_larga || '').toLowerCase().includes(s) ||
        (p.ubicacion || '').toLowerCase().includes(s)
      );
    }
    return rows.map(p => {
      let imagenes = [];
      try { imagenes = JSON.parse(p.imagenes || '[]'); } catch { imagenes = []; }
      return { ...p, imagenes };
    });
  } catch (error) {
    return [];
  }
}

function formatPropertiesForWhatsApp(properties) {
  if (!properties || properties.length === 0) {
    return 'Actualmente no encontré propiedades con esos filtros específicos, pero contamos con nuevas opciones ingresando a diario. ¿Te gustaría que un e-Realtor especialista te envíe opciones personalizadas?';
  }
  let text = `🏡 *Encontré las siguientes opciones disponibles en One Comsys:*\n\n`;
  properties.slice(0, 3).forEach((p, idx) => {
    text += `*${idx + 1}. ${p.titulo}*\n`;
    text += `📍 *Ubicación:* ${p.ubicacion}\n`;
    text += `💰 *Precio:* ${p.precio} (${p.tipo})\n`;
    if (p.habitaciones > 0) text += `🛏️ *Dormitorios:* ${p.habitaciones} | 🚿 *Baños:* ${p.banos}\n`;
    if (p.area) text += `📐 *Superficie:* ${p.area}\n`;
    text += `🔗 *Ficha digital:* propiedad.html?id=${p.id}\n\n`;
  });
  text += `━━━━━━━━━━━━━━━━━━━━\n¿Te gustaría que coordinemos una visita presencial para conocer alguna de estas opciones? 😊`;
  return text;
}

function generateERealtorAssignmentResponse(lead) {
  const realtorName = lead.e_realtor_asignado || 'Carlos Rodríguez';
  const realtorPhone = lead.e_realtor_telefono || '+591 70123456';
  const clientName = lead.cliente_nombre && lead.cliente_nombre !== 'Por identificar' ? lead.cliente_nombre : 'Estimado/a cliente';
  return `🎉 *¡DATOS REGISTRADOS CON ÉXITO!* 🦁✨\n\nHola *${clientName}*, tus datos han sido registrados en *One Comsys* con prioridad *🔥 PROSPECTO POTENCIAL*.\n\n👤 *e-Realtor Asignado:* *${realtorName}*\n📞 *Teléfono directo:* ${realtorPhone}\n\nTu asesor se comunicará contigo para coordinar el horario de visita.`;
}

async function callGeminiAI(userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const sampleProperties = queryProperties({});
    const contextData = sampleProperties.slice(0, 5).map(p => `[ID: ${p.id}] ${p.titulo} | Tipo: ${p.tipo} | Zona: ${p.ubicacion} | Precio: ${p.precio}`).join('\n');
    const prompt = `${SYSTEM_INSTRUCTION}\n\nCATÁLOGO:\n${contextData}\n\nHISTORIAL:\n${history.map(h => `${h.role}: ${h.text}`).join('\n')}\n\nMENSAJE:\n"${userMessage}"`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (_) {
    return null;
  }
}

async function callGeminiCampaignAI(campaign, userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const data = campaign.datos_inmueble || {};
    const ofi = campaign.oficina || {};
    const prompt = `Eres el e-Realtor oficial de "${ofi.nombre || 'Realty ONE Group Bolivia'}" atendiendo la campaña "${campaign.titulo_campana}".
DATOS: ${JSON.stringify(data)}
HISTORIAL: ${history.map(h => `${h.role}: ${h.text}`).join('\n')}
MENSAJE: "${userMessage}"
Instrucciones: Responde con cordialidad, formato WhatsApp (*negrita*, emojis) y promueve agendar una visita.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 }
      })
    });
    if (!response.ok) return null;
    const resData = await response.json();
    return resData.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (_) {
    return null;
  }
}

// ---- PROCESADOR PRINCIPAL (Mapeador Híbrido) ----

async function processUserMessage(userId, userMessage, referralOrPushName = null) {
  if (!userMessage || typeof userMessage !== 'string') return null;

  let pushName = '';
  let referralData = null;
  if (typeof referralOrPushName === 'string') {
    pushName = referralOrPushName;
  } else if (referralOrPushName && typeof referralOrPushName === 'object') {
    referralData = referralOrPushName;
    pushName = referralOrPushName.pushName || referralOrPushName.name || '';
  }

  const rawMsg = userMessage.trim();
  const lowerMsg = rawMsg.toLowerCase();
  const nomSaludo = pushName ? ` ${pushName}` : '';
  const history = getSessionHistory(userId);

  // Comando de reinicio
  if (lowerMsg === 'reiniciar' || lowerMsg === 'reset' || lowerMsg === 'inicio' || lowerMsg === 'menu' || lowerMsg === 'menú') {
    customerServiceSessions.delete(userId);
    userFlowSessions.delete(userId);
    conversationSessions.delete(userId);
  }

  // 1. EVALUAR SI ES UNA CAMPAÑA DE FACEBOOK ADS / ANUNCIO
  const hasAdKeywords = (
    lowerMsg.includes('fb.me') ||
    lowerMsg.includes('oportunidad') ||
    lowerMsg.includes('vi la publicidad') ||
    lowerMsg.includes('vi el anuncio') ||
    lowerMsg.includes('departamento de 4 dormitorios') ||
    lowerMsg.includes('mar adentro') ||
    lowerMsg.includes('westgate') ||
    lowerMsg.includes('buenavista') ||
    lowerMsg.includes('terreno industrial')
  );

  const hasNewAdReferral = Boolean(
    referralData?.body ||
    referralData?.headline ||
    referralData?.source_url
  );

  const isFacebookAd = Boolean(
    hasNewAdReferral ||
    (rawMsg.includes('Quiero más información') && hasNewAdReferral) ||
    hasAdKeywords
  );

  // Reiniciar sesión previa de anuncio si el cliente saluda o pide un agente/atención general
  const isOrganicStart = /^(hola|buen[ao]s|saludos|inicio|comenzar|empezar|hi|hello|un agente|asesor|agente)\b/i.test(lowerMsg);
  if (isOrganicStart && !hasNewAdReferral) {
    userFlowSessions.delete(userId);
    if (customerServiceSessions.has(userId) && customerServiceSessions.get(userId).state === 'ESTADO_5_FAREWELL') {
      customerServiceSessions.delete(userId);
    }
  }

  const isInCustomerService = customerServiceSessions.has(userId) &&
    customerServiceSessions.get(userId).state !== 'ESTADO_1_GREETING';

  const matchedCamp = (!isInCustomerService || isFacebookAd)
    ? campaignService.matchCampaign(userId, userMessage, referralData)
    : null;

  // Si entra un nuevo anuncio explícito (referralData con body o headline), actualizar/limpiar la campaña previa
  if (hasNewAdReferral && userFlowSessions.has(userId)) {
    const s = userFlowSessions.get(userId);
    s.lastCampaign = matchedCamp || null;
    userFlowSessions.set(userId, s);
  }

  const isAlreadyInAdSession = userFlowSessions.has(userId) && ['AD_QUALIFYING', 'WAITING_VISIT_TIME', 'AD_DISCUSSED', 'AD_CAMPAIGN_ACTIVE'].includes(userFlowSessions.get(userId)?.state);
  const activeCampaign = matchedCamp || (isAlreadyInAdSession ? userFlowSessions.get(userId)?.lastCampaign : null);

  // A. FLUJO DE ANUNCIOS Y PUBLICACIONES DE FACEBOOK ADS
  if ((activeCampaign || isFacebookAd || isAlreadyInAdSession) && !isInCustomerService && !isOrganicStart) {
    if (activeCampaign) {
      const session = userFlowSessions.get(userId) || { state: 'AD_CAMPAIGN_ACTIVE' };
      session.state = 'AD_CAMPAIGN_ACTIVE';
      session.lastCampaign = activeCampaign;
      userFlowSessions.set(userId, session);

      // Si envía datos de contacto dentro del embudo de la campaña
      const hasEmail = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/i.test(rawMsg);
      const hasCommaData = rawMsg.split(',').length >= 3 && (/\d{7,}/.test(rawMsg) || hasEmail);
      if (hasEmail || hasCommaData) {
        try {
          leadClassifier.trackAndClassifyLead(userId, rawMsg, `Campaña: ${activeCampaign.titulo_campana}`, {
            campana: activeCampaign.titulo_campana,
            canal: 'WhatsApp Ads (+591 60937050)',
            pushName: pushName || referralData?.pushName || '',
            status: 'Visita Agendada',
            zonaInteres: activeCampaign.titulo_campana
          }).catch(() => {});
        } catch (_) {}
      }

      // Respuesta local especializada de la campaña
      const localResp = campaignService.generateCampaignResponse(activeCampaign, userMessage, userId, pushName || referralData?.pushName);
      history.push({ role: 'user', text: rawMsg });
      history.push({ role: 'model', text: localResp });
      return localResp;
    }

    // Anuncios dinámicos no registrados en campaigns.json (ej: Westgate Tower, Buenavista, etc.)
    const session = userFlowSessions.get(userId) || { state: 'NEW' };
    const genericAdResp = handleGenericAdFlow(userId, rawMsg, lowerMsg, referralData, pushName, session, nomSaludo);
    if (genericAdResp) {
      history.push({ role: 'user', text: rawMsg });
      history.push({ role: 'model', text: genericAdResp });
      return genericAdResp;
    }
  }

  // 2. CONSULTAS ESPECÍFICAS DE ZONA (Ej: "zona sur" en test_campaign_accuracy.js)
  if (lowerMsg.includes('zona sur') || lowerMsg.includes('zona norte') || lowerMsg.includes('equipetrol') || lowerMsg.includes('urubo') || lowerMsg.includes('urubó')) {
    const session = userFlowSessions.get(userId) || { state: 'CHATTING' };
    session.state = 'CHATTING';
    userFlowSessions.set(userId, session);

    const zonaNombre = lowerMsg.includes('zona sur') ? 'Zona Sur' : lowerMsg.includes('zona norte') ? 'Zona Norte' : lowerMsg.includes('equipetrol') ? 'Equipetrol' : 'Urubó';
    return `¡Hola${nomSaludo}! Con mucho gusto te oriento sobre las opciones disponibles en la *${zonaNombre}* de Santa Cruz. 🦁\n\n` +
      `Contamos con excelentes casas, departamentos y terrenos residenciales en esta zona. ¿Buscas para compra, alquiler o anticrético? 🤝`;
  }

  // 3. RESPUESTAS A AGRADECIMIENTO TRAS CONSULTA
  if (
    lowerMsg === 'gracias' || lowerMsg === 'muchas gracias' || lowerMsg === 'muchas gracias!' ||
    lowerMsg.startsWith('gracias') || lowerMsg.includes('muchas gracias') || lowerMsg === 'ok gracias'
  ) {
    if (userFlowSessions.has(userId)) {
      const s = userFlowSessions.get(userId);
      s.state = 'FINISHED';
      userFlowSessions.set(userId, s);
    }
    return `¡A ti${nomSaludo}! 🦁 Ha sido un verdadero placer ayudarte. Quedamos a tu completa disposición para lo que necesites en *Realty ONE Group Bolivia*. ¡Que tengas un excelente día! ✨`;
  }

  // 4. MÁQUINA DE ESTADOS: ASISTENTE VIRTUAL DE ATENCIÓN AL CLIENTE (CANAL ORGÁNICO / GENERAL)
  const csSession = getCustomerServiceSession(userId, pushName);
  const nameFarewell = csSession.clientName ? ` ${csSession.clientName}` : '';

  // ESTADO 1: Saludo Inicial
  if (csSession.state === 'ESTADO_1_GREETING') {
    csSession.state = 'ESTADO_2_DATA';
    return csSession.clientName
      ? `¡Hola ${csSession.clientName}! 👋 Soy tu asistente virtual de *Realty ONE Group Bolivia* 🦁\n\n¿En qué puedo ayudarte hoy? 😊`
      : '¡Hola! 👋 Soy tu asistente virtual de *Realty ONE Group Bolivia* 🦁\n\n¿En qué puedo ayudarte hoy? 😊';
  }

  // ESTADO 2: Respuesta a consulta del cliente + Solicitud de Datos Principales
  if (csSession.state === 'ESTADO_2_DATA') {
    if (!csSession.dataRequested) {
      csSession.dataRequested = true;

      // Respuestas abiertas y orientativas sin listas
      let tailoredIntro = '';
      if (lowerMsg.includes('agente') || lowerMsg.includes('asesor') || lowerMsg.includes('humano') || lowerMsg.includes('persona')) {
        tailoredIntro = '¡Con mucho gusto! 🤝 ';
      } else if (lowerMsg.includes('departamento') || lowerMsg.includes('dpto') || lowerMsg.includes('casa') || lowerMsg.includes('condominio')) {
        tailoredIntro = '¡Excelente opción residencial! 🏢✨ ';
      } else if (lowerMsg.includes('terreno') || lowerMsg.includes('lote') || lowerMsg.includes('industrial') || lowerMsg.includes('g77')) {
        tailoredIntro = '¡Excelente oportunidad de inversión y plusvalía! 🌿📐 ';
      } else if (lowerMsg.includes('alquiler') || lowerMsg.includes('alquilar') || lowerMsg.includes('anticretico') || lowerMsg.includes('anticrético')) {
        tailoredIntro = '¡Con gusto te asesoramos con las mejores opciones y respaldo legal en Bolivia! 🔑📑 ';
      } else if (lowerMsg.includes('vender') || lowerMsg.includes('consignar') || lowerMsg.includes('propietario')) {
        tailoredIntro = '¡Excelente decisión! Te ayudamos a promocionar tu propiedad con la red de Realty ONE. 💼🌟 ';
      }

      return `${tailoredIntro}Para que un agente especializado se contacte contigo, por favor compárteme tu número de teléfono, correo electrónico y ciudad. 📲`;
    }

    // Regla 4: Manejo de objeciones / negativa
    if (isRefusal(rawMsg)) {
      if (csSession.refusalCount === 0) {
        csSession.refusalCount = 1;
        return 'Son indispensables para que un agente especializado pueda atender tu solicitud. 🤝 Por favor compárteme tu número de teléfono, correo electrónico y ciudad.';
      } else {
        csSession.state = 'ESTADO_5_FAREWELL';
        return `Puedes comunicarte directamente por teléfono cuando gustes. ¡Hasta luego${nameFarewell}! Cualquier duda o inquietud no dude en llamar. 📞🤝`;
      }
    }

    // Extraer datos presentes en la respuesta
    const phone = extractPhone(rawMsg);
    const email = extractEmail(rawMsg);
    const city = extractCity(rawMsg);

    if (phone) csSession.phone = phone;
    if (email) csSession.email = email;
    if (city) csSession.city = city;

    // Regla 3: Validación de datos faltantes
    const missing = [];
    if (!csSession.phone) missing.push('tu número de teléfono');
    if (!csSession.email) missing.push('tu correo electrónico');
    if (!csSession.city) missing.push('tu ciudad');

    if (missing.length > 0) {
      let promptFaltantes = '';
      if (missing.length === 3) {
        promptFaltantes = 'tu número de teléfono, correo electrónico y ciudad';
      } else if (missing.length === 2) {
        promptFaltantes = `${missing[0]} y ${missing[1]}`;
      } else {
        promptFaltantes = missing[0];
      }
      return `Por favor compárteme amablemente ${promptFaltantes} antes de continuar. 😊`;
    }

    // Todos los datos están completos -> Avanzar a Estado 3
    csSession.state = 'ESTADO_3_SCHEDULING';

    try {
      leadClassifier.trackAndClassifyLead(userId, rawMsg, 'Datos de contacto recopilados', {
        campana: 'Atención al Cliente',
        canal: 'WhatsApp (+591 60937050)',
        pushName: csSession.clientName,
        status: 'Datos Completos',
        telefono: csSession.phone,
        email: csSession.email,
        ciudad: csSession.city
      }).catch(() => {});
    } catch (_) {}

    return 'Si tienes clara tu decisión, ¿quieres agendar una visita? 🗓️ (Por favor indícame día, fecha y hora, por ejemplo: Lunes 15 de marzo a las 10:00 AM). 🤝';
  }

  // ESTADO 3: Agendamiento
  if (csSession.state === 'ESTADO_3_SCHEDULING') {
    if (isNegativeScheduling(rawMsg)) {
      csSession.state = 'ESTADO_5_FAREWELL';
      return `¡Muchas gracias por comunicarte con nosotros${nameFarewell}! 😊 Estaremos atentos para cuando lo decidas. Cualquier duda o inquietud no dude en llamar. 📞🤝`;
    }

    const isValidDate = validateSchedulingDate(rawMsg);
    if (!isValidDate) {
      return 'Por favor indícame el día de la semana, la fecha exacta y la hora de tu visita (por ejemplo: Lunes 15 de marzo a las 10:00 AM). 🗓️';
    }

    csSession.scheduledVisit = rawMsg;
    csSession.state = 'ESTADO_4_REMINDER';

    try {
      leadClassifier.trackAndClassifyLead(userId, rawMsg, `Visita: ${rawMsg}`, {
        campana: 'Visita Agendada',
        canal: 'WhatsApp (+591 60937050)',
        pushName: csSession.clientName,
        status: 'Visita Agendada',
        horarioVisita: rawMsg
      }).catch(() => {});
    } catch (_) {}

    return '¡Muchas gracias por tu agendamiento! 📅✨ ¿Quieres que te recuerde un día antes de tu visita? 🔔';
  }

  // ESTADO 4: Recordatorio (Condicional)
  if (csSession.state === 'ESTADO_4_REMINDER') {
    csSession.reminderChoice = rawMsg;
    csSession.state = 'ESTADO_5_FAREWELL';
    return `¡Muchas gracias por tu tiempo${nameFarewell}! 🦁 Un agente especializado se pondrá en contacto contigo para coordinar todos los detalles de tu visita. Cualquier duda o inquietud no dude en llamar. 📞🤝`;
  }

  // ESTADO 5: Despedida
  if (csSession.state === 'ESTADO_5_FAREWELL') {
    return `¡Hasta luego${nameFarewell}! Cualquier duda o inquietud no dude en llamar. 📞🤝`;
  }

  return null;
}

module.exports = {
  processUserMessage,
  queryProperties,
  formatPropertiesForWhatsApp,
  generateERealtorAssignmentResponse,
  callGeminiAI,
  callGeminiCampaignAI,
  SYSTEM_INSTRUCTION
};
