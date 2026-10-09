/**
 * Chatbot Realty ONE Group Bolivia
 * FLUJO ÚNICO — 5 estados, sin listas, sin nombre de asesor
 *
 * ESTADO_1_GREETING  → Saludo + "¿En qué puedo ayudarte?"
 * ESTADO_2_INTEREST  → Escucha lo que quiere el cliente, luego pide datos
 * ESTADO_3_DATA      → Recopila teléfono, email y ciudad
 * ESTADO_4_SCHEDULE  → Pregunta si quiere agendar visita (día, fecha, hora)
 * ESTADO_5_REMINDER  → Pregunta si quiere recordatorio un día antes
 * ESTADO_6_FAREWELL  → Despedida con frase obligatoria
 */

const db = require('../database');
const campaignService = require('./campaignService');
const leadClassifier = require('./leadClassifier');

const SYSTEM_INSTRUCTION = `
Eres ONEBot, asistente virtual de Realty ONE Group Bolivia.
Flujo: saludo → escuchar → pedir datos → agendar visita → recordatorio → despedida.
Tono: cordial, profesional, energético, humano.
`;

// ── Sesiones (TTL 24h, máx 500) ─────────────────────────────────────────────
const MAX_SESSIONS = 500;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessions = new Map();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions.entries()) {
    if (now - v.lastActivity > SESSION_TTL_MS) sessions.delete(k);
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
      interestMsg: '',   // lo que el cliente quiere
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

// ── Extractores ──────────────────────────────────────────────────────────────
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
  const vm = text.match(/(?:vivo en|ciudad|desde|en)\s+([A-Za-zÁÉÍÓÚñáéíóú\s]{3,20})/i);
  if (vm && !/(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|gmail|hotmail)/i.test(vm[1])) {
    return vm[1].trim();
  }
  // Tercer campo separado por coma/punto y coma que no sea email ni teléfono
  for (const p of text.split(/[,;\n]/).map(x => x.trim()).filter(Boolean)) {
    if (!extractEmail(p) && !extractPhone(p) && p.length >= 3 && p.length <= 30 && !/\d{4}/.test(p)) {
      return p;
    }
  }
  return null;
}

