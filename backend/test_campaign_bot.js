/**
 * Script de validación automatizada para Campañas de Facebook Ads (Click-to-WhatsApp)
 * Prueba la respuesta por publicación para:
 * 1. Condominio Mar Adentro ($112,500 - Lote 450 m²)
 * 2. Terreno Industrial G77 (Bs 16.800.000 - 7.000 m²)
 */

const aiAgent = require('./services/aiAgent');
const campaignService = require('./services/campaignService');
const leadClassifier = require('./services/leadClassifier');

async function runCampaignTests() {
  console.log('================================================================');
  console.log('🦁 VALIDACIÓN DE CHATBOT IA PARA PUBLICACIONES DE FACEBOOK ADS');
  console.log('================================================================\n');

  // 1. Verificar carga de campañas
  const campaigns = campaignService.getCampaigns();
  console.log(`📋 Campañas activas configuradas: ${campaigns.length}`);
  campaigns.forEach((c, idx) => {
    console.log(`   ${idx + 1}. [${c.id}] ${c.titulo_campana}`);
    console.log(`      📍 Ubicación: ${c.datos_inmueble.ubicacion}`);
    console.log(`      💰 Precio: ${c.datos_inmueble.precio_usd || c.datos_inmueble.precio_bs}`);
    console.log(`      👤 Asesor: ${c.oficina.asesor_a_cargo} (${c.oficina.telefono})`);
  });
  console.log('\n================================================================');

  // ===================================================================
  // CASO 1: PUBLICACIÓN FACEBOOK - CONDOMINIO MAR ADENTRO
  // ===================================================================
  console.log('\n🌊 -------------------------------------------------------------');
  console.log('🌊 TEST 1: CLIENTE LLEGA DESDE ANUNCIO DE FACEBOOK "MAR ADENTRO"');
  console.log('🌊 -------------------------------------------------------------');

  const userIdMar = '59178811223';

  // Paso 1. Saludo inicial Click-to-WhatsApp
  console.log('\n👉 [CLIENTE HACE CLIC EN WHATSAPP EN FACEBOOK]:');
  const msg1 = 'Hola, vi la publicidad en Facebook del Lote en Condominio Mar Adentro y deseo más información.';
  console.log(`💬 "${msg1}"`);
  const reply1 = await aiAgent.processUserMessage(userIdMar, msg1, 'Rodrigo Camacho');
  console.log(`\n🤖 [RESPUESTA INICIAL DEL BOT]:\n${reply1}`);

  // Paso 2. Pregunta de seguimiento sobre precio y crédito
  console.log('\n👉 [CLIENTE PREGUNTA POR PRECIO Y CRÉDITO]:');
  const msg2 = '¿Cuál es el precio exacto y aceptan financiamiento bancario?';
  console.log(`💬 "${msg2}"`);
  const reply2 = await aiAgent.processUserMessage(userIdMar, msg2, 'Rodrigo Camacho');
  console.log(`\n🤖 [RESPUESTA PRECIO]:\n${reply2}`);

  // Paso 3. Pregunta de seguimiento sobre la laguna y amenidades
  console.log('\n👉 [CLIENTE PREGUNTA POR LA LAGUNA Y AMENIDADES]:');
  const msg3 = '¿A cuántos metros queda de la laguna cristalina y qué amenidades tiene el condominio?';
  console.log(`💬 "${msg3}"`);
  const reply3 = await aiAgent.processUserMessage(userIdMar, msg3, 'Rodrigo Camacho');
  console.log(`\n🤖 [RESPUESTA AMENIDADES]:\n${reply3}`);

  // Paso 4. Pregunta de seguimiento sobre medidas
  console.log('\n👉 [CLIENTE PREGUNTA POR MEDIDAS]:');
  const msg4 = '¿Cuáles son las dimensiones de frente y fondo del lote?';
  console.log(`💬 "${msg4}"`);
  const reply4 = await aiAgent.processUserMessage(userIdMar, msg4, 'Rodrigo Camacho');
  console.log(`\n🤖 [RESPUESTA MEDIDAS]:\n${reply4}`);

  // Paso 5. Pregunta sobre papeles y agendar visita
  console.log('\n👉 [CLIENTE PREGUNTA POR PAPELES Y AGENDAR VISITA]:');
  const msg5 = '¿Tiene Folio Real al día? Me gustaría agendar una visita para ir a verlo el sábado a las 10:00 AM';
  console.log(`💬 "${msg5}"`);
  const reply5 = await aiAgent.processUserMessage(userIdMar, msg5, 'Rodrigo Camacho');
  console.log(`\n🤖 [RESPUESTA VISITA & PAPELES]:\n${reply5}`);

  // ===================================================================
  // CASO 2: PUBLICACIÓN FACEBOOK - TERRENO INDUSTRIAL G77
  // ===================================================================
  console.log('\n🏭 -------------------------------------------------------------');
  console.log('🏭 TEST 2: CLIENTE LLEGA DESDE ANUNCIO "TERRENO INDUSTRIAL G77"');
  console.log('🏭 -------------------------------------------------------------');

  const userIdG77 = '59176655443';

  // Paso 1. Saludo inicial desde enlace compartido de Facebook (Caso exacto de la captura)
  console.log('\n👉 [CLIENTE COMPARTE POST DE FACEBOOK O HACE CLIC EN EL BOTÓN]:');
  const msgG1 = '¡Hola! Quiero más información | Realty ONE Group Itaguazu 🏢 TERRENO INDUSTRIAL EN VENTA – SANTA CRUZ 📍 Parque Industrial (salida a Av. G77) 📐 7.000 m² 💰 Bs 16.800.000 fb.me';
  console.log(`💬 "${msgG1}"`);
  const replyG1 = await aiAgent.processUserMessage(userIdG77, msgG1, 'Ing. Carlos Aguilera');
  console.log(`\n🤖 [RESPUESTA INICIAL G77]:\n${replyG1}`);

  // Paso 2. Frase exacta enviada por el usuario en WhatsApp
  console.log('\n👉 [CLIENTE RESPONDE CON: "sobre el terreno"]');
  const msgG2 = 'sobre el terreno';
  console.log(`💬 "${msgG2}"`);
  const replyG2 = await aiAgent.processUserMessage(userIdG77, msgG2, 'Ing. Carlos Aguilera');
  console.log(`\n🤖 [RESPUESTA SOBRE EL TERRENO]:\n${replyG2}`);

  // Paso 3. Pregunta por energía trifásica y uso de suelo
  console.log('\n👉 [CLIENTE PREGUNTA POR TRIFÁSICA Y GALPONES]:');
  const msgG3 = '¿Tiene energía trifásica y uso de suelo apto para galpón de distribución?';
  console.log(`💬 "${msgG3}"`);
  const replyG3 = await aiAgent.processUserMessage(userIdG77, msgG3, 'Ing. Carlos Aguilera');
  console.log(`\n🤖 [RESPUESTA TRIFÁSICA & SUELO]:\n${replyG3}`);

  // ===================================================================
  // VERIFICACIÓN DE LEADS EN EL CRM
  // ===================================================================
  console.log('\n📊 -------------------------------------------------------------');
  console.log('📊 TEST 3: REGISTRO DE LEADS EN EL CRM CON ASIGNACIÓN DE ASESOR');
  console.log('📊 -------------------------------------------------------------');

  const leads = leadClassifier.getLeads();
  console.log(`Total de leads registrados en CRM: ${leads.length}`);
  const recentLeads = leads.slice(-2);
  recentLeads.forEach(l => {
    console.log(`✅ Lead: ${l.cliente_nombre || 'Cliente'} (${l.numero_celular})`);
    console.log(`   🏷️ Campaña: ${l.campana_origen || 'General'}`);
    console.log(`   🔥 Scoring: ${l.calificacion_lead} (${l.score_interes}/100)`);
    console.log(`   👤 Asesor Asignado: ${l.e_realtor_asignado} (${l.e_realtor_telefono})`);
    console.log(`   📝 Interés: ${l.tipo_operacion_detectada || 'Interés general'}`);
    console.log('---------------------------------------------------------');
  });

  console.log('\n🎉 ================================================================');
  console.log('🎉 TODAS LAS PRUEBAS DE PUBLICACIONES FACEBOOK COMPLETADAS CON ÉXITO');
  console.log('🎉 ================================================================\n');
}

runCampaignTests().catch(console.error);
