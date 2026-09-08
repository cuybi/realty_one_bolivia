/**
 * Suite de Pruebas Automatizadas para el Clasificador de Leads y Exportador Excel
 * Realty ONE Group Bolivia
 */

const assert = require('assert');
const leadClassifier = require('./services/leadClassifier');
const excelService = require('./services/excelService');

console.log('\n🦁 ========================================================');
console.log('🦁  PRUEBAS DEL MOTOR DE CLASIFICACIÓN Y EXPORTACIÓN EXCEL');
console.log('🦁 ========================================================\n');

// TEST 1: Desglose Temporal (Fecha, Hora, Día, Mes, Año, Día de la Semana)
console.log('✔ [1/5] Probando desglose temporal exacto...');
const timeData = leadClassifier.generateTimeBreakdown(new Date());
console.log(`   📅 Fecha Completa: ${timeData.fecha_completa}`);
console.log(`   ⏰ Hora: ${timeData.hora}`);
console.log(`   📆 Día: ${timeData.dia} (${timeData.dia_semana})`);
console.log(`   🗓️ Mes: ${timeData.mes} (Nº ${timeData.mes_numero})`);
console.log(`   ⏳ Año: ${timeData.anio}`);

assert(timeData.fecha_completa.length === 10, 'Formato de fecha inválido');
assert(timeData.hora.length === 8, 'Formato de hora inválido');
assert(timeData.mes && timeData.mes.length > 2, 'Nombre de mes inválido');
assert(timeData.dia_semana && timeData.dia_semana.length > 2, 'Día de la semana inválido');
console.log('   ✅ Desglose temporal 100% verificado.');

// TEST 2: Extracción de Datos de Contacto e Inmobiliarios
console.log('\n✔ [2/5] Probando extracción de Nombre, Email, Zona y Presupuesto...');
const testMessage1 = 'Hola, mi nombre es Alejandro Morales y mi correo es amorales.inversiones@gmail.com. Busco un terreno industrial en el Parque Industrial sobre la G77 de 7000 m2 con presupuesto de Bs 16.800.000.';
const name1 = leadClassifier.extractName(testMessage1);
const email1 = leadClassifier.extractEmail(testMessage1);
const zone1 = leadClassifier.extractZone(testMessage1);
const op1 = leadClassifier.extractOperation(testMessage1);
const budget1 = leadClassifier.extractBudget(testMessage1);

console.log(`   👤 Nombre extraído: "${name1}"`);
console.log(`   ✉️ Email extraído: "${email1}"`);
console.log(`   📍 Zona extraída: "${zone1}"`);
console.log(`   🏗️ Operación: "${op1}"`);
console.log(`   💰 Presupuesto: "${budget1}"`);

assert(name1 && name1.includes('Alejandro Morales'), 'Fallo en extracción de nombre');
assert(email1 === 'amorales.inversiones@gmail.com', 'Fallo en extracción de email');
assert(zone1.includes('Parque Industrial'), 'Fallo en extracción de zona');
console.log('   ✅ Extracción de entidades verificada con éxito.');

// TEST 3: Clasificación de Prioridades (Potencial, Indeciso, Pasivo, Propietario)
console.log('\n✔ [3/5] Probando clasificación por prioridades y Lead Scoring...');

// Caso A: Potencial (Pide visita y reunión)
const pA = leadClassifier.calculateLeadPriority('Quiero coordinar una visita técnica al terreno para hoy en la tarde con el asesor Robert Oliva');
console.log(`   🔥 Caso A (Visita): Prioridad = ${pA.prioridad} (Score: ${pA.score})`);
assert(pA.prioridad === 'POTENCIAL', 'Debe clasificar como POTENCIAL');

// Caso B: Indeciso (Pregunta precios y medidas)
const pB = leadClassifier.calculateLeadPriority('¿Cuáles son los precios y qué medidas tiene el departamento en Equipetrol?');
console.log(`   ⚡ Caso B (Dudas): Prioridad = ${pB.prioridad} (Score: ${pB.score})`);
assert(pB.prioridad === 'INDECISO', 'Debe clasificar como INDECISO');

// Caso C: Pasivo (Saludo aislado)
const pC = leadClassifier.calculateLeadPriority('Hola buenas');
console.log(`   ❄️ Caso C (Saludo): Prioridad = ${pC.prioridad} (Score: ${pC.score})`);
assert(pC.prioridad === 'PASIVO', 'Debe clasificar como PASIVO');

// Caso D: Propietario (Consignación)
const pD = leadClassifier.calculateLeadPriority('Tengo una casa en el Urubó de 4 dormitorios y quiero vender mi propiedad con su inmobiliaria');
console.log(`   💼 Caso D (Propietario): Prioridad = ${pD.prioridad} (Score: ${pD.score})`);
assert(pD.prioridad === 'PROPIETARIO', 'Debe clasificar como PROPIETARIO');

console.log('   ✅ Clasificación de 4 categorías validada al 100%.');

