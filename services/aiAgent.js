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
 *    - 5 Estados (1. Saludo, 2. Interés -> Pedir datos, 3. Recopilar datos, 4. Agendamiento, 5. Recordatorio, 6. Despedida).
 *    - 6 Reglas estrictas:
 *      1. Sin listas de opciones ni menús ni viñetas. Preguntas abiertas y libres.
 *      2. Flujo secuencial paso a paso estricto.
 *      3. Validación de datos: teléfono, correo y ciudad antes de agendar.
 *      4. Manejo de objeciones a compartir datos.
 *      5. Validación de fecha: día de la semana, fecha exacta y hora.
 *      6. Tono cordial y directo con frase obligatoria de despedida: "Cualquier duda o inquietud no dude en llamar."
 */

const db = require('../database');
const campaignService = require('./campaignService');
const leadClassifier = require('./leadClassifier');

const SYSTEM_INSTRUCTION = `
Eres ONEBot, asistente virtual de atención al cliente de Realty ONE Group Bolivia.
Tu objetivo es atender consultas sobre compra, alquiler y anticrético de propiedades en Santa Cruz de la Sierra y Urubó, asesorar sobre publicaciones de Facebook Ads, recopilar datos de contacto calificados y agendar visitas presenciales.
Reglas:
- Trato cordial, profesional y directo.
- En atención general sin anuncio previo, recopila teléfono, correo y ciudad antes de agendar y finaliza con: "Cualquier duda o inquietud no dude en llamar."
`;

// ── Sesiones (TTL 24h, máx 500) ─────────────────────────────────────────────
const MAX_SESSIONS = 500;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Sesiones de Atención al Cliente (Orgánicas)
const sessions = new Map();

// Sesiones de Campañas / Facebook Ads
const userFlowSessions = new Map();

// Historial para Gemini
const conversationSessions = new Map();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions.entries()) {
    if (now - v.lastActivity > SESSION_TTL_MS) sessions.delete(k);
  }
  for (const [k, v] of userFlowSessions.entries()) {
    if (now - v.lastActivity > SESSION_TTL_MS) userFlowSessions.delete(k);
  }
  for (const [k, v] of conversationSessions.entries()) {
    if (now - v.lastActivity > SESSION_TTL_MS) conversationSessions.delete(k);
  }
}, 60 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

function getSession(userId, pushName = '') {
  if (!sessions.has(userId)) {
    if (sessions.size >= MAX_SESSIONS) {
      sessions.delete(sessions.keys().next().value);
    }
    const name = (pushName && pushName !== 'Cliente' && pushName !== 'Por identificar')
      ? pushName.trim() : '';
    sessions.set(userId, {
      state: 'ESTADO_1_GREETING',
      clientName: name,
      interestMsg: '',
      phone: null,
      email: null,
      city: null,
      dataRequested: false,
      refusalCount: 0,
      scheduledVisit: null,
      lastActivity: Date.now()
    });
  }
  const s = sessions.get(userId);
  if (pushName && pushName !== 'Cliente' && !s.clientName) {
    s.clientName = pushName.trim();
  }
  s.lastActivity = Date.now();
  return s;
}

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

// ── Extractores y Validadores ───────────────────────────────────────────────
function extractPhone(text) {
  const m = text.match(/(?:\+?591\s*)?[67]\d{7}\b|\b\d{7,15}\b/);
  return m ? m[0].replace(/\s+/g, '') : null;
}

function extractEmail(text) {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].trim() : null;
}

function isRefusal(text) {
  const lo = text.toLowerCase().trim();
  const patterns = [
    /\bno\s+(?:los\s+|mis\s+)?(?:quiero|voy|dar[eé]|dar|te\s+doy|deseo|pienso)\b/,
    /\bprefiero\s+no\b/,
    /\bpor\s+qu[eé]\s+(tengo|debo|quieren)\b/,
    /\bpara\s+qu[eé]\s+quieren\b/,
    /\bsin\s+dar\s+datos\b/,
    /\bno\s+doy\s+(mis\s+)?datos\b/,
    /\bno\s+insistas\b/,
    /\bdije\s+que\s+no\b/,
    /\bno\s+quiero\s+dar\s+mis\s+datos\b/
  ];
  if (patterns.some(p => p.test(lo))) return true;
  return ['no', 'no quiero', 'no gracias', 'no los daré', 'no los dare'].includes(lo);
}

