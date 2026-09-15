/**
 * marketingRoutes.js — Rutas API para la Suite de Marketing y Automatización
 * Realty ONE Group Bolivia
 */

const express = require('express');
const router = express.Router();
const marketingHub = require('../services/marketingHub');
const leadClassifier = require('../services/leadClassifier');

const ADMIN_KEY = process.env.ADMIN_KEY || 'ONE2026';

// Middleware de seguridad simple
function requireAuth(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (key === ADMIN_KEY) return next();

  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Basic ')) {
    try {
      const [u, ...p] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':');
      if (p.join(':') === ADMIN_KEY || (u === 'admin' && p.join(':') === 'ONE2026')) {
        return next();
      }
    } catch (e) {}
  }
  return res.status(401).json({ error: 'No autorizado: se requiere x-admin-key' });
}

router.use(requireAuth);

// ─── 1. CAMPAÑAS EN MASA (BROADCAST) ───────────────────────────────────────
router.post('/broadcast', async (req, res) => {
  try {
    const { nombreCampana, filtros = {}, leadIds = [], plantillaMensaje, media, delayMin, delayMax } = req.body;

    if (!plantillaMensaje) {
      return res.status(400).json({ error: 'La plantilla de mensaje es obligatoria' });
    }

    let destinatarios = [];
    const allLeads = await leadClassifier.getLeadsAsync();

    if (Array.isArray(leadIds) && leadIds.length > 0) {
      destinatarios = allLeads.filter(l => leadIds.includes(l.id));
    } else {
      // Filtrar leads
      destinatarios = allLeads.filter(l => {
        if (filtros.prioridad && filtros.prioridad !== 'TODAS' && (l.prioridad || '').toUpperCase() !== filtros.prioridad.toUpperCase()) {
          return false;
        }
        if (filtros.etapa && filtros.etapa !== 'TODAS' && (l.etapa_embudo || '').toUpperCase() !== filtros.etapa.toUpperCase()) {
          return false;
        }
        if (filtros.etiqueta && Array.isArray(l.etiquetas) && !l.etiquetas.includes(filtros.etiqueta)) {
          return false;
        }
        return true;
      });
    }

    if (destinatarios.length === 0) {
      return res.status(400).json({ error: 'No se encontraron destinatarios con los filtros especificados' });
    }

    const resultado = await marketingHub.startBroadcastCampaign({
      nombreCampana,
      destinatarios,
      plantillaMensaje,
      media,
      delayMinSeg: Number(delayMin) || 4,
      delayMaxSeg: Number(delayMax) || 8
    });

    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/broadcast/status', (req, res) => {
  res.json(marketingHub.getBroadcastStatus() || { enProgreso: false });
});

router.get('/broadcast/history', (req, res) => {
  res.json(marketingHub.getBroadcastHistory());
});

// ─── 2. PUBLICACIÓN DE ESTADOS (WHATSAPP STATUS) ───────────────────────────
router.post('/status', async (req, res) => {
  try {
    const { text, mediaUrl, mediaType } = req.body;
    if (!text && !mediaUrl) {
      return res.status(400).json({ error: 'Texto o archivo multimedia requerido para el estado' });
    }
    const result = await marketingHub.publishWhatsAppStatus({ text, mediaUrl, mediaType });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 3. REGLAS DE RESPUESTA AUTOMÁTICA & CHATBOT ───────────────────────────
router.get('/rules', (req, res) => {
  res.json(marketingHub.getAutoRules());
});

router.post('/rules', (req, res) => {
  try {
    const { rules } = req.body;
    if (!Array.isArray(rules)) return res.status(400).json({ error: 'Se requiere un array de reglas' });
    marketingHub.saveAutoRules(rules);
    res.json({ exito: true, rules });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 4. AGENDAMIENTO DE MENSAJES (SCHEDULER) ──────────────────────────────
router.get('/scheduled', (req, res) => {
  res.json(marketingHub.getScheduledMessages());
});

router.post('/scheduled', (req, res) => {
  try {
    const { telefono, nombre, mensaje, fecha_programada, media } = req.body;
    if (!telefono || !mensaje || !fecha_programada) {
      return res.status(400).json({ error: 'Teléfono, mensaje y fecha_programada son obligatorios' });
    }
    const nuevo = marketingHub.addScheduledMessage({ telefono, nombre, mensaje, fecha_programada, media });
    res.json({ exito: true, mensaje: nuevo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/scheduled/:id', (req, res) => {
  marketingHub.cancelScheduledMessage(req.params.id);
  res.json({ exito: true });
});

// ─── 5. EMBUDOS 1-CLIC ────────────────────────────────────────────────────
router.post('/funnel/apply', async (req, res) => {
  try {
    const { leadIds = [], funnelKey, enviarMensaje = false } = req.body;
    if (!funnelKey) return res.status(400).json({ error: 'funnelKey es requerido' });
    const result = await marketingHub.applyFunnelToOneClick(leadIds, funnelKey, enviarMensaje);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 6. ETIQUETAS Y MARCACIONES ────────────────────────────────────────────
router.post('/leads/tag', async (req, res) => {
  try {
    const { leadId, tag } = req.body;
    if (!leadId || !tag) return res.status(400).json({ error: 'leadId y tag son obligatorios' });
    const result = await marketingHub.toggleLeadTag(leadId, tag);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── 7. EXPORTACIÓN A EXCEL DE CAMPAÑA ─────────────────────────────────────
router.get('/export/campaign/:id', (req, res) => {
  try {
    const xml = marketingHub.exportCampaignExcelXML(req.params.id);
    if (!xml) return res.status(404).send('Campaña no encontrada');

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="RealtyONE_Difusion_${dateStr}.xls"`);
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generando archivo Excel');
  }
});

module.exports = router;
