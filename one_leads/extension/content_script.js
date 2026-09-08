/**
 * OneLeads - Chrome Extension Content Script
 * Inyectado directamente en https://web.whatsapp.com
 */

(function() {
  console.log('🦁 [OneLeads] Inicializando CRM Visual en WhatsApp Web...');

  // Plantillas de 1 Clic
  const TEMPLATES = [
    { title: '🦁 1. Saludo Inicial', text: '¡Hola! 👋 Te saluda el equipo de OneLeads / Realty ONE Group Bolivia. ¿En qué propiedad estás interesado/a para coordinar detalles?' },
    { title: '📅 2. Agendar Visita', text: 'Con mucho gusto coordinamos tu visita presencial. Por favor confírmanos qué día y horario te queda mejor (Mañana o Tarde).' },
    { title: '📑 3. Enviar Ficha', text: 'Te comparto la información y ficha técnica de la propiedad con Folio Real al día y precio oficial.' },
    { title: '🏦 4. Requisitos Bancarios', text: 'Trabajamos con financiamiento bancario en todos los bancos de Bolivia. ¿Deseas una simulación de cuotas?' }
  ];

  function injectWidget() {
    if (document.getElementById('oneleads-widget-toggle')) return;

    // 1. Botón Superior de Apertura
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'oneleads-widget-toggle';
    toggleBtn.innerHTML = '<span>⚡ OneLeads CRM</span>';
    toggleBtn.title = 'Abrir Embudo Kanban y Plantillas 1-Clic';
    toggleBtn.addEventListener('click', toggleSidebar);
    document.body.appendChild(toggleBtn);

    // 2. Barra Lateral del CRM
    const sidebar = document.createElement('div');
    sidebar.id = 'oneleads-sidebar';
    sidebar.innerHTML = `
      <div class="oneleads-header">
        <div class="oneleads-title">
          <span>⚡ OneLeads</span> CRM Visual
        </div>
        <button class="oneleads-close" id="oneleads-close-btn">&times;</button>
      </div>

      <div class="oneleads-content">
        <!-- Estado del Contacto Activo -->
        <div>
          <div class="oneleads-section-title">📊 Etapa del Embudo (Chat Activo)</div>
          <div class="oneleads-stage-selector">
            <button class="oneleads-stage-btn" data-stage="NUEVO">📥 Nuevo</button>
            <button class="oneleads-stage-btn" data-stage="CALIFICACION">💬 Calificado</button>
            <button class="oneleads-stage-btn" data-stage="VISITA_AGENDADA">📅 Visita</button>
            <button class="oneleads-stage-btn" data-stage="NEGOCIACION">💼 Propuesta</button>
            <button class="oneleads-stage-btn" data-stage="CERRADO">🏆 Cerrado</button>
            <button class="oneleads-stage-btn" data-stage="DESCARTADO">❌ Descartado</button>
          </div>
        </div>

        <!-- Respuestas Rápidas en 1 Clic -->
        <div>
          <div class="oneleads-section-title">⚡ Respuestas en 1 Clic (Insertar en Chat)</div>
          <div class="oneleads-templates-box" id="oneleads-tpl-container">
            ${TEMPLATES.map((t, idx) => `
              <button class="oneleads-tpl-btn" data-index="${idx}">
                <span>${t.title}</span>
                <span style="color:#a3e635; font-size:10px;">Insertar ➔</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Acceso Rápido al Tablero Completo -->
        <div>
          <div class="oneleads-section-title">🚀 Panel Completo</div>
          <p style="font-size:11px; color:#94a3b8; line-height:1.4;">
            Organiza tus contactos en columnas Drag & Drop, programa recordatorios y exporta a Excel.
          </p>
        </div>
      </div>

      <div class="oneleads-footer">
        <button class="oneleads-open-full" id="oneleads-open-kanban">
          📊 Abrir Tablero Kanban Completo
        </button>
      </div>
    `;

    document.body.appendChild(sidebar);

    document.getElementById('oneleads-close-btn').addEventListener('click', toggleSidebar);

    // Eventos de inserción de plantillas al input de WhatsApp
    document.querySelectorAll('.oneleads-tpl-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (TEMPLATES[idx]) {
          insertTextIntoWhatsAppInput(TEMPLATES[idx].text);
        }
      });
    });

    // Eventos de cambio de etapa
    document.querySelectorAll('.oneleads-stage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.oneleads-stage-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const stage = btn.getAttribute('data-stage');
        alert(`Prospecto movido a etapa: [${stage}]`);
      });
    });

    document.getElementById('oneleads-open-kanban').addEventListener('click', () => {
      window.open('https://realyonegroupbolivia.e-techgroupbolivia.com/one_leads/app_crm.html', '_blank');
    });
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('oneleads-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  }

  function insertTextIntoWhatsAppInput(text) {
    // Buscar el elemento editable de WhatsApp Web
    const chatInput = document.querySelector('footer div[contenteditable="true"]') || 
                      document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
                      document.querySelector('div[contenteditable="true"]');

    if (chatInput) {
      chatInput.focus();
      document.execCommand('insertText', false, text);
    } else {
      navigator.clipboard.writeText(text);
      alert('Texto copiado al portapapeles. Pégalo en el chat con Ctrl+V.');
    }
  }

  // Esperar a que cargue WhatsApp Web
  const checkInterval = setInterval(() => {
    if (document.body) {
      injectWidget();
      clearInterval(checkInterval);
    }
  }, 2000);

})();
