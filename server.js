/**
 * Realty ONE Group Bolivia - Servidor Cloud 24/7 Oficial (Render / Railway / VPS)
 * Unifica el Conector WhatsApp Web QR (Baileys), API de Leads y Frontend Estático.
 */

// Configurar zona horaria oficial de Bolivia (America/La_Paz, UTC-4)
process.env.TZ = 'America/La_Paz';

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logo circular y Favicon oficial Realty ONE Group incrustado en memoria (cero 404s en Render/Cloud)
const OFFICIAL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><circle cx="500" cy="500" r="500" fill="#CAA65E"/><g fill="#000000"><path fill-rule="evenodd" d="M 254 362 A 138 138 0 1 0 254 638 A 138 138 0 1 0 254 362 Z M 254 420 A 80 80 0 1 1 254 580 A 80 80 0 1 1 254 420 Z"/><rect x="432" y="362" width="58" height="276"/><polygon points="432,362 490,362 650,638 592,638"/><rect x="592" y="362" width="58" height="276"/><rect x="708" y="362" width="58" height="276"/><rect x="766" y="362" width="110" height="58"/><rect x="766" y="471" width="84" height="58"/><rect x="766" y="580" width="110" height="58"/></g><polygon points="585,440 658,367 658,396 585,469" fill="#CAA65E"/></svg>`;

app.get(['/favicon.ico', '/favicon.png', '/assets/favicon.png'], (req, res) => {
  res.type('image/svg+xml').send(OFFICIAL_LOGO_SVG);
});
app.get(['/logo_one_circle.png', '/assets/logo_one_circle.png', '/assets/logo_circle.svg', '/assets/logo_bolivia.png'], (req, res) => {
  res.type('image/svg+xml').send(OFFICIAL_LOGO_SVG);
});
app.get(['/index.html'], (req, res) => {
  res.redirect('https://realyonegroupbolivia.e-techgroupbolivia.com/');
});

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

app.get('/api/ping', (req, res) => res.send('pong'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Realty ONE Bot Cloud 24/7', connection: connectionStatus, numeroConectado: connectedNumber, time: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🦁 SERVIDOR REALTY ONE BOT CLOUD ACTIVO EN PUERTO: ${PORT}`);
  console.log(`📱 Conector QR en vivo disponible en: /qr_connect.html`);
  console.log(`======================================================\n`);

  // Anti-Sleep Heartbeat para Render (Ping cada 4 minutos para no dormir)
  const renderUrl = process.env.RENDER_EXTERNAL_URL || 'https://realty-one-bolivia.onrender.com';
  console.log(`⏱️ Anti-Sleep Heartbeat activo para: ${renderUrl}`);
  setInterval(async () => {
    try {
      await fetch(`${renderUrl}/api/ping`);
      console.log(`💓 [Anti-Sleep Ping] Heartbeat exitoso a ${renderUrl}`);
    } catch (e) {}
  }, 4 * 60 * 1000);

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

    const authDir = fs.existsSync(path.join(__dirname, 'backend'))
      ? path.join(__dirname, 'backend', 'baileys_auth')
      : path.join(__dirname, 'baileys_auth');

    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      browser: ['Realty ONE Bot Cloud', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'esperando_qr';
        try {
          currentQR = await QRCode.toDataURL(qr);
        } catch (err) {
          currentQR = qr;
        }
        console.log('\n📲 ¡NUEVO CÓDIGO QR GENERADO! Escanéalo en https://realty-one-bolivia.onrender.com/qr_connect.html\n');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'desconectado';
        currentQR = null;
        console.log(`🔌 Conexión cerrada (status: ${statusCode}). ¿Reconectando?: ${shouldReconnect}`);
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
        console.log(`\n🎉 ¡WHATSAPP CONECTADO 24/7 EN LA NUBE! Número: +${connectedNumber}\n`);
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
          try {
            const botReply = await aiAgent.processUserMessage(senderPhone, messageText, referralData);
            if (botReply && typeof botReply === 'string' && botReply.trim()) {
              console.log(`🤖 [Respuesta enviada a +${senderPhone}]:\n${botReply}\n`);
              
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

              if (photoPath && fs.existsSync(photoPath)) {
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
          } catch(procErr) {
            console.error('Error procesando mensaje con AI Agent:', procErr);
          }
        }
      }
    });

  } catch (error) {
    console.error('Error iniciando cliente de WhatsApp:', error);
  }
}
