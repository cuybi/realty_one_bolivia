# 📜 Bitácora y Memoria de la Conversación — Realty ONE Group Bolivia
**Fecha:** 15 de Septiembre, 2026  
**Proyecto:** Realty ONE Group Bolivia — WhatsApp Marketing Hub, Bot Cloud/Baileys & Chrome Extension "Ingreso Leads"  
**Repositorio:** `cuybi/realty_one_bolivia` (Rama `main`)  
**Despliegue Producción:** Render (`https://realty-one-bolivia.onrender.com`)  

---

## 📌 1. Resumen Cronológico de Solicitudes y Ejecución

### 1.1. Petición Inicial: Identidad de Marca y Logo Oficial
- **Solicitud del Usuario:** Quitar el león emoji, usar el logo oficial en círculo dorado ONE, cambiar el texto "CRM" por "INGRESO LEADS" en la extensión de Chrome.
- **Acción Realizada:**
  - Se generó el logo oficial circular en fondo oscuro con el dorado de Realty ONE Group (`icons/logo_one.png` y `icons/icon128.png`).
  - Se eliminó el emoji de león 🦁 en `content.js`, `panel.html`, `popup.html`, y `sidebar.css`.
  - Se renombró la extensión y todos sus encabezados a **"Realty ONE • Ingreso Leads"**.

---

### 1.2. Petición: Suite Completa de Marketing Automatizado en Tiempo Real
- **Solicitud del Usuario:** Integrar al proyecto un sistema completo de marketing en tiempo real y en línea para WhatsApp:
  1. Envíos masivos (broadcasts) con delay anti-baneo aleatorio (8 a 22 segundos).
  2. Campañas multimedia (fotos, videos, audios, PDFs / brochures).
  3. Embudos automáticos en 1 clic (1-Click Funnels).
  4. Árboles de decisión para Chatbot.
  5. Respuestas automáticas por palabras clave (Auto-replies).
  6. Publicación de historias / estados de WhatsApp (WhatsApp Status Stories).
  7. Etiquetas y segmentación de clientes (VIP, Urubó, Preventa, Alquileres).
  8. Mensajes programados con temporizador.
- **Acción Realizada:**
  - Creación del servicio `services/marketingHub.js` (y `backend/services/marketingHub.js`).
  - Normalización automática de números bolivianos (8 dígitos convertidos a prefijo `591`).
  - Creación de rutas de API REST `routes/marketingRoutes.js` (y `backend/routes/marketingRoutes.js`) protegidas con `x-admin-key: ONE2026`.
  - Conexión del socket de WhatsApp Baileys al Marketing Hub (`marketingHub.setBaileysSocket(sock)`) en `whatsapp_baileys.js`.
  - Despliegue en Render y confirmación de endpoints en vivo.

---

### 1.3. Petición: Conversión y Exportación a Excel (.xlsx / .xls)
- **Solicitud del Usuario:** "¿Se va a poder convertir en un Excel? Si es así, procede".
- **Acción Realizada:**
  - Se agregó soporte nativo de exportación a Excel (.xlsx y XML SpreadsheetML .xls) tanto en el backend (`GET /api/marketing/campaigns/:id/excel`) como dentro del panel de la extensión de Chrome.
  - Generación de hojas de cálculo limpias con codificación UTF-8 para nombres y notas sin caracteres rotos.

---

### 1.4. Petición: Corrección de Errores en la Extensión de Chrome (`kkfpkigdjehpjkdglindcnidlbnmlnci`)
- **Solicitud del Usuario:**
  > `"chrome://extensions/?errors=kkfpkigdjehpjkdglindcnidlbnmlnci" te paso esta direccion si te sirve para que la analices, no el hay boton para convertir a excel, quitar "mar adentro" y no funciona ningun boton de esa imagen.`
- **Diagnóstico y Causa Raíz:**
  1. En `panel.js`, el listener de los botones llamaba a `copyAndInsertText(text, chip)` y los botones de Excel llamaban a `exportToExcel()`, pero dichas funciones **no estaban definidas** en el script (fueron omitidas en una versión previa), arrojando `Uncaught ReferenceError`. Chrome captura estos errores no controlados y los almacena en `chrome://extensions/?errors=<id>`.
  2. En entornos `iframe`, `navigator.clipboard.writeText()` lanzaba error de foco DOM (`Document is not focused`).
  3. "Mar Adentro" seguía presente en los chips de respuesta rápida de la versión instalada.
  4. Faltaba el botón visual destacado de Excel en el panel lateral.
