<?php
/**
 * Exportador de Prospectos y Conversaciones a Excel (.xlsx/.xls) y CSV
 * Realty ONE Group Bolivia
 * 
 * Uso:
 * - export_leads.php?format=excel (Descargar en formato Excel con diseño y estilos)
 * - export_leads.php?format=csv   (Descargar en formato CSV con UTF-8 BOM)
 * - export_leads.php?format=json  (Ver API en formato JSON)
 */

date_default_timezone_set('America/La_Paz');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$LEADS_FILE = __DIR__ . '/leads.json';

$format    = $_GET['format'] ?? 'excel';
$prioridad = $_GET['prioridad'] ?? 'TODAS';
$anio      = $_GET['anio'] ?? '';
$mes       = $_GET['mes'] ?? '';

$leads = [];
if (file_exists($LEADS_FILE)) {
    $leads = json_decode(file_get_contents($LEADS_FILE), true) ?: [];
}

// Filtros
if ($prioridad !== 'TODAS' && !empty($prioridad)) {
    $leads = array_filter($leads, function($l) use ($prioridad) {
        return strtoupper($l['prioridad'] ?? '') === strtoupper($prioridad);
    });
}
if (!empty($anio)) {
    $leads = array_filter($leads, function($l) use ($anio) {
        return (string)($l['anio'] ?? '') === (string)$anio;
    });
}
if (!empty($mes)) {
    $leads = array_filter($leads, function($l) use ($mes) {
        return mb_strtolower($l['mes'] ?? '', 'UTF-8') === mb_strtolower($mes, 'UTF-8') || (string)($l['mes_numero'] ?? '') === (string)$mes;
    });
}

$dateStr = date('Y-m-d');

// 1. FORMATO JSON
if ($format === 'json') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'total' => count($leads),
        'leads' => array_values($leads)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. FORMATO CSV
