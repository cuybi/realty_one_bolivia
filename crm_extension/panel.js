/**
 * panel.js — Realty ONE Group Bolivia CRM Panel
 * Inyectado como iframe extension-page en WhatsApp Web
 * Módulos: Tablero Kanban (Drag & Drop), Ficha Lead, Recordatorios, Respuestas Rápidas y Difusión
 */

const BACKEND_URL = 'https://realty-one-bolivia.onrender.com';
const ADMIN_KEY = 'ONE2026';
const CACHE_KEY = 'rog_cached_leads';
const REMINDERS_KEY = 'rog_reminders_list';

let allLeads = [];
let allReminders = [];
let currentFilter = 'TODAS';
let currentSearch = '';
let currentKanbanSearch = '';
let activeLead = null;
let activeContactData = null;
let isExpanded = false;

// ─── Plantillas Inmobiliarias Ampliadas ─────────────────────────────────────
const TEMPLATES_CATALOG = [
  {
    id: 'bienvenida',
    categoria: 'Atención Inicial',
    titulo: '👋 Bienvenida Oficial Realty ONE',
    texto: '¡Hola! Gracias por comunicarte con Realty ONE Group Bolivia. Mi nombre es Marcos Antezana Lenz. ¿En qué tipo de propiedad o zona estás interesado en Santa Cruz?'
  },
  {
    id: 'agendar',
    categoria: 'Visitas',
    titulo: '📅 Agendar Visita Inmobiliaria',
    texto: '📅 ¡Con gusto coordinamos una visita! Disponemos de horarios hoy por la tarde o mañana en la mañana. ¿Qué horario te queda más cómodo para que te reserve el espacio?'
  },
  {
    id: 'catalogo',
    categoria: 'Inventario',
    titulo: '🏠 Catálogo Exclusivo Urubó & Equipetrol',
    texto: '🏠 *Catálogo Inmobiliario Realty ONE Group*:\nDisponemos de casas, departamentos, terrenos y anticréticos exclusivos con alta plusvalía. ¿Qué características y rango de presupuesto buscas aproximado?'
  },
  {
    id: 'requisitos',
    categoria: 'Operación',
    titulo: '📋 Requisitos de Operación & Anticrético',
    texto: '📋 *Requisitos generales para la operación*:\n1. Cédula de Identidad vigente.\n2. Verificación de folio real en Derechos Reales (asesoría legal incluida).\n3. Reserva formal para bloqueo de unidad.'
  },
  {
    id: 'credito',
    categoria: 'Financiamiento',
    titulo: '🏦 Asesoría de Crédito de Vivienda',
    texto: '🏦 Trabajamos con todos los bancos del sistema financiero boliviano para crédito de vivienda social o comercial. ¿Cuentas ya con precalificación o deseas que te contactemos con un oficial de crédito?'
  },
  {
    id: 'cierre',
    categoria: 'Negociación',
    titulo: '🏆 Oferta Formal y Bloqueo',
    texto: '¡Excelente decisión! Para presentar la carta de intención de compra / alquiler al propietario y asegurar el precio acordado, podemos redactar la reserva hoy mismo.'
  }
];

// ─── Inicialización ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initTabs();
  initKanbanDragAndDrop();
  loadCachedLeads();
  loadReminders();
  renderTemplatesFullGrid();
  fetchFreshLeads();

  // Polling silencioso cada 12s para sincronizar
  setInterval(fetchFreshLeads, 12000);
});