- **Solución Implementada (v1.2.1):**
  - **Eliminación de "Mar Adentro":** Removido por completo de `TEMPLATES` en `panel.js` y de los chips HTML en `panel.html`. Reemplazado por `🏠 Catálogo Inmuebles`.
  - **Doble botón de Excel agregado:**
    - Botón de icono `📊` en la barra de herramientas superior.
    - Banner interactivo verde `[📊 EXCEL] Exportar Prospectos a Excel (.xlsx)` situado directamente sobre el listado de prospectos.
  - **Función `exportToExcel()` completa:** Genera un archivo `.xls` estándar con ID, Fecha, Nombre, Celular, Prioridad, Etapa, Realtor asignado, Zona y Notas.
  - **Función `copyAndInsertText()` robusta:**
    - Copiado seguro al portapapeles mediante textarea oculto con `document.execCommand('copy')` + fallback async clipboard.
    - Notificación mediante `window.parent.postMessage({ type: 'ROG_INSERT_WHATSAPP_CHAT', text }, '*')` hacia `content.js`.
    - `content.js` inyecta directamente el texto en el cuadro de redacción activo de WhatsApp Web (`#main footer [contenteditable="true"]`) disparando los eventos reactivos necesarios.
    - Feedback visual en el botón que cambia a `¡Copiado! ✓` en verde.
  - **Permisos del Manifest:** Se aseguró `clipboardWrite` y `clipboardRead` en `manifest.json`.
  - **Versión:** Incrementada a `v1.2.1`.

---

## 🛠️ 2. Archivos Modificados / Creados en la Sesión

| Archivo | Tipo | Descripción |
| :--- | :--- | :--- |
| `crm_extension/panel.js` | Modificado | Implementación de `copyAndInsertText()`, `exportToExcel()`, y templates limpios. |
| `crm_extension/content.js` | Modificado | Receptor `ROG_INSERT_WHATSAPP_CHAT` para auto-escritura en WhatsApp Web. |
| `crm_extension/panel.html` | Modificado | Eliminación de "Mar Adentro", adición de botones Excel superior y banner. |
| `crm_extension/panel.css` | Modificado | Estilos para botón banner Excel verde y chips interactivos. |
| `crm_extension/manifest.json` | Modificado | Versión `1.2.1`, permisos de portapapeles y recursos web accesibles. |
| `crm_extension/popup.html` | Modificado | Ajuste de branding "Ingreso Leads" y versión `1.2.1`. |
| `crm_extension/icons/logo_one.png` | Creado | Logo oficial circular dorado ONE de Realty ONE Group. |
| `services/marketingHub.js` | Creado | Motor de broadcast, funnels, historias de estado y segmentación. |
| `backend/services/marketingHub.js` | Creado | Réplica de producción para Render del Marketing Hub. |
| `routes/marketingRoutes.js` | Creado | Endpoints REST para campañas de marketing y exportación. |
| `backend/routes/marketingRoutes.js` | Creado | Réplica de producción para Render de las rutas de marketing. |
| `server.js` y `backend/server.js` | Modificado | Montaje de `/api/marketing`. |
| `backend/whatsapp_baileys.js` | Modificado | Conexión bidireccional de socket Baileys con `marketingHub`. |
| `MEMORY.md` | Actualizado | Memoria técnica del sistema y arquitectura global. |

---

## 🚀 3. Instrucciones de Reactivación para el Usuario

1. Abrir en Google Chrome:
   ```text
   chrome://extensions
   ```
2. Localizar **Realty ONE — Ingreso Leads**:
   - Hacer clic en el icono **🔄 (Recargar / Actualizar)**.
   - Verificar que indique versión **v1.2.1**.
   - En el botón rojo de "Errores", presionar **"Borrar todo"** para vaciar el historial anterior.
