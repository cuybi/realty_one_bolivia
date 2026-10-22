/**
 * Cerebro del Chatbot Inmobiliario WhatsApp - Realty ONE Group Bolivia
 * Asistente Virtual Senior � Prompt v2 (Universal, multi-intencion, 6 fases)
 *
 * Cambios respecto a v1:
 *  - Flujo universal: responde a CUALQUIER saludo, no solo triggers de Westgate/Ads.
 *  - Adaptacion horaria real (buenos dias / buenas tardes / buenas noches).
 *  - Deteccion de intencion: comprar, alquilar, anticretico, vender/comercializar.
 *  - Bloqueo de Fase: no avanza a Fase 3 sin los 4 datos completos; pide cada dato faltante individualmente.
 *  - Fase 5: eventos INACTIVIDAD_1 / INACTIVIDAD_2 con mensajes diferenciados por estado.
 *  - Fase 6: SILENCIO post-despedida (retorna '[SILENCIO]').
 */

'use strict';

const db = require('../database');
const leadClassifier = require('./leadClassifier');

const SYSTEM_INSTRUCTION = `Asistente Virtual Senior de Realty ONE Group Bolivia.`;

// Sesiones en Memoria (TTL 24h)
const MAX_SESSIONS = 1000;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessions = new Map();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions.entries()) {
    if (now - (v.lastActivity || 0) > SESSION_TTL_MS) sessions.delete(k);
  }
}, 60 * 60 * 1000);
if (cleanupTimer.unref) cleanupTimer.unref();

// Adaptacion Horaria
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'buenos dias';
  if (h >= 12 && h < 19) return 'buenas tardes';
  return 'buenas noches';
}