function extractFullName(text) {
  if (!text || isRefusal(text)) return null;
  const cities = [
    'santa cruz', 'la paz', 'cochabamba', 'tarija', 'sucre', 'oruro',
    'potosi', 'potosí', 'beni', 'trinidad', 'pando', 'cobija', 'montero',
    'warnes', 'urubo', 'urubó', 'el alto', 'quillacollo', 'sacaba',
    'yacuiba', 'riberalta'
  ];
  // 1. Patrón explícito "mi nombre es X", "me llamo X", "soy X"
  const m = text.match(/(?:mi nombre es|me llamo|soy)\s+([A-Za-zÁÉÍÓÚÑñáéíóú\s]{3,35})/i);
  if (m) {
    const cand = m[1].trim();
    if (!extractEmail(cand) && !extractPhone(cand)) {
      return cand.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }
  // 2. Campo separado por coma / punto y coma / salto de línea
  const parts = text.split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
  for (const p of parts) {
    if (extractEmail(p) || extractPhone(p)) continue;
    const pLo = p.toLowerCase();
    if (cities.some(c => pLo === c || pLo === `en ${c}` || pLo === `de ${c}`)) continue;
    // Si contiene al menos 2 palabras (nombre y apellido) con solo letras
    if (/^[A-Za-zÁÉÍÓÚÑñáéíóú\s.'-]+$/.test(p) && p.length >= 4 && p.length <= 40) {
      const words = p.split(/\s+/).filter(w => w.length >= 2);
      if (words.length >= 2) {
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }
  return null;
}

function extractCity(text) {
  if (isRefusal(text)) return null;
  const cities = [
    'santa cruz', 'la paz', 'cochabamba', 'tarija', 'sucre', 'oruro',
    'potosi', 'potosí', 'beni', 'trinidad', 'pando', 'cobija', 'montero',
    'warnes', 'urubo', 'urubó', 'el alto', 'quillacollo', 'sacaba',
    'yacuiba', 'riberalta'
  ];
  const lower = text.toLowerCase();
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(lower)) {
      return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  // Patrón "vivo en X"
  const vm = text.match(/(?:vivo en|ciudad de|desde|en la ciudad de|de la ciudad de|en)\s+([A-Za-zÁÉÍÓÚñáéíóú\s]{3,20})/i);
  if (vm && !/(?:lunes|martes|mi[eé]rcoles|miercoles|jueves|viernes|s[aá]bado|sabado|domingo|gmail|hotmail)/i.test(vm[1])) {
    return vm[1].trim();
  }
  // Tercer campo separado por coma/punto y coma que no sea email, teléfono ni nombre de 2+ palabras
  for (const p of text.split(/[,;\n]/).map(x => x.trim()).filter(Boolean)) {
    if (!extractEmail(p) && !extractPhone(p) && p.length >= 3 && p.length <= 30 && !/\d{4}/.test(p)) {
      if (p.split(/\s+/).length >= 2 && !cities.some(c => p.toLowerCase().includes(c))) {
        continue;
      }
      return p;
    }
  }
  return null;
}

function isNegative(text) {
  const lo = text.toLowerCase().trim();
  if (/\b(lunes|martes|mi[eé]rcoles|miercoles|jueves|viernes|s[aá]bado|sabado|domingo)\b/i.test(lo)) return false;
  if (/\b(no hay problema|no te preocupes|no pasa nada)\b/i.test(lo)) return false;
  return /\b(no|no gracias|todav[ií]a no|a[uú]n no|por ahora no|por el momento no|paso|m[aá]s adelante|despu[eé]s|ninguna|prefiero no|no quiero|no deseo)\b/i.test(lo);
}

function hasValidDate(text) {
  const lo = text.toLowerCase();
  const day  = /(lunes|martes|mi[eé]rcoles|miercoles|jueves|viernes|s[aá]bado|sabado|domingo)/i.test(lo);
  const date = /\b\d{1,2}\s+(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/i.test(lo)
            || /\b\d{1,2}[\/\-]\d{1,2}([\/-]\d{2,4})?\b/.test(lo)
            || /\b(el\s+)?\d{1,2}\b/.test(lo);
  const hour = /\b\d{1,2}(:\d{2})?\s*(am|pm|hrs|horas|h)\b/i.test(lo)
            || /a\s+las\s+\d{1,2}/i.test(lo)
            || /\b\d{1,2}:\d{2}\b/.test(lo)
            || /\b\d{1,2}\s*(de la ma[nñ]ana|de la tarde|de la noche)\b/i.test(lo);
  return day && date && hour;
}

function getTopicDisposicion(text) {
  const lo = (text || '').toLowerCase();
  if (lo.includes('vender') || lo.includes('consignar')) {
    return 'asesoría y comercialización para vender su propiedad';
  }
  if (lo.includes('anticretico') || lo.includes('anticrético')) {
    return 'opciones en anticrético';
  }
  if (lo.includes('alquiler') || lo.includes('alquilar')) {
    if (lo.includes('casa')) return 'casas en alquiler';
    if (lo.includes('departamento') || lo.includes('dpto') || lo.includes('condominio')) return 'departamentos en alquiler';
    return 'excelentes opciones en alquiler';
  }
  if (lo.includes('terreno') || lo.includes('lote') || lo.includes('industrial')) {
    return 'terrenos y lotes disponibles';
  }
  if (lo.includes('casa')) {
    if (lo.includes('venta') || lo.includes('comprar')) return 'casas en venta';
    return 'hermosas casas disponibles';
  }
  if (lo.includes('departamento') || lo.includes('dpto') || lo.includes('condominio')) {
    if (lo.includes('venta') || lo.includes('comprar')) return 'departamentos en venta';
    return 'departamentos disponibles';
  }
  if (lo.includes('venta') || lo.includes('comprar') || lo.includes('compra')) {
    return 'propiedades en venta';
  }
  return 'excelentes opciones';
}

// ── Manejadores de Campañas y Anuncios Dinámicos ────────────────────────────
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

  const words = clean.split(/\s+/).slice(0, 5).join(' ');
  return words ? words.replace(/[🏢🌿🏖️🔥📍💰✨👉.,]/g, '').trim() : 'la propiedad de nuestra publicación';
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
    `Para conectarte con el e-Realtor especialista y brindarte la mejor asesoría, cuéntame:\n\n` +
    `1. 🎯 *¿Buscas esta opción para uso propio / familiar o como inversión?*\n` +
    `2. 📅 *¿Te gustaría que coordinemos una visita presencial para conocerla esta semana, o prefieres que te enviemos la carpeta técnica y planos?* 🤝`;
}

// ── Helpers de catálogo y Gemini ────────────────────────────────────────────
function queryProperties({ tipo, operacion, ubicacion, minHabitaciones, search } = {}) {
  try {
    let rows = db.prepare('SELECT * FROM propiedades WHERE activo = 1').all();
    const op = (operacion || tipo || '').toLowerCase();
    if (op) {
      rows = rows.filter(p => {
        const pt = (p.tipo || '').toLowerCase();
        if (op.includes('anticret')) return pt.includes('anticret');
        if (op.includes('alquil') || op.includes('rent')) return pt.includes('alquil');
        if (op.includes('terren') || op.includes('lote')) return pt.includes('terren');
        if (op.includes('vent') || op.includes('compr')) return pt.includes('vent');
        return pt.includes(op);
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
  } catch { return []; }
}

function formatPropertiesForWhatsApp(properties) {
  if (!properties || properties.length === 0) {
    return 'No encontré propiedades con esos filtros en este momento, pero contamos con nuevas opciones ingresando a diario. ¿Quieres que un agente te envíe opciones personalizadas?';
  }
  let text = '🏡 *Opciones disponibles en One Comsys:*\n\n';
  properties.slice(0, 3).forEach((p, idx) => {
    text += `*${idx + 1}. ${p.titulo}*\n📍 ${p.ubicacion} | 💰 ${p.precio} (${p.tipo})\n`;
    if (p.habitaciones > 0) text += `🛏️ ${p.habitaciones} dorm | 🚿 ${p.banos} baños\n`;
    if (p.area) text += `📐 ${p.area}\n`;
    text += `🔗 propiedad.html?id=${p.id}\n\n`;
  });
  return text;
}

function generateERealtorAssignmentResponse(lead) {
  const clientName = lead.cliente_nombre && lead.cliente_nombre !== 'Por identificar'
    ? lead.cliente_nombre : 'Estimado/a cliente';
  return `🎉 *¡Datos registrados!* 🦁✨\n\nHola *${clientName}*, tus datos han sido registrados exitosamente. Un agente especializado se pondrá en contacto contigo a la brevedad.`;
}

async function callGeminiAI(userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const sampleProperties = queryProperties({});
    const ctx = sampleProperties.slice(0, 5).map(p =>
      `[ID: ${p.id}] ${p.titulo} | ${p.tipo} | ${p.ubicacion} | ${p.precio}`
    ).join('\n');
    const prompt = `${SYSTEM_INSTRUCTION}\n\nCATÁLOGO:\n${ctx}\n\nHISTORIAL:\n${history.map(h => `${h.role}: ${h.text}`).join('\n')}\n\nMENSAJE:\n"${userMessage}"`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 600 } }) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch { return null; }
}

async function callGeminiCampaignAI(campaign, userMessage, history = []) {
  return callGeminiAI(userMessage, history);
}

// ── PROCESADOR PRINCIPAL (Enrutamiento Híbrido Inteligente) ───────────────────

async function processUserMessage(userId, userMessage, referralOrPushName = null, extraPushName = null) {
  if (!userMessage || typeof userMessage !== 'string') return null;

  // Extraer pushName y referralData
  let pushName = '';
  let referralData = null;
  if (typeof extraPushName === 'string' && extraPushName.trim()) {
    pushName = extraPushName.trim();
  }
  if (referralOrPushName && typeof referralOrPushName === 'object') {
    referralData = referralOrPushName;
    if (!pushName) pushName = referralOrPushName.pushName || referralOrPushName.name || '';
  } else if (typeof referralOrPushName === 'string' && !pushName) {
    pushName = referralOrPushName.trim();
  }

  const raw = userMessage.trim();
  const lo  = raw.toLowerCase();
  const history = getSessionHistory(userId);

  // Comando de reinicio
  if (['reiniciar', 'reset', 'inicio', 'menu', 'menú'].includes(lo)) {
    sessions.delete(userId);
    userFlowSessions.delete(userId);
    conversationSessions.delete(userId);
  }

  const s = getSession(userId, pushName);

  // REGLA: "Una ves te despediste no responde a nada de lo que te escriba."
  if (s.state === 'ESTADO_6_FAREWELL') {
    return null;
  }

  // Actualizar nombre si viene en pushName y no lo teníamos
  if (pushName && (!s.clientName || s.clientName === 'Cliente' || s.clientName === 'Por identificar')) {
    s.clientName = pushName.trim();
  }
  let name = s.clientName ? ` ${s.clientName}` : '';
  let nom  = s.clientName || '';

  // Detección de saludo general
  const isGreeting = (
    lo === 'hola' || lo === '¡hola!' || lo === 'hola!' || lo === 'buenas' ||
    lo === 'buenas tardes' || lo === 'buenos dias' || lo === 'buenos días' ||
    lo === 'buenas noches' || lo === 'ola' || lo === 'hi' || lo === 'hello'
  );

  // ── ESTADO 1: Saludo inicial ──────────────────────────────────────────────
  if (s.state === 'ESTADO_1_GREETING') {
    s.state = 'ESTADO_2_INTEREST';
    return `¡Hola${name}! 👋😊 Soy tu asistente de Realty ONE Group Bolivia 🦁\n\n¿En qué puedo ayudarte?`;
  }

  // ── ESTADO 2: Consulta del cliente (Interés / Opciones o Venta) ─────────────
  if (s.state === 'ESTADO_2_INTEREST') {
    s.interestMsg = raw;
    s.state = 'ESTADO_3_DATA';

    const isSelling = (
      lo.includes('vender') || lo.includes('consignar') ||
      lo.includes('captacion') || lo.includes('captación') ||
      lo.includes('poner en venta') || lo.includes('vender mi') ||
      lo.includes('quiero vender') || lo.includes('tengo una casa') ||
      lo.includes('tengo un dpto') || lo.includes('tengo un departamento') ||
      lo.includes('tengo un terreno') || lo.includes('tengo un lote') ||
      lo.includes('tengo un monoambiente')
    );

    if (isSelling) {
      return `¡Con mucho gusto te ayudamos con la venta de tu propiedad! 🏡✨ Para tener una idea más clara, ¿en qué zona y en qué departamento se encuentra? Y si es casa, lote o terreno, por favor describe cómo es (dimensiones y ambientes). Además, para que un agente especializado te contacte, por favor dame tu nombre y apellido, tu número de teléfono o whatsapp, tu correo electrónico y ciudad. 📲`;
    }

    // Cliente busca casa, departamento, terreno, lote, monoambiente (comprar, alquilar, anticrético) o anuncio
    return `¡Sí, tenemos a disposición excelentes opciones! 🏡✨ En breve un agente especializado se pondrá en contacto contigo. Para coordinarlo, por favor dame tu nombre y apellido, tu número de teléfono o whatsapp, tu correo electrónico y ciudad. 📲`;
  }

  // ── ESTADO 3: Recopilar datos personales ──────────────────────────────────
  if (s.state === 'ESTADO_3_DATA') {
    // Si se niega a dar datos
    if (isRefusal(raw)) {
      if (s.refusalCount === 0) {
        s.refusalCount = 1;
        return `Son indispensables para que un agente especializado pueda contactarte y atender tu solicitud. 🤝 Por favor dame tu nombre y apellido, tu número de teléfono o whatsapp, tu correo electrónico y ciudad. 📲`;
      } else {
        s.state = 'ESTADO_6_FAREWELL';
        return `Puedes comunicarte directamente por teléfono cuando gustes. ¡Hasta luego${name}! Cualquier duda o inquietud no dude en llamar. 📞🤝`;
      }
    }

    // Extraer datos
    const phone = extractPhone(raw);
    const email = extractEmail(raw);
    const city  = extractCity(raw);
    const fullName = extractFullName(raw);
    if (phone) s.phone = phone;
    if (email) s.email = email;
    if (city)  s.city  = city;
    if (fullName) {
      s.clientName = fullName;
      name = ` ${s.clientName}`;
      nom = s.clientName;
    }

    // Si también envió el agendamiento completo de visita en el mismo mensaje
    if (hasValidDate(raw)) {
      s.scheduledVisit = raw;
      s.state = 'ESTADO_5_REMINDER';
      try {
        leadClassifier.trackAndClassifyLead(userId, raw, `Visita: ${raw}`, {
          campana: s.interestMsg || 'Atención al Cliente',
          canal: 'WhatsApp (+591 60937050)',
          pushName: s.clientName,
          status: 'Visita Agendada',
          telefono: s.phone,
          email: s.email,
          ciudad: s.city,
          horarioVisita: raw
        }).catch(() => {});
      } catch (_) {}
      return `¡Muchas gracias por tu agendamiento${name}! 🎉📅 ¿Quieres que te recuerde un día antes de tu visita? 🔔`;
    }

    // Datos principales recopilados -> Pasa a agendamiento
    s.state = 'ESTADO_4_SCHEDULE';
    try {
      leadClassifier.trackAndClassifyLead(userId, raw, 'Datos recopilados', {
        campana: s.interestMsg || 'Atención al Cliente',
        canal: 'WhatsApp (+591 60937050)',
        pushName: s.clientName,
        status: 'Datos Completos',
        telefono: s.phone,
        email: s.email,
        ciudad: s.city
      }).catch(() => {});
    } catch (_) {}

    return `¡Perfecto${name}! 🎉 Ya tengo tus datos principales. Si ya tienes clara tu decisión, ¿quieres agendar una visita? 🗓️ (Por favor indícame día, fecha y hora). 🤝`;
  }

  // ── ESTADO 4: Agendamiento de visita ──────────────────────────────────────
  if (s.state === 'ESTADO_4_SCHEDULE') {
    // Si no quiere visita / responde negativamente
    if (isNegative(raw)) {
      s.state = 'ESTADO_6_FAREWELL';
      return `¡Muchas gracias por habernos elegido y por comunicarte con nosotros${name}! 😊 Estaremos atentos para cuando lo decidas. Cualquier duda o inquietud no dude en llamar. 📞🤝`;
    }

    // Si responde pero no da día, fecha y hora exacta
    if (!hasValidDate(raw)) {
      return `Por favor indícame el día de la semana, la fecha exacta y la hora de tu visita (por ejemplo: Lunes 15 de marzo a las 10:00 AM). 🗓️`;
    }

    // Agendamiento con fecha y hora completa
    s.scheduledVisit = raw;
    s.state = 'ESTADO_5_REMINDER';
    try {
      leadClassifier.trackAndClassifyLead(userId, raw, `Visita: ${raw}`, {
        campana: s.interestMsg || 'Visita Agendada',
        canal: 'WhatsApp (+591 60937050)',
        pushName: s.clientName,
        status: 'Visita Agendada',
        horarioVisita: raw
      }).catch(() => {});
    } catch (_) {}

    return `¡Muchas gracias por tu agendamiento${name}! 🎉📅 ¿Quieres que te recuerde un día antes de tu visita? 🔔`;
  }

  // ── ESTADO 5: Recordatorio ────────────────────────────────────────────────
  if (s.state === 'ESTADO_5_REMINDER') {
    s.reminderChoice = raw;
    s.state = 'ESTADO_6_FAREWELL';
    return `¡Muchas gracias por tu tiempo${name}! 🦁✨ Un agente especializado se pondrá en contacto contigo para coordinar todos los detalles de tu visita. Cualquier duda o inquietud no dude en llamar. 📞🤝`;
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
