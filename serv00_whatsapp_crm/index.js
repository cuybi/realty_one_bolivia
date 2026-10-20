/**
 * ==============================================================================
 * REALTY ONE / CRM WHATSAPP — BOT BAILEYS Y CRM MYSQL (OPTIMIZADO PARA SERV00)
 * ==============================================================================
 * 
 * Diseñado específicamente para entornos con recursos limitados (FreeBSD / Serv00):
 * - Cero uso de Chromium / Puppeteer (100% Baileys WebSocket nativo).
 * - Código QR renderizado en consola SSH mediante qrcode-terminal.
 * - Pool de conexiones MySQL resiliente ante cortes de inactividad.
 * - Máquina de estados en memoria con recolector de basura periódico (cero fugas de RAM).
 * - Sincronización de historial desactivada para no exceder los 512MB de RAM de Serv00.
 */

const fs = require('fs');
const path = require('path');

// Carga resiliente de variables de entorno (compatible con o sin paquete dotenv)
try {
    require('dotenv').config();
} catch (_) {
    const envFile = path.join(__dirname, '.env');
    if (fs.existsSync(envFile)) {
        try {
            const lines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                    const idx = trimmed.indexOf('=');
                    const k = trimmed.substring(0, idx).trim();
                    const v = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
                    if (!process.env[k]) process.env[k] = v;
                }
            }
        } catch (_) {}
    }
}
const pino = require('pino');
const { initDatabase, guardarLead, obtenerLeads } = require('./db_adapter');

// Renderizador seguro de QR compatible con qrcode-terminal y qrcode
let qrcodeTerminal = null;
try {
    qrcodeTerminal = require('qrcode-terminal');
} catch (_) {
    try {
        const qrcode = require('qrcode');
        qrcodeTerminal = {
            generate: (code, opts) => {
                qrcode.toString(code, { type: 'terminal', small: true }, (err, str) => {
                    if (!err && str) console.log(str);
                    else console.log('📲 QR Code Raw Data:\n' + code);
                });
            }
        };
    } catch (e) {
        qrcodeTerminal = {
            generate: (code) => console.log('📲 QR Code Raw Data:\n' + code)
        };
    }
}

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    isJidBroadcast,
    isJidNewsletter
} = require('@whiskeysockets/baileys');

// 1. Configuración de Entorno
const SALES_PHONE = (process.env.SALES_PHONE || '59160937050').replace(/\D/g, '');
const TRIGGER_KEYWORD = (process.env.TRIGGER_MESSAGE || 'Hola, vi tu anuncio de Facebook').toLowerCase().trim();

// Carpeta local para almacenar la sesión de WhatsApp de forma permanente
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

