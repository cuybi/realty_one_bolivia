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

  console.log('🎉 ========================================================');
  console.log('🎉  TODAS LAS VALIDACIONES DE ANUNCIOS PASARON AL 100%');
  console.log('🎉 ========================================================');
}

runScreenshotTests();
