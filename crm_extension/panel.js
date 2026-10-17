/**
 * panel.js — Realty ONE Group Bolivia CRM Panel
 * Inyectado como iframe extension-page en WhatsApp Web
 * Módulos: Tablero Kanban (Drag & Drop), Ficha Lead, Recordatorios, Respuestas Rápidas y Difusión
 * Multi-tier Sync: Localhost -> Render Cloud -> SiteGround Fallback
 */

let BACKEND_URL = 'https://realty-one-bolivia.onrender.com';
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['rog_crm_url'], (res) => {
    if (res && res.rog_crm_url) {
      try {
        const parsed = new URL(res.rog_crm_url);
        BACKEND_URL = `${parsed.protocol}//${parsed.host}`;
      } catch (_) {}
    }
  });
}
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'ROG_UPDATE_URL' && msg.url) {
      try {
        const parsed = new URL(msg.url);
        BACKEND_URL = `${parsed.protocol}//${parsed.host}`;
        if (typeof syncLeadsFromBackend === 'function') syncLeadsFromBackend();
      } catch (_) {}
    }
  });
}
const SITEGROUND_URL = 'https://realyonegroupbolivia.e-techgroupbolivia.com';
const ADMIN_KEY = 'ONE2026';
const CACHE_KEY = 'rog_cached_leads';
const REMINDERS_KEY = 'rog_reminders_list';

let allLeads = [];
let allReminders = [];
let currentFilter = 'TODAS';
let currentKanbanFilter = 'ALL';
let currentSearch = '';
let currentKanbanSearch = '';
let activeLead = null;
let activeContactData = null;
let isExpanded = false;
let currentTemplateCategory = 'TODAS';
let currentTemplateSearch = '';

