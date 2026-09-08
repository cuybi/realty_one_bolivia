const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\etechadmin\\.gemini\\antigravity-ide\\brain\\8fb7b441-18f8-47b2-a887-fb39e697fc64\\.user_uploaded\\media_1787946407253.png';

const destinations = [
  path.join(__dirname, 'assets', 'logo_one_circle.png'),
  path.join(__dirname, 'assets', 'favicon.png'),
  path.join(__dirname, 'assets', 'favicon.ico'),
  path.join(__dirname, 'favicon.ico'),
  path.join(__dirname, 'favicon.png')
];

for (const dest of destinations) {
  fs.copyFileSync(src, dest);
  console.log(`Copied to ${dest}`);
}
