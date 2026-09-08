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

// Memoria de conversación por cada usuario (número de teléfono)
const conversationSessions = new Map();

/**
 * Prompt del Sistema: Define el comportamiento, conocimiento y personalidad del Agente Inmobiliario
 */
const SYSTEM_INSTRUCTION = `
Eres "ONEBot", el asistente inmobiliario inteligente de Realty ONE Group Bolivia.
Tu misión es atender a clientes que buscan comprar, alquilar o tomar en anticrético propiedades en Bolivia (casas, departamentos, condominios, terrenos/lotes, edificios y oficinas), así como propietarios que desean vender o alquilar sus inmuebles.

CARACTERÍSTICAS Y TONO:
- Tono: Profesional, amable, cordial, seguro y experto en bienes raíces en Bolivia.
- Usa formato legible de WhatsApp con emojis adecuados (🏡, 🏢, 🔑, 📍, 💰, 📅, ✨) y *negritas*.
- Responde de forma concisa y clara, sin abrumar, guiando al cliente en el Formulario de Datos y asignándolo al e-Realtor especialista.

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
  if (!conversationSessions.has(userId)) {
    conversationSessions.set(userId, []);
  }
  return conversationSessions.get(userId);
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
  text += `📋 *FORMULARIO DE DATOS & ATENCIÓN DE E-REALTORS:*\n`;
  text += `👉 *Para asignarte al e-Realtor especialista y coordinar tu visita presencial, compártenos en un solo mensaje:*\n\n`;
  text += `1️⃣ *Nombre y Apellido completo:*\n`;
  text += `2️⃣ *Número de Celular / WhatsApp:*\n`;
  text += `3️⃣ *Correo electrónico (E-mail):*\n`;
  text += `4️⃣ *Día y hora sugerida de visita (ej: Mañana 15:30):*\n\n`;
  text += `✍️ *Ejemplo:*\n_Marcos Antezana, 77012345, marcos@gmail.com, Mañana 15:30_`;
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

// Estado de sesiones de WhatsApp (userId -> { state: 'NEW' | 'WAITING_FORM' | 'FINISHED', leadData: {} })
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

  const session = userFlowSessions.get(userId) || { state: 'NEW', leadData: {} };
  const rawMsg = userMessage.trim();
  const lowerMsg = rawMsg.toLowerCase();

  // 1. DETECCIÓN PRIORITARIA DE ANUNCIOS Y PUBLICACIONES DE FACEBOOK
  const isAdEntry = (
    lowerMsg.includes('fb.me') ||
    lowerMsg.includes('quiero más información') ||
    lowerMsg.includes('quiero mas informacion') ||
    lowerMsg.includes('mar adentro') ||
    lowerMsg.includes('terreno industrial') ||
    lowerMsg.includes('itaguazu') ||
    lowerMsg.includes('oportunidad') ||
    Boolean(referralData?.headline || referralData?.source_url)
  );

  if (isAdEntry) {
    session.state = 'WAITING_FORM'; // Reinicia el flujo para la nueva publicación
    userFlowSessions.set(userId, session);

    let adTitle = 'nuestra publicación exclusiva';
    const allText = (lowerMsg + ' ' + (referralData?.headline || '') + ' ' + (referralData?.body || '')).toLowerCase();
    if (allText.includes('mar adentro') || allText.includes('laguna')) {
      adTitle = 'Condominio Mar Adentro (Terrenos con Playa y Laguna Cristalina)';
    } else if (allText.includes('industrial') || allText.includes('g77')) {
      adTitle = 'Terreno Industrial en Venta 7.000 m² (Zona Parque Industrial / G77)';
    } else if (allText.includes('departamento') || allText.includes('dpto')) {
      adTitle = 'Departamento en Venta';
    } else if (referralData?.headline) {
      adTitle = referralData.headline;
    }

    const nomSaludo = pushName ? ` ${pushName}` : '';
    return `¡Hola${nomSaludo}! 👋 Gracias por comunicarte con *Realty ONE Group Bolivia* 🦁✨\n\n` +
      `Nos alegra mucho tu interés en: *${adTitle}* 🏡\n\n` +
      `Para brindarte la ficha técnica y coordinar tu visita presencial en el horario que más te convenga, por favor completa tu formulario oficial:\n\n` +
      `📋 *Completar Formulario & Elegir Horario:*\n` +
      `👉 *https://realyonegroupbolivia.e-techgroupbolivia.com/registro.html*\n\n` +
      `¡Muchas gracias! 🙏`;
  }

  // 2. DETECCIÓN DE FORMULARIO COMPLETADO (vía texto o reenviado desde registro.html)
  const isFormSubmission = (
    lowerMsg.includes('formulario completado') ||
    lowerMsg.includes('@') ||
    (rawMsg.split(',').length >= 3 && /\d/.test(rawMsg))
  );

  if (isFormSubmission) {
    session.state = 'FINISHED'; // Cierra el flujo tras la confirmación
    userFlowSessions.set(userId, session);

    // Registrar prospecto en el CRM (await: SiteGround debe confirmar antes de continuar)
    try {
      await leadClassifier.trackAndClassifyLead(userId, rawMsg, 'Formulario completado y visita agendada', {
        campana: 'Flujo Oficial WhatsApp',
        canal: 'WhatsApp (+591 60937050)',
        pushName: pushName,
        status: 'Visita Agendada'
      });
    } catch (e) {
      console.error('[aiAgent] ❌ Error guardando lead en CRM:', e.message);
    }

    // Secuencia oficial de 4 pasos (Imagen 1, 2 y 3)
    return `✅ *¡Recibido!* Todos tus datos han sido registrados con éxito.\n\n` +
      `🎧 *Aviso de agente:* En breve, nuestro asesor especializado (+591 60937050) se pondrá en contacto contigo para confirmar la dirección exacta y detalles de tu visita.\n\n` +
      `🌐 *Mientras tanto, puedes ver todo nuestro catálogo de inmuebles aquí:*\n` +
      `👉 *https://realyonegroupbolivia.e-techgroupbolivia.com*\n\n` +
      `👋 *¡Muchas gracias por tu tiempo y que tengas un excelente día!*`;
  }

  // 3. SI LA CONVERSACIÓN YA FINALIZÓ TRAS LA DESPEDIDA, SILENCIO TOTAL
  if (session.state === 'FINISHED') {
    if (lowerMsg === 'reiniciar' || lowerMsg === 'inicio' || lowerMsg === 'reset') {
      session.state = 'NEW';
      userFlowSessions.set(userId, session);
    } else {
      return null; // Silencio absoluto
    }
  }

  // 4. PRIMER MENSAJE / BIENVENIDA GENERAL (Paso 1)
  if (session.state === 'NEW') {
    session.state = 'WAITING_FORM';
    userFlowSessions.set(userId, session);

    const nomSaludo = pushName ? ` ${pushName}` : '';
    return `¡Hola${nomSaludo}! 👋 Te damos una cordial bienvenida a *Realty ONE Group Bolivia* 🦁✨\n\n` +
      `Para empezar, asignarte a un asesor especializado y coordinar tu visita en el día y horario que más te convenga, por favor completa tu formulario de registro en el siguiente enlace:\n\n` +
      `📋 *Completar Formulario de Visita:*\n` +
      `👉 *https://realyonegroupbolivia.e-techgroupbolivia.com/registro.html*\n\n` +
      `¡Muchas gracias! 🙏`;
  }

  // 5. SI ENVÍA MENSAJES SIN HABER COMPLETADO EL FORMULARIO (Paso 2 - Exigencia estricta)
  return `🔔 Por favor, primero completa el *formulario de registro* para poder agendar tu visita y coordinar con tu asesor asignado. ¡Muchas gracias! 🙏\n\n` +
    `👉 *https://realyonegroupbolivia.e-techgroupbolivia.com/registro.html*`;
}

module.exports = {
  processUserMessage,
  queryProperties,
  SYSTEM_INSTRUCTION
};