// ─── Catálogo de Respuestas Rápidas Ampliado (12 Plantillas Inmobiliarias) ─────
const TEMPLATES_CATALOG = [
  {
    id: 'bienvenida',
    categoria: 'Atención Inicial',
    titulo: '👋 Bienvenida Oficial Realty ONE',
    texto: '¡Hola! Te damos una cordial bienvenida a Realty ONE Group Bolivia 🦁✨ Mi nombre es Marcos Antezana Lenz. ¿En qué zona o tipo de propiedad en Santa Cruz te gustaría que te asesoremos hoy?'
  },
  {
    id: 'agendar',
    categoria: 'Visitas',
    titulo: '📅 Agendar Visita Inmobiliaria',
    texto: '📅 ¡Con mucho gusto coordinamos tu visita presencial! Disponemos de espacios hoy por la tarde y mañana en la mañana. ¿Qué día y horario te queda más cómodo para que te reserve el espacio?'
  },
  {
    id: 'catalogo',
    categoria: 'Inventario',
    titulo: '🏠 Catálogo Exclusivo Urubó & Equipetrol',
    texto: '🏠 *Catálogo Inmobiliario Realty ONE Group*:\nDisponemos de casas, departamentos en preventa y entrega inmediata, terrenos en condominios cerrados y anticréticos con alta plusvalía. ¿Qué características y rango de inversión buscas aproximado?'
  },
  {
    id: 'mar_adentro',
    categoria: 'Inventario',
    titulo: '🌊 Lote en Condominio Mar Adentro (Urubó)',
    texto: '🌊 *Condominio Mar Adentro - Urubó*:\nTerrenos de 450 m² a solo 300 m de la Laguna Cristalina navegable con playas de arena blanca, Club House de lujo, canchas y seguridad 24/7. Precio: $112,500 USD (con Folio Real al día). ¿Deseas que te comparta fotos y plano de ubicación?'
  },
  {
    id: 'industrial_g77',
    categoria: 'Inventario',
    titulo: '🏭 Terreno Industrial 7.000 m² (Av. G77)',
    texto: '🏭 *Terreno Industrial en Parque Industrial (Salida G77)*:\nSuperficie: 7.000 m² con 185 m de frente. Factibilidad inmediata de energía trifásica y agua industrial. Apto para galpones logísticos de alto tonelaje. Folio Real individualizado. ¿Te gustaría coordinar una visita técnica?'
  },
  {
    id: 'westgate',
    categoria: 'Inventario',
    titulo: '🏢 Westgate Tower (Frente a Fexpocruz)',
    texto: '🏢 *Westgate Tower - Preventa Exclusiva*:\nMonoambientes, 1 y 2 dormitorios sobre Av. Roca y Coronado (frente a Fexpocruz). Precios desde USD 40.800 con facilidades de pago en cuotas. Ideal para vivienda o inversión en Airbnb. ¿Te comparto la lista de precios?'
  },
  {
    id: 'requisitos',
    categoria: 'Operación & Legal',
    titulo: '📋 Requisitos de Operación & Anticrético',
    texto: '📋 *Requisitos generales para la operación*:\n1. Cédula de Identidad vigente.\n2. Verificación de folio real en Derechos Reales (DDRR) libre de gravamen.\n3. Asesoría legal y redacción de contrato formal incluida.\n4. Reserva formal para bloqueo de unidad.'
  },
  {
    id: 'legal_ddrr',
    categoria: 'Operación & Legal',
    titulo: '⚖️ Asesoría Legal y Folio Real',
    texto: '⚖️ En Realty ONE Group todas nuestras propiedades cuentan con due diligence legal completo: Folio Real al día, plano de uso de suelo aprobado e impuestos pagados. Tu inversión está 100% protegida.'
  },
  {
    id: 'credito',
    categoria: 'Financiamiento',
    titulo: '🏦 Asesoría de Crédito de Vivienda',
    texto: '🏦 Trabajamos con los principales bancos del sistema financiero boliviano para crédito de vivienda social o comercial. ¿Cuentas ya con precalificación bancaria o deseas que te contactemos con un oficial de crédito especializado?'
  },
  {
    id: 'consignar',
    categoria: 'Operación & Legal',
    titulo: '💼 Venta o Consignación de Propiedades',
    texto: '🏡 ¡Con mucho gusto te ayudamos a vender o alquilar tu propiedad! Realizamos valuación comercial, sesión fotográfica profesional y pauta publicitaria en Meta Ads para captar compradores calificados en tiempo récord. ¿En qué zona se encuentra tu inmueble?'
  },
  {
    id: 'cierre',
    categoria: 'Negociación',
    titulo: '🏆 Oferta Formal y Bloqueo de Unidad',
    texto: '¡Excelente decisión! Para presentar la carta de intención de compra / alquiler al propietario y asegurar el precio acordado, podemos redactar la reserva formal hoy mismo. ¿Te comparto los datos de la cuenta fiduciaria?'
  },
  {
    id: 'despedida_oficial',
    categoria: 'Atención Inicial',
    titulo: '🦁 Despedida y Atención Permanente',
    texto: '¡Muchas gracias por comunicarte con nosotros! Nuestro equipo especializado estará siempre atento a tus requerimientos. Cualquier duda o inquietud no dude en llamar al +591 60034649. ¡Que tenga un excelente día!'
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

  // Polling silencioso cada 10s para sincronizar
  setInterval(fetchFreshLeads, 10000);
});

