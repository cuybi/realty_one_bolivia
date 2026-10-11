/**
 * Suite de Pruebas Adversariales (Doubt-Driven Development)
 * Para Chatbot Inmobiliario Realty ONE Group Bolivia
 */

const assert = require('assert');
const { processUserMessage } = require('./services/aiAgent');
const leadClassifier = require('./services/leadClassifier');

async function runAdversarialSuite() {
  console.log('⚔️  ==============================================================');
  console.log('⚔️   SUITE DE PRUEBAS ADVERSARIALES (DOUBT-DRIVEN DEVELOPMENT)     ');
  console.log('⚔️  ==============================================================\n');

  // CASO A1: Extracción de nombres con lenguaje natural ruidoso y conectores
  console.log('✔ [1/7] Adversarial: Extracción de nombres en texto libre complejo...');
  const msgComplejo1 = 'Buenas tardes, mi nombre es Rodrigo Justiniano y mi celular es 77334455, mi correo rjustiniano@gmail.com de Santa Cruz';
  const ent1 = leadClassifier.extractLeadEntities(msgComplejo1);
  console.log(`   Detectado: "${ent1.nombre}" (Esperado: "Rodrigo Justiniano")`);
  assert.strictEqual(ent1.nombre, 'Rodrigo Justiniano', 'No debe contener "Y Mi" ni palabras conectoras');

  const msgComplejo2 = 'Me llamo Carlos Andrés Suárez y mi número es 70012345';
  const ent2 = leadClassifier.extractLeadEntities(msgComplejo2);
  console.log(`   Detectado: "${ent2.nombre}" (Esperado: "Carlos Andrés Suárez")`);
  assert.strictEqual(ent2.nombre, 'Carlos Andrés Suárez');
  console.log('   ✅ Extracción de nombres con lenguaje natural 100% limpia.\n');

  // CASO A2: Distinción entre "No hay problema" y "No gracias" (Falsa negativa)
  console.log('✔ [2/7] Adversarial: Diferenciación de frases idiomáticas ("no hay problema" vs "no")...');
  const u2 = 'adv_user_phrasing';
  await processUserMessage(u2, 'Hola', { pushName: 'Lucía' });
  await processUserMessage(u2, 'busco dpto en alquiler', { pushName: 'Lucía' });
  await processUserMessage(u2, 'Lucia Vaca, 77112233, lucia@test.com, Santa Cruz', { pushName: 'Lucía' });
  
  // Ahora el bot pide fecha de visita. El cliente responde: "No hay problema, el sábado a las 10:00 am"
  const resAffirmative = await processUserMessage(u2, 'No hay problema, el sábado a las 10:00 am', { pushName: 'Lucía' });
  console.log('   Respuesta bot a "No hay problema, sábado a las 10:00 am":\n   ' + resAffirmative.split('\n')[0]);
  assert(resAffirmative.includes('Tu visita ha quedado coordinada'), 'No debe tomar "no hay problema" como rechazo');
  assert(resAffirmative.includes('Cualquier duda o inquietud no dude en llamar. 📞🤝'));
  console.log('   ✅ Distinción idiomática superada exitosamente.\n');

  // CASO A3: Silencio post-despedida y reapertura SOLO con nuevo Facebook Ad
  console.log('✔ [3/7] Adversarial: MUTE estricto post-despedida y reapertura con Anuncio...');
  const u3 = 'adv_user_mute_ad';
  await processUserMessage(u3, 'Hola', { pushName: 'Roberto' });
  await processUserMessage(u3, 'Quiero comprar casa', { pushName: 'Roberto' });
  await processUserMessage(u3, 'Roberto Gomez, 78889900, roberto@gmail.com, Urubó', { pushName: 'Roberto' });
  const despedida = await processUserMessage(u3, 'no quiero visita por ahora', { pushName: 'Roberto' });
  assert(despedida.includes('Cualquier duda o inquietud no dude en llamar. 📞🤝'));

  // El usuario sigue escribiendo o enviando audios
  const silencio1 = await processUserMessage(u3, 'Hola siguen ahí?', { pushName: 'Roberto' });
  assert.strictEqual(silencio1, null, 'El bot debe permanecer en SILENCIO');
  const silencio2 = await processUserMessage(u3, 'audio_ogg_voice_message', { pushName: 'Roberto' });
  assert.strictEqual(silencio2, null, 'El bot debe permanecer en SILENCIO');

  // Ahora el usuario hace clic en un NUEVO anuncio de Facebook
  const reabiertoAd = await processUserMessage(u3, 'Hola, vi esto en Facebook https://fb.me/terrenos_g77', {
    pushName: 'Roberto',
    referral: {
      headline: 'Terreno Industrial G77',
      body: 'Terrenos con acceso pavimentado',
      source: 'Facebook Ads (CTWA)'
    }
  });
  console.log('   Respuesta bot tras clic en Anuncio de Facebook:\n   ' + reabiertoAd.split('\n')[0]);
  assert(reabiertoAd !== null, 'El bot DEBE reactivarse ante un nuevo Anuncio de Facebook');
  assert(reabiertoAd.includes('Realty ONE Group Bolivia'), 'Debe saludar por el nuevo anuncio');
  console.log('   ✅ Comportamiento de MUTE y reactivación por Facebook Ad verificado.\n');

  // CASO A4: Envío combinado de todos los datos + fecha de visita en un solo mensaje
  console.log('✔ [4/7] Adversarial: Envío de datos y fecha de visita simultáneamente...');
  const u4 = 'adv_user_all_in_one';
  await processUserMessage(u4, 'Hola', { pushName: 'Fernando' });
  await processUserMessage(u4, 'Quiero comprar un terreno en el Urubó', { pushName: 'Fernando' });
  const resAllInOne = await processUserMessage(u4, 'Fernando Torrico, 76543210, fer@torrico.com, Urubó. Quisiera la visita el Lunes 20 de Octubre a las 16:00 hrs', { pushName: 'Fernando' });
  console.log('   Respuesta bot a datos + visita en 1 mensaje:\n   ' + resAllInOne.split('\n')[0]);
  assert(resAllInOne.includes('Ya tengo tus datos principales y tu visita ha quedado coordinada'));
  assert(resAllInOne.includes('Cualquier duda o inquietud no dude en llamar. 📞🤝'));

  const silenceAll = await processUserMessage(u4, 'Gracias!', { pushName: 'Fernando' });
  assert.strictEqual(silenceAll, null, 'Debe quedar en silencio');
  console.log('   ✅ Flujo combinado todo-en-uno procesado y cerrado correctamente.\n');

  // CASO A5: Mensajes de venta con términos variados (consignar, poner en venta, captación)
  console.log('✔ [5/7] Adversarial: Detección de consignación y venta de propietarios...');
  const u5a = 'adv_user_consignar';
  await processUserMessage(u5a, 'Buenas tardes');
  const resConsignar = await processUserMessage(u5a, 'Deseo consignar mi departamento para que lo vendan');
  assert(resConsignar.includes('comercialización y venta de tu propiedad'), 'Debe detectar consignación');

  const u5b = 'adv_user_captacion';
  await processUserMessage(u5b, 'Hola');
  const resPoner = await processUserMessage(u5b, 'Tengo una casa y la quiero poner en venta');
  assert(resPoner.includes('comercialización y venta de tu propiedad'), 'Debe detectar poner en venta');
  console.log('   ✅ Detección de venta/consignación verificada para todos los sinónimos.\n');

  // CASO A6: Recuperación ante inactividad / nuevo saludo
  console.log('✔ [6/7] Adversarial: Recuperación de estado ante nuevo saludo...');
  const u6 = 'adv_user_stale';
  await processUserMessage(u6, 'Hola', { pushName: 'Claudia' });
  await processUserMessage(u6, 'Busco departamento', { pushName: 'Claudia' });
  await processUserMessage(u6, 'Claudia Mendez, 71234567, claudia@gmail.com, Santa Cruz', { pushName: 'Claudia' });
  // El usuario quedó en ESTADO_4_SCHEDULE esperando visita. Pasan horas y vuelve a saludar:
  const resNuevoSaludo = await processUserMessage(u6, 'Hola buenos días', { pushName: 'Claudia' });
  console.log('   Respuesta bot ante nuevo saludo tras abandono:\n   ' + resNuevoSaludo.split('\n')[0]);
  assert(resNuevoSaludo.includes('¿En qué puedo ayudarte?'), 'Debe reiniciar limpiamente al recibir un saludo fresco');
  console.log('   ✅ Auto-recuperación de sesiones huérfanas validada.\n');

  // CASO A7: Comandos explícitos de reinicio
  console.log('✔ [7/8] Adversarial: Comandos explícitos de reinicio (reset/reiniciar/menu)...');
  const u7 = 'adv_user_reset';
  await processUserMessage(u7, 'Hola');
  await processUserMessage(u7, 'Busco terreno');
  const resReset = await processUserMessage(u7, 'reiniciar');
  assert(resReset.includes('¿En qué puedo ayudarte?'), 'Al reiniciar debe saludar de nuevo');
  const resNext = await processUserMessage(u7, 'Tienes casas en venta?');
  assert(resNext.includes('una excelente variedad de opciones'), 'Debe responder a opciones tras reinicio');
  console.log('   ✅ Comandos de reseteo validados al 100%.\n');

  // CASO A8: Cortesía/Cierre con "gracias\" sin datos en ESTADO_3_DATA
  console.log('✔ [8/9] Adversarial: Cortesía/Cierre con "gracias\\" sin datos en ESTADO_3_DATA...');
  const u8 = 'adv_user_gracias';
  await processUserMessage(u8, '¡Hola! Quiero más información', { pushName: 'Marcos Antezana' });
  const resGracias = await processUserMessage(u8, 'gracias\\', { pushName: 'Marcos Antezana' });
  assert(resGracias.includes('¡Muchas gracias por habernos elegido y por comunicarte con nosotros Marcos Antezana!'), 'Debe despedirse cordialmente');
  assert(resGracias.includes('Cualquier duda o inquietud no dude en llamar. 📞🤝'), 'Debe incluir frase corporativa');
  assert(!resGracias.includes('Ya tengo tus datos principales'), 'NO debe inventar que tiene datos cuando el cliente solo dijo gracias');
  const resPostGracias = await processUserMessage(u8, 'hola?', { pushName: 'Marcos Antezana' });
  assert(resPostGracias === null, 'Debe quedar en silencio/mute post-despedida');
  console.log('   ✅ Cortesía "gracias\\" y MUTE post-despedida validados al 100%.\n');

  // CASO A9: Error tipográfico "noi" (teclado móvil o/i) al declinar visita
  console.log('✔ [9/10] Adversarial: Error tipográfico "noi" al declinar visita en ESTADO_4_SCHEDULE...');
  const u9 = 'adv_user_noi';
  await processUserMessage(u9, 'Hola busco departamento', { pushName: 'Marcos Antezana' });
  await processUserMessage(u9, 'Marcos Antezana, 70012345, marcos@gmail.com, Santa Cruz', { pushName: 'Marcos Antezana' });
  const resNoi = await processUserMessage(u9, 'noi', { pushName: 'Marcos Antezana' });
  assert(resNoi.includes('¡Muchas gracias por habernos elegido y por comunicarte con nosotros Marcos Antezana!'), 'Debe despedirse al recibir noi');
  assert(resNoi.includes('Cualquier duda o inquietud no dude en llamar. 📞🤝'), 'Debe incluir frase corporativa');
  assert(!resNoi.includes('Por favor indícame el día de la semana'), 'NO debe pedir fecha cuando el cliente dijo noi');
  const resPostNoi = await processUserMessage(u9, 'hola?', { pushName: 'Marcos Antezana' });
  assert(resPostNoi === null, 'Debe quedar en silencio post-despedida');
  console.log('   ✅ "noi" reconocido como negativa y cerrado con MUTE.\n');

  // CASO A10: Envío tardío de datos de contacto tras despedida previa (reactivación inteligente)
  console.log('✔ [10/12] Adversarial: Envío de datos tras haber dicho gracias (reactivación inteligente)...');
  const u10 = 'adv_user_late_data';
  await processUserMessage(u10, '¡Hola! Quiero más información', { pushName: 'Marcos Antezana' });
  const resFarewell10 = await processUserMessage(u10, 'gracias', { pushName: 'Marcos Antezana' });
  assert(resFarewell10.includes('¡Muchas gracias por habernos elegido y por comunicarte con nosotros Marcos Antezana!'), 'Debe despedirse tras gracias');
  // Ahora el cliente cambia de parecer y manda su celular:
  const resLateData = await processUserMessage(u10, 'marcos antezana, 60034649', { pushName: 'Marcos Antezana' });
  assert(resLateData.includes('¡Entendido Marcos Antezana! En breve un agente especializado se pondrá en contacto contigo.'), 'Debe reactivar y confirmar contacto');
  assert(resLateData.includes('tu correo electrónico y tu ciudad'), 'Debe pedir los datos faltantes restantes');
  // Y luego completa con su correo y ciudad:
  const resCompleteData = await processUserMessage(u10, 'marcos@gmail.com, Santa Cruz', { pushName: 'Marcos Antezana' });
  assert(resCompleteData.includes('¡Perfecto Marcos Antezana!'), 'Debe reconocer datos completos');
  assert(resCompleteData.includes('¿quieres agendar una visita?'), 'Debe ofrecer agendamiento tras completar datos');
  console.log('   ✅ Reactivación ante envío tardío de datos validada al 100%.\n');

  // CASO A11: Números internacionales globales (España, EE.UU., Argentina, Chile)
  console.log('✔ [11/12] Adversarial: Extracción de números internacionales de cualquier país...');
  const u11 = 'adv_user_intl';
  await processUserMessage(u11, 'Hola busco casa', { pushName: 'Javier Rodriguez' });
  const resIntl = await processUserMessage(u11, 'Javier Rodriguez, +34 612 34 56 78, javier@gmail.com, Madrid', { pushName: 'Javier Rodriguez' });
  assert(resIntl.includes('¡Perfecto Javier Rodriguez!'), 'Debe aceptar número internacional con + y espacios');
  assert(resIntl.includes('¿quieres agendar una visita?'), 'Debe avanzar a visita con número internacional');
  console.log('   ✅ Números internacionales globales validados al 100%.\n');

  // CASO A12: Detección inteligente de datos faltantes (caso Yohan Oliva: "solo falta correo y ciudad")
  console.log('✔ [12/12] Adversarial: Detección de datos faltantes y confirmación de contacto de agente...');
  const u12 = '59178899112';
  await processUserMessage(u12, 'Hola', { pushName: 'Yohan Oliva' });
  await processUserMessage(u12, 'Quisiera comprar una casa', { pushName: 'Yohan Oliva' });
  const resYohan = await processUserMessage(u12, 'Ya tienes esa información, la unica información que no tendrias es el correo y la ciudad', { pushName: 'Yohan Oliva' });
  assert(resYohan.includes('¡Entendido Yohan Oliva! En breve un agente especializado se pondrá en contacto contigo.'), 'Debe confirmar que un agente lo contactará');
  assert(resYohan.includes('tu correo electrónico y tu ciudad'), 'Debe pedir específicamente los datos faltantes');
  assert(!resYohan.includes('Estaremos atentos para cuando lo decidas'), 'NO debe despedirse ni cerrar la conversación');
  const resYohanData = await processUserMessage(u12, 'yohan@gmail.com, Santa Cruz', { pushName: 'Yohan Oliva' });
  assert(resYohanData.includes('¡Perfecto Yohan Oliva!'), 'Debe confirmar datos tras recibir correo y ciudad');
  assert(resYohanData.includes('¿quieres agendar una visita?'), 'Debe pasar a agendamiento tras completar datos');
  console.log('   ✅ Flujo de datos faltantes y confirmación de contacto validado al 100%.\n');

  console.log('🏆 ==============================================================');
  console.log('🏆  TODAS LAS PRUEBAS ADVERSARIALES (12/12) SUPERADAS CON ÉXITO');
  console.log('🏆 ==============================================================');
}

runAdversarialSuite().catch(err => {
  console.error('❌ FALLO EN SUITE ADVERSARIAL:', err);
  process.exit(1);
});