function initUI() {
  // Botones de cabecera
  document.getElementById('btn-refresh').addEventListener('click', () => {
    setSyncStatus('syncing', 'Sincronizando...');
    fetchFreshLeads();
  });

  document.getElementById('btn-open-full').addEventListener('click', () => {
    const fullUrl = `${BACKEND_URL}/ingreso_leads.html?key=${ADMIN_KEY}`;
    window.open(fullUrl, '_blank');
  });

  // Botón expandir tablero a formato panorámico
  const expandBtn = document.getElementById('btn-toggle-expand');
  if (expandBtn) {
    expandBtn.addEventListener('click', toggleExpandSidebar);
  }

  // Exportar Excel
  const exportBtn1 = document.getElementById('btn-export-excel');
  if (exportBtn1) exportBtn1.addEventListener('click', exportToExcel);

  const exportBtn2 = document.getElementById('btn-export-excel-banner');
  if (exportBtn2) exportBtn2.addEventListener('click', exportToExcel);

  // Buscador lista
  const searchInput = document.getElementById('leads-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      renderLeadsList();
    });
  }

  // Buscador Kanban
  const kanbanSearchInput = document.getElementById('kanban-search');
  if (kanbanSearchInput) {
    kanbanSearchInput.addEventListener('input', (e) => {
      currentKanbanSearch = e.target.value.toLowerCase().trim();
      renderKanbanBoard();
    });
  }

  // Filtros de pipeline
  document.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderLeadsList();
    });
  });

  // Controles de lead activo
  document.getElementById('lead-stage').addEventListener('change', (e) => {
    updateActiveLeadField('etapa_embudo', e.target.value);
  });

  document.getElementById('lead-priority').addEventListener('change', (e) => {
    updateActiveLeadField('prioridad', e.target.value);
  });

  document.getElementById('lead-realtor').addEventListener('change', (e) => {
    updateActiveLeadField('e_realtor_id', e.target.value);
  });

  document.getElementById('btn-save-note').addEventListener('click', saveQuickNote);

  // Guardar recordatorio
  const saveRemBtn = document.getElementById('btn-save-reminder');
  if (saveRemBtn) saveRemBtn.addEventListener('click', saveReminder);

  // Plantillas chips de lead activo
  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const templateKey = chip.dataset.template;
      const found = TEMPLATES_CATALOG.find(t => t.id === templateKey);
      if (found) {
        copyAndInsertText(found.texto, chip);
      }
    });
  });

  // Selector de audiencia para difusión masiva
  const audSelect = document.getElementById('broadcast-audience');
  if (audSelect) {
    audSelect.addEventListener('change', renderBroadcastQueue);
  }

  // Escuchar mensajes de WhatsApp (content.js)
  window.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'ROG_ACTIVE_CONTACT') {
      handleActiveContactFromWA(event.data.name, event.data.phone);
    } else if (event.data.type === 'ROG_NAVIGATE_TAB') {
      switchTab(event.data.tab);
    }
  });
}

function toggleExpandSidebar() {
  isExpanded = !isExpanded;
  try {
    window.parent.postMessage({ type: 'ROG_TOGGLE_EXPAND', expanded: isExpanded }, '*');
  } catch (e) {}

  const btn = document.getElementById('btn-toggle-expand');
  if (btn) {
    btn.textContent = isExpanded ? '🗗' : '⛶';
    btn.title = isExpanded ? 'Reducir a panel estándar' : 'Expandir a tablero panorámico';
  }
}

// ─── Pestañas de Navegación ────────────────────────────────────────────────
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.view);
    });
  });
}

function switchTab(viewId) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === viewId);
  });

  document.querySelectorAll('.view-panel').forEach(p => {
    p.classList.toggle('active', p.id === `view-${viewId}`);
  });

  if (viewId === 'kanban') {
    renderKanbanBoard();
  } else if (viewId === 'reminders') {
    renderRemindersList();
  } else if (viewId === 'broadcast') {
    renderBroadcastQueue();
  }
}

// ─── Sincronización con API / Backend ──────────────────────────────────────
function setSyncStatus(status, text) {
  const badge = document.getElementById('sync-indicator');
  if (!badge) return;
  badge.className = `sync-badge ${status}`;
  badge.textContent = text;
}

function loadCachedLeads() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([CACHE_KEY], (res) => {
      if (res[CACHE_KEY] && Array.isArray(res[CACHE_KEY]) && res[CACHE_KEY].length > 0) {
        allLeads = res[CACHE_KEY];
        renderLeadsList();
        renderKanbanBoard();
        updateCounters();
      }
    });
  }
}

