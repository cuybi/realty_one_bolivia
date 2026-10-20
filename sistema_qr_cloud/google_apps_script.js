/**
 * ==============================================================================
 * REALTY ONE GROUP BOLIVIA — API REST GOOGLE APPS SCRIPT (GOOGLE SHEETS)
 * 100% Gratuito, 24/7 Real, Cero Tarjeta de Crédito, Cero Servidores que Duerman.
 * ==============================================================================
 * 
 * INSTRUCCIONES RÁPIDAS:
 * 1. Crea una hoja nueva en Google Sheets: https://sheets.new
 * 2. En el menú superior: Extensiones > Apps Script.
 * 3. Borra todo el código y pega este archivo completo.
 * 4. Clic en "Implementar" > "Nueva implementación".
 * 5. Tipo: "Aplicación web".
 * 6. Ejecutar como: "Yo". Quién tiene acceso: "Cualquier persona" (Anyone).
 * 7. Copia la URL de la aplicación web que te da Google y colócala en tu configuración.
 */

const SHEET_NAME = 'Leads_QR';

function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'ID',
      'Fecha y Hora (Bolivia)',
      'Nombre Completo',
      'Celular / WhatsApp',
      'Email',
      'Ciudad',
      'Tipo de Interés',
      'Propiedad / Campaña',
      'Presupuesto',
      'Fecha Visita',
      'Hora Visita',
      'Origen QR',
      'Estado',
      'Notas'
    ];
    sheet.appendRow(headers);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#0b141a');
    headerRange.setFontColor('#c5a560');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Handler POST para recibir nuevos leads desde el formulario QR
function doPost(e) {
  try {
    const sheet = setupSheet();
    let data;
    
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error('No se recibieron datos.');
    }

    const id = Utilities.getUuid();
    const fechaHora = Utilities.formatDate(new Date(), 'America/La_Paz', 'dd/MM/yyyy HH:mm:ss');
    
    const row = [
      id,
      fechaHora,
      data.nombre_completo || data.nombre || 'Sin Nombre',
      data.celular || data.telefono || '',
      data.email || '',
      data.ciudad || 'Santa Cruz',
      data.tipo_interes || 'Comprar',
      data.propiedad_campana || 'Catálogo General',
      data.presupuesto || 'Por Definir',
      data.fecha_visita_preferida || data.fecha_visita || '',
      data.hora_visita_preferida || data.hora_visita || '',
      data.origen_qr || 'Letrero / Banner QR',
      data.estado || 'NUEVO',
      data.notas || ''
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Lead registrado exitosamente en Google Sheets.',
      id: id,
      timestamp: fechaHora
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler GET para consultar leads desde el panel CRM en la nube
function doGet(e) {
  try {
    const sheet = setupSheet();
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = rows[0];
    const leads = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const lead = {};
      for (let j = 0; j < headers.length; j++) {
        lead[headers[j]] = row[j];
      }
      leads.push(lead);
    }

    // Ordenar de más reciente a más antiguo
    leads.reverse();

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      total: leads.length,
      data: leads
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
