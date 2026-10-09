/**
 * Asistente Virtual de Atención al Cliente - Realty ONE Group Bolivia
 *
 * ROL Y OBJETIVO:
 * Asistente virtual de atención al cliente. Saludar, recopilar datos específicos del
 * usuario (teléfono, correo y ciudad), intentar agendar una visita con un formato
 * de fecha específico, y despedirse cordialmente.
 *
 * REGLAS ESTRICTAS DE COMPORTAMIENTO:
 * 1. NUNCA ofrezcas listas de opciones, menús ni viñetas. Preguntas abiertas.
 * 2. Flujo de la conversación paso a paso estricto. No avanzar hasta que responda.
 * 3. Validación de datos: Si omite teléfono, correo o ciudad, pedir amablemente antes de avanzar al Estado 3.
 * 4. Manejo de objeciones: Si se niega a dar datos, explicar que son indispensables. Si insiste, indicar que puede llamar y saltar al Estado 5.
 * 5. Validación de fecha: Día de la semana, fecha exacta y hora. Si es incompleta, pedir amablemente completar formato.
 * 6. Tono cordial y directo.
 *
 * FLUJO:
 * ESTADO 1: Saludo Inicial ("Hola [Nombre]. ¿En qué puedo ayudarte?" / "Hola. ¿En qué puedo ayudarte?")
 * ESTADO 2: Solicitud de Datos Específicos ("Para que un agente especializado se contacte contigo, por favor compárteme tu número de teléfono, correo electrónico y ciudad.")
 * ESTADO 3: Agendamiento ("Si tienes clara tu decisión, ¿quieres agendar una visita? (Por favor indícame día, fecha y hora, por ejemplo: Lunes 15 de marzo a las 10:00 AM).")
 * ESTADO 4: Recordatorio ("Muchas gracias por tu agendamiento. ¿Quieres que te recuerde un día antes de tu visita?")
 * ESTADO 5: Despedida (Con nombre del cliente y obligatorio: "Cualquier duda o inquietud no dude en llamar.")
 */

const db = require('../database');
const leadClassifier = require('./leadClassifier');

const SYSTEM_INSTRUCTION = `
Eres un asistente virtual de atención al cliente de Realty ONE Group Bolivia.
Tu objetivo principal es saludar, recopilar teléfono, correo y ciudad, intentar agendar una visita con fecha completa y despedirte cordialmente.
Reglas estrictas:
- NUNCA listas, menús ni viñetas. Preguntas abiertas y libres.
- Flujo secuencial Estado 1 a 5.
- Frase obligatoria en despedida: "Cualquier duda o inquietud no dude en llamar."
`;

// Sesiones en memoria por usuario con TTL de 24 horas
const MAX_SESSIONS = 500;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const userSessions = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of userSessions.entries()) {
    if (now - val.lastActivity > SESSION_TTL_MS) {
      userSessions.delete(key);
    }
  }
}, 60 * 60 * 1000).unref();