function initUI() {
  // Botones de cabecera
  document.getElementById('btn-refresh').addEventListener('click', () => {
    setSyncStatus('syncing', 'Sincronizando...');
    fetchFreshLeads(true);
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

  // Buscador lista de prospectos
  const leadsSearch = document.getElementById('leads-search');
  const leadsSearchClear = document.getElementById('leads-search-clear');
  if (leadsSearch) {
    leadsSearch.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      if (leadsSearchClear) leadsSearchClear.classList.toggle('hidden', !currentSearch);
      renderLeadsList();
    });
  }
  if (leadsSearchClear) {
    leadsSearchClear.addEventListener('click', () => {
      if (leadsSearch) leadsSearch.value = '';
      currentSearch = '';
      leadsSearchClear.classList.add('hidden');
      renderLeadsList();
    });
  }

  // Buscador Kanban
  const kanbanSearch = document.getElementById('kanban-search');
  const kanbanSearchClear = document.getElementById('kanban-search-clear');
  if (kanbanSearch) {
    kanbanSearch.addEventListener('input', (e) => {
      currentKanbanSearch = e.target.value.toLowerCase().trim();
      if (kanbanSearchClear) kanbanSearchClear.classList.toggle('hidden', !currentKanbanSearch);
      renderKanbanBoard();
    });
  }
  if (kanbanSearchClear) {
    kanbanSearchClear.addEventListener('click', () => {
      if (kanbanSearch) kanbanSearch.value = '';
      currentKanbanSearch = '';
      kanbanSearchClear.classList.add('hidden');
      renderKanbanBoard();
    });
  }

  // Filtros de píldoras Kanban
  document.querySelectorAll('.k-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.k-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentKanbanFilter = pill.dataset.kfilter;
      renderKanbanBoard();
    });
  });

  // Filtros de píldoras Lista
  document.querySelectorAll('.filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.dataset.filter;
      renderLeadsList();
    });
  });

  // Guardar nota
  document.getElementById('btn-save-note').addEventListener('click', saveQuickNote);
  document.getElementById('quick-note-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveQuickNote();
  });

  // Acciones rápidas del lead activo
  document.getElementById('lead-stage').addEventListener('change', (e) => {
    updateActiveLeadField('etapa_embudo', e.target.value);
  });
  document.getElementById('lead-priority').addEventListener('change', (e) => {
    updateActiveLeadField('prioridad', e.target.value);
  });
  document.getElementById('lead-realtor').addEventListener('change', (e) => {
    updateActiveLeadField('e_realtor_id', e.target.value);
  });

  // Botones de acción directa del lead activo
  const btnLeadWa = document.getElementById('btn-lead-act-wa');
  if (btnLeadWa) {
    btnLeadWa.addEventListener('click', () => {
      if (activeLead && activeLead.numero_celular) {
        const cleanP = activeLead.numero_celular.replace(/[^0-9]/g, '');
        window.open(`https://web.whatsapp.com/send?phone=${cleanP}`, '_top');
      } else {
        showToast('Chat activo seleccionado', true);
      }
    });
  }

  const btnLeadSchedule = document.getElementById('btn-lead-act-schedule');
  if (btnLeadSchedule) {
    btnLeadSchedule.addEventListener('click', () => {
      switchTab('reminders');
      const noteInput = document.getElementById('rem-note');
      if (noteInput && activeLead) {
        noteInput.value = `Visita con ${activeLead.cliente_nombre || 'Cliente'}`;
      }
    });
  }

  const btnLeadDelete = document.getElementById('btn-lead-act-delete');
  if (btnLeadDelete) {
    btnLeadDelete.addEventListener('click', () => {
      if (activeLead && activeLead.id) {
        deleteLead(activeLead.id, activeLead.cliente_nombre);
      }
    });
  }

  // Chips de respuesta rápida en ficha de lead
  document.querySelectorAll('.template-chips .chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const templateId = btn.dataset.template;
      const t = TEMPLATES_CATALOG.find(x => x.id === templateId);
      if (t) {
        copyAndInsertText(t.texto, btn);
      }
    });
  });

  const btnViewAllT = document.getElementById('btn-view-all-templates');
  if (btnViewAllT) {
    btnViewAllT.addEventListener('click', () => switchTab('templates'));
  }

  // Recordatorios
  document.getElementById('btn-save-reminder').addEventListener('click', saveReminder);

  // Atajos rápidos de fecha en agenda
  document.querySelectorAll('.qdate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const days = parseInt(btn.dataset.days, 10) || 0;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const dateInput = document.getElementById('rem-date');
      if (dateInput) {
        dateInput.value = targetDate.toISOString().split('T')[0];
      }
    });
  });

  // Filtros de plantillas
  const templateSearchInput = document.getElementById('template-search-input');
  if (templateSearchInput) {
    templateSearchInput.addEventListener('input', (e) => {
      currentTemplateSearch = e.target.value.toLowerCase().trim();
      renderTemplatesFullGrid();
    });
  }

  document.querySelectorAll('#template-category-pills .t-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#template-category-pills .t-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentTemplateCategory = pill.dataset.cat;
      renderTemplatesFullGrid();
    });
  });

  // Difusión
  const audSelect = document.getElementById('broadcast-audience');
  if (audSelect) audSelect.addEventListener('change', renderBroadcastQueue);

  const bcastText = document.getElementById('broadcast-message-text');
  if (bcastText) bcastText.addEventListener('input', renderBroadcastQueue);

  // Escuchar mensajes de WhatsApp Web desde content.js
  window.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'ROG_ACTIVE_CONTACT') {
      handleActiveContactFromWA(event.data.name, event.data.phone);
    }
  });
}