// Crash guards globales para evitar que el proceso muera en Serv00
process.on('uncaughtException', (err) => {
    console.error('💥 [Uncaught Exception]:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
    console.error('💥 [Unhandled Rejection]:', reason?.message || reason);
});

// ==============================================================================
// 2. Base de Datos Resiliente (Universal DB Adapter)
// ==============================================================================
// Conexión gestionada mediante db_adapter.js:
// - Si MySQL está disponible (Serv00/CPanel/VPS) -> Usa MySQL con Pool.
// - Si no hay MySQL (Local/Opción 2) -> Fallback automático a leads.json local y sync raíz.

// ==============================================================================
// 3. El Puente (Máquina de Estados en Memoria)
// ==============================================================================
// Estructura de cada sesión:
// { step: 'WAITING_NAME' | 'WAITING_EMAIL' | 'WAITING_SERVICE' | 'COMPLETED', nombre, correo, servicio, updatedAt }
const userSessions = new Map();

// Limpieza automática cada hora para liberar memoria en Serv00 (TTL: 24 horas)
setInterval(() => {
    const ahora = Date.now();
    const TTL = 24 * 60 * 60 * 1000;
    for (const [jid, session] of userSessions.entries()) {
        if (ahora - session.updatedAt > TTL) {
            userSessions.delete(jid);
        }
    }
}, 60 * 60 * 1000).unref();

// ==============================================================================
// 4. Inicialización y Conexión de WhatsApp Baileys
// ==============================================================================
let sock = null;
let isReconnecting = false;

async function startBot() {
    try {
        console.log('\n======================================================');
        console.log('🤖 INICIANDO BOT DE WHATSAPP BAILEYS (SERV00 24/7)');
        console.log('======================================================\n');

        // Inicializar adaptador de base de datos resiliente
        await initDatabase();

        // Cargar o crear el estado de autenticación multi-archivo
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        // Logger silencioso para ahorrar memoria y no saturar logs en disco
        const logger = pino({ level: 'silent' });

        sock = makeWASocket({
            version,
            logger,
            auth: state,
            printQRInTerminal: false, // Usamos qrcode-terminal manualmente
            browser: ['Serv00-CRM-Bot', 'Chrome', '1.0.0'],
            // OPTIMIZACIONES CRÍTICAS DE MEMORIA PARA SERV00:
            syncFullHistory: false, // NUNCA sincronizar historial antiguo
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
            shouldIgnoreJid: (jid) => isJidBroadcast(jid) || isJidNewsletter(jid),
            getMessage: async () => undefined // No almacenar mensajes pesados en búfer
        });

        // Guardar credenciales automáticamente ante cualquier cambio
        sock.ev.on('creds.update', saveCreds);

        // Control de eventos de conexión y QR
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            // 1. Mostrar código QR en la consola SSH
            if (qr) {
                console.log('\n📲 ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP:\n');
                qrcodeTerminal.generate(qr, { small: true });
                console.log('👉 WhatsApp > Dispositivos vinculados > Vincular un dispositivo\n');
            }

            // 2. Conexión abierta con éxito
            if (connection === 'open') {
                const botNumber = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0];
                console.log('\n======================================================');
                console.log(`✅ ¡WHATSAPP CONECTADO EXITOSAMENTE!`);
                console.log(`📱 Número de línea: +${botNumber}`);
                console.log(`🚀 Listo para recibir prospectos de Facebook Ads.`);
                console.log('======================================================\n');
                isReconnecting = false;
            }

            // 3. Conexión cerrada / Desconexión
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

                console.warn(`⚠️ [Conexión Cerrada] Razón / Status Code: ${statusCode}`);

                if (statusCode === DisconnectReason.loggedOut) {
                    console.error('❌ Sesión cerrada desde el teléfono móvil. Eliminando credenciales para nuevo QR...');
                    if (fs.existsSync(AUTH_DIR)) {
                        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                    }
                    setTimeout(() => startBot(), 2000);
                } else if (shouldReconnect) {
                    if (!isReconnecting) {
                        isReconnecting = true;
                        console.log('🔄 Reconectando a WhatsApp en 5 segundos...');
                        setTimeout(() => startBot(), 5000);
                    }
                }
            }
        });

        // ==============================================================================
        // 5. Flujo de Mensajes e Interacción Conversacional
        // ==============================================================================
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const msg of messages) {
                try {
                    // Ignorar mensajes enviados por el propio bot
                    if (!msg.message || msg.key.fromMe) continue;

                    const jid = msg.key.remoteJid;
                    if (!jid || jid.endsWith('@g.us') || isJidBroadcast(jid) || isJidNewsletter(jid)) {
                        continue; // Ignorar grupos, difusiones y canales
                    }

                    // Extraer texto limpio del mensaje
                    const rawText = msg.message.conversation ||
                                    msg.message.extendedTextMessage?.text ||
                                    msg.message.buttonsResponseMessage?.selectedButtonId ||
                                    '';
                    const text = rawText.trim();
                    if (!text) continue;

                    const textLower = text.toLowerCase();
                    const phoneClean = jid.replace(/\D/g, '');

                    // Obtener estado actual del usuario
                    let session = userSessions.get(jid);

                    // ==========================================================
                    // PASO 1: CAPTACIÓN Y TRIGGER DE FACEBOOK ADS
                    // ==========================================================
                    const isTrigger = textLower.includes(TRIGGER_KEYWORD) ||
                                      textLower.startsWith('hola, vi tu anuncio') ||
                                      textLower.startsWith('hola vi tu anuncio');

                    if (isTrigger) {
                        console.log(`\n🎯 [Trigger Detectado] Prospecto entrante desde Facebook Ads: +${phoneClean}`);

                        // Iniciar nueva sesión en el Paso 1
                        userSessions.set(jid, {
                            step: 'WAITING_NAME',
                            telefono: '+' + phoneClean,
                            nombre: null,
                            correo: null,
                            servicio: null,
                            updatedAt: Date.now()
                        });

                        const bienvenidaMsg = 
                            `¡Hola! 👋 Muchas gracias por tu interés en nuestro anuncio de Facebook.\n\n` +
                            `Para que un asesor especializado te brinde la mejor atención personalizada, por favor respóndeme:\n\n` +
                            `👉 *¿Cuál es tu nombre y apellido?*`;

                        await sock.sendMessage(jid, { text: bienvenidaMsg });
                        continue;
                    }

                    // Si no tiene sesión activa, ignorar o no intervenir
                    if (!session) continue;

                    session.updatedAt = Date.now();

                    // ==========================================================
                    // PASO 2: RECIBIR NOMBRE -> SOLICITAR CORREO
                    // ==========================================================
                    if (session.step === 'WAITING_NAME') {
                        // Guardar nombre
                        session.nombre = text;
                        session.step = 'WAITING_EMAIL';
                        userSessions.set(jid, session);

                        console.log(`👤 [Nombre Recibido] +${phoneClean}: ${session.nombre}`);

                        const pedirCorreoMsg = 
                            `¡Mucho gusto, *${session.nombre}*! 😊\n\n` +
                            `👉 *Por favor compártenos tu correo electrónico:*`;

                        await sock.sendMessage(jid, { text: pedirCorreoMsg });
                        continue;
                    }

                    // ==========================================================
                    // PASO 3: RECIBIR CORREO -> SOLICITAR SERVICIO DE INTERÉS
                    // ==========================================================
                    if (session.step === 'WAITING_EMAIL') {
                        // Validación básica de formato de correo
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(text)) {
                            await sock.sendMessage(jid, {
                                text: `Por favor ingresa un correo electrónico válido (por ejemplo: tu_nombre@correo.com) 📧:`
                            });
                            continue;
                        }

                        session.correo = text.toLowerCase();
                        session.step = 'WAITING_SERVICE';
                        userSessions.set(jid, session);

                        console.log(`📧 [Correo Recibido] +${phoneClean}: ${session.correo}`);

                        const pedirServicioMsg = 
                            `¡Excelente! 📋 Ya casi terminamos.\n\n` +
                            `👉 *¿Qué servicio o propiedad te interesa conocer en detalle?*\n` +
                            `(Por ejemplo: Comprar departamento, terreno/lote, alquiler, financiamiento bancario, etc.)`;

                        await sock.sendMessage(jid, { text: pedirServicioMsg });
                        continue;
                    }

                    // ==========================================================
                    // PASO 4: RECIBIR SERVICIO -> GUARDAR EN CRM Y ALERTAR
                    // ==========================================================
                    if (session.step === 'WAITING_SERVICE') {
                        session.servicio = text;
                        session.step = 'COMPLETED';

                        console.log(`🏡 [Servicio Recibido] +${phoneClean}: ${session.servicio}`);
                        console.log(`💾 Guardando lead en base de datos CRM...`);

                        let leadId = null;
                        try {
                            const resGuardado = await guardarLead(session);
                            leadId = resGuardado.id;
                            console.log(`✅ [CRM Storage: ${resGuardado.storage}] Lead #${leadId} guardado exitosamente.`);
                        } catch (saveErr) {
                            console.error('❌ [Error Guardando Lead]:', saveErr.message);
                        }

                        // A) Confirmación al Cliente
                        const confirmacionCliente = 
                            `¡Perfecto, *${session.nombre}*! 🎉 Hemos registrado tus datos con éxito.\n\n` +
                            `Uno de nuestros asesores especializados se comunicará contigo por este mismo chat en breve para coordinar todos los detalles. 🤝\n\n` +
                            `¡Que tengas un excelente día! ✨`;

                        await sock.sendMessage(jid, { text: confirmacionCliente });

                        // B) Alerta Inmediata al Equipo Comercial de Ventas
                        if (SALES_PHONE) {
                            const salesJid = `${SALES_PHONE}@s.whatsapp.net`;
                            const fechaActual = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });

                            const alertaVentas = 
                                `🚨 *¡NUEVO PROSPECTO CAPTURADO (FACEBOOK ADS)!* 🚨\n\n` +
                                `🆔 *Ficha CRM:* #${leadId || 'S/N'}\n` +
                                `👤 *Nombre:* ${session.nombre}\n` +
                                `📱 *WhatsApp:* ${session.telefono}\n` +
                                `📧 *Correo:* ${session.correo}\n` +
                                `🏡 *Interés:* ${session.servicio}\n` +
                                `🕒 *Fecha:* ${fechaActual}\n\n` +
                                `👉 *Continuar trato en 1 clic:* https://wa.me/${phoneClean}`;

                            try {
                                await sock.sendMessage(salesJid, { text: alertaVentas });
                                console.log(`📢 [Alerta Comercial] Notificación enviada al equipo de ventas (+${SALES_PHONE}).`);
                            } catch (alertErr) {
                                console.error('⚠️ [Error Enviando Alerta a Ventas]:', alertErr.message);
                            }
                        }

                        // Limpiar sesión del usuario para futuras consultas
                        userSessions.delete(jid);
                        continue;
                    }

                } catch (msgErr) {
                    console.error('💥 [Error Procesando Mensaje]:', msgErr?.message || msgErr);
                }
            }
        });

    } catch (bootErr) {
        console.error('💥 [Boot Error]:', bootErr?.message || bootErr);
        setTimeout(() => startBot(), 5000);
    }
}

// Iniciar el bot si se ejecuta como proceso principal
if (require.main === module) {
    startBot();
}

module.exports = {
    startBot,
    userSessions,
    AUTH_DIR
};
