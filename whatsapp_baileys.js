/**
 * Conector Real de WhatsApp Web (Multi-Device) para Realty ONE Group Bolivia
 * Permite vincular cualquier celular escaneando el código QR oficial de WhatsApp.
 */

// ponytail: crash guards — sin esto, un error no manejado mata todo el proceso
process.on('uncaughtException', (err) => {
  console.error('💀 [uncaughtException]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('💀 [unhandledRejection]', reason);
});

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

// Cargar variables de entorno
const envPath = path.join(__dirname, '.env');
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

const aiAgent = require('./services/aiAgent');
const campaignService = require('./services/campaignService');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Sincronización de logos corporativos de alta definición
function syncBrandLogos() {
  try {
    const uploadedDir = path.join(process.env.USERPROFILE || 'C:\\Users\\etechadmin', '.gemini', 'antigravity-ide', 'brain', '5a66f826-cde6-4725-93a8-9fc6f34c9438', '.user_uploaded');
    const assetsDir = path.join(__dirname, '..', 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    const logoMaps = [
      { src: 'media_1787946407253.png', dest: 'logo_one_circle.png' },
      { src: 'media_1787946407253.png', dest: 'favicon.png' },
      { src: 'media_1787756699919.png', dest: 'logo_realty_one_full.png' },
      { src: 'media_1787756699989.png', dest: 'logo_realty_one_white.png' },
      { src: 'media_1787756699919.png', dest: 'logo_bolivia.png' }
    ];

    logoMaps.forEach(m => {
      const srcP = path.join(uploadedDir, m.src);
      const destP = path.join(assetsDir, m.dest);
      if (fs.existsSync(srcP)) {
        fs.copyFileSync(srcP, destP);
      }
    });
  } catch (e) {}
}
syncBrandLogos();

let currentQR = null;
let connectionStatus = 'desconectado'; // 'desconectado' | 'esperando_qr' | 'conectado'
let connectedNumber = null;
let reconnectAttempts = 0; // ponytail: backoff counter
let activeSock = null; // ponytail: track live socket for health checks

// Servidor Web para servir el QR real a qr_connect.html y API de Leads
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/whatsapp', whatsappRoutes);
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/ping', (req, res) => res.send('pong'));
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    whatsapp: connectionStatus,
    numeroConectado: connectedNumber,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/whatsapp/qr-real', (req, res) => {
  res.json({
    status: connectionStatus,
    qr: currentQR,
    numeroConectado: connectedNumber
  });
});

