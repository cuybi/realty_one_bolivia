# Prompt para Antigravity — Arreglar el bot que no responde en WhatsApp

> Copia y pega todo el bloque de abajo en Antigravity, dentro de este workspace.

```text
TAREA: El bot de WhatsApp de Realty ONE Group Bolivia NO responde. Diagnostícalo y arréglalo.

PROYECTO (trabaja SOLO aquí):
C:\Users\E-Tech Group\.gemini\antigravity-ide\scratch\realty_one_bolivia
NO toques realtor_team_bot ni ningún otro proyecto hermano.

EVIDENCIA YA VERIFICADA (no la re-descubras, úsala):
- GET https://realty-one-bolivia.onrender.com/api/health devuelve:
  {"status":"ok","connection":"conectado","numeroConectado":"59160937050","hasQR":false,
   "lastError":"Mongo fallback: ...SSL routines:ssl3_read_bytes:tlsv1 alert internal error...SSL alert number 80",
   "uptime":157364,"hasMongoUri":true}
- GET /api/whatsapp/qr-real -> {"status":"conectado","qr":null,"numeroConectado":"59160937050"}
- GET /api/whatsapp/status -> geminiConfigurado:false, whatsAppCloudConfigurado:false
- POST /api/whatsapp/simular {"mensaje":"Hola"} -> responde OK
  => El motor de IA (services/aiAgent.js) FUNCIONA. El problema NO es la lógica del bot.
- https://realyonegroupbolivia.e-techgroupbolivia.com/webhook.php -> HTTP 500
- https://realyonegroupbolivia.e-techgroupbolivia.com/ping_render.php -> conexión cortada
- .env local: WHATSAPP_TOKEN presente pero la Graph API v20.0 lo rechaza con HTTP 400 (token caducado/inválido)
- render.yaml: startCommand = "node server.js" (raíz). server.js corre Baileys con auth en MongoDB.
- backend/baileys_auth/ está en .gitignore -> la sesión NO viaja a Render; depende de Mongo, que falla.

CAUSA RAÍZ PROBABLE: en Render la conexión a MongoDB Atlas falla (SSL alert 80) y Baileys cae a
disco local efímero; al reiniciar/redeploy se pierde la sesión de WhatsApp y el bot deja de responder.
Además el canal oficial (Cloud API) NO está configurado, así que no hay plan B.

PASOS OBLIGATORIOS (en este orden):
0. ANTES de tocar código: abre los LOGS de Render del servicio realty-one-whatsapp-bot y busca
   "📩 [Mensaje recibido" y "🤖 [Respuesta enviada". Reporta si llegan mensajes entrantes.
   - Si NO aparecen: confirma que el socket no recibe (sesión muerta/inválida) -> re-vincular.
   - Si APARECEN entrantes pero NO hay "Respuesta enviada": el fallo está al ENVIAR.
     Revisa el JID: con WhatsApp nuevo los mensajes llegan como @lid y hay que responder usando
     msg.key.remoteJidAlt (o el JID @s.whatsapp.net real). Añade ese manejo.
1. Arregla MongoDB Atlas (SSL alert number 80) en server.js y backend/server.js:
   - Añade la IP de salida de Render en el whitelist de Atlas (o 0.0.0.0/0 mientras pruebas, y avisa del riesgo).
   - Revisa que MONGODB_URI no lleve flags TLS en conflicto; usa opciones explícitas del driver
     (serverSelectionTimeoutMS, socketTimeoutMS, maxIdleTimeMS) y NO mezcles ssl=true con tlsAllowInvalidCertificates.
   - Verifica conexión real con db('realty_one_bot').command({ping:1}) antes de cargar el auth state.
2. ELIMINA el fallback silencioso a disco efímero: si Mongo no conecta, debe registrarse un error claro
   (no arrancar con un auth state vacío que parece "conectado" pero no recibe).
3. Añade en server.js: process.on('unhandledRejection') y process.on('uncaughtException') con log,
   para que un error al responder no deje el bot mudo sin rastro.
4. Añade logging de entrantes y expón en /api/health el campo lastInbound (número + timestamp + texto),
   para poder diagnosticar sin logs a mano.
5. Garantiza UNA sola instancia Baileys: no puede estar conectado a la vez el bot local (iniciar_bot.bat)
   y Render con el mismo número (se expulsan y da "no responde" intermitente).
6. Re-vincula el número con POST /api/whatsapp/pairing-code (59160937050) y confirma con un mensaje real.
7. Limpia archivos basura (0 bytes) creados por comandos rotos en la raíz del proyecto:
   a.processUserMessage('user123'   |   console.error(e.message))   |   console.log('Type
   console.log(d))   |   k.includes('Pairing')   |   r.json()).then(console.log).catch(console.error)   |   {
8. Deduplica lógica: hoy existen server.js y backend/server.js, y whatsapp_baileys.js y backend/whatsapp_baileys.js.
   Decide cuál es el de producción (render.yaml arranca "node server.js") y elimina o sincroniza el sobrante.

REGLAS:
- Cada cambio: causa raíz + archivo + cómo lo verificaste.
- No hardcodees secretos ni subas .env al repo.
- Al terminar: commit + push a main (Render redepliega solo) y valida con /api/health.

CRITERIO DE ÉXITO:
- Envías "Hola" desde un celular al +591 60937050 y el bot responde en <10 s.
- GET /api/health -> connection:"conectado", lastError:null, hasMongoUri:true, lastInbound reciente.
- Tras reiniciar el servicio en Render, el bot sigue respondiendo SIN re-escanear el QR.
```