function getSession(userId, pushName = '') {
  if (!userSessions.has(userId)) {
    if (userSessions.size >= MAX_SESSIONS) {
      const firstKey = userSessions.keys().next().value;
      userSessions.delete(firstKey);
    }

    const cleanName = (pushName && pushName !== 'Cliente' && pushName !== 'Por identificar') ? pushName.trim() : '';

    userSessions.set(userId, {
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

  const s = userSessions.get(userId);
  if (pushName && pushName !== 'Cliente' && pushName !== 'Por identificar' && !s.clientName) {
    s.clientName = pushName.trim();
  }
  s.lastActivity = Date.now();
  return s;
}

// ---- Validadores y Extractores de Datos ----

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

/**
 * Procesa el mensaje de un usuario siguiendo la máquina de estados estricta
 */
async function processUserMessage(userId, userMessage, referralOrPushName = null) {
  if (!userMessage || typeof userMessage !== 'string') return null;

  let pushName = '';
  if (typeof referralOrPushName === 'string') {
    pushName = referralOrPushName;
  } else if (referralOrPushName && typeof referralOrPushName === 'object') {
    pushName = referralOrPushName.pushName || referralOrPushName.name || '';
  }

  const rawMsg = userMessage.trim();
  const lowerMsg = rawMsg.toLowerCase();

  // Comando de reinicio
  if (lowerMsg === 'reiniciar' || lowerMsg === 'reset' || lowerMsg === 'inicio') {
    userSessions.delete(userId);
  }

  const session = getSession(userId, pushName);
  const nameFarewell = session.clientName ? `, ${session.clientName}` : '';

  // ESTADO 1: Saludo Inicial
  if (session.state === 'ESTADO_1_GREETING') {
    session.state = 'ESTADO_2_DATA';
    return session.clientName
      ? `Hola ${session.clientName}. ¿En qué puedo ayudarte?`
      : 'Hola. ¿En qué puedo ayudarte?';
  }

  // ESTADO 2: Solicitud de Datos Específicos
  if (session.state === 'ESTADO_2_DATA') {
    // Si aún no se han solicitado formalmente los datos tras el saludo inicial
    if (!session.dataRequested) {
      session.dataRequested = true;
      return 'Para que un agente especializado se contacte contigo, por favor compárteme tu número de teléfono, correo electrónico y ciudad.';
    }

    // Regla 4: Manejo de objeciones / negativa
    if (isRefusal(rawMsg)) {
      if (session.refusalCount === 0) {
        session.refusalCount = 1;
        return 'Son indispensables para que un agente pueda atender tu solicitud. Por favor compárteme tu número de teléfono, correo electrónico y ciudad.';
      } else {
        session.state = 'ESTADO_5_FAREWELL';
        return `Puedes comunicarte directamente por teléfono cuando gustes. ¡Hasta luego${nameFarewell}! Cualquier duda o inquietud no dude en llamar.`;
      }
    }

    // Extraer datos presentes en la respuesta
    const phone = extractPhone(rawMsg);
    const email = extractEmail(rawMsg);
    const city = extractCity(rawMsg);

    if (phone) session.phone = phone;
    if (email) session.email = email;
    if (city) session.city = city;

    // Regla 3: Validación de datos faltantes
    const missing = [];
    if (!session.phone) missing.push('tu número de teléfono');
    if (!session.email) missing.push('tu correo electrónico');
    if (!session.city) missing.push('tu ciudad');

    if (missing.length > 0) {
      let promptFaltantes = '';
      if (missing.length === 3) {
        promptFaltantes = 'tu número de teléfono, correo electrónico y ciudad';
      } else if (missing.length === 2) {
        promptFaltantes = `${missing[0]} y ${missing[1]}`;
      } else {
        promptFaltantes = missing[0];
      }
      return `Por favor compárteme amablemente ${promptFaltantes} antes de continuar.`;
    }

    // Todos los datos están completos -> Avanzar a Estado 3
    session.state = 'ESTADO_3_SCHEDULING';

    // Registrar en CRM y SiteGround de fondo
    try {
      leadClassifier.trackAndClassifyLead(userId, rawMsg, 'Datos de contacto recopilados', {
        campana: 'Atención al Cliente',
        canal: 'WhatsApp (+591 60937050)',
        pushName: session.clientName,
        status: 'Datos Completos',
        telefono: session.phone,
        email: session.email,
        ciudad: session.city
      }).catch(() => {});
    } catch (_) {}

    return 'Si tienes clara tu decisión, ¿quieres agendar una visita? (Por favor indícame día, fecha y hora, por ejemplo: Lunes 15 de marzo a las 10:00 AM).';
  }

  // ESTADO 3: Agendamiento
  if (session.state === 'ESTADO_3_SCHEDULING') {
    // Si el cliente no agenda -> Salta al Estado 5
    if (isNegativeScheduling(rawMsg)) {
      session.state = 'ESTADO_5_FAREWELL';
      return `Muchas gracias por tu tiempo${nameFarewell}. Cualquier duda o inquietud no dude en llamar.`;
    }

    // Regla 5: Validación de fecha (día de la semana, fecha exacta y hora)
    const isValidDate = validateSchedulingDate(rawMsg);
    if (!isValidDate) {
      return 'Por favor indícame el día de la semana, la fecha exacta y la hora de tu visita (por ejemplo: Lunes 15 de marzo a las 10:00 AM).';
    }

    // Fecha completa y válida -> Avanzar a Estado 4
    session.scheduledVisit = rawMsg;
    session.state = 'ESTADO_4_REMINDER';

    // Registrar visita agendada en CRM
    try {
      leadClassifier.trackAndClassifyLead(userId, rawMsg, `Visita: ${rawMsg}`, {
        campana: 'Visita Agendada',
        canal: 'WhatsApp (+591 60937050)',
        pushName: session.clientName,
        status: 'Visita Agendada',
        horarioVisita: rawMsg
      }).catch(() => {});
    } catch (_) {}

    return 'Muchas gracias por tu agendamiento. ¿Quieres que te recuerde un día antes de tu visita?';
  }

  // ESTADO 4: Recordatorio (Condicional)
  if (session.state === 'ESTADO_4_REMINDER') {
    session.reminderChoice = rawMsg;
    session.state = 'ESTADO_5_FAREWELL';
    return `Muchas gracias por tu tiempo${nameFarewell}. Cualquier duda o inquietud no dude en llamar.`;
  }

  // ESTADO 5: Despedida
  if (session.state === 'ESTADO_5_FAREWELL') {
    return `¡Hasta luego${nameFarewell}! Cualquier duda o inquietud no dude en llamar.`;
  }

  return null;
}

// Helpers para compatibilidad con módulos existentes
function queryProperties() { return []; }
function formatPropertiesForWhatsApp() { return ''; }
function generateERealtorAssignmentResponse() { return ''; }
async function callGeminiAI() { return null; }
async function callGeminiCampaignAI() { return null; }

module.exports = {
  processUserMessage,
  queryProperties,
  formatPropertiesForWhatsApp,
  generateERealtorAssignmentResponse,
  callGeminiAI,
  callGeminiCampaignAI,
  SYSTEM_INSTRUCTION
};