// Normalizacion
const norm = (str) =>
  (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Deteccion de Intencion del Cliente
function detectIntent(msg) {
  const n = norm(msg || '');
  if (/\b(vend|quiero vender|poner en venta|comercializ|alquiler mi|alquilar mi|anticretico.*mi|dar en anticretico)\b/.test(n))
    return 'vender';
  if (/\b(anticretico|anticretico|anti\s*cr[e]tico|en anticretico)\b/.test(n))
    return 'anticretico';
  if (/\b(alquil|arrend|rent|alquiler)\b/.test(n))
    return 'alquilar';
  if (/\b(compr|adquir|casa|departamento|depto|lote|terreno|inmueble|propiedad|inversion|oficina|local|locales|bodega|proyecto|finca|edificio|vivienda|apartamento)\b/.test(n))
    return 'comprar';
  return null;
}

function isGenericGreeting(msg) {
  const n = norm(msg || '').trim();
  return /^(hola|buenos dias|buenas tardes|buenas noches|buen dia|buenas|hi|hey|saludos|como estas|como estan|como te va|que tal)[!?.]*$/.test(n);
}

// Nombre escrito suelto ("Juan Perez", "Ana Lopez"): 2-4 palabras con letras,
// sin digitos ni correo, y que no sea un saludo ni una negativa.
function looksLikeName(msg) {
  const t = (msg || '').trim();
  if (!t || /\d/.test(t) || t.includes('@')) return null;
  const words = t.split(/\s+/);
  if (words.length < 2 || words.length > 4) return null;
  if (!/^[\p{L}][\p{L}'.-]*(\s+[\p{L}][\p{L}'.-]*)+$/u.test(t)) return null;
  if (isGenericGreeting(t) || isNegativeResponse(t)) return null;
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Limpieza de Nombre
function cleanClientName(name) {
  if (!name || typeof name !== 'string') return null;
  let trimmed = name.replace(/[^\p{L}\s.'-]/gu, ' ').trim();
  trimmed = trimmed.replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 50) return null;
  const lo = trimmed.toLowerCase();
  const blacklisted = [
    'por identificar', 'cliente', 'desconocido', 'buen dia', 'buen dia',
    'buenos dias', 'buenos dias', 'buenas tardes', 'buenas noches',
    'hola', 'saludos', 'espero', 'esperamos', 'esperando', 'espera',
    'gracias', 'muchas gracias', 'amigo', 'amiga', 'feliz cumpleanos', 'feliz cumple',
    'iphone', 'samsung', 'android', 'whatsapp', 'realty one', 'century 21', 'century21',
    'asesor', 'asesora', 'propietario', 'propietaria', 'duc',
    'santa cruz', 'la paz', 'cochabamba', 'tarija', 'sucre', 'oruro'
  ];
  if (blacklisted.some(b => lo === b || lo.startsWith(b + ' ') || lo.endsWith(' ' + b))) return null;
  if (trimmed.length <= 3 && trimmed === trimmed.toUpperCase()) return null;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.some(w => blacklisted.includes(w.toLowerCase()))) return null;
  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Extraccion de Datos de Contacto
function extractPhone(text) {
  if (!text) return null;
  const intl = text.match(/(?:\+|\b00)\s*\d{1,4}[-.\s]?(?:\(?\d{1,4}\)?[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d{2,4})?/);
  if (intl) {
    const cleaned = intl[0].replace(/[\s().-]/g, '');
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 15) return cleaned;
  }
  const bo = text.match(/(?:\+?591[\s.-]*)?[67]\d{7}\b/);
  if (bo) return bo[0].replace(/[\s().-]/g, '');
  const chunks = text.match(/\b\d{3,4}[-.\s]\d{3,4}(?:[-.\s]\d{2,4})?\b|\b\d{7,15}\b/);
  if (chunks) {
    const cleaned = chunks[0].replace(/[\s.-]/g, '');
    if (cleaned.length >= 7 && cleaned.length <= 15) return cleaned;
  }
  return null;
}

function extractEmail(text) {
  if (!text) return null;
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0].trim() : null;
}

function extractCity(text) {
  if (!text) return null;
  const cities = [
    'santa cruz', 'la paz', 'cochabamba', 'tarija', 'sucre', 'oruro',
    'potosi', 'beni', 'trinidad', 'pando', 'cobija', 'montero',
    'warnes', 'urubo', 'el alto', 'quillacollo', 'sacaba',
    'yacuiba', 'riberalta', 'villazon', 'llallagua', 'vacas', 'uncia',
    'achacachi', 'copacabana', 'samaipata', 'bermejo', 'guayaramerin',
    'puerto suarez', 'rurrenabaque', 'san borja', 'mizque', 'tarata',
    'chulumani', 'aiquile', 'pomata', 'challapata', 'patacamaya', 'viacha',
    'tiquipaya', 'chijini', 'yapacani', 'pailon', 'pocona', 'san juan de yungas'
  ];
  // Sin tildes: "Potosí" y "Potosi" son la misma ciudad.
  const flat = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lower = flat(text).toLowerCase();
  for (const c of cities) {
    if (new RegExp('(^|\\P{L})' + flat(c) + '(\\P{L}|$)', 'iu').test(lower)) {
      return c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  }
  const vm = text.match(/(?:vivo en|ciudad de|desde la ciudad de|de la ciudad de)\s+([A-Za-z\u00C0-\u024F\s]{3,20})/i);
  if (vm && !/(?:lunes|martes|mi[e]rcoles|miercoles|jueves|viernes|s[a]bado|sabado|domingo|gmail|hotmail)/i.test(vm[1])) {
    return vm[1].trim();
  }
  return null;
}

function extractFullName(text) {
  if (!text || isNegativeResponse(text)) return null;
  const cities = [
    'santa cruz', 'la paz', 'cochabamba', 'tarija', 'sucre', 'oruro',
    'potosi', 'beni', 'trinidad', 'pando', 'cobija', 'montero',
    'warnes', 'urubo', 'el alto', 'quillacollo', 'sacaba'
  ];
  const nonNameWords = new Set([
    'no', 'quiero', 'puedo', 'dar', 'mis', 'datos', 'despues', 'luego',
    'ahora', 'mas', 'adelante', 'aun', 'todavia', 'aviso', 'gracias',
    'paso', 'prefiero', 'sobre', 'el', 'la', 'los', 'las', 'un', 'una',
    'nombre', 'apellido', 'telefono', 'correo', 'email', 'ciudad', 'whatsapp', 'celular',
    'hola', 'buenas', 'tardes', 'dias', 'noches', 'favor', 'por',
    'ok', 'okay', 'okey', 'claro', 'dale', 'vale', 'listo', 'si', 'bien',
    'perfecto', 'genial', 'excelente', 'entendido', 'de', 'acuerdo',
    'supuesto', 'con', 'gusto', 'bueno', 'obvio', 'seguro'
  ]);

  const m = text.match(/(?:mi nombre es|me llamo|soy\s+(?!de\b|del\b))\s*([A-Za-z\u00C0-\u024F\s]{3,35})/i);
  if (m) {
    let cand = m[1].trim();
    cand = cand.replace(/\s+(?:y(?:\s+mi)?|mi|con|del?|en|por|para|cel(?:ular)?|tel(?:efono)?|correo|email|whatsapp)\b.*$/i, '').trim();
    const candLo = cand.toLowerCase();
    const isCity = cities.some(c => candLo.includes(c));
    if (!isCity && !extractEmail(cand) && !extractPhone(cand)) {
      const words = cand.split(/\s+/).filter(w => w.length >= 2);
      if (words.length >= 1 && !words.some(w => nonNameWords.has(w.toLowerCase()))) {
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }
  const parts = text.split(/[,;\n]/).map(x => x.trim()).filter(Boolean);
  for (const p of parts) {
    if (extractEmail(p) || extractPhone(p)) continue;
    const pLo = p.toLowerCase();
    if (cities.some(c => pLo === c || pLo === `en ${c}` || pLo === `de ${c}`)) continue;
    if (/^[A-Za-z\u00C0-\u024F\s.'-]+$/.test(p) && p.length >= 4 && p.length <= 40) {
      const words = p.split(/\s+/).filter(w => w.length >= 2);
      if (words.length >= 2 && !words.some(w => nonNameWords.has(w.toLowerCase()))) {
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
  }
  return null;
}

// Respuestas Negativas y Fecha/Hora
function isNegativeResponse(text) {
  if (!text) return false;
  const rawLo = norm(text).trim();
  if (rawLo.includes('no hay problema') || rawLo.includes('sin problema')) return false;
  if (/^(no|nop|noup|nel|negativo)$/.test(rawLo)) return true;
  const negPhrases = [
    'no quiero', 'no puedo', 'despues', 'no ahora', 'ahora no', 'luego',
    'mas adelante', 'aun no', 'todavia no', 'luego te aviso', 'no se',
    'no gracias', 'paso', 'por ahora no', 'por el momento no',
    'en otra ocasion', 'en otra oportunidad', 'prefiero no',
    'no dar mis datos', 'no doy mis datos', 'no voy a dar',
    'no los dare'
  ];
  for (const phrase of negPhrases) {
    if (rawLo.includes(phrase)) return true;
  }
  if (/^no\b/.test(rawLo) && !/\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\b/.test(rawLo)) {
    return true;
  }
  return false;
}

function hasDateTime(text) {
  if (!text) return false;
  const rawLo = norm(text).trim();
  if (isNegativeResponse(text)) return false;
  const hasDay = /\b(lunes|martes|miercoles|jueves|viernes|sabado|domingo|manana|hoy|pasado manana)\b/.test(rawLo);
  const hasMonth = /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/.test(rawLo);
  const hasDateNum = /\b\d{1,2}[\/\.-]\d{1,2}\b/.test(rawLo) || (/\b\d{1,2}\b/.test(rawLo) && hasMonth);
  const hasTime = /\b\d{1,2}:\d{2}\b/.test(rawLo)
    || /\b\d{1,2}\s*(am|pm|hrs|horas)\b/.test(rawLo)
    || /\ba\s+las?\s+\d{1,2}\b/.test(rawLo)
    || /\b(en\s+la\s+tarde|en\s+la\s+manana|al\s+mediodia)\b/.test(rawLo);
  return (hasDay || hasMonth || hasDateNum) && hasTime;
}

// Verificacion de Completitud de los 4 Datos
function getMissingData(session) {
  const missing = [];
  const hasValidName = session.nombre &&
    typeof session.nombre === 'string' &&
    session.nombre.trim().split(/\s+/).filter(Boolean).length >= 2;
  if (!hasValidName) missing.push('*nombre y apellido*');
  if (!session.phone || session.phone === session.userId) missing.push('*numero de telefono o WhatsApp*');
  if (!session.email) missing.push('*correo electronico*');
  if (!session.city) missing.push('*ciudad*');
  return missing;
}

function isFormComplete(session) {
  return getMissingData(session).length === 0;
}

// Nombres de Display
function displayName(session, prefix) {
  prefix = prefix !== undefined ? prefix : ' ';
  const n = session.nombre || session.nombre_perfil || '';
  return n ? (prefix + n) : '';
}

function displayNameComma(session) {
  const n = session.nombre || session.nombre_perfil || '';
  return n ? (', ' + n) : '';
}

// Constructores de Mensajes
function buildDataRequestMessage(session) {
  const greeting = getGreeting();
  const np = displayName(session);
  const intent = session.intent;
  let intro;
  if (intent === 'vender') {
    intro = `!Muy ${greeting}${np}! Sera un placer ayudarte. En *Realty ONE Group Bolivia* contamos con el equipo ideal para comercializar tu propiedad de forma segura y efectiva. Edificio\nEn breve, un agente especializado se comunicara contigo para asesorarte. Para coordinarlo, me ayudas por favor con estos datos?`;
  } else {
    intro = `!Muy ${greeting}${np}! !Claro que si! Contamos con una excelente variedad de opciones disponibles que se adaptan a lo que buscas.\nEn breve, uno de nuestros agentes especializados se pondra en contacto contigo para mostrarte las mejores alternativas. Para coordinarlo, me compartes por favor los siguientes datos?`;
  }
  return `${intro} Edificio\n- *Nombre y apellido:*\n- *Numero de telefono o WhatsApp:*\n- *Correo electronico:*\n- *Ciudad:*`;
}

function buildIncompleteDataMessage(session) {
  const missing = getMissingData(session);
  const nom = session.nombre || session.nombre_perfil || '';
  const nomStr = nom ? `!Gracias, ${nom}! ` : '!Gracias! ';
  if (missing.length === 1) {
    return `${nomStr}Para dejar tu registro completo y asignarte al agente de tu zona, solo me faltaria que me indiques tu ${missing[0]}.`;
  }
  const lista = missing.join(', ');
  return `${nomStr}Para dejar tu registro completo y asignarte al agente de tu zona, me faltarian: ${lista}.`;
}

function buildFarewellScheduled(session, fechaHora) {
  const greeting = getGreeting();
  const nom = displayName(session);
  return `!Excelente${nom}! Queda registrada tu solicitud para el *${fechaHora}*.\n!Muchas gracias por habernos elegido y por comunicarte con *Realty ONE Group Bolivia*! Cualquier duda o inquietud adicional, no dudes en llamarnos. !Que tengas ${greeting}!`;
}

function buildFarewellNoSchedule(session) {
  const greeting = getGreeting();
  const nom = displayNameComma(session);
  return `!Comprendo perfectamente${nom}! No te preocupes.\n!Muchas gracias por habernos elegido y por comunicarte con *Realty ONE Group Bolivia*! Estaremos atentos y con gusto te atenderemos cuando lo decidas. Cualquier duda o inquietud, no dudes en llamarnos. !Que tengas ${greeting}!`;
}

// Getters de Session
function getBotSession(userId) {
  return sessions.get(userId);
}

function isSessionActive(userId) {
  const s = sessions.get(userId);
  if (!s) return false;
  return ['BIENVENIDA', 'ESPERANDO_DATOS', 'ESPERANDO_CONFIRMACION_VISITA', 'ESPERANDO_FECHA_HORA'].includes(s.state);
}

// Disparadores Legado (Westgate / Ads)
function hasActivationTrigger(msg, referralData) {
  const nMsg = norm(msg || '');
  if (nMsg.includes('quiero mas informacion')) return true;
  if (nMsg.includes('westgate tower')) return true;
  if (nMsg.includes('fb.me')) return true;
  if (referralData) {
    const refStr = norm(`${referralData.headline || ''} ${referralData.body || ''} ${referralData.sourceUrl || ''} ${referralData.description || ''}`);
    if (refStr.includes('westgate tower') || refStr.includes('fb.me') || referralData.source === 'Facebook Ads (CTWA)') return true;
  }
  return false;
}

// PROCESADOR PRINCIPAL (Fases 1-6)
async function processUserMessage(userId, userMessage, referralOrPushName, extraPushName, specialEvent) {
  if (!userMessage || typeof userMessage !== 'string') return null;

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
  const lo = norm(raw);

  if (['reiniciar', 'reset'].includes(lo)) {
    sessions.delete(userId);
    return null;
  }

  const session = sessions.get(userId);

  // FASE 6: SILENCIO TOTAL post-despedida
  if (session && session.state === 'FINALIZADO') {
    return '[SILENCIO]';
  }

  // FASE 5: INACTIVIDAD
  if (specialEvent === 'INACTIVIDAD_1' && session) {
    const nom = displayName(session);
    if (session.state === 'ESPERANDO_DATOS') {
      return `Hola de nuevo${nom}! Se que a veces estamos a mil en el dia. Te escribo rapidito por si aun deseas que un agente de *Realty ONE Group Bolivia* te contacte. Cuando tengas un minutito, comparteme tu *nombre y apellido, telefono, correo y ciudad* para asignarte al asesor de tu zona.`;
    }
    if (session.state === 'ESPERANDO_CONFIRMACION_VISITA' || session.state === 'ESPERANDO_FECHA_HORA') {
      return `Hola${nom}! Solo paso a avisarte que tus datos ya estan en manos de nuestro agente especializado. Si prefieres conversar primero con el antes de fijar un dia y hora para la visita, no hay ningun problema! Lo dejamos asi por ahora o te gustaria anotar una fecha tentativa?`;
    }
    return null;
  }

  if (specialEvent === 'INACTIVIDAD_2' && session) {
    const greeting = getGreeting();
    const nom = displayName(session);
    const rep = `Hola${nom}! Para no interrumpir tus actividades, dejare nuestra conversacion en pausa por ahora. !Muchas gracias por habernos elegido y por comunicarte con *Realty ONE Group Bolivia*! Estaremos atentos para atenderte con mucho gusto cuando estes listo. Cualquier duda o inquietud, no dudes en llamarnos. !Que tengas ${greeting}!`;
    if (session) session.state = 'FINALIZADO';
    return rep;
  }

  // FASE 1: Sin sesion activa - Bienvenida
  if (!session) {
    const greeting = getGreeting();
    const cleanPush = cleanClientName(pushName) || '';
    const isTrigger = hasActivationTrigger(raw, referralData);
    const intent = detectIntent(raw);
    const isGreeting = isGenericGreeting(raw);

    if (!isGreeting && !intent && !isTrigger) {
      return null;
    }

    // Modo estricto: silencio absoluto ante saludos sin disparador de publicidad.
    // El bot solo responde a leads que llegan por anuncio o con intencion clara.
    // Se activa con BOT_SILENCIOS_SIN_DISPARADOR=true (util si el numero
    // corporativo recibe chats personales).
    const silencioEstricto = /^(1|true|si|yes)$/i.test(
      String(process.env.BOT_SILENCIOS_SIN_DISPARADOR ?? 'false')
    );
    if (silencioEstricto && isGreeting && !intent && !isTrigger) {
      return null;
    }


    const newSession = {
      userId,
      state: 'BIENVENIDA',
      nombre_perfil: cleanPush,
      nombre: cleanPush,
      phone: extractPhone(raw) || null,
      email: extractEmail(raw) || null,
      city: extractCity(raw) || null,
      intent: intent || null,
      visitSchedule: null,
      lastActivity: Date.now()
    };
    sessions.set(userId, newSession);

    const np = cleanPush ? ` ${cleanPush}` : '';

    // Escenario B: tiene intencion directa
    if (intent || isTrigger) {
      newSession.state = 'ESPERANDO_DATOS';
      const rep = buildDataRequestMessage(newSession);
      leadClassifier.trackAndClassifyLead(userId, raw, rep, {
        campana: intent === 'vender' ? 'Captacion Vendedor' : `Busqueda: ${intent || 'Inmueble'}`,
        canal: 'WhatsApp Bot',
        pushName: cleanPush,
        status: 'Nuevo'
      }).catch(() => {});
      return rep;
    }

    // Escenario A: saludo generico
    newSession.state = 'BIENVENIDA';
    const rep = `Hola${np}! Soy tu asistente virtual de *Realty ONE Group Bolivia*.\n\n!Muy ${greeting}${np}! Que gusto saludarte. En que puedo ayudarte hoy? Cuentame si estas buscando *comprar, alquilar, tomar en anticretico* o si deseas *vender o comercializar* una propiedad.`;
    leadClassifier.trackAndClassifyLead(userId, raw, rep, {
      campana: 'Bienvenida Chat',
      canal: 'WhatsApp Bot',
      pushName: cleanPush,
      status: 'Nuevo'
    }).catch(() => {});
    return rep;
  }

  session.lastActivity = Date.now();

  // ESTADO: BIENVENIDA - esperar intencion
  if (session.state === 'BIENVENIDA') {
    const intent = detectIntent(raw);

    if (isNegativeResponse(raw) && !intent) {
      const rep = buildFarewellNoSchedule(session);
      session.state = 'FINALIZADO';
      return rep;
    }

    // Los datos se capturan ANTES de preguntar la intencion: un lead puede
    // escribir sus datos sin decir que busca, y no se deben perder.
    const ph0 = extractPhone(raw);
    const em0 = extractEmail(raw);
    const ct0 = extractCity(raw);
    const nm0 = extractFullName(raw);
    const nombreLibre = !session.nombre && !ph0 && !em0 && !ct0 ? looksLikeName(raw) : null;
    const hayDatos = Boolean(ph0 || em0 || ct0 || nm0 || nombreLibre);

    if (!intent && !isGenericGreeting(raw) && !hayDatos) {
      const nom = displayNameComma(session);
      return `Entiendo${nom}. Me podrias contar si estas buscando *comprar, alquilar, anticretico* o si deseas *vender/comercializar* una propiedad? Asi te conecto con el agente ideal.`;
    }

    if (intent) session.intent = intent;

    const ph = ph0;
    const em = em0;
    const ct = ct0;
    if (ph && !session.phone) session.phone = ph;
    if (em && !session.email) session.email = em;
    if (ct && !session.city) session.city = ct;
    const nombreNuevo = nm0 && nm0.trim().split(/\s+/).length >= 2 ? nm0 : nombreLibre;
    if (nombreNuevo && !session.nombre) session.nombre = nombreNuevo;

    session.state = 'ESPERANDO_DATOS';
    const rep = hayDatos ? buildIncompleteDataMessage(session) : buildDataRequestMessage(session);
    leadClassifier.trackAndClassifyLead(userId, raw, rep, {
      campana: intent ? `Busqueda: ${intent}` : 'Consulta General',
      canal: 'WhatsApp Bot',
      pushName: session.nombre_perfil,
      status: 'Nuevo'
    }).catch(() => {});
    return rep;
  }

  // ESTADO: ESPERANDO_DATOS - capturar los 4 datos
  if (session.state === 'ESPERANDO_DATOS') {
    const phone = extractPhone(raw);
    const email = extractEmail(raw);
    let city = extractCity(raw);
    const isNeg = isNegativeResponse(raw);

    // Ciudad en texto libre: si ya tenemos nombre, telefono y correo, lo que
    // llega es la ciudad (p.ej. "Urubó", "Potosí"), aunque no este en la lista.
    if (!city && session.phone && session.email && session.nombre) {
      const cand = raw.trim().replace(/[.,;!?]+$/, '');
      if (
        /^[\p{L}][\p{L}\s'.-]{1,28}$/u.test(cand) &&
        !isGenericGreeting(cand) &&
        !isNegativeResponse(cand)
      ) {
        city = cand.charAt(0).toUpperCase() + cand.slice(1);
      }
    }

    if (isNeg && !phone && !email && !city) {
      const rep = buildFarewellNoSchedule(session);
      session.state = 'FINALIZADO';
      leadClassifier.trackAndClassifyLead(userId, raw, rep, {
        campana: 'Flujo Declinado (Datos)',
        canal: 'WhatsApp Bot',
        pushName: session.nombre_perfil,
        status: 'Declinado'
      }).catch(() => {});
      return rep;
    }

    if (phone) session.phone = phone;
    if (email) session.email = email;
    if (city) session.city = city;

    const extractedName = extractFullName(raw);
    const validName = extractedName && extractedName.trim().split(/\s+/).length >= 2 ? extractedName : null;
    if (validName) session.nombre = validName;

    const hasAnyData = Boolean(phone || email || city || validName);

    if (hasAnyData) {
      if (isFormComplete(session)) {
        session.state = 'ESPERANDO_CONFIRMACION_VISITA';
        const nom = displayName(session);
        const rep = `!Perfecto${nom}! Ya tengo tus datos principales registrados y nuestro agente los esta recibiendo.\nSi ya tienes clara tu decision y te gustaria adelantar camino, quieres que agendemos una visita o reunion?\nPor favor, indicame el *dia, fecha y hora* que mejor te convenga.`;
        leadClassifier.trackAndClassifyLead(userId, raw, rep, {
          campana: 'Datos Completos Capturados',
          canal: 'WhatsApp Bot',
          pushName: session.nombre || session.nombre_perfil,
          telefono: session.phone,
          email: session.email,
          ciudad: session.city,
          status: 'Interesado'
        }).catch(() => {});
        return rep;
      } else {
        return buildIncompleteDataMessage(session);
      }
    }

    // Sin dato nuevo: se repregunta solo lo que falta (no los cuatro de golpe).
    return buildIncompleteDataMessage(session);
  }

  // ESTADO: ESPERANDO_CONFIRMACION_VISITA (Fase 3)
  if (session.state === 'ESPERANDO_CONFIRMACION_VISITA') {
    const nom = displayName(session);
    const nomComa = displayNameComma(session);

    if (isNegativeResponse(raw)) {
      const rep = buildFarewellNoSchedule(session);
      session.state = 'FINALIZADO';
      leadClassifier.trackAndClassifyLead(userId, raw, rep, {
        campana: 'Visita Declinada',
        canal: 'WhatsApp Bot',
        pushName: session.nombre || session.nombre_perfil,
        telefono: session.phone,
        email: session.email,
        ciudad: session.city,
        status: 'Datos Registrados (Sin Visita)'
      }).catch(() => {});
      return rep;
    }

    if (hasDateTime(raw)) {
      const fechaHora = raw.trim();
      session.visitSchedule = fechaHora;
      session.state = 'FINALIZADO';
      const rep = buildFarewellScheduled(session, fechaHora);
      leadClassifier.trackAndClassifyLead(userId, raw, rep, {
        campana: 'Visita Agendada',
        canal: 'WhatsApp Bot',
        pushName: session.nombre || session.nombre_perfil,
        telefono: session.phone,
        email: session.email,
        ciudad: session.city,
        fecha_visita: fechaHora,
        status: 'Visita Agendada'
      }).catch(() => {});
      return rep;
    }

    session.state = 'ESPERANDO_FECHA_HORA';
    return `!Genial${nom}! Para agendar tu visita, indicame el *dia, la fecha y la hora* que te queden mejor (por ejemplo: Lunes 15 de marzo a las 10:00 AM).`;
  }

  // ESTADO: ESPERANDO_FECHA_HORA
  if (session.state === 'ESPERANDO_FECHA_HORA') {
    const nom = displayName(session);
    const nomComa = displayNameComma(session);

    if (isNegativeResponse(raw)) {
      const rep = buildFarewellNoSchedule(session);
      session.state = 'FINALIZADO';
      leadClassifier.trackAndClassifyLead(userId, raw, rep, {
        campana: 'Coordinacion Visita Pendiente',
        canal: 'WhatsApp Bot',
        pushName: session.nombre || session.nombre_perfil,
        telefono: session.phone,
        email: session.email,
        ciudad: session.city,
        status: 'Pendiente Coordinacion Visita'
      }).catch(() => {});
      return rep;
    }

    if (hasDateTime(raw)) {
      const fechaHora = raw.trim();
      session.visitSchedule = fechaHora;
      session.state = 'FINALIZADO';
      const rep = buildFarewellScheduled(session, fechaHora);
      leadClassifier.trackAndClassifyLead(userId, raw, rep, {
        campana: 'Visita Agendada (Fecha)',
        canal: 'WhatsApp Bot',
        pushName: session.nombre || session.nombre_perfil,
        telefono: session.phone,
        email: session.email,
        ciudad: session.city,
        fecha_visita: fechaHora,
        status: 'Visita Agendada'
      }).catch(() => {});
      return rep;
    }

    return `Entendido${nomComa}. Para confirmar tu cita, necesito el *dia, fecha y hora* exactos (ej: Martes 28 de octubre a las 3:00 PM).`;
  }

  return null;
}

// Metodos de Compatibilidad
function queryProperties() { return []; }
function formatPropertiesForWhatsApp() { return ''; }
function generateERealtorAssignmentResponse(lead) {
  const clientName = lead.cliente_nombre || 'Estimado/a cliente';
  return `!Datos registrados!\n\nHola *${clientName}*, un agente especializado se pondra en contacto contigo a la brevedad.`;
}
async function callGeminiAI() { return null; }
async function callGeminiCampaignAI() { return null; }

module.exports = {
  processUserMessage,
  queryProperties,
  formatPropertiesForWhatsApp,
  generateERealtorAssignmentResponse,
  callGeminiAI,
  callGeminiCampaignAI,
  SYSTEM_INSTRUCTION,
  getBotSession,
  isSessionActive,
  sessions,
  getGreeting,
  detectIntent,
  isNegativeResponse,
  hasDateTime,
  isFormComplete,
  getMissingData
};
