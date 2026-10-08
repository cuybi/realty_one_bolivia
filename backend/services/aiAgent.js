/**
 * Cerebro de Inteligencia Artificial para el Chatbot Inmobiliario
 * Especializado en el mercado inmobiliario de Bolivia (Realty ONE Group Bolivia)
 * 
 * Flujo Completo del Embudo:
 * One Comsys ➔ Publicación ➔ Impulsar ➔ Prospectos ➔ Solicitar Información
 *    ➔ IA Responde ➔ Formulario de Datos ➔ Prospectos Potenciales
 *    ➔ Asignaciones CRM IA ➔ Atención de e-Realtors
 */

const db = require('../database');
const campaignService = require('./campaignService');
const leadClassifier = require('./leadClassifier');

// ponytail: despedida humana según hora exacta Bolivia (Intl nativo, infalible en Render)
function despedidaSegunHora() {
  const h = parseInt(new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', hour: 'numeric', hour12: false }).format(new Date()), 10);
  if (h >= 5 && h < 12)  return '👋 *¡Muchas gracias por tu tiempo y que tengas una excelente mañana!*';
  if (h >= 12 && h < 19) return '👋 *¡Muchas gracias por tu tiempo y que tengas una excelente tarde!*';
  return '👋 *¡Muchas gracias por tu tiempo y que tengas una excelente noche!*';
}

// ponytail: Memoria acotada de conversación (máximo 500 sesiones con TTL de 24 horas para evitar fugas OOM)
const MAX_SESSIONS = 500;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
const conversationSessions = new Map(); // userId -> { history: [], lastActivity: timestamp }

// Limpieza periódica cada hora de sesiones inactivas (> 24h)
const sessionCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of conversationSessions.entries()) {
    if (now - val.lastActivity > SESSION_TTL_MS) {
      conversationSessions.delete(key);
    }
  }
}, 60 * 60 * 1000);
if (sessionCleanupInterval.unref) sessionCleanupInterval.unref();

/**
 * Prompt del Sistema: Define el comportamiento, conocimiento y personalidad del Agente Inmobiliario
 */
const SYSTEM_INSTRUCTION = `
Eres "ONEBot", el asesor virtual de Realty ONE Group Bolivia — uno de los portales inmobiliarios más importantes de Santa Cruz de la Sierra y Urubó.

Tu misión: Atender con calidez y profesionalismo a personas que buscan comprar, alquilar o tomar en anticrético propiedades en Bolivia (casas, departamentos, condominios, terrenos/lotes, oficinas y parques industriales), así como a propietarios que desean vender o alquilar sus inmuebles.

PERSONALIDAD Y TONO:
- Eres cercano, cálido y profesional. Como un asesor inmobiliario de confianza, no un robot.
- Hablas con naturalidad en español boliviano: usas "te", no "usted". Eres directo pero amable.
- Nunca suenas como un formulario. Antes de pedir datos, escuchas, informas y generas confianza.
- Formato WhatsApp: *negritas*, emojis moderados (🏡🏢🔑📍💰📅✨), frases cortas. Sin párrafos largos.
- Si no tienes info exacta, lo dices honestamente y ofreces conectar con el asesor humano.

CONOCIMIENTO INMOBILIARIO EN BOLIVIA:
1. ANTICRÉTICO:
   - Figura legal en Bolivia donde el interesado entrega un capital ($US) al propietario por el uso de la vivienda sin alquiler mensual. Al finalizar el plazo, el propietario devuelve el 100% del capital.
   - Requisitos: Folio Real libre de gravamen, escritura pública notariada e inscripción en Derechos Reales (DDRR). Asignar a e-Realtor: Lucía Vaca (+591 70456789).

2. VENTA / COMPRA:
   - Documentación: Folio Real original, Certificado Catastral / Alodial, Plano de Uso de Suelo aprobado, Impuestos municipales al día (últimos 5 años). Impuesto a las Transferencias (IT/IMT 3%).
   - Asignar a e-Realtor: Carlos Rodríguez (+591 70123456).

3. ALQUILERES:
   - 1 mes adelantado, 1 mes de garantía reembolsable y comisión inmobiliaria.
   - Asignar a e-Realtor: Valeria Suárez (+591 70234567).

4. TERRENOS Y PARQUE INDUSTRIAL (G77):
   - Opciones en Parque Industrial / G77, Warnes, Urubó Green Park, Porongo.
   - Asignar a e-Realtor: Andrés Montaño (+591 70345678).

5. CONSIGNACIÓN DE INMUEBLES (PROPIETARIOS):
   - Avalúo comercial sin costo y plan de marketing internacional.
   - Asignar a Master Broker: Robert Oliva (+591 60937050).
`;

