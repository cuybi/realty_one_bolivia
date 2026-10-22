const assert = require('assert');
const { processUserMessage, sessions } = require('./services/aiAgent');

// Los mensajes del bot van sin acentos (legibilidad en WhatsApp): las
// comparaciones se normalizan para que el test no dependa de la tilde.
function normalizar(text) {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Silencio valido: null (sin texto) o el sentinel '[SILENCIO]' (no se envia al lead).
function assertSilencio(text, message) {
  assert(text === null || text === '[SILENCIO]', message);
}

function checkIncludes(text, ...substrings) {
  if (!text) return false;
  const lower = normalizar(text);
  return substrings.every(s => lower.includes(normalizar(s)));
}

function checkIncludesAny(text, ...substrings) {
  if (!text) return false;
  const lower = normalizar(text);
  return substrings.some(s => lower.includes(normalizar(s)));
}

async function runTests() {
  console.log('🦁 ========================================================');
  console.log('🦁  TEST SUITE: NUEVO FLUJO 4 PASOS + SALUDO DINÁMICO');
  console.log('🦁 ========================================================\n');

  // TEST 1: SALUDO A LEAD NUEVO (por defecto responde)
  console.log('▶ Test 1: Lead nuevo saluda y recibe respuesta');
  const uSaludo = 'user_saludo_1';
  const rSaludo = await processUserMessage(uSaludo, 'Hola', { pushName: 'Marcos Antezana' });
  assert(checkIncludes(rSaludo, 'Realty ONE Group Bolivia'), 'FAIL: debe responder al saludo');
  assert(checkIncludesAny(rSaludo, 'buenos días', 'buenas tardes', 'buenas noches'), 'FAIL: Falta saludo dinámico por hora');
  console.log('  ✓ responde con saludo dinámico');

  // TEST 1b: MODO ESTRICTO (silencio absoluto sin disparador de publicidad)
  console.log('▶ Test 1b: Modo estricto = silencio ante mensajes sin disparador');
  process.env.BOT_SILENCIOS_SIN_DISPARADOR = 'true';
  try {
    const uSilencio = 'user_silencio_1';
    assert.strictEqual(await processUserMessage(uSilencio, 'Hola'), null);
    assert.strictEqual(await processUserMessage(uSilencio, 'Buenos días, a cómo está el dólar?'), null);
    assert.strictEqual(await processUserMessage(uSilencio, 'Feliz cumpleaños amiga querida'), null);
    assert.strictEqual(await processUserMessage(uSilencio, '¿Tienen casas en venta?'), null);
    console.log('  ✓ 100% silencioso ante mensajes comunes en modo estricto');
  } finally {
    delete process.env.BOT_SILENCIOS_SIN_DISPARADOR;
  }

  // TEST 2: ACTIVACIÓN CON DISPARADORES
  console.log('\n▶ Test 2: Activación válida con disparadores oficiales');
  // Sin referralData: la regla vigente responde tambien a un lead nuevo sin
  // anuncio (numero corporativo abierto). En modo estricto se calla (Test 1b).
  const uAct1 = 'user_act_1';
  const rAct1 = await processUserMessage(uAct1, '¡Hola! Quiero más información', { pushName: 'Carlos Rodriguez' });
  assert(rAct1, 'FAIL: debe responder al lead nuevo aunque no venga de anuncio');
  assert(checkIncludes(rAct1, 'Carlos Rodriguez'), 'FAIL: Debe saludar con nombre del perfil');
  assert(checkIncludesAny(rAct1, 'buenos días', 'buenas tardes', 'buenas noches'), 'FAIL: Falta saludo dinámico por hora');

  // Con referralData válido (Facebook Ads CTWA)
  const uAct1b = 'user_act_1b';
  const referralValid = { source: 'Facebook Ads (CTWA)', headline: 'Westgate Tower', pushName: 'Carlos Rodriguez' };
  const rAct1b = await processUserMessage(uAct1b, '¡Hola! Quiero más información', referralValid);
  assert(checkIncludes(rAct1b, 'Carlos Rodriguez'), 'FAIL: Debe saludar con nombre del perfil');
  assert(checkIncludesAny(rAct1b, 'buenos días', 'buenas tardes', 'buenas noches'), 'FAIL: Falta saludo dinámico por hora');
  assert(checkIncludes(rAct1b, 'nombre y apellido', 'teléfono', 'correo electrónico', 'ciudad'), 'FAIL: Debe solicitar los 4 datos obligatorios');
  console.log('  ✓ Paso 1 activado correctamente con referralData válido');

  const uAct2 = 'user_act_2';
  const rAct2 = await processUserMessage(uAct2, 'Consulta sobre WESTGATE TOWER', referralValid);
  assert(checkIncludes(rAct2, 'nombre y apellido') || checkIncludes(rAct2, 'soy tu asistente'), 'FAIL: WESTGATE TOWER en mensaje debe activar');
  console.log('  ✓ Paso 1 activado correctamente con "WESTGATE TOWER" en mensaje');

  const uAct3 = 'user_act_3';
  const rAct3 = await processUserMessage(uAct3, 'hola vi esto en fb.me/westgate', referralValid);
  assert(checkIncludes(rAct3, 'nombre y apellido') || checkIncludes(rAct3, 'soy tu asistente'), 'FAIL: fb.me debe activar');
  console.log('  ✓ Paso 1 activado correctamente con "fb.me"');

  // TEST 3: PASO 2 -> RESPUESTA NEGATIVA SIN DATOS -> [FIN_FLUJO] Y SILENCIO POSTERIOR
  console.log('\n▶ Test 3: Paso 2 Negativo sin datos -> [FIN_FLUJO] y silencio posterior');
  const uPaso2Neg = 'user_p2_neg';
  await processUserMessage(uPaso2Neg, 'Quiero más información', referralValid);
  const rNeg2 = await processUserMessage(uPaso2Neg, 'no quiero dar mis datos, gracias');
  assert(checkIncludes(rNeg2, 'no dudes en llamar'), 'FAIL: Despedida debe incluir "no dudes en llamar"');
  assert(checkIncludesAny(rNeg2, 'buenos días', 'buenas tardes', 'buenas noches'), 'FAIL: Despedida debe tener saludo horario');
  
  // Verificar silencio posterior
  const rSilencioPost2 = await processUserMessage(uPaso2Neg, 'gracias');
  assertSilencio(rSilencioPost2, 'Debe guardar silencio tras [FIN_FLUJO]');
  const rSilencioPost2b = await processUserMessage(uPaso2Neg, 'hola siguen ahi?');
  assertSilencio(rSilencioPost2b, 'Debe ignorar nuevos mensajes post [FIN_FLUJO]');
  console.log('  ✓ Paso 2 Negativo despide exactamente y cierra sesión');

  // TEST 4: PASO 2 -> POSITIVO SIN DATOS -> REPREGUNTA (insiste en 4 datos)
  console.log('\n▶ Test 4: Paso 2 Positivo sin datos -> Solicita obligatoriamente los 4 datos');
  const uPaso2Pos = 'user_p2_pos';
  await processUserMessage(uPaso2Pos, 'Quiero más información', referralValid);
  const rPos2a = await processUserMessage(uPaso2Pos, 'ok claro');
  assert(checkIncludes(rPos2a, 'teléfono', 'correo electrónico', 'ciudad'), 'FAIL: Debe pedir los datos que faltan');
  assert(!checkIncludes(rPos2a, 'nombre y apellido'), 'FAIL: NO debe volver a pedir el nombre si ya vino del perfil');
  const rPos2b = await processUserMessage(uPaso2Pos, 'si por favor');
  assert(checkIncludes(rPos2b, 'teléfono', 'correo electrónico', 'ciudad'), 'FAIL: Debe insistir en los datos que faltan');
  assert(!checkIncludes(rPos2b, 'nombre y apellido'), 'FAIL: NO debe volver a pedir el nombre si ya vino del perfil');
  console.log('  ✓ Paso 2 Positivo sin datos mantiene estado y repregunta con 4 datos obligatorios');

  // TEST 5: PASO 2 -> ENVÍA 4 DATOS COMPLETOS -> PASO 3
  console.log('\n▶ Test 5: Paso 2 Envía 4 datos completos -> Pasa al Paso 3 (pregunta visita)');
  const rDatos2 = await processUserMessage(uPaso2Pos, 'Pedro Gómez, 77012345, pedro@gmail.com, Santa Cruz');
  assert(checkIncludes(rDatos2, 'Perfecto'), 'FAIL: Debe confirmar los datos');
  assert(checkIncludes(rDatos2, 'visita'), 'FAIL: Debe preguntar por agendar una visita');
  assert(checkIncludes(rDatos2, 'fecha') && checkIncludes(rDatos2, 'hora'), 'FAIL: Debe pedir dia, fecha y hora');
  console.log('  ✓ Paso 2 Datos completos capturados y pasa a Paso 3');

  // TEST 6: PASO 3 -> RESPUESTA NEGATIVA -> [FIN_FLUJO]
  console.log('\n▶ Test 6: Paso 3 Negativo -> [FIN_FLUJO] y silencio');
  const uPaso3Neg = 'user_p3_neg';
  await processUserMessage(uPaso3Neg, 'Quiero más información', referralValid);
  await processUserMessage(uPaso3Neg, 'Elena Paz, 70112233, elena@paz.com, Santa Cruz');
  const rNeg3 = await processUserMessage(uPaso3Neg, 'por ahora no, más adelante');
  assert(checkIncludes(rNeg3, 'no dudes en llamar'), 'FAIL: Despedida debe incluir "no dudes en llamar"');
  assert(checkIncludesAny(rNeg3, 'buenos días', 'buenas tardes', 'buenas noches'), 'FAIL: Despedida debe tener saludo horario');
  assertSilencio(await processUserMessage(uPaso3Neg, 'muchas gracias'), 'silencio tras despedida');
  console.log('  ✓ Paso 3 Negativo despide y silencia');

  // TEST 7: PASO 3 -> SALTO DIRECTO CON DÍA, FECHA Y HORA -> PASO 4 DIRECTO [FIN_FLUJO]
  console.log('\n▶ Test 7: Paso 3 Salto directo con día, fecha y hora');
  const uPaso3Salto = 'user_p3_salto';
  await processUserMessage(uPaso3Salto, 'Quiero más información', referralValid);
  await processUserMessage(uPaso3Salto, 'Rodrigo Mendez, 78912345, rodrigo@test.com, Santa Cruz');
  const rSalto = await processUserMessage(uPaso3Salto, 'lunes 19 de octubre a las 12:30');
  assert(checkIncludes(rSalto, 'no dudes en llamar'), 'FAIL: Cierre debe incluir "no dudes en llamar"');
  assert(checkIncludesAny(rSalto, 'buenos días', 'buenas tardes', 'buenas noches'), 'FAIL: Cierre debe tener saludo horario');
  assert(checkIncludes(rSalto, 'lunes 19 de octubre a las 12:30'), 'FAIL: Debe repetir la fecha/hora indicada');
  assertSilencio(await processUserMessage(uPaso3Salto, 'excelente, nos vemos'), 'silencio tras agendar');
  console.log('  ✓ Paso 3 Salto directo agenda y finaliza');

  // TEST 8: PASO 3 -> POSITIVO SIN FECHA -> PASO 4
  console.log('\n▶ Test 8: Paso 3 Positivo sin fecha -> Pasa a Paso 4 ESPERANDO_FECHA_HORA');
  const uPaso4 = 'user_p4_flow';
  await processUserMessage(uPaso4, 'Quiero más información', referralValid);
  await processUserMessage(uPaso4, 'Valeria Torrico, 76543210, valeria@torrico.com, Urubó');
  const rPaso3Pos = await processUserMessage(uPaso4, 'sí por favor me gustaría agendar');
  assert(checkIncludes(rPaso3Pos, 'día, la fecha y la hora', 'ejemplo'), 'FAIL: Debe pedir día, fecha y hora con ejemplo');
  console.log('  ✓ Paso 3 Positivo solicita día, fecha y hora');

  // TEST 9: PASO 4 -> NEGATIVO -> [FIN_FLUJO]
  console.log('\n▶ Test 9: Paso 4 Negativo -> [FIN_FLUJO]');
  const uPaso4Neg = 'user_p4_neg';
  await processUserMessage(uPaso4Neg, 'Quiero más información', referralValid);
  await processUserMessage(uPaso4Neg, 'Luis Gomez, 71234567, luis@gomez.com, Santa Cruz');
  await processUserMessage(uPaso4Neg, 'si');
  const rNeg4 = await processUserMessage(uPaso4Neg, 'no puedo, luego te aviso');
  assert(checkIncludes(rNeg4, 'no dudes en llamar'), 'FAIL: Despedida debe incluir "no dudes en llamar"');
  assert(checkIncludesAny(rNeg4, 'buenos días', 'buenas tardes', 'buenas noches'), 'FAIL: Despedida debe tener saludo horario');
  assertSilencio(await processUserMessage(uPaso4Neg, 'chau'), 'silencio tras despedida');
  console.log('  ✓ Paso 4 Negativo despide y silencia');

  // TEST 10: PASO 4 -> ENVÍA FECHA Y HORA -> [FIN_FLUJO]
  console.log('\n▶ Test 10: Paso 4 Envía fecha y hora -> [FIN_FLUJO]');
  const rFinal4 = await processUserMessage(uPaso4, 'Lunes 15 de marzo a las 10:00 AM');
  assert(checkIncludes(rFinal4, 'no dudes en llamar'), 'FAIL: Cierre debe incluir "no dudes en llamar"');
  assert(checkIncludesAny(rFinal4, 'buenos días', 'buenas tardes', 'buenas noches'), 'FAIL: Cierre debe tener saludo horario');
  assert(checkIncludes(rFinal4, 'Lunes 15 de marzo a las 10:00 AM'), 'FAIL: Debe repetir la fecha/hora indicada');
  assertSilencio(await processUserMessage(uPaso4, 'muchas gracias por todo'), 'silencio tras agendar');
  console.log('  ✓ Paso 4 Coordina visita y cierra sesión exitosamente');

  // TEST 11: DATOS INCOMPLETOS -> MENCIONA SOLO LOS FALTANTES
  console.log('\n▶ Test 11: Paso 2 Datos incompletos -> Menciona SOLO los faltantes');
  const uPartial = 'user_partial';
  await processUserMessage(uPartial, 'Quiero más información', referralValid);
  // Solo nombre
  let rPartial = await processUserMessage(uPartial, 'Juan Pérez');
  assert(checkIncludes(rPartial, 'teléfono', 'correo electrónico', 'ciudad'), 'FAIL: Debe mencionar teléfono, email, ciudad como faltantes');
  assert(!checkIncludes(rPartial, 'nombre'), 'FAIL: NO debe mencionar nombre como faltante si ya lo dio');
  // Ahora da teléfono
  rPartial = await processUserMessage(uPartial, '70012345');
  assert(checkIncludes(rPartial, 'correo electrónico', 'ciudad'), 'FAIL: Debe mencionar email y ciudad como faltantes');
  assert(!checkIncludes(rPartial, 'teléfono'), 'FAIL: NO debe mencionar teléfono como faltante si ya lo dio');
  // Ahora da email
  rPartial = await processUserMessage(uPartial, 'juan@test.com');
  assert(checkIncludes(rPartial, 'ciudad'), 'FAIL: Debe mencionar ciudad como faltante');
  assert(!checkIncludes(rPartial, 'correo'), 'FAIL: NO debe mencionar email como faltante si ya lo dio');
  // Ahora da ciudad -> completo
  rPartial = await processUserMessage(uPartial, 'La Paz');
  assert(checkIncludes(rPartial, 'Perfecto'), 'FAIL: Con 4 datos debe confirmar');
  assert(checkIncludes(rPartial, 'visita') && checkIncludes(rPartial, 'fecha') && checkIncludes(rPartial, 'hora'), 'FAIL: Con 4 datos debe pasar a paso visita');
  console.log('  ✓ Paso 2 Datos parciales menciona SOLO los faltantes correctamente');

  // TEST 12: COMANDO REINICIAR/RESET
  console.log('\n▶ Test 12: Comando "reiniciar" / "reset" borra sesión');
  const uReset = 'user_reset';
  await processUserMessage(uReset, 'Quiero más información', referralValid);
  await processUserMessage(uReset, 'Juan Pérez, 70012345, juan@test.com, La Paz');
  assert.strictEqual(await processUserMessage(uReset, 'reiniciar'), null);
  assert.strictEqual(await processUserMessage(uReset, 'reset'), null);
  // Nueva activación debe funcionar
  const rAfterReset = await processUserMessage(uReset, 'Hola de nuevo', referralValid);
  assert(checkIncludes(rAfterReset, 'nombre y apellido'), 'FAIL: Tras reset debe poder activarse de nuevo');
  console.log('  ✓ Comando reiniciar/reset funciona correctamente');

  console.log('\n🎉 ========================================================');
  console.log('🎉  TODOS LOS CASOS DE PRUEBA PASARON AL 100% SIN ERRORES');
  console.log('🎉 ========================================================\n');
}

runTests().catch(err => {
  console.error('❌ Error en tests:', err);
  process.exit(1);
});
