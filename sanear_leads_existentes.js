const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, 'leads.json'),
  path.join(__dirname, 'backend', 'leads.json')
];

function sanitizeLeadList(leads) {
  return leads.map(l => {
    // 1. Sanear nombre
    const dirtyNames = ['espero', 'buen día', 'buen dia', 'feliz cumpleaños amiga querida', 'feliz cumpleanos amiga querida', 'duc', 'cliente'];
    if (l.cliente_nombre && dirtyNames.includes(l.cliente_nombre.toLowerCase().trim())) {
      l.cliente_nombre = 'Por identificar';
    }

    // 2. Sanear caso Century21 (+591 77800939)
    if (l.numero_celular && l.numero_celular.includes('77800939')) {
      l.cliente_nombre = 'Por identificar';
      l.tipo_interes = 'Departamento (Co-Brokering Century21)';
      l.presupuesto = '100.000 $us';
      l.notas_asesor = 'Colega Asesor Century21 - Requerimiento cliente: Depto 2 dorms max piso 5 hasta $100.000 $us';
      l.etapa_embudo = 'SOLICITUD';
      l.score = 85;
      l.prioridad = 'POTENCIAL';
      l.prioridad_label = '🔥 Potencial (Alta)';
    }

    // 3. Sanear caso saludo de cumpleaños (+591 78999234)
    if (l.numero_celular && l.numero_celular.includes('78999234')) {
      l.cliente_nombre = 'Por identificar';
      l.horario_visita_solicitado = null;
      if (l.formulario_datos) l.formulario_datos.horario_visita = null;
      l.etapa_embudo = 'SOLICITUD';
      l.score = 15;
      l.prioridad = 'PASIVO';
      l.prioridad_label = '❄️ Pasivo (Baja)';
    }

    // 4. Sanear visitas falsas
    if (l.horario_visita_solicitado && (
      l.horario_visita_solicitado.toLowerCase().includes('cumpleaños') ||
      l.horario_visita_solicitado.toLowerCase().includes('cumpleanos') ||
      l.horario_visita_solicitado.toLowerCase().includes('amiga') ||
      l.horario_visita_solicitado.toLowerCase().includes('por ahora') ||
      l.horario_visita_solicitado.toLowerCase().includes('gracias')
    )) {
      l.horario_visita_solicitado = null;
      if (l.formulario_datos) l.formulario_datos.horario_visita = null;
      if (l.etapa_embudo === 'VISITA_AGENDADA') {
        l.etapa_embudo = 'SOLICITUD';
      }
    }

    return l;
  });
}

for (const f of files) {
  if (fs.existsSync(f)) {
    try {
      const data = JSON.parse(fs.readFileSync(f, 'utf8') || '[]');
      const cleaned = sanitizeLeadList(data);
      fs.writeFileSync(f, JSON.stringify(cleaned, null, 2), 'utf8');
      console.log(`✅ Archivo saneado: ${f} (${cleaned.length} prospectos)`);
    } catch (e) {
      console.error(`Error procesando ${f}:`, e.message);
    }
  }
}