/**
 * Obtiene o inicializa el historial de conversación de un usuario
 */
function getSessionHistory(userId) {
  const now = Date.now();
  if (conversationSessions.has(userId)) {
    const session = conversationSessions.get(userId);
    session.lastActivity = now;
    return session.history;
  }

  // Si superamos el límite máximo, eliminar la sesión más antigua
  if (conversationSessions.size >= MAX_SESSIONS) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, val] of conversationSessions.entries()) {
      if (val.lastActivity < oldestTime) {
        oldestTime = val.lastActivity;
        oldestKey = key;
      }
    }
    if (oldestKey) conversationSessions.delete(oldestKey);
  }

  const newSession = { history: [], lastActivity: now };
  conversationSessions.set(userId, newSession);
  return newSession.history;
}

/**
 * Busca propiedades en la base de datos según criterios
 */
function queryProperties({ tipo, operacion, ubicacion, maxPrecio, minHabitaciones, search }) {
  try {
    let rows = db.prepare('SELECT * FROM propiedades WHERE activo = 1').all();

    // Filtro por tipo de operación (Venta, Alquiler, Anticretico, Terreno)
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

    // Filtro por ubicación (Urubó, Equipetrol, Sirari, Hamacas, Norte, etc.)
    if (ubicacion) {
      const u = ubicacion.toLowerCase();
      rows = rows.filter(p => (p.ubicacion || '').toLowerCase().includes(u) || (p.titulo || '').toLowerCase().includes(u));
    }

    // Filtro por habitaciones
    if (minHabitaciones && Number(minHabitaciones) > 0) {
      rows = rows.filter(p => Number(p.habitaciones || 0) >= Number(minHabitaciones));
    }

    // Filtro por texto general
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter(p => 
        (p.titulo || '').toLowerCase().includes(s) ||
        (p.descripcion_larga || '').toLowerCase().includes(s) ||
        (p.ubicacion || '').toLowerCase().includes(s)
      );
    }

    // Procesar imágenes
    return rows.map(p => {
      let imagenes = [];
      try { imagenes = JSON.parse(p.imagenes || '[]'); } catch { imagenes = []; }
      return { ...p, imagenes };
    });
  } catch (error) {
    console.error('Error al consultar base de datos de propiedades:', error);
    return [];
  }
}

/**
 * Formatea una lista de propiedades en un mensaje estructurado y atractivo para WhatsApp
 */
