# Realty ONE CRM — Extensión Chrome
**Panel CRM integrado en WhatsApp Web**

## Cómo instalar (30 segundos)

1. Abrir Chrome → escribe en la barra: `chrome://extensions`
2. Activar **"Modo desarrollador"** (switch arriba a la derecha)
3. Click **"Cargar sin empaquetar"**
4. Seleccionar la carpeta: `realty_one_bolivia/crm_extension/`
5. ✅ Listo — aparece el ícono 🦁 en la barra de Chrome

## Cómo usar

1. Abrir **web.whatsapp.com**
2. Click en el **botón dorado 🦁** que aparece en el borde derecho
3. Se abre el panel CRM con todos los prospectos
4. Al abrir un chat, el panel resalta automáticamente ese prospecto

## Configurar servidor (si cambia la URL de Render)

1. Click en el ícono 🦁 de la barra de Chrome
2. En el popup → cambiar la URL del servidor
3. Click "Guardar URL"

## Estructura de archivos

```
crm_extension/
├── manifest.json     ← Configuración extensión (Chrome MV3)
├── content.js        ← Panel inyectado en WhatsApp Web
├── sidebar.css       ← Estilos del panel lateral
├── popup.html        ← Popup del ícono de Chrome
├── popup.js          ← Lógica del popup
└── icons/
    └── icon128.jpg   ← Ícono del león dorado
```
