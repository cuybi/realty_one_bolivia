const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, 'backend', 'services', 'aiAgent.js'),
  path.join(__dirname, 'services', 'aiAgent.js')
];

for (const file of targetFiles) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');

  // 1. Ampliar isCourtesyExit
  const oldCourtesy = `function isCourtesyExit(text) {
  const lo = (text || '').toLowerCase().replace(/[\/\\\\.,!?;:'"()\\-]/g, '').trim();
  if (/\\b(gracias|muchas gracias|muchísimas gracias|muchisimas gracias|chau|adios|adiós|hasta luego|que tenga|que pases|saludos)\\b/i.test(lo)) {
    return true;
  }
  const exitWords = new Set(['gracias', 'chau', 'adios', 'adiós', 'listo', 'ok', 'vale', 'dale', 'bueno', 'ya']);
  const words = lo.split(/\\s+/).filter(Boolean);
  return words.length > 0 && words.every(w => exitWords.has(w));
}`;

  const newCourtesy = `function isCourtesyExit(text) {
  const lo = (text || '').toLowerCase().replace(/[\/\\\\.,!?;:'"()\\-]/g, '').trim();
  if (/\\b(gracias|muchas gracias|muchísimas gracias|muchisimas gracias|chau|adios|adiós|hasta luego|que tenga|que pases|saludos|buenas noches|hasta ma[nñ]ana|que descanses|buen descanso|igualmente|a ustedes|a ti)\\b/i.test(lo)) {
    return true;
  }
  const exitWords = new Set(['gracias', 'chau', 'adios', 'adiós', 'listo', 'ok', 'vale', 'dale', 'bueno', 'ya', 'igualmente', 'noches', 'descansa', 'descansen']);
  const words = lo.split(/\\s+/).filter(Boolean);
  return words.length > 0 && words.every(w => exitWords.has(w));
}`;

  // 2. Ampliar isFarewellOnly
  const oldFarewell = `function isFarewellOnly(text) {
  const lo = (text || '').toLowerCase().replace(/[\/\\\\.,!?;:'"()\\-]/g, '').trim();
  return /\\b(gracias|chau|adios|adiós|hasta luego|hasta pronto|hasta la proxima|hasta la próxima|nos vemos|que tenga|que tengas|que pases|saludos|bendiciones|cuídate|cuidate)\\b/i.test(lo);
}`;

  const newFarewell = `function isFarewellOnly(text) {
  const lo = (text || '').toLowerCase().replace(/[\/\\\\.,!?;:'"()\\-]/g, '').trim();
  return /\\b(gracias|chau|adios|adiós|hasta luego|hasta pronto|hasta la proxima|hasta la próxima|nos vemos|que tenga|que tengas|que pases|saludos|bendiciones|cuídate|cuidate|buenas noches|hasta ma[nñ]ana|que descanses|buen descanso|igualmente|a ustedes|a ti)\\b/i.test(lo);
}`;

  // 3. Lógica de recuperación de estados y silencio tras despedida
  const oldBlockRegex = /\/\/ 3\. RECUPERACIÓN DE ESTADOS PREVIOS:[\s\S]*?let s = getSession\(userId, pushName\);[\s\S]*?\/\/ 4\. Si la conversación previa ya había concluido[\s\S]*?return null;\s*\}\s*\}\s*\}/;

  const newBlock = `  const isFarewell = isFarewellOnly(raw) || isCourtesyExit(raw) || /\\b(buenas noches|hasta ma[nñ]ana|que descanses|buen descanso|igualmente)\\b/i.test(lo);

  // Un saludo inicial solo se considera tal si NO es una frase de despedida o cortesía nocturna
  const isNewGreeting = !isFarewell && (
    lo.startsWith('hola') || lo.startsWith('¡hola') ||
    lo.startsWith('buen dia') || lo.startsWith('buenos dias') || lo.startsWith('buen día') ||
    lo.startsWith('buenas tardes') ||
    lo === 'buenas' || lo === 'hola' || lo === 'buen día' || lo === 'buenos días'
  );

  // 3. Si la sesión anterior ya estaba concluida (despedida / cerrada):
  const prevSession = sessions.get(userId);
  if (prevSession && (prevSession.state === 'ESTADO_FAREWELL' || prevSession.isClosed)) {
    // Si hace clic en un anuncio o hace una consulta inmobiliaria explícita, reabrimos:
    if (isRealAd || isInquiry) {
      sessions.delete(userId);
      userFlowSessions.delete(userId);
      conversationSessions.delete(userId);
    } else {
      // Verificamos si envió datos rezagados (teléfono, correo o fecha)
      const latePhone = extractPhone(raw);
      const lateEmail = extractEmail(raw);
      const lateDate  = hasValidDate(raw);
      if (latePhone || lateEmail || lateDate) {
        prevSession.state = 'ESTADO_3_DATA';
        prevSession.isClosed = false;
        // Permite procesar datos
      } else {
        // Ante cualquier despedida o cortesía ("buenas noches", "gracias", "igualmente", emojis)
        // tras concluir la charla: EL ASISTENTE QUEDA EN RIGUROSO SILENCIO.
        prevSession.lastActivity = Date.now();
        return null;
      }
    }
  }

  // 4. RECUPERACIÓN DE ESTADOS PREVIOS (Para sesiones activas en curso):
  // Si entra un nuevo saludo ("Hola", "Buen día") o pasaron más de 30 minutos de inactividad,
  // reiniciamos sesión para no quedar atrapado en estados viejos:
  if (prevSession && !prevSession.isClosed && prevSession.state !== 'ESTADO_FAREWELL') {
    const isStale = (Date.now() - (prevSession.lastActivity || 0)) > 30 * 60 * 1000;
    if (isRealAd || isNewGreeting || isStale) {
      sessions.delete(userId);
      userFlowSessions.delete(userId);
      conversationSessions.delete(userId);
    }
  }

  let s = getSession(userId, pushName);`;

  // Normalizar saltos de línea para búsqueda
  const crlf = code.includes('\r\n');
  const normCode = code.replace(/\r\n/g, '\n');

  let updated = normCode
    .replace(oldCourtesy.replace(/\r\n/g, '\n'), newCourtesy.replace(/\r\n/g, '\n'))
    .replace(oldFarewell.replace(/\r\n/g, '\n'), newFarewell.replace(/\r\n/g, '\n'))
    .replace(oldBlockRegex, newBlock);

  if (crlf) {
    updated = updated.replace(/\n/g, '\r\n');
  }

  fs.writeFileSync(file, updated, 'utf8');
  console.log('✅ Archivo actualizado:', file);
}
