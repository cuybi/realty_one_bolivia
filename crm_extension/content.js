/**
 * content.js — Realty ONE CRM Extension
 * Inyecta botón + panel sidebar en web.whatsapp.com
 * Utiliza chrome.runtime.getURL('panel.html') para eludir CSP de Meta
 */

const CRM_FRAME_URL = chrome.runtime.getURL('panel.html');
const STORAGE_KEY = 'rog_crm_open';

let sidebarOpen = false;
let currentContact = '';

console.log('[Realty ONE CRM] Extension content script cargado en WhatsApp Web');

// ─── Construir el sidebar ─────────────────────────────────────────────────
function buildSidebar() {
  if (document.getElementById('rog-crm-sidebar') && document.getElementById('rog-crm-toggle')) {
    return;
  }

  if (!document.body) {
    setTimeout(buildSidebar, 200);
    return;
  }

  const logoUrl = chrome.runtime.getURL('icons/logo_one.png');

  // 1. Botón flotante toggle
  let toggle = document.getElementById('rog-crm-toggle');
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.id = 'rog-crm-toggle';
    toggle.innerHTML = `
      <img class="rog-logo" src="${logoUrl}" alt="ONE" />
      <span class="rog-label">INGRESO LEADS</span>
    `;
    toggle.title = 'Realty ONE — Ingreso Leads (Presiona o usa Alt + L)';
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });
    document.body.appendChild(toggle);
  }

  // 2. Sidebar contenedor
  let sidebar = document.getElementById('rog-crm-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'rog-crm-sidebar';
    sidebar.innerHTML = `
      <div id="rog-crm-header">
        <div class="rog-title">
          <img class="rog-header-logo" src="${logoUrl}" alt="ONE" /> Realty ONE • Ingreso Leads
        </div>
        <span id="rog-chat-badge"></span>
        <button id="rog-crm-close" title="Cerrar panel">✕</button>
      </div>
      <div id="rog-crm-loading">
        <div class="rog-spinner"></div>
        <span>Cargando Leads...</span>
      </div>
      <iframe id="rog-crm-frame" src="" allow="clipboard-read; clipboard-write"></iframe>
    `;
    document.body.appendChild(sidebar);

    document.getElementById('rog-crm-close').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });

    // Ocultar spinner cuando cargue el iframe local
    const frame = document.getElementById('rog-crm-frame');
    frame.addEventListener('load', () => {
      const loader = document.getElementById('rog-crm-loading');
      if (loader) loader.classList.add('rog-hidden');
      if (currentContact) {
        notifyCRMFrame(currentContact);
      }
    });

    // Restaurar estado previo (si estaba abierto)
    try {
      chrome.storage.local.get([STORAGE_KEY], (r) => {
        if (r && r[STORAGE_KEY]) openSidebar();
      });
    } catch (e) {}
  }
}

// ─── Abrir / cerrar ────────────────────────────────────────────────────────
function openSidebar() {
  let sidebar = document.getElementById('rog-crm-sidebar');
  if (!sidebar) {
    buildSidebar();
    sidebar = document.getElementById('rog-crm-sidebar');
  }
  if (!sidebar) return;

  const frame = document.getElementById('rog-crm-frame');
  if (frame && (!frame.src || frame.src === 'about:blank' || !frame.src.startsWith('chrome-extension://'))) {
    const loader = document.getElementById('rog-crm-loading');
    if (loader) loader.classList.remove('rog-hidden');
    frame.src = CRM_FRAME_URL;
  }

  sidebar.classList.add('rog-open');
  document.body.classList.add('rog-panel-open');
  sidebarOpen = true;
  try {
    chrome.storage.local.set({ [STORAGE_KEY]: true });
  } catch (e) {}
}

function closeSidebar() {
  const sidebar = document.getElementById('rog-crm-sidebar');
  if (!sidebar) return;
  sidebar.classList.remove('rog-open');
  document.body.classList.remove('rog-panel-open');
  sidebarOpen = false;
  try {
    chrome.storage.local.set({ [STORAGE_KEY]: false });
  } catch (e) {}
}

function toggleSidebar() {
  sidebarOpen ? closeSidebar() : openSidebar();
}

