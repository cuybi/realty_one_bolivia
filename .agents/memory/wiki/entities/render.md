---
title: "Render Cloud Platform"
type: entity
tags: [hosting, cloud, nodejs, deployment]
created: 2026-09-04
updated: 2026-09-04
aliases: ["Render", "Render.com"]
---

# Render Cloud Platform

Plataforma de infraestructura en la nube donde se aloja el servicio web del backend de [[realty-one-group-bolivia]].

## Configuración del Servicio (`render.yaml`)
- **Servicio:** `realty-one-whatsapp-bot`
- **Entorno:** `node`
- **Plan:** `free`
- **Región:** `oregon`
- **Build Command:** `npm install && cd backend && npm install`
- **Start Command:** `node backend/server.js` (corregido desde `whatsapp_baileys.js`)
- **Health Check Path:** `/api/health`

## Consideraciones Clave
- En el plan Free, el sistema de archivos es efímero. Por esta razón, el bot no utiliza Baileys/QR en la nube (ver [[produccion-vs-local]]).
- Expone endpoints REST y el webhook `/api/whatsapp/webhook` receptor de [[meta-cloud-api]].

## Enlaces Relacionados
- [[whatsapp-bot-arquitectura]]
- [[siteground]]
