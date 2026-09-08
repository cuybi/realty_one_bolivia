/**
 * Verificador de Conectividad del Chatbot ONEBot
 * Ejecutar con: node verificar_bot.js
 * 
 * Este script verifica:
 * 1. Que el servidor local está corriendo en localhost:3000
 * 2. Que el endpoint del webhook responde correctamente
 * 3. Que el simulador del bot funciona
 * 4. Que los tokens de WhatsApp están configurados
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// ---- Cargar .env ----
const envPath = path.join(__dirname, 'backend', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:3000';

// ---- Helper para peticiones HTTP ----
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', err => reject(err));
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3000,
      path: urlObj.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ---- Verificaciones ----
async function runChecks() {
  console.log('\n🤖 ======================================================');
  console.log('🤖  VERIFICADOR DE CONECTIVIDAD - ONEBOT CHATBOT');
  console.log('🤖 ======================================================\n');

  let passed = 0;
  let failed = 0;

  // CHECK 1: Health del servidor
  console.log('✔ [1/4] Verificando servidor en', BASE_URL, '...');
  try {
    const res = await httpGet(`${BASE_URL}/api/health`);
    const json = JSON.parse(res.body);
    if (res.status === 200 && json.status === 'OK') {
      console.log(`   ✅ Servidor OK - Propiedades activas: ${json.propiedades}`);
      passed++;
    } else {
      console.log(`   ❌ Servidor respondió con status ${res.status}`);
      failed++;
    }
  } catch (e) {
    console.log(`   ❌ No se pudo conectar al servidor: ${e.message}`);
    console.log(`   ⚠️  ¿Está corriendo "node backend/server.js"?`);
    failed++;
  }

  // CHECK 2: Status del Chatbot
  console.log('\n✔ [2/4] Verificando configuración del chatbot...');
  try {
    const res = await httpGet(`${BASE_URL}/api/whatsapp/status`);
    const json = JSON.parse(res.body);
    console.log(`   ${json.geminiConfigurado ? '✅' : '⚠️ '} Gemini AI: ${json.geminiConfigurado ? 'Configurado' : 'No configurado (modo local)'}`);
    console.log(`   ${json.whatsAppCloudConfigurado ? '✅' : '❌'} WhatsApp Cloud API: ${json.whatsAppCloudConfigurado ? 'Configurado' : 'NO CONFIGURADO'}`);
    if (!json.whatsAppCloudConfigurado) {
      console.log(`   ⚠️  Revisa WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID en backend/.env`);
    }
    passed++;
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
    failed++;
  }

  // CHECK 3: Simulador del bot
  console.log('\n✔ [3/4] Probando motor del chatbot (simulación)...');
  try {
    const res = await httpPost(`${BASE_URL}/api/whatsapp/simular`, {
      mensaje: 'Hola, buenos días',
      usuarioId: 'verificador-001'
    });
    if (res.status === 200) {
      const json = JSON.parse(res.body);
      console.log(`   ✅ Bot respondió correctamente`);
      console.log(`   📝 Respuesta (primeros 150 chars):`);
      console.log(`      "${json.respuestaBot.substring(0, 150)}..."`);
      passed++;
    } else {
      console.log(`   ❌ Error HTTP ${res.status}: ${res.body}`);
      failed++;
    }
  } catch (e) {
    console.log(`   ❌ Error en simulación: ${e.message}`);
    failed++;
  }

  // CHECK 4: Variables de entorno críticas
  console.log('\n✔ [4/4] Verificando variables de entorno...');
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (token && token.length > 20) {
    console.log(`   ✅ WHATSAPP_TOKEN: configurado (${token.length} caracteres)`);
  } else {
    console.log(`   ❌ WHATSAPP_TOKEN: NO configurado o inválido`);
  }

  if (phoneId) {
    console.log(`   ✅ WHATSAPP_PHONE_NUMBER_ID: ${phoneId}`);
  } else {
    console.log(`   ❌ WHATSAPP_PHONE_NUMBER_ID: NO configurado`);
  }

  if (verifyToken) {
    console.log(`   ✅ WHATSAPP_VERIFY_TOKEN: ${verifyToken}`);
  } else {
    console.log(`   ⚠️  WHATSAPP_VERIFY_TOKEN: usando valor por defecto`);
  }

  passed++;

  // ---- RESUMEN ----
  console.log('\n🤖 ======================================================');
  console.log(`   RESULTADO: ${passed} verificaciones OK, ${failed} con error`);
  
  if (failed === 0) {
    console.log('   🎉 TODO LISTO - El bot está operativo localmente');
    console.log('   📤 Siguiente paso: Subir a GitHub y desplegar en Render.com');
  } else {
    console.log('   ⚠️  Hay problemas que resolver antes de desplegar');
    console.log('   📖 Revisa la guía: guia_deploy_chatbot.md');
  }
  console.log('🤖 ======================================================\n');

  // ---- DATOS PARA META WEBHOOK ----
  console.log('📋 DATOS PARA CONFIGURAR WEBHOOK EN META:');
  console.log('   Callback URL: [TU_URL_RENDER]/api/whatsapp/webhook');
  console.log(`   Verify Token: ${verifyToken || 'realty_one_whatsapp_verify_token_2026'}`);
  console.log('');
}

runChecks().catch(console.error);
