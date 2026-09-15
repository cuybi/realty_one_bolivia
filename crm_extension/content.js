/**
 * content.js — Realty ONE CRM Extension
 * Inyecta botón + panel sidebar en web.whatsapp.com
 * ponytail: mínimo viable — botón toggle + iframe CRM + detección de chat activo
 */

const CRM_URL = 'https://realty-one-bolivia.onrender.com/ingreso_leads.html';
const STORAGE_KEY = 'rog_crm_open';

let sidebarOpen = false;
let currentContact = '';

// ─── Esperar a que WhatsApp cargue su UI ───────────────────────────────────
function waitForWA(selector, cb, maxMs = 20000) {
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
  const toggle = document.createElement('button');
  toggle.id = 'rog-crm-toggle';
  toggle.innerHTML = `<span class="rog-lion">🦁</span><span class="rog-label">CRM</span>`;
  toggle.title = 'Abrir panel CRM — Realty ONE';
  toggle.addEventListener('click', toggleSidebar);
  document.body.appendChild(toggle);

  // Sidebar contenedor
  const sidebar = document.createElement('div');
  sidebar.id = 'rog-crm-sidebar';
  sidebar.innerHTML = `
    <div id="rog-crm-header">
      <div class="rog-title">
        <span>🦁</span> Realty ONE CRM
      </div>
      <span id="rog-chat-badge"></span>
      <button id="rog-crm-close" title="Cerrar panel">✕</button>
    </div>
    <div id="rog-crm-loading">
      <div class="rog-spinner"></div>
      <span>Cargando CRM...</span>
    </div>
    <iframe id="rog-crm-frame" src="" allow="clipboard-read; clipboard-write"></iframe>
  `;
  document.body.appendChild(sidebar);

  document.getElementById('rog-crm-close').addEventListener('click', toggleSidebar);

  // Cargar iframe al abrir por primera vez
  const frame = document.getElementById('rog-crm-frame');
  frame.addEventListener('load', () => {
    document.getElementById('rog-crm-loading').classList.add('rog-hidden');
  });

  // Restaurar estado previo
  chrome.storage.local.get([STORAGE_KEY], (r) => {
    if (r[STORAGE_KEY]) openSidebar();
  });
}

// ─── Abrir / cerrar ────────────────────────────────────────────────────────
function openSidebar() {
  const sidebar = document.getElementById('rog-crm-sidebar');
  const frame = document.getElementById('rog-crm-frame');
  if (!sidebar) return;

  if (!frame.src) {
    document.getElementById('rog-crm-loading').classList.remove('rog-hidden');
    frame.src = CRM_URL;
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

// ─── Detectar chat activo y mostrarlo en el badge ─────────────────────────
function observeActiveChat() {
  // WhatsApp Web muestra el nombre del contacto activo en el encabezado del chat
  const observer = new MutationObserver(() => {
    // Selector del header del chat activo (nombre del contacto)
    const nameEl =
      document.querySelector('[data-testid="conversation-header"] [data-testid="conversation-info-header-chat-title"] span') ||
      document.querySelector('header [data-testid="conversation-info-header"] span[title]') ||
      document.querySelector('#main header span[title]') ||
      document.querySelector('#main header ._21S-L span');

    const name = nameEl ? (nameEl.getAttribute('title') || nameEl.textContent || '').trim() : '';

    if (name && name !== currentContact) {
      currentContact = name;
      updateChatBadge(name);
      // Notificar al iframe del CRM para que filtre por ese contacto
      notifyCRMFrame(name);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
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

function notifyCRMFrame(contactName) {
  const frame = document.getElementById('rog-crm-frame');
  if (!frame || !frame.contentWindow) return;
  try {
    frame.contentWindow.postMessage(
      { type: 'ROG_ACTIVE_CONTACT', name: contactName },
      '*'
    );
  } catch (e) {}
}

// ─── Init ─────────────────────────────────────────────────────────────────
waitForWA('#app', () => {
  buildSidebar();
  observeActiveChat();
});

// ─── Escuchar mensajes del popup ───────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'ROG_TOGGLE') {
    toggleSidebar();
  } else if (msg.type === 'ROG_UPDATE_URL') {
    const frame = document.getElementById('rog-crm-frame');
    if (frame) {
      frame.src = msg.url;
      document.getElementById('rog-crm-loading')?.classList.remove('rog-hidden');
    }
  }
});

