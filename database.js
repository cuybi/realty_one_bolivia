const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'realty_one_data.json');

// Initialize data if not exists
let data = {};
if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error("Error reading JSON file, resetting database:", e);
    data = {};
  }
}

// Seed helper
function seedData() {
  if (!data.slides) {
    data.slides = [
      { id: 1, url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000', orden: 1, creado_en: new Date().toISOString() },
      { id: 2, url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000', orden: 2, creado_en: new Date().toISOString() },
      { id: 3, url: 'https://images.unsplash.com/photo-1600607687940-4e2a09695d51?auto=format&fit=crop&q=80&w=2000', orden: 3, creado_en: new Date().toISOString() },
      { id: 4, url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000', orden: 4, creado_en: new Date().toISOString() }
    ];
  }

  if (!data.categorias) {
    data.categorias = [
      { id: 'venta', titulo: 'Propiedades en <span>Venta</span>', descripcion: 'Explora las mejores oportunidades de inversión y hogares de lujo en Bolivia.', imagen: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000', orden: 1 },
      { id: 'alquiler', titulo: 'Propiedades en <span>Alquiler</span>', descripcion: 'Encuentra el espacio perfecto para vivir o trabajar en las mejores zonas del país.', imagen: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=2000', orden: 2 },
      { id: 'anticretico', titulo: 'Propiedades en <span>Anticrético</span>', descripcion: 'Opciones seguras y estratégicas para asegurar tu próximo hogar.', imagen: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=2000', orden: 3 },
      { id: 'terrenos', titulo: 'Lotes y <span>Terrenos</span>', descripcion: 'Construye tu futuro desde cero en las zonas de mayor plusvalía de Santa Cruz.', imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000', orden: 4 }
    ];
  }

  if (!data.propiedades) {
    data.propiedades = [
      { id: 1, titulo: 'Mansión Contemporánea - Urubó', precio: '$450.000', tipo: 'Venta', ubicacion: 'Urubó', habitaciones: 5, banos: 6, area: '600 m²', descripcion_larga: 'Lujo sin límites en la zona más exclusiva. Hermosa piscina infinita, amplias salas sociales, cocina gourmet y 5 master suites con vestidor.', imagenes: JSON.stringify(['assets/images/exterior.png', 'assets/images/interior.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 2, titulo: 'Casa Minimalista - Equipetrol', precio: '$320.000', tipo: 'Venta', ubicacion: 'Equipetrol', habitaciones: 4, banos: 4, area: '400 m²', descripcion_larga: 'Diseño moderno y ubicación privilegiada en el corazón de Equipetrol. Acabados premium, iluminación natural e imponente fachada.', imagenes: JSON.stringify(['assets/images/exterior.png', 'assets/images/interior.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 3, titulo: 'Penthouse de Lujo - Sirari', precio: '$280.000', tipo: 'Venta', ubicacion: 'Sirari', habitaciones: 3, banos: 4, area: '350 m²', descripcion_larga: 'Vistas espectaculares de la ciudad y acabados de lujo. Cuenta con terraza privada, jacuzzi, cocina integrada y acceso directo por ascensor.', imagenes: JSON.stringify(['assets/images/apartamento.png', 'assets/images/interior.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 4, titulo: 'Chalet Familiar - Zona Norte', precio: '$195.000', tipo: 'Venta', ubicacion: 'Zona Norte', habitaciones: 4, banos: 3, area: '300 m²', descripcion_larga: 'Espacios amplios para toda la familia. Hermoso jardín posterior con churrasquera, dependencia de servicio y amplio garaje para 3 vehículos.', imagenes: JSON.stringify(['assets/images/exterior.png', 'assets/images/interior.png']), destacado: 0, activo: 1, creado_en: new Date().toISOString() },
      { id: 5, titulo: 'Casa Moderna - Remanso', precio: '$380.000', tipo: 'Venta', ubicacion: 'Remanso', habitaciones: 5, banos: 5, area: '520 m²', descripcion_larga: 'Majestuosa casa en el corazón de Remanso. Tres plantas de pura elegancia, cine privado, bodega de vinos, spa y piscina con cascada.', imagenes: JSON.stringify(['assets/images/exterior.png', 'assets/images/interior.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 6, titulo: 'Duplex Premium - La Guardia', precio: '$145.000', tipo: 'Venta', ubicacion: 'La Guardia', habitaciones: 3, banos: 3, area: '230 m²', descripcion_larga: 'Duplex de dos plantas con acabados de primera. Ideal para familia joven, garaje doble, área de BBQ y sistema de seguridad integrado.', imagenes: JSON.stringify(['assets/images/interior.png']), destacado: 0, activo: 1, creado_en: new Date().toISOString() },
      { id: 7, titulo: 'Dpto Executive - Equipetrol', precio: '$1.200', tipo: 'Alquiler', ubicacion: 'Equipetrol', habitaciones: 2, banos: 2, area: '120 m²', descripcion_larga: 'Completamente amoblado y céntrico, ideal para ejecutivos. Edificio moderno con áreas comunes, gimnasio y piscina en el rooftop.', imagenes: JSON.stringify(['assets/images/apartamento.png', 'assets/images/interior.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 8, titulo: 'Studio Moderno - Urubó', precio: '$800', tipo: 'Alquiler', ubicacion: 'Urubó', habitaciones: 1, banos: 1, area: '60 m²', descripcion_larga: 'Ideal para solteros o parejas jóvenes. Equipamiento de primera, seguridad 24 horas y espectaculares vistas del atardecer cruceño.', imagenes: JSON.stringify(['assets/images/apartamento.png']), destacado: 0, activo: 1, creado_en: new Date().toISOString() },
      { id: 9, titulo: 'Oficina Corporativa - Centro', precio: '$1.500', tipo: 'Alquiler', ubicacion: 'Centro', habitaciones: 0, banos: 2, area: '200 m²', descripcion_larga: 'En el corazón financiero de la ciudad. Espacio amplio de planta abierta, salas de reuniones privadas, aire acondicionado central y parqueo.', imagenes: JSON.stringify(['assets/images/oficina.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 10, titulo: 'Casa en Condominio - Urubó', precio: '$2.500', tipo: 'Alquiler', ubicacion: 'Urubó', habitaciones: 4, banos: 4, area: '450 m²', descripcion_larga: 'Seguridad máxima y áreas sociales de lujo. 4 suites familiares, galería con jardín, piscina propia y aire acondicionado en todos los ambientes.', imagenes: JSON.stringify(['assets/images/exterior.png', 'assets/images/interior.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 11, titulo: 'Loft Industrial - Av. Busch', precio: '$950', tipo: 'Alquiler', ubicacion: 'Av. Busch', habitaciones: 1, banos: 1, area: '85 m²', descripcion_larga: 'Espacio único de concepto abierto con acabados industriales. Doble altura, ventanales amplios y cocina gourmet americana completamente equipada.', imagenes: JSON.stringify(['assets/images/apartamento.png']), destacado: 0, activo: 1, creado_en: new Date().toISOString() },
      { id: 12, titulo: 'Residencia Ejecutiva - Sirari', precio: '$3.200', tipo: 'Alquiler', ubicacion: 'Sirari', habitaciones: 5, banos: 4, area: '600 m²', descripcion_larga: 'Residencia de lujo para familias o directivos corporativos. Jardín tropical, cancha de tenis, sala de juegos y staff de seguridad.', imagenes: JSON.stringify(['assets/images/exterior.png', 'assets/images/interior.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 13, titulo: 'Casa 2 Plantas - Hamacas', precio: '$45.000', tipo: 'Anticretico', ubicacion: 'Hamacas', habitaciones: 4, banos: 3, area: '350 m²', descripcion_larga: 'Excelente estado, muy iluminada. Living comedor amplio, escritorio, galería con churrasquera y portón eléctrico.', imagenes: JSON.stringify(['assets/images/exterior.png', 'assets/images/interior.png']), destacado: 0, activo: 1, creado_en: new Date().toISOString() },
      { id: 14, titulo: 'Dpto 3 Dorm - Urbari', precio: '$30.000', tipo: 'Anticretico', ubicacion: 'Urbari', habitaciones: 3, banos: 3, area: '160 m²', descripcion_larga: 'Cerca de parques y colegios. Suite principal, dos dormitorios con baño compartido, área de servicio completa y cocina equipada.', imagenes: JSON.stringify(['assets/images/apartamento.png', 'assets/images/interior.png']), destacado: 0, activo: 1, creado_en: new Date().toISOString() },
      { id: 15, titulo: 'Local Comercial - Av. Busch', precio: '$60.000', tipo: 'Anticretico', ubicacion: 'Av. Busch', habitaciones: 0, banos: 2, area: '150 m²', descripcion_larga: 'Ideal para cualquier tipo de negocio. Ubicación de alta afluencia peatonal y vehicular, amplio showroom acristalado.', imagenes: JSON.stringify(['assets/images/oficina.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 16, titulo: 'Monoambiente - Sirari', precio: '$18.000', tipo: 'Anticretico', ubicacion: 'Sirari', habitaciones: 1, banos: 1, area: '50 m²', descripcion_larga: 'Zona tranquila y segura. Equipado con cocina americana, cajonería alta y baja, aire acondicionado y ropero empotrado.', imagenes: JSON.stringify(['assets/images/apartamento.png']), destacado: 0, activo: 1, creado_en: new Date().toISOString() },
      { id: 17, titulo: 'Terreno Industrial 7.000 m² - Parque Industrial (Salida G77)', precio: 'Bs 16.800.000', tipo: 'Terreno', ubicacion: 'Parque Industrial, Santa Cruz (Salida G77)', habitaciones: 0, banos: 0, area: '7.000 m²', descripcion_larga: 'Inversión estratégica. Terreno industrial de 7.000 m² (185m frente x 150m fondo) con salida directa a la Av. G77. Energía trifásica y agua industrial. Folio Real listo para transferir a empresas.', imagenes: JSON.stringify(['assets/images/terreno.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 18, titulo: 'Lote de 450 m² en Condominio Mar Adentro (A 300 m Laguna)', precio: '$112.500', tipo: 'Terreno', ubicacion: 'Condominio Mar Adentro, Urubó', habitaciones: 0, banos: 0, area: '450 m²', descripcion_larga: 'Oportunidad única a solo 300m de la laguna cristalina navegable Crystal Lagoons. Club House, playa de arena blanca, canchas deportivas y seguridad 24/7. Folio Real saneado.', imagenes: JSON.stringify(['assets/images/terreno.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() },
      { id: 19, titulo: 'Lote en Esquina - Porongo', precio: '$35.000', tipo: 'Terreno', ubicacion: 'Porongo', habitaciones: 0, banos: 0, area: '600 m²', descripcion_larga: 'Entorno natural y vista privilegiada en esquina. Ideal para quinta o cabaña vacacional, con energía eléctrica y agua de cooperativa.', imagenes: JSON.stringify(['assets/images/terreno.png']), destacado: 0, activo: 1, creado_en: new Date().toISOString() },
      { id: 20, titulo: 'Hacienda Vacacional - La Guardia', precio: '$75.000', tipo: 'Terreno', ubicacion: 'La Guardia', habitaciones: 0, banos: 0, area: '5000 m²', descripcion_larga: 'Ideal para proyecto de casa de campo o granja. Tierra fértil con árboles frutales, pozo de agua propio y cerramiento perimetral.', imagenes: JSON.stringify(['assets/images/terreno.png']), destacado: 1, activo: 1, creado_en: new Date().toISOString() }
    ];
  }

  if (!data.proyectos) {
    data.proyectos = [
      { id: 1, titulo: 'Urubó Green Park', tag: 'VENTA DE LOTES', descripcion: 'Un oasis de lujo en el corazón del Urubó. Vive rodeado de naturaleza con todas las comodidades de un resort de clase mundial.', imagen: 'assets/urubo_green_park.png', precio: '70 USD/m²', link: 'https://urubogreenpark.com.bo/', amenities: JSON.stringify(['Piscina Playa', 'Gimnasio', 'Saunas', 'Club House']), activo: 1, creado_en: new Date().toISOString() }
    ];
  }

  if (!data.noticias) {
    data.noticias = [
      { id: 1, titulo: 'El auge del Urubó: Por qué todos quieren vivir aquí', categoria: 'TENDENCIAS', fecha: '24 de Abril, 2026', imagen: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000', descripcion: 'Santa Cruz continúa expandiéndose y el Urubó se consolida como la zona de mayor plusvalía y exclusividad en Bolivia.', contenido: '', activo: 1, creado_en: new Date().toISOString() },
      { id: 2, titulo: 'Guía para comprar tu primera casa en Bolivia', categoria: 'CONSEJOS', fecha: '20 de Abril, 2026', imagen: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000', descripcion: 'Desde el financiamiento bancario hasta los trámites legales. Todo lo que necesitas saber para dar el gran paso.', contenido: '', activo: 1, creado_en: new Date().toISOString() },
      { id: 3, titulo: 'Realty ONE Group Bolivia: Innovación en el mercado', categoria: 'NOTICIAS', fecha: '15 de Abril, 2026', imagen: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000', descripcion: 'Cómo nuestra tecnología de vanguardia está transformando la experiencia de compra y venta de inmuebles en el país.', contenido: '', activo: 1, creado_en: new Date().toISOString() }
    ];
  }

  if (!data.testimonios) {
    data.testimonios = [
      { id: 1, nombre: 'María Fernanda López', texto: 'La mejor experiencia inmobiliaria. El equipo nos guió en cada paso para comprar nuestra casa.', imagen: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', estrellas: 5, activo: 1, creado_en: new Date().toISOString() },
      { id: 2, nombre: 'Ricardo Méndez', texto: 'Vender mi departamento fue mucho más rápido de lo que esperaba. Muy profesionales.', imagen: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', estrellas: 5, activo: 1, creado_en: new Date().toISOString() },
      { id: 3, nombre: 'Claudia Justiniano', texto: 'Encontré el terreno perfecto para mi proyecto en el Urubó gracias a su excelente asesoramiento.', imagen: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150', estrellas: 5, activo: 1, creado_en: new Date().toISOString() },
      { id: 4, nombre: 'Juan Pablo Rojas', texto: 'Excelente atención y transparencia en todo el proceso legal. 100% recomendados.', imagen: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', estrellas: 5, activo: 1, creado_en: new Date().toISOString() }
    ];
  }

  if (!data.agentes) {
    data.agentes = [
      { id: 1, nombre: 'Carlos Rodríguez', especialidad: 'Especialista en Venta de Lujo', telefono: '+591 70123456', email: 'carlos@realtyonebolivia.com.bo', imagen: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400', activo: 1, creado_en: new Date().toISOString() },
      { id: 2, nombre: 'Valeria Suárez', especialidad: 'Experta en Alquiler Corporativo', telefono: '+591 70234567', email: 'valeria@realtyonebolivia.com.bo', imagen: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', activo: 1, creado_en: new Date().toISOString() },
      { id: 3, nombre: 'Andrés Montaño', especialidad: 'Asesor de Inversiones en Terrenos', telefono: '+591 70345678', email: 'andres@realtyonebolivia.com.bo', imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', activo: 1, creado_en: new Date().toISOString() },
      { id: 4, nombre: 'Lucía Vaca', especialidad: 'Especialista en Anticrético', telefono: '+591 70456789', email: 'lucia@realtyonebolivia.com.bo', imagen: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400', activo: 1, creado_en: new Date().toISOString() }
    ];
  }

  if (!data.configuracion) {
    data.configuracion = [
      { clave: 'hero_titulo', valor: 'TU HOGAR <span>ESTÁ AQUÍ</span>' },
      { clave: 'hero_desc', valor: 'En Realty ONE Group Bolivia, hacemos realidad tus sueños inmobiliarios con tecnología de vanguardia.' },
      { clave: 'mision_titulo', valor: 'Nuestra Misión' },
      { clave: 'mision_texto', valor: 'Nuestra misión es empoderar a los profesionales inmobiliarios en Bolivia brindándoles tecnología de vanguardia, capacitación continua y una cultura empresarial colaborativa.' },
      { clave: 'vision_titulo', valor: 'Nuestra Visión' },
      { clave: 'vision_texto', valor: 'Aspiramos a consolidarnos como la franquicia inmobiliaria líder y el referente absoluto de excelencia en el mercado de bienes raíces en toda Bolivia.' },
      { clave: 'contacto_telefono', valor: '+591 60937050' },
      { clave: 'contacto_email', valor: 'info@realtyonegroup.com.bo' },
      { clave: 'contacto_direccion', valor: 'Equipetrol Norte, Santa Cruz' },
      { clave: 'footer_logo', valor: 'assets/logo_bolivia.png' },
      { clave: 'footer_texto', valor: 'La franquicia de más rápido crecimiento en el mundo.' },
      { clave: 'whatsapp_numero', valor: '59160937050' },
      { clave: 'stats_propiedades', valor: '500+' },
      { clave: 'stats_clientes', valor: '1200+' },
      { clave: 'stats_anos', valor: '10+' },
      { clave: 'stats_agentes', valor: '50+' }
    ];
  }

  saveData();
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

seedData();

// SQL parser to map query string -> JSON operations
const db = {
  prepare(sql) {
    const s = sql.trim().replace(/\s+/g, ' ');

    return {
      all(...params) {
        if (s.startsWith('SELECT * FROM slides')) {
          return data.slides.slice().sort((a, b) => a.orden - b.orden);
        }
        if (s.startsWith('SELECT * FROM categorias')) {
          return data.categorias.slice().sort((a, b) => a.orden - b.orden);
        }
        if (s.startsWith('SELECT * FROM propiedades')) {
          let res = data.propiedades.filter(p => p.activo === 1);
          let paramIdx = 0;

          if (s.includes('LOWER(tipo) LIKE ?')) {
            const val = params[paramIdx++].replace(/%/g, '').toLowerCase();
            res = res.filter(p => p.tipo.toLowerCase().includes(val));
          }
          if (s.includes('LOWER(ubicacion) LIKE ?')) {
            const val = params[paramIdx++].replace(/%/g, '').toLowerCase();
            res = res.filter(p => p.ubicacion && p.ubicacion.toLowerCase().includes(val));
          }
          if (s.includes('habitaciones >= ?')) {
            const val = params[paramIdx++];
            res = res.filter(p => p.habitaciones >= val);
          }
          if (s.includes('banos >= ?')) {
            const val = params[paramIdx++];
            res = res.filter(p => p.banos >= val);
          }
          if (s.includes('destacado=1')) {
            res = res.filter(p => p.destacado === 1);
          }
          if (s.includes('LOWER(titulo) LIKE ? OR')) {
            const val = params[paramIdx++].replace(/%/g, '').toLowerCase();
            paramIdx++; // skip duplicate params pushed for search
            paramIdx++;
            res = res.filter(p => 
              p.titulo.toLowerCase().includes(val) || 
              (p.ubicacion && p.ubicacion.toLowerCase().includes(val)) ||
              (p.descripcion_larga && p.descripcion_larga.toLowerCase().includes(val))
            );
          }

          // Order
          if (s.includes('precio-asc') || s.includes('REPLACE(REPLACE(precio,"$",""),".","")*1 AS INTEGER) ASC')) {
            res.sort((a, b) => {
              const pa = parseInt(a.precio.replace(/[^0-9]/g, '')) || 0;
              const pb = parseInt(b.precio.replace(/[^0-9]/g, '')) || 0;
              return pa - pb;
            });
          } else if (s.includes('precio-desc') || s.includes('REPLACE(REPLACE(precio,"$",""),".","")*1 AS INTEGER) DESC')) {
            res.sort((a, b) => {
              const pa = parseInt(a.precio.replace(/[^0-9]/g, '')) || 0;
              const pb = parseInt(b.precio.replace(/[^0-9]/g, '')) || 0;
              return pb - pa;
            });
          } else {
            res.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
          }
          return res;
        }
        if (s.startsWith('SELECT * FROM proyectos')) {
          return data.proyectos.filter(p => p.activo === 1).sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
        }
        if (s.startsWith('SELECT * FROM noticias')) {
          return data.noticias.filter(n => n.activo === 1).sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
        }
        if (s.startsWith('SELECT * FROM testimonios')) {
          return data.testimonios.filter(t => t.activo === 1).sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
        }
        if (s.startsWith('SELECT * FROM agentes')) {
          return data.agentes.filter(a => a.activo === 1).sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en));
        }
        if (s.startsWith('SELECT clave, valor FROM configuracion')) {
          return data.configuracion;
        }
        return [];
      },
      get(...params) {
        if (s.startsWith('SELECT COUNT(*) as c FROM slides')) return { c: data.slides.length };
        if (s.startsWith('SELECT COUNT(*) as c FROM categorias')) return { c: data.categorias.length };
        if (s.startsWith('SELECT COUNT(*) as c FROM propiedades')) return { c: data.propiedades.filter(p => p.activo === 1).length };
        if (s.startsWith('SELECT COUNT(*) as c FROM proyectos')) return { c: data.proyectos.filter(p => p.activo === 1).length };
        if (s.startsWith('SELECT COUNT(*) as c FROM noticias')) return { c: data.noticias.filter(n => n.activo === 1).length };
        if (s.startsWith('SELECT COUNT(*) as c FROM testimonios')) return { c: data.testimonios.filter(t => t.activo === 1).length };
        if (s.startsWith('SELECT COUNT(*) as c FROM agentes')) return { c: data.agentes.filter(a => a.activo === 1).length };

        if (s.startsWith('SELECT * FROM propiedades WHERE id=?')) {
          return data.propiedades.find(p => p.id == params[0] && p.activo === 1);
        }
        return { c: 0 };
      },
      run(...params) {
        let lastInsertRowid = 0;

        if (s.startsWith('INSERT INTO slides')) {
          const id = Date.now();
          data.slides.push({
            id,
            url: params[0],
            orden: params[1] || 0,
            creado_en: new Date().toISOString()
          });
          lastInsertRowid = id;
        }
        else if (s.startsWith('UPDATE slides')) {
          const id = params[2];
          const slide = data.slides.find(sl => sl.id == id);
          if (slide) {
            slide.url = params[0];
            slide.orden = params[1];
          }
        }
        else if (s.startsWith('DELETE FROM slides')) {
          data.slides = data.slides.filter(sl => sl.id != params[0]);
        }
        else if (s.startsWith('UPDATE categorias')) {
          const id = params[3];
          const cat = data.categorias.find(c => c.id == id);
          if (cat) {
            cat.titulo = params[0];
            cat.descripcion = params[1];
            cat.imagen = params[2];
          }
        }
        else if (s.startsWith('INSERT INTO propiedades')) {
          const id = Date.now();
          data.propiedades.push({
            id,
            titulo: params[0],
            precio: params[1],
            tipo: params[2],
            ubicacion: params[3],
            habitaciones: params[4],
            banos: params[5],
            area: params[6],
            descripcion_larga: params[7],
            imagenes: params[8],
            destacado: params[9],
            activo: 1,
            creado_en: new Date().toISOString()
          });
          lastInsertRowid = id;
        }
        else if (s.startsWith('UPDATE propiedades SET')) {
          const id = params[10];
          const prop = data.propiedades.find(p => p.id == id);
          if (prop) {
            prop.titulo = params[0];
            prop.precio = params[1];
            prop.tipo = params[2];
            prop.ubicacion = params[3];
            prop.habitaciones = params[4];
            prop.banos = params[5];
            prop.area = params[6];
            prop.descripcion_larga = params[7];
            prop.imagenes = params[8];
            prop.destacado = params[9];
          }
        }
        else if (s.startsWith('UPDATE propiedades SET activo=0')) {
          const prop = data.propiedades.find(p => p.id == params[0]);
          if (prop) prop.activo = 0;
        }
        else if (s.startsWith('INSERT INTO proyectos')) {
          const id = Date.now();
          data.proyectos.push({
            id,
            titulo: params[0],
            tag: params[1],
            descripcion: params[2],
            imagen: params[3],
            precio: params[4],
            link: params[5],
            amenities: params[6],
            activo: 1,
            creado_en: new Date().toISOString()
          });
          lastInsertRowid = id;
        }
        else if (s.startsWith('UPDATE proyectos SET')) {
          const id = params[7];
          const proy = data.proyectos.find(p => p.id == id);
          if (proy) {
            proy.titulo = params[0];
            proy.tag = params[1];
            proy.descripcion = params[2];
            proy.imagen = params[3];
            proy.precio = params[4];
            proy.link = params[5];
            proy.amenities = params[6];
          }
        }
        else if (s.startsWith('UPDATE proyectos SET activo=0')) {
          const proy = data.proyectos.find(p => p.id == params[0]);
          if (proy) proy.activo = 0;
        }
        else if (s.startsWith('INSERT INTO noticias')) {
          const id = Date.now();
          data.noticias.push({
            id,
            titulo: params[0],
            categoria: params[1],
            fecha: params[2],
            imagen: params[3],
            descripcion: params[4],
            contenido: params[5],
            activo: 1,
            creado_en: new Date().toISOString()
          });
          lastInsertRowid = id;
        }
        else if (s.startsWith('UPDATE noticias SET')) {
          const id = params[6];
          const noti = data.noticias.find(n => n.id == id);
          if (noti) {
            noti.titulo = params[0];
            noti.categoria = params[1];
            noti.fecha = params[2];
            noti.imagen = params[3];
            noti.descripcion = params[4];
            noti.contenido = params[5];
          }
        }
        else if (s.startsWith('UPDATE noticias SET activo=0')) {
          const noti = data.noticias.find(n => n.id == params[0]);
          if (noti) noti.activo = 0;
        }
        else if (s.startsWith('INSERT INTO testimonios')) {
          const id = Date.now();
          data.testimonios.push({
            id,
            nombre: params[0],
            texto: params[1],
            imagen: params[2],
            estrellas: params[3] || 5,
            activo: 1,
            creado_en: new Date().toISOString()
          });
          lastInsertRowid = id;
        }
        else if (s.startsWith('UPDATE testimonios SET')) {
          const id = params[4];
          const test = data.testimonios.find(t => t.id == id);
          if (test) {
            test.nombre = params[0];
            test.texto = params[1];
            test.imagen = params[2];
            test.estrellas = params[3];
          }
        }
        else if (s.startsWith('UPDATE testimonios SET activo=0')) {
          const test = data.testimonios.find(t => t.id == params[0]);
          if (test) test.activo = 0;
        }
        else if (s.startsWith('INSERT INTO agentes')) {
          const id = Date.now();
          data.agentes.push({
            id,
            nombre: params[0],
            especialidad: params[1],
            telefono: params[2],
            email: params[3],
            imagen: params[4],
            activo: 1,
            creado_en: new Date().toISOString()
          });
          lastInsertRowid = id;
        }
        else if (s.startsWith('UPDATE agentes SET')) {
          const id = params[5];
          const ag = data.agentes.find(a => a.id == id);
          if (ag) {
            ag.nombre = params[0];
            ag.especialidad = params[1];
            ag.telefono = params[2];
            ag.email = params[3];
            ag.imagen = params[4];
          }
        }
        else if (s.startsWith('UPDATE agentes SET activo=0')) {
          const ag = data.agentes.find(a => a.id == params[0]);
          if (ag) ag.activo = 0;
        }
        else if (s.startsWith('INSERT OR REPLACE INTO configuracion')) {
          const key = params[0];
          const val = params[1];
          const config = data.configuracion.find(c => c.clave === key);
          if (config) {
            config.valor = val;
          } else {
            data.configuracion.push({ clave: key, valor: val });
          }
        }

        saveData();
        return { lastInsertRowid };
      }
    };
  },
  transaction(fn) {
    return function(...args) {
      const res = fn(...args);
      saveData();
      return res;
    };
  }
};

module.exports = db;
