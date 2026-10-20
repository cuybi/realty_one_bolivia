# Wiki Index — Realty ONE Group Bolivia

> **Última Actualización:** 2026-10-18T18:25:00-04:00 | **Total de Páginas:** 13

## Entities
- [[realty-one-group-bolivia]]: Plataforma web inmobiliaria, CRM de e-Realtors, portal web de lujo y chatbot para Santa Cruz (Bolivia).
- [[ingreso-leads-crm]]: Ecosistema de gestión de prospectos: panel web en tiempo real, extensión de Chrome y suite de analítica Streamlit.
- [[meta-cloud-api]]: API oficial de WhatsApp Business (Graph API) utilizada para producción.
- [[render]]: Plataforma cloud que aloja el servicio Node.js `server.js` y el motor de IA.
- [[siteground]]: Servidor web de producción que aloja el portal frontend y `webhook.php`.

## Concepts
- [[produccion-vs-local]]: Directriz estratégica: el bot en producción corre en la nube con Meta Cloud API, reservando Baileys exclusivamente para desarrollo local.
- [[customer-service-state-machine]]: Máquina de 5 estados y 6 reglas para atención humanizada de consultas orgánicas sin AI slop.
- [[portal-web-modernization]]: Corrección adversarial: desacople de categorías, sincronización de filtros, ScrollSpy y diseño Gold & Black.

## Topics
- [[whatsapp-bot-arquitectura]]: Pipeline integral de mensajería: enrutamiento híbrido (campañas CTWA vs atención orgánica), scoring y analítica.
- [[portal-inmobiliario-frontend]]: Arquitectura de la web pública (`index.html`, `buscar.html`), catálogo dinámico con API REST y Leaflet.js.

## Sources
- [[session-2026-09-04-fixes-and-deployment]]: Bitácora de la revisión inicial del bot, 5 fixes aplicados y preparación para despliegue en Render.
- [[session-2026-10-16-web-portal-modernization]]: Auditoría adversarial del portal web, corrección de filtrado, ScrollSpy reactivo y blindaje total del chatbot.
- [[session-2026-10-18-bot-tunnel-and-lead-sync]]: Restauración de túnel Cloudflare, conectividad del bot y blindaje de extracción en clasificador de leads.

