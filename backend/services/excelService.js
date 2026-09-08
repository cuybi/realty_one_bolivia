/**
 * Generador de Reportes en Excel (.xlsx / .xml) y CSV para Realty ONE Group Bolivia
 * Diseñado con formato corporativo Gold & Black y codificación UTF-8 para apertura limpia en Excel.
 */

/**
 * Escapa caracteres para formato XML de Excel
 */
function escapeXml(str = '') {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Genera un archivo Excel XML Spreadsheet 2003 (.xlsx/.xls)
 * Compatible con 100% de versiones de Microsoft Excel, Google Sheets y LibreOffice Calc.
 * Incluye estilos de celda dorados, filtros automáticos y anchos de columna preconfigurados.
 */
function generateExcelXML(leads = []) {
  const headers = [
    { title: 'ID Prospecto', width: 140 },
    { title: 'Prioridad', width: 130 },
    { title: 'Score (0-100)', width: 80 },
    { title: 'Nombre del Cliente', width: 180 },
    { title: 'Número de Celular', width: 130 },
    { title: 'E-mail', width: 180 },
    { title: 'Tipo de Interés', width: 160 },
    { title: 'Zona de Interés', width: 150 },
    { title: 'Presupuesto / Inmueble', width: 160 },
    { title: 'Fecha Completa', width: 110 },
    { title: 'Año', width: 60 },
    { title: 'Mes', width: 90 },
    { title: 'Día', width: 50 },
    { title: 'Día de la Semana', width: 100 },
    { title: 'Hora', width: 80 },
    { title: 'Estado Comercial', width: 110 },
    { title: 'Canal de Origen', width: 120 },
    { title: 'Campaña Meta Ads', width: 180 },
    { title: 'Acción Sugerida', width: 280 },
    { title: 'Resumen IA', width: 260 },
    { title: 'Último Mensaje', width: 300 }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Reporte de Prospectos WhatsApp - Realty ONE Group Bolivia</Title>
  <Subject>Clasificación Inteligente de Leads</Subject>
  <Author>Realty ONE Group Bolivia ONEBot</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <!-- Estilo Encabezado Principal Dorado -->
  <Style ss:ID="HeaderTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#D4AF37" ss:Bold="1"/>
   <Interior ss:Color="#0B0F12" ss:Pattern="Solid"/>
  </Style>
  <!-- Estilo Columnas de Tabla -->
  <Style ss:ID="ColHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000" ss:Bold="1"/>
   <Interior ss:Color="#D4AF37" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#999999"/>
   </Borders>
  </Style>
  <!-- Estilos por Prioridad -->
  <Style ss:ID="LeadPotencial">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#9C0006" ss:Bold="1"/>
   <Interior ss:Color="#FFC7CE" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="LeadIndeciso">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#9C6500" ss:Bold="1"/>
   <Interior ss:Color="#FFEB9C" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="LeadPasivo">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#00386B"/>
   <Interior ss:Color="#D6E8FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="LeadPropietario">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#006100" ss:Bold="1"/>
   <Interior ss:Color="#C6EFCE" ss:Pattern="Solid"/>
  </Style>
  <!-- Estilo Celdas Regulares -->
  <Style ss:ID="CellNormal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#333333"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
   </Borders>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#333333"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Prospectos y Conversaciones">
  <Table ss:DefaultRowHeight="20">
`;

  // Anchos de columna
  headers.forEach(h => {
    xml += `   <Column ss:Width="${h.width}"/>\n`;
  });

  // Fila de Título Corporativo
  xml += `   <Row ss:Height="30">\n`;
  xml += `    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="HeaderTitle"><Data ss:Type="String">🦁 REALTY ONE GROUP BOLIVIA - REPORTE DE CONVERSACIONES Y PROSPECTOS CLASIFICADOS</Data></Cell>\n`;
  xml += `   </Row>\n`;

  // Fila de Encabezados de Columna
  xml += `   <Row ss:Height="24">\n`;
  headers.forEach(h => {
    xml += `    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">${escapeXml(h.title)}</Data></Cell>\n`;
  });
  xml += `   </Row>\n`;

  // Filas de Datos de Leads
  leads.forEach(lead => {
    let stylePriority = 'CellNormal';
    if (lead.prioridad === 'POTENCIAL') stylePriority = 'LeadPotencial';
    else if (lead.prioridad === 'INDECISO') stylePriority = 'LeadIndeciso';
    else if (lead.prioridad === 'PASIVO') stylePriority = 'LeadPasivo';
    else if (lead.prioridad === 'PROPIETARIO') stylePriority = 'LeadPropietario';

    xml += `   <Row ss:Height="22">\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.id)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="${stylePriority}"><Data ss:Type="String">${escapeXml(lead.prioridad_label || lead.prioridad)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number">${lead.score || 0}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.cliente_nombre || 'Por identificar')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.numero_celular)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.email || 'Pendiente')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.tipo_interes || 'Consulta General')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.zona_interes || 'Santa Cruz')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.presupuesto || 'Por definir')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.fecha_completa)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.anio)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.mes)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.dia)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.dia_semana)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.hora)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellCenter"><Data ss:Type="String">${escapeXml(lead.estado_comercial || 'Nuevo')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.canal_origen || 'WhatsApp')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.campana || 'General')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.accion_sugerida || '')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.resumen || '')}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="CellNormal"><Data ss:Type="String">${escapeXml(lead.ultimo_mensaje || '')}</Data></Cell>\n`;
    xml += `   </Row>\n`;
  });

  xml += `  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>2</SplitHorizontal>
   <TopRowBottomPane>2</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
  <AutoFilter x:Range="R2C1:R${leads.length + 2}C${headers.length}" xmlns="urn:schemas-microsoft-com:office:excel"/>
 </Worksheet>
</Workbook>`;

  return xml;
}

/**
 * Genera un archivo CSV con delimitador de comas y UTF-8 BOM
 * para que Microsoft Excel lo abra sin problemas de codificación.
 */
function generateCSV(leads = []) {
  const headers = [
    'ID Prospecto',
    'Prioridad',
    'Score',
    'Nombre Cliente',
    'Celular',
    'Email',
    'Tipo Interes',
    'Zona Interes',
    'Presupuesto',
    'Fecha Completa',
    'Año',
    'Mes',
    'Día',
    'Día Semana',
    'Hora',
    'Estado Comercial',
    'Canal Origen',
    'Campaña',
    'Accion Sugerida',
    'Resumen IA',
    'Ultimo Mensaje'
  ];

  function escapeCsvField(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  const rows = [];
  rows.push(headers.map(escapeCsvField).join(','));

  leads.forEach(l => {
    const row = [
      l.id,
      l.prioridad_label || l.prioridad,
      l.score,
      l.cliente_nombre || 'Por identificar',
      l.numero_celular,
      l.email || 'Pendiente',
      l.tipo_interes || 'Consulta General',
      l.zona_interes || 'Santa Cruz',
      l.presupuesto || 'Por definir',
      l.fecha_completa,
      l.anio,
      l.mes,
      l.dia,
      l.dia_semana,
      l.hora,
      l.estado_comercial || 'Nuevo',
      l.canal_origen || 'WhatsApp',
      l.campana || 'General',
      l.accion_sugerida || '',
      l.resumen || '',
      l.ultimo_mensaje || ''
    ];
    rows.push(row.map(escapeCsvField).join(','));
  });

  // \uFEFF es el BOM de UTF-8 para que Excel reconozca tildes y caracteres especiales
  return '\uFEFF' + rows.join('\r\n');
}

module.exports = {
  generateExcelXML,
  generateCSV
};
