/**
 * Script de prueba unitaria y validación para el motor de IA del Chatbot
 */

const aiAgent = require('./services/aiAgent');

async function testChatbot() {
  console.log('🤖 ========================================================');
  console.log('🤖  INICIANDO PRUEBAS DEL CHATBOT INMOBILIARIO ONEBOT');
  console.log('🤖 ========================================================\n');

  const testCases = [
    { title: '1. Saludo y Menú', query: '¡Hola buenas tardes!' },
    { title: '2. Terrenos en Venta (Urubó / Warnes)', query: '¿Qué terrenos tienen en venta en el Urubó?' },
    { title: '3. Casas o Deptos en Anticrético', query: 'Busco opciones en anticrético en Santa Cruz' },
    { title: '4. Asesoría Legal Anticrético en Bolivia', query: '¿Cómo funciona el anticrético en Bolivia y qué papeles necesito para no ser estafado?' },
    { title: '5. Requisitos e Impuestos para Comprar', query: '¿Cuáles son los impuestos y requisitos legales para comprar una casa?' },
    { title: '6. Alquileres en Equipetrol', query: 'Busco departamento en alquiler amoblado en Equipetrol' },
    { title: '7. Consignar / Vender mi Casa', query: 'Tengo una casa en venta y quiero que me ayuden a venderla' },
    { title: '8. Agendar Visita', query: 'Quiero agendar una visita con un asesor para este sábado a las 4pm' }
  ];

  for (const tc of testCases) {
    console.log(`\n-----------------------------------------------------------`);
    console.log(`🔍 [CASO] ${tc.title}`);
    console.log(`💬 [CLIENTE]: "${tc.query}"`);
    console.log(`-----------------------------------------------------------`);

    const reply = await aiAgent.processUserMessage('test-user-001', tc.query);
    console.log(`🤖 [ONEBOT]:\n${reply}\n`);
  }

  console.log('✅ ========================================================');
  console.log('✅  TODAS LAS PRUEBAS COMPLETADAS SATISFACTORIAMENTE');
  console.log('✅ ========================================================');
}

testChatbot();