function toggleExpandSidebar() {
  isExpanded = !isExpanded;
  const btn = document.getElementById('btn-toggle-expand');
  if (btn) btn.textContent = isExpanded ? '⇲' : '⛶';

  try {
    window.parent.postMessage({
      type: 'ROG_TOGGLE_EXPAND_SIDEBAR',
      expanded: isExpanded
    }, '*');
  } catch (_) {}
}

// ─── Gestión de Tabs ────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetView = tab.dataset.view;
      switchTab(targetView);
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
  } else if (viewId === 'templates') {
    renderTemplatesFullGrid();
  } else if (viewId === 'broadcast') {
    renderBroadcastQueue();
  }
}

// ─── Sincronización Resiliente Multicapa ─────────────────────────────────────
function setSyncStatus(status, text) {
  const badge = document.getElementById('sync-indicator');
  if (!badge) return;
  badge.className = `sync-badge ${status}`;
  badge.textContent = text;
}

function loadCachedLeads() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([CACHE_KEY], (res) => {
      if (res && res[CACHE_KEY] && Array.isArray(res[CACHE_KEY]) && res[CACHE_KEY].length > 0) {
        allLeads = res[CACHE_KEY];
        renderLeadsList();
        renderKanbanBoard();
        updateCounters();
      }
    });
  }
}

async function fetchFreshLeads(showFeedback = false) {
  try {
    let rawData = null;
    let sourceLabel = '';

    // 1. Probar backend local (localhost:3000)
    try {
      const localRes = await fetch('http://localhost:3000/api/leads', { signal: AbortSignal.timeout(1200) });
      if (localRes.ok) {
        const localData = await localRes.json();
        if (Array.isArray(localData) && localData.length > 0) {
          rawData = localData;
          sourceLabel = 'Local 💻';
        }
      }
    } catch (_) {}

    // 2. Si no hay datos locales, sincronizar con nube Render
    if (!rawData) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/whatsapp/leads?key=${ADMIN_KEY}`, {
          headers: {
            'x-admin-key': ADMIN_KEY,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
          rawData = await res.json();
          sourceLabel = 'Render 🟢';
        }
      } catch (_) {}
    }

    // 3. Fallback a SiteGround si Render no responde
    if (!rawData) {
      try {
        const sgRes = await fetch(`${SITEGROUND_URL}/save_leads_sync.php?key=${ADMIN_KEY}&t=${Date.now()}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        if (sgRes.ok) {
          rawData = await sgRes.json();
          sourceLabel = 'SiteGround ☁️';
        }
      } catch (_) {}
    }

    if (!rawData) throw new Error('Sin conexión con servidores');

    let leadsList = [];
    if (Array.isArray(rawData)) {
      leadsList = rawData;
    } else if (rawData && Array.isArray(rawData.leads)) {
      leadsList = rawData.leads;
    }

    allLeads = leadsList;
    setSyncStatus('online', sourceLabel || 'En Línea 🟢');

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [CACHE_KEY]: allLeads });
    }

    renderLeadsList();
    renderKanbanBoard();
    updateCounters();

    if (activeContactData) {
      matchOrCreateActiveLead(activeContactData.name, activeContactData.phone);
    }

    if (showFeedback) showToast(`Sincronizados ${allLeads.length} prospectos`, true);
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

  // Avatar initials
  const avatarEl = document.getElementById('active-contact-avatar');
  if (avatarEl) {
    avatarEl.textContent = getInitials(activeContactData.name);
  }

  // Mostrar punto de chat activo
  const dot = document.getElementById('tab-chat-active-dot');
  if (dot) dot.classList.add('visible');

  matchOrCreateActiveLead(activeContactData.name, activeContactData.phone);
}

