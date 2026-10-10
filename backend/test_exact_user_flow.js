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
  if (!r1.includes('¡Hola Marcos Antezana! 👋😊 Soy tu asistente de Realty ONE Group Bolivia 🦁\n\n¿En qué puedo ayudarte?')) {
    throw new Error('Fallo en saludo inicial');
  }

  const r2 = await processUserMessage(u1, 'tienes departamento de 2 dormitorios para alquilar?', { pushName: 'Marcos Antezana' });
  console.log('\n2. Consulta Cliente -> Bot:\n' + r2);
  if (!r2.includes('¡Sí, tenemos a disposición excelentes opciones! 🏡✨ En breve un agente especializado se pondrá en contacto contigo. Para coordinarlo, por favor dame tu nombre y apellido, tu número de teléfono o whatsapp, tu correo electrónico y ciudad. 📲')) {
    throw new Error('Fallo en respuesta a opciones');
  }

  const r3 = await processUserMessage(u1, 'Marcos Antezana, 70123456, marcos@gmail.com, Santa Cruz', { pushName: 'Marcos Antezana' });
  console.log('\n3. Datos Cliente -> Bot:\n' + r3);
  if (!r3.includes('¡Perfecto Marcos Antezana! 🎉 Ya tengo tus datos principales. Si ya tienes clara tu decisión, ¿quieres agendar una visita? 🗓️ (Por favor indícame día, fecha y hora). 🤝')) {
    throw new Error('Fallo en confirmación de datos');
  }

  const r4 = await processUserMessage(u1, 'sí me gustaría agendar visita', { pushName: 'Marcos Antezana' });
  console.log('\n4. Cliente pide visita sin fecha -> Bot:\n' + r4);
  if (!r4.includes('Por favor indícame el día de la semana, la fecha exacta y la hora de tu visita (por ejemplo: Lunes 15 de marzo a las 10:00 AM). 🗓️')) {
    throw new Error('Fallo al solicitar fecha exacta');
  }

  const r5 = await processUserMessage(u1, 'Lunes 15 de marzo a las 10:00 AM', { pushName: 'Marcos Antezana' });
  console.log('\n5. Cliente da fecha -> Bot:\n' + r5);
  if (!r5.includes('¡Muchas gracias por tu agendamiento Marcos Antezana! 🎉📅 ¿Quieres que te recuerde un día antes de tu visita? 🔔')) {
    throw new Error('Fallo al agendar y preguntar recordatorio');
  }

  const r6 = await processUserMessage(u1, 'sí por favor recuerdame', { pushName: 'Marcos Antezana' });
  console.log('\n6. Cliente responde recordatorio -> Bot Despedida:\n' + r6);
  if (!r6.includes('¡Muchas gracias por tu tiempo Marcos Antezana! 🦁✨ Un agente especializado se pondrá en contacto contigo para coordinar todos los detalles de tu visita. Cualquier duda o inquietud no dude en llamar. 📞🤝')) {
    throw new Error('Fallo en despedida final');
  }

  const r7 = await processUserMessage(u1, 'Hola de nuevo bot', { pushName: 'Marcos Antezana' });
  console.log('\n7. Cliente escribe después de despedido -> Bot Silenciado:', r7);
  if (r7 !== null) {
    throw new Error('El bot NO debió responder tras haberse despedido');
  }
  console.log('✅ CASO 1 APROBADO 100%\n');

  // --- RUTA 2: CLIENTE QUIERE VENDER SU PROPIEDAD ---
  console.log('--- CASO 2: Cliente desea vender su propiedad ---');
  const u2 = 'user_flow_sell';
  await processUserMessage(u2, 'Hola', { pushName: 'Marcos Antezana' });
  const rSell = await processUserMessage(u2, 'Quiero vender mi casa de 3 habitaciones', { pushName: 'Marcos Antezana' });
  console.log('Respuesta Bot a venta de propiedad:\n' + rSell);
  if (!rSell.includes('¡Con mucho gusto te ayudamos con la venta de tu propiedad! 🏡✨') ||
      !rSell.includes('¿en qué zona y en qué departamento se encuentra?') ||
      !rSell.includes('describe cómo es (dimensiones y ambientes)')) {
    throw new Error('Fallo en respuesta para captación/venta de propiedad');
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

  // --- RUTA 4: ENTRADA DIRECTA POR ANUNCIO DE FACEBOOK ---
  console.log('--- CASO 4: Entrada directa por Anuncio de Facebook ---');
  const u4 = 'user_flow_ad';
  const rAd1 = await processUserMessage(u4, 'Hola, vi este anuncio en Facebook: https://fb.me/7fDPWEH23\nWESTGATE TOWER\nMonoambientes, departamentos de 1 y 2 dormitorios', { pushName: 'Marcos Antezana' });
  console.log('1. Saludo Bot a Anuncio:\n' + rAd1);
  if (!rAd1.includes('¡Hola Marcos Antezana! 👋😊 Soy tu asistente de Realty ONE Group Bolivia 🦁\n\n¿En qué puedo ayudarte?')) {
    throw new Error('Fallo en saludo cordial inicial tras anuncio');
  }

  const rAd2 = await processUserMessage(u4, 'Quiero saber qué departamentos tienen disponibles en este proyecto', { pushName: 'Marcos Antezana' });
  console.log('\n2. Consulta Cliente -> Opciones Bot:\n' + rAd2);
  if (!rAd2.includes('¡Sí, tenemos a disposición excelentes opciones! 🏡✨ En breve un agente especializado se pondrá en contacto contigo. Para coordinarlo, por favor dame tu nombre y apellido, tu número de teléfono o whatsapp, tu correo electrónico y ciudad. 📲')) {
    throw new Error('Fallo en opciones tras saludo de anuncio');
  }
  console.log('✅ CASO 4 APROBADO 100%\n');

  console.log('🎉 ========================================================');
  console.log('🎉  TODAS LAS RUTAS DEL FLUJO DEL USUARIO APROBADAS AL 100%');
  console.log('🎉 ========================================================');
}

runTests().catch(err => {
  console.error('❌ ERROR EN PRUEBAS:', err);
  process.exit(1);
});
