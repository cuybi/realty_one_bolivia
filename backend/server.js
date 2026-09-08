// Configurar zona horaria oficial de Bolivia (America/La_Paz, UTC-4)
process.env.TZ = 'America/La_Paz';

const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');

// Cargar variables de entorno desde .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [k, ...v] = trimmed.split('=');
      if (k && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  });
}

const db = require('./database');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Sincronización de logos corporativos de alta definición
function syncBrandLogos() {
  try {
    const uploadedDir = path.join(process.env.USERPROFILE || 'C:\\Users\\etechadmin', '.gemini', 'antigravity-ide', 'brain', '5a66f826-cde6-4725-93a8-9fc6f34c9438', '.user_uploaded');
    const assetsDir = path.join(__dirname, '..', 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    const logoMaps = [
      { src: 'media_1787946407253.png', dest: 'logo_one_circle.png' },
      { src: 'media_1787946407253.png', dest: 'favicon.png' },
      { src: 'media_1787756699919.png', dest: 'logo_realty_one_full.png' },
      { src: 'media_1787756699989.png', dest: 'logo_realty_one_white.png' },
      { src: 'media_1787756699919.png', dest: 'logo_bolivia.png' }
    ];

    logoMaps.forEach(m => {
      const srcP = path.join(uploadedDir, m.src);
      const destP = path.join(assetsDir, m.dest);
      if (fs.existsSync(srcP)) {
        fs.copyFileSync(srcP, destP);
      }
    });

    // Sincronizar foto real de Condominio Mar Adentro
    const marSrc = 'C:\\Users\\etechadmin\\.gemini\\antigravity-ide\\brain\\fea89e8d-eed8-4640-b4be-b2a07760e3fd\\mar_adentro_real_1788202039370.jpg';
    const marDest = path.join(__dirname, '..', 'assets', 'images', 'mar_adentro.jpg');
    if (fs.existsSync(marSrc)) {
      fs.copyFileSync(marSrc, marDest);
    }
  } catch (e) {
    console.warn('Logo sync notice:', e.message);
  }
}
syncBrandLogos();

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logo circular y Favicon oficial Realty ONE Group incrustado en memoria (cero 404s en Render/Cloud)
const OFFICIAL_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><circle cx="500" cy="500" r="500" fill="#CAA65E"/><g fill="#000000"><path fill-rule="evenodd" d="M 254 362 A 138 138 0 1 0 254 638 A 138 138 0 1 0 254 362 Z M 254 420 A 80 80 0 1 1 254 580 A 80 80 0 1 1 254 420 Z"/><rect x="432" y="362" width="58" height="276"/><polygon points="432,362 490,362 650,638 592,638"/><rect x="592" y="362" width="58" height="276"/><rect x="708" y="362" width="58" height="276"/><rect x="766" y="362" width="110" height="58"/><rect x="766" y="471" width="84" height="58"/><rect x="766" y="580" width="110" height="58"/></g><polygon points="585,440 658,367 658,396 585,469" fill="#CAA65E"/></svg>`;

app.get(['/favicon.ico', '/favicon.png', '/assets/favicon.png'], (req, res) => {
  res.type('image/svg+xml').send(OFFICIAL_LOGO_SVG);
});
app.get(['/logo_one_circle.png', '/assets/logo_one_circle.png', '/assets/logo_circle.svg'], (req, res) => {
  res.type('image/svg+xml').send(OFFICIAL_LOGO_SVG);
});

// Sirve los archivos estáticos del frontend (la carpeta raíz del proyecto)
app.use(express.static(path.join(__dirname, '..')));

// ==========================================
// AUTENTICACIÓN SIMPLE (header: x-admin-key)
// ==========================================
const ADMIN_KEY = process.env.ADMIN_KEY || 'ONE2026';

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// ==========================================
// HELPERS
// ==========================================
function parseJSON(str, fallback = []) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function propToObj(p) {
  return { ...p, imagenes: parseJSON(p.imagenes, []) };
}

function proyToObj(p) {
  return { ...p, amenities: parseJSON(p.amenities, []) };
}

// ==========================================
// RUTAS - SLIDES
// ==========================================
app.get('/api/slides', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY orden ASC').all();
  res.json(slides);
});

app.post('/api/slides', requireAdmin, (req, res) => {
  const { url, orden = 0 } = req.body;
  const result = db.prepare('INSERT INTO slides (url, orden) VALUES (?, ?)').run(url, orden);
  res.json({ id: result.lastInsertRowid, url, orden });
});

app.put('/api/slides/:id', requireAdmin, (req, res) => {
  const { url, orden } = req.body;
  db.prepare('UPDATE slides SET url=?, orden=? WHERE id=?').run(url, orden, req.params.id);
  res.json({ success: true });
});

app.delete('/api/slides/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM slides WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - CATEGORIAS
// ==========================================
app.get('/api/categorias', (req, res) => {
  const cats = db.prepare('SELECT * FROM categorias ORDER BY orden ASC').all();
  res.json(cats);
});

app.put('/api/categorias/:id', requireAdmin, (req, res) => {
  const { titulo, descripcion, imagen } = req.body;
  db.prepare('UPDATE categorias SET titulo=?, descripcion=?, imagen=? WHERE id=?')
    .run(titulo, descripcion, imagen, req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - PROPIEDADES
// ==========================================
app.get('/api/propiedades', (req, res) => {
  let query = 'SELECT * FROM propiedades WHERE activo=1';
  const params = [];
  const { operacion, ubicacion, habitaciones, banos, destacado, search, order } = req.query;

  if (operacion) {
    query += ' AND LOWER(tipo) LIKE ?';
    params.push(`%${operacion.toLowerCase()}%`);
  }
  if (ubicacion) {
    query += ' AND LOWER(ubicacion) LIKE ?';
    params.push(`%${ubicacion.toLowerCase()}%`);
  }
  if (habitaciones && parseInt(habitaciones) > 0) {
    query += ' AND habitaciones >= ?';
    params.push(parseInt(habitaciones));
  }
  if (banos && parseInt(banos) > 0) {
    query += ' AND banos >= ?';
    params.push(parseInt(banos));
  }
  if (destacado === '1') {
    query += ' AND destacado=1';
  }
  if (search) {
    query += ' AND (LOWER(titulo) LIKE ? OR LOWER(ubicacion) LIKE ? OR LOWER(descripcion_larga) LIKE ?)';
    const s = `%${search.toLowerCase()}%`;
    params.push(s, s, s);
  }

  // Ordenamiento
  if (order === 'precio-asc') query += ' ORDER BY CAST(REPLACE(REPLACE(precio,"$",""),".","")*1 AS INTEGER) ASC';
  else if (order === 'precio-desc') query += ' ORDER BY CAST(REPLACE(REPLACE(precio,"$",""),".","")*1 AS INTEGER) DESC';
  else query += ' ORDER BY creado_en DESC';

  const propiedades = db.prepare(query).all(...params).map(propToObj);
  res.json(propiedades);
});

app.get('/api/propiedades/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM propiedades WHERE id=? AND activo=1').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Propiedad no encontrada' });
  res.json(propToObj(p));
});

app.post('/api/propiedades', requireAdmin, (req, res) => {
  const { titulo, precio, tipo, ubicacion, habitaciones = 0, banos = 0, area, descripcion_larga, imagenes = [], destacado = 0 } = req.body;
  const result = db.prepare(`
    INSERT INTO propiedades (titulo, precio, tipo, ubicacion, habitaciones, banos, area, descripcion_larga, imagenes, destacado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(titulo, precio, tipo, ubicacion, habitaciones, banos, area, descripcion_larga, JSON.stringify(imagenes), destacado ? 1 : 0);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/propiedades/:id', requireAdmin, (req, res) => {
  const { titulo, precio, tipo, ubicacion, habitaciones, banos, area, descripcion_larga, imagenes, destacado } = req.body;
  db.prepare(`
    UPDATE propiedades SET titulo=?, precio=?, tipo=?, ubicacion=?, habitaciones=?, banos=?, area=?, descripcion_larga=?, imagenes=?, destacado=?
    WHERE id=?
  `).run(titulo, precio, tipo, ubicacion, habitaciones, banos, area, descripcion_larga, JSON.stringify(imagenes), destacado ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.delete('/api/propiedades/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE propiedades SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - PROYECTOS
// ==========================================
app.get('/api/proyectos', (req, res) => {
  const proyectos = db.prepare('SELECT * FROM proyectos WHERE activo=1 ORDER BY creado_en DESC').all().map(proyToObj);
  res.json(proyectos);
});

app.post('/api/proyectos', requireAdmin, (req, res) => {
  const { titulo, tag, descripcion, imagen, precio, link, amenities = [] } = req.body;
  const result = db.prepare(`
    INSERT INTO proyectos (titulo, tag, descripcion, imagen, precio, link, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(titulo, tag, descripcion, imagen, precio, link, JSON.stringify(amenities));
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/proyectos/:id', requireAdmin, (req, res) => {
  const { titulo, tag, descripcion, imagen, precio, link, amenities } = req.body;
  db.prepare('UPDATE proyectos SET titulo=?, tag=?, descripcion=?, imagen=?, precio=?, link=?, amenities=? WHERE id=?')
    .run(titulo, tag, descripcion, imagen, precio, link, JSON.stringify(amenities), req.params.id);
  res.json({ success: true });
});

app.delete('/api/proyectos/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE proyectos SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - NOTICIAS
// ==========================================
app.get('/api/noticias', (req, res) => {
  const noticias = db.prepare('SELECT * FROM noticias WHERE activo=1 ORDER BY creado_en DESC').all();
  res.json(noticias);
});

app.post('/api/noticias', requireAdmin, (req, res) => {
  const { titulo, categoria, fecha, imagen, descripcion, contenido } = req.body;
  const result = db.prepare('INSERT INTO noticias (titulo, categoria, fecha, imagen, descripcion, contenido) VALUES (?, ?, ?, ?, ?, ?)')
    .run(titulo, categoria, fecha, imagen, descripcion, contenido);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/noticias/:id', requireAdmin, (req, res) => {
  const { titulo, categoria, fecha, imagen, descripcion, contenido } = req.body;
  db.prepare('UPDATE noticias SET titulo=?, categoria=?, fecha=?, imagen=?, descripcion=?, contenido=? WHERE id=?')
    .run(titulo, categoria, fecha, imagen, descripcion, contenido, req.params.id);
  res.json({ success: true });
});

app.delete('/api/noticias/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE noticias SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - TESTIMONIOS
// ==========================================
app.get('/api/testimonios', (req, res) => {
  const testimonios = db.prepare('SELECT * FROM testimonios WHERE activo=1 ORDER BY creado_en DESC').all();
  res.json(testimonios);
});

app.post('/api/testimonios', requireAdmin, (req, res) => {
  const { nombre, texto, imagen, estrellas = 5 } = req.body;
  const result = db.prepare('INSERT INTO testimonios (nombre, texto, imagen, estrellas) VALUES (?, ?, ?, ?)')
    .run(nombre, texto, imagen, estrellas);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/testimonios/:id', requireAdmin, (req, res) => {
  const { nombre, texto, imagen, estrellas } = req.body;
  db.prepare('UPDATE testimonios SET nombre=?, texto=?, imagen=?, estrellas=? WHERE id=?')
    .run(nombre, texto, imagen, estrellas, req.params.id);
  res.json({ success: true });
});

app.delete('/api/testimonios/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE testimonios SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - AGENTES
// ==========================================
app.get('/api/agentes', (req, res) => {
  const agentes = db.prepare('SELECT * FROM agentes WHERE activo=1 ORDER BY creado_en ASC').all();
  res.json(agentes);
});

app.post('/api/agentes', requireAdmin, (req, res) => {
  const { nombre, especialidad, telefono, email, imagen } = req.body;
  const result = db.prepare('INSERT INTO agentes (nombre, especialidad, telefono, email, imagen) VALUES (?, ?, ?, ?, ?)')
    .run(nombre, especialidad, telefono, email, imagen);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/agentes/:id', requireAdmin, (req, res) => {
  const { nombre, especialidad, telefono, email, imagen } = req.body;
  db.prepare('UPDATE agentes SET nombre=?, especialidad=?, telefono=?, email=?, imagen=? WHERE id=?')
    .run(nombre, especialidad, telefono, email, imagen, req.params.id);
  res.json({ success: true });
});

app.delete('/api/agentes/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE agentes SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - CONFIGURACION
// ==========================================
app.get('/api/config', (req, res) => {
  const rows = db.prepare('SELECT clave, valor FROM configuracion').all();
  const config = {};
  rows.forEach(r => config[r.clave] = r.valor);
  res.json(config);
});

app.post('/api/config', requireAdmin, (req, res) => {
  const updates = req.body;
  const upsert = db.prepare('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)');
  const updateAll = db.transaction((data) => {
    Object.entries(data).forEach(([k, v]) => upsert.run(k, String(v)));
  });
  updateAll(updates);
  res.json({ success: true });
});

// ponytail: /api/whatsapp ya montado arriba (línea 76) — duplicado eliminado

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    propiedades: db.prepare('SELECT COUNT(*) as c FROM propiedades WHERE activo=1').get().c
  });
});

// ==========================================
// FALLBACK: Servir index.html para rutas no-API
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ==========================================
// INICIO DEL SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log('');
  console.log('🏠 =====================================================');
  console.log(`🏠  Realty ONE Group Bolivia - Backend Server`);
  console.log('🏠 =====================================================');
  console.log(`🚀  Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`🔑  Admin Key: ${ADMIN_KEY}`);
  console.log(`📊  API Health: http://localhost:${PORT}/api/health`);
  console.log(`💬  WhatsApp Webhook: http://localhost:${PORT}/api/whatsapp/webhook`);
  console.log(`🤖  WhatsApp Simulator: http://localhost:${PORT}/whatsapp_test.html`);
  console.log('🏠 =====================================================');
  console.log('');
});

module.exports = app;