function getInitials(name = '') {
  if (!name) return 'RO';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
  const actionBar = document.getElementById('active-lead-action-bar');
  const noMsg = document.getElementById('no-contact-msg');
  const zonePill = document.getElementById('active-contact-zone');

  if (activeLead) {
    controls.classList.remove('hidden');
    actionBar.classList.remove('hidden');
    noMsg.style.display = 'none';

    document.getElementById('lead-stage').value = activeLead.etapa_embudo || 'SOLICITUD';
    document.getElementById('lead-priority').value = (activeLead.prioridad || 'POTENCIAL').toUpperCase();
    document.getElementById('lead-realtor').value = activeLead.e_realtor_id || 'marcos_antezana';
    document.getElementById('quick-note-input').value = '';

    if (zonePill) {
      zonePill.textContent = `📍 ${activeLead.zona_interes || 'Santa Cruz'}`;
      zonePill.classList.remove('hidden');
    }

    renderLeadNotesHistory(activeLead);
  } else {
    controls.classList.remove('hidden');
    actionBar.classList.remove('hidden');
    noMsg.style.display = 'none';
    document.getElementById('lead-stage').value = 'SOLICITUD';
    document.getElementById('lead-priority').value = 'POTENCIAL';
    document.getElementById('lead-realtor').value = 'marcos_antezana';
    document.getElementById('quick-note-input').value = '';
    if (zonePill) zonePill.classList.add('hidden');

    const historyBox = document.getElementById('lead-notes-history');
    if (historyBox) historyBox.innerHTML = '<span style="color:#777; font-size:10px;">Nuevo prospecto por registrar. Escribe una nota abajo.</span>';
  }

  highlightSelectedLeadItem(activeLead ? activeLead.id : null);
}

function renderLeadNotesHistory(lead) {
  const container = document.getElementById('lead-notes-history');
  if (!container) return;

  const rawNotes = lead.notas_asesor || lead.notas || '';
  if (!rawNotes.trim()) {
    container.innerHTML = '<span style="color:#777; font-size:10px;">Sin notas registradas aún.</span>';
    return;
  }

  const lines = rawNotes.split('\n').filter(Boolean);
  container.innerHTML = lines.map(line => {
    return `<div class="note-item-bubble">${line}</div>`;
  }).join('');
}

async function updateActiveLeadField(field, value) {
  if (!activeLead) {
    await createLeadFromActiveContact({ [field]: value });
    return;
  }

  activeLead[field] = value;
  if (field === 'e_realtor_id') {
    const realtorMap = {
      'marcos_antezana': 'Marcos Antezana Lenz (+591 60034649)',
      'carlos_rodriguez': 'Carlos Rodríguez (Venta de Lujo & Casas)',
      'valeria_suarez': 'Valeria Suárez (Alquileres & Deptos)',
      'andres_montano': 'Andrés Montaño (Terrenos & Parque Ind.)',
      'lucia_vaca': 'Lucía Vaca (Anticréticos & Asesoría Legal)',
      'robert_oliva': 'Robert Oliva (Master Broker / Inversión VIP)'
    };
    activeLead.e_realtor_asignado = realtorMap[value] || value;
  }

  renderLeadsList();
  renderKanbanBoard();
  showToast('Actualizado ✓', true);

  // Sync en paralelo con Render y SiteGround
  try {
    fetch(`${BACKEND_URL}/api/whatsapp/leads/${activeLead.id}?key=${ADMIN_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ [field]: value })
    }).catch(() => {});

    fetch(`${SITEGROUND_URL}/save_leads_sync.php?key=${ADMIN_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allLeads)
    }).catch(() => {});
  } catch (_) {}
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
    setTimeout(() => { btn.textContent = 'Guardar'; }, 1400);
    showToast('Prospecto registrado en el CRM', true);
    return;
  }

  const existingNotes = activeLead.notas_asesor || activeLead.notas || '';
  const dateTag = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const newNotes = existingNotes ? `${existingNotes}\n[${dateTag}] ${note}` : `[${dateTag}] ${note}`;
  activeLead.notas_asesor = newNotes;

  renderLeadNotesHistory(activeLead);
  input.value = '';
  btn.textContent = '¡Listo! ✓';
  setTimeout(() => { btn.textContent = 'Guardar'; }, 1400);
  showToast('Nota guardada con éxito', true);

  try {
    fetch(`${BACKEND_URL}/api/whatsapp/leads/${activeLead.id}?key=${ADMIN_KEY}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ notas_asesor: newNotes })
    }).catch(() => {});

    fetch(`${SITEGROUND_URL}/save_leads_sync.php?key=${ADMIN_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allLeads)
    }).catch(() => {});
  } catch (_) {}
}