async function fetchFreshLeads() {
  try {
    let rawData = null;

    // 1. Probar backend local (localhost:3000)
    try {
      const localRes = await fetch('http://localhost:3000/api/leads', { signal: AbortSignal.timeout(1500) });
      if (localRes.ok) {
        const localData = await localRes.json();
        if (Array.isArray(localData) && localData.length > 0) {
          rawData = localData.map(l => ({
            id: l.id,
            cliente_nombre: l.nombre || l.cliente_nombre || 'Prospecto',
            numero_celular: l.celular || l.numero_celular || '',
            prioridad: (l.prioridad || 'POTENCIAL').toUpperCase(),
            etapa_embudo: l.etapa_embudo || (l.fecha_visita ? 'VISITA_AGENDADA' : 'SOLICITUD'),
            e_realtor_id: l.agente_slug === 'marcos-antezana' ? 'marcos_antezana' : (l.e_realtor_id || 'marcos_antezana'),
            e_realtor_asignado: l.agente_nombre || 'Marcos Antezana Lenz',
            zona_interes: l.zona_interes || l.zona || 'Santa Cruz (General)',
            notas_asesor: l.notas || l.notas_asesor || '',
            presupuesto: l.presupuesto_usd ? `$us ${l.presupuesto_usd}` : (l.presupuesto || ''),
            fecha_creacion: l.fecha || new Date().toISOString()
          }));
        }
      }
    } catch (_) {}

    // 2. Si no hay datos locales, sincronizar con nube Render
    if (!rawData) {
      const res = await fetch(`${BACKEND_URL}/api/whatsapp/leads?key=${ADMIN_KEY}`, {
        headers: {
          'x-admin-key': ADMIN_KEY,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rawData = await res.json();
    }

    let leadsList = [];
    if (Array.isArray(rawData)) {
      leadsList = rawData;
    } else if (rawData && Array.isArray(rawData.leads)) {
      leadsList = rawData.leads;
    }

    allLeads = leadsList;
    setSyncStatus('online', 'En Línea 🟢');

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [CACHE_KEY]: allLeads });
    }

    renderLeadsList();
    renderKanbanBoard();
    updateCounters();

    if (activeContactData) {
      matchOrCreateActiveLead(activeContactData.name, activeContactData.phone);
    }
  } catch (err) {
    console.warn('[Realty ONE CRM] Sync notice:', err.message);
    setSyncStatus('offline', 'Reconectando...');
    if (allLeads.length === 0) {
      renderLeadsList();
      renderKanbanBoard();
    }
  }
}

// ─── Contacto Activo en WhatsApp ───────────────────────────────────────────
function handleActiveContactFromWA(name, phone = '') {
  if (!name && !phone) return;
  activeContactData = { name: (name || '').trim(), phone: (phone || '').trim() };

  document.getElementById('active-contact-name').textContent = activeContactData.name || 'Chat Sin Nombre';
  document.getElementById('active-contact-phone').textContent = activeContactData.phone || '';
  document.getElementById('active-contact-time').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  matchOrCreateActiveLead(activeContactData.name, activeContactData.phone);
}

function matchOrCreateActiveLead(name, phone) {
  const normName = (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

  let match = allLeads.find(l => {
    const lName = (l.cliente_nombre || l.nombre || l.cliente || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const lPhone = (l.numero_celular || l.telefono || l.telefono_cliente || '').replace(/[^0-9]/g, '');
    if (cleanPhone && cleanPhone.length >= 7 && lPhone && (lPhone.includes(cleanPhone) || cleanPhone.includes(lPhone))) return true;
    if (normName && normName.length >= 4 && lName && (lName.includes(normName) || normName.includes(lName))) return true;
    return false;
  });

  activeLead = match;

  const controls = document.getElementById('active-lead-controls');
  const noMsg = document.getElementById('no-contact-msg');

  if (activeLead) {
    controls.classList.remove('hidden');
    noMsg.style.display = 'none';

    document.getElementById('lead-stage').value = activeLead.etapa_embudo || 'SOLICITUD';
    document.getElementById('lead-priority').value = (activeLead.prioridad || 'POTENCIAL').toUpperCase();
    document.getElementById('lead-realtor').value = activeLead.e_realtor_id || 'marcos_antezana';
    document.getElementById('quick-note-input').value = '';
    document.getElementById('quick-note-input').placeholder = 'Escribir nueva nota sobre este prospecto...';
  } else {
    controls.classList.remove('hidden');
    noMsg.style.display = 'none';
    document.getElementById('lead-stage').value = 'SOLICITUD';
    document.getElementById('lead-priority').value = 'POTENCIAL';
    document.getElementById('lead-realtor').value = 'marcos_antezana';
    document.getElementById('quick-note-input').value = '';
    document.getElementById('quick-note-input').placeholder = 'Guardar nota para registrar como nuevo prospecto...';
  }

  highlightSelectedLeadItem(activeLead ? activeLead.id : null);
}

async function updateActiveLeadField(field, value) {
  if (!activeLead) {
    await createLeadFromActiveContact({ [field]: value });
    return;
  }

  activeLead[field] = value;
  if (field === 'e_realtor_id') {
    const realtorMap = {
      'marcos_antezana': 'Marcos Antezana Lenz',
      'carlos_rodriguez': 'Carlos Rodríguez',
      'valeria_suarez': 'Valeria Suárez',
      'andres_montano': 'Andrés Montaño',
      'lucia_vaca': 'Lucía Vaca',
      'robert_oliva': 'Robert Oliva'
    };
    activeLead.e_realtor_asignado = realtorMap[value] || value;
  }

  renderLeadsList();
  renderKanbanBoard();

  try {
    await fetch(`${BACKEND_URL}/api/whatsapp/leads/${activeLead.id}?key=${ADMIN_KEY}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      },
      body: JSON.stringify({ [field]: value })
    });
  } catch (err) {
    console.warn('[Realty ONE CRM] Error al actualizar lead:', err.message);
  }
}

async function saveQuickNote() {
  const input = document.getElementById('quick-note-input');
  const note = input.value.trim();
  if (!note) return;

  const btn = document.getElementById('btn-save-note');
  btn.textContent = 'Guardando...';

  if (!activeLead) {
    await createLeadFromActiveContact({ notas_asesor: note });
    input.value = '';
    btn.textContent = '¡Registrado! ✓';
    setTimeout(() => { btn.textContent = 'Guardar'; }, 1500);
    return;
  }

  const existingNotes = activeLead.notas_asesor || activeLead.notas || '';
  const dateTag = new Date().toLocaleDateString();
  const newNotes = existingNotes ? `${existingNotes}\n[${dateTag}] ${note}` : `[${dateTag}] ${note}`;
  activeLead.notas_asesor = newNotes;

  try {
    await fetch(`${BACKEND_URL}/api/whatsapp/leads/${activeLead.id}?key=${ADMIN_KEY}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      },
      body: JSON.stringify({ notas_asesor: newNotes })
    });
    input.value = '';
    btn.textContent = '¡Listo! ✓';
    setTimeout(() => { btn.textContent = 'Guardar'; }, 1500);
  } catch (err) {
    btn.textContent = 'Error';
    setTimeout(() => { btn.textContent = 'Guardar'; }, 1500);
  }
}

