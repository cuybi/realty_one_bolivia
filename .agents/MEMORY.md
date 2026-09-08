# MEMORIA DEL PROYECTO REALTY ONE GROUP BOLIVIA (.agents/MEMORY.md)

## 1. Identidad y Propósito
Plataforma oficial para **Realty ONE Group Bolivia**.
- **Identidad Visual:** Gold & Black Luxury (`#D4AF37` dorado, `#0d0d0d` fondo oscuro).
- **Mercado:** Santa Cruz de la Sierra, Urubó, Equipetrol, Sirari, Las Palmas, Zona Norte (Bolivia).
- **Características:** Portada institucional con 6Cs, buscador dinámico, mapa interactivo Leaflet.js para loteamientos, fichas de propiedad con WhatsApp directo, páginas especializadas (Venta, Alquiler, Anticrético, Terrenos) y CMS integrado con persistencia JSON.

## 2. Pila Tecnológica
- **Frontend:** HTML5, CSS3 nativo (`styles.css`), JavaScript ES6+ (`script.js`), Leaflet.js 1.9.4, AOS (Animate on Scroll), FontAwesome 6.
- **Backend:** Node.js + Express.js (`backend/server.js`), CORS, body limits 50MB, fallback SPA estático.
- **Persistencia:** `backend/database.js` y `backend/realty_one_data.json` con emulación de API SQLite y auto-seeding.
- **Autenticación CMS:** Clave secreta vía cabecera `x-admin-key: ONE2026` (variable `ADMIN_KEY`).

## 3. Estructura de Archivos
- [index.html](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/index.html): Portal principal con Hero carrusel, buscador rápido, catálogo de propiedades, proyectos y agentes.
- [buscar.html](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/buscar.html): Motor de filtros reactivos (operación, precio, ubicación, habitaciones, baños).
- [mapa.html](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/mapa.html): Mapa interactivo de lotes/urbanizaciones con Leaflet.js y estados (Disponible, Reservado, Vendido).
- [propiedad.html](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/propiedad.html): Ficha de detalle de inmueble con galería y contacto directo.
- [venta.html](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/venta.html), [alquiler.html](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/alquiler.html), [anticretico.html](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/anticretico.html), [terrenos.html](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/terrenos.html): Landings filtradas por tipo de operación.
- [backend/server.js](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/backend/server.js): API REST completa (slides, categorias, propiedades, proyectos, noticias, testimonios, agentes, config).
- [backend/database.js](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/backend/database.js): Persistencia en JSON con auto-seeding de datos realistas de Santa Cruz.
- [webhook.php](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/webhook.php): Webhook oficial en producción (SiteGround) para WhatsApp Cloud API con captura de Leads (Nombre, Celular, Email), guardado automático en `leads.json` / `leads.csv` y desglose contextual por opción.
- [activar.php](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/activar.php): Script de suscripción WABA a Meta Cloud API (`/subscribed_apps`).
- [backend/realty_one_data.json](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/backend/realty_one_data.json): Archivo de datos persistente.
- [styles.css](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/styles.css): Tokens de diseño, glassmorphism y estilos responsivos.
- [script.js](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/script.js): Lógica de renderizado dinámico, llamadas a API REST y modales del panel CMS.

## 4. API Endpoints y Chatbot WhatsApp
- `GET /api/health`: Estado del servicio.
- `GET /api/propiedades` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /api/slides` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /api/categorias` / `PUT /:id`
- `GET /api/proyectos` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /api/noticias` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /api/testimonios` / `POST` / `PUT /:id` / `DELETE /:id`
- `GET /api/agentes` / `POST` / `PUT /:id` / `DELETE /:id`
- `POST /api/whatsapp/webhook` (y `webhook.php`): Chatbot de captación de leads inmobiliarios con menú interactivo (1-5), validación de datos del cliente y desglose de catálogo en tiempo real.
- **Módulo Facebook Ads Click-to-WhatsApp:** Campañas activas de *Terreno Industrial G77 (7.000 m² - Bs 16.800.000)* y *Lote Mar Adentro (450 m² - $112,500 USD)* con extracción automática de tarjetas `externalAdReply` y respuestas especializadas por publicación.

## 5. Arquitectura de Despliegue (Producción vs Local)
- **Producción (Render + SiteGround):**
  - **Decisión de usuario:** En producción **NO** se usa WhatsApp local ni Baileys con QR (los discos efímeros de Render invalidan las sesiones al reiniciar).
  - **Render Web Service:** Ejecuta `node backend/server.js` (puerto 10000 asignado por Render), configurado en `render.yaml`.
  - **SiteGround:** Aloja `webhook.php` y `save_leads_sync.php`. Redirige tráfico de webhook de Meta a Render (`POST /api/whatsapp/webhook`).
  - **Motor IA:** Google Gemini 2.0 Flash Lite (`aiAgent.js`).
- **Desarrollo / Local:**
  - `backend/server.js` corre en puerto `3000`.
  - `backend/whatsapp_baileys.js` corre en puerto `3001` (`BAILEYS_PORT`).
  - Vinculación QR local mediante `qr_connect.html`.

## 6. Fixes Críticos Recientes (Septiembre 2026)
1. **Puerto Baileys:** `whatsapp_baileys.js` usa `BAILEYS_PORT || 3001` para evitar conflicto con `server.js` en 3000.
2. **Ruta duplicada:** Se eliminó el montaje duplicado de `/api/whatsapp` en `backend/server.js:357`.
3. **Gemini 2.0 Flash Lite:** Actualizado modelo en `backend/services/aiAgent.js` (reemplazando `gemini-1.5-flash` deprecado).
4. **Código muerto eliminado:** Removidas ~200 líneas sin uso (`generateLocalSemanticResponse`) en `aiAgent.js` y limpiados `module.exports`.
5. **Render Config:** `render.yaml` actualizado para arrancar con `node backend/server.js`.

