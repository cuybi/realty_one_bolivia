const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = __dirname;
const OUTPUT_ZIP = path.join(ROOT_DIR, 'siteground_clean.zip');

const ROOT_FILES = [
  'index.html',
  'ingreso_leads.html',
  'registro.html',
  'crm_leads.html',
  'buscar.html',
  'mapa.html',
  'venta.html',
  'alquiler.html',
  'anticretico.html',
  'terrenos.html',
  'propiedad.html',
  'publicidades.html',
  'qr_connect.html',
  'styles.css',
  'script.js',
  '.htaccess',
  'webhook.php',
  'save_leads_sync.php',
  'delete_lead.php',
  'export_leads.php',
  'activar.php',
  'diagnostico.php',
  'reset_leads.php',
  'reset_session.php',
  'save_cms.php',
  'ping_render.php',
  'leads.json',
  'campaigns.json',
  'meta_config.json',
  'realty_one_data.json'
];

const DIRS_TO_INCLUDE = ['assets', 'one_leads'];

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

function collectDir(dir, prefix = '') {
  let fileList = [];
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.endsWith('.tmp')) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      fileList = fileList.concat(collectDir(fullPath, relPath));
    } else {
      fileList.push({ relativePath: relPath, fullPath });
    }
  }
  return fileList;
}

function buildCleanZip() {
  const allFiles = [];

  // Root files
  for (const f of ROOT_FILES) {
    const fullPath = path.join(ROOT_DIR, f);
    if (fs.existsSync(fullPath)) {
      allFiles.push({ relativePath: f, fullPath });
    } else {
      console.warn(`[WARN] Archivo no encontrado: ${f}`);
    }
  }

  // Directories
  for (const d of DIRS_TO_INCLUDE) {
    const fullDirPath = path.join(ROOT_DIR, d);
    allFiles.push(...collectDir(fullDirPath, d));
  }

  console.log(`Total archivos a empaquetar: ${allFiles.length}`);

  const localHeaders = [];
  const centralDirHeaders = [];
  let offset = 0;

  for (const file of allFiles) {
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
  eocd.writeUInt16LE(allFiles.length, 8);
  eocd.writeUInt16LE(allFiles.length, 10);
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20);

  const totalBuffers = [...localHeaders, ...centralDirHeaders, eocd];
  const finalZip = Buffer.concat(totalBuffers);
  fs.writeFileSync(OUTPUT_ZIP, finalZip);

  console.log(`OK: siteground_clean.zip creado (${(finalZip.length / 1024 / 1024).toFixed(2)} MB)`);
}

buildCleanZip();
