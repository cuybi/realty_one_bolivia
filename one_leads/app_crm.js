/**
 * OneLeads - Advanced Visual Kanban & Table CRM (app_crm.js)
 * Sincronización en Vivo, Drag & Drop, Vista Dual (Kanban/Tabla), KPIs, Simulador y Plantillas
 * (Sin columna de e-Realtor Asignado)
 */

const STAGES = [
  { id: 'NUEVO', title: '📥 Nuevos Prospectos', icon: 'fa-inbox' },
  { id: 'CALIFICACION', title: '💬 Calificación & Interés', icon: 'fa-comments' },
  { id: 'VISITA_AGENDADA', title: '📅 Visita Agendada', icon: 'fa-calendar-check' },
  { id: 'NEGOCIACION', title: '💼 Propuesta / Negociación', icon: 'fa-briefcase' },
  { id: 'CERRADO', title: '🏆 Cerrado / Ganado', icon: 'fa-trophy' },
  { id: 'DESCARTADO', title: '❌ Descartado / Frío', icon: 'fa-xmark' }
];

const INITIAL_DEMO_LEADS = [
  {
    id: 'lead_demo_01',
    nombre: 'Laura Gutiérrez',
    celular: '+591 77012345',
    email: 'laura.g@gmail.com',
    etapa: 'NUEVO',
    temperatura: 'POTENCIAL',
    inmueble: 'Casa en Urubó (4 dorm)',
    presupuesto: '$280.000',
    origen: 'Facebook Ads (CTWA)',
    ultimo_mensaje: 'Hola, me interesa agendar una visita para este sábado.',
    recordatorio: 'Hoy 15:30',
    notas: 'Interesada en crédito bancario pre-aprobado.'
  },
  {
    id: 'lead_demo_02',
    nombre: 'Dra. Mariana Suárez',
    celular: '+591 78945612',
    email: 'mariana.s@hotmail.com',
    etapa: 'CALIFICACION',
    temperatura: 'INDECISO',
    inmueble: 'Anticrético Equipetrol',
    presupuesto: '$45.000',
    origen: 'WhatsApp Web',
    ultimo_mensaje: '¿Tienen opciones de 3 dormitorios?',
    recordatorio: '',
    notas: 'Presupuesto disponible en mano para contrato notarial.'
  },
  {
    id: 'lead_demo_03',
    nombre: 'Ing. Carlos Mendoza',
    celular: '+591 70345678',
    email: 'cmendoza@empresa.com',
    etapa: 'VISITA_AGENDADA',
    temperatura: 'POTENCIAL',
    inmueble: 'Terreno Industrial G77 (7.000 m²)',
    presupuesto: 'Bs 16.800.000',
    origen: 'Meta Ads',
    ultimo_mensaje: 'Revisaré el Folio Real en la reunión de obra.',
    recordatorio: 'Mañana 10:00 AM',
    notas: 'Compra corporativa a nombre de SRL.'
  },
  {
    id: 'lead_demo_04',
    nombre: 'Sofía Mendoza',
    celular: '+591 70129988',
    email: 'sofia.m@gmail.com',
    etapa: 'CERRADO',
    temperatura: 'CERRADO',
    inmueble: 'Dpto Equipetrol Norte',
    presupuesto: '$125.000',
    origen: 'WhatsApp Web',
    ultimo_mensaje: '¡Muchas gracias por todo el asesoramiento!',
    recordatorio: '',
    notas: 'Operación cerrada y comisionada.'
  }
];