async function createLeadFromActiveContact(extraFields = {}) {
  if (!activeContactData) return;

  const newLeadData = {
    id: `lead_${Date.now()}_ext`,
    cliente_nombre: activeContactData.name || 'Prospecto WhatsApp',
    numero_celular: activeContactData.phone || '',
    canal_origen: 'WhatsApp Web Panel',
    prioridad: document.getElementById('lead-priority').value || 'POTENCIAL',
    etapa_embudo: document.getElementById('lead-stage').value || 'SOLICITUD',
    e_realtor_id: document.getElementById('lead-realtor').value || 'marcos_antezana',
    e_realtor_asignado: 'Marcos Antezana Lenz',
    fecha_creacion: new Date().toISOString(),
    ...extraFields
  };

  allLeads.unshift(newLeadData);
  activeLead = newLeadData;
  renderLeadsList();
  renderKanbanBoard();
  updateCounters();

  try {
    await fetch(`${BACKEND_URL}/api/whatsapp/leads?key=${ADMIN_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_KEY
      },
      body: JSON.stringify(newLeadData)
    });
  } catch (err) {
    console.warn('[Realty ONE CRM] Error guardando nuevo lead:', err.message);
  }
}

// ─── TABLERO KANBAN (DRAG & DROP) ──────────────────────────────────────────
const STAGES = ['SOLICITUD', 'CONTACTADO', 'VISITA_AGENDADA', 'PROPUESTA', 'CIERRE', 'PERDIDO'];

function initKanbanDragAndDrop() {
  document.querySelectorAll('.col-cards').forEach(container => {
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      container.classList.add('drag-over');
    });

    container.addEventListener('dragleave', () => {
      container.classList.remove('drag-over');
    });

    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      container.classList.remove('drag-over');

      const leadId = e.dataTransfer.getData('text/plain');
      const targetStage = container.dataset.stage;

      if (!leadId || !targetStage) return;

      const lead = allLeads.find(l => String(l.id) === String(leadId));
      if (lead && lead.etapa_embudo !== targetStage) {
        lead.etapa_embudo = targetStage;
        if (activeLead && String(activeLead.id) === String(lead.id)) {
          const stageSelect = document.getElementById('lead-stage');
          if (stageSelect) stageSelect.value = targetStage;
        }

        renderKanbanBoard();
        renderLeadsList();
        updateCounters();

        try {
          await fetch(`${BACKEND_URL}/api/whatsapp/leads/${lead.id}?key=${ADMIN_KEY}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-key': ADMIN_KEY
            },
            body: JSON.stringify({ etapa_embudo: targetStage })
          });
        } catch (err) {
          console.warn('[Kanban] Error actualizando etapa:', err);
        }
      }
    });
  });
}

