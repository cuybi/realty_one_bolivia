const aiAgent = require('./services/aiAgent');

async function runScreenshotTests() {
  console.log('🧪 ========================================================');
  console.log('🧪  VALIDACIÓN EXACTA DE LAS DOS CAPTURAS DEL USUARIO');
  console.log('🧪 ========================================================\n');

  // CASO 1: Captura 1 - Westgate Tower
  console.log('--- TEST CAPTURA 1: Usuario entra por anuncio WESTGATE TOWER ---');
  const user1 = '59177000099';
  const referralWestgate = {
    source: 'Facebook Ads (CTWA)',
    headline: 'Realty ONE Group Itaguazu',
    body: '🏢 DONDE EL FUTURO ENCUENTRA SU LUGAR — WESTGATE TOWER Descubrí la nueva referencia arquitectónica y residencial de Santa Cruz. Una imponente torre de 16 pisos diseñada para elevar tu estilo de vida y asegurar la más alta plusvalía de tu inversión. 📍 UBICACIÓN ESTRATÉGICA: Sobre Av. fb.me',
    source_url: 'https://fb.me/westgate',
    pushName: 'Marcos'
  };
  const reply1 = await aiAgent.processUserMessage(user1, '¡Hola! Quiero más información', referralWestgate);
  console.log('🤖 RESPUESTA BOT A WESTGATE TOWER:\n', reply1);

  if (reply1.includes('WESTGATE TOWER') && !reply1.includes('Departamento de 4 Dormitorios') && !reply1.includes('119 m²')) {
    console.log('✅ ÉXITO CAPTURA 1: Reconoce WESTGATE TOWER dinámicamente y NO envía el dpto 4D.\n');
  } else {
    console.error('❌ ERROR CAPTURA 1: Falló detección de WESTGATE TOWER.\n');
    process.exit(1);
  }

  // CASO 2: Captura 2 - 217 Hectáreas Buenavista
  console.log('--- TEST CAPTURA 2: Usuario entra por anuncio BUENAVISTA 217 HECTÁREAS ---');
  const user2 = '59177000098';
  const referralBuenavista = {
    source: 'Facebook Ads (CTWA)',
    headline: 'Realty ONE Group Itaguazu',
    body: '🌿 ¡OPORTUNIDAD DE INVERSIÓN EN BUENAVISTA! 🏡 217 HECTÁREAS EN VENTA 💰 US$ 3.600 por hectárea 🔥 Precio total: US$ 781.200 Una propiedad con gran potencial productivo y turístico, ideal para inversionistas que buscan desarrollar un proyecto en contacto con la naturaleza. 📍 fb.me',
    source_url: 'https://fb.me/buenavista',
    pushName: 'Marcos'
  };
  const reply2 = await aiAgent.processUserMessage(user2, '¡Hola! Quiero más información', referralBuenavista);
  console.log('🤖 RESPUESTA BOT A BUENAVISTA 217 HECTÁREAS:\n', reply2);

  if ((reply2.includes('217 HECTÁREAS') || reply2.includes('BUENAVISTA')) && !reply2.includes('Departamento de 4 Dormitorios') && !reply2.includes('119 m²')) {
    console.log('✅ ÉXITO CAPTURA 2: Reconoce BUENAVISTA dinámicamente y NO envía el dpto 4D.\n');
  } else {
    console.error('❌ ERROR CAPTURA 2: Falló detección de BUENAVISTA.\n');
    process.exit(1);
  }

  // CASO 3: Mismo usuario cambiando de un anuncio a otro
  console.log('--- TEST CAPTURA 3: El MISMO usuario toca Westgate y luego Buenavista ---');
  const replySameUser = await aiAgent.processUserMessage(user1, '¡Hola! Quiero más información', referralBuenavista);
  console.log('🤖 RESPUESTA AL MISMO USUARIO AL TOCAR BUENAVISTA TRAS WESTGATE:\n', replySameUser);

  if ((replySameUser.includes('217 HECTÁREAS') || replySameUser.includes('BUENAVISTA')) && !replySameUser.includes('WESTGATE') && !replySameUser.includes('Departamento de 4 Dormitorios')) {
    console.log('✅ ÉXITO CAPTURA 3: La sesión anterior se resetea y NO contamina el nuevo anuncio.\n');
  } else {
    console.error('❌ ERROR CAPTURA 3: Se contaminó la sesión del usuario.\n');
    process.exit(1);
  }

  // CASO 4: Calificación de inversión
  console.log('--- TEST CAPTURA 4: Usuario responde que es para inversión ---');
  const replyInvest = await aiAgent.processUserMessage(user1, 'Es para inversión', referralBuenavista);
  console.log('🤖 RESPUESTA A INVERSIÓN:\n', replyInvest);
  if (replyInvest.includes('visión de inversión') && replyInvest.includes('plusvalía')) {
    console.log('✅ ÉXITO CAPTURA 4: Responde profesionalmente a perfil inversor.\n');
  } else {
    console.error('❌ ERROR CAPTURA 4.\n');
    process.exit(1);
  }

  // CASO 5: Agendamiento de visita
  console.log('--- TEST CAPTURA 5: Usuario pide coordinar visita ---');
  const replyVisit = await aiAgent.processUserMessage(user1, 'me gustaría coordinar una visita', referralBuenavista);
  console.log('🤖 RESPUESTA A VISITA:\n', replyVisit);
  if (replyVisit.includes('coordinar tu visita') || replyVisit.includes('Qué día y hora')) {
    console.log('✅ ÉXITO CAPTURA 5: Solicita día y hora para la visita.\n');
  } else {
    console.error('❌ ERROR CAPTURA 5.\n');
    process.exit(1);
  }

  // CASO 6: Confirmación de cita
  console.log('--- TEST CAPTURA 6: Usuario envía horario para visita ---');
  const replyTime = await aiAgent.processUserMessage(user1, 'este sabado a las 10:00 am', referralBuenavista);
  console.log('🤖 RESPUESTA A HORARIO:\n', replyTime);
  if (replyTime.includes('Cita agendada con éxito') && replyTime.includes('este sabado a las 10:00 am')) {
    console.log('✅ ÉXITO CAPTURA 6: Confirma cita y agenda correctamente.\n');
  } else {
    console.error('❌ ERROR CAPTURA 6.\n');
    process.exit(1);
  }

  // CASO 7: MENSAJE EXACTO DE LA CAPTURA DEL USUARIO (Departamento 4 Dormitorios)
  console.log('--- TEST CAPTURA 7: Mensaje exacto de la captura del usuario ---');
  const user3 = '59177889900';
  const replyDpto = await aiAgent.processUserMessage(user3, 'Hola, vi la publicidad en Facebook del Departamento de 4 dormitorios de 119 m2 ($120.000) y deseo más información.', { pushName: 'Marcos' });
  console.log('🤖 RESPUESTA BOT A MENSAJE DE LA CAPTURA:\n', replyDpto);

  if (
    replyDpto.includes('Departamento de 4 Dormitorios') &&
    replyDpto.includes('Nombre completo') &&
    replyDpto.includes('celular') &&
    replyDpto.includes('Correo electrónico') &&
    replyDpto.includes('agendar una visita') &&
    !replyDpto.includes('📐 Superficie: 119 m² construidos') &&
    !replyDpto.includes('🚛 Accesibilidad:')
  ) {
    console.log('✅ ÉXITO CAPTURA 7: NO repite la ficha técnica; saluda cordial y solicita Nombre completo, Celular, Email y Agendar visita.\n');
  } else {
    console.error('❌ ERROR CAPTURA 7: Volvió a enviar la ficha técnica robótica o falló la solicitud de datos.\n');
    process.exit(1);
  }

  // CASO 8: Pregunta sobre crédito bancario
  console.log('--- TEST 8: Cliente pregunta por crédito bancario ---');
  const replyCredit = await aiAgent.processUserMessage(user3, '¿Aceptan crédito bancario o cómo se financia?', { pushName: 'Marcos' });
  console.log('🤖 RESPUESTA A CRÉDITO:\n', replyCredit);
  if (replyCredit.includes('Crédito Bancario') && replyCredit.includes('Folio Real')) {
    console.log('✅ ÉXITO TEST 8: Responde como asesor financiero inmobiliario.\n');
  } else {
    console.error('❌ ERROR TEST 8: Falló respuesta a crédito bancario.\n');
    process.exit(1);
  }

  // CASO 9: Pregunta sobre permuta o vehículo
  console.log('--- TEST 9: Cliente pregunta si aceptan permuta por vehículo ---');
  const replyPermuta = await aiAgent.processUserMessage(user3, '¿Aceptan permuta por vehículo en parte de pago?', { pushName: 'Marcos' });
  console.log('🤖 RESPUESTA A PERMUTA:\n', replyPermuta);
  if (replyPermuta.includes('Permutas') && replyPermuta.includes('vehículos')) {
    console.log('✅ ÉXITO TEST 9: Responde sobre evaluación de permutas.\n');
  } else {
    console.error('❌ ERROR TEST 9: Falló respuesta a permuta.\n');
    process.exit(1);
  }

  // CASO 10: Pregunta sobre expensas
  console.log('--- TEST 10: Cliente pregunta por expensas ---');
  const replyExpensas = await aiAgent.processUserMessage(user3, '¿Cuánto se paga de expensas?', { pushName: 'Marcos' });
  console.log('🤖 RESPUESTA A EXPENSAS:\n', replyExpensas);
  if (replyExpensas.includes('Expensas') && replyExpensas.includes('mantenimiento')) {
    console.log('✅ ÉXITO TEST 10: Responde sobre expensas del edificio.\n');
  } else {
    console.error('❌ ERROR TEST 10: Falló respuesta a expensas.\n');
    process.exit(1);
  }

  // CASO 11: Cliente envía nombre, teléfono, email y horario de visita
  console.log('--- TEST 11: Cliente envía nombre, teléfono, email y horario de visita ---');
  const replyLeadData = await aiAgent.processUserMessage(user3, 'Marcos Pérez, 70123456, marcos@gmail.com, este sábado a las 10:00 am', { pushName: 'Marcos' });
  console.log('🤖 RESPUESTA A ENVÍO DE DATOS:\n', replyLeadData);
  if (replyLeadData.includes('Cita agendada') && replyLeadData.includes('Asesor Asignado')) {
    console.log('✅ ÉXITO TEST 11: Captura datos de contacto y agenda cita correctamente.\n');
  } else {
    console.error('❌ ERROR TEST 11: Falló confirmación de captura de datos o cita.\n');
    process.exit(1);
  }

  console.log('🎉 ========================================================');
  console.log('🎉  TODAS LAS VALIDACIONES (INCLUYENDO CAPTURA DEL USUARIO) PASARON AL 100%');
  console.log('🎉 ========================================================');
}

runScreenshotTests();
