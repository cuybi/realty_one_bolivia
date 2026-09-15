/**
 * content.js — Realty ONE CRM Extension
 * Inyecta botón + panel sidebar en web.whatsapp.com
 * Utiliza chrome.runtime.getURL('panel.html') para eludir CSP de Meta
 */

const CRM_FRAME_URL = chrome.runtime.getURL('panel.html');
const STORAGE_KEY = 'rog_crm_open';

let sidebarOpen = false;
let currentContact = '';

// ─── Esperar a que WhatsApp cargue su UI ───────────────────────────────────
function waitForWA(selector, cb, maxMs = 25000) {
  const start = Date.now();
  const iv = setInterval(() => {
    const el = document.querySelector(selector);
    if (el) { clearInterval(iv); cb(el); return; }
    if (Date.now() - start > maxMs) clearInterval(iv);
  }, 500);
}

// ─── Construir el sidebar ─────────────────────────────────────────────────
function buildSidebar() {
  if (document.getElementById('rog-crm-sidebar')) return;

  // Botón flotante toggle
  const logoUrl = chrome.runtime.getURL('icons/logo_one.png');
  const toggle = document.createElement('button');
  toggle.id = 'rog-crm-toggle';
  toggle.innerHTML = `
    <img class="rog-logo" src="${logoUrl}" alt="ONE" />
    <span class="rog-label">INGRESO LEADS</span>
  `;
  toggle.title = 'Realty ONE — Ingreso Leads';
  toggle.addEventListener('click', toggleSidebar);
  document.body.appendChild(toggle);

  // Sidebar contenedor
  const sidebar = document.createElement('div');
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

  document.getElementById('rog-crm-close').addEventListener('click', toggleSidebar);

  // Ocultar spinner cuando cargue el iframe local
  const frame = document.getElementById('rog-crm-frame');
  frame.addEventListener('load', () => {
    const loader = document.getElementById('rog-crm-loading');
    if (loader) loader.classList.add('rog-hidden');
    // Enviar el contacto activo de inmediato si ya lo tenemos
    if (currentContact) {
      notifyCRMFrame(currentContact);
    }
  });

  // Restaurar estado previo (si estaba abierto)
  chrome.storage.local.get([STORAGE_KEY], (r) => {
    if (r[STORAGE_KEY]) openSidebar();
  });
}

// ─── Abrir / cerrar ────────────────────────────────────────────────────────
function openSidebar() {
  const sidebar = document.getElementById('rog-crm-sidebar');
  const frame = document.getElementById('rog-crm-frame');
  if (!sidebar) return;

  if (!frame.src || frame.src === 'about:blank' || !frame.src.startsWith('chrome-extension://')) {
    const loader = document.getElementById('rog-crm-loading');
    if (loader) loader.classList.remove('rog-hidden');
    frame.src = CRM_FRAME_URL;
  }

  sidebar.classList.add('rog-open');
  document.body.classList.add('rog-panel-open');
  sidebarOpen = true;
  chrome.storage.local.set({ [STORAGE_KEY]: true });
}

function closeSidebar() {
  const sidebar = document.getElementById('rog-crm-sidebar');
  if (!sidebar) return;
  sidebar.classList.remove('rog-open');
  document.body.classList.remove('rog-panel-open');
  sidebarOpen = false;
  chrome.storage.local.set({ [STORAGE_KEY]: false });
}

function toggleSidebar() {
  sidebarOpen ? closeSidebar() : openSidebar();
}

// ─── Detectar chat activo y sincronizar con CRM ───────────────────────────
function observeActiveChat() {
  const checkActiveChat = () => {
    // Selectores para el encabezado del chat activo en WhatsApp Web
    const nameEl =
      document.querySelector('[data-testid="conversation-header"] [data-testid="conversation-info-header-chat-title"] span') ||
      document.querySelector('header [data-testid="conversation-info-header"] span[title]') ||
      document.querySelector('#main header span[title]') ||
      document.querySelector('#main header ._21S-L span') ||
      document.querySelector('#main header [role="button"] span[title]');

    // Intentar extraer teléfono o subtexto si está visible
    const phoneEl = document.querySelector('#main header span[data-testid="chat-subtitle"]') ||
                    document.querySelector('#main header ._amid');

    const name = nameEl ? (nameEl.getAttribute('title') || nameEl.textContent || '').trim() : '';
    const phone = phoneEl ? (phoneEl.textContent || '').trim() : '';

    if (name && name !== currentContact) {
      currentContact = name;
      updateChatBadge(name);
      notifyCRMFrame(name, phone);
    }
  };

  const observer = new MutationObserver(checkActiveChat);
  observer.observe(document.body, { childList: true, subtree: true });

  // También polling cada 1.5s por robustez si las mutaciones son lentas
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
waitForWA('#app', () => {
  buildSidebar();
  observeActiveChat();
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