// ─── Detectar chat activo y sincronizar con CRM ───────────────────────────
function isValidContactName(text) {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  const invalidPhrases = [
    'haz clic',
    'click here',
    'toca aquí',
    'información de',
    'información del',
    'en línea',
    'online',
    'escribiendo',
    'typing',
    'visto por última',
    'last seen'
  ];
  return !invalidPhrases.some(p => lower.includes(p));
}

function extractContactFromHeader() {
  const header = document.querySelector('#main header');
  if (!header) return { name: '', phone: '' };

  let name = '';
  let phone = '';

  const titleEls = header.querySelectorAll('[data-testid="conversation-info-header-chat-title"] span, span[dir="auto"], span[title]');
  for (const el of titleEls) {
    const val = (el.getAttribute('title') || el.textContent || '').trim();
    if (val && isValidContactName(val)) {
      name = val;
      break;
    }
  }

  const subEls = header.querySelectorAll('[data-testid="chat-subtitle"], ._amid, span[dir="auto"]');
  for (const el of subEls) {
    const text = (el.textContent || '').trim();
    if (text && text !== name && isValidContactName(text) && /[0-9+() -]{6,}/.test(text)) {
      phone = text;
      break;
    }
  }

  return { name, phone };
}

function observeActiveChat() {
  const checkActiveChat = () => {
    const { name, phone } = extractContactFromHeader();

    if (name && name !== currentContact) {
      currentContact = name;
      updateChatBadge(name);
      notifyCRMFrame(name, phone);
    }
  };

  const observer = new MutationObserver(checkActiveChat);
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(checkActiveChat, 1500);
}

function updateChatBadge(name) {
  const badge = document.getElementById('rog-chat-badge');
  if (!badge) return;
  if (name) {
    badge.textContent = `💬 ${name}`;
    badge.classList.add('rog-visible');
  } else {
    badge.classList.remove('rog-visible');
  }
}

function notifyCRMFrame(contactName, contactPhone = '') {
  const frame = document.getElementById('rog-crm-frame');
  if (!frame || !frame.contentWindow) return;
  try {
    frame.contentWindow.postMessage(
      { type: 'ROG_ACTIVE_CONTACT', name: contactName, phone: contactPhone },
      '*'
    );
  } catch (e) {
    console.warn('[Realty ONE CRM] Error notifying frame:', e);
  }
}

// ─── Inicialización al cargar WhatsApp Web ────────────────────────────────
function init() {
  buildSidebar();
  observeActiveChat();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Auto-recuperación cada 2s para asegurar que el botón siempre exista
setInterval(() => {
  if (!document.getElementById('rog-crm-sidebar') || !document.getElementById('rog-crm-toggle')) {
    buildSidebar();
  }
}, 2000);

// Atajo de teclado: Alt + L para alternar el panel
window.addEventListener('keydown', (e) => {
  if (e.altKey && (e.key === 'l' || e.key === 'L')) {
    e.preventDefault();
    toggleSidebar();
  }
});

// ─── Escuchar mensajes del popup de la extensión ───────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ROG_TOGGLE') {
    toggleSidebar();
  }
});

// ─── Escuchar mensajes del Iframe (panel.js) para inserción directa en WhatsApp Web ───
window.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'ROG_INSERT_WHATSAPP_CHAT') return;
  const text = event.data.text;
  if (!text) return;

  insertTextIntoWhatsAppInput(text);
});

function insertTextIntoWhatsAppInput(text) {
  const selectors = [
    '#main footer [contenteditable="true"][data-tab="10"]',
    '#main footer div[contenteditable="true"]',
    'footer div[contenteditable="true"]',
    '[data-testid="conversation-compose-box-input"]',
    'div[title="Escribe un mensaje aquí"]',
    'div[title="Type a message"]'
  ];

  let inputEl = null;
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) {
      inputEl = el;
      break;
    }
  }

  if (inputEl) {
    inputEl.focus();
    // 1. Usar execCommand para actualizar el estado reactivo de WhatsApp Web
    const ok = document.execCommand('insertText', false, text);
    if (!ok) {
      // Fallback
      inputEl.textContent = text;
      inputEl.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: text }));
    }
  }
}