function isNegative(text) {
  const lo = text.toLowerCase().trim();
  if (/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b/i.test(lo)) return false;
  return /^(no|no gracias|todav[ií]a no|a[uú]n no|por ahora no|paso|m[aá]s adelante|despu[eé]s|ninguna)\b/i.test(lo);
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

// ── Helpers de catálogo (conservados para compatibilidad con otros módulos) ──
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

// ── PROCESADOR PRINCIPAL ─────────────────────────────────────────────────────

async function processUserMessage(userId, userMessage, referralOrPushName = null, extraPushName = null) {
  if (!userMessage || typeof userMessage !== 'string') return null;

  // Extraer pushName (soporta llamada de Baileys con 4 argumentos o de tests con 3)
  let pushName = '';
  if (typeof extraPushName === 'string' && extraPushName.trim()) {
    pushName = extraPushName.trim();
  } else if (typeof referralOrPushName === 'string' && referralOrPushName.trim()) {
    pushName = referralOrPushName.trim();
  } else if (referralOrPushName && typeof referralOrPushName === 'object') {
    pushName = referralOrPushName.pushName || referralOrPushName.name || '';
  }

  const raw = userMessage.trim();
  const lo  = raw.toLowerCase();

  // Comando de reinicio
  if (['reiniciar', 'reset', 'inicio', 'menu', 'menú'].includes(lo)) {
    sessions.delete(userId);
  }

  const s    = getSession(userId, pushName);
  const name = s.clientName ? ` ${s.clientName}` : '';
  const nom  = s.clientName || '';

  // ── ESTADO 1: Saludo ──────────────────────────────────────────────────────
  if (s.state === 'ESTADO_1_GREETING') {
    s.state = 'ESTADO_2_INTEREST';
    return nom
      ? `¡Hola ${nom}! 👋😊 Soy tu asistente de *Realty ONE Group Bolivia* 🦁\n\n¿En qué puedo ayudarte hoy?`
      : `¡Hola! 👋😊 Soy tu asistente de *Realty ONE Group Bolivia* 🦁\n\n¿En qué puedo ayudarte hoy?`;
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

  // ── ESTADO 2: Escuchar al cliente → pedir datos ───────────────────────────
  if (s.state === 'ESTADO_2_INTEREST') {
    s.interestMsg = raw;
    s.state = 'ESTADO_3_DATA';
    s.dataRequested = true;
    const tema = getTopicDisposicion(raw);
    return `¡Sí, tenemos a disposición ${tema}! 🏡✨ Un agente especializado se pondrá en contacto con usted de acuerdo a su requerimiento. Para coordinarlo, por favor compártame su número de teléfono, correo electrónico y ciudad. 📲`;
  }

  // ── ESTADO 3: Recopilar datos ─────────────────────────────────────────────
  if (s.state === 'ESTADO_3_DATA') {
    // ¿Se niega a dar datos?
    if (isRefusal(raw)) {
      if (s.refusalCount === 0) {
        s.refusalCount = 1;
        return 'Son indispensables para que un agente especializado pueda contactarte y atender tu solicitud. 🤝 Por favor compárteme tu número de teléfono, correo electrónico y ciudad.';
      } else {
        s.state = 'ESTADO_6_FAREWELL';
        return `Puedes comunicarte directamente por teléfono cuando gustes. ¡Hasta luego${name}! Cualquier duda o inquietud no dude en llamar. 📞🤝`;
      }
    }

    // Extraer datos
    const phone = extractPhone(raw);
    const email = extractEmail(raw);
    const city  = extractCity(raw);
    if (phone) s.phone = phone;
    if (email) s.email = email;
    if (city)  s.city  = city;

    // ¿Faltan datos?
    const missing = [];
    if (!s.phone) missing.push('número de teléfono');
    if (!s.email) missing.push('correo electrónico');
    if (!s.city)  missing.push('ciudad');

    if (missing.length > 0) {
      const lista = missing.length === 1
        ? missing[0]
        : missing.length === 2
          ? `${missing[0]} y ${missing[1]}`
          : `${missing[0]}, ${missing[1]} y ${missing[2]}`;
      return `Por favor compárteme amablemente tu ${lista} antes de continuar. 😊`;
    }

    // Datos completos → pasar a agendamiento
    s.state = 'ESTADO_4_SCHEDULE';
    try {
      leadClassifier.trackAndClassifyLead(userId, raw, 'Datos recopilados', {
        campana: 'Atención al Cliente',
        canal: 'WhatsApp (+591 60937050)',
        pushName: s.clientName,
        status: 'Datos Completos',
        telefono: s.phone,
        email: s.email,
        ciudad: s.city
      }).catch(() => {});
    } catch (_) {}

    return `¡Perfecto${name}! 🎉 Ya tengo tus datos principales. Si tienes clara tu decisión, ¿quieres agendar una visita? 🗓️ (Por favor indícame día, fecha y hora). 🤝`;
  }

  // ── ESTADO 4: Agendamiento ────────────────────────────────────────────────
  if (s.state === 'ESTADO_4_SCHEDULE') {
    if (isNegative(raw)) {
      // No quiere visita → agradece opción de habernos elegido + despedida directa
      s.state = 'ESTADO_6_FAREWELL';
      return `¡Muchas gracias por habernos elegido y por comunicarte con nosotros${name}! 😊 Estaremos atentos para cuando lo decidas. Cualquier duda o inquietud no dude en llamar. 📞🤝`;
    }

    if (!hasValidDate(raw)) {
      return `Por favor indícame el día de la semana, la fecha exacta y la hora de tu visita (por ejemplo: Lunes 15 de marzo a las 10:00 AM). 🗓️`;
    }

    s.scheduledVisit = raw;
    s.state = 'ESTADO_5_REMINDER';
    try {
      leadClassifier.trackAndClassifyLead(userId, raw, `Visita: ${raw}`, {
        campana: 'Visita Agendada',
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

  // ── ESTADO 6: Despedida (corta conversación, no responde a nada posterior) ─
  if (s.state === 'ESTADO_6_FAREWELL') {
    return null;
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
