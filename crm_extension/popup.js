/**
 * popup.js — Realty ONE CRM Extension
 * ponytail: lógica mínima del popup — guardar URL, abrir panel, abrir pestaña
 */

const DEFAULT_URL = 'https://realty-one-bolivia.onrender.com/ingreso_leads.html?key=ONE2026';

// Cargar URL guardada al abrir popup
chrome.storage.local.get(['rog_crm_url'], (r) => {
  const url = r.rog_crm_url || DEFAULT_URL;
  document.getElementById('crm-url-input').value = url;
  checkServerStatus(url);
});

// Guardar URL personalizada
document.getElementById('save-url-btn').addEventListener('click', () => {
  const url = document.getElementById('crm-url-input').value.trim();
  if (!url) return;
  chrome.storage.local.set({ rog_crm_url: url }, () => {
    // Notificar content script de la URL nueva
    sendToActiveWATab({ type: 'ROG_UPDATE_URL', url });
    const msg = document.getElementById('saved-msg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 2000);
  });
});

// Abrir/togglear panel en WhatsApp Web
document.getElementById('open-panel-btn').addEventListener('click', () => {
  sendToActiveWATab({ type: 'ROG_TOGGLE' });
  window.close();
});

// Abrir CRM en pestaña nueva
document.getElementById('open-tab-btn').addEventListener('click', () => {
  chrome.storage.local.get(['rog_crm_url'], (r) => {
    const url = r.rog_crm_url || DEFAULT_URL;
    chrome.tabs.create({ url });
  });
});

// Verificar si el servidor CRM responde
function checkServerStatus(url) {
  const statusEl = document.getElementById('server-status');
  try {
    const healthUrl = new URL(url);
    healthUrl.pathname = '/api/health';
    fetch(healthUrl.toString(), { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined })
      .then(r => {
        statusEl.textContent = r.ok ? '🟢 En línea' : '🔴 Error';
        statusEl.style.color = r.ok ? '#4caf50' : '#f44';
      })
      .catch(() => {
        statusEl.textContent = '🔴 Sin respuesta';
        statusEl.style.color = '#f44';
      });
  } catch {
    statusEl.textContent = '⚠️ URL inválida';
    statusEl.style.color = '#ff9800';
  }
}

// Enviar mensaje al content script de la pestaña activa de WhatsApp
function sendToActiveWATab(msg) {
  chrome.tabs.query({ url: 'https://web.whatsapp.com/*', active: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, msg);
    } else {
      // Buscar cualquier pestaña de WA
      chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, (allTabs) => {
        if (allTabs && allTabs.length > 0) {
          chrome.tabs.sendMessage(allTabs[0].id, msg);
          chrome.tabs.update(allTabs[0].id, { active: true });
        } else {
          chrome.tabs.create({ url: 'https://web.whatsapp.com' });
        }
      });
    }
  });
}