function formatPropertiesForWhatsApp(properties, baseUrl = '') {
  if (!properties || properties.length === 0) {
    return 'Actualmente no encontré propiedades con esos filtros específicos, pero contamos con nuevas opciones ingresando a diario. ¿Te gustaría que un e-Realtor especialista te envíe opciones personalizadas?';
  }

  let text = `🏡 *Encontré las siguientes opciones disponibles en One Comsys:*\n\n`;
  const list = properties.slice(0, 3); // Máximo 3 opciones para no saturar WhatsApp

  list.forEach((p, idx) => {
    text += `*${idx + 1}. ${p.titulo}*\n`;
    text += `📍 *Ubicación:* ${p.ubicacion}\n`;
    text += `💰 *Precio:* ${p.precio} (${p.tipo})\n`;
    if (p.habitaciones > 0) text += `🛏 *Dormitorios:* ${p.habitaciones} | 🚿 *Baños:* ${p.banos}\n`;
    if (p.area) text += `📐 *Superficie:* ${p.area}\n`;
    text += `ℹ️ ${p.descripcion_larga ? p.descripcion_larga.substring(0, 100) + '...' : ''}\n`;
    text += `🔗 *Ficha digital:* propiedad.html?id=${p.id}\n\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `¿Te interesa alguna de estas opciones o buscas algo distinto? 😊\n\n`;
  text += `Si quieres que te asignemos un asesor y coordinemos una visita, solo dime:\n`;
  text += `👤 *Tu nombre*\n`;
  text += `📱 *Tu celular o WhatsApp*\n`;
  text += `📅 *Cuándo podrías visitar* (ej: mañana en la tarde, sábado a las 10)\n\n`;
  text += `_No es necesario escribirlos en orden — con esos datos te asignamos un e-Realtor especialista hoy mismo._ ✅`;
  return text;
}

/**
 * Genera el mensaje de confirmación de asignación a e-Realtor y solicita agendar la visita
 */
function generateERealtorAssignmentResponse(lead) {
  const realtorName = lead.e_realtor_asignado || 'Carlos Rodríguez';
  const realtorPhone = lead.e_realtor_telefono || '+591 70123456';
  const realtorEmail = lead.e_realtor_email || 'info@realtyonegroup.com.bo';
  const realtorSpec = lead.e_realtor_especialidad || 'Especialista Inmobiliario';
  const clientName = lead.cliente_nombre && lead.cliente_nombre !== 'Por identificar' ? lead.cliente_nombre : 'Estimado/a cliente';

  let msg = `🎉 *¡DATOS REGISTRADOS CON ÉXITO!* 🦁✨\n\n`;
  msg += `Hola *${clientName}*, tus datos han sido registrados en *One Comsys* con prioridad *🔥 PROSPECTO POTENCIAL*.\n\n`;
  msg += `📋 *RESUMEN DE TU SOLICITUD:*\n`;
  msg += `👤 *Cliente:* ${clientName}\n`;
  msg += `📱 *Teléfono:* ${lead.numero_celular}\n`;
  if (lead.email && lead.email !== 'Pendiente') msg += `✉️ *Email:* ${lead.email}\n`;
  if (lead.zona_interes) msg += `📍 *Zona / Inmueble:* ${lead.zona_interes}\n`;
  if (lead.presupuesto && lead.presupuesto !== 'Por definir') msg += `💰 *Presupuesto:* ${lead.presupuesto}\n`;
  if (lead.horario_visita_solicitado) msg += `📅 *Horario de visita:* ${lead.horario_visita_solicitado}\n`;
  
  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `⚡ *ASIGNACIÓN CRM IA ➔ E-REALTOR RESPONSABLE:*\n`;
  msg += `👤 *e-Realtor Asignado:* *${realtorName}*\n`;
  msg += `🏅 *Especialidad:* ${realtorSpec}\n`;
  msg += `📞 *Teléfono directo:* ${realtorPhone}\n`;
  msg += `📧 *E-mail:* ${realtorEmail}\n\n`;
  
  if (lead.horario_visita_solicitado) {
    msg += `✅ *¡Visita Presencial Agendada!* Tu asesor te contactará para confirmar el punto de encuentro y enviarte la ubicación GPS.`;
  } else {
    msg += `📅 *PASO FINAL: AGENDAR TU VISITA PRESENCIAL*\n`;
    msg += `👉 *¿Qué día y hora prefieres para visitar el inmueble?*\n`;
    msg += `*(Ejemplo: "Mañana a las 16:00", "Sábado en la mañana" o "Jueves 10:30 AM")*\n\n`;
    msg += `🦁 *${realtorName}* te esperará puntualmente en la propiedad y te enviará la ubicación GPS.`;
  }
  return msg;
}

// ponytail: generateLocalSemanticResponse eliminada — nunca llamada por processUserMessage.
// El flujo oficial (líneas 501-611) maneja toda la lógica de respuesta directamente.

/**
 * Consulta la API de Gemini si la clave está configurada
 */
async function callGeminiAI(userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const sampleProperties = queryProperties({});
    const contextData = sampleProperties.map(p => `[ID: ${p.id}] ${p.titulo} | Tipo: ${p.tipo} | Zona: ${p.ubicacion} | Precio: ${p.precio} | Dorm: ${p.habitaciones} | Baños: ${p.banos} | Sup: ${p.area} | Info: ${p.descripcion_larga}`).join('\n');

    const prompt = `${SYSTEM_INSTRUCTION}

CATÁLOGO ACTUALIZADO DE PROPIEDADES EN ONE COMSYS:
${contextData}

HISTORIAL DE CHAT PREVIO:
${history.map(h => `${h.role === 'user' ? 'Cliente' : 'ONEBot'}: ${h.text}`).join('\n')}

MENSAJE DEL CLIENTE:
"${userMessage}"

INSTRUCCIONES:
- Responde de forma atractiva, clara y en formato WhatsApp (*negrita*, emojis, viñetas).
- Si el cliente pregunta por inmuebles, dale información precisa y solicita sus datos de contacto (Formulario: Nombre, Celular, Email, Horario de visita).
- Si el cliente completó sus datos, confirma que quedó calificado como Prospecto Potencial y menciona al e-Realtor especialista a cargo.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Error llamando a Gemini API:', error.message);
    return null;
  }
}

/**
 * Consulta la IA de Gemini con el contexto específico de una campaña publicitaria (Impulsar / Meta Ads)
 */
async function callGeminiCampaignAI(campaign, userMessage, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const data = campaign.datos_inmueble || {};
    const ofi = campaign.oficina || {};
    const prompt = `Eres el e-Realtor oficial de "${ofi.nombre || 'Realty ONE Group Bolivia'}" atendiendo prospectos que llegan desde la campaña de Facebook: "${campaign.titulo_campana}".

DATOS 100% REALES Y VERIFICADOS DE ESTA PUBLICACIÓN:
- Propiedad: ${data.tipo || 'Inmueble'}
- Operación: ${data.operacion || 'Venta'}
- Ubicación: ${data.ubicacion || 'Santa Cruz, Bolivia'}
- Accesibilidad: ${data.referencia_acceso || 'Acceso pavimentado'}
- Superficie: ${data.superficie_total || 'Verificada en plano'} ${data.dimensiones ? `(${data.dimensiones})` : ''}
- Precio: ${data.precio_bs || data.precio_usd || 'Consultar'} ${data.precio_usd && data.precio_bs ? `(${data.precio_usd})` : ''}
${data.uso_suelo ? `- Uso de suelo: ${data.uso_suelo}` : ''}
${data.amenidades ? `- Amenidades: ${data.amenidades}` : ''}
${data.servicios_basicos ? `- Servicios básicos: ${data.servicios_basicos}` : ''}
- Estado legal: ${data.estado_legal || 'Folio Real saneado al día'}

DATOS DEL ASESOR A CARGO:
- Asesor: ${ofi.asesor_a_cargo || 'Asesor Realty ONE'}
- Teléfono directo: ${ofi.telefono || '+591 60937050'}
- Oficina: ${ofi.direccion || 'Santa Cruz, Bolivia'}
- Email: ${ofi.email || 'info@realtyonegroup.com.bo'}

HISTORIAL DE CONVERSACIÓN:
${history.map(h => `${h.role === 'user' ? 'Cliente' : 'Asesor'}: ${h.text}`).join('\n')}

MENSAJE DEL CLIENTE:
"${userMessage}"

INSTRUCCIONES IMPORTANTES:
- Responde de forma cordial, ejecutiva, con formato WhatsApp (*negrita*, viñetas y emojis).
- Basa tu respuesta ESTRICTAMENTE en los datos de ESTA publicación específica (no inventes ni mezcles datos con otros inmuebles).
- Si el usuario saluda o pide más información, entrega la ficha técnica completa de ESTA publicación.
- Si el usuario pide agendar visita o dejar datos, solicita su Nombre, Celular y Horario preferido de visita.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 600
        }
      })
    });

    if (!response.ok) return null;
    const resData = await response.json();
    return resData.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    return null;
  }
}

// Estado de sesiones de WhatsApp (userId -> { state: 'NEW' | 'CHATTING' | 'FINISHED', leadData: {}, lastCampaign: null })
const userFlowSessions = new Map();

/**
 * Procesa el mensaje de un cliente en WhatsApp según el flujo oficial de Realty ONE Group
 */
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

  const session = userFlowSessions.get(userId) || { state: 'NEW', leadData: {}, lastCampaign: null };
  const rawMsg = userMessage.trim();
  const lowerMsg = rawMsg.toLowerCase();
  const history = getSessionHistory(userId);
  const nomSaludo = pushName ? ` ${pushName}` : '';

  // 1. COMANDOS DE REINICIO O MENÚ PRINCIPAL
  if (
    lowerMsg === 'reiniciar' || lowerMsg === 'inicio' || lowerMsg === 'reset' || 
    lowerMsg === 'menu' || lowerMsg === 'menú' || lowerMsg === 'empezar de nuevo'
  ) {
    session.state = 'CHATTING';
    session.leadData = {};
    session.lastCampaign = null;
    userFlowSessions.set(userId, session);

    const h = parseInt(new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', hour: 'numeric', hour12: false }).format(new Date()), 10);
    const saludoHora = h >= 5 && h < 12 ? '¡Buenos días' : h >= 12 && h < 19 ? '¡Buenas tardes' : '¡Buenas noches';

    return `${saludoHora}${nomSaludo}! 👋\n\n` +
      `Bienvenido/a a *Realty ONE Group Bolivia* 🦁 — tu asesoría inmobiliaria de confianza en Santa Cruz y Urubó.\n\n` +
      `¿En qué te puedo ayudar hoy?\n\n` +
      `🏡 *Comprar o invertir* (casas, deptos, terrenos, parque industrial)\n` +
      `🌊 *Condominio Mar Adentro* — lotes con laguna cristalina en Urubó\n` +
      `🏭 *Terreno Industrial G77* — 7.000 m² con servicios completos\n` +
      `🔑 *Anticrético seguro* — con revisión legal en DDRR\n` +
      `🏠 *Alquiler* corporativo o residencial\n` +
      `📋 *Consignar mi inmueble* — tasación y marketing gratis\n\n` +
      `_Puedes escribir directamente qué propiedad buscas, cuánto tienes de presupuesto o en qué zona. Yo te oriento._ 😊`;
  }

  // 2. DETECCIÓN DE DATOS DE CONTACTO / AGENDAMIENTO DE VISITA
  // Si el usuario completa el formulario oficial o comparte sus datos en el chat
  const isFormSubmission = (
    lowerMsg.includes('formulario completado') ||
    lowerMsg.includes('@') ||
    (rawMsg.split(',').length >= 3 && /\d/.test(rawMsg)) ||
    ((lowerMsg.includes('me llamo') || lowerMsg.includes('mi nombre es') || lowerMsg.includes('soy ')) && /\d{7,10}/.test(rawMsg)) ||
    (lowerMsg.includes('visita') && (lowerMsg.includes('mañana') || lowerMsg.includes('sabado') || lowerMsg.includes('sábado') || lowerMsg.includes('lunes') || lowerMsg.includes('tarde') || lowerMsg.includes('am') || lowerMsg.includes('pm') || /\d{1,2}:\d{2}/.test(lowerMsg)))
  );

  if (isFormSubmission) {
    session.state = 'FINISHED';
    userFlowSessions.set(userId, session);

    // Intentar deducir la zona o tipo de interés a partir del mensaje y de la campaña previa
    let zonaInteres = session.lastCampaign?.titulo_campana || 'Santa Cruz (General)';
    if (lowerMsg.includes('mar adentro') || lowerMsg.includes('laguna') || lowerMsg.includes('urubo') || lowerMsg.includes('urubó')) {
      zonaInteres = 'Condominio Mar Adentro / Urubó';
    } else if (lowerMsg.includes('g77') || lowerMsg.includes('industrial') || lowerMsg.includes('parque industrial') || lowerMsg.includes('7000') || lowerMsg.includes('7.000')) {
      zonaInteres = 'Terreno Parque Industrial / G77 (7.000 m²)';
    } else if (lowerMsg.includes('departamento') || lowerMsg.includes('dpto') || lowerMsg.includes('4 dorm')) {
      zonaInteres = 'Departamento Residencial';
    } else if (lowerMsg.includes('anticret')) {
      zonaInteres = 'Anticrético Seguro';
    } else if (lowerMsg.includes('alquil')) {
      zonaInteres = 'Alquiler Residencial';
    }

    // Registrar en CRM y SiteGround
    try {
      await leadClassifier.trackAndClassifyLead(userId, rawMsg, `Visita agendada para: ${zonaInteres}`, {
        campana: session.lastCampaign?.titulo_campana || 'Chatbot Directo WhatsApp',
        canal: 'WhatsApp (+591 60937050)',
        pushName: pushName,
        status: 'Visita Agendada',
        zonaInteres: zonaInteres
      });
    } catch (e) {
      console.error('[aiAgent] Error guardando lead en CRM:', e.message);
    }

    // Seleccionar e-Realtor especialista
    let realtorAsignado = 'Carlos Rodríguez (+591 70123456 - Venta de Lujo)';
    if (zonaInteres.includes('Industrial') || zonaInteres.includes('Terreno') || zonaInteres.includes('G77')) {
      realtorAsignado = 'Andrés Montaño (+591 70345678 - Terrenos & Parque Industrial)';
    } else if (zonaInteres.includes('Anticrético')) {
      realtorAsignado = 'Lucía Vaca (+591 70456789 - Especialista en Anticréticos Seguros)';
    } else if (zonaInteres.includes('Alquiler')) {
      realtorAsignado = 'Valeria Suárez (+591 70234567 - Alquileres Corporativos)';
    } else if (zonaInteres.includes('Mar Adentro') || lowerMsg.includes('consignar')) {
      realtorAsignado = 'Robert Oliva (+591 60937050 - Master Broker / Captaciones VIP)';
    }

    return `🎉 *¡SOLICITUD Y VISITA REGISTRADA CON ÉXITO!* 🦁✨\n\n` +
      `Estimado/a${nomSaludo}, tus datos han sido ingresados en *One Comsys* con prioridad *🔥 PROSPECTO POTENCIAL*.\n\n` +
      `📋 *RESUMEN DE TU SOLICITUD:*\n` +
      `👤 *Cliente:* ${pushName || 'Identificado por WhatsApp'}\n` +
      `📱 *Teléfono:* +${userId}\n` +
      `📍 *Propiedad / Zona:* ${zonaInteres}\n` +
      `📅 *Estado:* Visita agendada para coordinación de punto de encuentro.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚡ *ASIGNACIÓN CRM IA ➔ E-REALTOR RESPONSABLE:*\n` +
      `👤 *Asesor Asignado:* *${realtorAsignado}*\n\n` +
      `Tu asesor se comunicará contigo a la brevedad para enviarte la ubicación GPS en Google Maps y los planos técnicos.\n\n` +
      `🌐 *Catálogo completo:* https://realyonegroupbolivia.e-techgroupbolivia.com\n\n` +
      despedidaSegunHora();
  }

  // Si la sesión ya estaba finalizada y el usuario escribe algo breve que no es una consulta nueva
  if (session.state === 'FINISHED') {
    const isNewInquiry = (
      lowerMsg.includes('precio') || lowerMsg.includes('otra') || lowerMsg.includes('casa') ||
      lowerMsg.includes('terreno') || lowerMsg.includes('departamento') || lowerMsg.includes('fotos') ||
      lowerMsg.includes('ubicacion') || lowerMsg.includes('hola')
    );
    if (!isNewInquiry) {
      return null; // Silencio para no saturar al usuario tras la despedida
    }
    // Si hace una consulta nueva, reactivamos
    session.state = 'CHATTING';
    userFlowSessions.set(userId, session);
  }

  // 3. DETECCIÓN PRIORITARIA DE CAMPAÑAS PUBLICITARIAS (Facebook Ads / Click-to-WhatsApp)
  const matchedCamp = campaignService.matchCampaign(userId, userMessage, referralData);
  if (matchedCamp) {
    session.lastCampaign = matchedCamp;
    session.state = 'CHATTING';
    userFlowSessions.set(userId, session);

    // Si Gemini está activo con API Key, obtener respuesta enriquecida
    const geminiResp = await callGeminiCampaignAI(matchedCamp, userMessage, history);
    if (geminiResp && geminiResp.trim().length > 40) {
      history.push({ role: 'user', text: rawMsg });
      history.push({ role: 'model', text: geminiResp });
      return geminiResp;
    }

    // Respuesta experta local basada en la base de datos de campañas
    const localResp = campaignService.generateCampaignResponse(matchedCamp, userMessage, userId, pushName);
    history.push({ role: 'user', text: rawMsg });
    history.push({ role: 'model', text: localResp });
    return localResp;
  }

  // 4. CONSULTAS ESPECÍFICAS DE CATÁLOGO Y BIENES RAÍCES EN BOLIVIA

  // A. ANTICRÉTICO
  if (lowerMsg.includes('anticretico') || lowerMsg.includes('anticrético')) {
    session.state = 'CHATTING';
    userFlowSessions.set(userId, session);

    if (lowerMsg.includes('como funciona') || lowerMsg.includes('qué es') || lowerMsg.includes('que es') || lowerMsg.includes('requisito') || lowerMsg.includes('es seguro') || lowerMsg.includes('seguro')) {
      return `🔑 *El anticrético es una figura 100% boliviana y muy segura — si se hace bien.* 😊\n\n` +
        `¿Cómo funciona? Simple: le entregás un capital en dólares al propietario y a cambio usás el inmueble *sin pagar alquiler mensual*. Al finalizar el contrato (normalmente 1 a 2 años), te devuelven el 100% del capital.\n\n` +
        `*¿Qué hacemos nosotros para que sea seguro?*\n` +
        `✅ Verificamos el *Folio Real actualizado* — que no tenga hipotecas ni embargos.\n` +
        `✅ El contrato se firma ante notario y se registra en *Derechos Reales (DDRR)*.\n` +
        `✅ Tenés respaldo legal durante todo el proceso.\n\n` +
        `Nuestra especialista es *Lucía Vaca* (+591 70456789), con años de experiencia en anticréticos en Santa Cruz.\n\n` +
        `👉 ¿En qué zona estás buscando y cuánto tenés disponible? Te busco opciones.`;
    }

    const anticreticos = queryProperties({ operacion: 'anticretico' });
    if (anticreticos.length > 0) {
      return formatPropertiesForWhatsApp(anticreticos);
    }
  }

  // B. TERRENOS / LOTEAMIENTOS / PARQUE INDUSTRIAL
  if (lowerMsg.includes('terreno') || lowerMsg.includes('lote') || lowerMsg.includes('quinta') || lowerMsg.includes('loteamiento')) {
    session.state = 'CHATTING';
    userFlowSessions.set(userId, session);

    if (lowerMsg.includes('industrial') || lowerMsg.includes('g77') || lowerMsg.includes('galpon') || lowerMsg.includes('galpón')) {
      const campG77 = campaignService.getCampaignById('campana-terreno-industrial-g77');
      if (campG77) {
        session.lastCampaign = campG77;
        return campaignService.generateCampaignResponse(campG77, userMessage, userId, pushName);
      }
    }

    if (lowerMsg.includes('mar adentro') || lowerMsg.includes('laguna') || lowerMsg.includes('playa')) {
      const campMar = campaignService.getCampaignById('campana-lote-mar-adentro-450m2');
      if (campMar) {
        session.lastCampaign = campMar;
        return campaignService.generateCampaignResponse(campMar, userMessage, userId, pushName);
      }
    }

    const terrenos = queryProperties({ operacion: 'terreno' });
    if (terrenos.length > 0) {
      return formatPropertiesForWhatsApp(terrenos);
    }
  }

  // C. ALQUILERES
  if (lowerMsg.includes('alquiler') || lowerMsg.includes('alquilar') || lowerMsg.includes('renta')) {
    session.state = 'CHATTING';
    userFlowSessions.set(userId, session);

    const alquileres = queryProperties({ operacion: 'alquiler' });
    if (alquileres.length > 0) {
      return formatPropertiesForWhatsApp(alquileres);
    }
  }

  // D. VENTAS / CASAS / DEPARTAMENTOS
  if (lowerMsg.includes('venta') || lowerMsg.includes('comprar') || lowerMsg.includes('departamento') || lowerMsg.includes('dpto') || lowerMsg.includes('casa')) {
    session.state = 'CHATTING';
    userFlowSessions.set(userId, session);

    // Si coincide con departamento de 4 dormitorios
    if (lowerMsg.includes('4 dorm') || lowerMsg.includes('segundo anillo') || lowerMsg.includes('2do anillo') || lowerMsg.includes('120.000') || lowerMsg.includes('119')) {
      const campDpto = campaignService.getCampaignById('campana-departamento-4d-segundo-anillo');
      if (campDpto) {
        session.lastCampaign = campDpto;
        return campaignService.generateCampaignResponse(campDpto, userMessage, userId, pushName);
      }
    }

    const ventas = queryProperties({ operacion: 'venta' });
    if (ventas.length > 0) {
      return formatPropertiesForWhatsApp(ventas);
    }
  }

  // E. CONSIGNAR / VENDER MI INMUEBLE (PROPIETARIOS)
  if (lowerMsg.includes('vender mi') || lowerMsg.includes('alquilar mi') || lowerMsg.includes('consignar') || lowerMsg.includes('tengo una casa') || lowerMsg.includes('captacion')) {
    session.state = 'CHATTING';
    userFlowSessions.set(userId, session);

    return `🤝 Perfecto${nomSaludo ? `, *${nomSaludo.trim()}*` : ''}. Con gusto te ayudamos a que tu propiedad se venda o alquile rápido y bien. 🦁\n\n` +
      `Esto es lo que incluye nuestro servicio, *sin costo inicial*:\n\n` +
      `📊 *Tasación comercial* — sabemos exactamente cuánto vale tu inmueble en el mercado hoy.\n` +
      `📸 *Fotos y video profesional* — presentación de alto impacto para compradores serios.\n` +
      `🌐 *Difusión en portales y redes* — llegamos a más de 500 compradores calificados activos.\n` +
      `⚖️ *Filtro de prospectos* — solo te presentamos personas con capacidad real de compra.\n\n` +
      `Te atiende directamente *Robert Oliva*, Master Broker (+591 60937050).\n\n` +
      `👉 ¿En qué zona está tu propiedad y de qué tipo es? (casa, dpto, terreno, oficina)`;
  }

  // F. DOCUMENTACIÓN LEGAL / REQUISITOS EN BOLIVIA
  if (lowerMsg.includes('requisito') || lowerMsg.includes('documento') || lowerMsg.includes('papeles') || lowerMsg.includes('derechos reales') || lowerMsg.includes('folio real')) {
    return `📑 *Requisitos y Documentación Inmobiliaria en Bolivia:* 🦁\n\n` +
      `Para realizar una operación 100% legal y protegida requieres:\n` +
      `1️⃣ *Folio Real actualizado:* Certificado alodial emitido por Derechos Reales (DDRR) sin gravámenes.\n` +
      `2️⃣ *Plano de Uso de Suelo aprobado:* Certificado catastral emitido por el Gobierno Municipal correspondiente.\n` +
      `3️⃣ *Impuestos Municipales:* Comprobantes al día de los últimos 5 años.\n` +
      `4️⃣ *Impuesto Municipal a la Transferencia (IMT / IT):* 3% sobre el valor del inmueble.\n` +
      `5️⃣ *Cédulas de Identidad:* Vigentes de las partes intervinientes.\n\n` +
      `En *Realty ONE Group Itaguazú* nuestro equipo legal revisa cada folio antes de que realices cualquier anticipo.\n\n` +
      `👉 *¿Deseas consultarnos sobre una propiedad en particular o agendar una reunión informativa?*`;
  }

  // 5. INTENTO CON MOTOR GEMINI 2.0 FLASH LITE (Si hay API Key)
  const geminiAnswer = await callGeminiAI(userMessage, history);
  if (geminiAnswer && geminiAnswer.trim().length > 30) {
    history.push({ role: 'user', text: rawMsg });
    history.push({ role: 'model', text: geminiAnswer });
    return geminiAnswer;
  }

  // 6. RESPUESTA CONSULTIVA POR DEFECTO (Asesor Virtual ONEBot)
  session.state = 'CHATTING';
  userFlowSessions.set(userId, session);

  const h2 = parseInt(new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', hour: 'numeric', hour12: false }).format(new Date()), 10);
  const saludoDefault = h2 >= 5 && h2 < 12 ? 'Buenos días' : h2 >= 12 && h2 < 19 ? 'Buenas tardes' : 'Buenas noches';

  return `${saludoDefault}${nomSaludo ? `, ${nomSaludo.trim()}` : ''}! 👋 Gracias por escribirnos a *Realty ONE Group Bolivia* 🦁\n\n` +
    `Cuéntame qué propiedad tenés en mente y yo te oriento con opciones reales de nuestro catálogo. Aquí algunas destacadas:\n\n` +
    `🌊 *Mar Adentro — Urubó:* Lotes con laguna cristalina estilo resort desde $112.500 USD.\n` +
    `🏭 *Parque Industrial G77:* Terreno 7.000 m² con energía trifásica — ideal para industria o logística.\n` +
    `🏡 *Casas y Deptos:* Venta, alquiler y anticrético en Equipetrol, Sirari, Hamacas y Norte.\n\n` +
    `👉 *¿Qué buscás? ¿Cuánto es tu presupuesto o en qué zona?*\n\n` +
    `🌐 Catálogo completo: https://realyonegroupbolivia.e-techgroupbolivia.com\n` +
    `📞 Línea directa: +591 60937050`;
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