const TEMPLATES = [
  {
    titulo: '🦁 1. Saludo & Presentación',
    texto: '¡Hola {nombre}! 👋 Te saluda el equipo de OneLeads / Realty ONE Group Bolivia. Con gusto te comparto los detalles del inmueble {inmueble}. ¿En qué horario te queda mejor coordinar una llamada o visita?'
  },
  {
    titulo: '📅 2. Coordinar Visita Presencial',
    texto: 'Estimado/a {nombre}, para coordinar tu visita presencial a {inmueble}, por favor indícanos qué día y hora te conviene (Mañana o Tarde) para registrar tu pase de ingreso autorizado.'
  },
  {
    titulo: '📑 3. Ficha Técnica & Folio Real',
    texto: 'Hola {nombre}, te adjunto la ficha técnica completa de {inmueble} con precio oficial ({presupuesto}) y documentación 100% al día con Folio Real en Derechos Reales.'
  },
  {
    titulo: '🏦 4. Requisitos de Crédito & Bancos',
    texto: '¡Hola {nombre}! Trabajamos con todos los bancos en Bolivia para el financiamiento de {inmueble}. ¿Deseas que te enviemos una simulación de cuota mensual?'
  },
  {
    titulo: '🤝 5. Propietario / Consignación',
    texto: '¡Hola {nombre}! Recibimos tu interés para consignar tu propiedad en Realty ONE Group Bolivia. Te ofrecemos promoción 360°, fotos profesionales y asesoramiento legal sin costo inicial.'
  }
];

let leads = [];
let activeEditingLeadId = null;
let draggedLeadId = null;
let currentView = 'kanban'; // 'kanban' o 'table'
let currentPriorityFilter = 'TODAS';
let currentStageFilter = 'TODAS';
let currentOriginFilter = 'TODOS';
let pollingInterval = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadLeadsFromStorage();
  fetchLiveBackendLeads();
  renderView();
  renderKPIs();
  setupSearchAndFilters();
  renderTemplates();

  // Polling automático en vivo cada 5 segundos
  pollingInterval = setInterval(fetchLiveBackendLeads, 5000);
});

function loadLeadsFromStorage() {
  const stored = localStorage.getItem('one_leads_unified_data');
  if (stored) {
    try {
      leads = JSON.parse(stored);
    } catch(e) {
      leads = INITIAL_DEMO_LEADS;
    }
  } else {
    leads = INITIAL_DEMO_LEADS;
    saveLeadsToStorage();
  }
}

function saveLeadsToStorage() {
  localStorage.setItem('one_leads_unified_data', JSON.stringify(leads));
}

// Sincronización en vivo con endpoints si están disponibles
async function fetchLiveBackendLeads() {
  try {
    const endpoints = [
      '../export_leads.php?format=json&t=' + Date.now(),
      '../leads.json?t=' + Date.now(),
      'http://localhost:3000/api/whatsapp/leads'
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          let serverLeads = [];
          if (Array.isArray(data)) {
            serverLeads = data;
          } else if (data && Array.isArray(data.leads)) {
            serverLeads = data.leads;
          }

          if (serverLeads && serverLeads.length > 0) {
            mergeServerLeads(serverLeads);
            break;
          }
        }
      } catch(err) {
        // Fallback al siguiente endpoint
      }
    }
  } catch(e) {
    // Modo local offline
  }
}

