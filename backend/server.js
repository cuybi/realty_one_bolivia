/**
 * Realty ONE Group Bolivia - Servidor Cloud 24/7 Oficial (Render / Railway / VPS)
 * Unifica el Conector WhatsApp Web QR (Baileys), API de Leads y Frontend Estático.
 */

// Configurar zona horaria oficial de Bolivia (America/La_Paz, UTC-4)
process.env.TZ = 'America/La_Paz';

// Crash guards obligatorios — evitan que un error no capturado deje el bot mudo
process.on('uncaughtException', (err) => {
  console.error('💥 [server.js uncaughtException]:', err?.stack || err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 [server.js unhandledRejection]:', reason?.stack || reason?.message || reason);
});

const fs = require('fs');
const path = require('path');
const dns = require('dns');
const express = require('express');
const cors = require('cors');

// Resolver DNS SRV de MongoDB Atlas en Windows / ISPs locales
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

// Cargar variables de entorno
const envPath = fs.existsSync(path.join(__dirname, '.env')) ? path.join(__dirname, '.env') : path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      if (k && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logo circular y Favicon oficial Realty ONE Group
const OFFICIAL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><circle cx="500" cy="500" r="500" fill="#CAA65E"/><g fill="#FFFFFF"><path fill-rule="evenodd" d="M 254 362 A 138 138 0 1 0 254 638 A 138 138 0 1 0 254 362 Z M 254 420 A 80 80 0 1 1 254 580 A 80 80 0 1 1 254 420 Z"/><rect x="432" y="362" width="58" height="276"/><polygon points="432,362 490,362 650,638 592,638"/><rect x="592" y="362" width="58" height="276"/><rect x="708" y="362" width="58" height="276"/><rect x="766" y="362" width="110" height="58"/><rect x="766" y="471" width="84" height="58"/><rect x="766" y="580" width="110" height="58"/></g><polygon points="585,440 658,367 658,396 585,469" fill="#CAA65E"/></svg>`;

app.get(['/favicon.ico', '/favicon.png', '/assets/favicon.png'], (req, res) => {
  const p = path.join(__dirname, 'assets', 'favicon.png');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.type('image/svg+xml').send(OFFICIAL_LOGO_SVG);
});
app.get(['/logo_one_circle.png', '/assets/logo_one_circle.png'], (req, res) => {
  const p = path.join(__dirname, 'assets', 'logo_one_circle.png');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.type('image/svg+xml').send(OFFICIAL_LOGO_SVG);
});
app.get(['/assets/logo_bolivia.png', '/logo_bolivia.png', '/assets/logo_itaguazu.png'], (req, res) => {
  const p = path.join(__dirname, 'assets', 'logo_bolivia.png');
  if (fs.existsSync(p)) return res.sendFile(p);
  res.type('image/svg+xml').send(OFFICIAL_LOGO_SVG);
});
app.get(['/index.html'], (req, res) => {
  res.redirect('https://realyonegroupbolivia.e-techgroupbolivia.com/');
});

// ponytail: Autenticación por Sesión y Token con soporte para Login Web y Retrocompatibilidad
const crypto = require('crypto');
const QR_USER = process.env.ADMIN_USER || process.env.QR_USER || 'admin';
const QR_PASS = process.env.ADMIN_PASS || process.env.QR_PASS || process.env.ADMIN_KEY || 'ONE2026';

// Mapa de sesiones activas en memoria (token -> { user, expiresAt })
const activeSessions = new Map();

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
      }
    });
  }
  return list;
}

function isValidSession(req) {
  // 1. Cookie HTTP-Only o cabecera de autenticación
  const cookies = parseCookies(req);
  const token = cookies.rog_auth_token || req.headers['x-auth-token'] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (session.expiresAt > Date.now()) {
      return true;
    } else {
      activeSessions.delete(token);
    }
  }

  // 2. Retrocompatibilidad query param ?key= o cabecera x-admin-key (scripts, extensiones)
  const key = req.query.key || req.headers['x-admin-key'];
  if (key && (key === QR_PASS || key === 'ONE2026')) {
    return true;
  }

  // 3. Basic Auth HTTP nativo
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Basic ')) {
    const [user, ...passParts] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':');
    if ((user === QR_USER && passParts.join(':') === QR_PASS) || passParts.join(':') === 'ONE2026') {
      return true;
    }
  }

  return false;
}

function requireQRAuth(req, res, next) {
  if (isValidSession(req)) {
    return next();
  }

  // Si es petición del navegador para ver una página HTML, redirigir a /login.html
  if (req.path.endsWith('.html') || (req.headers.accept && req.headers.accept.includes('text/html'))) {
    return res.redirect(`/login.html?redirect=${encodeURIComponent(req.originalUrl || req.url)}`);
  }

  return res.status(401).json({ error: 'No autorizado. Inicie sesión en /login.html' });
}

// Endpoints de autenticación de usuario
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos.' });
  }

  const userMatches = (username.trim() === QR_USER);
  const passMatches = (password.trim() === QR_PASS || password.trim() === 'ONE2026');

  if (userMatches && passMatches) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 3600 * 1000; // 7 días
    activeSessions.set(token, { user: username, expiresAt });

    res.setHeader('Set-Cookie', `rog_auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
    return res.json({ success: true, token, user: username });
  }

  return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos.' });
});

