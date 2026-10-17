---
title: "Realty ONE Group Bolivia"
type: entity
tags: [inmobiliaria, franquicia, bolivia, crm, frontend]
created: 2026-08-27
updated: 2026-10-16
aliases: ["Realty ONE", "ROG Bolivia"]
---

# Realty ONE Group Bolivia

Plataforma integral inmobiliaria, CRM de e-Realtors, portal web de lujo y chatbot de captación para Bolivia.

## Atributos Principales
- **Zonas de Operación:** Santa Cruz de la Sierra, Urubó, Equipetrol, Sirari, Las Palmas, Zona Norte, Parque Industrial G77.
- **Identidad de Marca:** Estética Gold & Black Luxury (`#D4AF37` dorado, `#0d0d0d` fondo oscuro).
- **Cultura 6Cs:** Coolure, Connect, Coaching, Community, Commission, Care.
- **Campañas Activas de Facebook Ads:**
  - *Terreno Industrial G77:* 7.000 m², Bs 16.800.000.
  - *Lote Mar Adentro (Urubó):* 450 m², $112,500 USD.
  - *Departamento 4D Familiar:* 119 m², $120,000 USD.

## Relaciones
- Portal web público gestionado en [[portal-inmobiliario-frontend]] bajo lineamientos de [[portal-web-modernization]].
- Implementa [[whatsapp-bot-arquitectura]] con atención conversacional vía [[customer-service-state-machine]].
- Panel de control y seguimiento de prospectos en [[ingreso-leads-crm]].
- Desplegado en [[render]] (backend API/IA) y [[siteground]] (frontend/webhooks).
- Utiliza [[meta-cloud-api]] para mensajería oficial en producción.
