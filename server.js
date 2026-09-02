/**
 * Realty ONE Group Bolivia - Servidor Cloud 24/7 Oficial (Render / Railway / VPS)
 * Unifica el Conector WhatsApp Web QR (Baileys), API de Leads y Frontend Estático.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos desde la raíz del proyecto
const staticPath = fs.existsSync(path.join(__dirname, 'qr_connect.html'))
  ? __dirname
  : path.join(__dirname, '..');

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

// Variables de Estado de Conexión QR
let currentQR = null;
let connectionStatus = 'desconectado'; // 'desconectado' | 'esperando_qr' | 'conectado'
let connectedNumber = null;

// Endpoints QR para qr_connect.html
app.get('/api/whatsapp/qr-real', (req, res) => {
  res.json({
    status: connectionStatus,
    qr: currentQR,
    numeroConectado: connectedNumber
  });
});

app.post('/api/whatsapp/desconectar', (req, res) => {
  try {
    const authFolder = fs.existsSync(path.join(__dirname, 'backend', 'baileys_auth'))
      ? path.join(__dirname, 'backend', 'baileys_auth')
      : path.join(__dirname, 'baileys_auth');

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

// Rutas directas para qr_connect
app.get('/', (req, res) => {
  const qrFile = path.join(staticPath, 'qr_connect.html');
  if (fs.existsSync(qrFile)) return res.sendFile(qrFile);
  res.send('🦁 Servidor Realty ONE Cloud Activo 24/7. Abre /qr_connect.html');
});

app.get('/qr_connect.html', (req, res) => {
  const qrFile = path.join(staticPath, 'qr_connect.html');
  if (fs.existsSync(qrFile)) return res.sendFile(qrFile);
  res.status(404).send('qr_connect.html no encontrado');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Realty ONE Bot Cloud 24/7', connection: connectionStatus, time: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🦁 SERVIDOR REALTY ONE BOT CLOUD ACTIVO EN PUERTO: ${PORT}`);
  console.log(`📱 Conector QR en vivo disponible en: /qr_connect.html`);
  console.log(`======================================================\n`);
  startWhatsAppClient();
});

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
      DisconnectReason,
      fetchLatestBaileysVersion
    } = baileys;

    const pino = require('pino');
    const QRCode = require('qrcode');

    // Cargar módulo AI Agent
    let aiAgent;
    try {
      if (fs.existsSync(path.join(__dirname, 'backend', 'services', 'aiAgent.js'))) {
        aiAgent = require('./backend/services/aiAgent');
      } else if (fs.existsSync(path.join(__dirname, 'services', 'aiAgent.js'))) {
        aiAgent = require('./services/aiAgent');
      }
    } catch (e) {}

    const authDir = fs.existsSync(path.join(__dirname, 'backend'))
      ? path.join(__dirname, 'backend', 'baileys_auth')
      : path.join(__dirname, 'baileys_auth');

    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: 'silent' }),
      browser: ['Realty ONE Bot Cloud', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'esperando_qr';
        try {
          currentQR = await QRCode.toDataURL(qr);
          console.log('\n📲 ¡NUEVO CÓDIGO QR GENERADO EN LA NUBE! Abre /qr_connect.html\n');
        } catch (err) {
          currentQR = qr;
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'desconectado';
        currentQR = null;
        console.log(`🔌 Conexión cerrada. ¿Reconectando?: ${shouldReconnect}`);
        if (shouldReconnect) {
          setTimeout(startWhatsAppClient, 3000);
        } else {
          console.log('❌ Sesión cerrada por el usuario. Limpiando credenciales...');
          if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
          }
          setTimeout(startWhatsAppClient, 2000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'conectado';
        currentQR = null;
        connectedNumber = sock.user?.id?.split(':')[0] || 'Conectado';
        console.log(`\n✅ ¡WHATSAPP CONECTADO 24/7 EN LA NUBE! Número: +${connectedNumber}\n`);
      }
    });

    // Escuchar mensajes entrantes en WhatsApp
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const senderJid = msg.key.remoteJid;
        if (!senderJid || senderJid.endsWith('@g.us')) continue; // Ignorar grupos

        const senderPhone = senderJid.replace('@s.whatsapp.net', '');
        const pushName = msg.pushName || 'Cliente';

        let messageText = '';
        if (msg.message.conversation) {
          messageText = msg.message.conversation;
        } else if (msg.message.extendedTextMessage?.text) {
          messageText = msg.message.extendedTextMessage.text;
        } else if (msg.message.imageMessage?.caption) {
          messageText = msg.message.imageMessage.caption;
        }

        if (!messageText.trim()) continue;

        console.log(`\n📩 [Mensaje recibido de +${senderPhone} (${pushName})]: "${messageText}"`);

        const referral = msg.message.extendedTextMessage?.contextInfo?.externalAdReply;
        const referralData = {
          source: referral ? 'Facebook Ads (CTWA)' : 'WhatsApp Directo',
          headline: referral?.title || '',
          body: referral?.body || '',
          mediaUrl: referral?.mediaUrl || '',
          pushName: pushName
        };

        if (aiAgent && aiAgent.processUserMessage) {
          const botReply = await aiAgent.processUserMessage(senderPhone, messageText, referralData);
          if (botReply && typeof botReply === 'string' && botReply.trim()) {
            console.log(`🤖 [Respuesta enviada a +${senderPhone}]:\n${botReply}\n`);
            await sock.sendMessage(senderJid, { text: botReply });
          }
        }
      }
    });

  } catch (error) {
    console.error('Error iniciando cliente de WhatsApp:', error);
  }
}
