/**
 * Test Suite de Integración Real para backend/services/aiAgent.js
 * Valida el Flujo Oficial Humanizado del Asistente Virtual de Realty ONE Group Bolivia
 */

const assert = require('assert');
const aiAgent = require('./services/aiAgent');

async function runTests() {
  console.log('🦁 ========================================================');
  console.log('🦁  TESTING INTEGRACIÓN EN VIVO: aiAgent.js (FLUJO OFICIAL HUMANIZADO)');
  console.log('🦁 ========================================================\n');

  function assertNoBulletsOrMenus(reply, stepName) {
    assert(!reply.includes('1.'), `${stepName}: Contiene lista numerada '1.'`);
    assert(!reply.includes('2.'), `${stepName}: Contiene lista numerada '2.'`);
    assert(!reply.includes('3.'), `${stepName}: Contiene lista numerada '3.'`);
    assert(!reply.includes('Selecciona'), `${stepName}: Contiene menú`);
  }

  // Comparacion por contenido, sin tildes: el bot escribe para WhatsApp.
  const flat = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function has(reply, ...words) {
    const t = flat(reply);
    return words.every((w) => t.includes(flat(w)));
  }
  // Silencio valido: null (sin texto) o el sentinel '[SILENCIO]' (no se envia).
  function esSilencio(reply) {
    return reply === null || reply === '[SILENCIO]';
  }

  // -------------------------------------------------------------
  // ESCENARIO 1: FLUJO COMPLETO EXITOSO (HAPPY PATH)
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 1]: Flujo Feliz Completo (Agendamiento + Despedida + Mute)');
  
  // Paso 1: Saludo Inicial
  const r1_1 = await aiAgent.processUserMessage('client_happy', 'Hola', 'Marcos Antezana');
  console.log('Bot 1.1:', r1_1);
  assert(has(r1_1, 'Marcos') && has(r1_1, 'puedo ayudarte'), 'Paso 1.1 falló');
  assertNoBulletsOrMenus(r1_1, '1.1');

  // Paso 2: Consulta
  const r1_2 = await aiAgent.processUserMessage('client_happy', 'Estoy interesado en comprar un departamento', 'Marcos Antezana');
  console.log('Bot 1.2:', r1_2);
  assert(has(r1_2, 'agente', 'contacto', 'telefono'), 'Paso 1.2 falló');
  assertNoBulletsOrMenus(r1_2, '1.2');

  // Paso 3: Datos
  const r1_3 = await aiAgent.processUserMessage('client_happy', 'Mi teléfono es 70123456, correo marcos@gmail.com y soy de Santa Cruz', 'Marcos Antezana');
  console.log('Bot 1.3:', r1_3);
  assert(has(r1_3, 'Marcos') && has(r1_3, 'visita'), 'Paso 1.3 falló');
  assertNoBulletsOrMenus(r1_3, '1.3');

  // Paso 4: Agendamiento con fecha y hora completa
  const r1_4 = await aiAgent.processUserMessage('client_happy', 'Lunes 15 de marzo a las 10:00 AM', 'Marcos Antezana');
  console.log('Bot 1.4:', r1_4);
  assert(has(r1_4, 'gracias', 'llamar'), 'Paso 1.4 falló');
  assertNoBulletsOrMenus(r1_4, '1.4');

  // Paso 5: Escribe cortesía tras despedida -> MUTE; si saluda de nuevo -> Reactiva
  const r1_5 = await aiAgent.processUserMessage('client_happy', 'muchas gracias', 'Marcos Antezana');
  console.log('Bot 1.5 (Cortesía residual post-despedida):', r1_5);
  assert(esSilencio(r1_5), 'Debe silenciar agradecimientos residuales tras la despedida');
  // Fase 6: tras la despedida el bot guarda silencio, tambien ante un nuevo saludo.
  const r1_6 = await aiAgent.processUserMessage('client_happy', 'Hola', 'Marcos Antezana');
  assert(esSilencio(r1_6), 'Tras la despedida el bot guarda silencio (Fase 6)');
  console.log('✅ ESCENARIO 1 VERIFICADO AL 100%\n');

  // -------------------------------------------------------------
  // ESCENARIO 2: MANEJO DE NEGATIVA A DAR DATOS
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 2]: Manejo de Negativa a dar datos');
  const r2_1 = await aiAgent.processUserMessage('client_refusal', 'Hola', 'Carlos Gomez');
  const r2_2 = await aiAgent.processUserMessage('client_refusal', 'Quiero info de un lote', 'Carlos Gomez');
  assert(has(r2_2, 'agente', 'contacto'), 'Paso 2.2 falló');

  const r2_3 = await aiAgent.processUserMessage('client_refusal', 'No quiero dar mis datos por este medio, gracias', 'Carlos Gomez');
  console.log('Bot 2.3 (Negativa):', r2_3);
  assert(r2_3.includes('Carlos Gomez') && has(r2_3, 'llamar'), 'Debe despedirse cordialmente');
  assertNoBulletsOrMenus(r2_3, '2.3');

  const r2_4 = await aiAgent.processUserMessage('client_refusal', 'ok gracias', 'Carlos Gomez');
  assert(esSilencio(r2_4), 'Debe silenciar cortesía tras negativa');
  console.log('✅ ESCENARIO 2 VERIFICADO AL 100%\n');

  // -------------------------------------------------------------
  // ESCENARIO 3: FECHA INCOMPLETA Y RECHAZO DE AGENDAMIENTO
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 3]: Fecha Incompleta y Rechazo de Agendamiento');
  const r3_1 = await aiAgent.processUserMessage('client_dates', 'Hola', 'Andrea Rojas');
  const r3_2 = await aiAgent.processUserMessage('client_dates', 'Busco oficina comercial', 'Andrea Rojas');
  const r3_3 = await aiAgent.processUserMessage('client_dates', '60937050, andrea@empresa.com, Cochabamba', 'Andrea Rojas');
  assert(has(r3_3, 'visita'), 'Paso 3.3 falló');

  // Fecha incompleta
  const r3_4 = await aiAgent.processUserMessage('client_dates', 'Quisiera el martes', 'Andrea Rojas');
  console.log('Bot 3.4 (Fecha incompleta):', r3_4);
  assert(has(r3_4, 'solo me falta'), 'Paso 3.4 falló');
  assertNoBulletsOrMenus(r3_4, '3.4');

  // Decide no agendar
  const r3_5 = await aiAgent.processUserMessage('client_dates', 'Por ahora no gracias, solo quería consultar', 'Andrea Rojas');
  console.log('Bot 3.5 (No agenda):', r3_5);
  assert(r3_5.includes('Andrea Rojas') && has(r3_5, 'llamar'));
  const r3_6 = await aiAgent.processUserMessage('client_dates', 'gracias chau', 'Andrea Rojas');
  assert(esSilencio(r3_6), 'Debe silenciar despedida final');
  console.log('✅ ESCENARIO 3 VERIFICADO AL 100%\n');

  // -------------------------------------------------------------
  // ESCENARIO 4: USUARIO SIN NOMBRE PREVIO
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 4]: Usuario sin nombre previo');
  const r4_1 = await aiAgent.processUserMessage('client_noname', 'Hola');
  assert(has(r4_1, 'puedo ayudarte'), 'Paso 4.1 falló');

  const r4_2 = await aiAgent.processUserMessage('client_noname', 'Quiero info');
  assert(has(r4_2, 'agente', 'contacto'), 'Paso 4.2 falló');

  const r4_3 = await aiAgent.processUserMessage('client_noname', '77397850, contacto@empresa.bo, Santa Cruz');
  assert(r4_3.includes('nombre y apellido'), 'Paso 4.3 debe pedir nombre y apellido faltante');

  const r4_3b = await aiAgent.processUserMessage('client_noname', 'Juan Perez');
  assert(has(r4_3b, 'visita'), 'Paso 4.3b debe pasar a visita');

  const r4_4 = await aiAgent.processUserMessage('client_noname', 'No deseo agendar');
  console.log('Bot 4.4 (Despedida sin nombre):', r4_4);
  assert(has(r4_4, 'llamar'));
  console.log('✅ ESCENARIO 4 VERIFICADO AL 100%\n');

  // -------------------------------------------------------------
  // ESCENARIO 5: EXTRACCIÓN DE NOMBRE EN TEXTO
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 5]: Extracción de Nombre Marcos Antezana');
  await aiAgent.processUserMessage('client_extract', 'Hola');
  await aiAgent.processUserMessage('client_extract', 'mas informacion');
  const r5_3 = await aiAgent.processUserMessage('client_extract', 'marcos antezana, 60034649, pixelbolivia@gmail.com, santa cruz');
  console.log('Bot 5.3 (Extracción de Marcos Antezana):', r5_3);
  assert(has(r5_3, 'Marcos'), 'Debe usar el nombre del lead (solo el primero)');

  const r5_4 = await aiAgent.processUserMessage('client_extract', 'sabado 17 de octubre a las 9:30 am');
  assert(checkIncludes(r5_4, 'Marcos') && has(r5_4, 'llamar'));

  const r5_5 = await aiAgent.processUserMessage('client_extract', 'muchas gracias amigo');
  assert(esSilencio(r5_5), 'Debe silenciarse cortesía tras despedida');
  console.log('✅ ESCENARIO 5 VERIFICADO AL 100%\n');

  console.log('🎉 ========================================================');
  console.log('🎉  TODOS LOS ESCENARIOS VALIDADOS AL 100%');
  console.log('🎉 ========================================================');
}

runTests().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
