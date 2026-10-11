const { processUserMessage } = require('./services/aiAgent');

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪  VALIDACIÓN DEL FLUJO PROFESIONAL EXACTO DEL USUARIO');
  console.log('🧪 ========================================================\n');

  // --- RUTA 1: BÚSQUEDA / ALQUILER / COMPRA COMPLETO ---
  console.log('--- CASO 1: Flujo estándar completo (Alquiler de departamento) ---');
  const u1 = 'user_flow_std';
  const r1 = await processUserMessage(u1, 'Hola', { pushName: 'Marcos Antezana' });
  console.log('1. Saludo Bot:\n' + r1);
  if (!r1.includes('¡Hola Marcos Antezana! 👋😊 Soy tu asistente de Realty ONE Group Bolivia 🦁') ||
      !r1.includes('¿En qué puedo ayudarte?')) {
    throw new Error('Fallo en saludo inicial con hora y nombre');
  }

  const r2 = await processUserMessage(u1, 'tienes departamento de 2 dormitorios para alquilar?', { pushName: 'Marcos Antezana' });
  console.log('\n2. Consulta Cliente -> Bot:\n' + r2);
  if (!r2.includes('¡Sí, tenemos a disposición una excelente variedad de opciones! 🏡✨ En breve un agente especializado se pondrá en contacto contigo. Para coordinarlo, por favor compártenos tu nombre y apellido, tu número de teléfono o WhatsApp, tu correo electrónico y ciudad. 📲')) {
    throw new Error('Fallo en respuesta a opciones');
  }

  const r3 = await processUserMessage(u1, 'Marcos Antezana, 70123456, marcos@gmail.com, Santa Cruz', { pushName: 'Marcos Antezana' });
  console.log('\n3. Datos Cliente -> Bot:\n' + r3);
  if (!r3.includes('¡Perfecto Marcos Antezana! 🎉 Ya tengo tus datos principales. Si ya tienes clara tu decisión, ¿quieres agendar una visita? 🗓️ (Por favor indícame día, fecha y hora). 🤝')) {
    throw new Error('Fallo en confirmación de datos');
  }

  const r4 = await processUserMessage(u1, 'sí me gustaría agendar visita', { pushName: 'Marcos Antezana' });
  console.log('\n4. Cliente pide visita sin fecha -> Bot:\n' + r4);
  if (!r4.includes('Por favor indícame el día de la semana, la fecha exacta y la hora de tu visita (por ejemplo: Lunes 15 de marzo a las 10:00 AM). 🗓️🤝')) {
    throw new Error('Fallo al solicitar fecha exacta');
  }

  const r5 = await processUserMessage(u1, 'Lunes 15 de marzo a las 10:00 AM', { pushName: 'Marcos Antezana' });
  console.log('\n5. Cliente da fecha -> Bot Despedida y Coordinación:\n' + r5);
  if (!r5.includes('¡Muchas gracias por habernos elegido y por comunicarte con nosotros Marcos Antezana! 😊') ||
      !r5.includes('Cualquier duda o inquietud no dude en llamar. 📞🤝') ||
      !r5.includes('Tu visita ha quedado coordinada para el Lunes 15 de marzo a las 10:00 AM')) {
    throw new Error('Fallo al agendar y despedir');
  }

  const r6 = await processUserMessage(u1, 'Hola de nuevo bot', { pushName: 'Marcos Antezana' });
  console.log('\n6. Cliente escribe después de despedido -> Bot Silenciado:', r6);
  if (r6 !== null) {
    throw new Error('El bot NO debió responder tras haberse despedido');
  }
  console.log('✅ CASO 1 APROBADO 100%\n');

  // --- RUTA 2: CLIENTE QUIERE VENDER SU PROPIEDAD ---
  console.log('--- CASO 2: Cliente desea vender su propiedad ---');
  const u2 = 'user_flow_sell';
  await processUserMessage(u2, 'Hola', { pushName: 'Marcos Antezana' });
  const rSell = await processUserMessage(u2, 'Quiero vender mi casa de 3 habitaciones', { pushName: 'Marcos Antezana' });
  console.log('Respuesta Bot a venta de propiedad:\n' + rSell);
  if (!rSell.includes('¡Con mucho gusto te ayudamos con la comercialización y venta de tu propiedad! 🏡✨') ||
      !rSell.includes('En breve un agente especializado se pondrá en contacto contigo')) {
    throw new Error('Fallo en respuesta para venta de propiedad');
  }
  console.log('✅ CASO 2 APROBADO 100%\n');

  // --- RUTA 3: CLIENTE NO QUIERE VISITA ---
  console.log('--- CASO 3: Cliente rechaza agendar visita ---');
  const u3 = 'user_flow_declined';
  await processUserMessage(u3, 'Hola', { pushName: 'Marcos Antezana' });
  await processUserMessage(u3, 'tienes terrenos en venta?', { pushName: 'Marcos Antezana' });
  await processUserMessage(u3, 'Marcos Antezana, 70123456, marcos@gmail.com, Santa Cruz', { pushName: 'Marcos Antezana' });
  const rNo = await processUserMessage(u3, 'no, por ahora no gracias', { pushName: 'Marcos Antezana' });
  console.log('Respuesta Bot a negativa de visita:\n' + rNo);
  if (!rNo.includes('¡Muchas gracias por habernos elegido y por comunicarte con nosotros Marcos Antezana! 😊 Estaremos atentos para cuando lo decidas. Cualquier duda o inquietud no dude en llamar. 📞🤝')) {
    throw new Error('Fallo en despedida por no visita');
  }
  const rSilent = await processUserMessage(u3, 'buenas tardes', { pushName: 'Marcos Antezana' });
  if (rSilent !== null) {
    throw new Error('El bot debió quedar silenciado tras la despedida');
  }
  console.log('✅ CASO 3 APROBADO 100%\n');

  // --- RUTA 4: CLIENTE REHÚSA DAR DATOS ---
  console.log('--- CASO 4: Cliente se niega a dar datos personales ---');
  const u4 = 'user_flow_no_data';
  await processUserMessage(u4, 'Buenas tardes', { pushName: 'Marcos' });
  await processUserMessage(u4, 'Quiero info de casas', { pushName: 'Marcos' });
  const rNoData = await processUserMessage(u4, 'en otra oportunidad, no gracias', { pushName: 'Marcos' });
  console.log('Respuesta Bot a negativa de datos:\n' + rNoData);
  if (!rNoData.includes('¡Muchas gracias por habernos elegido y por comunicarte con nosotros Marcos! 😊') ||
      !rNoData.includes('Cualquier duda o inquietud no dude en llamar. 📞🤝')) {
    throw new Error('Fallo en despedida cordial por negativa de datos');
  }
  const rSilent4 = await processUserMessage(u4, 'Hola?', { pushName: 'Marcos' });
  if (rSilent4 !== null) {
    throw new Error('El bot debió quedar silenciado tras negativa de datos');
  }
  console.log('✅ CASO 4 APROBADO 100%\n');

  // --- RUTA 5: CONSULTA DIRECTA EN EL PRIMER MENSAJE ---
  console.log('--- CASO 5: Consulta directa en el primer mensaje ---');
  const u5 = 'user_flow_direct_msg1';
  const rDirect = await processUserMessage(u5, 'Buenas noches, tienen departamentos en alquiler?', { pushName: 'Valeria' });
  console.log('Respuesta Bot a consulta directa en 1er mensaje:\n' + rDirect);
  if (!rDirect.includes('¡Hola Valeria! 👋😊 Soy tu asistente de Realty ONE Group Bolivia 🦁') ||
      !rDirect.includes('¡Sí, tenemos a disposición una excelente variedad de opciones! 🏡✨') ||
      !rDirect.includes('Para coordinarlo, por favor compártenos tu nombre y apellido')) {
    throw new Error('Fallo en respuesta directa en mensaje 1');
  }
  console.log('✅ CASO 5 APROBADO 100%\n');

  console.log('🎉 ========================================================');
  console.log('🎉  TODAS LAS RUTAS DEL FLUJO DEL USUARIO APROBADAS AL 100%');
  console.log('🎉 ========================================================');
}

runTests().catch(err => {
  console.error('❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