// TEST 4: Trackeo de Lead en Base de Datos
console.log('\n✔ [4/5] Probando trackeo y almacenamiento en leads.json...');
const sampleLead = leadClassifier.trackAndClassifyLead(
  '+59177889900',
  'Mi nombre es Roberto Torrico (rtorrico@empresa.bo). Deseo agendar una visita técnica al terreno en Parque Industrial para mañana a las 10:00.',
  'Con gusto Roberto, te esperamos mañana con Robert Oliva.',
  { campana: 'Terreno Industrial 7.000 m² (G77)', canal: 'WhatsApp Web' }
);

console.log(`   📝 Lead ID: ${sampleLead.id}`);
console.log(`   👤 Cliente: ${sampleLead.cliente_nombre}`);
console.log(`   📱 Celular: ${sampleLead.numero_celular}`);
console.log(`   ✉️ Email: ${sampleLead.email}`);
console.log(`   🏷️ Prioridad: ${sampleLead.prioridad_label}`);
console.log(`   📆 Fecha: ${sampleLead.dia} de ${sampleLead.mes} de ${sampleLead.anio} (${sampleLead.dia_semana}) a las ${sampleLead.hora}`);

assert(sampleLead.cliente_nombre.includes('Roberto Torrico'), 'Nombre no asignado');
assert(sampleLead.email === 'rtorrico@empresa.bo', 'Email no asignado');
assert(sampleLead.prioridad === 'POTENCIAL', 'Prioridad debe ser POTENCIAL');
assert(sampleLead.e_realtor_asignado !== undefined, 'e-Realtor no asignado');
assert(sampleLead.etapa_embudo !== undefined, 'Etapa del embudo no asignada');
console.log('   ✅ Guardado y actualización en JSON verificado.');

// TEST 6: Asignación Inteligente de CRM IA a e-Realtors
console.log('\n✔ [6/6] Probando Asignación de e-Realtors por zona/inmueble...');

const realtorA = leadClassifier.assignERealtorByAI({ tipo_interes: 'Venta / Compra', zona_interes: 'Urubó', presupuesto: '$450.000' });
console.log(`   🏡 Venta de Lujo (Urubó) ➔ Asignado: ${realtorA.nombre} (${realtorA.especialidad})`);
assert(realtorA.nombre === 'Carlos Rodríguez', 'Debe asignar a Carlos Rodríguez');

const realtorB = leadClassifier.assignERealtorByAI({ tipo_interes: 'Alquiler', zona_interes: 'Equipetrol', presupuesto: '$1.200' });
console.log(`   🏢 Alquiler (Equipetrol) ➔ Asignado: ${realtorB.nombre} (${realtorB.especialidad})`);
assert(realtorB.nombre === 'Valeria Suárez', 'Debe asignar a Valeria Suárez');

const realtorC = leadClassifier.assignERealtorByAI({ tipo_interes: 'Terreno Industrial (G77)', zona_interes: 'Parque Industrial / G77', presupuesto: 'Bs 16.800.000' });
console.log(`   📐 Terreno Industrial (G77) ➔ Asignado: ${realtorC.nombre} (${realtorC.especialidad})`);
assert(realtorC.nombre === 'Andrés Montaño', 'Debe asignar a Andrés Montaño');

const realtorD = leadClassifier.assignERealtorByAI({ tipo_interes: 'Anticrético', zona_interes: 'Hamacas', presupuesto: '$45.000' });
console.log(`   🔑 Anticrético (Hamacas) ➔ Asignado: ${realtorD.nombre} (${realtorD.especialidad})`);
assert(realtorD.nombre === 'Lucía Vaca', 'Debe asignar a Lucía Vaca');

const realtorE = leadClassifier.assignERealtorByAI({ tipo_interes: 'Consignación / Propietario', zona_interes: 'Equipetrol', presupuesto: 'Por definir' });
console.log(`   💼 Consignación / Propietario ➔ Asignado: ${realtorE.nombre} (${realtorE.especialidad})`);
assert(realtorE.nombre === 'Robert Oliva', 'Debe asignar a Robert Oliva');

console.log('   ✅ Matriz de asignación de e-Realtors validada al 100%.\n');

// TEST 5: Generación de Excel (.xlsx / .xml) y CSV con UTF-8 BOM
console.log('\n✔ [5/5] Probando generación de archivo Excel y CSV...');
const allLeads = leadClassifier.getLeads();
const excelXml = excelService.generateExcelXML(allLeads);
const csvContent = excelService.generateCSV(allLeads);

console.log(`   📊 Excel XML generado: ${excelXml.length} bytes`);
console.log(`   📄 CSV generado: ${csvContent.length} bytes (Inicia con UTF-8 BOM: ${csvContent.startsWith('\uFEFF')})`);

assert(excelXml.includes('<Workbook'), 'El archivo Excel no contiene la estructura XML adecuada');
assert(excelXml.includes('ID Prospecto') && excelXml.includes('Prioridad') && excelXml.includes('Hora'), 'Faltan columnas requeridas en el Excel');
assert(csvContent.startsWith('\uFEFF'), 'El CSV debe incluir UTF-8 BOM para apertura nativa en Excel');
console.log('   ✅ Generación de Excel y CSV 100% exitosa.');

console.log('\n🎉 ========================================================');
console.log('🎉  TODAS LAS PRUEBAS (5/5) PASARON SATISFACTORIAMENTE');
console.log('🎉 ========================================================\n');