function mergeServerLeads(serverLeads) {
  let changed = false;
  serverLeads.forEach(sLead => {
    const phone = sLead.celular || sLead.telefono || sLead.phone;
    if (!phone) return;

    const existingIdx = leads.findIndex(l => (l.celular || '').replace(/\D/g, '') === String(phone).replace(/\D/g, ''));
    if (existingIdx === -1) {
      // Mapear nuevo lead desde backend
      leads.unshift({
        id: sLead.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2,6)}`,
        nombre: sLead.nombre || 'Nuevo Contacto WhatsApp',
        celular: phone,
        email: sLead.email || '',
        etapa: sLead.etapa || 'NUEVO',
        temperatura: sLead.prioridad || sLead.temperatura || 'POTENCIAL',
        inmueble: sLead.interes || sLead.inmueble || sLead.zona || 'Consulta General',
        presupuesto: sLead.presupuesto || 'Por definir',
        origen: sLead.origen || 'WhatsApp Web',
        ultimo_mensaje: sLead.ultimo_mensaje || sLead.formulario || '',
        recordatorio: sLead.fecha_visita || sLead.recordatorio || '',
        notas: sLead.notas || ''
      });
      changed = true;
    }
  });

  if (changed) {
    saveLeadsToStorage();
    renderView();
    renderKPIs();
  }
}

function manualRefresh() {
  const icon = document.getElementById('refreshIcon');
  if (icon) icon.classList.add('fa-spin');
  fetchLiveBackendLeads();
  renderView();
  renderKPIs();
  setTimeout(() => {
    if (icon) icon.classList.remove('fa-spin');
    showToast('🔄 Datos sincronizados en vivo.');
  }, 600);
}

// ==========================================
// VISTA DUAL (KANBAN vs TABLA)
// ==========================================
function switchView(viewName) {
  currentView = viewName;
  document.getElementById('btnViewKanban').classList.toggle('active', viewName === 'kanban');
  document.getElementById('btnViewTable').classList.toggle('active', viewName === 'table');

  const kanbanEl = document.getElementById('kanbanWrapper');
  const tableEl = document.getElementById('tableViewContainer');

  if (viewName === 'kanban') {
    kanbanEl.style.display = 'flex';
    tableEl.classList.remove('active');
  } else {
    kanbanEl.style.display = 'none';
    tableEl.classList.add('active');
  }

  renderView();
}

function renderView() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

  const filtered = leads.filter(l => {
    // Filtro por Prioridad / Temperatura
    if (currentPriorityFilter !== 'TODAS') {
      if (currentPriorityFilter === 'POTENCIAL' && l.temperatura !== 'POTENCIAL') return false;
      if (currentPriorityFilter === 'INDECISO' && l.temperatura !== 'INDECISO') return false;
      if (currentPriorityFilter === 'PASIVO' && l.temperatura !== 'PASIVO') return false;
      if (currentPriorityFilter === 'CERRADO' && l.temperatura !== 'CERRADO') return false;
    }

    // Filtro por Etapa
    if (currentStageFilter !== 'TODAS' && l.etapa !== currentStageFilter) return false;

    // Filtro por Origen
    if (currentOriginFilter !== 'TODOS' && l.origen !== currentOriginFilter) return false;

    // Búsqueda de texto
    if (search) {
      const match = (
        (l.nombre || '').toLowerCase().includes(search) ||
        (l.celular || '').includes(search) ||
        (l.inmueble || '').toLowerCase().includes(search) ||
        (l.notas || '').toLowerCase().includes(search) ||
        (l.presupuesto || '').toLowerCase().includes(search) ||
        (l.email || '').toLowerCase().includes(search)
      );
      if (!match) return false;
    }

    return true;
  });

  const countLabel = document.getElementById('leadCountLabel');
  if (countLabel) countLabel.innerText = filtered.length;

  if (currentView === 'kanban') {
    renderKanban(filtered);
  } else {
    renderTable(filtered);
  }
}

// ==========================================
// RENDERIZADO KANBAN
// ==========================================
function renderKanban(filteredLeads) {
  const wrapper = document.getElementById('kanbanWrapper');
  wrapper.innerHTML = '';

  STAGES.forEach(stage => {
    const colDiv = document.createElement('div');
    colDiv.className = 'kanban-column';
    colDiv.id = `col_${stage.id}`;
    
    colDiv.addEventListener('dragover', handleDragOver);
    colDiv.addEventListener('dragleave', handleDragLeave);
    colDiv.addEventListener('drop', (e) => handleDrop(e, stage.id));

    const stageLeads = filteredLeads.filter(l => l.etapa === stage.id);

    colDiv.innerHTML = `
      <div class="col-header">
        <div class="col-title-group">
          <i class="fa-solid ${stage.icon}" style="color:var(--lime-primary); font-size:0.85rem;"></i>
          <span class="col-title">${stage.title}</span>
          <span class="col-count">${stageLeads.length}</span>
        </div>
        <button class="col-quick-add" onclick="openCreateLeadModal('${stage.id}')" title="Agregar prospecto a esta columna">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
      <div class="cards-container" id="cards_${stage.id}">
      </div>
    `;

    const cardsContainer = colDiv.querySelector('.cards-container');
    stageLeads.forEach(lead => {
      const card = createLeadCardElement(lead);
      cardsContainer.appendChild(card);
    });

    wrapper.appendChild(colDiv);
  });
}

function createLeadCardElement(lead) {
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.id = `card_${lead.id}`;
  card.draggable = true;

  card.addEventListener('dragstart', (e) => handleDragStart(e, lead.id));
  card.addEventListener('dragend', handleDragEnd);

  const initials = (lead.nombre || 'NC')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  let tempClass = 'temp-potencial';
  let tempLabel = '🔥 Caliente';
  if (lead.temperatura === 'INDECISO') {
    tempClass = 'temp-indeciso';
    tempLabel = '⚡ Tibio';
  } else if (lead.temperatura === 'PASIVO') {
    tempClass = 'temp-pasivo';
    tempLabel = '❄️ Frío';
  } else if (lead.temperatura === 'CERRADO') {
    tempClass = 'temp-cerrado';
    tempLabel = '🏆 Ganado';
  }

  const cleanPhone = (lead.celular || '').replace(/\D/g, '');
  const waMsg = encodeURIComponent(`Hola ${lead.nombre}, un gusto saludarte. Te escribo de OneLeads / Realty ONE sobre tu consulta de ${lead.inmueble || 'propiedades'}. ✨`);
  const waUrl = `https://wa.me/${cleanPhone}?text=${waMsg}`;

  card.innerHTML = `
    <div class="card-top">
      <div class="card-user">
        <div class="card-avatar">${initials}</div>
        <div>
          <div class="card-name">${lead.nombre}</div>
          <div class="card-phone">${lead.celular}</div>
        </div>
      </div>
      <span class="temp-badge ${tempClass}">${tempLabel}</span>
    </div>

    <div class="card-details">
      <div class="detail-row">
        <span>Interés:</span>
        <span class="detail-value">${lead.inmueble || 'General'}</span>
      </div>
      <div class="detail-row">
        <span>Presupuesto:</span>
        <span class="detail-value" style="color:var(--lime-primary);">${lead.presupuesto || 'Por definir'}</span>
      </div>
      <div class="detail-row">
        <span>Origen:</span>
        <span class="detail-value">${lead.origen || 'WhatsApp Web'}</span>
      </div>
    </div>

    ${lead.recordatorio ? `
      <div class="card-reminder">
        <i class="fa-regular fa-clock"></i> Recordatorio: ${lead.recordatorio}
      </div>
    ` : ''}

    ${lead.ultimo_mensaje ? `
      <div class="card-msg-preview">"${lead.ultimo_mensaje}"</div>
    ` : ''}

    <div class="card-actions">
      <a href="${waUrl}" target="_blank" class="btn-wa-direct" title="Abrir chat directo en WhatsApp">
        <i class="fa-brands fa-whatsapp"></i> Chat 1-Clic
      </a>
      <button class="btn-card-icon" onclick="openEditLeadModal('${lead.id}')" title="Ver Ficha / Editar">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="btn-card-icon" onclick="openReminderModal('${lead.id}')" title="Programar Recordatorio">
        <i class="fa-regular fa-bell"></i>
      </button>
      <button class="btn-card-icon btn-card-delete" onclick="deleteLeadById('${lead.id}')" title="Eliminar del embudo">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `;

  return card;
}

// ==========================================
// RENDERIZADO TABLA (SIN E-REALTOR)
// ==========================================
function renderTable(filteredLeads) {
  const tbody = document.getElementById('leadsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (filteredLeads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:30px; color:var(--text-muted);">
          <i class="fa-solid fa-inbox" style="font-size:2rem; margin-bottom:8px; opacity:0.5;"></i>
          <div>No se encontraron prospectos con los filtros actuales.</div>
        </td>
      </tr>
    `;
    return;
  }

  filteredLeads.forEach(lead => {
    const tr = document.createElement('tr');

    let tempBadge = '<span class="temp-badge temp-potencial">🔥 Caliente</span>';
    if (lead.temperatura === 'INDECISO') tempBadge = '<span class="temp-badge temp-indeciso">⚡ Tibio</span>';
    if (lead.temperatura === 'PASIVO') tempBadge = '<span class="temp-badge temp-pasivo">❄️ Frío</span>';
    if (lead.temperatura === 'CERRADO') tempBadge = '<span class="temp-badge temp-cerrado">🏆 Ganado</span>';

    const stageObj = STAGES.find(s => s.id === lead.etapa) || { title: lead.etapa };
    const cleanPhone = (lead.celular || '').replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Hola ' + lead.nombre + ', te escribo de OneLeads / Realty ONE Group Bolivia.')}`;

    tr.innerHTML = `
      <td>${tempBadge}</td>
      <td>
        <div style="font-weight:700; color:#fff;">${lead.nombre}</div>
        <div style="font-size:0.75rem; color:var(--lime-primary); font-family:monospace;">${lead.celular}</div>
        ${lead.email ? `<div style="font-size:0.72rem; color:var(--text-muted);">${lead.email}</div>` : ''}
      </td>
      <td>
        <div style="font-weight:600; color:#e2e8f0;">${lead.inmueble || 'General'}</div>
        <div style="font-size:0.75rem; color:var(--lime-primary);">${lead.presupuesto || 'Por definir'}</div>
      </td>
      <td>
        <span style="background:#16202a; border:1px solid #243140; color:#cbd5e1; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:700;">
          ${stageObj.title}
        </span>
      </td>
      <td>
        ${lead.recordatorio ? `
          <div style="color:#ffd700; font-size:0.75rem; font-weight:600;">
            <i class="fa-regular fa-clock"></i> ${lead.recordatorio}
          </div>
        ` : `<span style="color:var(--text-muted); font-size:0.72rem;">Sin agendar</span>`}
      </td>
      <td style="max-width:240px; font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
        "${lead.ultimo_mensaje || lead.notas || 'Sin mensajes registrados'}"
      </td>
      <td>
        <div style="display:flex; flex-direction:column; gap:5px; min-width:105px;">
          <a href="${waUrl}" target="_blank" class="btn-wa-action" title="Atender cliente vía WhatsApp">
            <i class="fa-brands fa-whatsapp"></i> Atender
          </a>
          <div style="display:flex; gap:4px;">
            <button class="action-btn" onclick="openEditLeadModal('${lead.id}')" style="background:#1c2730; font-size:0.74rem; padding:4px 8px; flex:1;" title="Ver Ficha">
              <i class="fa-solid fa-pen-to-square"></i> Ficha
            </button>
            <button class="action-btn" onclick="deleteLeadById('${lead.id}')" style="background:rgba(255,77,79,0.15); color:#ff4d4f; border:1px solid rgba(255,77,79,0.3); font-size:0.74rem; padding:4px 8px;" title="Eliminar">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// KPIS METRIC COUNTERS
// ==========================================
function renderKPIs() {
  const total = leads.length;
  const pot = leads.filter(l => l.temperatura === 'POTENCIAL').length;
  const ind = leads.filter(l => l.temperatura === 'INDECISO').length;
  const pas = leads.filter(l => l.temperatura === 'PASIVO').length;
  const vis = leads.filter(l => l.etapa === 'VISITA_AGENDADA' || Boolean(l.recordatorio)).length;
  const cer = leads.filter(l => l.etapa === 'CERRADO' || l.temperatura === 'CERRADO').length;

  document.getElementById('kpiTotal').innerText = total;
  document.getElementById('kpiPotencial').innerText = pot;
  document.getElementById('kpiIndeciso').innerText = ind;
  document.getElementById('kpiPasivo').innerText = pas;
  document.getElementById('kpiVisitas').innerText = vis;
  document.getElementById('kpiCerrado').innerText = cer;
}

function filterByPriorityKPI(prio) {
  currentPriorityFilter = prio;
  const sel = document.getElementById('priorityFilter');
  if (sel) sel.value = prio;
  renderView();
}

function filterByStageKPI(stage) {
  currentStageFilter = stage;
  const sel = document.getElementById('stageFilter');
  if (sel) sel.value = stage;
  renderView();
}

// ==========================================
// DRAG & DROP NATIVO
// ==========================================
function handleDragStart(e, leadId) {
  draggedLeadId = leadId;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', leadId);
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
  draggedLeadId = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const col = e.currentTarget;
  if (!col.classList.contains('drag-over')) {
    col.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, targetStageId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
  if (!leadId) return;

  const lead = leads.find(l => l.id === leadId);
  if (lead && lead.etapa !== targetStageId) {
    lead.etapa = targetStageId;
    saveLeadsToStorage();
    renderView();
    renderKPIs();

    const stageObj = STAGES.find(s => s.id === targetStageId);
    showToast(`⚡ "${lead.nombre}" movido a [${stageObj ? stageObj.title : targetStageId}]`);
  }
}

// ==========================================
// FILTROS Y BÚSQUEDA
// ==========================================
function setupSearchAndFilters() {
  document.getElementById('searchInput')?.addEventListener('input', renderView);
  document.getElementById('priorityFilter')?.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value;
    renderView();
  });
  document.getElementById('stageFilter')?.addEventListener('change', (e) => {
    currentStageFilter = e.target.value;
    renderView();
  });
  document.getElementById('originFilter')?.addEventListener('change', (e) => {
    currentOriginFilter = e.target.value;
    renderView();
  });
}

// ==========================================
// MODAL: CREAR / EDITAR PROSPECTO
// ==========================================
function openCreateLeadModal(defaultStage = 'NUEVO') {
  activeEditingLeadId = null;
  document.getElementById('leadModalTitle').innerHTML = '<i class="fa-solid fa-user-plus"></i> Nuevo Prospecto';
  document.getElementById('formName').value = '';
  document.getElementById('formPhone').value = '';
  document.getElementById('formEmail').value = '';
  document.getElementById('formInterest').value = '';
  document.getElementById('formBudget').value = '';
  document.getElementById('formStage').value = defaultStage;
  document.getElementById('formTemp').value = 'POTENCIAL';
  document.getElementById('formOrigin').value = 'WhatsApp Web';
  document.getElementById('formNotes').value = '';

  document.getElementById('leadModal').classList.add('active');
}

function openEditLeadModal(id) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  activeEditingLeadId = id;

  document.getElementById('leadModalTitle').innerHTML = `<i class="fa-solid fa-user-pen"></i> Ficha: ${lead.nombre}`;
  document.getElementById('formName').value = lead.nombre || '';
  document.getElementById('formPhone').value = lead.celular || '';
  document.getElementById('formEmail').value = lead.email || '';
  document.getElementById('formInterest').value = lead.inmueble || '';
  document.getElementById('formBudget').value = lead.presupuesto || '';
  document.getElementById('formStage').value = lead.etapa || 'NUEVO';
  document.getElementById('formTemp').value = lead.temperatura || 'POTENCIAL';
  document.getElementById('formOrigin').value = lead.origen || 'WhatsApp Web';
  document.getElementById('formNotes').value = lead.notas || '';

  document.getElementById('leadModal').classList.add('active');
}

function closeLeadModal() {
  document.getElementById('leadModal').classList.remove('active');
  activeEditingLeadId = null;
}

function saveLeadForm() {
  const name = document.getElementById('formName').value.trim();
  const phone = document.getElementById('formPhone').value.trim();

  if (!name || !phone) {
    alert('Por favor ingresa al menos el Nombre y el Número de Celular.');
    return;
  }

  const formData = {
    nombre: name,
    celular: phone,
    email: document.getElementById('formEmail').value.trim(),
    inmueble: document.getElementById('formInterest').value.trim() || 'Consulta General',
    presupuesto: document.getElementById('formBudget').value.trim() || 'Por definir',
    etapa: document.getElementById('formStage').value,
    temperatura: document.getElementById('formTemp').value,
    origen: document.getElementById('formOrigin').value,
    notas: document.getElementById('formNotes').value.trim()
  };

  if (activeEditingLeadId) {
    const idx = leads.findIndex(l => l.id === activeEditingLeadId);
    if (idx >= 0) {
      Object.assign(leads[idx], formData);
      showToast(`✅ Ficha de "${name}" actualizada.`);
    }
  } else {
    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recordatorio: '',
      ultimo_mensaje: 'Prospecto creado manualmente.',
      ...formData
    };
    leads.unshift(newLead);
    showToast(`🎉 Nuevo prospecto "${name}" añadido.`);
  }

  saveLeadsToStorage();
  closeLeadModal();
  renderView();
  renderKPIs();
}

function deleteLeadById(id) {
  const lead = leads.find(l => l.id === id);
  const name = lead ? lead.nombre : 'este prospecto';
  if (!confirm(`¿Eliminar a "${name}" del CRM?`)) return;

  leads = leads.filter(l => l.id !== id);
  saveLeadsToStorage();
  renderView();
  renderKPIs();
  showToast(`🗑️ Prospecto "${name}" eliminado.`);
}

function clearAllBoard() {
  if (!confirm('⚠️ ¿Estás seguro de vaciar todos los prospectos del CRM?')) return;
  leads = [];
  saveLeadsToStorage();
  renderView();
  renderKPIs();
  showToast('🧹 CRM vaciado por completo.');
}

// ==========================================
// MODAL: RECORDATORIO / FOLLOW-UP
// ==========================================
let activeReminderLeadId = null;

function openReminderModal(id) {
  const lead = leads.find(l => l.id === id);
  if (!lead) return;
  activeReminderLeadId = id;

  document.getElementById('reminderLeadName').innerText = lead.nombre;
  document.getElementById('reminderTime').value = lead.recordatorio || '';
  document.getElementById('reminderModal').classList.add('active');
}

function closeReminderModal() {
  document.getElementById('reminderModal').classList.remove('active');
  activeReminderLeadId = null;
}

function saveReminder() {
  if (!activeReminderLeadId) return;
  const lead = leads.find(l => l.id === activeReminderLeadId);
  if (!lead) return;

  const val = document.getElementById('reminderTime').value.trim();
  lead.recordatorio = val;
  saveLeadsToStorage();
  closeReminderModal();
  renderView();
  renderKPIs();
  showToast(`⏰ Recordatorio programado para "${lead.nombre}": ${val || 'Eliminado'}`);
}

// ==========================================
// DRAWER: PLANTILLAS DE 1 CLIC
// ==========================================
function toggleTemplateDrawer() {
  const overlay = document.getElementById('drawerOverlay');
  const panel = document.getElementById('templateDrawerPanel');
  const isOpen = panel.classList.contains('open');

  closeAllDrawers();

  if (!isOpen) {
    panel.classList.add('open');
    overlay.classList.add('active');
  }
}

function renderTemplates() {
  const container = document.getElementById('templatesList');
  if (!container) return;
  container.innerHTML = '';

  TEMPLATES.forEach(t => {
    const div = document.createElement('div');
    div.className = 'template-card';
    div.innerHTML = `
      <div class="template-title">
        <span>${t.titulo}</span>
        <button class="crm-btn crm-btn-lime" style="padding:3px 8px; font-size:0.72rem;" onclick="copyTemplateText('${encodeURIComponent(t.texto)}')">
          <i class="fa-regular fa-copy"></i> Copiar
        </button>
      </div>
      <div class="template-text">${t.texto}</div>
    `;
    container.appendChild(div);
  });
}

function copyTemplateText(encodedText) {
  const text = decodeURIComponent(encodedText);
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 ¡Plantilla copiada al portapapeles!');
  }).catch(() => {
    alert('Texto copiado: ' + text);
  });
}

// ==========================================
// DRAWER: SIMULADOR WHATSAPP EN VIVO
// ==========================================
function toggleSimulatorDrawer() {
  const overlay = document.getElementById('drawerOverlay');
  const panel = document.getElementById('simulatorDrawerPanel');
  const isOpen = panel.classList.contains('open');

  closeAllDrawers();

  if (!isOpen) {
    panel.classList.add('open');
    overlay.classList.add('active');
  }
}

function closeAllDrawers() {
  document.getElementById('templateDrawerPanel')?.classList.remove('open');
  document.getElementById('simulatorDrawerPanel')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('active');
}

function sendSimMessage() {
  const input = document.getElementById('simUserInput');
  const msg = input.value.trim();
  if (!msg) return;

  const chatBox = document.getElementById('simChatBox');
  
  // Mensaje Usuario
  const userBubble = document.createElement('div');
  userBubble.className = 'bubble bubble-user';
  userBubble.innerText = msg;
  chatBox.appendChild(userBubble);
  input.value = '';

  chatBox.scrollTop = chatBox.scrollHeight;

  // Respuesta Bot Simulada
  setTimeout(() => {
    const botBubble = document.createElement('div');
    botBubble.className = 'bubble bubble-bot';
    
    const lower = msg.toLowerCase();
    if (lower.includes('visita') || lower.includes('agenda')) {
      botBubble.innerText = '🦁 ¡Excelente! Con gusto coordinamos la visita presencial. ¿Prefieres en horario de la mañana (10:00 AM) o tarde (15:30)?';
    } else if (lower.includes('precio') || lower.includes('costo') || lower.includes('$')) {
      botBubble.innerText = '🦁 La propiedad cuenta con precio oficial de lista con Folio Real en Derechos Reales. ¿Deseas que te enviemos la ficha técnica completa en PDF?';
    } else if (lower.includes('banco') || lower.includes('crédito')) {
      botBubble.innerText = '🦁 Trabajamos con todos los bancos en Bolivia (BNB, Mercantil, BCP, Bisa, Banco Unión). ¿Cuentas con cuota inicial del 20%?';
    } else {
      botBubble.innerText = '🦁 ¡Hola! Gracias por tu interés. Tu consulta ha sido registrada con éxito en el embudo OneLeads. ✨';
    }

    chatBox.appendChild(botBubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 600);
}

function quickSend(text) {
  document.getElementById('simUserInput').value = text;
  sendSimMessage();
}

// ==========================================
// EXPORTACIÓN A EXCEL (.XLS / XML)
// ==========================================
function exportKanbanToExcel() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n<Styles>\n<Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>\n<Style ss:ID="HeaderTitle"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="14" ss:Color="#A3E635" ss:Bold="1"/><Interior ss:Color="#0F151C" ss:Pattern="Solid"/></Style>\n<Style ss:ID="ColHeader"><Alignment ss:Horizontal="Center" ss:Vertical="Center"/><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000" ss:Bold="1"/><Interior ss:Color="#A3E635" ss:Pattern="Solid"/></Style>\n</Styles>\n<Worksheet ss:Name="OneLeads_CRM">\n<Table>\n<Column ss:Width="160"/><Column ss:Width="130"/><Column ss:Width="160"/><Column ss:Width="140"/><Column ss:Width="120"/><Column ss:Width="160"/><Column ss:Width="120"/><Column ss:Width="220"/>\n<Row ss:Height="28"><Cell ss:MergeAcross="7" ss:StyleID="HeaderTitle"><Data ss:Type="String">📊 REPORTE DE EMBUDO - ONELEADS CRM</Data></Cell></Row>\n<Row ss:Height="22">\n<Cell ss:StyleID="ColHeader"><Data ss:Type="String">Nombre Cliente</Data></Cell><Cell ss:StyleID="ColHeader"><Data ss:Type="String">Celular</Data></Cell><Cell ss:StyleID="ColHeader"><Data ss:Type="String">Email</Data></Cell><Cell ss:StyleID="ColHeader"><Data ss:Type="String">Etapa Embudo</Data></Cell><Cell ss:StyleID="ColHeader"><Data ss:Type="String">Temperatura</Data></Cell><Cell ss:StyleID="ColHeader"><Data ss:Type="String">Inmueble / Interés</Data></Cell><Cell ss:StyleID="ColHeader"><Data ss:Type="String">Presupuesto</Data></Cell><Cell ss:StyleID="ColHeader"><Data ss:Type="String">Notas</Data></Cell>\n</Row>';

  leads.forEach(l => {
    xml += `\n<Row ss:Height="20">` +
      `<Cell><Data ss:Type="String">${escapeXml(l.nombre)}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${escapeXml(l.celular)}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${escapeXml(l.email)}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${escapeXml(l.etapa)}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${escapeXml(l.temperatura)}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${escapeXml(l.inmueble)}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${escapeXml(l.presupuesto)}</Data></Cell>` +
      `<Cell><Data ss:Type="String">${escapeXml(l.notas)}</Data></Cell>` +
      `</Row>`;
  });

  xml += `\n</Table>\n</Worksheet>\n</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `OneLeads_CRM_Report_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📊 Reporte de Excel descargado con éxito.');
}

function escapeXml(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================
function showToast(msg) {
  const toast = document.getElementById('crmToast');
  const msgEl = document.getElementById('toastMsg');
  if (!toast || !msgEl) return;

  msgEl.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}
