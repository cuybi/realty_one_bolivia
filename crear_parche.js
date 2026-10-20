const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = __dirname;
const OUTPUT_ZIP = path.join(ROOT_DIR, 'parche_rapido_siteground.zip');

const FILES = [
  'server.js',
  'keepalive.sh',
  'instalar.php',
  'extraer.php',
  'qr_bridge.php',
  'qr_connect.html',
  '.htaccess',
  'backend/services/aiAgent.js',
  'services/aiAgent.js',
  'backend/services/leadClassifier.js',
  'services/leadClassifier.js'
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

const localHeaders = [];
const centralDirHeaders = [];
let offset = 0;

for (const f of FILES) {
  const fullPath = path.join(ROOT_DIR, f);
  if (!fs.existsSync(fullPath)) continue;

  const content = fs.readFileSync(fullPath);
  const uncompressedSize = content.length;
  const fileCrc = crc32(content);
  const compressed = zlib.deflateRawSync(content);
  const compressedSize = compressed.length;

  const nameBuffer = Buffer.from(f, 'utf8');
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
  const centralHeader = Buffer.alloc(46 + nameLength);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(8, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0, 14);
  centralHeader.writeUInt32LE(fileCrc, 16);
  centralHeader.writeUInt32LE(compressedSize, 20);
  centralHeader.writeUInt32LE(uncompressedSize, 24);
  centralHeader.writeUInt16LE(nameLength, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt16LE(0, 36);
  centralHeader.writeUInt32LE(0, 38);
  centralHeader.writeUInt32LE(offset, 42);
  nameBuffer.copy(centralHeader, 46);

  centralDirHeaders.push(centralHeader);
  offset += localHeader.length + compressed.length;
}

const centralDirOffset = offset;
let centralDirSize = 0;
for (const c of centralDirHeaders) {
  centralDirSize += c.length;
}

// End of central directory record
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(FILES.length, 8);
eocd.writeUInt16LE(FILES.length, 10);
eocd.writeUInt32LE(centralDirSize, 12);
eocd.writeUInt32LE(centralDirOffset, 16);
eocd.writeUInt16LE(0, 20);

const finalBuffer = Buffer.concat([...localHeaders, ...centralDirHeaders, eocd]);
fs.writeFileSync(OUTPUT_ZIP, finalBuffer);

console.log('✅ Parche ultraligero creado:', OUTPUT_ZIP);
console.log('📊 Tamaño:', (finalBuffer.length / 1024).toFixed(2), 'KB');
