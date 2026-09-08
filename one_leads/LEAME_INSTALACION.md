# 🦁 OneLeads — CRM Visual & Extensión de WhatsApp Web

Proyecto independiente estilo **MiCierro** (`micierro.com`) para gestionar prospectos inmobiliarios y comerciales en un tablero **Kanban visual con Drag & Drop**, respuestas rápidas en 1 clic y recordatorios de seguimiento.

---

## 📂 Archivos del Proyecto (`one_leads/`)

1. **`index.html`**: Landing Page SaaS completa de presentación y ventas (estética MiCierro, planes de $0, $39 y $99 con 79% de ahorro, 4 superpoderes, testimonios y FAQ).
2. **`app_crm.html`**: Aplicación CRM Web interactiva con **Tablero Kanban Drag & Drop**, modal de creación/edición de prospectos, drawer de plantillas de 1 clic, recordatorios y exportación a Excel.
3. **`styles.css` / `script.js`**: Estilos y lógica de la Landing Page.
4. **`app_crm.css` / `app_crm.js`**: Estilos y lógica del tablero Kanban con almacenamiento persistente local.
5. **`extension/`**: Paquete de extensión para Google Chrome (Manifest V3) que inyecta el panel lateral y respuestas en 1 clic directamente sobre `web.whatsapp.com`.

---

## 🚀 Cómo Probarlo en Local / Servidor

### Opción A: Abrir la Web App CRM
* Abre en tu navegador el archivo `one_leads/app_crm.html` (o `one_leads/index.html`).
* Puedes arrastrar tarjetas entre las 6 columnas del embudo:
  * 📥 *1. Nuevos Prospectos*
  * 💬 *2. Calificación & Interés*
  * 📅 *3. Visita Agendada*
  * 💼 *4. Propuesta / Negociación*
  * 🏆 *5. Cerrado / Ganado*
  * ❌ *6. Descartado / Frío*
* Haz clic en **"Chat 1-Clic"** en cualquier tarjeta para abrir WhatsApp con un saludo personalizado y ficha del inmueble.
* Prueba el botón **"Plantillas 1-Clic"** para copiar textos predefinidos con un solo toque.

---

## 🔌 Cómo Instalar la Extensión en Google Chrome

1. Abre Google Chrome y ve a la dirección: `chrome://extensions`
2. En la esquina superior derecha, activa el interruptor: **"Modo de desarrollador"** (Developer mode).
3. Haz clic en el botón: **"Cargar descomprimida"** (Load unpacked).
4. Selecciona la carpeta: `one_leads/extension`
5. ¡Listo! Abre `https://web.whatsapp.com` y verás el botón flotante **"⚡ OneLeads CRM"** en la parte superior para desplegar tu embudo y respuestas en 1 clic.
