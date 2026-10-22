/**
 * Test de la alerta de Telegram (paso 6: aviso al asesor).
 * Ejecutar: node backend/test_telegram_alert.js
 */

const assert = require('assert');
const { notifyNewLead, buildMessage } = require('../services/telegramAlert');

const LEAD = {
  cliente_nombre: 'Marcos Antezana',
  numero_celular: '+59160034649',
  email: 'marcos@mail.com',
  tipo_interes: 'Compra',
  zona_interes: 'Santa Cruz (General)',
  campana: 'Realty ONE Group Itaguazu',
  ultimo_mensaje: 'quiero un departamento',
  e_realtor_asignado: 'Ana Rojas',
};

async function runTests() {
  console.log('🔔 ========================================================');
  console.log('🔔  TEST SUITE: ALERTA DE TELEGRAM AL ASESOR');
  console.log('🔔 ========================================================\n');

  // 1. Sin configurar no hace nada (y no rompe el bot)
  const sinConfig = await notifyNewLead(LEAD, { env: {}, fetchImpl: async () => { throw new Error('no deberia llamarse'); } });
  assert.strictEqual(sinConfig.sent, false, 'sin token/chat id no debe enviar');
  assert.strictEqual(sinConfig.reason, 'sin-configuracion');
  console.log('  ✓ Sin configuracion: no envia y no falla');

  // 2. Con configuracion envia el texto correcto al chat correcto
  let enviado = null;
  const ok = await notifyNewLead(LEAD, {
    token: '123:ABC',
    chatId: '-100999',
    panelUrl: 'https://panel.example/ingreso_leads.html',
    fetchImpl: async (url, init) => {
      enviado = { url, body: JSON.parse(init.body) };
      return { ok: true, status: 200 };
    },
  });
  assert.strictEqual(ok.sent, true, 'debe enviar el aviso');
  assert.strictEqual(enviado.url, 'https://api.telegram.org/bot123:ABC/sendMessage');
  assert.strictEqual(enviado.body.chat_id, '-100999');
  assert.ok(enviado.body.text.includes('Marcos Antezana'), 'debe incluir el nombre');
  assert.ok(enviado.body.text.includes('+59160034649'), 'debe incluir el telefono');
  assert.ok(enviado.body.text.includes('marcos@mail.com'), 'debe incluir el correo');
  assert.ok(enviado.body.text.includes('Compra'), 'debe incluir el interes');
  assert.ok(enviado.body.text.includes('https://panel.example/ingreso_leads.html'), 'debe incluir el enlace al CRM');
  console.log('  ✓ Envia el aviso con los datos del lead y el enlace al CRM');

  // 3. Un error de Telegram no lanza (el bot no se cae)
  const fallo = await notifyNewLead(LEAD, {
    token: '123:ABC',
    chatId: '-100999',
    fetchImpl: async () => { throw new Error('sin red'); },
  });
  assert.strictEqual(fallo.sent, false, 'un fallo de red no debe enviar');
  console.log('  ✓ Error de red: se registra y el bot sigue');

  // 4. Un HTTP de error tampoco lanza
  const httpError = await notifyNewLead(LEAD, {
    token: '123:ABC',
    chatId: '-100999',
    fetchImpl: async () => ({ ok: false, status: 401 }),
  });
  assert.strictEqual(httpError.sent, false, 'HTTP 401 no debe marcar enviado');
  assert.strictEqual(httpError.status, 401);
  console.log('  ✓ HTTP de error (token invalido): sin aviso, sin excepcion');

  // 5. El mensaje no rompe con datos vacios
  const texto = buildMessage({ cliente_nombre: null, email: 'Pendiente' }, 'https://panel');
  assert.ok(texto.includes('—'), 'los campos vacios se muestran con guion');
  console.log('  ✓ Mensaje tolerante a datos incompletos');

  console.log('\n🎉 ========================================================');
  console.log('🎉  TODOS LOS CASOS DE PRUEBA PASARON AL 100%');
  console.log('🎉 ========================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Error en tests:', err);
  process.exit(1);
});
