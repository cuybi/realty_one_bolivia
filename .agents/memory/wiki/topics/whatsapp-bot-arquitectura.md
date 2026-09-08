---
title: "Arquitectura Integral del Bot de WhatsApp e Inteligencia Artificial"
type: topic
tags: [arquitectura, chatbot, whatsapp, aiAgent, gemini, crm]
created: 2026-09-04
updated: 2026-09-04
aliases: ["Arquitectura WhatsApp Bot"]
---

# Arquitectura Integral del Bot de WhatsApp e Inteligencia Artificial

Documentación técnica del pipeline de mensajería, calificación de prospectos y atención automatizada de [[realty-one-group-bolivia]].

## Flujo de Datos en Producción
```
[Prospecto en WhatsApp]
           │
           ▼
[Meta Cloud API (Graph API)]
           │
           ▼ (Webhook POST)
[SiteGround (webhook.php)] ──► Guarda leads.json / leads.csv
           │
           ▼ (Forward POST /api/whatsapp/webhook)
[Render (server.js)]
           │
           ▼
[aiAgent.js (Google Gemini 2.0 Flash Lite)]
           │
     ┌─────┴───────────────────────┐
     ▼                             ▼
[Detección Campaña Facebook]  [Consultas Generales]
- Terreno Industrial G77      - Catálogo de inmuebles
- Lote Mar Adentro            - Filtros por zona/precio
     │                             │
     └─────────────┬───────────────┘
                   ▼
[leadClassifier.js & campaignService.js]
- Captura de Nombre, Teléfono, Interés
- Asignación inteligente a e-Realtor
                   │
                   ▼
[whatsappService.js] ──► Meta Cloud API ──► [Respuesta al Prospecto]
```

## Componentes del Backend
1. **`backend/server.js`:** Punto de entrada Express en producción, configuración de CORS, rutas API y recepción de webhooks.
2. **`backend/routes/whatsappRoutes.js`:** Endpoints de webhook (`GET /webhook` para verificación, `POST /webhook` para mensajes entrantes), leads y exportación.
3. **`backend/services/aiAgent.js`:** Motor conversacional con prompt del sistema para asesores inmobiliarios en Santa Cruz de la Sierra. Utiliza el modelo `gemini-2.0-flash-lite`.
4. **`backend/services/whatsappService.js`:** Cliente HTTP para emitir mensajes de texto interactivos o normales a través de la API oficial de Meta.
5. **`backend/services/leadClassifier.js`:** Clasificación en 4 categorías: 🔥 Potencial, ⚡ Indeciso, ❄️ Pasivo, 💼 Propietario.

## Enlaces Relacionados
- [[produccion-vs-local]]
- [[meta-cloud-api]]
- [[render]]
- [[siteground]]