app.post('/api/whatsapp/desconectar', (req, res) => {
  try {
    const authFolder = path.join(__dirname, 'baileys_auth');
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    connectionStatus = 'desconectado';
    connectedNumber = null;
    currentQR = null;
    res.json({ success: true, message: 'Sesión borrada. Reiniciando conector para nuevo QR...' });
    setTimeout(() => {
      startWhatsAppClient();
    }, 1500);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🦁 SERVIDOR REALTY ONE BOT ACTIVO EN: http://localhost:${PORT}`);
  console.log(`📱 Abre en tu navegador: http://localhost:${PORT}/qr_connect.html`);
  console.log(`======================================================\n`);
  
  // Anti-Sleep Heartbeat para Render + health check de Baileys
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL;
  if (renderExternalUrl) {
    console.log(`⏱️ Anti-Sleep Heartbeat activo para: ${renderExternalUrl}`);
    setInterval(async () => {
      try {
        await fetch(`${renderExternalUrl}/api/ping`);
        console.log(`💓 [Heartbeat] Ping OK. WhatsApp: ${connectionStatus}`);
        // ponytail: si Baileys murió sin reconectar, forzar restart
        if (connectionStatus === 'desconectado' && !activeSock) {
          console.log('🔄 [Heartbeat] Baileys muerto, reconectando...');
          startWhatsAppClient();
        }
      } catch (e) {}
    }, 4 * 60 * 1000);
  }

  startWhatsAppClient();
});

/**
 * Inicia el cliente WebSocket de Baileys
 */
async function startWhatsAppClient() {
  try {
    let baileys;
    try {
      baileys = require('@whiskeysockets/baileys');
    } catch (e) {
      console.log('⚠️ Para habilitar el escaneo de QR oficial en vivo, instala Baileys ejecutando:');
      console.log('👉 npm install @whiskeysockets/baileys pino qrcode\n');
      return;
    }

    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;
    const authFolder = path.join(__dirname, 'baileys_auth');
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Realty ONE Bot', 'Chrome', '1.0.0'],
      // ponytail: timeouts generosos para conexiones lentas en Render Free
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });
    activeSock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const QRCodePkg = require('qrcode');
          currentQR = await QRCodePkg.toDataURL(qr, { margin: 2, scale: 8 });
        } catch (e) {
          currentQR = qr;
        }
        connectionStatus = 'esperando_qr';
        console.log('\n📲 ¡NUEVO CÓDIGO QR GENERADO! Escanéalo en tu terminal o en http://localhost:3000/qr_connect.html\n');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403;
        console.log('🔌 Conexión cerrada. Código:', statusCode || 'desconocido');
        connectionStatus = 'desconectado';
        currentQR = null;
        activeSock = null;
        if (isLoggedOut) {
          console.log('⚠️ Sesión de WhatsApp expirada o desvinculada en el teléfono.');
          console.log('🔄 Limpiando credenciales antiguas para generar un NUEVO CÓDIGO QR...');
          reconnectAttempts = 0;
          try {
            if (fs.existsSync(authFolder)) fs.rmSync(authFolder, { recursive: true, force: true });
          } catch (e) {}
          setTimeout(() => startWhatsAppClient(), 1500);
        } else {
          // ponytail: backoff exponencial — 2s, 4s, 8s, 16s... max 60s
          const delay = Math.min(2000 * Math.pow(2, reconnectAttempts), 60000);
          reconnectAttempts++;
          console.log(`🔄 Reconectando en ${delay / 1000}s (intento #${reconnectAttempts})...`);
          setTimeout(() => startWhatsAppClient(), delay);
        }
      } else if (connection === 'open') {
        connectionStatus = 'conectado';
        currentQR = null;
        reconnectAttempts = 0; // ponytail: reset backoff on success
        connectedNumber = sock.user?.id?.split(':')[0] || 'Conectado';
        console.log(`\n🎉 ¡CONEXIÓN EXITOSA CON WHATSAPP!`);
        console.log(`✅ Número vinculado: +${connectedNumber}`);
        console.log(`🤖 El bot ahora responderá automáticamente a todos los mensajes entrantes.\n`);
      }
    });

    // Cache de mensajes recientes para evitar bucles o duplicados
    const processedMessageIds = new Set();
    const lastMessageBySender = new Map();

    // MODO PRODUCCIÓN: Responde automáticamente a todos los mensajes de clientes entrantes
    const TEST_MODE = false;
    const NUMEROS_PRUEBA = [
      // Vacío = bot en pausa. Agrega tu número de prueba aquí si tienes un segundo celular.
      // Ejemplo: '59176543210',
    ];

    // Escuchar mensajes entrantes en WhatsApp
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        const msgId = msg.key.id;

        // 1. REGLA DE ORO: Si el mensaje fue enviado por nosotros/el bot (fromMe), IGNORAR TOTALMENTE
        if (msg.key.fromMe) continue;

        // 2. Si ya procesamos este ID de mensaje, ignorar
        if (processedMessageIds.has(msgId)) continue;
        processedMessageIds.add(msgId);
        if (processedMessageIds.size > 200) {
          const first = processedMessageIds.values().next().value;
          processedMessageIds.delete(first);
        }

        const senderJid = msg.key.remoteJid;
        if (!senderJid || senderJid.endsWith('@g.us') || senderJid === 'status@broadcast') continue;

        const senderPhone = senderJid.replace('@s.whatsapp.net', '').split(':')[0];

        // 3. FILTRO DE PRUEBA: Si TEST_MODE está activo, solo responde a los números permitidos
        if (TEST_MODE && !NUMEROS_PRUEBA.includes(senderPhone)) {
          console.log(`⏭️  [MODO PRUEBA] Mensaje de ${senderPhone} ignorado — no está en la lista de prueba.`);
          continue;
        }

        // Desempaquetar mensajes efímeros o anidados
        let rawMsg = msg.message;
        if (rawMsg?.ephemeralMessage?.message) rawMsg = rawMsg.ephemeralMessage.message;
        if (rawMsg?.viewOnceMessage?.message) rawMsg = rawMsg.viewOnceMessage.message;
        if (rawMsg?.viewOnceMessageV2?.message) rawMsg = rawMsg.viewOnceMessageV2.message;
        if (rawMsg?.documentWithCaptionMessage?.message) rawMsg = rawMsg.documentWithCaptionMessage.message;

        const ext = rawMsg?.extendedTextMessage;
        const contextInfo = ext?.contextInfo || rawMsg?.contextInfo;
        const externalAdReply = contextInfo?.externalAdReply;

        const baseText = rawMsg?.conversation ||
                         ext?.text ||
                         rawMsg?.imageMessage?.caption ||
                         rawMsg?.videoMessage?.caption ||
                         rawMsg?.documentMessage?.caption ||
                         rawMsg?.buttonsResponseMessage?.selectedDisplayText ||
                         rawMsg?.templateButtonReplyMessage?.selectedDisplayText ||
                         rawMsg?.listResponseMessage?.title || '';

        // Extraer todo el contexto de Facebook Ads / Tarjeta de publicación compartida
        const adContext = [
          externalAdReply?.title,
          externalAdReply?.body,
          externalAdReply?.sourceUrl,
          externalAdReply?.description,
          ext?.description,
          ext?.title,
          ext?.matchedText,
          ext?.canonicalUrl
        ].filter(Boolean).join(' ');

        const messageText = (baseText + (adContext ? ' | ' + adContext : '')).trim();

        if (!messageText) continue;

        const pushName = msg.pushName || '';

        // 4. Debounce: Evitar procesar el mismo texto del mismo usuario si llegó hace menos de 2 segundos
        const now = Date.now();
        const last = lastMessageBySender.get(senderPhone);
        if (last && last.text === messageText && (now - last.time) < 2000) {
          continue;
        }
        lastMessageBySender.set(senderPhone, { text: messageText, time: now });

        console.log(`\n📩 [Mensaje entrante (${senderPhone}${pushName ? ` - ${pushName}` : ''})]: "${messageText}"`);

        // Preparar referralData si viene desde un anuncio de Facebook
        const referralData = {
          headline: externalAdReply?.title || '',
          body: externalAdReply?.body || '',
          source_url: externalAdReply?.sourceUrl || '',
          source_id: externalAdReply?.sourceId || '',
          description: externalAdReply?.description || '',
          fullContext: adContext,
          pushName: pushName
        };

        // Procesar respuesta con el cerebro del nuevo flujo oficial
        const botReply = await aiAgent.processUserMessage(senderPhone, messageText, referralData);

        if (!botReply || typeof botReply !== 'string' || !botReply.trim()) {
          console.log(`🔇 [Chat finalizado / silenciado para ${senderPhone}]`);
          continue;
        }

        console.log(`🤖 [Respuesta enviada a ${senderPhone}]:\n${botReply}\n`);

        // Enviar respuesta por WhatsApp (con imagen si el usuario pidió fotos)
        const normMsg = messageText.toLowerCase();
        let photoPath = null;

        if (normMsg.includes('foto') || normMsg.includes('imagen') || normMsg.includes('ver fotos') || normMsg.includes('tiene fotos')) {
          if (botReply.includes('Departamento') || normMsg.includes('departamento') || normMsg.includes('dpto')) {
            const p = path.join(__dirname, '..', 'assets', 'images', 'apartamento.png');
            if (fs.existsSync(p)) photoPath = p;
          } else if (botReply.includes('Mar Adentro') || normMsg.includes('mar adentro') || normMsg.includes('laguna')) {
            const p1 = path.join(__dirname, '..', 'assets', 'images', 'mar_adentro.jpg');
            const p2 = 'C:\\Users\\etechadmin\\.gemini\\antigravity-ide\\brain\\fea89e8d-eed8-4640-b4be-b2a07760e3fd\\mar_adentro_real_1788202039370.jpg';
            if (fs.existsSync(p1)) {
              photoPath = p1;
            } else if (fs.existsSync(p2)) {
              photoPath = p2;
            }
          } else if (botReply.includes('Industrial') || normMsg.includes('industrial') || normMsg.includes('g77')) {
            const p = path.join(__dirname, '..', 'assets', 'images', 'terreno.png');
            if (fs.existsSync(p)) photoPath = p;
          }
        }

        if (photoPath) {
          try {
            await sock.sendMessage(senderJid, {
              image: fs.readFileSync(photoPath),
              caption: botReply
            });
            continue;
          } catch(imgErr) {
            console.error('Error enviando imagen:', imgErr);
          }
        }

        await sock.sendMessage(senderJid, { text: botReply });
      }
    });

  } catch (error) {
    console.error('Error iniciando cliente de WhatsApp:', error);
    activeSock = null;
    // ponytail: no morir, reintentar con backoff
    const delay = Math.min(2000 * Math.pow(2, reconnectAttempts), 60000);
    reconnectAttempts++;
    console.log(`🔄 Reintentando en ${delay / 1000}s tras error fatal (intento #${reconnectAttempts})...`);
    setTimeout(() => startWhatsAppClient(), delay);
  }
}