3. Ir a la pestaña de **WhatsApp Web** (`web.whatsapp.com`) y recargar con **`F5`**.
4. Al abrir el panel `INGRESO LEADS`:
   - Hacer clic en cualquier botón rápido (`👋 Bienvenida`, `📅 Agendar Visita`, `🏠 Catálogo Inmuebles`, `📋 Requisitos`): el texto se copia y se pega directamente en el chat.
   - Hacer clic en `[📊 EXCEL] Exportar Prospectos a Excel (.xlsx)`: descarga inmediatamente el archivo con todos los leads registrados.

---

## 📌 4. Sesión del 09 de Octubre, 2026: Auditoría Integral y Nuevo Asistente de Atención al Cliente (5 Estados / 6 Reglas)

### 4.1. Depuración Técnica y Corrección de Errores (Doubt-Driven Development)
1. **Fix `rawNumber` ReferenceError:**
   - Corregido en `backend/whatsapp_baileys.js` y `whatsapp_baileys.js` en el endpoint `POST /api/whatsapp/pairing-code`.
2. **Autenticación SiteGround HTTP 200:**
   - Se configuró cabecera `X-Admin-Key: ONE2026` y parámetro `?key=ONE2026` en `leadClassifier.js` para cumplir la regla `$isAdmin` de `save_leads_sync.php`. Sincronización en vivo validada con código 200.
3. **Limpieza de Extracción de Citas:**
   - En `campaignService.js`, se implementó regex para separar preguntas complejas (ej. "¿Tiene Folio Real?") de la fecha de visita ("el sábado a las 10:00 AM").
4. **Validación de Suites de Prueba:**
   - `test_lead_classifier.js`: 5/5 pasadas.
   - `test_campaign_accuracy.js`: 6/6 pasadas.
   - `test_campaign_bot.js`: 3/3 pasadas.
   - `test_user_screenshots.js`: 11/11 pasadas.
   - `test_bot.js`: 8/8 pasadas.

---

### 4.2. Nuevo Rol y Motor de Estados: Asistente Virtual de Atención al Cliente
Implementado en `backend/services/aiAgent.js` y `services/aiAgent.js`:

* **Reglas Estrictas de Comportamiento:**
  1. **Regla 1:** NUNCA ofrecer listas de opciones, menús ni viñetas. Preguntas abiertas y libres.
  2. **Regla 2:** Flujo paso a paso estricto. No avanzar hasta que el usuario responda al estado actual.
  3. **Regla 3:** Validación de datos (teléfono, correo y ciudad). Si omite alguno, pedir amablemente antes de avanzar al Estado 3.
  4. **Regla 4:** Manejo de objeciones. Si se niega a dar datos, explicar que son indispensables. Si insiste, indicar que puede llamar y saltar al Estado 5.
  5. **Regla 5:** Validación de fecha. Obligatorio: día de la semana, fecha exacta y hora. Si es incompleta, pedir amablemente completar formato.
  6. **Regla 6:** Tono cordial y directo.

* **Flujo de la Conversación:**
  * **ESTADO 1 (Saludo Inicial):** `"Hola [Nombre del cliente]. ¿En qué puedo ayudarte?"` (o `"Hola. ¿En qué puedo ayudarte?"`).
  * **ESTADO 2 (Solicitud de Datos):** `"Para que un agente especializado se contacte contigo, por favor compárteme tu número de teléfono, correo electrónico y ciudad."`
  * **ESTADO 3 (Agendamiento):** `"Si tienes clara tu decisión, ¿quieres agendar una visita? (Por favor indícame día, fecha y hora, por ejemplo: Lunes 15 de marzo a las 10:00 AM)."`
  * **ESTADO 4 (Recordatorio):** `"Muchas gracias por tu agendamiento. ¿Quieres que te recuerde un día antes de tu visita?"`
  * **ESTADO 5 (Despedida):** Despedida usando el nombre del cliente y obligatoriamente la frase: `"Cualquier duda o inquietud no dude en llamar."`

* **Suite de Pruebas de Integración:**
  - Creado `backend/test_customer_service_flow.js` con 5 escenarios exhaustivos. Todos pasando al 100% con exit code 0.

---

