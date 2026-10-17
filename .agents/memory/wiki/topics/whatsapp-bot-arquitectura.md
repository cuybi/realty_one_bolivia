---
title: "Arquitectura Integral del Bot de WhatsApp e Inteligencia Artificial"
type: topic
tags: [arquitectura, chatbot, whatsapp, aiAgent, gemini, crm, state-machine]
created: 2026-09-04
updated: 2026-10-16
aliases: ["Arquitectura WhatsApp Bot", "Chatbot IA ROG"]
---

# Arquitectura Integral del Bot de WhatsApp e Inteligencia Artificial

Documentación técnica del pipeline de mensajería, calificación de prospectos y atención automatizada de [[realty-one-group-bolivia]].

## Flujo de Datos Híbrido en Producción

```
[Prospecto en WhatsApp]
           │
           ▼
[Meta Cloud API / Baileys WebSocket]
           │
           ▼ (Webhook / Evento de Mensaje)
[SiteGround (webhook.php) / Render (server.js)]
           │
           ▼
[aiAgent.js (Google Gemini 2.0 Flash Lite & Enrutador Híbrido)]
           │
     ┌─────┴──────────────────────────────────────────────────────┐
     ▼                                                            ▼
[Canal Pauta CTWA / Campañas]                      [Canal Orgánico: Atención al Cliente]
- Detección de `externalAdReply`                   - [[customer-service-state-machine]]
- Ficha inmediata de Terreno G77 (Bs 16.8M)        - 5 Estados (Saludo, Captura, Visita,
- Ficha de Lote Mar Adentro ($112.5k USD)            Recordatorio, Despedida Oficial)
- Ficha de Depto 4D ($120k USD)                    - Cero menús robóticos ni AI slop
- Asesoría de crédito, permutas y expensas         - Frase de cierre obligatoria
     │                                                            │
     └──────────────────────────────┬─────────────────────────────┘
                                    ▼
                     [Calificación & Lead Scoring]
                     - Perfilado (🔥 Potencial, ⚡ Indeciso, ❄️ Pasivo)
                     - Asignación inteligente a e-Realtors
                                    │
                                    ▼
             [Sincronización Inmediata con [[ingreso-leads-crm]]]
             - leads.json / leads.csv / save_leads_sync.php
             - Visualización en panel web y app Streamlit
                                    │
                                    ▼
                [Envío de Respuesta al Prospecto en WhatsApp]
```

## Componentes del Backend y Servicios
1. **`backend/server.js`:** Servidor Express central, CORS, rutas API y endpoints para webhook, pairing code y CMS.
2. **`backend/services/aiAgent.js`:** Cerebro de IA con enrutamiento híbrido: respuestas especializadas de campañas + máquina de atención al cliente de 5 estados.
3. **`backend/services/leadClassifier.js`:** Motor de scoring y priorización comercial con desglose temporal.
4. **`backend/services/marketingHub.js`:** Suite de envíos masivos con retardos anti-baneo (8 a 22 seg), soporte multimedia (imágenes, PDF, audios PTT) y embudos en 1 clic.
5. **`backend/whatsapp_baileys.js`:** Conector WebSocket multi-dispositivo con soporte de código de emparejamiento de 8 dígitos y QR.

## Enlaces Relacionados
- [[customer-service-state-machine]]
- [[ingreso-leads-crm]]
- [[produccion-vs-local]]
- [[meta-cloud-api]]
- [[render]]
- [[siteground]]
- [[realty-one-group-bolivia]]
