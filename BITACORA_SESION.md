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