### 4.3. Despliegue en la Nube (Render) y Vinculación Activa
1. **GitHub Push:** Cambios subidos a la rama `main` de `cuybi/realty_one_bolivia` (commits `657cca0` y `5a895cb`).
2. **MongoDB Atlas TLS Fix:** En `server.js` y `backend/server.js`, se ajustaron las opciones del cliente MongoDB eliminando flags que causaban conflicto de SNI / OpenSSL en Linux (SSL alert 80).
3. **Vinculación en WhatsApp Cloud:** Generado código de emparejamiento de 8 dígitos para +591 60937050: **`KAM8-D2KP`** (y disponible en `/qr_connect.html`).

---

## 📌 5. Sesión del 09 de Octubre, 2026 (Tarde): Retoma y Unificación del Chatbot (Arquitectura Híbrida Inteligente)

### 5.1. Diagnóstico Doubt-Driven Development
- **Hallazgo Crítico:** Tras el commit `657cca0`, la máquina de estados rígida de 5 estados interceptaba el 100% de los mensajes entrantes, impidiendo que los prospectos de Facebook Ads recibieran la ficha técnica, fotos, amenidades o precios de las propiedades pautadas (*Condominio Mar Adentro*, *Terreno Industrial G77*, *Depto 4D*, *Westgate Tower*, *Buenavista*).
- **Impacto:** Las suites `test_campaign_accuracy.js` y `test_user_screenshots.js` fallaban al no recibir respuestas sobre campañas.

### 5.2. Arquitectura Híbrida Implementada (`aiAgent.js`)
Se unificaron los dos motores con enrutamiento dinámico según el canal de entrada:
1. **Canal de Campañas y Anuncios (Facebook Ads / CTWA):**
   - Detección automática de metadatos de anuncio (`referralData`, `fb.me`, palabras clave de pautas).
   - Entrega inmediata de la ficha técnica, precios, fotos y asesoría sobre crédito bancario, permutas, expensas y plusvalía.
   - Preservación de contexto (`activeCampaign`) para conversaciones de seguimiento multi-turno sin pérdida de estado.
   - Captura de datos de contacto y confirmación de agendamiento con asignación de e-Realtor en el CRM.
2. **Canal Orgánico / General (Atención al Cliente):**
   - Ejecuta la máquina de 5 estados y 6 reglas (`ESTADO_1_GREETING` a `ESTADO_5_FAREWELL`).
   - Saludo abierto sin menús ➔ Solicitud de teléfono, correo y ciudad con validación amigable ➔ Agendamiento de visita con validación estricta de día, fecha y hora ➔ Recordatorio condicional ➔ Despedida obligatoria: *"Cualquier duda o inquietud no dude en llamar."*

### 5.3. Validación Integral de las 6 Suites de Prueba (100% Pasadas)
- `test_customer_service_flow.js`: 5/5 escenarios pasados al 100% (código de salida 0).
- `test_campaign_accuracy.js`: 8/8 pasos y escenarios de anuncios pasados al 100% (código de salida 0).
- `test_user_screenshots.js`: 11/11 validaciones de capturas reales pasadas al 100% (código de salida 0).
- `test_campaign_bot.js`: 100% de pruebas de anuncios Mar Adentro y G77 completadas con éxito.
- `test_lead_classifier.js`: 5/5 pruebas de clasificación, scoring y exportación Excel/CSV exitosas.
- `test_bot.js`: 8/8 casos completados satisfactoriamente.
- Archivos sincronizados en espejo: `backend/services/aiAgent.js` y `services/aiAgent.js`.

### 5.4. Depuración y Conexión en Vivo de WhatsApp Baileys
- **Diagnóstico del Bucle 401 Disconnected:** Al invalidar una sesión previa desde el teléfono, WhatsApp Web emitía código 401. El conector fallaba en limpiar la colección `baileys_auth` en MongoDB Atlas debido a un error de ámbito con la variable `authFolder` dentro del bloque `connection.close`. Esto hacía que Baileys intentara reconectar indefinidamente con credenciales expiradas sin generar un nuevo QR ni permitir emparejamiento.
- **Solución Implementada:**
  - Se redefinió `localAuthFolder` a nivel de función y se garantizó la ejecución de `collection('baileys_auth').deleteMany({})` tanto en `isLoggedOut` como en el endpoint `/api/whatsapp/desconectar`.
  - Se limpiaron las credenciales obsoletas de MongoDB Atlas y disco local.
  - Sincronizado en `backend/whatsapp_baileys.js` y `whatsapp_baileys.js` y desplegado en Git (commit `fb66e27`).