async function createLeadFromActiveContact(extraFields = {}) {
  if (!activeContactData) return;

  const newLeadData = {
    id: `lead_${Date.now()}_ext`,
    cliente_nombre: activeContactData.name || 'Prospecto WhatsApp',
    numero_celular: activeContactData.phone || '',
    canal_origen: 'WhatsApp Web Extension',
    prioridad: document.getElementById('lead-priority').value || 'POTENCIAL',
    etapa_embudo: document.getElementById('lead-stage').value || 'SOLICITUD',
    e_realtor_id: document.getElementById('lead-realtor').value || 'marcos_antezana',
    e_realtor_asignado: 'Marcos Antezana Lenz (+591 60034649)',
    fecha_creacion: new Date().toISOString(),
    ...extraFields
  };

  allLeads.unshift(newLeadData);
  activeLead = newLeadData;
  renderLeadsList();
  renderKanbanBoard();
  updateCounters();
  showToast(`Nuevo prospecto ${newLeadData.cliente_nombre} registrado`, true);

  try {
    fetch(`${BACKEND_URL}/api/whatsapp/leads?key=${ADMIN_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify(newLeadData)
    }).catch(() => {});

    fetch(`${SITEGROUND_URL}/save_leads_sync.php?key=${ADMIN_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allLeads)
    }).catch(() => {});
  } catch (_) {}
}

// ─── ELIMINAR PROSPECTO CON CONFIRMACIÓN ───────────────────────────────────
async function deleteLead(leadId, clientName = '') {
  if (!leadId) return;

  const displayName = clientName || 'este prospecto';
  if (!confirm(`¿Estás seguro de eliminar a "${displayName}" del CRM? Esta acción no se puede deshacer.`)) {
    return;
  }

  const targetId = String(leadId);
  const targetLead = allLeads.find(l => String(l.id) === targetId);
  const targetPhone = targetLead ? (targetLead.numero_celular || targetLead.telefono || '') : '';

  // Eliminar en memoria local
  allLeads = allLeads.filter(l => String(l.id) !== targetId);
  if (activeLead && String(activeLead.id) === targetId) {
    activeLead = null;
    document.getElementById('active-lead-controls').classList.add('hidden');
    document.getElementById('active-lead-action-bar').classList.add('hidden');
    document.getElementById('no-contact-msg').style.display = 'flex';
  }

  renderLeadsList();
  renderKanbanBoard();
  updateCounters();

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [CACHE_KEY]: allLeads });
  }

  showToast(`🗑️ "${displayName}" eliminado del CRM`, true);

  // Sincronizar eliminación en Render y SiteGround
  try {
    fetch(`${BACKEND_URL}/api/whatsapp/leads/${encodeURIComponent(targetId)}?key=${ADMIN_KEY}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': ADMIN_KEY }
    }).catch(() => {});

    fetch(`${SITEGROUND_URL}/delete_lead.php?id=${encodeURIComponent(targetId)}&phone=${encodeURIComponent(targetPhone)}&key=${ADMIN_KEY}&t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ id: targetId, phone: targetPhone, all_leads: allLeads })
    }).catch(() => {});
  } catch (_) {}
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
        showToast(`Movido a ${formatStage(targetStage)}`, true);

        try {
          fetch(`${BACKEND_URL}/api/whatsapp/leads/${lead.id}?key=${ADMIN_KEY}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
            body: JSON.stringify({ etapa_embudo: targetStage })
          }).catch(() => {});

          fetch(`${SITEGROUND_URL}/save_leads_sync.php?key=${ADMIN_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allLeads)
          }).catch(() => {});
        } catch (_) {}
      }
    });
  });
}

