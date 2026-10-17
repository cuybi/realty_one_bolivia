const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\etechadmin\\.gemini\\antigravity-ide\\brain\\fea89e8d-eed8-4640-b4be-b2a07760e3fd\\mar_adentro_real_1788202039370.jpg';
const dest = path.join(__dirname, '..', 'assets', 'images', 'mar_adentro.jpg');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('✅ Foto real de Mar Adentro copiada con éxito a:', dest);
} else {
  console.error('❌ Archivo de origen no encontrado:', src);
}