app.get('/api/auth/check', (req, res) => {
  const authenticated = isValidSession(req);
  res.json({ authenticated });
});

app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = cookies.rog_auth_token;
  if (token) activeSessions.delete(token);
  res.setHeader('Set-Cookie', 'rog_auth_token=; Path=/; HttpOnly; Max-Age=0');
  res.json({ success: true, message: 'Sesión cerrada correctamente.' });
});

// Servir archivos estáticos desde la raíz del proyecto
const staticPath = fs.existsSync(path.join(__dirname, 'qr_connect.html'))
  ? __dirname
  : path.join(__dirname, '..');

// Ruta pública para Login
app.get(['/login', '/login.html'], (req, res) => {
  const loginFile = path.join(staticPath, 'login.html');
  if (fs.existsSync(loginFile)) return res.sendFile(loginFile);
  res.status(404).send('login.html no encontrado');
});

// Proteger vistas administrativas (QR y CRM Leads) con autenticacion
app.get(['/', '/qr_connect.html', '/ingreso_leads.html', '/crm_leads.html'], requireQRAuth, (req, res) => {
  const file = req.path === '/' ? 'ingreso_leads.html' : req.path.replace(/^\//, '');
  res.sendFile(path.join(staticPath, file));
});

app.use(express.static(staticPath));

// Rutas de API WhatsApp y Leads
try {
  let whatsappRoutes;
  if (fs.existsSync(path.join(__dirname, 'backend', 'routes', 'whatsappRoutes.js'))) {
    whatsappRoutes = require('./backend/routes/whatsappRoutes');
  } else if (fs.existsSync(path.join(__dirname, 'routes', 'whatsappRoutes.js'))) {
    whatsappRoutes = require('./routes/whatsappRoutes');
  }
  if (whatsappRoutes) app.use('/api/whatsapp', whatsappRoutes);
} catch (e) {
  console.warn('Rutas de WhatsApp no cargadas:', e.message);
}

// Rutas de Marketing y Automatizaciones
try {
  let marketingRoutes;
  if (fs.existsSync(path.join(__dirname, 'backend', 'routes', 'marketingRoutes.js'))) {
    marketingRoutes = require('./backend/routes/marketingRoutes');
  } else if (fs.existsSync(path.join(__dirname, 'routes', 'marketingRoutes.js'))) {
    marketingRoutes = require('./routes/marketingRoutes');
  }
  if (marketingRoutes) app.use('/api/marketing', marketingRoutes);
} catch (e) {
  console.warn('Rutas de Marketing no cargadas:', e.message);
}

// Rutas del CMS y Portal Inmobiliario (/api/propiedades, /api/slides, etc.)
try {
  let cmsRoutes;
  if (fs.existsSync(path.join(__dirname, 'backend', 'routes', 'cmsRoutes.js'))) {
    cmsRoutes = require('./backend/routes/cmsRoutes');
  } else if (fs.existsSync(path.join(__dirname, 'routes', 'cmsRoutes.js'))) {
    cmsRoutes = require('./routes/cmsRoutes');
  }
  if (cmsRoutes) {
    app.use('/api', cmsRoutes);
    console.log('🏛️ [API REST] Rutas del CMS y Catálogo Inmobiliario montadas en /api');
  }
} catch (e) {
  console.warn('Rutas de CMS no cargadas:', e.message);
}

// Variables de Estado de Conexión QR
let currentQR = null;
let currentPairingCode = null;
let connectionStatus = 'desconectado'; // 'desconectado' | 'esperando_qr' | 'conectado'
let connectedNumber = null;
let isConnecting = false; // ponytail: guard contra race condition en reconexiones paralelas
let activeSock = null;

function syncQRStatusToDisk() {
  try {
    const data = {
      status: connectionStatus,
      qr: currentQR,
      numeroConectado: connectedNumber,
      pairingCode: currentPairingCode,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(__dirname, 'qr_status.json'), JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {}
}

// File-IPC para SiteGround: procesa comandos de qr_command.json enviados por qr_bridge.php
setInterval(async () => {
  const cmdFile = path.join(__dirname, 'qr_command.json');
  if (fs.existsSync(cmdFile)) {
    try {
      const raw = fs.readFileSync(cmdFile, 'utf8');
      const cmd = JSON.parse(raw);
      try { fs.unlinkSync(cmdFile); } catch(_) {}

      if (cmd.action === 'pairing') {
        let cleanNumber = String(cmd.phoneNumber || '59160937050').replace(/[^0-9]/g, '');
        if (cleanNumber.length === 8) cleanNumber = '591' + cleanNumber;
        console.log(`\n📲 [File-IPC] Generando código para WhatsApp +${cleanNumber}...`);
        if (activeSock && activeSock.requestPairingCode) {
          const code = await activeSock.requestPairingCode(cleanNumber);
          currentPairingCode = code;
          syncQRStatusToDisk();
          console.log(`🔑 [File-IPC] Código generado con éxito: ${code}`);
        } else {
          console.warn('⚠️ [File-IPC] Socket aún no está listo para pairing code. Reiniciando cliente...');
          isConnecting = false;
          setTimeout(startWhatsAppClient, 500);
        }
      } else if (cmd.action === 'desconectar') {
        console.log('\n🔌 [File-IPC] Desconectando sesión...');
        connectionStatus = 'desconectado';
        connectedNumber = null;
        currentQR = null;
        currentPairingCode = null;
        syncQRStatusToDisk();
        if (activeSock) {
          try { activeSock.logout(); } catch(_) {}
        }
      }
    } catch (e) {
      console.warn('⚠️ [File-IPC] Error:', e.message);
    }
  }
}, 1000);

// Endpoints QR para qr_connect.html
app.get('/api/whatsapp/qr-real', (req, res) => {
  syncQRStatusToDisk();
  res.json({
    status: connectionStatus,
    qr: currentQR,
    numeroConectado: connectedNumber,
    pairingCode: currentPairingCode
  });
});

// Endpoint para generar código de vinculación de 8 dígitos para +591 60937050
app.post('/api/whatsapp/pairing-code', async (req, res) => {
  try {
    const rawNumber = req.body?.phoneNumber || '59160937050';
    let cleanNumber = String(rawNumber).replace(/[^0-9]/g, '');
    if (cleanNumber.length === 8) {
      cleanNumber = '591' + cleanNumber;
    }

    if (!activeSock) {
      return res.status(503).json({ success: false, error: 'Iniciando conector de WhatsApp... por favor espera unos segundos y reintenta.' });
    }
    if (connectionStatus === 'conectado' && !req.body?.force && !req.query?.force) {
      return res.json({ success: false, error: `Ya está conectado al número +${connectedNumber}. Envía {"force": true} para forzar nueva vinculación.` });
    }
    if (connectionStatus === 'conectado' && (req.body?.force || req.query?.force)) {
      console.log('🔄 [pairing-code] Forzando nueva vinculación solicitada por el usuario...');
      connectionStatus = 'desconectado';
      connectedNumber = null;
    }

    console.log(`\n📲 Solicitando código de emparejamiento para WhatsApp +${cleanNumber}...`);
    const code = await activeSock.requestPairingCode(cleanNumber);
    currentPairingCode = code;
    syncQRStatusToDisk();
    console.log(`\n======================================================`);
    console.log(`🔑 CÓDIGO DE VINCULACIÓN GENERADO: ${code}`);
    console.log(`📱 En tu celular (+${cleanNumber}):`);
    console.log(`   WhatsApp > Dispositivos vinculados > Vincular con el número de teléfono`);
    console.log(`======================================================\n`);
    res.json({ success: true, code, phoneNumber: cleanNumber });
  } catch (err) {
    console.error('Error generando pairing code:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/whatsapp/desconectar', async (req, res) => {
  try {
    const authFolder = fs.existsSync(path.join(__dirname, 'backend', 'baileys_auth'))
      ? path.join(__dirname, 'backend', 'baileys_auth')
      : path.join(__dirname, 'baileys_auth');

    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    if (global.mongoClientSingleton) {
      try {
        await global.mongoClientSingleton.db('realty_one_bot').collection('baileys_auth').deleteMany({});
      } catch (e) {}
    }
    connectionStatus = 'desconectado';
    connectedNumber = null;
    currentQR = null;
    currentPairingCode = null;
    syncQRStatusToDisk();
    res.json({ success: true, message: 'Sesión borrada. Reiniciando conector para nuevo QR / Código...' });
    setTimeout(() => {
      startWhatsAppClient();
    }, 1500);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});



app.get('/api/ping', (req, res) => res.send('pong'));

let lastErrorMsg = null;
let lastInbound = null;
let lastOutbound = null;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Realty ONE Bot Cloud 24/7',
    connection: connectionStatus,
    numeroConectado: connectedNumber,
    hasQR: Boolean(currentQR),
    lastError: lastErrorMsg,
    lastInbound,
    lastOutbound,
    uptime: Math.round(process.uptime()),
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    mongoConnected: Boolean(global.mongoClientSingleton),
    time: new Date().toISOString()
  });
});

// Escribir estado inicial en qr_status.json
syncQRStatusToDisk();

// IPC por Archivo (File Bridge): Permite a qr_bridge.php enviar comandos al bot sin requerir puertos de red
const CMD_FILE = path.join(__dirname, 'qr_command.json');
setInterval(async () => {
  if (!fs.existsSync(CMD_FILE)) return;
  try {
    const raw = fs.readFileSync(CMD_FILE, 'utf8');
    if (!raw) return;
    const cmd = JSON.parse(raw);
    try { fs.unlinkSync(CMD_FILE); } catch (_) {}

    if (cmd.action === 'pairing' && activeSock) {
      console.log(`📲 [File-IPC] Generando pairing code para ${cmd.phoneNumber}...`);
      const code = await activeSock.requestPairingCode(cmd.phoneNumber);
      currentPairingCode = code;
      syncQRStatusToDisk();
    } else if (cmd.action === 'desconectar') {
      console.log(`🔌 [File-IPC] Desconectando sesión...`);
      if (global.mongoClientSingleton) {
        try {
          await global.mongoClientSingleton.db('realty_one_bot').collection('baileys_auth').deleteMany({});
        } catch (_) {}
      }
      connectionStatus = 'desconectado';
      connectedNumber = null;
      currentQR = null;
      currentPairingCode = null;
      syncQRStatusToDisk();
      setTimeout(startWhatsAppClient, 1500);
    }
  } catch (err) {
    console.error('Error procesando qr_command.json:', err.message);
  }
}, 1000);

// Iniciar SIEMPRE el cliente Baileys en segundo plano (no depende de ningún puerto de red)
startWhatsAppClient();

// Intentar levantar servidor HTTP en 127.0.0.1 (si el entorno lo permite).
// En SiteGround compartido, si falla con EPERM, el bot funciona igual mediante File-Bridge (qr_status.json).
try {
  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`\n======================================================`);
    console.log(`🦁 SERVIDOR REALTY ONE BOT ACTIVO EN: 127.0.0.1:${PORT}`);
    console.log(`📱 Conector QR en vivo disponible en: /qr_connect.html`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    console.warn(`⚠️ [Servidor HTTP Opcional]: ${err.message}`);
    console.log(`✅ [Modo Autónomo Activo]: WhatsApp Baileys 24/7 funcionando vía File-Bridge (qr_status.json).`);
  });
} catch (err) {
  console.warn(`⚠️ [Servidor HTTP Opcional]: ${err.message}. Continuando en modo autónomo.`);
}

// Anti-Sleep Heartbeat (Ping cada 4 minutos para mantener vivo en VPS / Render / Railway)
const externalUrl = process.env.EXTERNAL_URL || process.env.RENDER_EXTERNAL_URL;
if (externalUrl) {
  console.log(`⏱️ Anti-Sleep Heartbeat activo para: ${externalUrl}`);
  setInterval(async () => {
    try {
      await fetch(`${externalUrl}/api/ping`);
      console.log(`💓 [Anti-Sleep Ping] Heartbeat exitoso a ${externalUrl}`);
    } catch (e) {}
  }, 4 * 60 * 1000);
}

/**
 * Inicia el cliente WebSocket de Baileys en la Nube
 */
async function startWhatsAppClient() {
  try {
    let baileys;
    try {
      baileys = require('@whiskeysockets/baileys');
    } catch (e) {
      console.log('⚠️ Baileys no instalado aún en este entorno.');
      return;
    }

    const {
      default: makeWASocket,
      useMultiFileAuthState,
      DisconnectReason
    } = baileys;

    const QRCode = require('qrcode');

    // Cargar módulo AI Agent
    let aiAgent;
    try {
      if (fs.existsSync(path.join(__dirname, 'backend', 'services', 'aiAgent.js'))) {
        aiAgent = require('./backend/services/aiAgent');
      } else if (fs.existsSync(path.join(__dirname, 'services', 'aiAgent.js'))) {
        aiAgent = require('./services/aiAgent');
      }
    } catch (e) {
      console.warn('Error cargando aiAgent:', e.message);
    }

    // ponytail: guard contra race condition — heartbeat + connection.close pueden llamar esto en paralelo
    if (isConnecting) {
      console.log('⏸️ [startWhatsAppClient] Ya hay una conexión en curso, omitiendo llamada paralela.');
      return;
    }
    isConnecting = true;

    let state, saveCreds;
    const mongoUri = process.env.MONGODB_URI;
    const directMongoUri = 'mongodb://pixelbolivia_db_user:p15RQRIGZSavT37H@ac-5cybkoh-shard-00-00.qvkco9y.mongodb.net:27017,ac-5cybkoh-shard-00-01.qvkco9y.mongodb.net:27017,ac-5cybkoh-shard-00-02.qvkco9y.mongodb.net:27017/realty_one_bot?ssl=true&authSource=admin';
    let mongoLoaded = false;

    if (mongoUri) {
      const urisToTry = [mongoUri];
      if (mongoUri.includes('+srv://') && !urisToTry.includes(directMongoUri)) {
        urisToTry.push(directMongoUri);
      }

      const { MongoClient } = require('mongodb');
      const mongoAuthModule = fs.existsSync(path.join(__dirname, 'backend', 'services', 'mongoAuthState.js'))
        ? './backend/services/mongoAuthState'
        : './services/mongoAuthState';
      const { useMongoAuthState } = require(mongoAuthModule);

      for (const uri of urisToTry) {
        try {
          if (!global.mongoClientSingleton) {
            global.mongoClientSingleton = new MongoClient(uri, {
              serverSelectionTimeoutMS: 6000,
              socketTimeoutMS: 30000,
              maxIdleTimeMS: 30000
            });
            await global.mongoClientSingleton.connect();
            await global.mongoClientSingleton.db('realty_one_bot').command({ ping: 1 });
            console.log('✅ [MongoDB Atlas] Conectado y verificado (ping: 1) para persistencia 24/7');
          }
          const col = global.mongoClientSingleton.db('realty_one_bot').collection('baileys_auth');
          ({ state, saveCreds } = await useMongoAuthState(col));
          mongoLoaded = true;
          lastErrorMsg = null;
          break;
        } catch (mErr) {
          console.warn(`⚠️ [MongoDB] Intento fallido con ${uri.slice(0, 25)}...: ${mErr.message}`);
          try { await global.mongoClientSingleton?.close(); } catch (_) {}
          global.mongoClientSingleton = null;
        }
      }
    }

    // Si falló MongoDB: solo abortar en Render (disco efímero).
    // En SiteGround/VPS/Local el disco es PERSISTENTE, por lo que usamos ./baileys_auth con total seguridad.
    const isEphemeral = Boolean(process.env.RENDER || process.env.KOYEB);
    if (!mongoLoaded && isEphemeral) {
      connectionStatus = 'error_mongo';
      console.error('⛔ [Render] Falló conexión persistente a MongoDB en entorno efímero. Reintentando en 15s...');
      isConnecting = false;
      setTimeout(startWhatsAppClient, 15000);
      return;
    }

    if (!mongoLoaded) {
      const authDir = fs.existsSync(path.join(__dirname, 'baileys_auth'))
        ? path.join(__dirname, 'baileys_auth')
        : path.join(__dirname, 'backend', 'baileys_auth');

      if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
      ({ state, saveCreds } = await useMultiFileAuthState(authDir));
      console.log(`💾 [Modo Persistente]: Usando disco local persistente en ${authDir} (SiteGround / VPS 24/7).`);
      lastErrorMsg = null;
    }

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Realty ONE Bot Cloud', 'Chrome', '1.0.0']
    });
    activeSock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        isConnecting = false;
        connectionStatus = 'esperando_qr';
        try {
          currentQR = await QRCode.toDataURL(qr);
        } catch (err) {
          currentQR = qr;
        }
        syncQRStatusToDisk();
        console.log(`\n📲 ¡NUEVO CÓDIGO QR GENERADO! Escanéalo en ${process.env.EXTERNAL_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT}/qr_connect.html\n`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'desconectado';
        currentQR = null;
        currentPairingCode = null;
        activeSock = null;
        isConnecting = false;
        syncQRStatusToDisk();
        try {
          const mHub = fs.existsSync(path.join(__dirname, 'backend', 'services', 'marketingHub.js'))
            ? require('./backend/services/marketingHub')
            : require('./services/marketingHub');
          mHub.setBaileysSocket(null);
        } catch (e) {}
        console.log(`🔌 Conexión cerrada (status: ${statusCode}). ¿Reconectando?: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(startWhatsAppClient, 3000);
        } else {
          console.log('❌ Sesión cerrada por el usuario o credenciales revocadas. Limpiando credenciales...');
          connectedNumber = null;
          const authFolder = fs.existsSync(path.join(__dirname, 'backend', 'baileys_auth'))
            ? path.join(__dirname, 'backend', 'baileys_auth')
            : path.join(__dirname, 'baileys_auth');
          if (fs.existsSync(authFolder)) {
            try { fs.rmSync(authFolder, { recursive: true, force: true }); } catch(_) {}
          }
          if (global.mongoClientSingleton) {
            try {
              global.mongoClientSingleton.db('realty_one_bot').collection('baileys_auth').deleteMany({}).catch(()=>{});
            } catch (_) {}
          }
          syncQRStatusToDisk();
          setTimeout(startWhatsAppClient, 2000);
        }
      } else if (connection === 'open') {
        isConnecting = false;
        connectionStatus = 'conectado';
        currentQR = null;
        currentPairingCode = null;
        connectedNumber = sock.user?.id?.split(':')[0] || 'Conectado';
        syncQRStatusToDisk();
        try {
          const mHub = fs.existsSync(path.join(__dirname, 'backend', 'services', 'marketingHub.js'))
            ? require('./backend/services/marketingHub')
            : require('./services/marketingHub');
          mHub.setBaileysSocket(sock);
        } catch (e) {}
        console.log(`\n🎉 ¡WHATSAPP CONECTADO 24/7 EN LA NUBE! Número: +${connectedNumber}\n`);
      }
    });

    // Escuchar mensajes entrantes en WhatsApp
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        try {
          if (!msg.message || msg.key.fromMe) continue;

          const rawJid = msg.key.remoteJid;
          if (!rawJid || rawJid.endsWith('@g.us')) continue; // Ignorar grupos

          // Detección de @lid vs JID telefónico real (especialmente común en Meta Ads / CTWA)
          let targetJid = rawJid;
          let senderPhone = '';

          if (rawJid.endsWith('@lid')) {
            if (msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
              targetJid = msg.key.remoteJidAlt;
            } else if (msg.key.participant && msg.key.participant.endsWith('@s.whatsapp.net')) {
              targetJid = msg.key.participant;
            } else if (msg.key.participantAlt && msg.key.participantAlt.endsWith('@s.whatsapp.net')) {
              targetJid = msg.key.participantAlt;
            }
          }

          if (targetJid.endsWith('@s.whatsapp.net')) {
            senderPhone = targetJid.replace('@s.whatsapp.net', '').split(':')[0];
          } else if (msg.key.remoteJidAlt && msg.key.remoteJidAlt.endsWith('@s.whatsapp.net')) {
            senderPhone = msg.key.remoteJidAlt.replace('@s.whatsapp.net', '').split(':')[0];
          } else if (msg.key.participant && msg.key.participant.endsWith('@s.whatsapp.net')) {
            senderPhone = msg.key.participant.replace('@s.whatsapp.net', '').split(':')[0];
          } else {
            senderPhone = rawJid.split('@')[0];
          }

          const pushName = msg.pushName || 'Cliente';

          let rawMsg = msg.message;
          if (rawMsg?.ephemeralMessage?.message) rawMsg = rawMsg.ephemeralMessage.message;
          if (rawMsg?.viewOnceMessage?.message) rawMsg = rawMsg.viewOnceMessage.message;
          if (rawMsg?.viewOnceMessageV2?.message) rawMsg = rawMsg.viewOnceMessageV2.message;
          if (rawMsg?.documentWithCaptionMessage?.message) rawMsg = rawMsg.documentWithCaptionMessage.message;

          const ext = rawMsg?.extendedTextMessage;
          const contextInfo = ext?.contextInfo || rawMsg?.contextInfo;
          const externalAdReply = contextInfo?.externalAdReply;

          const messageText = (
            rawMsg?.conversation ||
            ext?.text ||
            rawMsg?.imageMessage?.caption ||
            rawMsg?.videoMessage?.caption ||
            rawMsg?.documentMessage?.caption ||
            rawMsg?.buttonsResponseMessage?.selectedDisplayText ||
            rawMsg?.templateButtonReplyMessage?.selectedDisplayText ||
            rawMsg?.listResponseMessage?.title ||
            externalAdReply?.title ||
            ''
          ).trim();

          if (!messageText) continue;

          // Registrar lastInbound para diagnóstico en vivo desde /api/health
          lastInbound = {
            rawJid,
            targetJid,
            senderPhone,
            pushName,
            text: messageText.slice(0, 200),
            hasAd: Boolean(externalAdReply),
            adTitle: externalAdReply?.title || null,
            timestamp: new Date().toISOString()
          };

          console.log(`\n📩 [Mensaje recibido de +${senderPhone} (${pushName})]: "${messageText}" [JID destino: ${targetJid}]`);

          const referral = externalAdReply;
          const referralData = (referral?.title || referral?.body || referral?.sourceUrl || referral?.description) ? {
            source: 'Facebook Ads (CTWA)',
            headline: referral?.title || '',
            body: referral?.body || '',
            sourceUrl: referral?.sourceUrl || '',
            description: referral?.description || '',
            mediaUrl: referral?.mediaUrl || '',
            pushName: pushName
          } : (pushName ? { pushName } : null);

          if (aiAgent && aiAgent.processUserMessage) {
            try {
              const botReply = await aiAgent.processUserMessage(senderPhone, messageText, referralData);
              if (botReply && typeof botReply === 'string' && botReply.trim()) {
                // Si el cliente pide fotos de Mar Adentro, Parque Industrial o Departamentos
                const normMsg = messageText.toLowerCase();
                let photoPath = null;
                if (normMsg.includes('foto') || normMsg.includes('imagen') || normMsg.includes('ver fotos') || normMsg.includes('tiene fotos')) {
                  const marPath = path.join(__dirname, 'assets', 'images', 'mar_adentro.jpg');
                  const indPath = path.join(__dirname, 'assets', 'images', 'terreno.png');
                  const aptPath = path.join(__dirname, 'assets', 'images', 'apartamento.png');

                  if ((botReply.includes('Mar Adentro') || normMsg.includes('mar adentro')) && fs.existsSync(marPath)) {
                    photoPath = marPath;
                  } else if ((botReply.includes('Industrial') || normMsg.includes('industrial')) && fs.existsSync(indPath)) {
                    photoPath = indPath;
                  } else if ((botReply.includes('Departamento') || normMsg.includes('departamento')) && fs.existsSync(aptPath)) {
                    photoPath = aptPath;
                  }
                }

                let sendSuccess = false;
                try {
                  if (photoPath && fs.existsSync(photoPath)) {
                    await sock.sendMessage(targetJid, {
                      image: fs.readFileSync(photoPath),
                      caption: botReply
                    });
                  } else {
                    await sock.sendMessage(targetJid, { text: botReply });
                  }
                  sendSuccess = true;
                } catch (sendErr) {
                  console.warn(`⚠️ Error enviando a targetJid ${targetJid}:`, sendErr.message);
                  if (rawJid !== targetJid) {
                    console.log(`🔄 Reintentando con rawJid alternativo ${rawJid}...`);
                    if (photoPath && fs.existsSync(photoPath)) {
                      await sock.sendMessage(rawJid, {
                        image: fs.readFileSync(photoPath),
                        caption: botReply
                      });
                    } else {
                      await sock.sendMessage(rawJid, { text: botReply });
                    }
                    sendSuccess = true;
                  } else {
                    throw sendErr;
                  }
                }

                if (sendSuccess) {
                  lastOutbound = {
                    targetJid,
                    senderPhone,
                    text: botReply.slice(0, 150),
                    timestamp: new Date().toISOString()
                  };
                  console.log(`🤖 [Respuesta enviada a +${senderPhone}]:\n${botReply}\n`);
                }
              }
            } catch (procErr) {
              console.error('💥 Error procesando mensaje con AI Agent:', procErr?.stack || procErr?.message || procErr);
            }
          }
        } catch (itemErr) {
          console.error('💥 Error en bucle de mensaje Baileys:', itemErr?.stack || itemErr?.message || itemErr);
        }
      }
    });

  } catch (error) {
    lastErrorMsg = error?.stack || error?.message || String(error);
    console.error('Error iniciando cliente de WhatsApp:', lastErrorMsg);
  } finally {
    isConnecting = false; // ponytail: liberar guard siempre, incluso en error
  }
}
