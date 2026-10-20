/**
 * Rutas de la API REST para el Portal Web y CMS de Realty ONE Group Bolivia
 * Administra slides, categorías, propiedades, proyectos, noticias, testimonios, agentes y configuración.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../database');

function propToObj(p) {
  if (!p) return null;
  return {
    ...p,
    imagenes: typeof p.imagenes === 'string' ? JSON.parse(p.imagenes || '[]') : p.imagenes
  };
}

function proyToObj(p) {
  if (!p) return null;
  return {
    ...p,
    amenities: typeof p.amenities === 'string' ? JSON.parse(p.amenities || '[]') : p.amenities
  };
}

function requireAdmin(req, res, next) {
  const adminKey = process.env.ADMIN_KEY || 'ONE2026';
  const headerKey = req.headers['x-admin-key'];
  const queryKey = req.query.key;
  if (headerKey === adminKey || queryKey === adminKey) {
    return next();
  }
  return res.status(401).json({ error: 'Acceso no autorizado' });
}

// ==========================================
// RUTAS - SLIDES
// ==========================================
router.get('/slides', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY orden ASC').all();
  res.json(slides);
});

router.post('/slides', requireAdmin, (req, res) => {
  const { url, orden = 0 } = req.body;
  const result = db.prepare('INSERT INTO slides (url, orden) VALUES (?, ?)').run(url, orden);
  res.json({ id: result.lastInsertRowid, url, orden });
});

router.put('/slides/:id', requireAdmin, (req, res) => {
  const { url, orden } = req.body;
  db.prepare('UPDATE slides SET url=?, orden=? WHERE id=?').run(url, orden, req.params.id);
  res.json({ success: true });
});

router.delete('/slides/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM slides WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - CATEGORIAS
// ==========================================
router.get('/categorias', (req, res) => {
  const cats = db.prepare('SELECT * FROM categorias ORDER BY orden ASC').all();
  res.json(cats);
});

router.put('/categorias/:id', requireAdmin, (req, res) => {
  const { titulo, descripcion, imagen } = req.body;
  db.prepare('UPDATE categorias SET titulo=?, descripcion=?, imagen=? WHERE id=?')
    .run(titulo, descripcion, imagen, req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - PROPIEDADES
// ==========================================
router.get('/propiedades', (req, res) => {
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

router.get('/propiedades/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM propiedades WHERE id=? AND activo=1').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Propiedad no encontrada' });
  res.json(propToObj(p));
});

router.post('/propiedades', requireAdmin, (req, res) => {
  const { titulo, precio, tipo, ubicacion, habitaciones = 0, banos = 0, area, descripcion_larga, imagenes = [], destacado = 0 } = req.body;
  const result = db.prepare(`
    INSERT INTO propiedades (titulo, precio, tipo, ubicacion, habitaciones, banos, area, descripcion_larga, imagenes, destacado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(titulo, precio, tipo, ubicacion, habitaciones, banos, area, descripcion_larga, JSON.stringify(imagenes), destacado ? 1 : 0);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/propiedades/:id', requireAdmin, (req, res) => {
  const { titulo, precio, tipo, ubicacion, habitaciones, banos, area, descripcion_larga, imagenes, destacado } = req.body;
  db.prepare(`
    UPDATE propiedades SET titulo=?, precio=?, tipo=?, ubicacion=?, habitaciones=?, banos=?, area=?, descripcion_larga=?, imagenes=?, destacado=?
    WHERE id=?
  `).run(titulo, precio, tipo, ubicacion, habitaciones, banos, area, descripcion_larga, JSON.stringify(imagenes), destacado ? 1 : 0, req.params.id);
  res.json({ success: true });
});

router.delete('/propiedades/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE propiedades SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - PROYECTOS
// ==========================================
router.get('/proyectos', (req, res) => {
  const proyectos = db.prepare('SELECT * FROM proyectos WHERE activo=1 ORDER BY creado_en DESC').all().map(proyToObj);
  res.json(proyectos);
});

router.post('/proyectos', requireAdmin, (req, res) => {
  const { titulo, tag, descripcion, imagen, precio, link, amenities = [] } = req.body;
  const result = db.prepare(`
    INSERT INTO proyectos (titulo, tag, descripcion, imagen, precio, link, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(titulo, tag, descripcion, imagen, precio, link, JSON.stringify(amenities));
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/proyectos/:id', requireAdmin, (req, res) => {
  const { titulo, tag, descripcion, imagen, precio, link, amenities } = req.body;
  db.prepare('UPDATE proyectos SET titulo=?, tag=?, descripcion=?, imagen=?, precio=?, link=?, amenities=? WHERE id=?')
    .run(titulo, tag, descripcion, imagen, precio, link, JSON.stringify(amenities), req.params.id);
  res.json({ success: true });
});

router.delete('/proyectos/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE proyectos SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - NOTICIAS
// ==========================================
router.get('/noticias', (req, res) => {
  const noticias = db.prepare('SELECT * FROM noticias WHERE activo=1 ORDER BY creado_en DESC').all();
  res.json(noticias);
});

router.post('/noticias', requireAdmin, (req, res) => {
  const { titulo, categoria, fecha, imagen, descripcion, contenido } = req.body;
  const result = db.prepare('INSERT INTO noticias (titulo, categoria, fecha, imagen, descripcion, contenido) VALUES (?, ?, ?, ?, ?, ?)')
    .run(titulo, categoria, fecha, imagen, descripcion, contenido);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/noticias/:id', requireAdmin, (req, res) => {
  const { titulo, categoria, fecha, imagen, descripcion, contenido } = req.body;
  db.prepare('UPDATE noticias SET titulo=?, categoria=?, fecha=?, imagen=?, descripcion=?, contenido=? WHERE id=?')
    .run(titulo, categoria, fecha, imagen, descripcion, contenido, req.params.id);
  res.json({ success: true });
});

router.delete('/noticias/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE noticias SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - TESTIMONIOS
// ==========================================
router.get('/testimonios', (req, res) => {
  const testimonios = db.prepare('SELECT * FROM testimonios WHERE activo=1 ORDER BY creado_en DESC').all();
  res.json(testimonios);
});

router.post('/testimonios', requireAdmin, (req, res) => {
  const { nombre, texto, imagen, estrellas = 5 } = req.body;
  const result = db.prepare('INSERT INTO testimonios (nombre, texto, imagen, estrellas) VALUES (?, ?, ?, ?)')
    .run(nombre, texto, imagen, estrellas);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/testimonios/:id', requireAdmin, (req, res) => {
  const { nombre, texto, imagen, estrellas } = req.body;
  db.prepare('UPDATE testimonios SET nombre=?, texto=?, imagen=?, estrellas=? WHERE id=?')
    .run(nombre, texto, imagen, estrellas, req.params.id);
  res.json({ success: true });
});

router.delete('/testimonios/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE testimonios SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - AGENTES
// ==========================================
router.get('/agentes', (req, res) => {
  const agentes = db.prepare('SELECT * FROM agentes WHERE activo=1 ORDER BY creado_en ASC').all();
  res.json(agentes);
});

router.post('/agentes', requireAdmin, (req, res) => {
  const { nombre, especialidad, telefono, email, imagen } = req.body;
  const result = db.prepare('INSERT INTO agentes (nombre, especialidad, telefono, email, imagen) VALUES (?, ?, ?, ?, ?)')
    .run(nombre, especialidad, telefono, email, imagen);
  res.json({ id: result.lastInsertRowid, ...req.body });
});

router.put('/agentes/:id', requireAdmin, (req, res) => {
  const { nombre, especialidad, telefono, email, imagen } = req.body;
  db.prepare('UPDATE agentes SET nombre=?, especialidad=?, telefono=?, email=?, imagen=? WHERE id=?')
    .run(nombre, especialidad, telefono, email, imagen, req.params.id);
  res.json({ success: true });
});

router.delete('/agentes/:id', requireAdmin, (req, res) => {
  db.prepare('UPDATE agentes SET activo=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// ==========================================
// RUTAS - CONFIGURACION
// ==========================================
router.get('/config', (req, res) => {
  const rows = db.prepare('SELECT clave, valor FROM configuracion').all();
  const config = {};
  rows.forEach(r => config[r.clave] = r.valor);
  res.json(config);
});

router.post('/config', requireAdmin, (req, res) => {
  const updates = req.body;
  const upsert = db.prepare('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)');
  const updateAll = db.transaction((data) => {
    Object.entries(data).forEach(([k, v]) => upsert.run(k, String(v)));
  });
  updateAll(updates);
  res.json({ success: true });
});

// Sincronizar todos los datos del CMS
router.post('/save-all-cms', requireAdmin, (req, res) => {
  try {
    const payload = req.body;
    const cmsFilePath = path.join(__dirname, '..', 'realty_one_data.json');
    const jsonStr = JSON.stringify(payload, null, 2);
    fs.writeFileSync(cmsFilePath, jsonStr, 'utf8');
    res.json({ success: true, message: 'CMS sincronizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
