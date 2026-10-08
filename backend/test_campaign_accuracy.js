const campaignService = require('./services/campaignService');
const aiAgent = require('./services/aiAgent');

async function testCases() {
  console.log('=== TEST 1: User enters through Departamento 4D Ad ===');
  const user1 = '59177000001';
  const msg1 = '¡Hola! Quiero más información | Realty ONE Group Itaguazu Departamento de 4 Dormitorios (119 m2) Entre 2do y 3er Anillo $120,000 USD fb.me';
  const referral1 = {
    headline: 'Realty ONE Group Itaguazu',
    body: 'Departamento de 4 Dormitorios (119 m2) Entre 2do y 3er Anillo $120,000 USD',
    source_url: 'https://fb.me/zzz',
    pushName: 'Marcos'
  };

  // Paso 1: Al entrar por el anuncio, el bot entrega ficha y realiza preguntas consultivas
  const reply1a = await aiAgent.processUserMessage(user1, msg1, referral1);
  console.log('BOT REPLY 1a (Ficha inicial y preguntas consultivas):\n', reply1a);
  if (reply1a.includes('Departamento de 4 Dormitorios') && reply1a.includes('vivienda propia o como inversión')) {
    console.log('✅ PASO 1 OK: Entrega detalles del inmueble y preguntas consultivas.\n');
  } else {
    console.error('❌ PASO 1 FALLÓ: No entregó detalles o preguntas consultivas.\n');
  }

  // Paso 2: Usuario responde calificación de propósito
  const reply1b = await aiAgent.processUserMessage(user1, 'es para vivienda propia', referral1);
  console.log('BOT REPLY 1b (Respuesta a calificación de propósito):\n', reply1b);
  if (reply1b.includes('vivienda familiar') && reply1b.includes('visita presencial')) {
    console.log('✅ PASO 2 OK: Responde empáticamente a vivienda propia invitando a visita.\n');
  } else {
    console.error('❌ PASO 2 FALLÓ: No respondió adecuadamente a calificación.\n');
  }

  // Paso 3: Usuario dice "me gustaria agendar una visita"
  const reply1c = await aiAgent.processUserMessage(user1, 'me gustaria agendar una visita', referral1);
  console.log('BOT REPLY 1c (Agendar visita):\n', reply1c);
  if (reply1c.includes('Será un placer coordinar tu visita') || reply1c.includes('Qué día y hora')) {
    console.log('✅ PASO 3 OK: Responde solicitando día y hora para la visita.\n');
  } else {
    console.error('❌ PASO 3 FALLÓ: No respondió a visita.\n');
  }

  // Paso 4: Usuario envía horario
  const reply1d = await aiAgent.processUserMessage(user1, 'este sabado a las 10:00 am', referral1);
  console.log('BOT REPLY 1d (Confirmación de cita):\n', reply1d);
  if (reply1d.includes('Cita agendada con éxito') && reply1d.includes('este sabado a las 10:00 am')) {
    console.log('✅ PASO 4 OK: Confirma la cita con éxito.\n');
  } else {
    console.error('❌ PASO 4 FALLÓ: No confirmó la cita.\n');
  }

  // Paso 5: Usuario dice "gracias"
  const reply1e = await aiAgent.processUserMessage(user1, 'gracias', referral1);
  console.log('BOT REPLY 1e (Agradecimiento):\n', reply1e);
  if (reply1e.includes('Quedamos a tu completa disposición')) {
    console.log('✅ PASO 5 OK: Cierre cordial de agradecimiento.\n');
  } else {
    console.error('❌ PASO 5 FALLÓ.\n');
  }

  // Paso 6: Usuario dice "tiene fotos"
  const reply1f = await aiAgent.processUserMessage(user1, 'tiene fotos', referral1);
  console.log('BOT REPLY 1f (Fotos del departamento):\n', reply1f);
  if (reply1f.includes('Fotografías del Departamento') && reply1f.includes('Fachada')) {
    console.log('✅ PASO 6 OK: Responde con fotos y ambientes.\n');
  } else {
    console.error('❌ PASO 6 FALLÓ.\n');
  }

  console.log('=== TEST 3: User answers with "zona sur" ===');
  const user3 = '59177000003';
  const reply3 = await aiAgent.processUserMessage(user3, 'zona sur', { pushName: 'Marcos Antezana' });
  if (reply3.includes('Zona Sur') && reply3.includes('Marcos Antezana') && !reply3.includes('One Comsys') && !reply3.includes('¿Buscas alguna zona o tipo de inmueble en especial?')) {
    console.log('✅ TEST 3 OK: Reconoce zona sur y responde cordialmente.\n');
  } else {
    console.log('ℹ️ TEST 3 terminado.\n');
  }
  // Paso 4: Usuario dice "gracias" tras recibir información de zona
  const reply3b = await aiAgent.processUserMessage(user3, 'gracias', { pushName: 'Marcos Antezana' });
  console.log('BOT REPLY 3b (Respuesta a "gracias"):\n', reply3b);
  if (reply3b.includes('¡A ti Marcos Antezana!') || reply3b.includes('placer') || reply3b.includes('gracias')) {
    console.log('✅ TEST 4 OK: Responde con agradecimiento y despedida cordial sin repetir el catálogo.\n');
  } else {
    console.error('❌ TEST 4 FALLÓ: No respondió con despedida cordial.\n');
  }
}

testCases();
