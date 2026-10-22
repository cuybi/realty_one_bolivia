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
const SG_ADMIN_KEY = process.env.ADMIN_KEY || 'ONE2026';
// UA estándar compatible: SiteGround WAF bloquea UAs con tokens de Chrome desalineados con TLS handshake
const SG_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

// Cache en memoria para evitar lecturas repetidas en el mismo proceso
let _memoryCache = null;
let _memoryCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 segundos

// Directorio Oficial de e-Realtors (Asesores Inmobiliarios)
const E_REALTORS = [
  {
    id: 'marcos_antezana',
    nombre: 'Marcos Antezana Lenz',
    especialidad: 'Consultor Senior & Asesor Principal de Inversiones',
    zonas: ['Equipetrol', 'Sirari', 'Urubó', 'Las Palmas', 'Zona Norte', 'Santa Cruz (General)'],
    telefono: '+591 60034649',
    email: 'pixelbolivia@gmail.com',
    avatar: 'assets/logo_one.png',
    color: '#D4AF37'
  },
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
 * Reintenta 1 vez tras 2s si HTTP 403/429 (bot-protection / rate limit).
 * Retorna Promise<Array>
 */
function fetchLeadsFromSiteGround(attempt = 0) {
  return new Promise((resolve) => {
    const options = {
      hostname: SG_HOSTNAME,
      port: 443,
      path: `${SG_SYNC_PATH}?key=${encodeURIComponent(SG_ADMIN_KEY)}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': SG_UA
      },
      timeout: 8000
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if ((res.statusCode === 403 || res.statusCode === 429) && attempt < 1) {
          console.warn(`[SiteGround] ⚠️ HTTP ${res.statusCode} (bloqueo/rate-limit) — reintento en 2s (intento ${attempt + 1}/1)`);
          setTimeout(() => resolve(fetchLeadsFromSiteGround(attempt + 1)), 2000);
          return;
        }
        if (res.statusCode === 403 || res.statusCode === 429) {
          console.error(`[SiteGround] ❌ HTTP ${res.statusCode} persistente — revisar Bot Protection de SiteGround`);
          resolve([]);
          return;
        }
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
  // 1. Cache en memoria vigente
  if (_memoryCache !== null && _memoryCache.length > 0 && (Date.now() - _memoryCacheTime) < CACHE_TTL_MS) {
    return _memoryCache;
  }

  // 2. SiteGround es la fuente de verdad activa
  try {
    const remote = await fetchLeadsFromSiteGround();
    if (Array.isArray(remote) && remote.length > 0) {
      _memoryCache = remote;
      _memoryCacheTime = Date.now();
      try {
        fs.writeFileSync(LEADS_FILE, JSON.stringify(remote, null, 2), 'utf8');
      } catch (e) {}
      return remote;
    }
  } catch (e) {
    console.warn('[getLeadsAsync] Fallback a local:', e.message);
  }

  // 3. Fallback a cache local si SiteGround no responde
  return getLeads();
}

/**
 * Envía leads a SiteGround. Reintenta 1 vez tras 2s si HTTP 403/429.
 * Retorna Promise<boolean>.
 */
function syncLeadsToSiteGround(leads, attempt = 0) {
  return new Promise((resolve) => {
    try {
      const payload = JSON.stringify(leads);
      const options = {
        hostname: SG_HOSTNAME,
        port: 443,
        path: `${SG_SYNC_PATH}?key=${encodeURIComponent(SG_ADMIN_KEY)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': SG_UA,
          'Accept': 'application/json'
        },
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let respData = '';
        res.on('data', (chunk) => { respData += chunk; });
        res.on('end', () => {
          if ((res.statusCode === 403 || res.statusCode === 429) && attempt < 1) {
            console.warn(`[SiteGround] ⚠️ Sync HTTP ${res.statusCode} (bloqueo/rate-limit) — reintento en 2s (intento ${attempt + 1}/1)`);
            setTimeout(() => resolve(syncLeadsToSiteGround(leads, attempt + 1)), 2000);
            return;
          }
          if (res.statusCode === 403 || res.statusCode === 429) {
            console.error(`[SiteGround] ❌ Sync HTTP ${res.statusCode} persistente — revisar Bot Protection de SiteGround`);
            resolve(false);
            return;
          }
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
 * Guarda leads: escribe cache local, sincroniza con MongoDB Atlas Y sincroniza con SiteGround (fuente de verdad).
 * Retorna Promise<boolean>.
 */
async function saveLeads(leads) {
  // 1. Cache en memoria — inmediato
  _memoryCache = leads;
  _memoryCacheTime = Date.now();

  // 2. Disco local (raíz del proyecto) — best-effort
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (e) {
    console.warn('[saveLeads] No se pudo escribir archivo local:', e.message);
  }
  try {
    const rootLeads = path.join(__dirname, '..', 'leads.json');
    fs.writeFileSync(rootLeads, JSON.stringify(leads, null, 2), 'utf8');
  } catch (e) {}

  // 3. MongoDB Atlas — fire-and-forget (no bloquea)
  if (global.mongoClientSingleton) {
    try {
      const col = global.mongoClientSingleton.db('realty_one_bot').collection('leads');
      if (Array.isArray(leads) && leads.length > 0) {
        const ops = leads.map(l => ({
          updateOne: { filter: { id: l.id }, update: { $set: l }, upsert: true }
        }));
        col.bulkWrite(ops).catch(() => {});
      }
    } catch (e) {
      console.warn('[MongoDB Atlas] Error guardando leads:', e.message);
    }
  }

  // 4. SiteGround — ponytail: fire-and-forget; captcha/WAF nunca congela respuesta
  syncLeadsToSiteGround(leads).catch(() => {});

  return true;
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

function formatTitleCase(str = '') {
  return str.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function cleanClientName(name = '') {
  if (!name || typeof name !== 'string') return null;
  let trimmed = name.replace(/[^\p{L}\s.'-]/gu, ' ').trim();
  trimmed = trimmed.replace(/\s+/g, ' ');
  if (trimmed.length < 3 || trimmed.length > 50) return null;
  const lo = trimmed.toLowerCase();

  const blacklisted = [
    'por identificar', 'cliente', 'desconocido', 'buen dia', 'buen día', 'buenos dias', 'buenos días',
    'buenas tardes', 'buenas noches', 'hola', 'saludos', 'espero', 'esperamos', 'esperando', 'espera',
    'gracias', 'muchas gracias', 'amigo', 'amiga', 'amiga querida', 'amigo querido', 'feliz cumpleaños', 'feliz cumple',
    'iphone', 'samsung', 'android', 'whatsapp', 'realty one', 'century 21', 'century21',
    'asesor', 'asesora', 'propietario', 'propietaria', 'duc', 'santa cruz', 'la paz', 'cochabamba'
  ];
  if (blacklisted.some(b => lo === b || lo.startsWith(b + ' ') || lo.endsWith(' ' + b))) return null;

  // Si es un acrónimo de 3 letras o menos en mayúsculas (ej: DUC)
  if (trimmed.length <= 3 && trimmed === trimmed.toUpperCase()) return null;

  // No aceptar si alguna palabra es palabra de festejo, cortesía o no-nombre
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.some(w => blacklisted.includes(w.toLowerCase()))) return null;

  return formatTitleCase(trimmed);
}

/**
 * Extrae posibles nombres de clientes del texto
 */
function extractName(text = '') {
  const notNames = [
    'interesado', 'interesada', 'cliente', 'amigo', 'amiga', 'amigos', 'amigas', 'alguien', 'persona',
    'comprador', 'compradora', 'hola', 'buenas', 'buen', 'buenos', 'realty', 'one',
    'informacion', 'un', 'una', 'el', 'la', 'los', 'las', 'asesor', 'agente', 'nuevo', 'nueva',
    'propietario', 'propietaria', 'inquilino', 'inversionista',
    'ahora no', 'ahora no gracias', 'por ahora no', 'por ahora no gracias', 'por ahora', 'no gracias', 'solo queria consultar', 'solo quería consultar',
    'no deseo agendar', 'no deseo', 'no quiero', 'gracias', 'muchas gracias', 'chau', 'adios', 'adiós',
    'de acuerdo', 'esta bien', 'está bien', 'perfecto', 'excelente', 'genial', 'dale', 'vale', 'listo', 'ok',
    'si por favor', 'sí por favor', 'si', 'sí', 'no',
    'feliz cumpleaños', 'feliz cumpleanos', 'feliz cumple', 'felicidades', 'felicitaciones', 'bendiciones',
    'querida', 'querido', 'abrazo', 'abrazos', 'beso', 'besos', 'saludos',
    'espero', 'esperamos', 'esperando', 'espera', 'disculpe', 'disculpa', 'asesor', 'asesora'
  ];

  const stopWords = new Set([
    'feliz', 'cumpleaños', 'cumpleanos', 'cumple', 'felicidades', 'felicitaciones', 'bendiciones',
    'amiga', 'amigo', 'amigas', 'amigos', 'querida', 'querido', 'queridas', 'queridos',
    'ahora', 'no', 'si', 'sí', 'gracias', 'chau', 'adios', 'adiós', 'hola', 'buenas', 'tardes', 'noches', 'dias', 'días',
    'despues', 'después', 'luego', 'momento', 'tiempo', 'solo', 'nada', 'nunca', 'paso', 'casa', 'terreno', 'lote', 'depto', 'departamento',
    'espero', 'esperamos', 'esperando', 'espera', 'disculpe', 'disculpa', 'asesor', 'asesora'
  ]);

  const hasStopWord = (str) => {
    const words = str.toLowerCase().split(/\s+/).filter(Boolean);
    return words.some(w => stopWords.has(w));
  };

  const patterns = [
    /(?:mi\s+nombre\s+es|me\s+llamo|soy|habla|atte:?|atentamente:?)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,3})/i,
    /(?:nombre:?)\s*([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){0,3})/i,
    /^([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,2})(?:,|\s+al|\s+y|\s+cel|\s+correo|\s+tel|\s*-\s*|\s*@|\s+\+?\d)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let candidate = match[1].trim();
      candidate = candidate.replace(/\s+(?:y(?:\s+mi)?|mi|con|del?|en|por|para|cel(?:ular)?|tel(?:efono)?|correo|email|whatsapp)\b.*$/i, '').trim();
      const candLo = candidate.toLowerCase();

      if (!notNames.some(nn => candLo === nn || candLo.startsWith(nn + ' ') || candLo.includes('no gracias') || candLo.includes('por ahora') || candLo.includes('ahora no') || candLo.includes('no deseo')) &&
          !hasStopWord(candidate) && candidate.length > 2) {
        candidate = candidate.replace(/\s+(?:y|e|o|de|del|en|a)$/i, '').trim();
        const cleaned = cleanClientName(candidate);
        if (cleaned && !notNames.includes(cleaned.toLowerCase()) && !hasStopWord(cleaned)) {
          return cleaned;
        }
      }
    }
  }

  // Detección cuando el usuario envía una línea tipo "Marcos Antezana, 77012345, marcos@gmail.com"
  const commaParts = text.split(',');
  if (commaParts.length >= 2) {
    let firstPart = commaParts[0].trim();
    firstPart = firstPart.replace(/^(?:mi\s+nombre\s+es|me\s+llamo|soy)\s+/i, '').trim();
    const fpLo = firstPart.toLowerCase();
    const words = firstPart.split(/\s+/).filter(Boolean);
    // Un nombre real extraído con comas debe tener AL MENOS 2 palabras (Nombre y Apellido)
    if (words.length >= 2 && words.length <= 4 && !firstPart.includes('@') && !/\d/.test(firstPart)) {
      if (!notNames.some(nn => fpLo === nn || fpLo.startsWith(nn + ' ') || fpLo.includes('no gracias') || fpLo.includes('por ahora') || fpLo.includes('ahora no') || fpLo.includes('no deseo')) &&
          !hasStopWord(firstPart)) {
        const cleaned = cleanClientName(firstPart);
        if (cleaned) return cleaned;
      }
    }
  }

  return null;
}

/**
 * Extrae la ciudad de residencia o interés del cliente
 */
function extractCity(text = '') {
  if (!text || typeof text !== 'string') return null;
  const cities = [
    'santa cruz', 'la paz', 'cochabamba', 'tarija', 'sucre', 'oruro',
    'potosi', 'potosí', 'beni', 'trinidad', 'pando', 'cobija', 'montero',
    'warnes', 'urubo', 'urubó', 'el alto', 'quillacollo', 'sacaba',
    'yacuiba', 'riberalta', 'madrid', 'barcelona', 'buenos aires', 'miami'
  ];
  const lower = text.toLowerCase();
  for (const c of cities) {
    if (new RegExp('(^|[^a-zA-ZáéíóúñÁÉÍÓÚÑ])' + c + '([^a-zA-ZáéíóúñÁÉÍÓÚÑ]|$)', 'i').test(lower)) {
      return formatTitleCase(c);
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
 * Extrae el tipo de operación o inmueble inmobiliario
 */
function extractOperation(text = '') {
  const n = normalizeText(text);
  if (n.includes('consignar') || n.includes('vender mi') || n.includes('alquilar mi') || n.includes('tengo una casa') || n.includes('tengo un terreno')) {
    return 'Consignación / Propietario';
  }
  if (n.includes('anticretico') || n.includes('anticret')) return 'Anticrético';
  if (n.includes('alquiler') || n.includes('alquilar') || n.includes('rentar')) return 'Alquiler';
  if (n.includes('terreno industrial') || n.includes('g77') || n.includes('parque industrial') || n.includes('16.800.000')) return 'Terreno Industrial (G77)';
  if (n.includes('terreno') || n.includes('lote') || n.includes('hectarea') || n.includes('hectárea')) return 'Terreno / Lote';
  if (n.includes('oficina') || n.includes('local comercial') || n.includes('galpon') || n.includes('galpón') || n.includes('comercial')) return 'Oficina / Comercial';
  if (n.includes('departamento') || n.includes('dpto') || n.includes('monoambiente') || n.includes('penthouse') || n.includes('duplex')) return 'Departamento';
  if (n.includes('casa') || n.includes('mansion') || n.includes('vivienda') || n.includes('chalet')) return 'Casa';
  if (n.includes('comprar') || n.includes('venta') || n.includes('compro')) return 'Venta / Compra';
  return 'Consulta General';
}

/**
 * Extrae presupuesto o monto consultado, evitando capturar dígitos de teléfonos o fechas
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

  // Limpiar teléfonos, correos y fechas para que sus dígitos no se confundan con presupuestos
  const clean = text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ' ')
    .replace(/(?:\+?591[\s.-]*)?[67]\d{7}\b/g, ' ')
    .replace(/\b\d{7,15}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\b202\d\b/g, ' ');

  // 1. Patrón con moneda explícita ($us, Bs, USD, dólares, bolivianos)
  const currencyRegex = /(?:[$]|bs|us|usd|\$us)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b|\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:[$]|bs|us|usd|\$us|dolares|dólares|bolivianos)\b/i;
  const matchCurr = clean.match(currencyRegex);
  if (matchCurr) {
    return matchCurr[0].trim();
  }

  // 2. Patrón con palabra clave de presupuesto (ej: "presupuesto de 120000", "hasta 80.000")
  const keywordRegex = /\b(?:presupuesto|inversi[oó]n|monto|precio|hasta|rango)\s*(?:de|es|:)?\s*(?:[$]|bs|us|usd|\$us)?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/i;
  const matchKey = clean.match(keywordRegex);
  if (matchKey && matchKey[1] && Number(matchKey[1].replace(/[.,]/g, '')) > 100) {
    return matchKey[0].trim();
  }

  return 'Por definir';
}

/**
 * Extrae fecha u horario de visita si el cliente lo indicó
 */
function extractSchedule(text = '') {
  if (!text) return null;
  const n = normalizeText(text);

  // 1. Negativas explícitas, rechazo o despedida -> NO es horario
  if (/\b(no\s+gracias|por\s+ahora\s+no|por\s+el\s+momento\s+no|todav[ií]a\s+no|despu[eé]s|luego|otro\s+d[ií]a|no\s+deseo|no\s+puedo|no\s+quiero|ahora\s+no)\b/i.test(text) ||
      /^(no|nop|no\s+por\s+ahora|gracias|muchas\s+gracias|buenas\s+noches|hasta\s+luego|chau)$/i.test(text.trim())) {
    return null;
  }

  // 2. Festejos, felicitaciones o mensajes personales -> NO es visita
  if (/\b(cumplea[ñn]os|felicidades|felicitaciones|bendiciones|feliz|amig[oa]s?|querid[oa]s?|abrazos?|besos?)\b/i.test(n)) {
    return null;
  }

  // 3. Saludos solos o datos con @ solos -> descartar
  if (text.includes('@') && !n.includes('visita') && !n.includes('a las') && !/\b(?:horas?|hrs?)\b/i.test(n) && !n.includes('manana') && !n.includes('mañana')) {
    return null;
  }
  if (/^(hola|buenas|buen d[ií]a|buenas tardes|buenas noches|saludos|1|2|3|4|5)$/i.test(text.trim())) {
    return null;
  }

  const days = ['mañana', 'manana', 'hoy', 'lunes', 'martes', 'miercoles', 'miércoles', 'jueves', 'viernes', 'sabado', 'sábado', 'domingo', 'fin de semana'];
  const foundDay = days.some(d => new RegExp('\\b' + d + '\\b', 'i').test(n));

  // 4. Regex estrictos de horario (IMPORTANTE: nunca hacer includes('am') para no atrapar 'amiga' o 'amigo')
  const hasSpecificHour = /\b(?:\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs?|horas?)|mediod[ií]a|1[0-9]:[0-5][0-9]|0?[8-9]:[0-5][0-9])\b/i.test(n);
  const hasHourWord = /\b(?:horas?|hrs?)\b/i.test(n);
  const hasNightWord = /\b(?:noche)\b/i.test(n) && !/\b(?:buenas\s+noches)\b/i.test(n);
  const foundTime = hasSpecificHour || hasHourWord || hasNightWord || /\b(?:en\s+la\s+tarde|en\s+la\s+ma[ñn]ana|por\s+la\s+tarde|por\s+la\s+ma[ñn]ana)\b/i.test(n);

  if (foundDay || foundTime || n.includes('a las') || n.includes('visita') || n.includes('cita') || n.includes('agendar')) {
    const parts = text.split(',');
    for (const part of parts) {
      const np = normalizeText(part);
      if (days.some(d => new RegExp('\\b' + d + '\\b', 'i').test(np)) || hasSpecificHour || /\b(?:horas?|hrs?)\b/i.test(np) || np.includes('a las') || np.includes('visita')) {
        const clean = part.trim();
        if (clean.length <= 50 && !clean.includes('Bienvenido') && !clean.includes('Realty ONE') && !/\b(por\s+ahora\s+no|no\s+gracias|ahora\s+no)\b/i.test(clean)) return clean;
      }
    }
    if (text.length <= 50 && !text.includes('Bienvenido') && !text.includes('Realty ONE') && !/\b(por\s+ahora\s+no|no\s+gracias|ahora\s+no)\b/i.test(text)) return text.trim();
  }
  return null;
}

/**
 * Motor de Asignación Inteligente de CRM IA a e-Realtors
 * @param {object} leadData - Datos recolectados del lead
 * @returns {object} e-Realtor asignado
 */
function assignERealtorByAI(leadData = {}) {
  const op = normalizeText(leadData.tipo_interes || '');
  const zona = normalizeText(leadData.zona_interes || '');
  const campana = normalizeText(leadData.campana || '');

  // 1. Propietarios y Captaciones directas -> Robert Oliva (Master Broker)
  if (op.includes('propietario') || op.includes('consignar')) {
    return E_REALTORS.find(r => r.id === 'robert_oliva') || E_REALTORS[0];
  }

  // 2. Terrenos Industriales, G77, Warnes, Lotes -> Andrés Montaño
  if (op.includes('terreno') || op.includes('g77') || zona.includes('g77') || zona.includes('industrial') || campana.includes('g77') || campana.includes('industrial')) {
    return E_REALTORS.find(r => r.id === 'andres_montano') || E_REALTORS[0];
  }

  // 3. Anticréticos y Asesoría Legal -> Lucía Vaca
  if (op.includes('anticret') || zona.includes('hamacas') || zona.includes('urbari')) {
    return E_REALTORS.find(r => r.id === 'lucia_vaca') || E_REALTORS[0];
  }

  // 4. Alquileres Corporativos y Departamentos -> Valeria Suárez
  if (op.includes('alquil') || (op.includes('departamento') && !op.includes('venta'))) {
    return E_REALTORS.find(r => r.id === 'valeria_suarez') || E_REALTORS[0];
  }

  // 5. Inversiones y Preventas -> Marcos Antezana Lenz
  if (op.includes('inversion') || op.includes('preventa') || zona.includes('equipetrol') || zona.includes('sirari')) {
    return E_REALTORS.find(r => r.id === 'marcos_antezana') || E_REALTORS[0];
  }

  // 6. Casas de Lujo, Urubó, Las Palmas -> Carlos Rodríguez
  if (op.includes('vent') && (zona.includes('urubo') || zona.includes('palmas'))) {
    return E_REALTORS.find(r => r.id === 'carlos_rodriguez') || E_REALTORS[0];
  }

  // 7. Atención general y consultas públicas: Marcos Antezana Lenz (Líder Comercial)
  return E_REALTORS.find(r => r.id === 'marcos_antezana') || E_REALTORS[0];
}

/**
 * Algoritmo de Puntuación (Lead Scoring) y Clasificación de Prioridad
 */
function calculateLeadPriority(fullText = '', history = [], hasCompleteForm = false, hasSchedule = false) {
  const n = normalizeText(fullText);
  let score = 20;

  // 0. Mensajes personales / festejos / felicitaciones -> PASIVO con Score bajo (15)
  if (/\b(cumplea[ñn]os|felicidades|felicitaciones|bendiciones|amig[oa]s?|querid[oa]s?|abrazos?|besos?)\b/i.test(n) &&
      !n.includes('comprar') && !n.includes('departamento') && !n.includes('casa') && !n.includes('terreno')) {
    return {
      prioridad: 'PASIVO',
      prioridad_label: '❄️ Pasivo (Baja)',
      prioridad_badge: 'badge-pasivo',
      score: 15,
      accion_sugerida: 'Mensaje personal recibido en la línea WhatsApp. No requiere acción comercial.',
      resumen: 'Mensaje personal o salutación recibida en la línea corporativa de WhatsApp.'
    };
  }

  // 0.1 Colega Asesor Inmobiliario / Co-brokering (Century21, Remax, colegas)
  if (/\b(asesor\s+de\s+century|asesor\s+de\s+remax|asesor\s+inmobiliario|colega\s+inmobiliario|inmobiliaria\s+amiga|requerimiento\s+que\s+encaja|mi\s+cliente\s+requiere)\b/i.test(n)) {
    return {
      prioridad: 'POTENCIAL',
      prioridad_label: '🔥 Potencial (Alta)',
      prioridad_badge: 'badge-potencial',
      score: 85,
      accion_sugerida: 'Atención prioritaria de Master Broker para convenios de co-brokering y comisión compartida.',
      resumen: 'Colega asesor inmobiliario con requerimiento puntual de cliente para compartir cartera.'
    };
  }

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
    let city = null;

    const CITIES_LIST = [
      'santa cruz', 'la paz', 'cochabamba', 'tarija', 'sucre', 'oruro',
      'potosi', 'potosí', 'beni', 'trinidad', 'pando', 'cobija', 'montero',
      'warnes', 'urubo', 'urubó', 'el alto', 'quillacollo', 'sacaba',
      'yacuiba', 'riberalta'
    ];

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
        } else if (CITIES_LIST.some(c => lower === c || lower.includes(c))) {
          city = formatTitleCase(part);
        } else if (!name && part.length >= 2 && !/\d/.test(part) && part.split(' ').length <= 4) {
          name = formatTitleCase(part);
        }
      }
    }

    if (name || phone || email || city) {
      return { name, phone, email, city };
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

      // Eliminar duplicados viejos con el mismo número de teléfono
      for (let i = leads.length - 1; i >= 0; i--) {
        if (i !== leadIndex && leads[i].numero_celular === phone) {
          leads.splice(i, 1);
          if (i < leadIndex) leadIndex--;
        }
      }

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
      // Eliminar cualquier registro previo con mismo teléfono si existiera
      for (let i = leads.length - 1; i >= 0; i--) {
        if (leads[i].numero_celular === phone || leads[i].id === userId) {
          leads.splice(i, 1);
        }
      }

      const cleanPush = cleanClientName(metadata.pushName);
      lead = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        numero_celular: phone,
        cliente_nombre: cleanPush || 'Por identificar',
        email: metadata.email || 'Pendiente',
        ciudad: metadata.ciudad ? formatTitleCase(metadata.ciudad) : null,
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
        estado_comercial: metadata.status || 'Nuevo',
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

    // 0. Si el usuario envió formulario con comas (Ej: "Marcos Antezana, 60034649, pixelbolivia@gmail.com, Santa Cruz")
    const formData = extractFormData(incomingMessage);
    if (formData) {
      if (formData.name && cleanClientName(formData.name)) lead.cliente_nombre = cleanClientName(formData.name);
      if (formData.email) lead.email = formData.email;
      if (formData.phone) lead.numero_celular = formData.phone;
      if (formData.city) {
        lead.ciudad = formatTitleCase(formData.city);
        lead.zona_interes = lead.ciudad;
      }
    }

    // 0.1 Inyectar datos explícitos validados por la máquina de estados
    if (metadata.telefono) lead.numero_celular = normalizePhoneNumber(metadata.telefono);
    if (metadata.email) lead.email = metadata.email;
    if (metadata.ciudad) {
      lead.ciudad = formatTitleCase(metadata.ciudad);
      lead.zona_interes = lead.ciudad;
    }
    if (metadata.status) {
      lead.estado_comercial = metadata.status;
    }

    // 1. Extraer nombre: si el mensaje actual o metadata trae nombre legitimo, sobrescribir
    const validPush = cleanClientName(metadata.pushName);
    const detectedName = cleanClientName(extractName(incomingMessage));
    const nombreGuardado = lead.cliente_nombre;
    // El nombre del perfil de WhatsApp es la senal mas reciente: si el lead no
    // escribio un nombre en este mensaje y el guardado difiere, manda el perfil.
    const pushVenceAlGuardado = Boolean(
      validPush &&
        !detectedName &&
        nombreGuardado &&
        nombreGuardado !== 'Por identificar' &&
        nombreGuardado.toLowerCase() !== 'santa cruz' &&
        nombreGuardado.toLowerCase() !== validPush.toLowerCase(),
    );
    if (
      validPush &&
      (!nombreGuardado ||
        nombreGuardado === 'Por identificar' ||
        nombreGuardado.toLowerCase() === 'santa cruz' ||
        pushVenceAlGuardado)
    ) {
      lead.cliente_nombre = validPush;
    }
    if (detectedName) {
      lead.cliente_nombre = detectedName;
    } else if (!lead.cliente_nombre || lead.cliente_nombre === 'Por identificar') {
      const histName = cleanClientName(extractName(allUserTexts));
      if (histName) lead.cliente_nombre = histName;
    }

    // Si el nombre guardado previamente era un falso positivo (ej: "Espero" o "Buen Día"), sanearlo
    if (!cleanClientName(lead.cliente_nombre)) {
      lead.cliente_nombre = 'Por identificar';
    }

    // 2. Extraer correo electrónico: si viene un nuevo email, DEBE sobrescribir al viejo
    const detectedEmail = extractEmail(incomingMessage);
    if (detectedEmail) {
      lead.email = detectedEmail;
    } else if (!lead.email || lead.email === 'Pendiente') {
      const histEmail = extractEmail(allUserTexts);
      if (histEmail) lead.email = histEmail;
    }

    // 3. Extraer ciudad: si viene nueva ciudad, DEBE sobrescribir
    const detectedCity = extractCity(incomingMessage);
    if (detectedCity) {
      lead.ciudad = formatTitleCase(detectedCity);
      lead.zona_interes = lead.ciudad.includes('Santa Cruz') ? 'Santa Cruz (General)' : `${lead.ciudad} (General)`;
    } else if (!lead.ciudad) {
      const histCity = extractCity(allUserTexts);
      if (histCity) {
        lead.ciudad = formatTitleCase(histCity);
        lead.zona_interes = lead.ciudad.includes('Santa Cruz') ? 'Santa Cruz (General)' : `${lead.ciudad} (General)`;
      }
    }

    const specificZone = extractZone(allUserTexts);
    if (specificZone && specificZone !== 'Santa Cruz (General)') {
      lead.zona_interes = specificZone;
    } else if (lead.ciudad) {
      lead.zona_interes = lead.ciudad.includes('Santa Cruz') ? 'Santa Cruz (General)' : `${lead.ciudad} (General)`;
    } else {
      lead.zona_interes = 'Santa Cruz (General)';
    }

    lead.tipo_interes = extractOperation(allUserTexts);
    lead.presupuesto = extractBudget(allUserTexts);

    // Detección de Colega / Asesor Inmobiliario B2B (Century21, Remax, etc.)
    const isColleague = /\b(asesor\s+de\s+century|asesor\s+de\s+remax|asesor\s+inmobiliario|colega\s+inmobiliario|inmobiliaria\s+amiga|requerimiento\s+que\s+encaja|mi\s+cliente\s+requiere)\b/i.test(incomingMessage) ||
      /\b(asesor\s+de\s+century|asesor\s+de\s+remax|asesor\s+inmobiliario|colega\s+inmobiliario|inmobiliaria\s+amiga|requerimiento\s+que\s+encaja|mi\s+cliente\s+requiere)\b/i.test(allUserTexts);
    if (isColleague) {
      lead.notas_asesor = `Colega Asesor Inmobiliario - Requerimiento cliente. Mensaje: "${incomingMessage}"`;
    }
    
    // 3. Extraer fecha/horario de visita (mensaje actual primero, luego historial)
    const isVisitRefusal = metadata.status === 'Interesado - Sin Visita' ||
      /\b(por\s+ahora\s+no|no\s+gracias|por\s+el\s+momento\s+no|todav[ií]a\s+no|no\s+deseo)\b/i.test(incomingMessage);

    let detectedSchedule = null;
    if (!isVisitRefusal) {
      detectedSchedule = metadata.horarioVisita || extractSchedule(incomingMessage);
      if (!detectedSchedule) {
        for (let i = lead.historial.length - 1; i >= 0; i--) {
          if (lead.historial[i].rol === 'usuario') {
            const hText = lead.historial[i].texto;
            if (/\b(por\s+ahora\s+no|no\s+gracias)\b/i.test(hText)) break;
            const sch = extractSchedule(hText);
            if (sch) { detectedSchedule = sch; break; }
          }
        }
      }
    }

    if (detectedSchedule) {
      lead.horario_visita_solicitado = detectedSchedule;
      lead.etapa_embudo = 'VISITA_AGENDADA';
      lead.estado_comercial = 'Visita Agendada';
    } else if (isVisitRefusal) {
      lead.horario_visita_solicitado = null;
      lead.estado_comercial = 'Interesado - Sin Visita';
    }

    // 4. Estado del Formulario de Datos
    // El formulario está completo SÓLO si el cliente proveyó nombre y apellido (≥2 palabras), teléfono real y (email o ciudad)
    const validFullName = cleanClientName(lead.cliente_nombre);
    const hasValidFullName = Boolean(validFullName && validFullName.split(/\s+/).length >= 2);
    const hasEmail = Boolean(lead.email && lead.email !== 'Pendiente' && lead.email.includes('@'));
    const hasPhone = Boolean(lead.numero_celular && lead.numero_celular !== 'Desconocido' && lead.numero_celular.replace(/\D/g, '').length >= 8);
    const hasCity = Boolean(lead.ciudad && lead.ciudad !== 'Por definir');
    const isFormComplete = Boolean(hasValidFullName && hasPhone && (hasEmail || hasCity));

    lead.formulario_datos = {
      nombre: hasValidFullName ? lead.cliente_nombre : null,
      telefono: hasPhone ? lead.numero_celular : null,
      email: hasEmail ? lead.email : null,
      ciudad: lead.ciudad || null,
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
    } else if (hasValidFullName || hasEmail) {
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

    // Aliases para compatibilidad con vistas CRM, reportes y tests
    lead.calificacion_lead = priorityResult.prioridad_label || priorityResult.prioridad;
    lead.score_interes = priorityResult.score;
    lead.campana_origen = lead.campana;
    lead.tipo_operacion_detectada = lead.tipo_interes;

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

/**
 * Extrae entidades completas del prospecto a partir del texto
 */
function extractLeadEntities(text = '') {
  return {
    nombre: extractName(text) || '',
    email: extractEmail(text) || '',
    zona_interes: extractZone(text) || '',
    tipo_interes: extractOperation(text) || '',
    presupuesto: extractBudget(text) || '',
    horario_visita: extractSchedule(text) || ''
  };
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
  extractLeadEntities,
  extractName,
  extractEmail,
  extractZone,
  extractOperation,
  extractBudget,
  extractSchedule
};

