/**
 * Servicio Independiente de Campañas Publicitarias (Facebook Ads & Click-to-WhatsApp)
 * Gestiona el conocimiento experto, respuestas autónomas y enlaces para anuncios individuales.
 */

const fs = require('fs');
const path = require('path');

const CAMPAIGNS_FILE = path.join(__dirname, '..', 'campaigns.json');

// Memoria de sesión de campaña activa por usuario (userId -> campaignId)
const userActiveCampaignSession = new Map();

/**
 * Carga todas las campañas desde el archivo JSON
 */
function getCampaigns() {
  try {
    if (!fs.existsSync(CAMPAIGNS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(CAMPAIGNS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error al leer campaigns.json:', error);
    return [];
  }
}

/**
 * Guarda campañas en el archivo JSON
 */
function saveCampaigns(campaigns) {
  try {
    fs.writeFileSync(CAMPAIGNS_FILE, JSON.stringify(campaigns, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error al guardar campaigns.json:', error);
    return false;
  }
}

/**
 * Obtiene una campaña por su ID
 */
function getCampaignById(id) {
  const list = getCampaigns();
  return list.find(c => c.id === id);
}

/**
 * Agrega o actualiza una campaña publicitaria
 */
function upsertCampaign(campaignData) {
  const list = getCampaigns();
  const index = list.findIndex(c => c.id === campaignData.id);
  if (index >= 0) {
    list[index] = { ...list[index], ...campaignData };
  } else {
    list.push({
      id: campaignData.id || `campana-${Date.now()}`,
      activo: campaignData.activo !== undefined ? campaignData.activo : true,
      ...campaignData
    });
  }
  saveCampaigns(list);
  return campaignData;
}

/**
 * Normaliza texto para comparaciones de búsqueda
 */
function normalizeText(str = '') {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Detecta si el mensaje entrante o la metadata de Meta corresponde a una campaña específica
 */
function matchCampaign(userId, userMessage = '', referralData = null) {
  const campaigns = getCampaigns().filter(c => c.activo);
  if (campaigns.length === 0) return null;

  const normalizedMsg = normalizeText(userMessage);

  // Si es un saludo general o clic en el botón de la página de Facebook, no forzar campaña
  const isGenericGreeting = (
    /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|saludos|ola|menu|inicio|hi|hello)$/i.test(normalizedMsg.trim()) ||
    normalizedMsg.includes('pagina de facebook') ||
    normalizedMsg.includes('perfil de facebook') ||
    normalizedMsg.includes('boton de whatsapp')
  );

  // 1. Prioridad Máxima: Si el mensaje entrante o referralData coincide con una campaña específica
  let bestMatch = null;
  let highestScore = 0;

  const referralText = referralData ? normalizeText(`${referralData.headline || ''} ${referralData.body || ''} ${referralData.source_url || ''} ${referralData.description || ''} ${referralData.fullContext || ''}`) : '';
  const searchCorpus = `${normalizedMsg} ${referralText}`.trim();

  const isOrganicInquiry = !referralData;
  const isOwnerListing = normalizedMsg.includes('vender mi') || normalizedMsg.includes('alquilar mi') || normalizedMsg.includes('consignar') || normalizedMsg.includes('tengo una casa') || normalizedMsg.includes('captacion');
  const isRentalOrAnticretico = normalizedMsg.includes('alquiler') || normalizedMsg.includes('alquilar') || normalizedMsg.includes('renta') || normalizedMsg.includes('anticretico');

  if (isOrganicInquiry && isOwnerListing) {
    userActiveCampaignSession.delete(userId);
    return null;
  }

  for (const camp of campaigns) {
    let score = 0;

    // Si es búsqueda orgánica de alquiler/anticrético y la campaña es venta, no puntuar
    const campOp = (camp.datos_inmueble?.operacion || '').toLowerCase();
    if (isOrganicInquiry && isRentalOrAnticretico && campOp === 'venta') {
      continue;
    }

    // Coincidencia de ID o Meta Ad ID
    if (referralData?.source_id && camp.meta_ad_id && camp.meta_ad_id === referralData.source_id) {
      score += 100;
    }

    // Coincidencia de palabras clave específicas del inmueble
    for (const kw of (camp.palabras_clave || [])) {
      const nKw = normalizeText(kw);
      if (searchCorpus.includes(nKw)) {
        score += nKw.length > 5 ? 20 : 10;
      }
    }

    // Coincidencia por título de campaña
    if (camp.titulo_campana && searchCorpus.includes(normalizeText(camp.titulo_campana))) {
      score += 40;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = camp;
    }
  }

  // Si encontramos coincidencia clara en el mensaje o referral (mínimo 30 puntos para evitar falsos positivos)
  if (bestMatch && highestScore >= 30) {
    userActiveCampaignSession.set(userId, bestMatch.id);
    return bestMatch;
  }

  // Si es un nuevo clic de anuncio de Facebook (referralData o fb.me), limpiar sesión previa para no reciclar campañas antiguas
  if (referralData || userMessage.includes('fb.me') || userMessage.includes('OPORTUNIDAD')) {
    userActiveCampaignSession.delete(userId);
    return null; // Permitir que aiAgent maneje el anuncio con la respuesta genérica consultiva
  }

  // Si es saludo general del botón azul, borrar sesión anterior y devolver null para bienvenida general
  if (isGenericGreeting) {
    userActiveCampaignSession.delete(userId);
    return null;
  }

  // 2. Si no hay coincidencia nueva en el texto pero está en conversación activa de esa campaña (solo para seguimiento orgánico)
  if (userActiveCampaignSession.has(userId) && !referralData) {
    const isExit = /^(menu principal|ver todo el catalogo|otra zona completamente distinta|chau|cancelar|menu|inicio)$/i.test(normalizedMsg.trim()) ||
      isOwnerListing || (isOrganicInquiry && isRentalOrAnticretico);
    if (!isExit) {
      const activeCamp = campaigns.find(c => c.id === userActiveCampaignSession.get(userId));
      if (activeCamp) return activeCamp;
    } else {
      userActiveCampaignSession.delete(userId);
    }
  }

  return null;
}

// Memoria de captura de datos por usuario (userId -> { datosCapturados: boolean, nombre: string, email: string, telefono: string, fichaEntregada: boolean })
const campaignUserSessions = new Map();

function getFirstName(fullName = '') {
  if (!fullName) return '';
  const first = fullName.trim().split(' ')[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : '';
}

/**
 * Genera una respuesta experta y autónoma con 100% de cobertura sobre la publicación específica
 * @param {object} campaign - Ficha de la campaña
 * @param {string} userMessage - Mensaje del cliente
 * @param {string} userId - Teléfono / ID del usuario
 * @param {string} pushName - Nombre de perfil de WhatsApp
 */
function generateCampaignResponse(campaign, userMessage = '', userId = '', pushName = '') {
  // Extraer la intención real del usuario (separando si viene con el contexto de la publicación)
  let cleanUserMsg = userMessage;
  if (cleanUserMsg.includes('|')) {
    cleanUserMsg = cleanUserMsg.split('|')[0].trim();
  }
  const msg = normalizeText(cleanUserMsg);

  const data = campaign.datos_inmueble || {};
  const ofi = campaign.oficina || {};

  const campId = (campaign.id || '').toLowerCase();
  const campTitle = (campaign.titulo_campana || '').toLowerCase();
  const isMarAdentro = campId.includes('mar-adentro') || campTitle.includes('mar adentro');
  const isDpto = campId.includes('departamento') || campTitle.includes('departamento');
  const isFicha = campId.includes('ficha-tecnica') || campTitle.includes('ficha tecnica');

  // Sesión del usuario
  const sessionKey = userId || 'default';
  const session = campaignUserSessions.get(sessionKey) || { datosCapturados: false, nombre: pushName || '', fichaEntregada: false };
  if (pushName && !session.nombre) session.nombre = pushName;

  const firstName = getFirstName(session.nombre || pushName);
  const saludoNom = firstName ? ` ${firstName}` : '';
  const dirNom = firstName ? `${firstName}, ` : '';

  // Verificar si el mensaje actual contiene datos de contacto (Email, o formato separado por comas con teléfono)
  const hasEmail = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/i.test(cleanUserMsg);
  const hasCommaData = cleanUserMsg.split(',').length >= 3 && (/\d{7,}/.test(cleanUserMsg) || hasEmail);
  if (hasEmail || hasCommaData) {
    session.datosCapturados = true;
    campaignUserSessions.set(sessionKey, session);
  }

  // Detectar si el mensaje proviene de un anuncio de Facebook (CTWA o compartido)
  const fullNormMsg = normalizeText(userMessage);
  const isAdEntry = (
    userMessage.includes('fb.me') ||
    userMessage.includes('OPORTUNIDAD') ||
    userMessage.includes('Quiero más información') ||
    userMessage.includes('quiero mas informacion') ||
    fullNormMsg.includes('vi la publicidad') ||
    fullNormMsg.includes('vi el anuncio') ||
    fullNormMsg.includes('deseo mas informacion') ||
    fullNormMsg.includes('solicito la ficha tecnica') ||
    fullNormMsg.includes('sobre la publicacion') ||
    fullNormMsg.includes('sobre el anuncio') ||
    /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|ola|hi|hello)/i.test(msg)
  );

  // Si entra desde una nueva publicación, reiniciar estado para solicitar datos obligatoriamente
  if (isAdEntry && !hasEmail && !hasCommaData) {
    session.visitaConfirmada = false;
    session.esperandoHorario = false;
    session.fichaEntregada = false;
    session.datosCapturados = false;
    campaignUserSessions.set(sessionKey, session);
  }

  // 1. SI LA CITA YA FUE CONFIRMADA Y EL USUARIO SE DESPIDE
  const isGoodbye = (
    msg.includes('gracias') || msg.includes('muchas gracias') ||
    msg.includes('chau') || msg.includes('hasta luego') ||
    msg.includes('nos vemos') || msg.includes('adios')
  );

  if (session.visitaConfirmada && isGoodbye && !isAdEntry) {
    return `¡A ti${saludoNom}! ✨ Quedamos a tu completa disposición para la visita. ¡Que tengas un excelente día! ✨`;
  }

  // 1b. SI EL USUARIO ENVÍA EL DÍA Y HORA DE LA VISITA (Ej: "martes, a las 11:00")
  const hasTimeIndicator = (
    msg.includes('lunes') || msg.includes('martes') || msg.includes('miercoles') ||
    msg.includes('jueves') || msg.includes('viernes') || msg.includes('sabado') ||
    msg.includes('domingo') || msg.includes('manana') || msg.includes('hoy') ||
    msg.includes('fin de semana') || msg.includes('a las') ||
    /\b\d{1,2}:\d{2}\b/.test(msg) || /\b\d{1,2}\s*(am|pm|hrs|de la)\b/i.test(msg)
  );

  const isGenericVisitRequest = (
    (msg.includes('visita') || msg.includes('agendar') || msg.includes('coordinar') || msg.includes('cita')) &&
    !hasTimeIndicator
  );

  const isDateTimeMessage = (
    hasTimeIndicator ||
    (session.esperandoHorario && !isGenericVisitRequest)
  );

  if (isDateTimeMessage && !hasEmail && !hasCommaData && !isAdEntry && !isGenericVisitRequest && !msg.includes('precio') && !msg.includes('medida') && !msg.includes('ubicacion')) {
    session.esperandoHorario = false;
    session.visitaConfirmada = true;

    let horarioLimpio = cleanUserMsg;
    const timeMatch = cleanUserMsg.match(/\b(?:el\s+)?(?:este\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|mañana|hoy|fin de semana)\b[^\n.?]*/i);
    if (timeMatch) {
      horarioLimpio = timeMatch[0].trim();
    } else {
      const hourMatch = cleanUserMsg.match(/\b(?:a\s+las\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs)?\b/i);
      if (hourMatch) horarioLimpio = hourMatch[0].trim();
    }
    session.horarioVisita = horarioLimpio;
    campaignUserSessions.set(sessionKey, session);

    const legalNote = (msg.includes('folio real') || msg.includes('papel') || msg.includes('alodial') || msg.includes('legal'))
      ? `\n\n📑 *Documentación:* La propiedad cuenta con Folio Real individualizado e impuestos al día, lista para transferencia notariada inmediata.`
      : '';

    return `📅 *¡Perfecto${saludoNom}! Cita agendada con éxito.* ✨\n\n` +
      `Te esperamos el *${horarioLimpio}* en *${campaign.titulo_campana}*.${legalNote}\n\n` +
      `El asesor de Realty ONE (+591 60937050) te enviará la ubicación exacta por GPS y te registrará el ingreso autorizado en portería.\n\n` +
      `¡Muchas gracias y que tengas un excelente día! 🤝`;
  }

  // ponytail: 2. ENTRADA DESDE ANUNCIO O PRIMERA CONSULTA: ASESOR INMOBILIARIO REAL Y CONVERSACIONAL
  if ((isAdEntry || !session.fichaEntregada) && !hasEmail && !hasCommaData && !msg.includes('foto') && !msg.includes('medida') && !msg.includes('precio') && !msg.includes('ubicacion')) {
    session.fichaEntregada = true;
    campaignUserSessions.set(sessionKey, session);

    if (isDpto) {
      return `¡Hola${saludoNom}! 👋 Qué tal, un gusto saludarte. Soy asesor de *${ofi.nombre || 'Realty ONE Group Itaguazú'}* 🦁\n\n` +
        `Vi que consultaste por el *Departamento de 4 Dormitorios* (119 m²) cerca del 2do Anillo. ¡Es una opción fantástica, súper amplia y muy bien ubicada!\n\n` +
        `Para brindarte la carpeta digital completa (planos de planta, fotos en alta resolución) y coordinar una atención preferencial con nuestro asesor especialista, por favor compártenos:\n\n` +
        `1. 👤 *Nombre completo:*\n` +
        `2. 📱 *Número de celular o WhatsApp:*\n` +
        `3. ✉️ *Correo electrónico:*\n` +
        `4. 📅 *¿Qué día y hora te gustaría agendar una visita presencial?*\n\n` +
        `✍️ _Puedes enviarnos tus datos en un solo mensaje (ej: ${firstName || 'Marcos'} Pérez, 60937050, correo@gmail.com, sábado 10:00 am)_ 🤝`;
    }

    if (isMarAdentro) {
      return `¡Hola${saludoNom}! 👋 Qué tal, un gusto saludarte. Soy asesor de *${ofi.nombre || 'Realty ONE Group Itaguazú'}* 🦁\n\n` +
        `Vi tu consulta sobre el terreno en *Condominio Mar Adentro* (Urubó). ¡Vivir o invertir a pasos de la laguna cristalina Crystal Lagoons es un lujo total!\n\n` +
        `Para gestionarte el pase de visita a la laguna y compartirte la carpeta con planos y ubicaciones disponibles, por favor compártenos:\n\n` +
        `1. 👤 *Nombre completo:*\n` +
        `2. 📱 *Número de celular o WhatsApp:*\n` +
        `3. ✉️ *Correo electrónico:*\n` +
        `4. 📅 *¿Qué día y hora te gustaría agendar tu visita a Mar Adentro?*\n\n` +
        `✍️ _Puedes enviarnos tus datos en un solo mensaje (ej: ${firstName || 'Marcos'} Pérez, 60937050, correo@gmail.com, sábado 10:00 am)_ 🏖️🤝`;
    }

    if (campId.includes('industrial') || campTitle.includes('industrial') || campTitle.includes('g77')) {
      return `¡Hola${saludoNom}! 👋 Un saludo cordial. Soy asesor de *${ofi.nombre || 'Realty ONE Group Itaguazú'}* 🦁\n\n` +
        `Vi tu interés en el *Terreno Industrial de 7.000 m²* con salida directa a la Av. G77. Es un predio estratégico con 185 metros de frente y factibilidad trifásica en puerta.\n\n` +
        `Para prepararte el informe técnico de linderos y coordinar la inspección en el terreno, por favor facilítanos:\n\n` +
        `1. 👤 *Nombre completo o Razón Social:*\n` +
        `2. 📱 *Número de celular o WhatsApp:*\n` +
        `3. ✉️ *Correo electrónico:*\n` +
        `4. 📅 *¿Qué día y hora te gustaría agendar una inspección técnica en el predio?*\n\n` +
        `✍️ _Puedes enviarnos tus datos en un solo mensaje (ej: ${firstName || 'Marcos'} Pérez, 60937050, correo@gmail.com, mañana 15:00)_ 🤝`;
    }

    return `¡Hola${saludoNom}! 👋 Qué tal, un gusto saludarte. Soy asesor de *${ofi.nombre || 'Realty ONE Group Bolivia'}* 🦁\n\n` +
      `Vi tu consulta sobre *${campaign.titulo_campana}*. ¡Es una excelente oportunidad inmobiliaria en Santa Cruz!\n\n` +
      `Para enviarte la carpeta digital completa con planos y coordinar tu atención prioritaria, por favor compártenos:\n\n` +
      `1. 👤 *Nombre completo:*\n` +
      `2. 📱 *Número de celular o WhatsApp:*\n` +
      `3. ✉️ *Correo electrónico:*\n` +
      `4. 📅 *¿Qué día y hora te gustaría agendar una visita presencial?*\n\n` +
      `✍️ _Puedes responder con tus datos en un solo mensaje (ej: ${firstName || 'Marcos'} Pérez, 60937050, correo@gmail.com, sábado 10:00 am)_ 🤝`;
  }

  // 3. SI EL USUARIO ENVÍA DATOS DE CONTACTO (Email / comas)
  if (hasEmail || hasCommaData) {
    session.datosCapturados = true;
    session.fichaEntregada = true;

    if (hasTimeIndicator) {
      session.visitaConfirmada = true;
      let horarioExtraido = cleanUserMsg;
      const parts = cleanUserMsg.split(',');
      if (parts.length >= 4) {
        horarioExtraido = parts.slice(3).join(',').trim();
      } else {
        const timeMatch = cleanUserMsg.match(/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|mañana|hoy|fin de semana).*$/i);
        if (timeMatch) horarioExtraido = timeMatch[0].trim();
      }
      session.horarioVisita = horarioExtraido;
      campaignUserSessions.set(sessionKey, session);

      return `🎉 *¡Excelente${saludoNom}! Cita agendada y datos registrados con éxito.* 🦁✨\n\n` +
        `📋 *Detalles de tu Solicitud:*\n` +
        `• 🏡 *Propiedad:* ${campaign.titulo_campana}\n` +
        `• 📅 *Visita Agendada:* ${horarioExtraido}\n` +
        `• 👤 *Asesor Asignado:* ${ofi.asesor_a_cargo || 'Asesor Realty ONE'} (Tel: +591 60937050)\n\n` +
        `Tu asesor te enviará los planos y la ubicación exacta por GPS para registrar tu ingreso autorizado en portería.\n\n` +
        `¡Muchas gracias y nos vemos en la visita! 🤝`;
    }

    campaignUserSessions.set(sessionKey, session);
    return `¡Muchas gracias${saludoNom}! 🦁✨ Hemos registrado tus datos con éxito en nuestro sistema de atención.\n\n` +
      `👤 *Asesor Asignado:* ${ofi.asesor_a_cargo || 'Asesor Realty ONE'} (Tel: +591 60937050)\n` +
      `🏡 *Propiedad:* ${campaign.titulo_campana}\n\n` +
      `Tu asesor se comunicará contigo para compartirte los planos y carpeta digital.\n\n` +
      `👉 *${dirNom}¿qué día y hora te queda más cómodo para agendar tu visita presencial?* (ej: *mañana por la tarde* o *este sábado a las 10:00 am*). 🤝`;
  }

  // 3b. CALIFICACIÓN: RESPUESTA A PROPÓSITO (VIVIENDA / INVERSIÓN)
  if (msg.includes('vivienda') || msg.includes('vivir') || msg.includes('familiar') || msg.includes('mi familia') || msg.includes('para mi')) {
    session.esperandoHorario = true;
    campaignUserSessions.set(sessionKey, session);
    return `¡Espectacular elección${saludoNom}! 🏡 Tener un espacio cómodo, seguro y bien ubicado para la familia te cambia el día a día. Lo mejor es sentir la amplitud en persona.\n\n` +
      `¿Te quedaría cómodo pasar a verlo entre semana por la tarde o preferís este sábado en la mañana? 🤝`;
  }

  if (msg.includes('inversion') || msg.includes('invertir') || msg.includes('renta') || msg.includes('alquilar') || msg.includes('alquiler') || msg.includes('plusvalia') || msg.includes('negocio')) {
    return `¡Excelente visión de inversión${saludoNom}! 📈 En esta zona la demanda y la plusvalía se mantienen muy firmes.\n\n` +
      `¿Querés que te prepare los números de retorno estimado y proforma, o preferís que coordinemos una visita para evaluar el potencial en el lugar? 🤝`;
  }


  // 4. AGENDAR VISITA, COORDINAR INSPECCIÓN O CITAS
  if (msg.includes('visita') || msg.includes('gustaria') || msg.includes('coordinar') || msg.includes('pase') || msg.includes('ir a ver') || msg.includes('ver el terreno') || msg.includes('ver el dpto') || msg.includes('ver el departamento') || msg.includes('ver el lote') || msg.includes('recorrer') || msg.includes('inspeccion') || msg.includes('cuando puedo') || msg.includes('horario') || msg.includes('agendar') || msg.includes('cita')) {
    session.esperandoHorario = true;
    campaignUserSessions.set(sessionKey, session);
    return `¡Con mucho gusto${saludoNom}! 🤝✨\n\n` +
      `Será un placer coordinar tu visita presencial a *${campaign.titulo_campana}*.\n\n` +
      `¿Qué día y hora te queda más cómodo pasar? (Por ejemplo: *este sábado a las 10:00 am* o *mañana por la tarde*).\n\n` +
      `El asesor de Realty ONE (+591 60937050) te registrará el ingreso autorizado en portería y te esperará en el lugar.`;
  }

  // 5. FOTOS, IMÁGENES, VIDEOS, GALERÍA
  if (msg.includes('foto') || msg.includes('imagen') || msg.includes('imagenes') || msg.includes('galeria') || msg.includes('ver foto') || msg.includes('video') || msg.includes('videos')) {
    if (isDpto) {
      return `📸 *Fotografías del Departamento de 4 Dormitorios (119 m²):*\n\n` +
        `Hola${saludoNom}, te comparto el detalle de los ambientes del departamento:\n` +
        `🏢 *Fachada:* Edificio residencial moderno con ascensor y seguridad.\n` +
        `🛋️ *Área Social:* Sala-comedor amplia, iluminada y con pisos de primera.\n` +
        `🍳 *Cocina:* Cocina independiente equipada con mesón y cajonería empotrada.\n` +
        `🛏️ *4 Dormitorios:* 1 Suite principal con balcón privado y roperos + 3 dormitorios amplios.\n` +
        `🚿 *3 Baños:* 3 baños completos con grifería y revestimiento de primera.\n\n` +
        `👉 ${dirNom}¿te gustaría coordinar una visita presencial para conocer el departamento personalmente?`;
    }
    if (isMarAdentro) {
      return `📸 *Fotografías de Condominio Mar Adentro:*\n\n` +
        `Hola${saludoNom}, te comparto los detalles visuales de la propiedad:\n` +
        `🌊 *Laguna Cristalina:* Espectacular laguna estilo Crystal Lagoons con aguas turquesas y playa de arena blanca.\n` +
        `🏖️ *Lote de 450 m²:* Terreno plano y regular a solo 300 metros de la laguna.\n` +
        `🏰 *Club House:* Áreas de recreación, restaurante, piscinas y canchas de tenis y fútbol.\n\n` +
        `👉 ${dirNom}¿te gustaría coordinar un pase de visita para conocer el condominio y la laguna este fin de semana?`;
    }
    return `📸 *Fotografías y Planos del Terreno Industrial 7.000 m² (G77):*\n\n` +
      `Hola${saludoNom}, te comparto los detalles visuales del predio:\n` +
      `📐 *Vista y Linderos:* Terreno plano de 7.000 m² con 185 metros de frente sobre vía pavimentada.\n` +
      `🚛 *Accesibilidad Av. G77:* Corredor de alto impacto con radio de giro para camiones y trailers.\n` +
      `⚡ *Infraestructura:* Red de alta tensión y tendido industrial en puerta.\n\n` +
      `👉 ${dirNom}¿desea coordinar una visita técnica al terreno para verificar linderos?`;
  }

  // 6. DISTRIBUCIÓN, DORMITORIOS, BAÑOS, COCINA
  if (msg.includes('dormitorio') || msg.includes('dorm') || msg.includes('habitacion') || msg.includes('cuarto') || msg.includes('bano') || msg.includes('baño') || msg.includes('cocina') || msg.includes('sala') || msg.includes('distribucion') || msg.includes('balcon') || msg.includes('suite')) {
    if (isDpto) {
      return `🛏️ *Distribución de los 4 Dormitorios y Ambientes:*\n\n` +
        `Hola${saludoNom}, el departamento de *119 m²* cuenta con:\n` +
        `• *Master Suite:* 1 dormitorio principal en suite con baño privado, roperos empotrados y balcón exclusivo.\n` +
        `• *3 Dormitorios Secundarios:* Espaciosos, ventilados y con roperos empotrados.\n` +
        `• *3 Baños:* 1 en suite, 1 compartido familiar y 1 de visitas.\n` +
        `• *Sala-Comedor:* Amplio living comedor con excelente iluminación natural.\n` +
        `• *Cocina:* Cocina cerrada independiente con mesón y gas domiciliario instalado.\n\n` +
        `👉 ${dirNom}¿te gustaría coordinar una visita presencial para conocer la distribución?`;
    }
  }

  // 7. PARQUEO, GARAJE, ASCENSOR, EXPENSAS
  if (msg.includes('parqueo') || msg.includes('garaje') || msg.includes('estacionamiento') || msg.includes('cochera') || msg.includes('ascensor') || msg.includes('expensa') || msg.includes('mantenimiento')) {
    if (isDpto) {
      return `🚗 *Detalles de Edificio, Ascensor y Servicios:*\n\n` +
        `Hola${saludoNom}, el edificio cuenta con:\n` +
        `✅ *Ascensor:* De última tecnología con acceso directo.\n` +
        `✅ *Seguridad:* Ingreso controlado y cámaras 24/7.\n` +
        `✅ *Servicios:* Gas domiciliario instalado, agua y luz individual.\n` +
        `✅ *Expensas:* Bajas y optimizadas para el mantenimiento de áreas comunes.\n\n` +
        `👉 ${dirNom}¿te gustaría agendar una visita para conocer el edificio?`;
    }
  }

  // 8. SUPERFICIE, MEDIDAS, FRENTE, FONDO Y DIMENSIONES
  if (msg.includes('medida') || msg.includes('dimension') || msg.includes('cuanto mide') || msg.includes('superficie') || msg.includes('tamano') || msg.includes('area') || msg.includes('frente') || msg.includes('fondo') || msg.includes('hectarea') || msg.includes('metros cuadrados') || msg.includes('m2')) {
    return `📐 *Dimensiones y Superficie del Inmueble:*\n\n` +
      `Hola${saludoNom}, la propiedad cuenta con:\n` +
      `• *Superficie Total:* *${data.superficie_total || 'Verificada en plano'}*\n` +
      `• *Dimensiones:* *${data.dimensiones || 'Terreno regular'}*\n` +
      (data.colindancias ? `• *Colindancias:* ${data.colindancias}\n` : '') +
      (data.referencia_acceso ? `• *Accesibilidad:* ${data.referencia_acceso}\n` : '') +
      `• *Topografía:* Terreno plano, nivelado y listo para construcción inmediata.\n\n` +
      `👉 ${dirNom}¿deseas coordinar una visita presencial para conocer el terreno y verificar linderos?`;
  }

  // 9a. CRÉDITO BANCARIO, FINANCIAMIENTO Y CUOTA INICIAL
  if (msg.includes('credito') || msg.includes('crédito') || msg.includes('banco') || msg.includes('financiamiento') || msg.includes('cuota inicial')) {
    return `🏦 *Crédito Bancario y Financiamiento:* 🦁\n\n` +
      `Hola${saludoNom}, la propiedad cuenta con documentación 100% al día (Folio Real individualizado e impuestos saneados), por lo que es *apta para crédito hipotecario / de vivienda* con cualquier entidad financiera de Bolivia.\n\n` +
      `• Generalmente los bancos financian entre el 80% y 90%, requiriendo un 10% a 20% de cuota inicial.\n\n` +
      `👉 ¿Cuentas ya con pre-aprobación bancaria o te gustaría que nuestro equipo te oriente con el trámite? 🤝`;
  }

  // 9b. PERMUTAS Y VEHÍCULOS
  if (msg.includes('permuta') || msg.includes('auto') || msg.includes('vehiculo') || msg.includes('vehículo') || msg.includes('cambio') || msg.includes('reciben')) {
    return `🚗 *Permutas y Formas de Pago:* 🦁\n\n` +
      `Hola${saludoNom}, los propietarios pueden evaluar propuestas formales que incluyan bienes de menor valor (como vehículos o lotes) como parte de pago, previa tasación comercial.\n\n` +
      `👉 Cuéntame, ¿qué bien o propuesta tienes en mente? Con gusto la analizamos con el asesor a cargo. 🤝`;
  }

  // 9c. PRECIO, VALOR, FORMAS DE PAGO Y OFERTAS
  if (msg.includes('precio') || msg.includes('cuanto cuesta') || msg.includes('cuanto piden') || msg.includes('valor') || msg.includes('costo') || msg.includes('bolivianos') || msg.includes('bs') || msg.includes('pago') || msg.includes('oferta') || msg.includes('rebaja') || msg.includes('negociable')) {
    const precioPrincipal = data.precio_usd || data.precio_bs || 'Consultar con asesor';

    return `💰 *Inversión y Condiciones Financieras:*\n\n` +
      `Hola${saludoNom}, el precio de venta es de *${precioPrincipal}*.\n\n` +
      `• *Superficie:* ${data.superficie_total}\n` +
      `• *Modalidades:*\n` +
      `  ✅ Pago al contado vía transferencia bancaria.\n` +
      `  ✅ Apto para Crédito Bancario institucional.\n` +
      `  ✅ Se pueden evaluar propuestas formales de compra.\n\n` +
      `👉 ${dirNom}¿deseas que te preparemos la proforma o coordinamos una visita para conocer la propiedad?`;
  }

  // 9d. EXPENSAS Y MANTENIMIENTO
  if (msg.includes('expensa') || msg.includes('expensas') || msg.includes('mantenimiento')) {
    return `🏢 *Expensas y Mantenimiento:* 🦁\n\n` +
      `Hola${saludoNom}, las expensas son moderadas y están destinadas al mantenimiento de áreas comunes, seguridad y servicios.\n\n` +
      `👉 ¿Te gustaría que coordinemos una visita presencial para conocer los ambientes e instalaciones en persona? 🤝`;
  }

  // 10. ENVÍO DIRECTO DE UBICACIÓN GOOGLE MAPS / RESPUESTAS AFIRMATIVAS ("si", "claro", "dale")
  if (
    msg.includes('google maps') || msg.includes('maps') || msg.includes('link') ||
    msg.includes('mandame la ubicacion') || msg.includes('enviame la ubicacion') || msg.includes('pasame la ubicacion') ||
    msg.includes('si por favor') || msg.includes('si, por favor') || msg.includes('por favor') ||
    msg.includes('claro') || msg.includes('dale') || msg.includes('enviar') ||
    msg === 'si' || msg === 'si!'
  ) {
    const mapUrl = data.link_google_maps || 'https://maps.google.com/?q=Santa+Cruz+de+la+Sierra+Bolivia';

    return `📍 *UBICACIÓN EXACTA EN GOOGLE MAPS:* 🦁✨\n\n` +
      `Hola${saludoNom}, aquí tienes la ubicación exacta:\n` +
      `🏡 *Inmueble:* ${campaign.titulo_campana}\n` +
      `🗺️ *Dirección:* ${data.ubicacion}\n` +
      `🚗 *Referencia:* ${data.referencia_acceso}\n\n` +
      `🔗 *Toca aquí para abrir en Google Maps:*\n${mapUrl}\n\n` +
      `👉 *${dirNom}¿te gustaría agendar una visita presencial para ir a conocerlo?* Indícanos qué día y hora te queda más cómodo.`;
  }

  // 11. DESCRIPCIÓN DE UBICACIÓN, ACCESOS Y DISTANCIA
  if (msg.includes('ubicacion') || msg.includes('donde queda') || msg.includes('donde esta') || msg.includes('direccion') || msg.includes('acceso') || msg.includes('como llegar') || msg.includes('llegar') || msg.includes('zona') || msg.includes('distancia')) {
    const mapUrl = data.link_google_maps || 'https://maps.google.com/?q=Santa+Cruz+de+la+Sierra+Bolivia';

    return `📍 *Ubicación Exacta y Accesibilidad:*\n\n` +
      `Hola${saludoNom}, la propiedad está estratégicamente ubicada:\n` +
      `🏢 *Inmueble:* ${campaign.titulo_campana}\n` +
      `🗺️ *Dirección:* ${data.ubicacion}\n` +
      `🛣️ *Acceso Principal:* ${data.referencia_acceso}\n` +
      (data.colindancias ? `📐 *Colindancias:* ${data.colindancias}\n` : '') +
      `\n🔗 *Google Maps:* ${mapUrl}\n\n` +
      `👉 ${dirNom}¿te gustaría coordinar una visita presencial para conocer el inmueble?`;
  }

  // 12. AMENIDADES, LAGUNA, CLUB HOUSE, PARQUES
  if (msg.includes('amenidad') || msg.includes('amenities') || msg.includes('club') || msg.includes('playa') || msg.includes('laguna') || msg.includes('piscina') || msg.includes('cancha') || msg.includes('gimnasio') || msg.includes('restaurante')) {
    if (data.amenidades) {
      return `🏖️ *Amenidades Exclusivas:* 🌊✨\n\n` +
        `Hola${saludoNom}, el condominio ofrece:\n` +
        `${data.amenidades}\n\n` +
        `👉 ${dirNom}¿te gustaría coordinar un pase de visita para conocer el lugar este fin de semana?`;
    }
  }

  // 13. SERVICIOS BÁSICOS, LUZ, AGUA, GAS, TRIFÁSICA
  if (msg.includes('servicio') || msg.includes('luz') || msg.includes('agua') || msg.includes('gas') || msg.includes('energia') || msg.includes('electricidad') || msg.includes('trifasica') || msg.includes('fibra') || msg.includes('internet') || msg.includes('alcantarillado')) {
    return `⚡ *Servicios e Infraestructura Disponible:*\n\n` +
      `Hola${saludoNom}, los servicios disponibles son:\n` +
      `✅ *Servicios:* ${data.servicios_basicos || 'Servicios completos disponibles'}\n` +
      (data.uso_suelo ? `🏗️ *Uso de Suelo:* ${data.uso_suelo}\n` : '') +
      `✅ *Vías de Acceso:* Totalmente pavimentadas de alta durabilidad.\n\n` +
      `👉 ${dirNom}¿tienes alguna consulta técnica específica sobre las acometidas o conexiones?`;
  }

  // 14. FOLIO REAL, DERECHOS REALES (DDRR), PAPELES, TRANSFERENCIA
  if (msg.includes('documento') || msg.includes('papel') || msg.includes('folio real') || msg.includes('alodial') || msg.includes('gravamen') || msg.includes('legal') || msg.includes('ddrr') || msg.includes('derechos reales') || msg.includes('empresa') || msg.includes('srl') || msg.includes('transferencia') || msg.includes('notaria') || msg.includes('saneado')) {
    return `📑 *Situación Legal y Documentación Verificada:*\n\n` +
      `Hola${saludoNom}, la documentación está 100% garantizada:\n` +
      `✅ *Estado Legal:* ${data.estado_legal || 'Documentación al día con Folio Real libre de gravamen'}\n` +
      `✅ *Folio Real:* Vigente, 100% saneado e inscrito en Derechos Reales (DDRR).\n` +
      `✅ *Gravámenes:* Inmueble libre de hipotecas, litigios o anotaciones preventivas.\n` +
      `✅ *Impuestos:* Al día en el Municipio correspondiente.\n` +
      `✅ *Transferencia:* Listo para protocolización notarial inmediata.\n\n` +
      `👉 ${dirNom}si requieres copias del Folio Real para revisión bancaria o legal, te las facilitamos con gusto.`;
  }

  // 15. CONTACTO / OFICINA / ASESOR
  if (msg.includes('oficina') || msg.includes('asesor') || msg.includes('telefono') || msg.includes('contacto') || msg.includes('llamar') || msg.includes('correo') || msg.includes('email') || msg.includes('itaguazu') || msg.includes('donde estan')) {
    return `🏢 *Datos de Contacto y Asesoría Oficial:*\n\n` +
      `Hola${saludoNom}, nuestros datos son:\n` +
      `*Inmobiliaria:* ${ofi.nombre}\n` +
      `📍 *Ubicación:* ${ofi.direccion}\n` +
      `👤 *Asesor a Cargo:* Asesor Realty ONE\n` +
      `📞 *Teléfono / WhatsApp:* *+591 60937050*\n` +
      `✉️ *Correo Electrónico:* ${ofi.email}\n` +
      `🌐 *Sitio Web:* ${ofi.sitio_web}\n\n` +
      `👉 ${dirNom}¿deseas que nuestro asesor te contacte directamente por llamada o seguimos por aquí?`;
  }

  // 16. FICHA TÉCNICA O DETALLES COMPLETOS (SOLO SI EL CLIENTE LO SOLICITA EXPLÍCITAMENTE)
  if (msg.includes('ficha') || msg.includes('detalles completos') || msg.includes('especificaciones') || msg.includes('todo el detalle') || msg.includes('carpeta')) {
    const precioPrincipal = (data.precio_usd && data.precio_bs)
      ? `${data.precio_usd} (${data.precio_bs})`
      : (data.precio_usd || data.precio_bs || 'Consultar con asesor');

    return `📋 *Ficha Técnica — ${campaign.titulo_campana}:*\n\n` +
      `📍 *Ubicación:* ${data.ubicacion}\n` +
      `📐 *Superficie Total:* *${data.superficie_total}*${data.dimensiones ? ` (${data.dimensiones})` : ''}\n` +
      `💰 *Precio de Venta:* *${precioPrincipal}*\n` +
      (data.referencia_acceso ? `🚛 *Accesibilidad:* ${data.referencia_acceso}\n` : '') +
      (data.servicios_basicos ? `⚡ *Servicios:* ${data.servicios_basicos}\n` : '') +
      (data.amenidades ? `🏖️ *Amenidades:* ${data.amenidades}\n` : '') +
      (data.uso_suelo ? `🏗️ *Uso de Suelo:* ${data.uso_suelo}\n` : '') +
      `📑 *Estado Legal:* ${data.estado_legal}\n\n` +
      `👤 *Asesor Responsable:* ${ofi.asesor_a_cargo || 'Asesor Realty ONE'} (Tel: +591 60937050)\n\n` +
      `👉 *${dirNom}¿te gustaría coordinar una visita presencial para conocerla esta semana?*`;
  }

  // 17. RESPUESTA CONSULTIVA HUMANA POR DEFECTO (Agente Inmobiliario)
  return `¡Con mucho gusto te oriento${saludoNom}! 🦁✨\n\n` +
    `Respecto a *${campaign.titulo_campana}*, es una excelente opción inmobiliaria con documentación saneada y gran plusvalía en Santa Cruz.\n\n` +
    `¿Te gustaría que coordinemos una visita presencial para conocer la propiedad esta semana, o prefieres que nuestro asesor te prepare una propuesta a medida por aquí? 🤝\n\n` +
    `📞 *Línea directa asesor:* ${ofi.asesor_a_cargo || 'Asesor Realty ONE'} (+591 60937050)`;
}

module.exports = {
  getCampaigns,
  saveCampaigns,
  getCampaignById,
  upsertCampaign,
  matchCampaign,
  generateCampaignResponse
};