function renderKanbanBoard() {
  const counts = { SOLICITUD: 0, CONTACTADO: 0, VISITA_AGENDADA: 0, PROPUESTA: 0, CIERRE: 0, PERDIDO: 0 };
  let hotCount = 0;

  let filtered = allLeads;
  if (currentKanbanSearch) {
    filtered = filtered.filter(l => {
      const name = (l.cliente_nombre || l.nombre || l.cliente || '').toLowerCase();
      const phone = (l.numero_celular || l.telefono || '').toLowerCase();
      const zone = (l.zona_interes || l.tipo_interes || '').toLowerCase();
      return name.includes(currentKanbanSearch) || phone.includes(currentKanbanSearch) || zone.includes(currentKanbanSearch);
    });
  }

  // Limpiar contenedores
  STAGES.forEach(s => {
    const el = document.querySelector(`.col-cards[data-stage="${s}"]`);
    if (el) el.innerHTML = '';
  });

  filtered.forEach(lead => {
    const stage = (lead.etapa_embudo || 'SOLICITUD').toUpperCase();
    if (counts[stage] !== undefined) counts[stage]++;

    const priority = (lead.prioridad || 'POTENCIAL').toUpperCase();
    if (priority === 'POTENCIAL') hotCount++;

    const container = document.querySelector(`.col-cards[data-stage="${stage}"]`);
    if (!container) return;

    const name = lead.cliente_nombre || lead.nombre || lead.cliente || 'Sin Nombre';
    const phone = lead.numero_celular || lead.telefono || '';
    const realtor = lead.e_realtor_asignado || lead.agente_nombre || 'Marcos Antezana Lenz';
    const zone = lead.zona_interes || lead.tipo_interes || '';
    const budget = lead.presupuesto || '';

    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.leadId = lead.id;

    card.innerHTML = `
      <div class="kc-top">
        <span class="kc-name" title="${name}">${name}</span>
        <span class="lead-priority ${priority}">${formatPriorityBadge(priority)}</span>
      </div>
      <div class="kc-mid">
        ${phone ? `<a class="kc-phone-btn" href="https://web.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, '')}" target="_top" title="Abrir chat en WhatsApp">💬 ${phone}</a>` : '<span>Sin Teléfono</span>'}
        ${budget ? `<span class="budget-tag">${budget}</span>` : ''}
      </div>
      <div class="kc-bottom">
        <span class="kc-realtor" title="${realtor}">👤 ${realtor}</span>
        ${zone ? `<span class="kc-zone" title="${zone}">📍 ${zone}</span>` : ''}
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', lead.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    // Clic en tarjeta selecciona el lead para edición
    card.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'a') return;
      activeLead = lead;
      handleActiveContactFromWA(name, phone);
      switchTab('lead');
    });

    container.appendChild(card);
  });

  // Actualizar contadores de cabecera de columnas
  STAGES.forEach(s => {
    const counterEl = document.getElementById(`count-stage-${s}`);
    if (counterEl) counterEl.textContent = counts[s] || 0;
  });

  const totalEl = document.getElementById('kanban-total-count');
  const hotEl = document.getElementById('kanban-hot-count');
  if (totalEl) totalEl.textContent = filtered.length;
  if (hotEl) hotEl.textContent = hotCount;
}

// ─── Renderizado de la Lista CRM ───────────────────────────────────────────
function renderLeadsList() {
  const container = document.getElementById('leads-list');
  if (!container) return;

  let filtered = allLeads;

  if (currentFilter !== 'TODAS') {
    filtered = filtered.filter(l => {
      const p = (l.prioridad || '').toUpperCase();
      const e = (l.etapa_embudo || '').toUpperCase();
      return p === currentFilter || e === currentFilter;
    });
  }

  if (currentSearch) {
    filtered = filtered.filter(l => {
      const name = (l.cliente_nombre || l.nombre || l.cliente || '').toLowerCase();
      const phone = (l.numero_celular || l.telefono || '').toLowerCase();
      const zone = (l.zona_interes || l.tipo_interes || '').toLowerCase();
      return name.includes(currentSearch) || phone.includes(currentSearch) || zone.includes(currentSearch);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span>No se encontraron prospectos ${currentSearch ? `para "${currentSearch}"` : ''}</span>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(lead => {
    const isSelected = activeLead && String(activeLead.id) === String(lead.id);
    const name = lead.cliente_nombre || lead.nombre || lead.cliente || 'Sin Nombre';
    const phone = lead.numero_celular || lead.telefono || lead.telefono_cliente || '';
    const priority = (lead.prioridad || 'INDECISO').toUpperCase();
    const stage = formatStage(lead.etapa_embudo || 'SOLICITUD');
    const realtor = lead.e_realtor_asignado || lead.agente_nombre || (lead.e_realtor_id === 'marcos_antezana' ? 'Marcos Antezana Lenz' : (lead.e_realtor_id || ''));
    const zone = lead.zona_interes || lead.tipo_interes || '';

    return `
      <div class="lead-item ${isSelected ? 'selected' : ''}" data-lead-id="${lead.id}">
        <div class="lead-top">
          <span class="lead-name" title="${name}">${name}</span>
          <span class="lead-priority ${priority}">${formatPriorityBadge(priority)}</span>
        </div>
        <div class="lead-mid">
          <span>${phone || 'Sin Celular'}</span>
          <span class="stage-badge">${stage}</span>
        </div>
        ${(realtor || zone) ? `
          <div class="lead-bottom">
            ${zone ? `<span class="zone-tag">📍 ${zone}</span>` : '<span></span>'}
            ${realtor ? `<span class="realtor-tag">👤 ${realtor}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  container.querySelectorAll('.lead-item').forEach(item => {
    item.addEventListener('click', () => {
      const leadId = item.dataset.leadId;
      const found = allLeads.find(l => String(l.id) === String(leadId));
      if (found) {
        activeLead = found;
        document.getElementById('active-contact-name').textContent = found.cliente_nombre || found.nombre || found.cliente;
        document.getElementById('active-contact-phone').textContent = found.numero_celular || found.telefono || '';
        document.getElementById('lead-stage').value = found.etapa_embudo || 'SOLICITUD';
        document.getElementById('lead-priority').value = (found.prioridad || 'POTENCIAL').toUpperCase();
        document.getElementById('lead-realtor').value = found.e_realtor_id || 'marcos_antezana';
        document.getElementById('active-lead-controls').classList.remove('hidden');
        document.getElementById('no-contact-msg').style.display = 'none';
        highlightSelectedLeadItem(found.id);
      }
    });
  });
}

function highlightSelectedLeadItem(leadId) {
  document.querySelectorAll('.lead-item').forEach(item => {
    if (leadId && item.dataset.leadId === String(leadId)) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

function updateCounters() {
  const allEl = document.getElementById('count-all');
  const potEl = document.getElementById('count-potencial');
  if (allEl) allEl.textContent = allLeads.length;
  if (potEl) potEl.textContent = allLeads.filter(l => (l.prioridad || '').toUpperCase() === 'POTENCIAL').length;
}

function formatStage(stage) {
  const map = {
    'SOLICITUD': '✨ Solicitud',
    'CONTACTADO': '📞 Contactado',
    'VISITA_AGENDADA': '📅 Visita',
    'PROPUESTA': '📝 Negociación',
    'CIERRE': '🏆 Ganado',
    'PERDIDO': '❌ Descartado'
  };
  return map[stage] || stage;
}

function formatPriorityBadge(prioridad) {
  const map = {
    'POTENCIAL': '🔥 ALTA',
    'INDECISO': '⚡ MEDIA',
    'PASIVO': '❄️ BAJA',
    'PROPIETARIO': '💼 CAPTACIÓN'
  };
  return map[prioridad] || prioridad;
}

// ─── RECORDATORIOS & AGENDA (FOLLOW-UP) ────────────────────────────────────
function loadReminders() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([REMINDERS_KEY], (res) => {
      if (res[REMINDERS_KEY] && Array.isArray(res[REMINDERS_KEY])) {
        allReminders = res[REMINDERS_KEY];
      } else {
        // Semilla por defecto con los prospectos activos
        allReminders = [
          {
            id: 'rem-1',
            cliente: 'Carla Bruun',
            telefono: '+591 77397850',
            fecha: new Date().toISOString().split('T')[0],
            hora: '16:00',
            nota: 'Confirmar visita a Casa de Lujo en Urubó con Marcos Antezana'
          },
          {
            id: 'rem-2',
            cliente: 'Robert Oliva',
            telefono: '+591 79878853',
            fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            hora: '10:30',
            nota: 'Enviar ficha técnica de Lote Mar Adentro'
          }
        ];
      }
      renderRemindersList();
    });
  }
}

function saveReminder() {
  const dateInput = document.getElementById('rem-date');
  const timeInput = document.getElementById('rem-time');
  const noteInput = document.getElementById('rem-note');

  const fecha = dateInput.value || new Date().toISOString().split('T')[0];
  const hora = timeInput.value || '10:00';
  const nota = noteInput.value.trim() || 'Seguimiento general de lead';

  const cliente = activeLead ? (activeLead.cliente_nombre || activeLead.nombre) : (activeContactData ? activeContactData.name : 'Prospecto WhatsApp');
  const telefono = activeLead ? (activeLead.numero_celular || activeLead.telefono) : (activeContactData ? activeContactData.phone : '');

  const newRem = {
    id: `rem_${Date.now()}`,
    cliente,
    telefono,
    fecha,
    hora,
    nota
  };

  allReminders.unshift(newRem);
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [REMINDERS_KEY]: allReminders });
  }

  noteInput.value = '';
  renderRemindersList();

  const btn = document.getElementById('btn-save-reminder');
  btn.textContent = '¡Recordatorio Agendado! ✓';
  setTimeout(() => { btn.textContent = '📅 Guardar Recordatorio'; }, 1500);
}

function renderRemindersList() {
  const container = document.getElementById('reminders-list');
  const countBadge = document.getElementById('reminders-count');
  if (countBadge) countBadge.textContent = allReminders.length;
  if (!container) return;

  if (allReminders.length === 0) {
    container.innerHTML = `<div class="empty-state">No hay recordatorios pendientes.</div>`;
    return;
  }

  container.innerHTML = allReminders.map(rem => {
    return `
      <div class="reminder-card">
        <div class="rem-info">
          <h5>${rem.cliente}</h5>
          <p>${rem.nota}</p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
          <span class="rem-time-tag">📅 ${rem.fecha} ${rem.hora}</span>
          ${rem.telefono ? `<button class="chip-btn" onclick="window.parent.postMessage({type:'ROG_INSERT_WHATSAPP_CHAT', text:'Hola ${rem.cliente}, le escribo para confirmar nuestro horario coordinado para hoy.'}, '*')" style="font-size:9.5px; padding:2px 6px;">💬 Escribir</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ─── PLANTILLAS AMPLIADAS ──────────────────────────────────────────────────
function renderTemplatesFullGrid() {
  const container = document.getElementById('templates-full-grid');
  if (!container) return;

  container.innerHTML = TEMPLATES_CATALOG.map(t => {
    return `
      <div class="template-card">
        <div class="template-card-header">
          <span class="template-card-title">${t.titulo}</span>
          <span class="badge-tag">${t.categoria}</span>
        </div>
        <div class="template-card-text">${t.texto}</div>
        <div class="template-card-actions">
          <button class="chip-btn" data-text="${encodeURIComponent(t.texto)}" onclick="copyDirectText(decodeURIComponent(this.dataset.text), this)">📋 Copiar</button>
          <button class="btn-template-insert" data-text="${encodeURIComponent(t.texto)}" onclick="insertDirectText(decodeURIComponent(this.dataset.text), this)">⚡ Pegar en WhatsApp</button>
        </div>
      </div>
    `;
  }).join('');
}

function copyDirectText(text, btn) {
  try {
    navigator.clipboard.writeText(text);
    const orig = btn.textContent;
    btn.textContent = '¡Copiado! ✓';
    setTimeout(() => { btn.textContent = orig; }, 1200);
  } catch (_) {}
}

function insertDirectText(text, btn) {
  copyAndInsertText(text, btn);
}

// ─── DIFUSIÓN MASIVA SEGMENTADA ────────────────────────────────────────────
function renderBroadcastQueue() {
  const audSelect = document.getElementById('broadcast-audience');
  const targetFilter = audSelect ? audSelect.value : 'POTENCIAL';
  const countEl = document.getElementById('broadcast-target-count');
  const listEl = document.getElementById('broadcast-queue-list');
  const msgTemplate = document.getElementById('broadcast-message-text').value;

  let targets = allLeads;
  if (targetFilter === 'POTENCIAL') {
    targets = targets.filter(l => (l.prioridad || '').toUpperCase() === 'POTENCIAL');
  } else if (targetFilter === 'VISITA_AGENDADA') {
    targets = targets.filter(l => (l.etapa_embudo || '').toUpperCase() === 'VISITA_AGENDADA');
  } else if (targetFilter === 'SOLICITUD') {
    targets = targets.filter(l => (l.etapa_embudo || '').toUpperCase() === 'SOLICITUD');
  }

  if (countEl) countEl.textContent = `${targets.length} contactos listos para difusión`;
  if (!listEl) return;

  if (targets.length === 0) {
    listEl.innerHTML = `<div class="empty-state">No hay prospectos en este segmento.</div>`;
    return;
  }

  listEl.innerHTML = targets.slice(0, 30).map(l => {
    const name = l.cliente_nombre || l.nombre || 'Cliente';
    const phone = l.numero_celular || l.telefono || '';
    const realtor = l.e_realtor_asignado || 'Marcos Antezana Lenz';
    const personalMsg = msgTemplate
      .replace(/{nombre}/g, name)
      .replace(/{asesor}/g, realtor)
      .replace(/{zona}/g, l.zona_interes || 'Santa Cruz');

    return `
      <div class="broadcast-lead-item">
        <div>
          <strong style="color:#fff; font-size:11.5px;">${name}</strong>
          <div style="font-size:10px; color:#888;">${phone || 'Sin número'} • ${formatStage(l.etapa_embudo || 'SOLICITUD')}</div>
        </div>
        <button class="broadcast-btn-send" data-msg="${encodeURIComponent(personalMsg)}" onclick="copyAndInsertText(decodeURIComponent(this.dataset.msg), this)">
          📤 Cargar Mensaje
        </button>
      </div>
    `;
  }).join('');
}

// ─── Funciones de Portapapeles e Inserción en WhatsApp Web ──────────────────
function copyAndInsertText(text, chipElement) {
  if (!text) return;

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (_) {}

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  try {
    window.parent.postMessage({
      type: 'ROG_INSERT_WHATSAPP_CHAT',
      text: text
    }, '*');
  } catch (e) {}

  if (chipElement) {
    const orig = chipElement.textContent;
    chipElement.textContent = '¡Copiado! ✓';
    chipElement.style.borderColor = '#25d366';
    chipElement.style.color = '#25d366';
    setTimeout(() => {
      chipElement.textContent = orig;
      chipElement.style.borderColor = '';
      chipElement.style.color = '';
    }, 1400);
  }
}

// ─── Exportar a Excel (.xls) ───────────────────────────────────────────────
function exportToExcel() {
  const leadsToExport = (allLeads && allLeads.length > 0) ? allLeads : [];
  if (leadsToExport.length === 0) {
    alert('No hay prospectos cargados para exportar.');
    return;
  }

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `RealtyONE_Leads_${dateStr}.xls`;

  let tableRows = '';
  leadsToExport.forEach(lead => {
    const id = lead.id || '';
    const fecha = lead.fecha_creacion || lead.created_at || '';
    const nombre = lead.cliente_nombre || lead.nombre || lead.cliente || 'Sin Nombre';
    const celular = lead.numero_celular || lead.telefono || lead.telefono_cliente || '';
    const prioridad = (lead.prioridad || 'INDECISO').toUpperCase();
    const etapa = lead.etapa_embudo || lead.etapa || 'SOLICITUD';
    const realtor = lead.e_realtor_asignado || lead.agente_nombre || 'Marcos Antezana Lenz';
    const zona = lead.zona_interes || lead.tipo_interes || '';
    const notas = (lead.notas_asesor || lead.notas || '').replace(/[\r\n]+/g, ' ');

    tableRows += `
      <tr>
        <td>${escapeXml(id)}</td>
        <td>${escapeXml(fecha)}</td>
        <td>${escapeXml(nombre)}</td>
        <td>${escapeXml(celular)}</td>
        <td>${escapeXml(prioridad)}</td>
        <td>${escapeXml(etapa)}</td>
        <td>${escapeXml(realtor)}</td>
        <td>${escapeXml(zona)}</td>
        <td>${escapeXml(notas)}</td>
      </tr>
    `;
  });

  const excelXml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        th { background-color: #D4AF37; color: #000000; font-weight: bold; border: 1px solid #997A15; padding: 6px 12px; }
        td { border: 1px solid #cccccc; padding: 5px 10px; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
      </style>
    </head>
    <body>
      <h2>Realty ONE Group Bolivia — Base de Datos de Leads</h2>
      <p>Generado: ${new Date().toLocaleString()} | Total Leads: ${leadsToExport.length}</p>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Nombre del Cliente</th>
            <th>Celular</th>
            <th>Prioridad</th>
            <th>Etapa Embudo</th>
            <th>e-Realtor Asignado</th>
            <th>Zona / Interés</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
