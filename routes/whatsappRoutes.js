/**
 * Rutas y Webhook para WhatsApp Cloud API, Simulador y Gestión de Leads CRM
 */

const express = require('express');
const router = express.Router();
const aiAgent = require('../services/aiAgent');
const whatsappService = require('../services/whatsappService');
const leadClassifier = require('../services/leadClassifier');
const excelService = require('../services/excelService');
const campaignService = require('../services/campaignService');

// Control anti-repetición en memoria para Node.js
const processedMessageIds = new Set();

/**
 * 1. Verificación del Webhook de WhatsApp (Handshake requerido por Meta)
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'realty_one_whatsapp_verify_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Webhook] ¡Webhook verificado con éxito por Meta!');
    return res.status(200).send(challenge);
  } else {
    console.warn('[WhatsApp Webhook] Intento de verificación fallido o token incorrecto.');
    return res.sendStatus(403);
  }
});

/**
 * 2. Recepción de Mensajes en Tiempo Real (WhatsApp Cloud API Webhook)
 */
router.post('/webhook', async (req, res) => {
  // Responder inmediatamente a Meta para que no reintente
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          const messages = value?.messages;

          if (messages && messages.length > 0) {
            const message = messages[0];
            const msgId = message.id;

            // Evitar procesar mensajes duplicados de reintentos
            if (msgId && processedMessageIds.has(msgId)) {
              console.log(`[WhatsApp Webhook] Mensaje duplicado ignorado: ${msgId}`);
              continue;
            }
            if (msgId) {
              processedMessageIds.add(msgId);
              if (processedMessageIds.size > 200) {
                const first = processedMessageIds.values().next().value;
                processedMessageIds.delete(first);
              }
            }

            const senderPhone = message.from;
            let incomingText = '';

            if (message.type === 'text') {
              incomingText = message.text?.body;
            } else if (message.type === 'interactive') {
              incomingText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title;
            } else if (message.type === 'button') {
              incomingText = message.button?.text;
            } else {
              incomingText = 'Hola';
            }

            console.log(`[WhatsApp Inbound] De: ${senderPhone} | Mensaje: "${incomingText}"`);

            const referralData = message.referral || null;
            const botReply = await aiAgent.processUserMessage(senderPhone, incomingText, referralData);
            await whatsappService.sendTextMessage(senderPhone, botReply);
          }
        }
      }
    }
  } catch (error) {
    console.error('[WhatsApp Webhook Error]:', error);
  }
});

/**
 * 3. Endpoint de Simulación Web en Vivo (Probar flujo completo)
 */
