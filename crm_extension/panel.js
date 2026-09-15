/**
 * panel.js — Realty ONE Group Bolivia CRM Panel
 * Inyectado como iframe extension-page en WhatsApp Web
 * Comunicación bidireccional con content.js y API de Render
 */

const BACKEND_URL = 'https://realty-one-bolivia.onrender.com';
const ADMIN_KEY = 'ONE2026';
const CACHE_KEY = 'rog_cached_leads';

let allLeads = [];
let currentFilter = 'TODAS';
let currentSearch = '';
let activeLead = null;
let activeContactData = null;

// Plantillas de respuesta rápida para inmobiliaria
const TEMPLATES = {
  bienvenida: "¡Hola! Gracias por comunicarte con Realty ONE Group Bolivia 🦁. ¿En qué zona o tipo de propiedad (compra, alquiler, anticrético o inversión) estás interesado?",
  mar_adentro: "🌊 *Condominio Mar Adentro (Urubó)*: Te comparto las opciones disponibles con playa de aguas cristalinas, club house y seguridad 24/7. ¿Prefieres departamento o terreno?",
  agendar: "📅 ¡Con gusto coordinamos una visita! Disponemos de horarios hoy por la tarde o mañana en la mañana. ¿Qué horario te queda más cómodo?",
  requisitos: "📋 *Requisitos generales para la operación*:\n1. Documento de Identidad vigente\n2. Comprobante de ingresos / precalificación bancaria\n3. Reserva formal para bloqueo de unidad."
};

// ─── Inicialización ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  loadCachedLeads();
  fetchFreshLeads();

  // Polling silencioso cada 12s para mantener leads sincronizados
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

  // Búsqueda en tiempo real
  document.getElementById('leads-search').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    renderLeadsList();
  });

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

  // Plantillas de respuesta rápida
  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const templateKey = chip.dataset.template;
      const text = TEMPLATES[templateKey];
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          const originalText = chip.textContent;
          chip.textContent = '¡Copiado! ✓';
          chip.style.borderColor = '#3fb950';
          chip.style.color = '#3fb950';
          setTimeout(() => {
            chip.textContent = originalText;
            chip.style.borderColor = '';
            chip.style.color = '';
          }, 1500);
        });
      }
    });
  });

  // Escuchar mensajes de WhatsApp (content.js)
  window.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'ROG_ACTIVE_CONTACT') {
      handleActiveContactFromWA(event.data.name, event.data.phone);
    }
  });
}

// ─── Sincronización con API ────────────────────────────────────────────────
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
        updateCounters();
      }
    });
  }
}

async function fetchFreshLeads() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/whatsapp/leads?key=${ADMIN_KEY}`, {
      headers: {
        'x-admin-key': ADMIN_KEY,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rawData = await res.json();
    
    // El backend devuelve { exito: true, stats: {...}, totalFiltrados: N, leads: [...] } o array directo
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
    updateCounters();

    // Si hay un contacto activo, refrescar su ficha
    if (activeContactData) {
      matchOrCreateActiveLead(activeContactData.name, activeContactData.phone);
    }
  } catch (err) {
    console.warn('[Realty ONE CRM] Sync notice:', err.message);
    setSyncStatus('offline', 'Reconectando...');
    // Si la lista está vacía y falló, limpiar estado de carga para no dejar spinner infinito
    if (allLeads.length === 0) {
      renderLeadsList();
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

  // Buscar coincidencia en la lista de leads
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

    // Rellenar controles con datos del backend
    document.getElementById('lead-stage').value = activeLead.etapa_embudo || 'SOLICITUD';
    document.getElementById('lead-priority').value = (activeLead.prioridad || 'POTENCIAL').toUpperCase();
    document.getElementById('lead-realtor').value = activeLead.e_realtor_id || '';
    document.getElementById('quick-note-input').value = '';
    document.getElementById('quick-note-input').placeholder = 'Escribir nueva nota sobre este prospecto...';
  } else {
    // Si no está registrado en el CRM, mostrar formulario listo para crear
    controls.classList.remove('hidden');
    noMsg.style.display = 'none';
    document.getElementById('lead-stage').value = 'SOLICITUD';
    document.getElementById('lead-priority').value = 'POTENCIAL';
    document.getElementById('lead-realtor').value = '';
    document.getElementById('quick-note-input').value = '';
    document.getElementById('quick-note-input').placeholder = 'Guardar nota para registrar como nuevo prospecto...';
  }

  // Resaltar en la lista visual
  highlightSelectedLeadItem(activeLead ? activeLead.id : null);
}

async function updateActiveLeadField(field, value) {
  if (!activeLead) {
    await createLeadFromActiveContact({ [field]: value });
    return;
  }

  activeLead[field] = value;
  renderLeadsList();

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
    e_realtor_id: document.getElementById('lead-realtor').value || '',
    fecha_creacion: new Date().toISOString(),
    ...extraFields
  };

  allLeads.unshift(newLeadData);
  activeLead = newLeadData;
  renderLeadsList();
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

// ─── Renderizado de la lista ───────────────────────────────────────────────
function renderLeadsList() {
  const container = document.getElementById('leads-list');
  if (!container) return;

  let filtered = allLeads;

  // Filtrado por tab
  if (currentFilter !== 'TODAS') {
    filtered = filtered.filter(l => {
      const p = (l.prioridad || '').toUpperCase();
      const e = (l.etapa_embudo || '').toUpperCase();
      return p === currentFilter || e === currentFilter;
    });
  }

  // Filtrado por texto de búsqueda
  if (currentSearch) {
    filtered = filtered.filter(l => {
      const name = (l.cliente_nombre || l.nombre || l.cliente || '').toLowerCase();
      const phone = (l.numero_celular || l.telefono || l.telefono_cliente || '').toLowerCase();
      const zone = (l.zona_interes || l.tipo_interes || l.interes_propiedad || l.campana || '').toLowerCase();
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
    const isSelected = activeLead && activeLead.id === lead.id;
    const name = lead.cliente_nombre || lead.nombre || lead.cliente || 'Sin Nombre';
    const phone = lead.numero_celular || lead.telefono || lead.telefono_cliente || '';
    const priority = (lead.prioridad || 'INDECISO').toUpperCase();
    const stage = formatStage(lead.etapa_embudo || 'SOLICITUD');
    const realtor = lead.e_realtor_asignado || '';
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

  // Eventos de click en items para sincronizar con el formulario activo
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
        document.getElementById('lead-realtor').value = found.e_realtor_id || '';
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
    'PROPUESTA': '📝 Propuesta',
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
