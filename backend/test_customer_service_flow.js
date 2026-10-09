/**
 * Test Suite de Integración Real para backend/services/aiAgent.js
 * Valida los 5 Estados y las 6 Reglas Estrictas del Asistente Virtual
 */

const assert = require('assert');
const aiAgent = require('./services/aiAgent');

async function runTests() {
  console.log('🦁 ========================================================');
  console.log('🦁  TESTING INTEGRACIÓN EN VIVO: aiAgent.js (5 ESTADOS / 6 REGLAS)');
  console.log('🦁 ========================================================\n');

  function assertNoBulletsOrMenus(reply, stepName) {
    assert(!reply.includes('•'), `${stepName}: Contiene viñeta '•'`);
    assert(!reply.includes('1.'), `${stepName}: Contiene lista numerada '1.'`);
    assert(!reply.includes('2.'), `${stepName}: Contiene lista numerada '2.'`);
    assert(!reply.includes('3.'), `${stepName}: Contiene lista numerada '3.'`);
    assert(!reply.includes('Selecciona'), `${stepName}: Contiene menú`);
  }

  // -------------------------------------------------------------
  // ESCENARIO 1: FLUJO COMPLETO EXITOSO (HAPPY PATH)
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 1]: Flujo Feliz Completo (Agendamiento + Recordatorio Sí)');
  
  // Paso 1: Saludo Inicial (Estado 1)
  const r1_1 = await aiAgent.processUserMessage('client_happy', 'Hola', 'Marcos');
  console.log('Bot 1.1:', r1_1);
  assert.strictEqual(r1_1, 'Hola Marcos. ¿En qué puedo ayudarte?');
  assertNoBulletsOrMenus(r1_1, '1.1');

  // Paso 2: Usuario responde con su consulta, Bot toma control y pide datos (Estado 2)
  const r1_2 = await aiAgent.processUserMessage('client_happy', 'Estoy interesado en comprar un departamento', 'Marcos');
  console.log('Bot 1.2:', r1_2);
  assert.strictEqual(r1_2, 'Para que un agente especializado se contacte contigo, por favor compárteme tu número de teléfono, correo electrónico y ciudad.');
  assertNoBulletsOrMenus(r1_2, '1.2');

  // Paso 3: Usuario envía datos completos, Bot pide agendamiento (Estado 3)
  const r1_3 = await aiAgent.processUserMessage('client_happy', 'Mi teléfono es 70123456, correo marcos@gmail.com y soy de Santa Cruz', 'Marcos');
  console.log('Bot 1.3:', r1_3);
  assert.strictEqual(r1_3, 'Si tienes clara tu decisión, ¿quieres agendar una visita? (Por favor indícame día, fecha y hora, por ejemplo: Lunes 15 de marzo a las 10:00 AM).');
  assertNoBulletsOrMenus(r1_3, '1.3');

  // Paso 4: Usuario agenda con fecha completa (Estado 4)
  const r1_4 = await aiAgent.processUserMessage('client_happy', 'Lunes 15 de marzo a las 10:00 AM', 'Marcos');
  console.log('Bot 1.4:', r1_4);
  assert.strictEqual(r1_4, 'Muchas gracias por tu agendamiento. ¿Quieres que te recuerde un día antes de tu visita?');
  assertNoBulletsOrMenus(r1_4, '1.4');

  // Paso 5: Usuario responde sí al recordatorio, Bot se despide cordialmente (Estado 5)
  const r1_5 = await aiAgent.processUserMessage('client_happy', 'Sí por favor', 'Marcos');
  console.log('Bot 1.5:', r1_5);
  assert(r1_5.includes('Marcos'), 'Debe incluir el nombre del cliente');
  assert(r1_5.includes('Cualquier duda o inquietud no dude en llamar.'), 'Debe incluir la frase obligatoria');
  assertNoBulletsOrMenus(r1_5, '1.5');
  console.log('✅ ESCENARIO 1 VERIFICADO AL 100%\n');

  // -------------------------------------------------------------
  // ESCENARIO 2: DATOS INCOMPLETOS (REGLA 3)
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 2]: Datos Incompletos y Validación Amable');
  const r2_1 = await aiAgent.processUserMessage('client_incomplete', 'Hola', 'Valeria');
  assert.strictEqual(r2_1, 'Hola Valeria. ¿En qué puedo ayudarte?');

  const r2_2 = await aiAgent.processUserMessage('client_incomplete', 'Quiero alquilar una casa', 'Valeria');
  assert.strictEqual(r2_2, 'Para que un agente especializado se contacte contigo, por favor compárteme tu número de teléfono, correo electrónico y ciudad.');

  // Usuario da solo teléfono
  const r2_3 = await aiAgent.processUserMessage('client_incomplete', 'Solo tengo mi celular: 78901234', 'Valeria');
  console.log('Bot 2.3 (Falta correo y ciudad):', r2_3);
  assert.strictEqual(r2_3, 'Por favor compárteme amablemente tu correo electrónico y tu ciudad antes de continuar.');
  assertNoBulletsOrMenus(r2_3, '2.3');

  // Usuario da el correo y ciudad faltantes
  const r2_4 = await aiAgent.processUserMessage('client_incomplete', 'valeria@hotmail.com en La Paz', 'Valeria');
  console.log('Bot 2.4 (Datos completos):', r2_4);
  assert.strictEqual(r2_4, 'Si tienes clara tu decisión, ¿quieres agendar una visita? (Por favor indícame día, fecha y hora, por ejemplo: Lunes 15 de marzo a las 10:00 AM).');
  console.log('✅ ESCENARIO 2 VERIFICADO AL 100%\n');

  // -------------------------------------------------------------
  // ESCENARIO 3: MANEJO DE NEGATIVA / OBJECIONES (REGLA 4)
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 3]: Manejo de Negativa a dar datos');
  const r3_1 = await aiAgent.processUserMessage('client_refusal', 'Hola', 'Carlos');
  const r3_2 = await aiAgent.processUserMessage('client_refusal', 'Quiero info de un lote', 'Carlos');
  assert.strictEqual(r3_2, 'Para que un agente especializado se contacte contigo, por favor compárteme tu número de teléfono, correo electrónico y ciudad.');

  // 1ra negativa
  const r3_3 = await aiAgent.processUserMessage('client_refusal', 'No quiero dar mis datos por este medio', 'Carlos');
  console.log('Bot 3.3 (1ra negativa):', r3_3);
  assert(r3_3.includes('indispensables'), 'Debe explicar que son indispensables');
  assertNoBulletsOrMenus(r3_3, '3.3');

  // 2da negativa (insiste)
  const r3_4 = await aiAgent.processUserMessage('client_refusal', 'Dije que no los daré', 'Carlos');
  console.log('Bot 3.4 (2da negativa):', r3_4);
  assert(r3_4.includes('directamente por teléfono'), 'Debe indicar que puede llamar');
  assert(r3_4.includes('Carlos'), 'Debe despedirse con el nombre');
  assert(r3_4.includes('Cualquier duda o inquietud no dude en llamar.'), 'Debe incluir frase obligatoria');
  console.log('✅ ESCENARIO 3 VERIFICADO AL 100%\n');

  // -------------------------------------------------------------
  // ESCENARIO 4: FECHA INCOMPLETA Y NO AGENDAR (REGLA 5 Y CONDICIÓN ESTADO 4)
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 4]: Fecha Incompleta y Rechazo de Agendamiento');
  const r4_1 = await aiAgent.processUserMessage('client_dates', 'Hola', 'Andrea');
  const r4_2 = await aiAgent.processUserMessage('client_dates', 'Busco oficina comercial', 'Andrea');
  const r4_3 = await aiAgent.processUserMessage('client_dates', '60937050, andrea@empresa.com, Cochabamba', 'Andrea');
  assert.strictEqual(r4_3, 'Si tienes clara tu decisión, ¿quieres agendar una visita? (Por favor indícame día, fecha y hora, por ejemplo: Lunes 15 de marzo a las 10:00 AM).');

  // Intenta agendar con fecha incompleta (solo el martes)
  const r4_4 = await aiAgent.processUserMessage('client_dates', 'Quisiera el martes', 'Andrea');
  console.log('Bot 4.4 (Fecha incompleta):', r4_4);
  assert.strictEqual(r4_4, 'Por favor indícame el día de la semana, la fecha exacta y la hora de tu visita (por ejemplo: Lunes 15 de marzo a las 10:00 AM).');
  assertNoBulletsOrMenus(r4_4, '4.4');

  // Usuario decide no agendar
  const r4_5 = await aiAgent.processUserMessage('client_dates', 'Por ahora no gracias, solo quería consultar', 'Andrea');
  console.log('Bot 4.5 (No agenda -> Salta Estado 4 directo a 5):', r4_5);
  assert(!r4_5.includes('recordatorio') && !r4_5.includes('recuerde'), 'No debe preguntar por recordatorio');
  assert(r4_5.includes('Andrea'), 'Debe despedirse usando el nombre');
  assert(r4_5.includes('Cualquier duda o inquietud no dude en llamar.'), 'Debe incluir frase obligatoria');
  console.log('✅ ESCENARIO 4 VERIFICADO AL 100%\n');

  // -------------------------------------------------------------
  // ESCENARIO 5: USUARIO SIN NOMBRE PROVISTO POR PLATAFORMA
  // -------------------------------------------------------------
  console.log('👉 [ESCENARIO 5]: Usuario sin nombre previo');
  const r5_1 = await aiAgent.processUserMessage('client_noname', 'Hola');
  console.log('Bot 5.1 (Sin nombre):', r5_1);
  assert.strictEqual(r5_1, 'Hola. ¿En qué puedo ayudarte?');

  const r5_2 = await aiAgent.processUserMessage('client_noname', 'Quiero info');
  assert.strictEqual(r5_2, 'Para que un agente especializado se contacte contigo, por favor compárteme tu número de teléfono, correo electrónico y ciudad.');

  const r5_3 = await aiAgent.processUserMessage('client_noname', '77397850, contacto@empresa.bo, Santa Cruz');
  assert.strictEqual(r5_3, 'Si tienes clara tu decisión, ¿quieres agendar una visita? (Por favor indícame día, fecha y hora, por ejemplo: Lunes 15 de marzo a las 10:00 AM).');

  const r5_4 = await aiAgent.processUserMessage('client_noname', 'No deseo agendar');
  console.log('Bot 5.4 (Despedida sin nombre):', r5_4);
  assert(r5_4.includes('Cualquier duda o inquietud no dude en llamar.'));
  console.log('✅ ESCENARIO 5 VERIFICADO AL 100%\n');

  console.log('🎉 ========================================================');
  console.log('🎉  TODOS LOS 5 ESCENARIOS Y 6 REGLAS VALIDADOS CON ÉXITO');
  console.log('🎉 ========================================================');
}

runTests().catch(err => {
  console.error('❌ Error en pruebas:', err);
  process.exit(1);
});