router.post('/simular', async (req, res) => {
  try {
    const { mensaje, usuarioId = 'test-user-123', referral = null } = req.body;
    if (!mensaje) {
      return res.status(400).json({ error: 'El campo mensaje es obligatorio' });
    }

    const respuesta = await aiAgent.processUserMessage(usuarioId, mensaje, referral);
    const leads = leadClassifier.getLeads();
    const currentLead = leads.find(l => l.numero_celular.includes(usuarioId) || l.id === usuarioId) || null;

    res.json({
      exito: true,
      mensajeUsuario: mensaje,
      respuestaBot: respuesta,
      leadActualizado: currentLead,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[WhatsApp Simulator Error]:', error);
    res.status(500).json({ error: 'Error procesando simulación del bot' });
  }
});

/**
 * 4. Directorio de e-Realtors
 */
router.get('/e-realtors', (req, res) => {
  res.json(leadClassifier.getERealtors());
});

/**
 * 5. Endpoints de Campañas Publicitarias
 */
router.get('/campaigns', (req, res) => {
  const campaigns = campaignService.getCampaigns();
  res.json(campaigns);
});

router.post('/campaigns', (req, res) => {
  try {
    const campaign = req.body;
    if (!campaign.id || !campaign.titulo_campana) {
      return res.status(400).json({ error: 'Se requiere id y titulo_campana' });
    }
    const saved = campaignService.upsertCampaign(campaign);
    res.json({ exito: true, campaign: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6. Endpoint de Estado y Configuración
 */
router.get('/status', (req, res) => {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  const hasWhatsApp = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const activeCampaigns = campaignService.getCampaigns().filter(c => c.activo).length;

  res.json({
    estado: 'activo',
    servicio: 'Chatbot WhatsApp Business Realty ONE Bolivia',
    version: '2.0.0',
    pipeline: 'One Comsys ➔ Publicación ➔ Impulsar ➔ Prospectos ➔ IA Responde ➔ Formulario ➔ Prospectos Potenciales ➔ Asignaciones CRM IA ➔ Atención e-Realtors',
    eRealtorsDisponibles: leadClassifier.getERealtors().length,
    campanasActivas: activeCampaigns,
    geminiConfigurado: hasGemini,
    whatsAppCloudConfigurado: hasWhatsApp,
    webhookUrl: '/api/whatsapp/webhook'
  });
});

/**
 * 7. Endpoints de CRM de Leads, Clasificación y Exportación
 */
router.get('/leads', (req, res) => {
  try {
    let leads = leadClassifier.getLeads();
    const { prioridad, search, anio, mes, dia, operacion, e_realtor, etapa } = req.query;

    if (prioridad && prioridad !== 'TODAS') {
      leads = leads.filter(l => l.prioridad === prioridad.toUpperCase());
    }

    if (e_realtor && e_realtor !== 'TODOS') {
      leads = leads.filter(l => l.e_realtor_id === e_realtor || (l.e_realtor_asignado || '').toLowerCase().includes(e_realtor.toLowerCase()));
    }

    if (etapa && etapa !== 'TODAS') {
      leads = leads.filter(l => l.etapa_embudo === etapa);
    }

    if (anio) {
      leads = leads.filter(l => String(l.anio) === String(anio));
    }

    if (mes) {
      leads = leads.filter(l => String(l.mes).toLowerCase() === String(mes).toLowerCase() || String(l.mes_numero) === String(mes));
    }

    if (dia) {
      leads = leads.filter(l => String(l.dia) === String(dia));
    }

    if (operacion) {
      const op = operacion.toLowerCase();
      leads = leads.filter(l => (l.tipo_interes || '').toLowerCase().includes(op));
    }

    if (search) {
      const s = search.toLowerCase();
      leads = leads.filter(l => 
        (l.cliente_nombre || '').toLowerCase().includes(s) ||
        (l.numero_celular || '').includes(s) ||
        (l.email || '').toLowerCase().includes(s) ||
        (l.zona_interes || '').toLowerCase().includes(s) ||
        (l.e_realtor_asignado || '').toLowerCase().includes(s) ||
        (l.ultimo_mensaje || '').toLowerCase().includes(s) ||
        (l.resumen || '').toLowerCase().includes(s)
      );
    }

    // Estadísticas
    const allLeads = leadClassifier.getLeads();
    const stats = {
      total: allLeads.length,
      potencial: allLeads.filter(l => l.prioridad === 'POTENCIAL').length,
      indeciso: allLeads.filter(l => l.prioridad === 'INDECISO').length,
      pasivo: allLeads.filter(l => l.prioridad === 'PASIVO').length,
      propietario: allLeads.filter(l => l.prioridad === 'PROPIETARIO').length,
      asignadosERealtor: allLeads.filter(l => l.e_realtor_asignado).length,
      visitasAgendadas: allLeads.filter(l => l.horario_visita_solicitado).length
    };

    res.json({
      exito: true,
      stats,
      totalFiltrados: leads.length,
      leads
    });
  } catch (error) {
    console.error('Error al obtener leads:', error);
    res.status(500).json({ error: 'Error al obtener leads' });
  }
});

// Descargar Reporte en Excel (.xlsx / .xls)
router.get('/leads/export/excel', (req, res) => {
  try {
    let leads = leadClassifier.getLeads();
    const { prioridad, anio, mes, dia, e_realtor } = req.query;

    if (prioridad && prioridad !== 'TODAS') {
      leads = leads.filter(l => l.prioridad === prioridad.toUpperCase());
    }
    if (e_realtor && e_realtor !== 'TODOS') {
      leads = leads.filter(l => l.e_realtor_id === e_realtor);
    }
    if (anio) leads = leads.filter(l => String(l.anio) === String(anio));
    if (mes) leads = leads.filter(l => String(l.mes).toLowerCase() === String(mes).toLowerCase() || String(l.mes_numero) === String(mes));
    if (dia) leads = leads.filter(l => String(l.dia) === String(dia));

    const xml = excelService.generateExcelXML(leads);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `RealtyONE_Leads_eRealtors_${dateStr}.xls`;

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    res.status(500).send('Error generando archivo Excel');
  }
});

// Descargar Reporte en CSV con UTF-8 BOM
router.get('/leads/export/csv', (req, res) => {
  try {
    let leads = leadClassifier.getLeads();
    const { prioridad, anio, mes, dia, e_realtor } = req.query;

    if (prioridad && prioridad !== 'TODAS') {
      leads = leads.filter(l => l.prioridad === prioridad.toUpperCase());
    }
    if (e_realtor && e_realtor !== 'TODOS') {
      leads = leads.filter(l => l.e_realtor_id === e_realtor);
    }
    if (anio) leads = leads.filter(l => String(l.anio) === String(anio));
    if (mes) leads = leads.filter(l => String(l.mes).toLowerCase() === String(mes).toLowerCase() || String(l.mes_numero) === String(mes));
    if (dia) leads = leads.filter(l => String(l.dia) === String(dia));

    const csv = excelService.generateCSV(leads);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `RealtyONE_Leads_eRealtors_${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exportando a CSV:', error);
    res.status(500).send('Error generando archivo CSV');
  }
});

// Actualizar estado comercial, reasignar e-Realtor o notas de un lead
router.put('/leads/:id', (req, res) => {
  try {
    const updated = leadClassifier.updateLeadStatus(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }
    res.json({ exito: true, lead: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar lista completa de leads
router.post('/leads/sync', (req, res) => {
  try {
    const list = req.body.all_leads || req.body.leads || req.body;
    const synced = leadClassifier.syncLeads(list);
    res.json({ exito: true, total: synced.length, leads: synced });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vaciar todos los leads
router.delete('/leads', (req, res) => {
  try {
    leadClassifier.clearAllLeads();
    res.json({ exito: true, total: 0, message: 'Todos los prospectos eliminados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar un lead (por ID o teléfono)
router.delete('/leads/:id', (req, res) => {
  try {
    leadClassifier.deleteLead(req.params.id);
    res.json({ exito: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

