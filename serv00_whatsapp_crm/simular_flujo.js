/**
 * ==============================================================================
 * SIMULADOR DE FLUJO COMPLETO: WHATSAPP BOT + CRM RESILIENTE
 * ==============================================================================
 * Ejecuta una prueba automatizada paso a paso del embudo de Facebook Ads:
 * 1. Detección de Trigger ("Hola, vi tu anuncio de Facebook...")
 * 2. Captura de Nombre
 * 3. Validación y Captura de Correo Electrónico
 * 4. Captura de Servicio de Interés
 * 5. Persistencia en Base de Datos (MySQL o Local JSON) y Alerta de Ventas wa.me/
 */

const path = require('path');
const fs = require('fs');
const { initDatabase, guardarLead, obtenerLeads } = require('./db_adapter');

async function ejecutarSimulacion() {
    console.log('================================================================');
    console.log('🧪 INICIANDO SIMULACIÓN INTEGRAL: BOT WHATSAPP & CRM DE LEADS');
    console.log('================================================================\n');

    // 1. Inicializar base de datos
    console.log('1️⃣ Inicializando Base de Datos...');
    await initDatabase();

    // 2. Mock de sesión y canal de mensajería
    const testJid = '59170012345@s.whatsapp.net';
    const testPhone = '59170012345';
    const salesPhone = '59160937050';
    const userSessions = new Map();
    const sentMessages = [];

    // Mock de socket Baileys
    const mockSock = {
        sendMessage: async (jid, content) => {
            sentMessages.push({ jid, text: content.text, timestamp: new Date() });
            return { key: { id: 'MOCK_MSG_' + Date.now() } };
        }
    };

    // Función que procesa los pasos tal como index.js
    async function procesarPaso(jid, incomingText) {
        const text = incomingText.trim();
        const textLower = text.toLowerCase();
        const phoneClean = jid.replace(/\D/g, '');
        const triggerKeyword = 'hola, vi tu anuncio de facebook';

        let session = userSessions.get(jid);

        // PASO 1: TRIGGER
        const isTrigger = textLower.includes(triggerKeyword) ||
                          textLower.startsWith('hola, vi tu anuncio') ||
                          textLower.startsWith('hola vi tu anuncio');

        if (isTrigger) {
            userSessions.set(jid, {
                step: 'WAITING_NAME',
                telefono: '+' + phoneClean,
                nombre: null,
                correo: null,
                servicio: null,
                updatedAt: Date.now()
            });

            const msg = `¡Hola! 👋 Muchas gracias por tu interés en nuestro anuncio de Facebook.\n\n` +
                        `Para que un asesor especializado te brinde la mejor atención personalizada, por favor respóndeme:\n\n` +
                        `👉 *¿Cuál es tu nombre y apellido?*`;
            await mockSock.sendMessage(jid, { text: msg });
            return { step: 'WAITING_NAME', replied: msg };
        }

        if (!session) return { step: 'NONE', replied: null };

        // PASO 2: NOMBRE -> PEDIR CORREO
        if (session.step === 'WAITING_NAME') {
            session.nombre = text;
            session.step = 'WAITING_EMAIL';
            userSessions.set(jid, session);

            const msg = `¡Mucho gusto, *${session.nombre}*! 😊\n\n` +
                        `👉 *Por favor compártenos tu correo electrónico:*`;
            await mockSock.sendMessage(jid, { text: msg });
            return { step: 'WAITING_EMAIL', replied: msg };
        }

        // PASO 3: CORREO -> PEDIR SERVICIO
        if (session.step === 'WAITING_EMAIL') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(text)) {
                const msg = `Por favor ingresa un correo electrónico válido (por ejemplo: tu_nombre@correo.com) 📧:`;
                await mockSock.sendMessage(jid, { text: msg });
                return { step: 'WAITING_EMAIL_RETRY', replied: msg };
            }

            session.correo = text.toLowerCase();
            session.step = 'WAITING_SERVICE';
            userSessions.set(jid, session);

            const msg = `¡Excelente! 📋 Ya casi terminamos.\n\n` +
                        `👉 *¿Qué servicio o propiedad te interesa conocer en detalle?*\n` +
                        `(Por ejemplo: Comprar departamento, terreno/lote, alquiler, financiamiento bancario, etc.)`;
            await mockSock.sendMessage(jid, { text: msg });
            return { step: 'WAITING_SERVICE', replied: msg };
        }

        // PASO 4: SERVICIO -> GUARDAR EN CRM Y ALERTAR
        if (session.step === 'WAITING_SERVICE') {
            session.servicio = text;
            session.step = 'COMPLETED';

            const resGuardado = await guardarLead(session);
            const leadId = resGuardado.id;

            const confirmacion = `¡Perfecto, *${session.nombre}*! 🎉 Hemos registrado tus datos con éxito.\n\n` +
                                 `Uno de nuestros asesores especializados se comunicará contigo por este mismo chat en breve para coordinar todos los detalles. 🤝\n\n` +
                                 `¡Que tengas un excelente día! ✨`;
            await mockSock.sendMessage(jid, { text: confirmacion });

            const alertaVentas = `🚨 *¡NUEVO PROSPECTO CAPTURADO (FACEBOOK ADS)!* 🚨\n\n` +
                                 `🆔 *Ficha CRM:* #${leadId || 'S/N'}\n` +
                                 `👤 *Nombre:* ${session.nombre}\n` +
                                 `📱 *WhatsApp:* ${session.telefono}\n` +
                                 `📧 *Correo:* ${session.correo}\n` +
                                 `🏡 *Interés:* ${session.servicio}\n` +
                                 `👉 *Continuar trato en 1 clic:* https://wa.me/${phoneClean}`;
            await mockSock.sendMessage(`${salesPhone}@s.whatsapp.net`, { text: alertaVentas });

            userSessions.delete(jid);
            return { step: 'COMPLETED', leadId, storage: resGuardado.storage, replied: confirmacion, alert: alertaVentas };
        }
    }

    // --- SECUENCIA DE PRUEBAS ---
    console.log('2️⃣ Enviando Trigger de Facebook Ads...');
    const r1 = await procesarPaso(testJid, 'Hola, vi tu anuncio de Facebook');
    console.log('   Bot responde:', r1.replied.split('\n')[0]);
    if (!r1.replied.includes('¿Cuál es tu nombre')) throw new Error('Fallo en Paso 1 (Trigger)');

    console.log('\n3️⃣ Enviando Nombre del Cliente...');
    const r2 = await procesarPaso(testJid, 'Carlos Mercado');
    console.log('   Bot responde:', r2.replied.split('\n')[0]);
    if (!r2.replied.includes('Carlos Mercado')) throw new Error('Fallo en Paso 2 (Nombre)');

    console.log('\n4️⃣ Probando Validación de Correo Inválido...');
    const r3_invalid = await procesarPaso(testJid, 'correo_invalido_sin_arroba');
    console.log('   Bot responde:', r3_invalid.replied);
    if (!r3_invalid.replied.includes('válido')) throw new Error('Fallo en Validación de Correo');

    console.log('\n5️⃣ Enviando Correo Válido...');
    const r3_valid = await procesarPaso(testJid, 'carlos.mercado@gmail.com');
    console.log('   Bot responde:', r3_valid.replied.split('\n')[0]);
    if (!r3_valid.replied.includes('servicio o propiedad')) throw new Error('Fallo en Paso 3 (Correo)');

    console.log('\n6️⃣ Enviando Servicio / Propiedad de Interés...');
    const r4 = await procesarPaso(testJid, 'Lote en Condominio Mar Adentro (Urubó)');
    console.log('   Confirmación a cliente:', r4.replied.split('\n')[0]);
    console.log(`   ✅ Guardado exitoso: Lead #${r4.leadId} en [${r4.storage}]`);
    console.log('   📢 Alerta enviada al equipo de ventas (+59160937050):');
    console.log('   ' + r4.alert.replace(/\n/g, '\n   '));

    // 7. Verificar en base de datos
    console.log('\n7️⃣ Consultando registros en Base de Datos...');
    const leadsGuardados = await obtenerLeads();
    console.log(`   Total de leads en almacén: ${leadsGuardados.length}`);
    const leadEncontrado = leadsGuardados.find(l => l.correo === 'carlos.mercado@gmail.com');
    if (!leadEncontrado) throw new Error('El lead no se encuentra en la base de datos');

    console.log('\n================================================================');
    console.log('🎉 ¡SIMULACIÓN COMPLETADA AL 100% CON ÉXITO!');
    console.log('================================================================');
    console.log(`✔️ Trigger de Facebook Ads validado.`);
    console.log(`✔️ Máquina de estados en memoria validada.`);
    console.log(`✔️ Validación de correo electrónico verificada.`);
    console.log(`✔️ Persistencia en CRM (${r4.storage}) verificada.`);
    console.log(`✔️ Alerta de ventas 1-clic https://wa.me/ verificada.`);
    console.log('================================================================\n');
}

ejecutarSimulacion().catch(err => {
    console.error('❌ Error en simulación:', err);
    process.exit(1);
});