- **Estado Actual del Conector:**
  - Servidor local activo en `http://localhost:3000` con visualizador en `/qr_connect.html`.
  - Código de emparejamiento de 8 dígitos generado para **+591 60937050**: **`G7FY-8D1S`**.

### 5.5. Conexión Exitosa en Vivo y Flujo Oficial de Atención al Cliente
- **Vinculación Confirmada:** El dispositivo móvil vinculó exitosamente la línea **+591 60937050** con Baileys.
- **Corrección de Enrutamiento Orgánico vs. Anuncios:**
  - Se eliminaron las plantillas con listas numeradas (`1. 🎯`, `2. 📅`) de todo el motor.
  - Al recibir saludos ("Hola") o solicitudes de atención ("Un agente"), se resetea cualquier sesión publicitaria previa en `userFlowSessions`.
  - Se implementó el flujo exacto solicitado con emojis profesionales:
    1. Saludo cordial como asistente virtual con nombre del cliente: *¿En qué puedo ayudarte hoy? 😊*
    2. Respuesta personalizada según interés del cliente (sin listas ni menús) y solicitud de datos principales (teléfono, correo, ciudad) para que un agente especializado se contacte.
    3. Si datos completos: Pregunta si tiene clara su decisión para agendar visita (día, fecha y hora).
    4. Si no agenda visita: Despedida directa con frase obligatoria. Si agenda visita: Agradecimiento y pregunta condicional de recordatorio.
    5. Despedida cordial con nombre y frase obligatoria: *"Cualquier duda o inquietud no dude en llamar."*
- **Validación:** 100% de las 6 suites de pruebas pasando con éxito (commit `41ea14d`).

---

### 5.6. Diagnóstico y Solución Definitiva de Sincronización en Tiempo Real ("No actualiza")
- **Causa Raíz Diagnosticada con Doubt-Driven Development:**
  1. **Autenticación en Polling:** `ingreso_leads.html` consultaba `/api/whatsapp/leads` sin `?key=ONE2026` en la URL. Al no incluir credenciales HTTP Basic Auth ni el encabezado en peticiones cross-origin o sin sesión, el backend respondía `401 Unauthorized`, bloqueando el refresco automático.
  2. **Sobreescritura de Nombre en Formularios:** Al recibir mensajes multilínea o separados por comas (ej. `"marcos antezana, 60034649, pixelbolivia@gmail.com, santa cruz"`), la función anterior asignaba el último elemento (`santa cruz`) como nombre del cliente en lugar de la ciudad. Corregido en `leadClassifier.js`.
  3. **Ordenamiento de Prospectos Existentes:** Al re-interactuar un prospecto existente (ej. creado a las 14:03 y activo a las 15:47), la tabla mantenía el orden por fecha de creación antigua en lugar de actividad reciente, dejándolo más abajo en la lista.
  4. **Latencia de Red SiteGround:** `saveLeads` esperaba síncronamente la respuesta de SiteGround (10s de timeout). Se optimizó a sincronización en segundo plano (non-blocking) para respuesta inmediata en WhatsApp.
- **Acciones Implementadas:**
  - **`ingreso_leads.html`:**
    - Parámetro `?key=ONE2026` inyectado en todas las llamadas de lectura y escritura (`/api/whatsapp/leads`, `save_leads_sync.php`).
    - Fallback resiliente a `https://realyonegroupbolivia.e-techgroupbolivia.com/save_leads_sync.php?key=ONE2026` si el backend local no responde.
    - Ordenamiento automático por `ultima_actividad` o `fecha_creacion` más reciente en cada ciclo de polling (cada 2.5s).
    - Detección de cambio en `snapshotFn` sensible a hora y posición.
  - **`leadClassifier.js`:**
    - Extracción precisa de nombre, teléfono, email y ciudad en `extractFormData`.
    - Sincronización no bloqueante a SiteGround. Sincronizado en `backend/` y `services/`.
- **Estado Actual:**
  - Bot WhatsApp Baileys conectado y en vivo (`+591 60937050`).
  - Total leads sincronizados en SiteGround y local: **23 leads** con `Marcos Antezana` activo al inicio.




