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

## 7. Fix Crítico: "No se pudo vincular el dispositivo" — MongoDB Topology Closed (29 Sep 2026)

### Síntoma
El QR se generaba correctamente en `qr_connect.html` pero al escanearlo WhatsApp reportaba "no se pudo vincular el dispositivo".

### Causa Raíz
`/api/health` reportaba `lastError: "Mongo fallback: Topology is closed"`.

El `global.mongoClientSingleton` en [`server.js`](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/server.js) se reutilizaba sin verificar si seguía vivo. MongoDB Atlas cierra conexiones idle (~30 min). Cuando Baileys intentaba reconectarse, el auth state de Mongo fallaba → las credenciales del QR escaneado no se podían guardar → WhatsApp rechazaba la vinculación.

### Fix Aplicado (commits `ed4eaaa` y `26a82b9`)

**Archivo:** [`server.js`](file:///c:/Users/etechadmin/.gemini/antigravity-ide/scratch/realty_one_bolivia/server.js) — función `startWhatsAppClient()`

| Problema | Solución |
|---|---|
| Singleton Mongo muerto reutilizado | Ping a `db('realty_one_bot')` antes de reusar; destruir y reconectar si falla |
| Ping a `admin` fallaba en Atlas free tier (sin permisos) | Cambiado a `db('realty_one_bot').command({ ping: 1 })` |
| Race condition: heartbeat + `connection.close` llamaban `startWhatsAppClient()` en paralelo | Guard `let isConnecting = false` + `finally { isConnecting = false }` |
| `lastErrorMsg` nunca se limpiaba aunque Mongo se recuperara | `lastErrorMsg = null` en bloque de éxito |
| Mongo cerraba conexiones idle | `maxIdleTimeMS: 30000` en `MongoClient` options |

### Patrón Correcto para Singleton Mongo con Baileys en Render

```js
// 1. Guard anti race-condition al inicio de startWhatsAppClient()
if (isConnecting) return;
isConnecting = true;

// 2. Ping a la DB de la APP (no 'admin' — Atlas free tier lo restringe)
if (global.mongoClientSingleton) {
  try {
    await global.mongoClientSingleton.db('realty_one_bot').command({ ping: 1 });
  } catch (pingErr) {
    try { await global.mongoClientSingleton.close(); } catch (_) {}
    global.mongoClientSingleton = null;
  }
}

// 3. Reconectar con timeouts + maxIdleTimeMS
if (!global.mongoClientSingleton) {
  global.mongoClientSingleton = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxIdleTimeMS: 30000
  });
  await global.mongoClientSingleton.connect();
}

// 4. Limpiar error en éxito
lastErrorMsg = null;

// 5. En catch: null el singleton para forzar reconexión limpia
global.mongoClientSingleton = null;

// 6. Liberar guard siempre
} finally { isConnecting = false; }
```

### Verificación Post-Fix
Consultar `GET /api/health` en Render. Debe mostrar:
- `connection: "esperando_qr"` (o `"conectado"`)  
- `lastError: null`
- `hasMongoUri: true`

Si `lastError` contiene `"Mongo fallback"` → el fix no aplicó o Render no terminó el deploy.

## 8. Arquitectura Híbrida del Chatbot (`aiAgent.js`) — Octubre 2026
El motor de IA conversacional (`backend/services/aiAgent.js` y `services/aiAgent.js`) opera con un enrutador híbrido de alta precisión:
1. **Canal Facebook Ads / Campañas (CTWA):** Si el mensaje contiene metadatos de pauta (`referralData`, `fb.me`) o coincide con propiedades (*Condominio Mar Adentro*, *Terreno Industrial G77*, *Depto 4D*, *Westgate Tower*, *Buenavista*), entrega fichas técnicas, fotos, asesora sobre crédito bancario/permutas/expensas y gestiona citas.
2. **Canal Orgánico / General (Atención al Cliente):** Ejecuta la máquina de 5 estados y 6 reglas (`ESTADO_1_GREETING` a `ESTADO_5_FAREWELL`), validando teléfono, correo y ciudad, agendamiento de visita con formato estricto y despedida obligatoria (*"Cualquier duda o inquietud no dude en llamar."*).
3. **Suites de Prueba Validadas al 100%:** `test_customer_service_flow.js` (5/5), `test_campaign_accuracy.js` (8/8), `test_user_screenshots.js` (11/11), `test_campaign_bot.js`, `test_lead_classifier.js` (5/5) y `test_bot.js` (8/8).



