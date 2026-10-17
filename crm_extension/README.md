# Realty ONE — Ingreso Leads (Extensión Chrome)
**Panel integrado en WhatsApp Web**

## Cómo instalar (30 segundos)

1. Abrir Chrome o Edge → escribir en la barra: `chrome://extensions`
2. Activar **"Modo de desarrollador"** (interruptor arriba a la derecha)
3. Clic en **"Cargar descomprimida"** (o "Cargar sin empaquetar")
4. Seleccionar la carpeta: `c:\Users\etechadmin\.gemini\antigravity-ide\scratch\realty_one_bolivia\crm_extension`
5. ✅ Listo — extensión **v1.2.5** instalada con diseño Luxury Dark & Gold de Realty ONE

## Cómo usar (Paneles estilo MiCierro / OneSuite)

1. Abrir **web.whatsapp.com**.
2. **Pestaña lateral dorada `ONE INGRESO LEADS`** o atajos:
   - `Alt + L` → Alternar panel lateral.
   - `Alt + K` → Abrir Tablero Kanban directo.
   - Botón `⛶` en cabecera → Expandir a pantalla panorámica completa (1200px+).
3. **Módulos incluidos en v1.2.5:**
   - 📊 **Tablero Kanban Visual Drag & Drop:** 6 columnas (`✨ Solicitud / Nuevo`, `📞 Contactado`, `📅 Visita Agendada`, `📝 Negociación`, `🏆 Cerrado / Ganado`, `❌ Descartado`), filtros por prioridad (`🔥 Potencial`, `⚡ Indeciso`, `❄️ Pasivo`, `💼 Propietario`), avatares con iniciales y botón directo de borrado `🗑️`.
   - 👤 **Ficha Lead Activo Ultra-Moderna:** Avatar circular con iniciales, detección del chat abierto, teléfono con enlaces a WhatsApp, selector de e-Realtors, timeline de notas históricas y barra de acciones rápidas (`💬 Chatear`, `📅 Agendar`, `🗑️ Eliminar`).
   - 📅 **Agenda & Recordatorios (Follow-up):** Atajos de fecha rápida (`Hoy`, `Mañana`, `+2 días`, `En 1 semana`), citas con countdown, botón para escribir mensaje directo y botón para borrar citas.
   - ⚡ **Respuestas Rápidas Ampliadas (12 Plantillas Inmobiliarias):** Buscador en tiempo real por palabras clave, filtros por categorías (`Atención Inicial`, `Visitas`, `Inventario`, `Operación & Legal`, `Financiamiento`, `Negociación`) y botón de 1-clic para inyectar en el chat activo de WhatsApp.
   - 📢 **Difusión Masiva Segmentada:** Envío asistido con variables dinámicas (`{nombre}`, `{asesor}`, `{zona}`) anti-baneo.
   - 🔄 **Sincronización Resiliente Multicapa:** Localhost (Tier 1) → Render Cloud (Tier 2) → SiteGround Fallback (Tier 3), asegurando funcionamiento 24/7 en cualquier red.
   - 📊 **Exportación a Excel Oficial (.xlsx / .xls):** Descarga instantánea de la base de datos limpia con nombres, celulares, fechas, etapas y notas.
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
