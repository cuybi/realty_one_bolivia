# Realty ONE — Ingreso Leads (Extensión Chrome)
**Panel integrado en WhatsApp Web**

## Cómo instalar (30 segundos)

1. Abrir Chrome o Edge → escribir en la barra: `chrome://extensions`
2. Activar **"Modo de desarrollador"** (interruptor arriba a la derecha)
3. Clic en **"Cargar descomprimida"** (o "Cargar sin empaquetar")
4. Seleccionar la carpeta: `c:\Users\etechadmin\.gemini\antigravity-ide\scratch\realtor_team_bot\crm_extension`
5. ✅ Listo — extensión v1.2.3 instalada con el logo dorado ONE

## Cómo usar (Paneles estilo MiCierro)

1. Abrir **web.whatsapp.com**.
2. **Pestaña lateral dorada `ONE INGRESO LEADS`** o atajos:
   - `Alt + L` → Alternar panel lateral.
   - `Alt + K` → Abrir Tablero Kanban directo.
   - Botón `⛶` en cabecera → Expandir a pantalla panorámica completa (1200px+).
3. **Módulos incluidos:**
   - 📊 **Tablero Kanban Visual:** 6 columnas (`Nuevo`, `Contactado`, `Visita`, `Negociación`, `Cerrado`, `Descartado`) con Drag & Drop para mover leads de etapa arrastrando la tarjeta.
   - 👤 **Ficha Lead Activo:** Detección instantánea del chat abierto, teléfono, asesor (Marcos Antezana Lenz), notas y exportación a Excel.
   - 📅 **Agenda & Recordatorios (Follow-up):** Programa visitas con fecha y hora para no olvidar a ningún cliente.
   - ⚡ **Respuestas Rápidas (1 Clic):** Plantillas de catálogo, visitas a Urubó/Equipetrol y requisitos bancarios con botón para pegar en WhatsApp.
   - 📢 **Difusión Segmentada:** Envío de mensajes de reactivación a listas filtradas.
4. **Inyecciones directas en WhatsApp Web:**
   - Barra de filtros arriba de la lista de chats: `Todos`, `No leídos`, `🔥 Leads CRM`, `📅 Visitas`.
   - Botones rápidos en la cabecera de la conversación: `📊 Kanban`, `📅 Agenda`, `⚡ Respuestas`.
   - Dock flotante lateral en el chat para acceso en 1 clic.

1. Click en el ícono **ONE** de la barra de Chrome
2. En el popup → cambiar la URL del servidor
3. Click "Guardar URL"

## Estructura de archivos

```
crm_extension/
├── manifest.json     ← Configuración extensión (Chrome MV3)
├── content.js        ← Inyección y puente con WhatsApp Web
├── sidebar.css       ← Estilos del marco lateral
├── panel.html        ← Panel CRM local (0ms carga, inmune a CSP)
├── panel.js          ← Sincronización y lógica de leads
├── panel.css         ← Diseño visual y responsive del panel
├── popup.html        ← Popup del ícono de Chrome
├── popup.js          ← Lógica del popup
└── icons/
    └── icon128.jpg   ← Ícono del león dorado
```
