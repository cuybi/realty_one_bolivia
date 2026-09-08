/**
 * Motor de Clasificación de Leads, Asignaciones CRM IA y e-Realtors
 * Realty ONE Group Bolivia
 * 
 * Pipeline del Embudo:
 * One Comsys ➔ Publicación ➔ Impulsar ➔ Prospectos ➔ Solicitar Información
 *    ➔ IA Responde ➔ Formulario de Datos ➔ Prospectos Potenciales
 *    ➔ Asignaciones CRM IA ➔ Atención de e-Realtors
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const LEADS_FILE = path.join(__dirname, '..', 'leads.json');

// URL de SiteGround como base de datos primaria
const SG_HOSTNAME = 'realyonegroupbolivia.e-techgroupbolivia.com';
const SG_SYNC_PATH = '/save_leads_sync.php';

// Cache en memoria para evitar lecturas repetidas en el mismo proceso
let _memoryCache = null;
let _memoryCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 segundos

// Directorio Oficial de e-Realtors (Asesores Inmobiliarios)
const E_REALTORS = [
  {
    id: 'carlos_rodriguez',
    nombre: 'Carlos Rodríguez',
    especialidad: 'Venta de Lujo & Casas Exclusivas',
    zonas: ['Urubó', 'Las Palmas', 'Equipetrol Norte'],
    telefono: '+591 70123456',
    email: 'carlos@realtyonebolivia.com.bo',
    avatar: 'assets/agente_carlos.png',
    color: '#D4AF37'
  },
  {
    id: 'valeria_suarez',
    nombre: 'Valeria Suárez',
    especialidad: 'Alquileres Corporativos & Departamentos',
    zonas: ['Equipetrol', 'Sirari', 'Av. Busch', 'Centro'],
    telefono: '+591 70234567',
    email: 'valeria@realtyonebolivia.com.bo',
    avatar: 'assets/agente_valeria.png',
    color: '#1890ff'
  },
  {
    id: 'andres_montano',
    nombre: 'Andrés Montaño',
    especialidad: 'Terrenos, Loteamientos & Parque Industrial',
    zonas: ['Parque Industrial / G77', 'Zona Norte / Warnes', 'Porongo', 'Urubó Green Park'],
    telefono: '+591 70345678',
    email: 'andres@realtyonebolivia.com.bo',
    avatar: 'assets/agente_andres.png',
    color: '#52c41a'
  },
  {
    id: 'lucia_vaca',
    nombre: 'Lucía Vaca',
    especialidad: 'Anticréticos Seguros & Asesoría Legal DDRR',
    zonas: ['Hamacas (Zona Norte)', 'Urbarí', 'Centro', 'Santa Cruz (General)'],
    telefono: '+591 70456789',
    email: 'lucia@realtyonebolivia.com.bo',
    avatar: 'assets/agente_lucia.png',
    color: '#faad14'
  },
  {
    id: 'robert_oliva',
    nombre: 'Robert Oliva',
    especialidad: 'Master Broker / Captaciones & Inversiones VIP',
    zonas: ['Santa Cruz (General)', 'Equipetrol'],
    telefono: '+591 60937050',
    email: 'info@realtyonegroup.com.bo',
    avatar: 'assets/logo_bolivia.png',
    color: '#D4AF37'
  }
];

// Días de la semana y meses en español
const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Recupera leads desde SiteGround (fuente de verdad) vía HTTPS GET
 * Retorna Promise<Array>
 */
function fetchLeadsFromSiteGround() {
  return new Promise((resolve) => {
    const options = {
      hostname: SG_HOSTNAME,
      port: 443,
      path: SG_SYNC_PATH,
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      timeout: 8000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const arr = Array.isArray(parsed) ? parsed : [];
          console.log(`[SiteGround] ✅ Leads cargados desde SiteGround: ${arr.length}`);
          resolve(arr);
        } catch (e) {
          console.warn('[SiteGround] ⚠️ Error parseando leads:', e.message, '| Raw:', data.substring(0, 80));
          resolve([]);
        }
      });
    });
    req.on('timeout', () => { req.destroy(); resolve([]); });
    req.on('error', (err) => {
      console.warn('[SiteGround] ⚠️ No se pudo leer leads:', err.message);
      resolve([]);
    });
    req.end();
  });
}

/**
 * Carga leads: primero cache en memoria, luego archivo local, luego SiteGround.
 * IMPORTANTE: Para operaciones de escritura usar getLeadsAsync() para garantizar datos frescos.
 */
