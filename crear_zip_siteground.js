/**
 * Empaquetador Total para SiteGround
 * Realty ONE Group Bolivia
 * Empaqueta ABSOLUTAMENTE TODO el contenido de la carpeta 'realty_one_bolivia'
 * incluyendo 'backend/', 'assets/', '.agents/', HTMLs, PHP, CSS y JSONs.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = __dirname;
const OUTPUT_ZIP = path.join(ROOT_DIR, 'siteground_deploy.zip');

// Carpetas o archivos a omitir (solo node_modules pesados y .git)
const EXCLUDE = [
  '.git',
  'node_modules',
  'siteground_deploy.zip',
  '.DS_Store',
  'thumbs.db'
];

console.log('\n🦁 ========================================================');
console.log('🦁  EMPAQUETANDO PROYECTO COMPLETO PARA SITEGROUND');
console.log('🦁 ========================================================\n');

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
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (EXCLUDE.includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      fileList = fileList.concat(collectAllFiles(fullPath, relPath));
    } else {
      fileList.push({ relativePath: relPath, fullPath });
    }
  }
  return fileList;
}

function createZip(files, outputPath) {
  const localHeaders = [];
  const centralDirHeaders = [];
  let offset = 0;

  const folderCounts = {};

  for (const file of files) {
    const rootFolder = file.relativePath.includes('/') ? file.relativePath.split('/')[0] : 'Raíz (HTML/PHP/CSS)';
    folderCounts[rootFolder] = (folderCounts[rootFolder] || 0) + 1;

    const content = fs.readFileSync(file.fullPath);
    const uncompressedSize = content.length;
    const fileCrc = crc32(content);
    const compressed = zlib.deflateRawSync(content);
    const compressedSize = compressed.length;

    const nameBuffer = Buffer.from(file.relativePath.replace(/\\/g, '/'), 'utf8');
    const nameLength = nameBuffer.length;

    // Local file header
    const localHeader = Buffer.alloc(30 + nameLength);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(fileCrc, 14);
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameLength, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuffer.copy(localHeader, 30);

    localHeaders.push(localHeader, compressed);

    // Central directory header
    const cdHeader = Buffer.alloc(46 + nameLength);
    cdHeader.writeUInt32LE(0x02014b50, 0);
    cdHeader.writeUInt16LE(20, 4);
    cdHeader.writeUInt16LE(20, 6);
    cdHeader.writeUInt16LE(0, 8);
    cdHeader.writeUInt16LE(8, 10);
    cdHeader.writeUInt16LE(0, 12);
    cdHeader.writeUInt16LE(0, 14);
    cdHeader.writeUInt32LE(fileCrc, 16);
    cdHeader.writeUInt32LE(compressedSize, 20);
    cdHeader.writeUInt32LE(uncompressedSize, 24);
    cdHeader.writeUInt16LE(nameLength, 28);
    cdHeader.writeUInt16LE(0, 30);
    cdHeader.writeUInt16LE(0, 32);
    cdHeader.writeUInt16LE(0, 34);
    cdHeader.writeUInt16LE(0, 36);
    cdHeader.writeUInt32LE(0, 38);
    cdHeader.writeUInt32LE(offset, 42);
    nameBuffer.copy(cdHeader, 46);

    centralDirHeaders.push(cdHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const h of centralDirHeaders) {
    centralDirSize += h.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  const totalBuffers = [...localHeaders, ...centralDirHeaders, eocd];
  const finalZip = Buffer.concat(totalBuffers);
  fs.writeFileSync(outputPath, finalZip);

  console.log('📦 Contenido incluido en el ZIP:');
  for (const [folder, count] of Object.entries(folderCounts)) {
    console.log(`   📁 ${folder.padEnd(25)} : ${count} archivos`);
  }

  console.log('\n--------------------------------------------------------');
  console.log(`✅ Archivo ZIP generado: ${outputPath}`);
  console.log(`📊 Tamaño final: ${(finalZip.length / 1024 / 1024).toFixed(2)} MB (${(finalZip.length / 1024).toFixed(0)} KB)`);
  console.log(`📄 Total de archivos empaquetados: ${files.length}`);
  console.log('--------------------------------------------------------\n');
  console.log('🚀 LISTO: Sube y extrae este archivo en public_html en SiteGround.\n');
}

const files = collectAllFiles(ROOT_DIR);
createZip(files, OUTPUT_ZIP);
