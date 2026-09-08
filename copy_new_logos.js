const fs = require('fs');
const path = require('path');

const srcLogo = 'C:\\Users\\etechadmin\\.gemini\\antigravity-ide\\brain\\dabda31b-53be-4bc0-a548-b8b680aca062\\.user_uploaded\\media_1788373787602.png';
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

if (fs.existsSync(srcLogo)) {
  fs.copyFileSync(srcLogo, path.join(assetsDir, 'logo_one_circle.png'));
  fs.copyFileSync(srcLogo, path.join(assetsDir, 'favicon.png'));
  fs.copyFileSync(srcLogo, path.join(__dirname, 'logo_one_circle.png'));
  console.log('✅ Logo ONE circular copiado exitosamente a assets/ y raíz');
} else {
  console.error('❌ Archivo de logo no encontrado en:', srcLogo);
}