if ($format === 'csv') {
    $filename = "RealtyONE_Leads_{$dateStr}.csv";
    header('Content-Type: text/csv; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"{$filename}\"");

    $output = fopen('php://output', 'w');
    fputs($output, "\xEF\xBB\xBF"); // UTF-8 BOM para Excel

    fputcsv($output, [
        'ID Prospecto', 'Prioridad', 'Score', 'Nombre Cliente', 'Celular', 'Email',
        'Tipo Interes', 'Zona Interes', 'Presupuesto', 'Fecha Completa', 'Año', 'Mes', 'Día',
        'Día Semana', 'Hora', 'Estado Comercial', 'Canal Origen', 'Campaña', 'Accion Sugerida', 'Resumen IA', 'Ultimo Mensaje'
    ]);

    foreach ($leads as $l) {
        fputcsv($output, [
            $l['id'] ?? '',
            $l['prioridad_label'] ?? $l['prioridad'] ?? '',
            $l['score'] ?? '',
            $l['cliente_nombre'] ?? 'Por identificar',
            $l['numero_celular'] ?? '',
            $l['email'] ?? 'Pendiente',
            $l['tipo_interes'] ?? 'General',
            $l['zona_interes'] ?? 'Santa Cruz',
            $l['presupuesto'] ?? 'Por definir',
            $l['fecha_completa'] ?? '',
            $l['anio'] ?? '',
            $l['mes'] ?? '',
            $l['dia'] ?? '',
            $l['dia_semana'] ?? '',
            $l['hora'] ?? '',
            $l['estado_comercial'] ?? 'Nuevo',
            $l['canal_origen'] ?? 'WhatsApp',
            $l['campana'] ?? 'General',
            $l['accion_sugerida'] ?? '',
            $l['resumen'] ?? '',
            $l['ultimo_mensaje'] ?? ''
        ]);
    }
    fclose($output);
    exit;
}

// 3. FORMATO EXCEL XML SPREADSHEET 2003
$filename = "RealtyONE_Leads_{$dateStr}.xls";
header('Content-Type: application/vnd.ms-excel; charset=utf-8');
header("Content-Disposition: attachment; filename=\"{$filename}\"");

function escapeX($str = '') {
    return htmlspecialchars((string)$str, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

echo '<' . '?xml version="1.0" encoding="UTF-8"?' . ">\n";
echo '<' . '?mso-application progid="Excel.Sheet"?' . ">\n";
?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Reporte de Prospectos WhatsApp - Realty ONE Group Bolivia</Title>
  <Subject>Clasificación Inteligente de Leads</Subject>
  <Author>Realty ONE Group Bolivia</Author>
  <Created><?php echo date('Y-m-d\TH:i:s'); ?></Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#D4AF37" ss:Bold="1"/>
   <Interior ss:Color="#0B0F12" ss:Pattern="Solid"/>
  </Style>
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
 <Worksheet ss:Name="Leads y Conversaciones">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="140"/>
   <Column ss:Width="130"/>
   <Column ss:Width="80"/>
   <Column ss:Width="180"/>
   <Column ss:Width="130"/>
   <Column ss:Width="180"/>
   <Column ss:Width="160"/>
   <Column ss:Width="150"/>
   <Column ss:Width="160"/>
   <Column ss:Width="110"/>
   <Column ss:Width="60"/>
   <Column ss:Width="90"/>
   <Column ss:Width="50"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>
   <Column ss:Width="180"/>
   <Column ss:Width="280"/>
   <Column ss:Width="260"/>
   <Column ss:Width="300"/>
   <Row ss:Height="30">
    <Cell ss:MergeAcross="20" ss:StyleID="HeaderTitle"><Data ss:Type="String">🦁 REALTY ONE GROUP BOLIVIA - REPORTE DE LEADS Y CONVERSACIONES</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">ID Prospecto</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Prioridad</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Score (0-100)</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Nombre del Cliente</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Número de Celular</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">E-mail</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Tipo de Interés</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Zona de Interés</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Presupuesto / Inmueble</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Fecha Completa</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Año</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Mes</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Día</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Día de la Semana</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Hora</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Estado Comercial</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Canal de Origen</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Campaña Meta Ads</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Acción Sugerida</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Resumen IA</Data></Cell>
    <Cell ss:StyleID="ColHeader"><Data ss:Type="String">Último Mensaje</Data></Cell>
   </Row>
   <?php foreach ($leads as $l): 
     $prio = strtoupper($l['prioridad'] ?? 'PASIVO');
     $stPrio = 'CellNormal';
     if ($prio === 'POTENCIAL') $stPrio = 'LeadPotencial';
     elseif ($prio === 'INDECISO') $stPrio = 'LeadIndeciso';
     elseif ($prio === 'PASIVO') $stPrio = 'LeadPasivo';
     elseif ($prio === 'PROPIETARIO') $stPrio = 'LeadPropietario';
   ?>
   <Row ss:Height="22">
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['id'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="<?php echo $stPrio; ?>"><Data ss:Type="String"><?php echo escapeX($l['prioridad_label'] ?? $l['prioridad'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="Number"><?php echo (int)($l['score'] ?? 0); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['cliente_nombre'] ?? 'Por identificar'); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['numero_celular'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['email'] ?? 'Pendiente'); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['tipo_interes'] ?? 'General'); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['zona_interes'] ?? 'Santa Cruz'); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['presupuesto'] ?? 'Por definir'); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['fecha_completa'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['anio'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['mes'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['dia'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['dia_semana'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['hora'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellCenter"><Data ss:Type="String"><?php echo escapeX($l['estado_comercial'] ?? 'Nuevo'); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['canal_origen'] ?? 'WhatsApp'); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['campana'] ?? 'General'); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['accion_sugerida'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['resumen'] ?? ''); ?></Data></Cell>
    <Cell ss:StyleID="CellNormal"><Data ss:Type="String"><?php echo escapeX($l['ultimo_mensaje'] ?? ''); ?></Data></Cell>
   </Row>
   <?php endforeach; ?>
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>2</SplitHorizontal>
   <TopRowBottomPane>2</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>
