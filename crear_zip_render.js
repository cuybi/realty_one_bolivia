/**
 * Empaquetador para Render.com - Realty ONE Group Bolivia
 * Crea render_deploy.zip con todo lo necesario para el bot en la nube.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const OUTPUT_ZIP = path.join(ROOT_DIR, 'render_deploy.zip');

const EXCLUDE = [
  '.git', 'node_modules', 'baileys_auth', '.env',
  'siteground_deploy.zip', 'render_deploy.zip',
  '.DS_Store', 'thumbs.db', '.agents', 'one_leads'
];

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xEDB88320);
    }
  }
  return (~crc) >>> 0;
}

function collectAllFiles(dir, prefix = '') {
  let fileList = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (EXCLUDE.includes(item)) continue;
    const fullPath = path.join(dir, item);
    const relPath = prefix ? `${prefix}/${item}` : item;
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      fileList = fileList.concat(collectAllFiles(fullPath, relPath));
    } else {
      fileList.push({ fullPath, relPath, size: stats.size });
    }
  }
  return fileList;
}

function buildZip(files) {
  const centralDir = [];
  const localParts = [];
  let offset = 0;

  for (const file of files) {
    const content = fs.readFileSync(file.fullPath);
    const nameBuffer = Buffer.from(file.relPath, 'utf8');
    const crc = crc32(content);

    // Local file header
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);

    const localEntry = Buffer.concat([local, nameBuffer, content]);
    localParts.push(localEntry);

    // Central directory entry
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(content.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt32LE(offset, 42);

    centralDir.push(Buffer.concat([central, nameBuffer]));
    offset += localEntry.length;
  }

  const centralDirBuffer = Buffer.concat(centralDir);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...localParts, centralDirBuffer, eocd]);
}

console.log('\n🦁 Empaquetando proyecto para RENDER...\n');
const files = collectAllFiles(ROOT_DIR);
console.log(`📦 ${files.length} archivos encontrados`);

const zipBuffer = buildZip(files);
fs.writeFileSync(OUTPUT_ZIP, zipBuffer);
const sizeMB = (zipBuffer.length / 1024 / 1024).toFixed(2);
console.log(`\n✅ ZIP creado: render_deploy.zip (${sizeMB} MB)`);
console.log(`📁 Ubicación: ${OUTPUT_ZIP}`);
console.log('\n👉 Sube este ZIP a Render Dashboard > Manual Deploy > Upload\n');