function getLeads() {
  // 1. Cache en memoria vigente
  if (_memoryCache !== null && (Date.now() - _memoryCacheTime) < CACHE_TTL_MS) {
    return _memoryCache;
  }

  // 2. Archivo local (cache de disco)
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf8');
      const parsed = JSON.parse(data || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        _memoryCache = parsed;
        _memoryCacheTime = Date.now();
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[getLeads] Error leyendo archivo local:', e.message);
  }

  // 3. Sin datos locales — retorna cache vacío (getLeadsAsync cargará desde SiteGround)
  return _memoryCache || [];
}

/**
 * Versión async de getLeads: garantiza datos frescos desde SiteGround cuando
 * el archivo local está vacío (ej: tras restart de Render).
 */
async function getLeadsAsync() {
  // Cache en memoria vigente
  if (_memoryCache !== null && _memoryCache.length > 0 && (Date.now() - _memoryCacheTime) < CACHE_TTL_MS) {
    return _memoryCache;
  }

  // Archivo local con datos
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, 'utf8');
      const parsed = JSON.parse(data || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        _memoryCache = parsed;
        _memoryCacheTime = Date.now();
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[getLeadsAsync] Error leyendo local:', e.message);
  }

  // Archivo local vacío o inexistente → SiteGround es la fuente de verdad
  console.log('[getLeadsAsync] Cache local vacío. Cargando desde SiteGround...');
  const remote = await fetchLeadsFromSiteGround();
  if (remote.length > 0) {
    // Repoblar cache local para futuras lecturas síncronas
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify(remote, null, 2), 'utf8');
    } catch (e) {}
    _memoryCache = remote;
    _memoryCacheTime = Date.now();
  }
  return remote;
}

/**
 * Envía leads a SiteGround. Retorna Promise<boolean>.
 */