function renderKanbanBoard() {
  const counts = { SOLICITUD: 0, CONTACTADO: 0, VISITA_AGENDADA: 0, PROPUESTA: 0, CIERRE: 0, PERDIDO: 0 };
  let hotCount = 0;

  let filtered = allLeads;

  // Filtro por prioridad
  if (currentKanbanFilter !== 'ALL') {
    filtered = filtered.filter(l => (l.prioridad || '').toUpperCase() === currentKanbanFilter);
  }

  // Búsqueda en Kanban
  if (currentKanbanSearch) {
    filtered = filtered.filter(l => {
      const name = (l.cliente_nombre || l.nombre || l.cliente || '').toLowerCase();
      const phone = (l.numero_celular || l.telefono || '').toLowerCase();
      const zone = (l.zona_interes || l.tipo_interes || '').toLowerCase();
      const realtor = (l.e_realtor_asignado || '').toLowerCase();
      return name.includes(currentKanbanSearch) || phone.includes(currentKanbanSearch) || zone.includes(currentKanbanSearch) || realtor.includes(currentKanbanSearch);
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
    const realtor = lead.e_realtor_asignado || lead.agente_nombre || 'Marcos Antezana';
    const zone = lead.zona_interes || lead.tipo_interes || '';
    const budget = lead.presupuesto || '';
    const initials = getInitials(name);

    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.leadId = lead.id;

    card.innerHTML = `
      <div class="kc-top">
        <div class="kc-client-group">
          <span class="kc-avatar">${initials}</span>
          <span class="kc-name" title="${name}">${name}</span>
        </div>
        <span class="lead-priority ${priority}">${formatPriorityBadge(priority)}</span>
      </div>
      <div class="kc-mid">
        ${phone ? `<a class="kc-phone-btn" href="https://web.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, '')}" target="_top" title="Abrir chat en WhatsApp">💬 ${phone}</a>` : '<span style="font-size:10px; color:#666;">Sin Teléfono</span>'}
        ${budget ? `<span class="budget-tag">${budget}</span>` : ''}
      </div>
      <div class="kc-bottom">
        <span class="kc-realtor" title="${realtor}">👤 ${realtor}</span>
        <div class="kc-actions">
          ${zone ? `<span class="zone-tag" title="${zone}">📍 ${zone}</span>` : ''}
          <button class="kc-btn-del" title="Eliminar este lead" data-id="${lead.id}">🗑️</button>
        </div>
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', lead.id);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    // Clic en botón eliminar de la tarjeta
    const delBtn = card.querySelector('.kc-btn-del');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteLead(lead.id, name);
      });
    }

    // Clic en tarjeta selecciona el lead para edición
    card.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'a' || e.target.classList.contains('kc-btn-del')) return;
      activeLead = lead;
      handleActiveContactFromWA(name, phone);
      switchTab('lead');
    });

    container.appendChild(card);
  });

  // Mostrar mensaje vacío si la columna no tiene tarjetas
  STAGES.forEach(s => {
    const el = document.querySelector(`.col-cards[data-stage="${s}"]`);
    if (el && el.children.length === 0) {
      el.innerHTML = '<div style="text-align:center; padding:18px 8px; color:#555; font-size:10px;">Sin tarjetas en esta etapa</div>';
    }
  });

  // Actualizar contadores de cabecera de columnas
  STAGES.forEach(s => {
    const counterEl = document.getElementById(`count-stage-${s}`);
    if (counterEl) counterEl.textContent = counts[s] || 0;
  });

  const totalEl = document.getElementById('kanban-total-count');
  const hotEl = document.getElementById('kanban-hot-count');
  const tabKanbanEl = document.getElementById('tab-count-kanban');
  if (totalEl) totalEl.textContent = filtered.length;
  if (hotEl) hotEl.textContent = hotCount;
  if (tabKanbanEl) tabKanbanEl.textContent = allLeads.length;
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
      const realtor = (l.e_realtor_asignado || '').toLowerCase();
      return name.includes(currentSearch) || phone.includes(currentSearch) || zone.includes(currentSearch) || realtor.includes(currentSearch);
    });
  }

  const totalBadge = document.getElementById('pipeline-total-badge');
  if (totalBadge) totalBadge.textContent = `${filtered.length} Registros`;

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
    const realtor = lead.e_realtor_asignado || lead.agente_nombre || 'Marcos Antezana Lenz';
    const zone = lead.zona_interes || lead.tipo_interes || '';
    const initials = getInitials(name);

    return `
      <div class="lead-item ${isSelected ? 'selected' : ''}" data-lead-id="${lead.id}">
        <div class="lead-top">
          <div class="lead-top-left">
            <span class="lead-avatar-sm">${initials}</span>
            <span class="lead-name" title="${name}">${name}</span>
          </div>
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
        handleActiveContactFromWA(found.cliente_nombre || found.nombre, found.numero_celular || found.telefono);
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

function formatPriorityBadge(prio) {
  const map = {
    'POTENCIAL': '🔥 Alta',
    'INDECISO': '⚡ Media',
    'PASIVO': '❄️ Baja',
    'PROPIETARIO': '💼 Captación'
  };
  return map[prio] || prio;
}

// ─── RECORDATORIOS Y AGENDA ────────────────────────────────────────────────
function loadReminders() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get([REMINDERS_KEY], (res) => {
      if (res && res[REMINDERS_KEY] && Array.isArray(res[REMINDERS_KEY])) {
        allReminders = res[REMINDERS_KEY];
      } else {
        allReminders = [
          {
            id: 'rem_1',
            cliente: 'Robert Oliva',
            telefono: '+591 79878853',
            fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            hora: '10:30',
            nota: 'Confirmar visita presencial a Lote en Condominio Mar Adentro'
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
  showToast('📅 Cita guardada en tu Agenda', true);

  const btn = document.getElementById('btn-save-reminder');
  btn.textContent = '¡Cita Agendada! ✓';
  setTimeout(() => { btn.textContent = '📅 Guardar Recordatorio en Agenda'; }, 1500);
}

function deleteReminder(remId) {
  allReminders = allReminders.filter(r => r.id !== remId);
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ [REMINDERS_KEY]: allReminders });
  }
  renderRemindersList();
  showToast('Cita eliminada', true);
}

function renderRemindersList() {
  const container = document.getElementById('reminders-list');
  const countBadge = document.getElementById('reminders-count');
  const counterSub = document.getElementById('reminders-list-counter');
  if (countBadge) countBadge.textContent = allReminders.length;
  if (counterSub) counterSub.textContent = `${allReminders.length} citas`;
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
          <div style="display:flex; gap:4px; align-items:center;">
            ${rem.telefono ? `<button class="chip-btn" onclick="copyAndInsertText('Hola ${rem.cliente}, le escribo de Realty ONE Group para confirmar nuestra visita coordinada.', this)" style="font-size:9.5px; padding:2px 7px;">💬 Escribir</button>` : ''}
            <button class="kc-btn-del" onclick="deleteReminder('${rem.id}')" title="Eliminar recordatorio">✕</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── PLANTILLAS AMPLIADAS & FILTRADO ────────────────────────────────────────
function renderTemplatesFullGrid() {
  const container = document.getElementById('templates-full-grid');
  if (!container) return;

  let filtered = TEMPLATES_CATALOG;

  if (currentTemplateCategory !== 'TODAS') {
    filtered = filtered.filter(t => t.categoria === currentTemplateCategory);
  }

  if (currentTemplateSearch) {
    filtered = filtered.filter(t => {
      const tit = t.titulo.toLowerCase();
      const txt = t.texto.toLowerCase();
      const cat = t.categoria.toLowerCase();
      return tit.includes(currentTemplateSearch) || txt.includes(currentTemplateSearch) || cat.includes(currentTemplateSearch);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No hay plantillas para "${currentTemplateSearch}".</div>`;
    return;
  }

  container.innerHTML = filtered.map(t => {
    return `
      <div class="template-card">
        <div class="template-card-header">
          <span class="template-card-title">${t.titulo}</span>
          <span class="badge-tag">${t.categoria}</span>
        </div>
        <div class="template-card-text">${t.texto}</div>
        <div class="template-card-actions">
          <button class="chip-btn" data-text="${encodeURIComponent(t.texto)}" onclick="copyDirectText(decodeURIComponent(this.dataset.text), this)">📋 Copiar</button>
          <button class="btn-template-insert" data-text="${encodeURIComponent(t.texto)}" onclick="copyAndInsertText(decodeURIComponent(this.dataset.text), this)">⚡ Pegar en WhatsApp</button>
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
    showToast('Texto copiado al portapapeles', true);
    setTimeout(() => { btn.textContent = orig; }, 1200);
  } catch (_) {}
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
  } else if (targetFilter === 'PROPIETARIO') {
    targets = targets.filter(l => (l.prioridad || '').toUpperCase() === 'PROPIETARIO');
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

  showToast('¡Texto insertado en WhatsApp! ✓', true);

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

// ─── Toast Modal de Notificación ───────────────────────────────────────────
let toastTimer = null;
function showToast(message, isSuccess = true) {
  const toast = document.getElementById('crm-toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  if (iconEl) iconEl.textContent = isSuccess ? '✓' : 'ℹ️';

  toast.classList.remove('hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2200);
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
  showToast('📊 Archivo Excel descargado con éxito', true);
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