function syncLeadsToSiteGround(leads) {
  return new Promise((resolve) => {
    try {
      const payload = JSON.stringify(leads);
      const options = {
        hostname: SG_HOSTNAME,
        port: 443,
        path: SG_SYNC_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'RealtyONEBot/2.0',
          'Accept': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let respData = '';
        res.on('data', (chunk) => { respData += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[SiteGround] ✅ ${leads.length} leads sincronizados (HTTP ${res.statusCode})`);
            resolve(true);
          } else {
            console.error(`[SiteGround] ❌ HTTP ${res.statusCode}:`, respData.substring(0, 200));
            resolve(false);
          }
        });
      });
      req.on('timeout', () => {
        console.error('[SiteGround] ❌ Timeout al sincronizar leads');
        req.destroy();
        resolve(false);
      });
      req.on('error', (err) => {
        console.error('[SiteGround] ❌ Error de red:', err.message);
        resolve(false);
      });
      req.write(payload);
      req.end();
    } catch (e) {
      console.error('[SiteGround] ❌ Excepción:', e.message);
      resolve(false);
    }
  });
}

/**
 * Guarda leads: escribe cache local Y sincroniza con SiteGround (fuente de verdad).
 * Retorna Promise<boolean>.
 */
async function saveLeads(leads) {
  // Actualizar cache en memoria inmediatamente
  _memoryCache = leads;
  _memoryCacheTime = Date.now();

  // Escribir cache local (best-effort, puede fallar en Render)
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (e) {
    console.warn('[saveLeads] No se pudo escribir archivo local:', e.message);
  }
  try {
    const rootLeads = path.join(__dirname, '..', '..', 'leads.json');
    fs.writeFileSync(rootLeads, JSON.stringify(leads, null, 2), 'utf8');
  } catch (e) {}

  // Sincronizar con SiteGround (operación crítica)
  const ok = await syncLeadsToSiteGround(leads);
  if (!ok) {
    console.error('[saveLeads] ❌ FALLO al guardar en SiteGround. Los datos pueden perderse si Render reinicia.');
  }
  return ok;
}

/**
 * Normaliza texto para comparaciones de búsqueda
 */
function normalizeText(str = '') {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Genera el desglose temporal exacto (Fecha, Hora, Día, Mes, Año, Día de la Semana)
 */
function generateTimeBreakdown(dateObj = new Date()) {
  // Zona horaria oficial de Bolivia (America/La_Paz, UTC-4)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(dateObj);
  const p = {};
  for (const part of parts) {
    p[part.type] = part.value;
  }

  const anio = p.year;
  const mesNum = p.month;
  const mesIdx = Math.max(0, parseInt(mesNum, 10) - 1);
  const mesNombre = MESES[mesIdx] || 'Septiembre';
  const diaNum = p.day;

  // Día de la semana exacto en Bolivia
  const weekdayFormatter = new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', weekday: 'long' });
  const rawDay = weekdayFormatter.format(dateObj);
  const diaSemana = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);

  const horas = p.hour;
  const minutos = p.minute;
  const segundos = p.second;
  const horaCompleta = `${horas}:${minutos}:${segundos}`;
  const fechaCompleta = `${anio}-${mesNum}-${diaNum}`;

  return {
    fecha_completa: fechaCompleta,
    hora: horaCompleta,
    dia: diaNum,
    dia_semana: diaSemana,
    mes: mesNombre,
    mes_numero: mesNum,
    anio: anio,
    timestamp_iso: `${fechaCompleta}T${horaCompleta}-04:00`
  };
}

/**
 * Extrae correo electrónico si está presente en el texto
 */
function extractEmail(text = '') {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i;
  const match = text.match(emailRegex);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Extrae posibles nombres de clientes del texto
 */
function extractName(text = '') {
  const patterns = [
    /(?:mi\s+nombre\s+es|me\s+llamo|soy|habla|atte:?|atentamente:?)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,3})/i,
    /(?:nombre:?)\s*([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,3})/i,
    /^([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,2})(?:,|\s+al|\s+y|\s+cel|\s+correo|\s+tel|\s*-\s*|\s*@)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const notNames = ['interesado', 'cliente', 'amigo', 'alguien', 'persona', 'comprador', 'hola', 'buenas', 'buen', 'buenos', 'realty', 'one', 'informacion'];
      if (!notNames.includes(candidate.toLowerCase()) && candidate.length > 2) {
        return candidate.replace(/\b\w/g, l => l.toUpperCase());
      }
    }
  }

  // Detección cuando el usuario envía una línea tipo "Marcos Antezana, 77012345, marcos@gmail.com"
  const commaParts = text.split(',');
  if (commaParts.length >= 2) {
    const firstPart = commaParts[0].trim();
    if (firstPart.length > 2 && firstPart.split(' ').length <= 4 && !firstPart.includes('@') && !/\d/.test(firstPart)) {
      return firstPart.replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  return null;
}

/**
 * Extrae la zona geográfica de interés
 */
function extractZone(text = '') {
  const n = normalizeText(text);
  if (n.includes('urubo') || n.includes('urubó')) return 'Urubó';
  if (n.includes('equipetrol')) return 'Equipetrol';
  if (n.includes('sirari')) return 'Sirari';
  if (n.includes('parque industrial') || n.includes('g77')) return 'Parque Industrial / G77';
  if (n.includes('hamacas')) return 'Hamacas (Zona Norte)';
  if (n.includes('urbari')) return 'Urbarí';
  if (n.includes('las palmas')) return 'Las Palmas';
  if (n.includes('zona norte') || n.includes('warnes')) return 'Zona Norte / Warnes';
  if (n.includes('centro')) return 'Centro';
  if (n.includes('porongo')) return 'Porongo';
  if (n.includes('la guardia')) return 'La Guardia';
  return 'Santa Cruz (General)';
}

/**
 * Extrae el tipo de operación inmobiliaria
 */
function extractOperation(text = '') {
  const n = normalizeText(text);
  if (n.includes('consignar') || n.includes('vender mi') || n.includes('alquilar mi') || n.includes('tengo una casa') || n.includes('tengo un terreno')) {
    return 'Consignación / Propietario';
  }
  if (n.includes('anticretico') || n.includes('anticret')) return 'Anticrético';
  if (n.includes('alquiler') || n.includes('alquilar') || n.includes('rentar')) return 'Alquiler';
  if (n.includes('terreno industrial') || n.includes('g77') || n.includes('parque industrial') || n.includes('16.800.000')) return 'Terreno Industrial (G77)';
  if (n.includes('terreno') || n.includes('lote') || n.includes('hectarea')) return 'Terreno / Lote';
  if (n.includes('comprar') || n.includes('venta') || n.includes('compro') || n.includes('mansion') || n.includes('penthouse') || n.includes('departamento') || n.includes('casa')) return 'Venta / Compra';
  return 'Consulta General';
}

/**
 * Extrae presupuesto o monto consultado
 */
function extractBudget(text = '') {
  const n = normalizeText(text);
  if (n.includes('16.800.000') || n.includes('16800000')) return 'Bs 16.800.000 (Terreno G77)';
  if (n.includes('450.000') || n.includes('450000')) return '$450.000';
  if (n.includes('320.000') || n.includes('320000')) return '$320.000';
  if (n.includes('280.000') || n.includes('280000')) return '$280.000';
  if (n.includes('45.000') || n.includes('45000')) return '$45.000 (Anticrético)';
  if (n.includes('30.000') || n.includes('30000')) return '$30.000 (Anticrético)';
  if (n.includes('18.000') || n.includes('18000')) return '$18.000 (Anticrético)';
  if (n.includes('1.200') || n.includes('1200')) return '$1.200 /mes (Alquiler)';

  const priceRegex = /(?:[$]|bs|us|usd|\$us)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:[$]|bs|us|usd|\$us|dolares|bolivianos)?/i;
  const match = text.match(priceRegex);
  if (match && match[1] && Number(match[1].replace(/[.,]/g, '')) > 100) {
    return match[0].trim();
  }
  return 'Por definir';
}

/**
 * Extrae fecha u horario de visita si el cliente lo indicó
 */
function extractSchedule(text = '') {
  if (!text) return null;
  const n = normalizeText(text);

  // Si el mensaje es solo un saludo o solo datos de contacto (con @), descartar
  if (text.includes('@') && !n.includes('visita') && !n.includes('a las') && !n.includes('horas') && !n.includes('manana') && !n.includes('mañana')) {
    return null;
  }
  if (/^(hola|buenas|buen d[ií]a|buenas tardes|buenas noches|saludos|1|2|3|4|5)$/i.test(text.trim())) {
    return null;
  }

  const days = ['mañana', 'manana', 'hoy', 'lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado', 'domingo', 'fin de semana'];
  const times = ['tarde', 'noche', 'mediodia', 'mediodía', '10:00', '11:00', '14:00', '15:00', '15:30', '16:00', '16:30', '17:00', '18:00', 'pm', 'am', 'horas', 'hora'];

  const foundDay = days.some(d => n.includes(d));
  const foundTime = times.some(t => n.includes(t));

  if (foundDay || foundTime || n.includes('a las') || n.includes('visita') || n.includes('cita') || n.includes('agendar')) {
    // Si viene dentro de un texto largo con comas, extraer solo la parte de horario
    const parts = text.split(',');
    for (const part of parts) {
      const np = normalizeText(part);
      if (days.some(d => np.includes(d)) || times.some(t => np.includes(t)) || np.includes('a las') || np.includes('visita')) {
        const clean = part.trim();
        if (clean.length <= 50 && !clean.includes('Bienvenido') && !clean.includes('Realty ONE')) return clean;
      }
    }
    if (text.length <= 50 && !text.includes('Bienvenido') && !text.includes('Realty ONE')) return text.trim();
  }
  return null;
}

/**
 * Motor de Asignación Inteligente de CRM IA a e-Realtors
 * @param {object} leadData - Datos recolectados del lead
 * @returns {object} e-Realtor asignado
 */
function assignERealtorByAI(leadData) {
  const op = (leadData.tipo_interes || '').toLowerCase();
  const zona = (leadData.zona_interes || '').toLowerCase();
  const campana = (leadData.campana || '').toLowerCase();

  // 1. Propietarios y Captaciones directas -> Robert Oliva (Master Broker)
  if (op.includes('propietario') || op.includes('consignar')) {
    return E_REALTORS.find(r => r.id === 'robert_oliva');
  }

  // 2. Terrenos Industriales, G77, Warnes, Lotes -> Andrés Montaño
  if (op.includes('terreno') || op.includes('g77') || zona.includes('g77') || zona.includes('industrial') || campana.includes('g77') || campana.includes('industrial')) {
    return E_REALTORS.find(r => r.id === 'andres_montano');
  }

  // 3. Anticréticos y Asesoría Legal -> Lucía Vaca
  if (op.includes('anticret') || zona.includes('hamacas') || zona.includes('urbari')) {
    return E_REALTORS.find(r => r.id === 'lucia_vaca');
  }

  // 4. Alquileres Corporativos y Departamentos -> Valeria Suárez
  if (op.includes('alquil') || (op.includes('departamento') && !op.includes('venta'))) {
    return E_REALTORS.find(r => r.id === 'valeria_suarez');
  }

  // 5. Venta de Lujo, Urubó, Las Palmas, Mansiones -> Carlos Rodríguez
  if (op.includes('vent') || zona.includes('urubo') || zona.includes('palmas') || leadData.presupuesto.includes('450') || leadData.presupuesto.includes('320')) {
    return E_REALTORS.find(r => r.id === 'carlos_rodriguez');
  }

  // Fallback balanceado
  return E_REALTORS.find(r => r.id === 'carlos_rodriguez') || E_REALTORS[0];
}

/**
 * Algoritmo de Puntuación (Lead Scoring) y Clasificación de Prioridad
 */
function calculateLeadPriority(fullText = '', history = [], hasCompleteForm = false, hasSchedule = false) {
  const n = normalizeText(fullText);
  let score = 20;

  // A) PROPIETARIO
  if (
    n.includes('vender mi') ||
    n.includes('alquilar mi') ||
    n.includes('tengo una casa') ||
    n.includes('tengo un terreno') ||
    n.includes('tengo un dpto') ||
    n.includes('quiero consignar') ||
    n.includes('consignacion')
  ) {
    return {
      prioridad: 'PROPIETARIO',
      prioridad_label: '💼 Propietario (Captación)',
      prioridad_badge: 'badge-propietario',
      score: 95,
      accion_sugerida: 'Coordinar avalúo comercial sin costo y firma de consignación con el e-Realtor.',
      resumen: 'Propietario interesado en consignar su inmueble para venta o alquiler con Realty ONE Group.'
    };
  }

  // B) POTENCIAL (Alta Prioridad)
  let isPotential = false;

  if (hasSchedule || n.includes('visita') || n.includes('agendar') || n.includes('coordinar') || n.includes('ir a ver') || n.includes('conocer el terreno')) {
    score += 45;
    isPotential = true;
  }

  if (n.includes('asesor') || n.includes('humano') || n.includes('llamada') || n.includes('llamenme') || n.includes('reunion')) {
    score += 30;
    isPotential = true;
  }

  if (n.includes('al contado') || n.includes('credito aprobado') || n.includes('transferencia inmediata') || n.includes('comprar ya')) {
    score += 35;
    isPotential = true;
  }

  if (hasCompleteForm) {
    score += 25;
    isPotential = true;
  }

  if (extractName(fullText) || extractEmail(fullText)) {
    score += 20;
  }

  if (history.length >= 3) {
    score += 15;
  }

  if (isPotential || score >= 70) {
    return {
      prioridad: 'POTENCIAL',
      prioridad_label: '🔥 Potencial (Alta)',
      prioridad_badge: 'badge-potencial',
      score: Math.min(score, 100),
      accion_sugerida: 'Atención urgente de e-Realtor vía WhatsApp para confirmar visita y enviar ficha técnica.',
      resumen: 'Prospecto con datos completos y alta intención comercial. Listo para atención de e-Realtor.'
    };
  }

  // C) INDECISO (Media Prioridad)
  if (
    n.includes('precio') ||
    n.includes('cuanto cuesta') ||
    n.includes('fotos') ||
    n.includes('ubicacion') ||
    n.includes('donde queda') ||
    n.includes('requisitos') ||
    n.includes('folio real') ||
    n.includes('superficie') ||
    history.length >= 2
  ) {
    return {
      prioridad: 'INDECISO',
      prioridad_label: '⚡ Indeciso (Media)',
      prioridad_badge: 'badge-indeciso',
      score: 55,
      accion_sugerida: 'Enviar brochure digital en PDF y realizar seguimiento personalizado en 24h.',
      resumen: 'Prospecto evaluando opciones, consultando precios, medidas y requerimientos.'
    };
  }

  // D) PASIVO
  return {
    prioridad: 'PASIVO',
    prioridad_label: '❄️ Pasivo (Baja)',
    prioridad_badge: 'badge-pasivo',
    score: 25,
    accion_sugerida: 'Mantener en nutrición y enviar nuevos ingresos del catálogo semanal.',
    resumen: 'Contacto inicial o consulta preliminar sin completar formulario.'
  };
}

/**
 * Extrae datos completos del formulario si vienen separados por comas
 * Ej: "Carlos Perez, 67890987, carlos@gmail.com"
 */
function extractFormData(text = '') {
  if (!text || typeof text !== 'string') return null;
  const cleanText = text.replace(/^Formulario completado:\s*/i, '').trim();
  const parts = cleanText.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    let name = null;
    let phone = null;
    let email = null;

    for (const part of parts) {
      const lower = part.toLowerCase();
      // Ignorar campos de fecha/hora de visita
      if (lower.includes('visita') || lower.includes('202') || lower.includes('am') || lower.includes('pm') || lower.includes('hrs')) {
        continue;
      }

      if (part.includes('@') && /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/i.test(part)) {
        email = part.toLowerCase();
      } else {
        const clean = part.replace(/\D/g, '');
        // Teléfonos válidos en Bolivia: 8 dígitos (ej: 60034649, 75020944) o 11 dígitos con código país (591XXXXXXXX)
        if (/^(?:591)?[6734]\d{7}$/.test(clean)) {
          phone = normalizePhoneNumber(clean);
        } else if (clean.length === 8) {
          phone = normalizePhoneNumber(clean);
        } else if (part.length >= 2 && !/\d/.test(part) && part.split(' ').length <= 4) {
          name = part.replace(/\b\w/g, l => l.toUpperCase());
        }
      }
    }

    if (name || phone || email) {
      return { name, phone, email };
    }
  }
  return null;
}

/**
 * Normaliza el número de teléfono para WhatsApp
 */
function normalizePhoneNumber(rawNumber = '') {
  let clean = String(rawNumber).replace(/\D/g, '');
  if (!clean) return 'Desconocido';
  if (clean.length === 8 && (clean.startsWith('7') || clean.startsWith('6'))) {
    clean = '591' + clean;
  }
  return '+' + clean;
}

/**
 * Procesa o actualiza un lead en la base de datos a partir de un mensaje entrante
 */
async function trackAndClassifyLead(userId, incomingMessage, botReply = '', metadata = {}) {
  try {
    const leads = await getLeadsAsync();
    const phone = normalizePhoneNumber(userId);
    const now = new Date();
    const timeData = generateTimeBreakdown(now);

    let leadIndex = leads.findIndex(l => l.numero_celular === phone || l.id === userId);
    let lead = null;

    if (leadIndex >= 0) {
      lead = leads[leadIndex];
      lead.historial = lead.historial || [];
      lead.historial.push({
        rol: 'usuario',
        texto: incomingMessage,
        fecha: timeData.fecha_completa,
        hora: timeData.hora
      });
      if (botReply) {
        lead.historial.push({
          rol: 'bot',
          texto: botReply,
          fecha: timeData.fecha_completa,
          hora: timeData.hora
        });
      }
      lead.total_mensajes = lead.historial.length;
      lead.ultimo_mensaje = incomingMessage;
      lead.ultima_actividad = timeData.timestamp_iso;
      lead.fecha_completa = timeData.fecha_completa;
      lead.hora = timeData.hora;
      lead.dia = timeData.dia;
      lead.dia_semana = timeData.dia_semana;
      lead.mes = timeData.mes;
      lead.mes_numero = timeData.mes_numero;
      lead.anio = timeData.anio;

      // Mover al inicio de la lista para reflejarse inmediatamente en tiempo real
      if (leadIndex > 0) {
        leads.splice(leadIndex, 1);
        leads.unshift(lead);
        leadIndex = 0;
      }
    } else {
      lead = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        numero_celular: phone,
        cliente_nombre: (metadata.pushName && metadata.pushName.length > 1) ? metadata.pushName : 'Por identificar',
        email: 'Pendiente',
        fecha_creacion: timeData.timestamp_iso,
        fecha_completa: timeData.fecha_completa,
        hora: timeData.hora,
        dia: timeData.dia,
        dia_semana: timeData.dia_semana,
        mes: timeData.mes,
        mes_numero: timeData.mes_numero,
        anio: timeData.anio,
        canal_origen: metadata.canal || 'WhatsApp',
        campana: metadata.campana || 'Catálogo General',
        estado_comercial: 'Nuevo',
        etapa_embudo: 'SOLICITUD',
        notas_asesor: '',
        ultimo_mensaje: incomingMessage,
        total_mensajes: 1,
        historial: [
          { rol: 'usuario', texto: incomingMessage, fecha: timeData.fecha_completa, hora: timeData.hora }
        ]
      };
      if (botReply) {
        lead.historial.push({ rol: 'bot', texto: botReply, fecha: timeData.fecha_completa, hora: timeData.hora });
      }
      leads.unshift(lead);
      leadIndex = 0;
    }

    // Concatenar todo el texto de la conversación
    const allUserTexts = lead.historial.filter(h => h.rol === 'usuario').map(h => h.texto).join(' ');

    // 0. Si el usuario envió formulario con comas (Ej: "Carlos Perez, 67890987, carlos@gmail.com")
    const formData = extractFormData(incomingMessage);
    if (formData) {
      if (formData.name) lead.cliente_nombre = formData.name;
      if (formData.email) lead.email = formData.email;
      if (formData.phone) lead.numero_celular = formData.phone;
    }

    // 1. Extraer nombre si aún no está fijado
    let detectedName = extractName(incomingMessage);
    if (!detectedName) {
      for (let i = lead.historial.length - 1; i >= 0; i--) {
        if (lead.historial[i].rol === 'usuario') {
          const nm = extractName(lead.historial[i].texto);
          if (nm) { detectedName = nm; break; }
        }
      }
    }
    if (!detectedName) detectedName = extractName(allUserTexts);
    if (detectedName && (lead.cliente_nombre === 'Por identificar' || !lead.cliente_nombre)) {
      lead.cliente_nombre = detectedName;
    }

    // 2. Extraer correo electrónico
    const detectedEmail = extractEmail(incomingMessage) || extractEmail(allUserTexts);
    if (detectedEmail && (lead.email === 'Pendiente' || !lead.email)) {
      lead.email = detectedEmail;
    }

    // 3. Extraer zona, operación, presupuesto y horario de visita
    lead.zona_interes = extractZone(allUserTexts);
    lead.tipo_interes = extractOperation(allUserTexts);
    lead.presupuesto = extractBudget(allUserTexts);
    
    // 3. Extraer fecha/horario de visita (mensaje actual primero, luego historial)
    let detectedSchedule = extractSchedule(incomingMessage);
    if (!detectedSchedule) {
      for (let i = lead.historial.length - 1; i >= 0; i--) {
        if (lead.historial[i].rol === 'usuario') {
          const sch = extractSchedule(lead.historial[i].texto);
          if (sch) { detectedSchedule = sch; break; }
        }
      }
    }
    if (detectedSchedule) {
      lead.horario_visita_solicitado = detectedSchedule;
      lead.etapa_embudo = 'VISITA_AGENDADA';
      lead.estado_comercial = 'Visita Agendada';
    }

    // 4. Estado del Formulario de Datos
    const hasName = lead.cliente_nombre && lead.cliente_nombre !== 'Por identificar';
    const hasEmail = lead.email && lead.email !== 'Pendiente';
    const hasPhone = Boolean(lead.numero_celular && lead.numero_celular !== 'Desconocido');
    const isFormComplete = Boolean(hasName && (hasEmail || hasPhone));

    lead.formulario_datos = {
      nombre: hasName ? lead.cliente_nombre : null,
      telefono: hasPhone ? lead.numero_celular : null,
      email: hasEmail ? lead.email : null,
      zona: lead.zona_interes,
      operacion: lead.tipo_interes,
      presupuesto: lead.presupuesto,
      horario_visita: lead.horario_visita_solicitado || null,
      completado: isFormComplete
    };

    // 5. Asignación Inteligente de CRM IA a e-Realtor
    const assignedRealtor = assignERealtorByAI(lead);
    lead.e_realtor_asignado = assignedRealtor.nombre;
    lead.e_realtor_id = assignedRealtor.id;
    lead.e_realtor_telefono = assignedRealtor.telefono;
    lead.e_realtor_email = assignedRealtor.email;
    lead.e_realtor_especialidad = assignedRealtor.especialidad;
    lead.e_realtor_avatar = assignedRealtor.avatar;

    // 6. Etapa del Embudo (Pipeline)
    if (lead.horario_visita_solicitado) {
      lead.etapa_embudo = 'VISITA_AGENDADA';
    } else if (isFormComplete) {
      lead.etapa_embudo = 'ASIGNADO_E_REALTOR';
    } else if (hasName || hasEmail) {
      lead.etapa_embudo = 'FORMULARIO_EN_PROGRESO';
    } else {
      lead.etapa_embudo = 'SOLICITUD';
    }

    // 7. Calcular Prioridad y Score
    const priorityResult = calculateLeadPriority(allUserTexts, lead.historial, isFormComplete, Boolean(lead.horario_visita_solicitado));
    lead.prioridad = priorityResult.prioridad;
    lead.prioridad_label = priorityResult.prioridad_label;
    lead.prioridad_badge = priorityResult.prioridad_badge;
    lead.score = priorityResult.score;
    lead.accion_sugerida = priorityResult.accion_sugerida;
    lead.resumen = priorityResult.resumen;

    await saveLeads(leads);
    return lead;
  } catch (error) {
    console.error('Error al clasificar lead:', error);
    return null;
  }
}

/**
 * Actualiza el estado comercial, asignación o notas de un lead
 */
async function updateLeadStatus(leadId, updates = {}) {
  const leads = await getLeadsAsync();
  const index = leads.findIndex(l => l.id === leadId);
  if (index >= 0) {
    const { estado_comercial, etapa_embudo, notas_asesor, cliente_nombre, email, prioridad, e_realtor_id } = updates;
    
    if (estado_comercial) leads[index].estado_comercial = estado_comercial;
    if (etapa_embudo) leads[index].etapa_embudo = etapa_embudo;
    if (notas_asesor !== undefined) leads[index].notas_asesor = notas_asesor;
    if (cliente_nombre) leads[index].cliente_nombre = cliente_nombre;
    if (email) leads[index].email = email;
    
    if (prioridad) {
      leads[index].prioridad = prioridad;
      if (prioridad === 'POTENCIAL') leads[index].prioridad_label = '🔥 Potencial (Alta)';
      if (prioridad === 'INDECISO') leads[index].prioridad_label = '⚡ Indeciso (Media)';
      if (prioridad === 'PASIVO') leads[index].prioridad_label = '❄️ Pasivo (Baja)';
      if (prioridad === 'PROPIETARIO') leads[index].prioridad_label = '💼 Propietario (Captación)';
    }

    // Reasignación manual de e-Realtor
    if (e_realtor_id) {
      const realtor = E_REALTORS.find(r => r.id === e_realtor_id);
      if (realtor) {
        leads[index].e_realtor_asignado = realtor.nombre;
        leads[index].e_realtor_id = realtor.id;
        leads[index].e_realtor_telefono = realtor.telefono;
        leads[index].e_realtor_email = realtor.email;
        leads[index].e_realtor_especialidad = realtor.especialidad;
        leads[index].e_realtor_avatar = realtor.avatar;
      }
    }

    await saveLeads(leads);
    return leads[index];
  }
  return null;
}

/**
 * Elimina un lead por su ID o teléfono (eliminando duplicados)
 */
async function deleteLead(leadIdOrPhone) {
  const leads = await getLeadsAsync();
  const cleanTarget = String(leadIdOrPhone || '').replace(/\D/g, '');
  const shortTarget = cleanTarget.length >= 8 ? cleanTarget.slice(-8) : cleanTarget;

  const filtered = leads.filter(l => {
    if (l.id === leadIdOrPhone) return false;
    if (cleanTarget) {
      const p1 = String(l.numero_celular || '').replace(/\D/g, '');
      const p2 = String(l.formulario_datos?.telefono || '').replace(/\D/g, '');
      if (p1 && (p1 === cleanTarget || (shortTarget && p1.includes(shortTarget)))) return false;
      if (p2 && (p2 === cleanTarget || (shortTarget && p2.includes(shortTarget)))) return false;
    }
    return true;
  });

  await saveLeads(filtered);
  return true;
}

/**
 * Limpia todos los prospectos del sistema
 */
async function clearAllLeads() {
  await saveLeads([]);
  return true;
}

/**
 * Sincroniza la lista completa de prospectos directamente
 */
async function syncLeads(newList = []) {
  const cleanList = Array.isArray(newList) ? newList : [];
  await saveLeads(cleanList);
  return cleanList;
}

/**
 * Obtiene la lista de todos los e-Realtors
 */
function getERealtors() {
  return E_REALTORS;
}

module.exports = {
  E_REALTORS,
  getERealtors,
  getLeads,
  getLeadsAsync,
  saveLeads,
  trackAndClassifyLead,
  updateLeadStatus,
  deleteLead,
  clearAllLeads,
  syncLeads,
  generateTimeBreakdown,
  calculateLeadPriority,
  assignERealtorByAI,
  extractName,
  extractEmail,
  extractZone,
  extractOperation,
  extractBudget,
  extractSchedule
};

