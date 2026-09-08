// ==========================================
// BASE DE DATOS LOCAL Y DINÁMICA (CMS TOTAL)
// ==========================================

let MIS_SLIDES = [
    { "id": 1, "url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000", "orden": 1 },
    { "id": 2, "url": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000", "orden": 2 },
    { "id": 4, "url": "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=2000", "orden": 4 }
];

let MIS_CATEGORIAS = [
    { "id": "venta", "titulo": "Propiedades en <span>Venta</span>", "descripcion": "Explora las mejores oportunidades de inversión y hogares de lujo en Bolivia.", "imagen": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000" },
    { "id": "alquiler", "titulo": "Propiedades en <span>Alquiler</span>", "descripcion": "Encuentra el espacio perfecto para vivir o trabajar en las mejores zonas del país.", "imagen": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=2000" },
    { "id": "anticretico", "titulo": "Propiedades en <span>Anticrético</span>", "descripcion": "Opciones seguras y estratégicas para asegurar tu próximo hogar.", "imagen": "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=2000" },
    { "id": "terrenos", "titulo": "Lotes y <span>Terrenos</span>", "descripcion": "Construye tu futuro desde cero en las zonas de mayor plusvalía de Santa Cruz.", "imagen": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000" }
];

let MIS_PROPIEDADES = [
    { "id": 1, "titulo": "Mansión Contemporánea - Urubó", "precio": "$450.000", "tipo": "Venta", "ubicacion": "Urubó", "habitaciones": 5, "banos": 6, "area": "600 m²", "descripcion_larga": "Lujo sin límites en la zona más exclusiva.", "imagenes": "[\"assets/images/exterior.png\",\"assets/images/interior.png\"]", "destacado": 1, "activo": 1 },
    { "id": 2, "titulo": "Casa Minimalista - Equipetrol", "precio": "$320.000", "tipo": "Venta", "ubicacion": "Equipetrol", "habitaciones": 4, "banos": 4, "area": "400 m²", "descripcion_larga": "Diseño moderno y ubicación privilegiada en el corazón de Equipetrol.", "imagenes": "[\"assets/images/exterior.png\",\"assets/images/interior.png\"]", "destacado": 1, "activo": 1 },
    { "id": 3, "titulo": "Penthouse de Lujo - Sirari", "precio": "$280.000", "tipo": "Venta", "ubicacion": "Sirari", "habitaciones": 3, "banos": 4, "area": "350 m²", "descripcion_larga": "Vistas espectaculares de la ciudad y acabados de lujo.", "imagenes": "[\"assets/images/apartamento.png\",\"assets/images/interior.png\"]", "destacado": 1, "activo": 1 },
    { "id": 4, "titulo": "Chalet Familiar - Zona Norte", "precio": "$195.000", "tipo": "Venta", "ubicacion": "Zona Norte", "habitaciones": 4, "banos": 3, "area": "300 m²", "descripcion_larga": "Espacios amplios para toda la familia.", "imagenes": "[\"assets/images/exterior.png\",\"assets/images/interior.png\"]", "destacado": 0, "activo": 1 },
    { "id": 5, "titulo": "Casa Moderna - Remanso", "precio": "$380.000", "tipo": "Venta", "ubicacion": "Remanso", "habitaciones": 5, "banos": 5, "area": "520 m²", "descripcion_larga": "Majestuosa casa en el corazón de Remanso.", "imagenes": "[\"assets/images/exterior.png\",\"assets/images/interior.png\"]", "destacado": 1, "activo": 1 },
    { "id": 6, "titulo": "Duplex Premium - La Guardia", "precio": "$145.000", "tipo": "Venta", "ubicacion": "La Guardia", "habitaciones": 3, "banos": 3, "area": "230 m²", "descripcion_larga": "Duplex de dos plantas con acabados de primera.", "imagenes": "[\"assets/images/interior.png\"]", "destacado": 0, "activo": 1 },
    { "id": 7, "titulo": "Dpto Executive - Equipetrol", "precio": "$1.200", "tipo": "Alquiler", "ubicacion": "Equipetrol", "habitaciones": 2, "banos": 2, "area": "120 m²", "descripcion_larga": "Completamente amoblado y céntrico, ideal para ejecutivos.", "imagenes": "[\"assets/images/apartamento.png\",\"assets/images/interior.png\"]", "destacado": 1, "activo": 1 },
    { "id": 8, "titulo": "Studio Moderno - Urubó", "precio": "$800", "tipo": "Alquiler", "ubicacion": "Urubó", "habitaciones": 1, "banos": 1, "area": "60 m²", "descripcion_larga": "Ideal para solteros o parejas jóvenes.", "imagenes": "[\"assets/images/apartamento.png\"]", "destacado": 0, "activo": 1 },
    { "id": 9, "titulo": "Oficina Corporativa - Centro", "precio": "$1.500", "tipo": "Alquiler", "ubicacion": "Centro", "habitaciones": 0, "banos": 2, "area": "200 m²", "descripcion_larga": "En el corazón financiero de la ciudad.", "imagenes": "[\"assets/images/oficina.png\"]", "destacado": 1, "activo": 1 },
    { "id": 10, "titulo": "Casa en Condominio - Urubó", "precio": "$2.500", "tipo": "Alquiler", "ubicacion": "Urubó", "habitaciones": 4, "banos": 4, "area": "450 m²", "descripcion_larga": "Seguridad máxima y áreas sociales de lujo.", "imagenes": "[\"assets/images/exterior.png\",\"assets/images/interior.png\"]", "destacado": 1, "activo": 1 },
    { "id": 11, "titulo": "Loft Industrial - Av. Busch", "precio": "$950", "tipo": "Alquiler", "ubicacion": "Av. Busch", "habitaciones": 1, "banos": 1, "area": "85 m²", "descripcion_larga": "Espacio único de concepto abierto con acabados industriales.", "imagenes": "[\"assets/images/apartamento.png\"]", "destacado": 0, "activo": 1 },
    { "id": 12, "titulo": "Residencia Ejecutiva - Sirari", "precio": "$3.200", "tipo": "Alquiler", "ubicacion": "Sirari", "habitaciones": 5, "banos": 4, "area": "600 m²", "descripcion_larga": "Residencia de lujo para familias o directivos corporativos.", "imagenes": "[\"assets/images/exterior.png\",\"assets/images/interior.png\"]", "destacado": 1, "activo": 1 },
    { "id": 13, "titulo": "Casa 2 Plantas - Hamacas", "precio": "$45.000", "tipo": "Anticretico", "ubicacion": "Hamacas", "habitaciones": 4, "banos": 3, "area": "350 m²", "descripcion_larga": "Excelente estado, muy iluminada.", "imagenes": "[\"assets/images/exterior.png\",\"assets/images/interior.png\"]", "destacado": 0, "activo": 1 },
    { "id": 14, "titulo": "Dpto 3 Dorm - Urbari", "precio": "$30.000", "tipo": "Anticretico", "ubicacion": "Urbari", "habitaciones": 3, "banos": 3, "area": "160 m²", "descripcion_larga": "Cerca de parques and colegios.", "imagenes": "[\"assets/images/apartamento.png\",\"assets/images/interior.png\"]", "destacado": 0, "activo": 1 },
    { "id": 15, "titulo": "Local Comercial - Av. Busch", "precio": "$60.000", "tipo": "Anticretico", "ubicacion": "Av. Busch", "habitaciones": 0, "banos": 2, "area": "150 m²", "descripcion_larga": "Ideal para cualquier tipo de negocio.", "imagenes": "[\"assets/images/oficina.png\"]", "destacado": 1, "activo": 1 },
    { "id": 16, "titulo": "Monoambiente - Sirari", "precio": "$18.000", "tipo": "Anticretico", "ubicacion": "Sirari", "habitaciones": 1, "banos": 1, "area": "50 m²", "descripcion_larga": "Zona tranquila y segura.", "imagenes": "[\"assets/images/apartamento.png\"]", "destacado": 0, "activo": 1 },
    { "id": 17, "titulo": "Lote Urbanizado - Urubó Golf", "precio": "$120.000", "tipo": "Terreno", "ubicacion": "Urubó", "habitaciones": 0, "banos": 0, "area": "800 m²", "descripcion_larga": "Frente al campo de golf, plano y listo para construir.", "imagenes": "[\"assets/images/terreno.png\"]", "destacado": 1, "activo": 1 },
    { "id": 18, "titulo": "Terreno Industrial - Warnes", "precio": "$85.000", "tipo": "Terreno", "ubicacion": "Warnes", "habitaciones": 0, "banos": 0, "area": "3000 m²", "descripcion_larga": "Acceso pavimentado para transporte pesado.", "imagenes": "[\"assets/images/terreno.png\"]", "destacado": 0, "activo": 1 },
    { "id": 19, "titulo": "Lote en Esquina - Porongo", "precio": "$35.000", "tipo": "Terreno", "ubicacion": "Porongo", "habitaciones": 0, "banos": 0, "area": "600 m²", "descripcion_larga": "Entorno natural y vista privilegiada en esquina.", "imagenes": "[\"assets/images/terreno.png\"]", "destacado": 0, "activo": 1 },
    { "id": 20, "titulo": "Hacienda Vacacional - La Guardia", "precio": "$75.000", "tipo": "Terreno", "ubicacion": "La Guardia", "habitaciones": 0, "banos": 0, "area": "5000 m²", "descripcion_larga": "Ideal para proyecto de casa de campo o granja.", "imagenes": "[\"assets/images/terreno.png\"]", "destacado": 1, "activo": 1 }
];

let MIS_PROYECTOS = [
    { "id": 1, "titulo": "Urubó Green Park", "tag": "VENTA DE LOTES", "descripcion": "Un oasis de lujo en el corazón del Urubó.", "imagen": "assets/urubo_green_park.png", "video_url": "", "precio": "70 USD/m²", "link": "https://urubogreenpark.com.bo/", "amenities": "[\"Piscina Playa\",\"Gimnasio\",\"Saunas\",\"Club House\"]" }
];

let MIS_SEIS_CS = [
    { "id": 1, "pilar": "Commision", "subtitulo": "Comisión de venta", "descripcion": "Valoramos a los profesionales de bienes raíces, capacitándolos para lograr un mayor éxito, más rápido." },
    { "id": 2, "pilar": "Coolture", "subtitulo": "Cool + Cultura", "descripcion": "Valoramos la unidad y la diversión. Creamos un ambiente donde todos se sienten parte de una gran familia." },
    { "id": 3, "pilar": "Coaching", "subtitulo": "Formación", "descripcion": "Valoramos a las personas y las desarrollamos a través de nuestro sistema educativo patentado de clase mundial." },
    { "id": 4, "pilar": "Care", "subtitulo": "Soporte y Apoyo", "descripcion": "Valoramos las relaciones y celebramos a TODOS, brindando el apoyo necesario para alcanzar el éxito." },
    { "id": 5, "pilar": "Community", "subtitulo": "Comunidad", "descripcion": "Valoramos nuestras comunidades locales y globales, comprometiéndonos a generar un impacto positivo." },
    { "id": 6, "pilar": "Connect", "subtitulo": "Tecnología", "descripcion": "Valoramos la innovación que conecta a las personas a través de nuestra plataforma tecnológica de vanguardia." }
];

let MIS_EXPANSION = [
    { "id": 1, "region": "Norte América", "descripcion": "Establecidos primero en Las Vegas, Nevada, seguimos creciendo y prosperando en toda América del Norte.", "icono": "assets/gold_globe_icon.png" },
    { "id": 2, "region": "Sudamérica", "descripcion": "Ya en 2021, esperamos comenzar a abrir oficinas en este hermoso y extenso continente.", "icono": "assets/gold_globe_icon.png" },
    { "id": 3, "region": "Europa", "descripcion": "Con un equipo muy arraigado en este continente, Europa es una extensión natural para nosotros. Se siente como en casa.", "icono": "assets/gold_globe_icon.png" },
    { "id": 4, "region": "Asia", "descripcion": "El continente más grande y poblado de la tierra es el lugar perfecto para que abramos puertas.", "icono": "assets/gold_globe_icon.png" }
];

let MIS_NOTICIAS = [
    { "id": 1, "titulo": "El auge del Urubó: Por qué todos quieren vivir aquí", "categoria": "TENDENCIAS", "fecha": "24 de Abril, 2026", "imagen": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000", "descripcion": "Santa Cruz continúa expandiéndose y el Urubó se consolida." },
    { "id": 2, "titulo": "Guía para comprar tu primera casa en Bolivia", "categoria": "CONSEJOS", "fecha": "20 de Abril, 2026", "imagen": "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000", "descripcion": "Desde el financiamiento bancario hasta los trámites legales." },
    { "id": 3, "titulo": "Realty ONE Group Bolivia: Innovación en el mercado", "categoria": "NOTICIAS", "fecha": "15 de Abril, 2026", "imagen": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000", "descripcion": "Cómo nuestra tecnología de vanguardia está transformando la experiencia." }
];

let MIS_TESTIMONIOS = [
    { "id": 1, "nombre": "María Fernanda López", "texto": "La mejor experiencia inmobiliaria.", "imagen": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150", "estrellas": 5 },
    { "id": 2, "nombre": "Ricardo Méndez", "texto": "Vender mi departamento fue mucho más rápido de lo que esperaba.", "imagen": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150", "estrellas": 5 },
    { "id": 3, "nombre": "Claudia Justiniano", "texto": "Encontré el terreno perfecto para mi proyecto.", "imagen": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150", "estrellas": 5 },
    { "id": 4, "nombre": "Juan Pablo Rojas", "texto": "Excelente atención y transparencia en todo el proceso.", "imagen": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150", "estrellas": 5 }
];

let MIS_AGENTES = [
    { "id": 1, "nombre": "Carlos Rodríguez", "especialidad": "Especialista en Venta de Lujo", "telefono": "+591 70123456", "email": "carlos@realtyonebolivia.com.bo", "imagen": "assets/agente_carlos.png" },
    { "id": 2, "nombre": "Valeria Suárez", "especialidad": "Experta en Alquiler Corporativo", "telefono": "+591 70234567", "email": "valeria@realtyonebolivia.com.bo", "imagen": "assets/agente_valeria.png" },
    { "id": 3, "nombre": "Andrés Montaño", "especialidad": "Asesor de Inversiones en Terrenos", "telefono": "+591 70345678", "email": "andres@realtyonebolivia.com.bo", "imagen": "assets/agente_andres.png" },
    { "id": 4, "nombre": "Lucía Vaca", "especialidad": "Especialista en Anticrético", "telefono": "+591 70456789", "email": "lucia@realtyonebolivia.com.bo", "imagen": "assets/agente_lucia.png" }
];

let MIS_CONFIGURACIONES = {
    hero_titulo: "TU HOGAR <span>ESTÁ AQUÍ</span>",
    hero_desc: "En Realty ONE Group Bolivia, hacemos realidad tus sueños inmobiliarios con tecnología de vanguardia.",
    hero_btn_text: "BUSCAR PROPIEDADES",
    mision_titulo: "Nuestra Misión",
    mision_texto: "Nuestra misión es empoderar a los profesionales inmobiliarios en Bolivia brindándoles tecnología de vanguardia, capacitación continua y una cultura empresarial colaborativa.",
    vision_titulo: "Nuestra Visión",
    vision_texto: "Aspiramos a consolidarnos como la franquicia inmobiliaria líder y el referente absoluto de excelencia en el mercado de bienes raíces en toda Bolivia.",
    manifesto_titulo: "TODOS TENEMOS <br> UNA VIDA PARA VIVIR",
    manifesto_proposito: "PROPÓSITO",
    manifesto_texto: `Abriendo puertas en todo el mundo,<br>
<strong>ONE</strong> hogar <strong>ONE</strong> sueño <strong>ONE</strong> vida a la vez<br><br>
Tienes <strong>ONE</strong> vida para vivir.<br>
<strong>ONE</strong> oportunidad de hacerla significativa, darle sentido y la posibilidad de vivir sin remordimientos.<br>
Asume riesgos, sé audaz, aprovecha el día y usa el respeto como guía. Lidera con respeto.<br>
Tus circunstancias cambiarán, la gente cambiará, tú cambiarás.<br>
Ábrete a esto, acéptalo y vívelo.<br>
Aquí todos y cada <strong>ONE</strong> de nosotros tenemos voz.`,
    expansion_titulo: "<span style=\"color: var(--primary-color);\">REALTY ONE GROUP</span> SE EXPANDE EN EL MUNDO",
    expansion_subtitulo: "NOS ESTAMOS EXPANDIENDO Acompáñanos mientras seguimos pintando de ORO la nación, sacudiendo la industria inmobiliaria hasta su núcleo – y dándote las herramientas para llevar tu negocio al siguiente nivel localmente e internacionalmente.",
    map_promo_script: "Tu Conexión Premium",
    map_promo_titulo: "EXPLORA EL <span style=\"color: var(--primary-color);\">URUBÓ INTERACTIVO</span>",
    map_promo_desc: "Visualiza la ubicación exacta de las urbanizaciones más exclusivas: Colinas del Urubó, Urubó Green, Playa Turquesa, Kalomai y Bélgica. Conoce de primera mano los puentes de última generación que integran Santa Cruz con toda la zona metropolitana del Urubó, y su proximidad al Aeropuerto Internacional Viru Viru.",
    contacto_telefono: "+591 60937050",
    contacto_email: "info@realtyonegroup.com.bo",
    contacto_direccion: "Equipetrol Norte, Santa Cruz",
    contacto_horario: "Lunes a Viernes: 08:30 - 18:30 | Sábados: 09:00 - 13:00",
    social_facebook: "https://facebook.com",
    social_instagram: "https://instagram.com",
    social_tiktok: "https://tiktok.com",
    social_linkedin: "https://linkedin.com",
    footer_logo: "assets/logo_realty_one_full.png",
    footer_texto: "La franquicia inmobiliaria de más rápido crecimiento en el mundo. El estilo de vida ONE ha llegado a Bolivia."
};

const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:3000/api' : '/api';
let ADMIN_KEY_SESSION = '';

// ==========================================
// CARGA Y PERSISTENCIA CENTRALIZADA
// ==========================================

async function loadFromAPI() {
    // 1. Intentar cargar desde localStorage primero (caché instantánea)
    try {
        const localCMS = localStorage.getItem('realty_cms_full_data');
        if (localCMS) {
            const parsed = JSON.parse(localCMS);
            if (parsed.slides) MIS_SLIDES = parsed.slides;
            if (parsed.categorias) MIS_CATEGORIAS = parsed.categorias;
            if (parsed.propiedades) MIS_PROPIEDADES = parsed.propiedades;
            if (parsed.proyectos) MIS_PROYECTOS = parsed.proyectos;
            if (parsed.seis_cs) MIS_SEIS_CS = parsed.seis_cs;
            if (parsed.expansion) MIS_EXPANSION = parsed.expansion;
            if (parsed.noticias) MIS_NOTICIAS = parsed.noticias;
            if (parsed.testimonios) MIS_TESTIMONIOS = parsed.testimonios;
            if (parsed.agentes) MIS_AGENTES = parsed.agentes;
            if (parsed.configuraciones) MIS_CONFIGURACIONES = Object.assign(MIS_CONFIGURACIONES, parsed.configuraciones);
        }
    } catch(e) { console.warn("Error leyendo localStorage CMS:", e); }

    // 2. Intentar cargar desde save_cms.php (para SiteGround / servidor online)
    try {
        const resPHP = await fetch('save_cms.php');
        if (resPHP.ok) {
            const dataPHP = await resPHP.json();
            if (dataPHP && !dataPHP.error && dataPHP.status !== 'not_found' && dataPHP.status !== 'empty') {
                if (dataPHP.slides) MIS_SLIDES = dataPHP.slides;
                if (dataPHP.categorias) MIS_CATEGORIAS = dataPHP.categorias;
                if (dataPHP.propiedades) MIS_PROPIEDADES = dataPHP.propiedades;
                if (dataPHP.proyectos) MIS_PROYECTOS = dataPHP.proyectos;
                if (dataPHP.seis_cs) MIS_SEIS_CS = dataPHP.seis_cs;
                if (dataPHP.expansion) MIS_EXPANSION = dataPHP.expansion;
                if (dataPHP.noticias) MIS_NOTICIAS = dataPHP.noticias;
                if (dataPHP.testimonios) MIS_TESTIMONIOS = dataPHP.testimonios;
                if (dataPHP.agentes) MIS_AGENTES = dataPHP.agentes;
                if (dataPHP.configuraciones) MIS_CONFIGURACIONES = Object.assign(MIS_CONFIGURACIONES, dataPHP.configuraciones);
                return;
            }
        }
    } catch(e) {}

    // 3. Fallback Node.js REST API
    try {
        const [slides, cats, props, proys, news, tests, conf, agents] = await Promise.all([
            fetch(`${API_BASE_URL}/slides`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/categorias`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/propiedades`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/proyectos`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/noticias`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/testimonios`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/config`).then(r => r.json()).catch(() => null),
            fetch(`${API_BASE_URL}/agentes`).then(r => r.json()).catch(() => null)
        ]);
        if (Array.isArray(slides) && slides.length) MIS_SLIDES = slides;
        if (Array.isArray(cats) && cats.length) MIS_CATEGORIAS = cats;
        if (Array.isArray(props) && props.length) MIS_PROPIEDADES = props;
        if (Array.isArray(proys) && proys.length) MIS_PROYECTOS = proys;
        if (Array.isArray(news) && news.length) MIS_NOTICIAS = news;
        if (Array.isArray(tests) && tests.length) MIS_TESTIMONIOS = tests;
        if (conf && Object.keys(conf).length) MIS_CONFIGURACIONES = Object.assign(MIS_CONFIGURACIONES, conf);
        if (Array.isArray(agents) && agents.length) MIS_AGENTES = agents;
    } catch (error) {}
}

async function persistCMSData() {
    const fullPayload = {
        slides: MIS_SLIDES,
        categorias: MIS_CATEGORIAS,
        propiedades: MIS_PROPIEDADES,
        proyectos: MIS_PROYECTOS,
        seis_cs: MIS_SEIS_CS,
        expansion: MIS_EXPANSION,
        noticias: MIS_NOTICIAS,
        testimonios: MIS_TESTIMONIOS,
        agentes: MIS_AGENTES,
        configuraciones: MIS_CONFIGURACIONES,
        updated_at: new Date().toISOString()
    };

    // Guardado local inmediato
    try {
        localStorage.setItem('realty_cms_full_data', JSON.stringify(fullPayload));
    } catch(e) { console.warn("Error en localStorage:", e); }

    // Guardado en PHP (SiteGround)
    try {
        await fetch('save_cms.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY_SESSION || 'ONE2026' },
            body: JSON.stringify(fullPayload)
        });
    } catch(e) {}

    // Guardado en Node.js API si está disponible
    try {
        await fetch(`${API_BASE_URL}/save-all-cms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY_SESSION || 'ONE2026' },
            body: JSON.stringify(fullPayload)
        });
    } catch(e) {}

    showToast("¡Cambios guardados y aplicados exitosamente!", "success");
    renderAll();
    updateExportCode();
}

// ==========================================
// LÓGICA DE NAVEGACIÓN Y FILTRADO
// ==========================================

let FILTRO_BUSQUEDA = { tab: 'todos', tipo: 'todos', ubicacion: '', precio: 0 };

function switchTab(el, type) {
    document.querySelectorAll('.search-tabs .tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    FILTRO_BUSQUEDA.tab = type;
}

function applyFilters() {
    const tipo = document.getElementById('search-type')?.value || 'todos';
    const ubicacion = document.getElementById('search-location')?.value || '';
    const precio = document.getElementById('search-price')?.value || 0;
    
    // Si estamos en index.html, redirigimos a buscar.html con los parámetros
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        const params = new URLSearchParams();
        if (FILTRO_BUSQUEDA.tab !== 'todos') params.set('tab', FILTRO_BUSQUEDA.tab);
        if (tipo !== 'todos') params.set('type', tipo);
        if (ubicacion !== '') params.set('loc', ubicacion);
        if (precio > 0) params.set('price', precio);
        
        window.location.href = `buscar.html?${params.toString()}`;
        return;
    }

    FILTRO_BUSQUEDA.tipo = tipo;
    FILTRO_BUSQUEDA.ubicacion = ubicacion.toLowerCase();
    FILTRO_BUSQUEDA.precio = parseInt(precio) || 0;
    renderProperties();
    const propSection = document.getElementById('propiedades');
    if (propSection) window.scrollTo({ top: propSection.offsetTop - 80, behavior: 'smooth' });
}

// ==========================================
// FUNCIONES DE RENDERIZADO TOTAL
// ==========================================

function renderAll() {
    renderConfig();
    renderSlider();
    renderNosotrosSection();
    renderProjects();
    renderProperties();
    renderNews();
    renderTestimonials();
    renderAgents();
    renderCategoryHeader();
    renderPropertyDetail();
    renderMapPromo();
}

function renderConfig() {
    const c = MIS_CONFIGURACIONES;
    const hTitle = document.getElementById('hero-title'); if (hTitle) hTitle.innerHTML = c.hero_titulo;
    const hDesc = document.getElementById('hero-desc'); if (hDesc) hDesc.innerHTML = c.hero_desc;
    const mTitle = document.getElementById('mision-title'); if (mTitle) mTitle.innerHTML = c.mision_titulo;
    const mText = document.getElementById('mision-text'); if (mText) mText.innerHTML = c.mision_texto;
    const vTitle = document.getElementById('vision-title'); if (vTitle) vTitle.innerHTML = c.vision_titulo;
    const vText = document.getElementById('vision-text'); if (vText) vText.innerHTML = c.vision_texto;
    
    // Manifiesto & Propósito
    const manTitle = document.getElementById('manifesto-quote-title'); if (manTitle) manTitle.innerHTML = c.manifesto_titulo;
    const manPara = document.getElementById('manifesto-quote-paragraph');
    if (manPara) {
        manPara.innerHTML = `<strong style="color: #000; display: block; margin-bottom: 10px; font-size: 1.1rem; letter-spacing: 2px;">${c.manifesto_proposito || 'PROPÓSITO'}</strong>${c.manifesto_texto}`;
    }

    // Expansión Header
    const expTitle = document.getElementById('expansion-title'); if (expTitle) expTitle.innerHTML = c.expansion_titulo;
    const expSub = document.getElementById('expansion-subtitle'); if (expSub) expSub.innerHTML = c.expansion_subtitulo;

    // Contacto
    const cPhone = document.getElementById('contact-phone'); if (cPhone) cPhone.innerHTML = c.contacto_telefono;
    const cEmail = document.getElementById('contact-email'); if (cEmail) cEmail.innerHTML = c.contacto_email;
    const cAddress = document.getElementById('contact-address'); if (cAddress) cAddress.innerHTML = c.contacto_direccion;

    // Footer
    const fLogo = document.getElementById('footer-logo'); if (fLogo) fLogo.src = c.footer_logo;
    const fText = document.getElementById('footer-text'); if (fText) fText.innerHTML = c.footer_texto;
    const fCopy = document.getElementById('copyright-text'); if (fCopy) fCopy.innerHTML = `<div style="display: flex; justify-content: center; align-items: center; gap: 20px; flex-wrap: wrap;">
        <span>&copy; ${new Date().getFullYear()} Realty ONE Group Bolivia. Todos los derechos reservados.</span>
        <a href="javascript:void(0)" onclick="toggleLoginModal()" style="color: #666; text-decoration: none; font-size: 0.8rem; display: flex; align-items: center; gap: 5px;">
            <i class="fas fa-lock"></i> Gestión ONE
        </a>
    </div>`;

    const fEmail = document.getElementById('contact-email-footer'); if (fEmail) fEmail.innerHTML = c.contacto_email;
    const fPhone = document.getElementById('contact-phone-footer'); if (fPhone) fPhone.innerHTML = c.contacto_telefono;
    const fAddress = document.getElementById('contact-address-footer'); if (fAddress) fAddress.innerHTML = c.contacto_direccion;

    // Redes Sociales en Footer
    const socContainer = document.querySelector('.social-links');
    if (socContainer) {
        socContainer.innerHTML = `
            ${c.social_facebook ? `<a href="${c.social_facebook}" target="_blank"><i class="fab fa-facebook-f"></i></a>` : ''}
            ${c.social_instagram ? `<a href="${c.social_instagram}" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
            ${c.social_tiktok ? `<a href="${c.social_tiktok}" target="_blank"><i class="fab fa-tiktok"></i></a>` : ''}
            ${c.contacto_telefono ? `<a href="https://wa.me/${c.contacto_telefono.replace(/[^0-9]/g, '')}" target="_blank"><i class="fab fa-whatsapp"></i></a>` : ''}
            ${c.social_linkedin ? `<a href="${c.social_linkedin}" target="_blank"><i class="fab fa-linkedin-in"></i></a>` : ''}
        `;
    }

    const waFloat = document.getElementById('whatsapp-float-link');
    if (waFloat && c.contacto_telefono) {
        const num = c.contacto_telefono.replace(/[^0-9]/g, '');
        waFloat.href = `https://wa.me/${num}`;
    }
}

function renderSlider() {
    const container = document.getElementById('hero-slider-container');
    if (!container) return;
    container.innerHTML = MIS_SLIDES.map((s, index) => `<div class="hero-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${s.url}');"></div>`).join('');
    if (window.heroInterval) clearInterval(window.heroInterval);
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length < 2) return;
    let currentSlide = 0;
    window.heroInterval = setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

function renderNosotrosSection() {
    // 1. Las 6 C's
    const sixCsContainer = document.getElementById('six-cs-list');
    if (sixCsContainer) {
        sixCsContainer.innerHTML = MIS_SEIS_CS.map(c => `
            <div class="c-data-item" data-aos="fade-left">
                <h4 class="c-title-script">${c.pilar} / <span>${c.subtitulo}</span></h4>
                <p>${c.descripcion}</p>
            </div>
        `).join('');
    }

    // 2. Expansión Mundial
    const expContainer = document.getElementById('expansion-grid');
    if (expContainer) {
        expContainer.innerHTML = MIS_EXPANSION.map((e, idx) => `
            <div class="expansion-item" data-aos="fade-up" data-aos-delay="${(idx + 1) * 100}">
                <div class="expansion-icon-wrapper">
                    <img src="${e.icono || 'assets/gold_globe_icon.png'}" alt="Icono" class="expansion-icon" onerror="this.src='assets/gold_globe_icon.png'">
                </div>
                <h3>${e.region}</h3>
                <p>${e.descripcion}</p>
            </div>
        `).join('');
    }
}

function renderMapPromo() {
    const c = MIS_CONFIGURACIONES;
    const sEl = document.querySelector('.map-promo-text .text-script'); if (sEl && c.map_promo_script) sEl.innerHTML = c.map_promo_script;
    const tEl = document.querySelector('.map-promo-text h2'); if (tEl && c.map_promo_titulo) tEl.innerHTML = c.map_promo_titulo;
    const dEl = document.querySelector('.map-promo-text p'); if (dEl && c.map_promo_desc) dEl.innerHTML = c.map_promo_desc;
}

function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    container.innerHTML = MIS_PROYECTOS.map(p => {
        const amenities = typeof p.amenities === 'string' ? JSON.parse(p.amenities) : (p.amenities || []);
        const hasVideo = p.video_url && p.video_url.trim() !== '';
        return `
        <div class="featured-project-box" data-aos="zoom-in">
            <div class="project-img-side" style="background-image: url('${p.imagen}'); position:relative;">
                <div class="project-tag">${p.tag}</div>
                ${hasVideo ? `<a href="${p.video_url}" target="_blank" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.7); width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#c7aa5e; font-size:24px; text-decoration:none; border:2px solid #c7aa5e; box-shadow:0 0 15px rgba(199,170,94,0.5);"><i class="fas fa-play" style="margin-left:4px;"></i></a>` : ''}
            </div>
            <div class="project-info-side">
                <h3 class="property-title">${p.titulo}</h3>
                <p>${p.descripcion}</p>
                <div class="amenities-grid">${amenities.map(a => `<div class="amenity"><i class="fas fa-check-circle"></i> ${a}</div>`).join('')}</div>
                <div class="main-price">${p.precio}</div>
                <a href="${p.link}" target="_blank" rel="noopener noreferrer" class="btn-search" style="display:block; text-align:center; margin-top:20px;">VER MÁS</a>
            </div>
        </div>`;
    }).join('');
}

function renderProperties() {
    const container = document.getElementById('property-container');
    if (!container) return;
    const path = window.location.pathname.toLowerCase();
    const normalizeStr = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let lista = MIS_PROPIEDADES;

    if (path.includes('venta.html')) lista = MIS_PROPIEDADES.filter(p => normalizeStr(p.tipo).includes('venta'));
    else if (path.includes('alquiler.html')) lista = MIS_PROPIEDADES.filter(p => normalizeStr(p.tipo).includes('alquiler'));
    else if (path.includes('anticretico.html')) lista = MIS_PROPIEDADES.filter(p => normalizeStr(p.tipo).includes('anticretico'));
    else if (path.includes('terrenos.html') || path.includes('terreno.html')) lista = MIS_PROPIEDADES.filter(p => normalizeStr(p.tipo).includes('terreno'));
    else {
        if (FILTRO_BUSQUEDA.tab !== 'todos') lista = lista.filter(p => normalizeStr(p.tipo).includes(FILTRO_BUSQUEDA.tab));
        if (FILTRO_BUSQUEDA.tipo !== 'todos') lista = lista.filter(p => normalizeStr(p.tipo).includes(normalizeStr(FILTRO_BUSQUEDA.tipo)));
        if (FILTRO_BUSQUEDA.ubicacion !== '') lista = lista.filter(p => normalizeStr(p.ubicacion || '').includes(normalizeStr(FILTRO_BUSQUEDA.ubicacion)));
        if (FILTRO_BUSQUEDA.precio > 0) {
            lista = lista.filter(p => {
                const num = parseInt(p.precio.replace(/[^0-9]/g, ''));
                return num <= FILTRO_BUSQUEDA.precio;
            });
        }
    }

    container.innerHTML = lista.map((p, index) => {
        const imgArr = typeof p.imagenes === 'string' ? JSON.parse(p.imagenes) : (p.imagenes || []);
        const cover = imgArr.length > 0 ? imgArr[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000';
        return `
        <a href="propiedad.html?id=${p.id}" class="property-card" data-aos="fade-up" data-aos-delay="${(index + 1) * 100}" style="text-decoration:none; color:inherit;">
            <div class="property-img" style="background-image: url('${cover}');">
                <div class="price-tag">${p.precio}</div>
                <div class="location-tag"><i class="fas fa-map-marker-alt"></i> ${p.ubicacion || 'Bolivia'}</div>
            </div>
            <div class="property-content">
                <div class="property-type">${p.tipo}</div>
                <h3>${p.titulo}</h3>
                <div class="property-meta">
                    <span><i class="fas fa-bed"></i> ${p.habitaciones}</span>
                    <span><i class="fas fa-bath"></i> ${p.banos}</span>
                    <span><i class="fas fa-expand"></i> ${p.area}</span>
                </div>
                <div style="margin-top: 15px; text-align: center;">
                    <span class="btn-search" style="display: inline-block; width: 100%; background: #222; border: 1px solid #333; color: var(--primary-color);">VER DETALLE</span>
                </div>
            </div>
        </a>`;
    }).join('');
}

function renderPropertyDetail() {
    const container = document.getElementById('detail-page-content');
    if (!container) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const p = MIS_PROPIEDADES.find(item => item.id == id);
    if (!p) { container.innerHTML = "<h2>Propiedad no encontrada</h2>"; return; }

    const waNum = (MIS_CONFIGURACIONES.contacto_telefono || '').replace(/[^0-9]/g, '');
    const waMsg = encodeURIComponent(`Hola Realty ONE, me interesa: ${p.titulo}`);

    const imgs = typeof p.imagenes === 'string' ? JSON.parse(p.imagenes) : (p.imagenes || []);
    const mainImg = imgs.length > 0 ? imgs[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1000';

    container.innerHTML = `
        <div style="margin-bottom: 30px;">
            <a href="index.html#propiedades" class="btn-back"><i class="fas fa-arrow-left"></i> VOLVER A PROPIEDADES</a>
        </div>
        <div class="detail-grid">
            <div>
                <div class="main-image-box">
                    <img src="${mainImg}" id="main-detail-img">
                </div>
                <div class="thumbnail-gallery" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 20px;">
                    ${imgs.map((img, idx) => `
                        <div class="thumb" style="cursor:pointer; border-radius: 8px; overflow: hidden; height: 80px; border: 2px solid ${idx === 0 ? 'var(--primary-color)' : 'transparent'};" onclick="changeDetailImg(this, '${img}')">
                            <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                        </div>
                    `).join('')}
                </div>
                <div class="description-box"><h3>Descripción</h3><p>${p.descripcion_larga || p.titulo}</p></div>
            </div>
            <div>
                <div class="info-card">
                    <h1 style="font-size: 1.8rem; line-height: 1.2;">${p.titulo}</h1>
                    <div class="detail-price" style="margin: 15px 0;">${p.precio}</div>
                    <div class="detail-meta">
                        <div class="meta-box"><i class="fas fa-bed"></i><strong>${p.habitaciones}</strong><span>Hab.</span></div>
                        <div class="meta-box"><i class="fas fa-bath"></i><strong>${p.banos}</strong><span>Baños</span></div>
                        <div class="meta-box"><i class="fas fa-expand"></i><strong>${p.area}</strong><span>Área</span></div>
                    </div>
                    <a href="https://wa.me/${waNum}?text=${waMsg}" class="btn-whatsapp-detail" target="_blank" style="text-align: center; justify-content: center;">CONSULTAR POR WHATSAPP</a>
                </div>
            </div>
        </div>`;
    document.title = `${p.titulo} | Realty ONE`;
}

function changeDetailImg(el, src) {
    document.getElementById('main-detail-img').src = src;
    document.querySelectorAll('.thumb').forEach(t => t.style.borderColor = 'transparent');
    el.style.borderColor = 'var(--primary-color)';
}

function renderNews() {
    const container = document.getElementById('blog-container');
    if (!container) return;
    container.innerHTML = MIS_NOTICIAS.map((n, index) => `
        <div class="blog-card" data-aos="fade-up" data-aos-delay="${index * 100}" style="background: #fff; border: none; box-shadow: 0 5px 15px rgba(0,0,0,0.05); transition: 0.3s; padding: 15px; border-radius: 15px;">
            <div class="blog-img" style="background-image: url('${n.imagen}'); height: 220px; border-radius: 10px; margin-bottom: 20px;"></div>
            <div class="blog-content" style="padding: 0;">
                <span style="color: var(--primary-color); font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">${n.categoria || 'NOTICIAS'}</span>
                <h3 style="color: #111; font-size: 1.4rem; margin: 10px 0; line-height: 1.3; font-weight: 700;">${n.titulo}</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="color: #888; font-size: 0.8rem;"><i class="far fa-calendar-alt"></i> ${n.fecha}</span>
                    <a href="#" style="color: #888;"><i class="fas fa-share-alt"></i></a>
                </div>
                <p style="color: #555; font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">${n.descripcion}</p>
                <a href="#" class="btn-more-news" style="color: #111; font-weight: 700; text-decoration: none; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px;">VER MÁS <i class="fas fa-arrow-right" style="font-size: 0.7rem; color: var(--primary-color);"></i></a>
            </div>
        </div>
    `).join('');
}

function renderTestimonials() {
    const container = document.getElementById('testimonial-container');
    if (!container) return;
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
    container.style.gap = '30px';

    container.innerHTML = MIS_TESTIMONIOS.map(t => `
        <div class="testimonial-card" style="background:#111; padding:30px; border-radius:15px; border:1px solid #222; text-align:center; transition:0.3s;">
            <img src="${t.imagen}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:15px; border:2px solid var(--primary-color);">
            <p style="font-style:italic; color:#ccc; margin-bottom:15px; font-size:0.95rem;">"${t.texto}"</p>
            <h4 style="color:var(--primary-color); font-weight:bold;">${t.nombre}</h4>
        </div>
    `).join('');
}

function renderAgents() {
    const container = document.getElementById('agent-container');
    if (!container) return;
    container.innerHTML = MIS_AGENTES.map((a, index) => {
        const waNum = (a.telefono || '').replace(/[^0-9]/g, '');
        const waMsg = encodeURIComponent(`Hola ${a.nombre}, me interesa consultar sobre propiedades con Realty ONE Group Bolivia.`);
        return `
        <div class="agent-card" data-aos="fade-up" data-aos-delay="${index * 100}">
            <div class="agent-img-wrapper">
                <img src="${a.imagen}" alt="${a.nombre}" class="agent-card-img">
            </div>
            <h4>${a.nombre}</h4>
            <span class="agent-specialty">${a.especialidad}</span>
            <div class="agent-contact-btns">
                <a href="https://wa.me/${waNum}?text=${waMsg}" target="_blank" class="agent-contact-btn whatsapp" title="WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </a>
                <a href="mailto:${a.email}" class="agent-contact-btn email" title="Email">
                    <i class="fas fa-envelope"></i>
                </a>
                <a href="tel:${a.telefono}" class="agent-contact-btn" title="Llamar">
                    <i class="fas fa-phone"></i>
                </a>
            </div>
        </div>`;
    }).join('');
}

function renderCategoryHeader() {
    const titleEl = document.getElementById('cat-title');
    const descEl = document.getElementById('cat-desc');
    const heroSection = document.querySelector('.section-hero');
    if (!titleEl || !descEl) return;
    const path = window.location.pathname.toLowerCase();
    let catId = path.includes('venta') ? 'venta' : path.includes('alquiler') ? 'alquiler' : path.includes('anticretico') ? 'anticretico' : (path.includes('terrenos') || path.includes('terreno')) ? 'terrenos' : '';
    const cat = MIS_CATEGORIAS.find(c => c.id === catId);
    if (cat) {
        titleEl.innerHTML = cat.titulo;
        descEl.innerHTML = cat.descripcion;
        if (heroSection) heroSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${cat.imagen}')`;
    }
}

// ==========================================
// CMS - PANEL ADMINISTRATIVO
// ==========================================

const LLAVE_MAESTRA = "ONE2026";

function toggleLoginModal() {
    openAuthModal('login');
}

function validateAccess() {
    const code = document.getElementById('access-code')?.value || document.getElementById('login-identifier')?.value;
    if (code === LLAVE_MAESTRA) {
        ADMIN_KEY_SESSION = code;
        const sessionData = { name: "Administrador ONE", email: "admin@realtyonebolivia.com", role: "admin" };
        localStorage.setItem('realty_user_session', JSON.stringify(sessionData));
        closeAuthModal();
        updateTopbarSessionUI();
        toggleAdminPanel();
        showToast("¡Acceso Administrativo Concedido!", "success");
    } else {
        const err = document.getElementById('login-error') || document.getElementById('login-alert');
        if (err) {
            err.style.display = 'block';
            err.textContent = 'Llave o credenciales incorrectas. Intente nuevamente.';
        } else {
            alert('Llave incorrecta.');
        }
    }
}

// ====================================================
// SISTEMA DE AUTENTICACIÓN Y TOPBAR INTERACTIVO
// ====================================================

function initAuthSystem() {
    // Inyectar modal de autenticación si no existe en el DOM
    if (!document.getElementById('auth-modal-overlay')) {
        const modalHtml = `
        <div id="auth-modal-overlay" class="auth-modal-overlay" onclick="handleAuthOverlayClick(event)">
            <div class="auth-modal-card">
                <div class="auth-modal-header">
                    <button type="button" class="auth-modal-close" onclick="closeAuthModal()" aria-label="Cerrar">&times;</button>
                    <div class="auth-modal-brand">
                        <img src="assets/logo_bolivia.png" alt="Realty ONE Group Bolivia" onerror="this.style.display='none'">
                    </div>
                    <div class="auth-modal-tabs">
                        <button type="button" class="auth-tab-btn active" id="tab-btn-login" onclick="switchAuthTab('login')">
                            <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                        </button>
                        <button type="button" class="auth-tab-btn" id="tab-btn-register" onclick="switchAuthTab('register')">
                            <i class="fas fa-user-plus"></i> Registrarse
                        </button>
                    </div>
                </div>

                <div class="auth-modal-body">
                    <!-- Formulario Iniciar Sesión -->
                    <form id="form-auth-login" class="auth-form-view active" onsubmit="handleUserLogin(event)">
                        <div id="login-alert" class="auth-alert-box auth-alert-error"></div>

                        <div class="auth-form-group">
                            <label>Correo Electrónico, Usuario o Llave Secreta</label>
                            <div class="auth-input-wrapper">
                                <i class="fas fa-user input-icon"></i>
                                <input type="text" id="login-identifier" class="auth-input" placeholder="ej. usuario@correo.com o ONE2026" required autocomplete="username">
                            </div>
                        </div>

                        <div class="auth-form-group">
                            <label>Contraseña / Código de Acceso</label>
                            <div class="auth-input-wrapper">
                                <i class="fas fa-lock input-icon"></i>
                                <input type="password" id="login-password" class="auth-input" placeholder="••••••••" required autocomplete="current-password">
                            </div>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 0.78rem; color: #888;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; text-transform: none;">
                                <input type="checkbox" id="login-remember" checked> Recordarme
                            </label>
                            <a href="javascript:void(0)" onclick="alert('Para soporte o recuperación de cuenta, contáctanos al WhatsApp +591 7000 0000 o usa la llave ONE2026.');" style="color: var(--primary-color); text-decoration: none;">¿Olvidaste tu clave?</a>
                        </div>

                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-arrow-right" style="margin-right: 6px;"></i> INGRESAR
                        </button>

                        <div class="auth-footer-help">
                            ¿No tienes una cuenta aún? <a href="javascript:void(0)" onclick="switchAuthTab('register')">Regístrate gratis</a>
                        </div>
                    </form>

                    <!-- Formulario Registrarse -->
                    <form id="form-auth-register" class="auth-form-view" onsubmit="handleUserRegister(event)">
                        <div id="register-alert" class="auth-alert-box auth-alert-error"></div>

                        <div class="auth-form-group">
                            <label>Nombre Completo</label>
                            <div class="auth-input-wrapper">
                                <i class="fas fa-user-circle input-icon"></i>
                                <input type="text" id="reg-name" class="auth-input" placeholder="Tu nombre y apellido" required>
                            </div>
                        </div>

                        <div class="auth-form-group">
                            <label>Correo Electrónico</label>
                            <div class="auth-input-wrapper">
                                <i class="fas fa-envelope input-icon"></i>
                                <input type="email" id="reg-email" class="auth-input" placeholder="tu@correo.com" required>
                            </div>
                        </div>

                        <div class="auth-form-group">
                            <label>Teléfono / WhatsApp</label>
                            <div class="auth-input-wrapper">
                                <i class="fas fa-phone-alt input-icon"></i>
                                <input type="tel" id="reg-phone" class="auth-input" placeholder="+591 7000 0000" required>
                            </div>
                        </div>

                        <div class="auth-form-group">
                            <label>¿Qué tipo de asesoría buscas?</label>
                            <div class="auth-input-wrapper">
                                <i class="fas fa-tag input-icon"></i>
                                <select id="reg-interest" class="auth-select">
                                    <option value="comprar">Comprar Casa / Terreno</option>
                                    <option value="urubo">Invertir en Proyectos Urubó Green Park</option>
                                    <option value="alquilar">Alquiler o Anticrético</option>
                                    <option value="agente">Quiero unirme como Agente ONE</option>
                                    <option value="propietario">Quiero vender mi propiedad</option>
                                </select>
                            </div>
                        </div>

                        <div class="auth-form-group">
                            <label>Crea una Contraseña</label>
                            <div class="auth-input-wrapper">
                                <i class="fas fa-key input-icon"></i>
                                <input type="password" id="reg-password" class="auth-input" placeholder="Mínimo 4 caracteres" required minlength="4">
                            </div>
                        </div>

                        <button type="submit" class="auth-submit-btn">
                            <i class="fas fa-check-circle" style="margin-right: 6px;"></i> CREAR MI CUENTA
                        </button>

                        <div class="auth-footer-help">
                            ¿Ya tienes cuenta? <a href="javascript:void(0)" onclick="switchAuthTab('login')">Inicia sesión</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div id="realty-toast-container" class="realty-toast-container"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Actualizar UI de sesión en todos los topbars presentes
    updateTopbarSessionUI();
}

function handleAuthOverlayClick(e) {
    if (e.target.id === 'auth-modal-overlay') {
        closeAuthModal();
    }
}

function openAuthModal(tab = 'login') {
    initAuthSystem();
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
        overlay.classList.add('active');
        switchAuthTab(tab);
    }
}

function closeAuthModal() {
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) overlay.classList.remove('active');
    const loginAlert = document.getElementById('login-alert');
    const regAlert = document.getElementById('register-alert');
    if (loginAlert) loginAlert.style.display = 'none';
    if (regAlert) regAlert.style.display = 'none';
}

function switchAuthTab(tab) {
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');
    const formLogin = document.getElementById('form-auth-login');
    const formReg = document.getElementById('form-auth-register');

    if (tab === 'login') {
        btnLogin?.classList.add('active');
        btnReg?.classList.remove('active');
        formLogin?.classList.add('active');
        formReg?.classList.remove('active');
        setTimeout(() => document.getElementById('login-identifier')?.focus(), 100);
    } else {
        btnReg?.classList.add('active');
        btnLogin?.classList.remove('active');
        formReg?.classList.add('active');
        formLogin?.classList.remove('active');
        setTimeout(() => document.getElementById('reg-name')?.focus(), 100);
    }
}

function handleUserLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const alertBox = document.getElementById('login-alert');

    if (!identifier || !password) return;

    // Caso 1: Llave Maestra Administrador (ONE2026)
    if (identifier === LLAVE_MAESTRA || password === LLAVE_MAESTRA) {
        ADMIN_KEY_SESSION = LLAVE_MAESTRA;
        const sessionData = { name: "Administrador ONE", email: "admin@realtyonebolivia.com", role: "admin" };
        localStorage.setItem('realty_user_session', JSON.stringify(sessionData));
        closeAuthModal();
        updateTopbarSessionUI();
        showToast("¡Acceso Administrativo Concedido!", "success");
        toggleAdminPanel();
        return;
    }

    // Caso 2: Usuarios registrados en localStorage
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('realty_registered_users') || '[]');
    } catch(err) { users = []; }

    const foundUser = users.find(u => 
        (u.email.toLowerCase() === identifier.toLowerCase() || u.name.toLowerCase() === identifier.toLowerCase()) && 
        u.password === password
    );

    if (foundUser) {
        const sessionData = { name: foundUser.name, email: foundUser.email, role: "client", phone: foundUser.phone };
        localStorage.setItem('realty_user_session', JSON.stringify(sessionData));
        closeAuthModal();
        updateTopbarSessionUI();
        showToast(`¡Bienvenido de nuevo, ${foundUser.name}!`, "success");
    } else {
        // Permitir ingreso flexible si es formato correo y contraseña válida
        if (identifier.includes('@') && password.length >= 4) {
            const rawName = identifier.split('@')[0];
            const cleanName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
            const sessionData = { name: cleanName, email: identifier, role: "client" };
            localStorage.setItem('realty_user_session', JSON.stringify(sessionData));
            closeAuthModal();
            updateTopbarSessionUI();
            showToast(`¡Bienvenido a Realty ONE, ${cleanName}!`, "success");
        } else {
            if (alertBox) {
                alertBox.style.display = 'block';
                alertBox.textContent = 'Credenciales no encontradas. Verifica tus datos o crea una cuenta nueva.';
            }
        }
    }
}

function handleUserRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    const interest = document.getElementById('reg-interest')?.value;
    const password = document.getElementById('reg-password')?.value;
    const alertBox = document.getElementById('register-alert');

    if (!name || !email || !password) {
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.textContent = 'Por favor completa todos los campos.';
        }
        return;
    }

    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('realty_registered_users') || '[]');
    } catch(err) { users = []; }

    // Comprobar si ya existe el correo
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        if (alertBox) {
            alertBox.style.display = 'block';
            alertBox.textContent = 'Este correo ya está registrado. Por favor inicia sesión.';
        }
        return;
    }

    const newUser = { name, email, phone, interest, password, registeredAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('realty_registered_users', JSON.stringify(users));

    // Iniciar sesión automáticamente
    const sessionData = { name, email, role: "client", phone, interest };
    localStorage.setItem('realty_user_session', JSON.stringify(sessionData));

    closeAuthModal();
    updateTopbarSessionUI();
    showToast(`🎉 ¡Cuenta creada con éxito! Bienvenido, ${name}`, "success");
}

function updateTopbarSessionUI() {
    const authContainers = document.querySelectorAll('.topbar-auth');
    if (!authContainers.length) return;

    let session = null;
    try {
        session = JSON.parse(localStorage.getItem('realty_user_session') || 'null');
    } catch(err) { session = null; }

    authContainers.forEach(container => {
        if (session) {
            if (session.role === 'admin') {
                container.innerHTML = `
                    <div class="topbar-user-badge">
                        <i class="fas fa-shield-alt"></i> <span>ADMIN</span>
                    </div>
                    <button class="topbar-auth-btn" onclick="toggleAdminPanel()" style="color:var(--primary-color);">
                        <i class="fas fa-cog"></i> <span>Panel</span>
                    </button>
                    <button class="topbar-logout-btn" onclick="logoutUser()" title="Cerrar sesión">
                        <i class="fas fa-sign-out-alt"></i> Salir
                    </button>
                `;
            } else {
                container.innerHTML = `
                    <div class="topbar-user-badge" title="${session.email}">
                        <i class="fas fa-user-circle"></i> <span>${session.name}</span>
                    </div>
                    <button class="topbar-logout-btn" onclick="logoutUser()" title="Cerrar sesión">
                        <i class="fas fa-sign-out-alt"></i> Salir
                    </button>
                `;
            }
        } else {
            container.innerHTML = `
                <a href="javascript:void(0)" onclick="openAuthModal('login')" class="topbar-auth-btn" id="btn-topbar-login">
                    <i class="fas fa-user"></i> <span>Iniciar Sesión</span>
                </a>
                <a href="javascript:void(0)" onclick="openAuthModal('register')" class="topbar-auth-btn" id="btn-topbar-register">
                    <i class="fas fa-user-plus"></i> <span>Registrarse</span>
                </a>
            `;
        }
    });
}

function logoutUser() {
    localStorage.removeItem('realty_user_session');
    ADMIN_KEY_SESSION = "";
    updateTopbarSessionUI();
    showToast("Has cerrado tu sesión.", "info");
}

function showToast(message, type = "success") {
    let container = document.getElementById('realty-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'realty-toast-container';
        container.className = 'realty-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'realty-toast';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'info' ? 'fa-info-circle' : 'fa-exclamation-circle';
    const iconColor = type === 'success' ? 'var(--primary-color)' : type === 'info' ? '#3498db' : '#e74c3c';

    toast.innerHTML = `
        <i class="fas ${icon}" style="color:${iconColor}; font-size:1.15rem;"></i>
        <span style="font-weight:600; font-size:0.88rem;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function toggleAdminPanel() {
    const modal = document.getElementById('admin-modal');
    if (modal) {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        if (modal.style.display === 'block') {
            renderAdminTabs();
            showAdminSection('properties');
        }
    }
    updateExportCode();
}

function renderAdminTabs() {
    const container = document.getElementById('admin-tabs');
    if (!container) return;
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
            <button class="admin-tab-btn" onclick="showAdminSection('hero_slider')"><i class="fas fa-images"></i> <span>Banner & Hero</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('properties')"><i class="fas fa-home"></i> <span>Inmuebles</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('projects')"><i class="fas fa-building"></i> <span>Proyectos</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('categories')"><i class="fas fa-tags"></i> <span>Categorías</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('nosotros')"><i class="fas fa-bullseye"></i> <span>Misión & Manifiesto</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('six_cs')"><i class="fas fa-gem"></i> <span>Las 6 C's ONE</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('expansion')"><i class="fas fa-globe-americas"></i> <span>Expansión Mundial</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('agents')"><i class="fas fa-user-tie"></i> <span>Agentes ONE</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('news')"><i class="fas fa-newspaper"></i> <span>Noticias</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('testimonials')"><i class="fas fa-comment-dots"></i> <span>Testimonios</span></button>
            <button class="admin-tab-btn" onclick="showAdminSection('contact_footer')"><i class="fas fa-phone-alt"></i> <span>Contacto & Redes</span></button>
        </div>
    `;
}

function showAdminSection(type) {
    const container = document.getElementById('tab-content');
    if (!container) return;

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        const onclickAttr = btn.getAttribute('onclick') || btn.onclick?.toString() || '';
        if (onclickAttr.includes(`'${type}'`)) btn.classList.add('active');
    });

    let html = '';
    const c = MIS_CONFIGURACIONES;

    if (type === 'hero_slider') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-sliders-h"></i> Portada Hero & Slider de Fondo</div>
            <button class="cms-btn-create" onclick="editSlider(null)"><i class="fas fa-plus"></i> Nueva Foto Fondo</button>
        </div>

        <div class="cms-card">
            <div class="cms-card-title" style="margin-bottom:14px; font-size:0.88rem;"><i class="fas fa-heading"></i> Textos del Banner Principal</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                <div style="grid-column:span 2;">
                    <label><i class="fas fa-signature"></i> Título Principal (acepta etiquetas &lt;span&gt;)</label>
                    <input type="text" id="cfg_hero_title" value="${c.hero_titulo}">
                </div>
                <div style="grid-column:span 2;">
                    <label><i class="fas fa-align-left"></i> Subtítulo Descriptivo</label>
                    <textarea id="cfg_hero_desc" style="height:60px;">${c.hero_desc}</textarea>
                </div>
                <div>
                    <label><i class="fas fa-mouse-pointer"></i> Texto del Botón Principal</label>
                    <input type="text" id="cfg_hero_btn" value="${c.hero_btn_text || 'BUSCAR PROPIEDADES'}">
                </div>
            </div>
            <div style="margin-top:16px; text-align:right;">
                <button class="cms-btn-primary" onclick="saveHeroTexts()"><i class="fas fa-check"></i> GUARDAR TEXTOS HERO</button>
            </div>
        </div>

        <div class="cms-card">
            <div class="cms-card-title" style="margin-bottom:14px; font-size:0.88rem;"><i class="fas fa-images"></i> Galería de Fotos del Fondo (${MIS_SLIDES.length})</div>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:12px;">
                ${MIS_SLIDES.map(s => `
                    <div class="cms-photo-card">
                        <img src="${s.url}" style="width:100%; height:85px; object-fit:cover; display:block;">
                        <div style="padding:6px 10px; display:flex; justify-content:space-between; align-items:center; background:#0f0f14; border-top:1px solid rgba(255,255,255,0.06);">
                            <span style="font-size:0.72rem; color:#888; font-weight:600;">#${s.orden || 1}</span>
                            <div style="display:flex; gap:5px;">
                                <button class="cms-btn-icon-edit" onclick="editSlider(${s.id})" title="Editar"><i class="fas fa-pencil-alt" style="font-size:0.75rem;"></i></button>
                                <button class="cms-btn-icon-delete" onclick="deleteSlider(${s.id})" title="Eliminar"><i class="fas fa-trash" style="font-size:0.75rem;"></i></button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    } else if (type === 'properties') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-home"></i> Catálogo de Inmuebles <span class="admin-badge-v2">${MIS_PROPIEDADES.length} Disponibles</span></div>
            <button class="cms-btn-create" onclick="editProperty(null)"><i class="fas fa-plus"></i> Nueva Propiedad</button>
        </div>
        <div style="display:grid; gap:8px; max-height:480px; overflow-y:auto; padding-right:4px;">
            ${MIS_PROPIEDADES.map(p => {
                const imgArr = typeof p.imagenes === 'string' ? JSON.parse(p.imagenes) : (p.imagenes || []);
                const cover = imgArr.length > 0 ? imgArr[0] : '';
                return `
                <div class="cms-list-row">
                    <div style="display:flex; align-items:center; gap:14px;">
                        ${cover ? `<img src="${cover}" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1px solid rgba(199,170,94,0.3);">` : '<div style="width:48px;height:48px;background:#222;border-radius:8px;"></div>'}
                        <div>
                            <span style="display:block; font-weight:700; font-size:0.92rem; color:#fff;">${p.titulo}</span>
                            <div style="display:flex; gap:8px; align-items:center; margin-top:3px;">
                                <span style="font-size:0.72rem; color:var(--primary-color); font-weight:700; background:rgba(199,170,94,0.12); padding:2px 8px; border-radius:4px;">${p.tipo}</span>
                                <span style="font-size:0.75rem; color:#bbb; font-weight:600;">${p.precio}</span>
                                <span style="font-size:0.72rem; color:#777;"><i class="fas fa-map-marker-alt"></i> ${p.ubicacion || 'Bolivia'}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="cms-btn-icon-edit" onclick="editProperty(${p.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="cms-btn-icon-delete" onclick="deleteProperty(${p.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    } else if (type === 'projects') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-building"></i> Proyectos & Urbanizaciones <span class="admin-badge-v2">${MIS_PROYECTOS.length}</span></div>
            <button class="cms-btn-create" onclick="editProject(null)"><i class="fas fa-plus"></i> Nuevo Proyecto</button>
        </div>
        <div style="display:grid; gap:10px;">
            ${MIS_PROYECTOS.map(p => `
                <div class="cms-list-row" style="padding:14px 16px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <img src="${p.imagen}" style="width:75px; height:52px; object-fit:cover; border-radius:8px; border:1px solid rgba(199,170,94,0.35);">
                        <div>
                            <span style="display:block; font-weight:700; font-size:0.98rem; color:#fff;">${p.titulo}</span>
                            <div style="display:flex; gap:8px; align-items:center; margin-top:4px;">
                                <span style="font-size:0.7rem; color:var(--primary-color); background:rgba(199,170,94,0.12); padding:2px 8px; border-radius:4px; font-weight:700;">${p.tag}</span>
                                <span style="font-size:0.78rem; color:#ccc; font-weight:600;">${p.precio}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="cms-btn-icon-edit" onclick="editProject(${p.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="cms-btn-icon-delete" onclick="deleteProject(${p.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    } else if (type === 'categories') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-tags"></i> Categorías Maestras del Menú</div>
        </div>
        <div style="display:grid; gap:10px;">
            ${MIS_CATEGORIAS.map(c => `
                <div class="cms-list-row" style="padding:14px 16px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <img src="${c.imagen}" style="width:65px; height:45px; object-fit:cover; border-radius:8px; border:1px solid rgba(199,170,94,0.3);">
                        <div>
                            <span style="display:block; font-weight:700; font-size:0.95rem; color:#fff;">${c.titulo}</span>
                            <span style="font-size:0.78rem; color:#888;">${c.descripcion.substring(0, 60)}...</span>
                        </div>
                    </div>
                    <button class="cms-btn-icon-edit" onclick="editCategory('${c.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                </div>
            `).join('')}
        </div>`;
    } else if (type === 'nosotros') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-bullseye"></i> Misión, Visión & Manifiesto Corporativo</div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
            <div class="cms-card">
                <div class="cms-card-title" style="margin-bottom:12px; font-size:0.88rem;"><i class="fas fa-bullseye"></i> Declaración de Misión</div>
                <label>Título de la Misión</label>
                <input type="text" id="nos_mis_tit" value="${c.mision_titulo}" style="margin-bottom:10px;">
                <label>Texto Detallado</label>
                <textarea id="nos_mis_txt" style="height:90px;">${c.mision_texto}</textarea>
            </div>

            <div class="cms-card">
                <div class="cms-card-title" style="margin-bottom:12px; font-size:0.88rem;"><i class="fas fa-eye"></i> Declaración de Visión</div>
                <label>Título de la Visión</label>
                <input type="text" id="nos_vis_tit" value="${c.vision_titulo}" style="margin-bottom:10px;">
                <label>Texto Detallado</label>
                <textarea id="nos_vis_txt" style="height:90px;">${c.vision_texto}</textarea>
            </div>

            <div class="cms-card" style="grid-column: span 2;">
                <div class="cms-card-title" style="margin-bottom:12px; font-size:0.88rem;"><i class="fas fa-scroll"></i> Manifiesto ONE & Propósito</div>
                <label>Título del Manifiesto</label>
                <input type="text" id="nos_man_tit" value="${c.manifesto_titulo}" style="margin-bottom:10px;">
                <label>Cuerpo del Manifiesto (acepta saltos de línea y HTML)</label>
                <textarea id="nos_man_txt" style="height:120px;">${c.manifesto_texto}</textarea>
            </div>
        </div>

        <div style="margin-top:14px; text-align:right;">
            <button class="cms-btn-primary" onclick="saveNosotros()"><i class="fas fa-save"></i> GUARDAR CAMBIOS NOSOTROS</button>
        </div>`;
    } else if (type === 'six_cs') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-gem"></i> Las 6 C's de Cultura ONE <span class="admin-badge-v2">${MIS_SEIS_CS.length} Pilares</span></div>
            <button class="cms-btn-create" onclick="editSixCs(null)"><i class="fas fa-plus"></i> Nueva C</button>
        </div>
        <div style="display:grid; gap:10px;">
            ${MIS_SEIS_CS.map(item => `
                <div class="cms-list-row" style="padding:14px 18px;">
                    <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-weight:800; color:var(--primary-color); font-size:1rem;">${item.pilar}</span>
                            <span style="color:#666;">/</span>
                            <span style="color:#eee; font-weight:600; font-size:0.9rem;">${item.subtitulo}</span>
                        </div>
                        <p style="font-size:0.82rem; color:#aaa; margin-top:5px; line-height:1.4;">${item.descripcion}</p>
                    </div>
                    <div style="display:flex; gap:6px; margin-left:16px;">
                        <button class="cms-btn-icon-edit" onclick="editSixCs(${item.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="cms-btn-icon-delete" onclick="deleteSixCs(${item.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    } else if (type === 'expansion') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-globe-americas"></i> Expansión Mundial ONE <span class="admin-badge-v2">${MIS_EXPANSION.length} Regiones</span></div>
            <button class="cms-btn-create" onclick="editExpansion(null)"><i class="fas fa-plus"></i> Nueva Región</button>
        </div>

        <div class="cms-card">
            <div class="cms-card-title" style="margin-bottom:12px; font-size:0.88rem;"><i class="fas fa-heading"></i> Encabezados de la Sección</div>
            <label>Título Principal</label>
            <input type="text" id="exp_head_tit" value="${c.expansion_titulo}" style="margin-bottom:10px;">
            <label>Subtítulo Explicativo</label>
            <textarea id="exp_head_sub" style="height:55px;">${c.expansion_subtitulo}</textarea>
            <div style="margin-top:12px; text-align:right;">
                <button class="cms-btn-primary" onclick="saveExpansionHeaders()" style="padding:8px 16px; font-size:0.8rem;"><i class="fas fa-check"></i> GUARDAR ENCABEZADOS</button>
            </div>
        </div>

        <div style="display:grid; gap:8px;">
            ${MIS_EXPANSION.map(e => `
                <div class="cms-list-row" style="padding:12px 16px;">
                    <div>
                        <span style="font-weight:700; font-size:0.95rem; color:#fff;"><i class="fas fa-map-pin" style="color:var(--primary-color); margin-right:6px;"></i>${e.region}</span>
                        <p style="font-size:0.8rem; color:#aaa; margin-top:3px;">${e.descripcion}</p>
                    </div>
                    <div style="display:flex; gap:6px; margin-left:14px;">
                        <button class="cms-btn-icon-edit" onclick="editExpansion(${e.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="cms-btn-icon-delete" onclick="deleteExpansion(${e.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    } else if (type === 'agents') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-user-tie"></i> Agentes Inmobiliarios (e-Realtors) <span class="admin-badge-v2">${MIS_AGENTES.length}</span></div>
            <button class="cms-btn-create" onclick="editAgent(null)"><i class="fas fa-plus"></i> Nuevo Agente</button>
        </div>
        <div style="display:grid; gap:8px;">
            ${MIS_AGENTES.map(a => `
                <div class="cms-list-row" style="padding:12px 16px;">
                    <div style="display:flex; align-items:center; gap:14px;">
                        <img src="${a.imagen}" style="width:46px; height:46px; object-fit:cover; border-radius:50%; border:2px solid var(--primary-color);">
                        <div>
                            <span style="display:block; font-weight:700; font-size:0.92rem; color:#fff;">${a.nombre}</span>
                            <div style="display:flex; gap:8px; align-items:center; margin-top:2px;">
                                <span style="font-size:0.72rem; color:var(--primary-color); font-weight:600;">${a.especialidad}</span>
                                <span style="font-size:0.75rem; color:#888;">${a.telefono}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="cms-btn-icon-edit" onclick="editAgent(${a.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="cms-btn-icon-delete" onclick="deleteAgent(${a.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    } else if (type === 'news') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-newspaper"></i> Noticias & Blog <span class="admin-badge-v2">${MIS_NOTICIAS.length} Artículos</span></div>
            <button class="cms-btn-create" onclick="editNews(null)"><i class="fas fa-plus"></i> Nueva Noticia</button>
        </div>
        <div style="display:grid; gap:8px;">
            ${MIS_NOTICIAS.map(n => `
                <div class="cms-list-row" style="padding:12px 16px;">
                    <div>
                        <span style="display:block; font-weight:700; font-size:0.92rem; color:#fff;">${n.titulo}</span>
                        <div style="display:flex; gap:8px; align-items:center; margin-top:3px;">
                            <span style="font-size:0.7rem; color:var(--primary-color); background:rgba(199,170,94,0.12); padding:2px 8px; border-radius:4px; font-weight:700;">${n.categoria}</span>
                            <span style="font-size:0.75rem; color:#888;">${n.fecha}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="cms-btn-icon-edit" onclick="editNews(${n.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="cms-btn-icon-delete" onclick="deleteNews(${n.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    } else if (type === 'testimonials') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-comment-dots"></i> Testimonios & Reseñas <span class="admin-badge-v2">${MIS_TESTIMONIOS.length}</span></div>
            <button class="cms-btn-create" onclick="editTestimonial(null)"><i class="fas fa-plus"></i> Nuevo Testimonio</button>
        </div>
        <div style="display:grid; gap:8px;">
            ${MIS_TESTIMONIOS.map(t => `
                <div class="cms-list-row" style="padding:12px 16px;">
                    <div style="display:flex; align-items:center; gap:14px;">
                        <img src="${t.imagen}" style="width:42px; height:42px; object-fit:cover; border-radius:50%; border:1px solid var(--primary-color);">
                        <div>
                            <span style="display:block; font-weight:700; font-size:0.9rem; color:#fff;">${t.nombre}</span>
                            <span style="font-size:0.78rem; color:#999;">"${t.texto.substring(0, 55)}..."</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button class="cms-btn-icon-edit" onclick="editTestimonial(${t.id})" title="Editar"><i class="fas fa-edit"></i></button>
                        <button class="cms-btn-icon-delete" onclick="deleteTestimonial(${t.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    } else if (type === 'contact_footer') {
        html = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-phone-alt"></i> Información de Contacto, Redes Sociales & Footer</div>
        </div>
        
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
            <div class="cms-card">
                <div class="cms-card-title" style="margin-bottom:12px; font-size:0.88rem;"><i class="fas fa-address-book"></i> Canales Directos</div>
                <label>Teléfono Oficial (WhatsApp Chatbot)</label>
                <input type="text" id="cfg_phone" value="${c.contacto_telefono}" style="margin-bottom:10px;">
                <label>Email Corporativo</label>
                <input type="text" id="cfg_email" value="${c.contacto_email}" style="margin-bottom:10px;">
                <label>Dirección Física</label>
                <input type="text" id="cfg_address" value="${c.contacto_direccion}">
            </div>

            <div class="cms-card">
                <div class="cms-card-title" style="margin-bottom:12px; font-size:0.88rem;"><i class="fas fa-share-alt"></i> Redes Sociales</div>
                <label><i class="fab fa-facebook-f" style="color:#1877f2;"></i> Facebook</label>
                <input type="text" id="cfg_fb" value="${c.social_facebook || ''}" style="margin-bottom:8px;">
                <label><i class="fab fa-instagram" style="color:#e4405f;"></i> Instagram</label>
                <input type="text" id="cfg_ig" value="${c.social_instagram || ''}" style="margin-bottom:8px;">
                <label><i class="fab fa-tiktok" style="color:#ee1d52;"></i> TikTok</label>
                <input type="text" id="cfg_tk" value="${c.social_tiktok || ''}" style="margin-bottom:8px;">
                <label><i class="fab fa-linkedin-in" style="color:#0a66c2;"></i> LinkedIn</label>
                <input type="text" id="cfg_li" value="${c.social_linkedin || ''}">
            </div>

            <div class="cms-card" style="grid-column: span 2;">
                <div class="cms-card-title" style="margin-bottom:12px; font-size:0.88rem;"><i class="fas fa-feather-alt"></i> Texto Descriptivo Footer</div>
                <label>Descripción Institucional del Pie de Página</label>
                <textarea id="cfg_footer_txt" style="height:65px;">${c.footer_texto}</textarea>
            </div>
        </div>

        <div style="margin-top:14px; text-align:right;">
            <button class="cms-btn-primary" onclick="saveContactFooter()"><i class="fas fa-save"></i> GUARDAR CONTACTO & FOOTER</button>
        </div>`;
    }

    container.innerHTML = html;
}

// Handlers de Guardado
async function saveHeroTexts() {
    MIS_CONFIGURACIONES.hero_titulo = document.getElementById('cfg_hero_title')?.value || MIS_CONFIGURACIONES.hero_titulo;
    MIS_CONFIGURACIONES.hero_desc = document.getElementById('cfg_hero_desc')?.value || MIS_CONFIGURACIONES.hero_desc;
    MIS_CONFIGURACIONES.hero_btn_text = document.getElementById('cfg_hero_btn')?.value || MIS_CONFIGURACIONES.hero_btn_text;
    await persistCMSData();
}

async function saveNosotros() {
    MIS_CONFIGURACIONES.mision_titulo = document.getElementById('nos_mis_tit')?.value || MIS_CONFIGURACIONES.mision_titulo;
    MIS_CONFIGURACIONES.mision_texto = document.getElementById('nos_mis_txt')?.value || MIS_CONFIGURACIONES.mision_texto;
    MIS_CONFIGURACIONES.vision_titulo = document.getElementById('nos_vis_tit')?.value || MIS_CONFIGURACIONES.vision_titulo;
    MIS_CONFIGURACIONES.vision_texto = document.getElementById('nos_vis_txt')?.value || MIS_CONFIGURACIONES.vision_texto;
    MIS_CONFIGURACIONES.manifesto_titulo = document.getElementById('nos_man_tit')?.value || MIS_CONFIGURACIONES.manifesto_titulo;
    MIS_CONFIGURACIONES.manifesto_texto = document.getElementById('nos_man_txt')?.value || MIS_CONFIGURACIONES.manifesto_texto;
    await persistCMSData();
}

async function saveExpansionHeaders() {
    MIS_CONFIGURACIONES.expansion_titulo = document.getElementById('exp_head_tit')?.value || MIS_CONFIGURACIONES.expansion_titulo;
    MIS_CONFIGURACIONES.expansion_subtitulo = document.getElementById('exp_head_sub')?.value || MIS_CONFIGURACIONES.expansion_subtitulo;
    await persistCMSData();
}

async function saveContactFooter() {
    MIS_CONFIGURACIONES.contacto_telefono = document.getElementById('cfg_phone')?.value || MIS_CONFIGURACIONES.contacto_telefono;
    MIS_CONFIGURACIONES.contacto_email = document.getElementById('cfg_email')?.value || MIS_CONFIGURACIONES.contacto_email;
    MIS_CONFIGURACIONES.contacto_direccion = document.getElementById('cfg_address')?.value || MIS_CONFIGURACIONES.contacto_direccion;
    MIS_CONFIGURACIONES.social_facebook = document.getElementById('cfg_fb')?.value || '';
    MIS_CONFIGURACIONES.social_instagram = document.getElementById('cfg_ig')?.value || '';
    MIS_CONFIGURACIONES.social_tiktok = document.getElementById('cfg_tk')?.value || '';
    MIS_CONFIGURACIONES.social_linkedin = document.getElementById('cfg_li')?.value || '';
    MIS_CONFIGURACIONES.footer_texto = document.getElementById('cfg_footer_txt')?.value || MIS_CONFIGURACIONES.footer_texto;
    await persistCMSData();
}

// 6 C's Handlers
function editSixCs(id) {
    const item = id ? MIS_SEIS_CS.find(i => i.id === id) : { pilar: '', subtitulo: '', descripcion: '' };
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-gem"></i> ${id ? 'Editar' : 'Nueva'} C de Cultura ONE</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <label><i class="fas fa-tag"></i> Nombre del Pilar (ej: Coolture, Coaching)</label>
            <input type="text" id="six_pilar" value="${item.pilar}" style="margin-bottom:12px;">
            <label><i class="fas fa-language"></i> Subtítulo / Traducción</label>
            <input type="text" id="six_sub" value="${item.subtitulo}" style="margin-bottom:12px;">
            <label><i class="fas fa-align-left"></i> Descripción del Pilar</label>
            <textarea id="six_desc" style="height:85px; margin-bottom:16px;">${item.descripcion}</textarea>
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('six_cs')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveSixCs(${id})"><i class="fas fa-save"></i> GUARDAR PILAR</button>
            </div>
        </div>
    `;
}

async function saveSixCs(id) {
    const pilar = document.getElementById('six_pilar')?.value.trim();
    const subtitulo = document.getElementById('six_sub')?.value.trim();
    const descripcion = document.getElementById('six_desc')?.value.trim();
    if (!pilar) { alert("Ingresa el nombre del pilar"); return; }
    if (id) {
        const item = MIS_SEIS_CS.find(i => i.id === id);
        if (item) { item.pilar = pilar; item.subtitulo = subtitulo; item.descripcion = descripcion; }
    } else {
        const nextId = MIS_SEIS_CS.length ? Math.max(...MIS_SEIS_CS.map(i => i.id || 0)) + 1 : 1;
        MIS_SEIS_CS.push({ id: nextId, pilar, subtitulo, descripcion });
    }
    await persistCMSData();
    showAdminSection('six_cs');
}

async function deleteSixCs(id) {
    if (!confirm("¿Eliminar este pilar?")) return;
    MIS_SEIS_CS = MIS_SEIS_CS.filter(i => i.id !== id);
    await persistCMSData();
    showAdminSection('six_cs');
}

// Expansión Handlers
function editExpansion(id) {
    const item = id ? MIS_EXPANSION.find(i => i.id === id) : { region: '', descripcion: '', icono: 'assets/gold_globe_icon.png' };
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-globe"></i> ${id ? 'Editar' : 'Nueva'} Región de Expansión</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <label><i class="fas fa-map-pin"></i> Nombre de la Región (ej: Sudamérica, Europa)</label>
            <input type="text" id="exp_region" value="${item.region}" style="margin-bottom:12px;">
            <label><i class="fas fa-align-left"></i> Descripción del Mercado</label>
            <textarea id="exp_desc" style="height:85px; margin-bottom:16px;">${item.descripcion}</textarea>
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('expansion')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveExpansion(${id})"><i class="fas fa-save"></i> GUARDAR REGIÓN</button>
            </div>
        </div>
    `;
}

async function saveExpansion(id) {
    const region = document.getElementById('exp_region')?.value.trim();
    const descripcion = document.getElementById('exp_desc')?.value.trim();
    if (!region) { alert("Ingresa el nombre de la región"); return; }
    if (id) {
        const item = MIS_EXPANSION.find(i => i.id === id);
        if (item) { item.region = region; item.descripcion = descripcion; }
    } else {
        const nextId = MIS_EXPANSION.length ? Math.max(...MIS_EXPANSION.map(i => i.id || 0)) + 1 : 1;
        MIS_EXPANSION.push({ id: nextId, region, descripcion, icono: 'assets/gold_globe_icon.png' });
    }
    await persistCMSData();
    showAdminSection('expansion');
}

async function deleteExpansion(id) {
    if (!confirm("¿Eliminar esta región?")) return;
    MIS_EXPANSION = MIS_EXPANSION.filter(i => i.id !== id);
    await persistCMSData();
    showAdminSection('expansion');
}

// Utilities for Image Compression
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/webp', 0.6);
            callback(dataUrl);
        }
    }
}

function handleImageUpload(inputEl, hiddenInputId, previewContainerId, isMultiple = false) {
    const files = inputEl.files;
    if (!files || files.length === 0) return;

    const hiddenInput = document.getElementById(hiddenInputId);
    const previewContainer = document.getElementById(previewContainerId);
    if (!isMultiple) {
        hiddenInput.value = '';
        previewContainer.innerHTML = '';
    }

    let currentImgs = (hiddenInput.value && hiddenInput.value.trim() !== '')
        ? hiddenInput.value.split('|||').map(s => s.trim()).filter(s => s !== '')
        : [];

    Array.from(files).forEach(file => {
        compressImage(file, (base64) => {
            currentImgs.push(base64);
            hiddenInput.value = currentImgs.join('|||');
            previewContainer.innerHTML = currentImgs.map(src =>
                `<img src="${src}" style="width:75px; height:75px; object-fit:cover; border-radius:8px; margin:4px; border:2px solid var(--primary-color); cursor:pointer; transition:0.2s;" title="Click para quitar" onclick="removeImgFromPreview(this, '${hiddenInputId}', '${previewContainerId}')">`
            ).join('');
        });
    });
}

function removeImgFromPreview(imgEl, hiddenInputId, previewContainerId) {
    const hiddenInput = document.getElementById(hiddenInputId);
    const previewContainer = document.getElementById(previewContainerId);
    const src = imgEl.src;
    let imgs = hiddenInput.value.split('|||').map(s => s.trim()).filter(s => s !== '' && s !== src);
    hiddenInput.value = imgs.join('|||');
    previewContainer.innerHTML = imgs.map(s =>
        `<img src="${s}" style="width:75px; height:75px; object-fit:cover; border-radius:8px; margin:4px; border:2px solid var(--primary-color); cursor:pointer;" title="Click para quitar" onclick="removeImgFromPreview(this, '${hiddenInputId}', '${previewContainerId}')">`
    ).join('');
}

function editSlider(id) {
    const s = id ? MIS_SLIDES.find(i => i.id === id) : { url: '', orden: MIS_SLIDES.length + 1 };
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-image"></i> ${id ? 'Editar' : 'Nueva'} Foto de Portada</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <label class="cms-upload-dropzone">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>HACER CLIC PARA SUBIR FOTO</span>
                <p style="font-size:0.75rem; color:#888; margin-top:4px;">Formatos JPG, PNG, WEBP optimizados automáticamente</p>
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'sl1', 'preview-sl1')" style="display:none;">
            </label>
            <div id="preview-sl1" style="margin-bottom:15px; text-align:center;">${s.url ? `<img src="${s.url}" style="max-width:100%; height:160px; object-fit:cover; border-radius:10px; border:2px solid var(--primary-color);">` : ''}</div>
            
            <details style="margin-bottom:15px; background:rgba(0,0,0,0.2); padding:10px 14px; border-radius:8px;">
                <summary style="color:#aaa; font-size:0.78rem; cursor:pointer;"><i class="fas fa-link"></i> Opción alternativa (pegar URL)</summary>
                <input type="text" placeholder="Pegar URL de la imagen..." value="${s.url}" oninput="document.getElementById('sl1').value = this.value; document.getElementById('preview-sl1').innerHTML = '<img src=\\''+this.value+'\\' style=\\'max-width:100%; height:160px; object-fit:cover; border-radius:10px; border:2px solid var(--primary-color);\\'>';" style="margin-top:8px;">
            </details>
            <input type="hidden" id="sl1" value="${s.url}">
            
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('hero_slider')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveSlider(${id})"><i class="fas fa-save"></i> GUARDAR FOTO</button>
            </div>
        </div>
    `;
}

async function saveSlider(id) {
    const url = document.getElementById('sl1').value;
    if (!url) { alert('Por favor sube una foto o ingresa una URL.'); return; }
    if (id) {
        const s = MIS_SLIDES.find(i => i.id === id);
        if (s) s.url = url;
    } else {
        const nextId = MIS_SLIDES.length ? Math.max(...MIS_SLIDES.map(i => i.id || 0)) + 1 : 1;
        MIS_SLIDES.push({ id: nextId, url, orden: MIS_SLIDES.length + 1 });
    }
    await persistCMSData();
    showAdminSection('hero_slider');
}

async function deleteSlider(id) {
    if (!confirm('¿Borrar esta foto de portada?')) return;
    MIS_SLIDES = MIS_SLIDES.filter(s => s.id !== id);
    await persistCMSData();
    showAdminSection('hero_slider');
}

function editCategory(id) {
    const c = id ? MIS_CATEGORIAS.find(i => i.id === id) : { titulo: '', descripcion: '', imagen: '' };
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-tag"></i> ${id ? 'Editar' : 'Nueva'} Categoría</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <label>Título (ej: Propiedades en &lt;span&gt;Venta&lt;/span&gt;)</label>
            <input type="text" id="cat1" value="${c.titulo}" style="margin-bottom:12px;">
            <label>Descripción breve</label>
            <textarea id="cat2" style="height:65px; margin-bottom:14px;">${c.descripcion}</textarea>
            
            <label class="cms-upload-dropzone">
                <i class="fas fa-image"></i>
                <span>CAMBIAR IMAGEN DE CABECERA</span>
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'cat3', 'preview-cat3')" style="display:none;">
            </label>
            <div id="preview-cat3" style="text-align:center; margin-bottom:15px;">
                ${c.imagen ? `<img src="${c.imagen}" style="height:110px; border-radius:10px; border:2px solid var(--primary-color);">` : ''}
            </div>
            <input type="hidden" id="cat3" value="${c.imagen}">
            
            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('categories')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveCategory('${id}')"><i class="fas fa-save"></i> GUARDAR CATEGORÍA</button>
            </div>
        </div>
    `;
}

async function saveCategory(id) {
    const cat = MIS_CATEGORIAS.find(i => i.id === id);
    if (cat) {
        cat.titulo = document.getElementById('cat1').value;
        cat.descripcion = document.getElementById('cat2').value;
        cat.imagen = document.getElementById('cat3').value;
        await persistCMSData();
    }
    showAdminSection('categories');
}

function editNews(id) {
    const n = id ? MIS_NOTICIAS.find(i => i.id === id) : { titulo: '', fecha: '', imagen: '', descripcion: '', categoria: 'NOTICIAS' };
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-newspaper"></i> ${id ? 'Editar' : 'Nueva'} Noticia</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                <div>
                    <label>Título del Artículo</label>
                    <input type="text" id="n1" value="${n.titulo}">
                </div>
                <div>
                    <label>Fecha de Publicación (ej: 25 Abr 2026)</label>
                    <input type="text" id="n2" value="${n.fecha}">
                </div>
            </div>
            <label class="cms-upload-dropzone">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>SUBIR IMAGEN DEL ARTÍCULO</span>
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'n3', 'preview-n3')" style="display:none;">
            </label>
            <div id="preview-n3" style="margin-bottom:14px; text-align:center;">${n.imagen ? `<img src="${n.imagen}" style="max-width:100%; height:150px; object-fit:cover; border-radius:10px; border:2px solid var(--primary-color);">` : ''}</div>
            <input type="hidden" id="n3" value="${n.imagen}">
            
            <label>Descripción / Contenido del Resumen</label>
            <textarea id="n4" style="height:90px; margin-bottom:16px;">${n.descripcion}</textarea>
            
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('news')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveNews(${id})"><i class="fas fa-save"></i> GUARDAR NOTICIA</button>
            </div>
        </div>
    `;
}

async function saveNews(id) {
    const titulo = document.getElementById('n1').value;
    const fecha = document.getElementById('n2').value;
    const imagen = document.getElementById('n3').value;
    const descripcion = document.getElementById('n4').value;
    if (id) {
        const n = MIS_NOTICIAS.find(i => i.id === id);
        if (n) { n.titulo = titulo; n.fecha = fecha; n.imagen = imagen; n.descripcion = descripcion; }
    } else {
        const nextId = MIS_NOTICIAS.length ? Math.max(...MIS_NOTICIAS.map(i => i.id || 0)) + 1 : 1;
        MIS_NOTICIAS.push({ id: nextId, titulo, fecha, imagen, descripcion, categoria: 'TENDENCIAS' });
    }
    await persistCMSData();
    showAdminSection('news');
}

async function deleteNews(id) {
    if (!confirm('¿Borrar esta noticia?')) return;
    MIS_NOTICIAS = MIS_NOTICIAS.filter(i => i.id !== id);
    await persistCMSData();
    showAdminSection('news');
}

function editTestimonial(id) {
    const t = id ? MIS_TESTIMONIOS.find(i => i.id === id) : { nombre: '', texto: '', imagen: '' };
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-comment-dots"></i> ${id ? 'Editar' : 'Nuevo'} Testimonio</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <label>Nombre del Cliente</label>
            <input type="text" id="t1" value="${t.nombre}" style="margin-bottom:12px;">
            
            <label class="cms-upload-dropzone">
                <i class="fas fa-user-circle"></i>
                <span>SUBIR FOTO DEL CLIENTE</span>
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 't3', 'preview-t3')" style="display:none;">
            </label>
            <div id="preview-t3" style="margin-bottom:12px; text-align:center;">${t.imagen ? `<img src="${t.imagen}" style="width:80px; height:80px; object-fit:cover; border-radius:50%; border:2px solid var(--primary-color);">` : ''}</div>
            <input type="hidden" id="t3" value="${t.imagen}">
            
            <label>Texto de la Reseña</label>
            <textarea id="t2" style="height:85px; margin-bottom:16px;">${t.texto}</textarea>
            
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('testimonials')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveTestimonial(${id})"><i class="fas fa-save"></i> GUARDAR TESTIMONIO</button>
            </div>
        </div>
    `;
}

async function saveTestimonial(id) {
    const nombre = document.getElementById('t1').value;
    const texto = document.getElementById('t2').value;
    const imagen = document.getElementById('t3').value;
    if (id) {
        const t = MIS_TESTIMONIOS.find(i => i.id === id);
        if (t) { t.nombre = nombre; t.texto = texto; t.imagen = imagen; }
    } else {
        const nextId = MIS_TESTIMONIOS.length ? Math.max(...MIS_TESTIMONIOS.map(i => i.id || 0)) + 1 : 1;
        MIS_TESTIMONIOS.push({ id: nextId, nombre, texto, imagen, estrellas: 5 });
    }
    await persistCMSData();
    showAdminSection('testimonials');
}

async function deleteTestimonial(id) {
    if (!confirm('¿Borrar este testimonio?')) return;
    MIS_TESTIMONIOS = MIS_TESTIMONIOS.filter(i => i.id !== id);
    await persistCMSData();
    showAdminSection('testimonials');
}

function editProperty(id) {
    const raw = id ? MIS_PROPIEDADES.find(i => i.id === id) : null;
    const p = raw ? {
        ...raw,
        imagenes: typeof raw.imagenes === 'string' ? JSON.parse(raw.imagenes) : (raw.imagenes || [])
    } : { titulo: '', precio: '', imagenes: [], tipo: 'Casa en Venta', habitaciones: 0, banos: 0, area: '', descripcion_larga: '', ubicacion: '' };
    const container = document.getElementById('tab-content');
    const tipos = ['Casa en Venta', 'Casa en Alquiler', 'Casa en Anticrético', 'Departamento en Venta', 'Departamento en Alquiler', 'Departamento en Anticrético', 'Terreno en Venta', 'Local Comercial en Venta', 'Local Comercial en Alquiler', 'Oficina en Alquiler'];
    const imgPreview = p.imagenes.map(img =>
        `<img src="${img}" style="width:75px; height:75px; object-fit:cover; border-radius:8px; margin:4px; border:2px solid var(--primary-color); cursor:pointer;" title="Click para quitar" onclick="removeImgFromPreview(this, 'f3', 'preview-f3')">`
    ).join('');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-home"></i> ${id ? 'Editar' : 'Nueva'} Propiedad</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                <div>
                    <label>Título del Inmueble</label>
                    <input type="text" id="f1" value="${p.titulo}" placeholder="ej: Casa Moderna en Equipetrol">
                </div>
                <div>
                    <label>Precio (USD o Bs)</label>
                    <input type="text" id="f2" value="${p.precio}" placeholder="ej: $150,000 o $800/mes">
                </div>
                <div>
                    <label>Tipo de Operación</label>
                    <select id="f4">
                        ${tipos.map(t => `<option ${p.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label>Área Construida / Terreno</label>
                    <input type="text" id="f7" value="${p.area}" placeholder="ej: 250 m²">
                </div>
                <div>
                    <label>Ubicación / Zona</label>
                    <input type="text" id="f_loc" value="${p.ubicacion || ''}" placeholder="ej: Equipetrol, Santa Cruz">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                    <div>
                        <label>Habitaciones</label>
                        <input type="number" id="f5" value="${p.habitaciones}" min="0">
                    </div>
                    <div>
                        <label>Baños</label>
                        <input type="number" id="f6" value="${p.banos}" min="0">
                    </div>
                </div>
            </div>

            <label class="cms-upload-dropzone">
                <i class="fas fa-images"></i>
                <span>SUBIR FOTOS DE LA PROPIEDAD (Selección Múltiple)</span>
                <p style="font-size:0.75rem; color:#888; margin-top:4px;">Haz clic sobre cualquier foto abajo para eliminarla</p>
                <input type="file" accept="image/*" multiple onchange="handleImageUpload(this, 'f3', 'preview-f3', true)" style="display:none;">
            </label>
            
            <div id="preview-f3" style="display:flex; flex-wrap:wrap; justify-content:center; min-height:45px; padding:10px; background:#121217; border-radius:10px; border:1px dashed rgba(255,255,255,0.1); margin-bottom:12px;">
                ${imgPreview}
            </div>
            <input type="hidden" id="f3" value="${p.imagenes.join('|||')}">
            
            <label>Descripción Detallada del Inmueble</label>
            <textarea id="f8" style="height:95px; margin-bottom:16px;">${p.descripcion_larga}</textarea>
            
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('properties')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveProperty(${id})"><i class="fas fa-save"></i> GUARDAR PROPIEDAD</button>
            </div>
        </div>
    `;
}

async function saveProperty(id) {
    const imgs = document.getElementById('f3').value.split('|||').map(s => s.trim()).filter(s => s !== '');
    const propData = {
        titulo: document.getElementById('f1').value,
        precio: document.getElementById('f2').value,
        imagenes: imgs,
        tipo: document.getElementById('f4').value,
        habitaciones: parseInt(document.getElementById('f5').value) || 0,
        banos: parseInt(document.getElementById('f6').value) || 0,
        area: document.getElementById('f7').value,
        ubicacion: document.getElementById('f_loc').value,
        descripcion_larga: document.getElementById('f8').value,
        destacado: 0,
        activo: 1
    };

    if (id) {
        const p = MIS_PROPIEDADES.find(i => i.id === id);
        if (p) Object.assign(p, propData);
    } else {
        const nextId = MIS_PROPIEDADES.length ? Math.max(...MIS_PROPIEDADES.map(i => i.id || 0)) + 1 : 1;
        MIS_PROPIEDADES.unshift({ id: nextId, ...propData });
    }
    await persistCMSData();
    showAdminSection('properties');
}

async function deleteProperty(id) {
    if (!confirm('¿Seguro que deseas eliminar este inmueble?')) return;
    MIS_PROPIEDADES = MIS_PROPIEDADES.filter(p => p.id !== id);
    await persistCMSData();
    showAdminSection('properties');
}

function editProject(id) {
    const raw = id ? MIS_PROYECTOS.find(i => i.id === id) : null;
    const p = raw ? {
        ...raw,
        amenities: typeof raw.amenities === 'string' ? JSON.parse(raw.amenities) : (raw.amenities || [])
    } : { titulo: '', tag: '', precio: '', link: '', imagen: '', video_url: '', descripcion: '', amenities: [] };
    const amenitiesStr = Array.isArray(p.amenities) ? p.amenities.join(', ') : '';
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-building"></i> ${id ? 'Editar' : 'Nuevo'} Proyecto</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                <div>
                    <label>Nombre del Proyecto</label>
                    <input type="text" id="pj1" value="${p.titulo}">
                </div>
                <div>
                    <label>Etiqueta Destacada (ej: VENTA DE LOTES)</label>
                    <input type="text" id="pj_tag" value="${p.tag || ''}">
                </div>
                <div>
                    <label>Precio de Referencia (ej: 70 USD/m²)</label>
                    <input type="text" id="pj_precio" value="${p.precio || ''}">
                </div>
                <div>
                    <label>Enlace del Botón "VER MÁS"</label>
                    <input type="text" id="pj_link" value="${p.link || ''}">
                </div>
                <div style="grid-column: span 2;">
                    <label>URL de Video (YouTube o MP4)</label>
                    <input type="text" id="pj_video" value="${p.video_url || ''}" placeholder="https://www.youtube.com/watch?v=...">
                </div>
                <div style="grid-column: span 2;">
                    <label>Amenidades (separadas por coma)</label>
                    <input type="text" id="pj_amenities" value="${amenitiesStr}" placeholder="Piscina Playa, Gimnasio, Club House, Saunas">
                </div>
            </div>

            <label class="cms-upload-dropzone">
                <i class="fas fa-camera"></i>
                <span>SUBIR FOTO PRINCIPAL DEL PROYECTO</span>
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'pj3', 'preview-pj3')" style="display:none;">
            </label>
            <div id="preview-pj3" style="margin-bottom:14px; text-align:center;">${p.imagen ? `<img src="${p.imagen}" style="max-width:100%; height:150px; object-fit:cover; border-radius:10px; border:2px solid var(--primary-color);">` : ''}</div>
            <input type="hidden" id="pj3" value="${p.imagen}">
            
            <label>Descripción Breve</label>
            <textarea id="pj5" style="height:80px; margin-bottom:16px;">${p.descripcion}</textarea>
            
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('projects')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveProject(${id})"><i class="fas fa-save"></i> GUARDAR PROYECTO</button>
            </div>
        </div>
    `;
}

async function saveProject(id) {
    const amenitiesRaw = document.getElementById('pj_amenities')?.value || '';
    const amenities = amenitiesRaw.split(',').map(s => s.trim()).filter(s => s !== '');
    const projData = {
        titulo: document.getElementById('pj1').value,
        tag: document.getElementById('pj_tag')?.value || '',
        precio: document.getElementById('pj_precio')?.value || '',
        link: document.getElementById('pj_link')?.value || '#',
        video_url: document.getElementById('pj_video')?.value || '',
        imagen: document.getElementById('pj3').value,
        descripcion: document.getElementById('pj5').value,
        amenities: amenities
    };

    if (id) {
        const p = MIS_PROYECTOS.find(i => i.id === id);
        if (p) Object.assign(p, projData);
    } else {
        const nextId = MIS_PROYECTOS.length ? Math.max(...MIS_PROYECTOS.map(i => i.id || 0)) + 1 : 1;
        MIS_PROYECTOS.push({ id: nextId, ...projData });
    }
    await persistCMSData();
    showAdminSection('projects');
}

async function deleteProject(id) {
    if (!confirm('¿Eliminar este proyecto?')) return;
    MIS_PROYECTOS = MIS_PROYECTOS.filter(p => p.id !== id);
    await persistCMSData();
    showAdminSection('projects');
}

function editAgent(id) {
    const a = id ? MIS_AGENTES.find(i => i.id === id) : { nombre: '', especialidad: '', telefono: '', email: '', imagen: '' };
    const container = document.getElementById('tab-content');
    container.innerHTML = `
        <div class="cms-card-header">
            <div class="cms-card-title"><i class="fas fa-user-tie"></i> ${id ? 'Editar' : 'Nuevo'} Agente ONE</div>
        </div>
        <div class="cms-card" style="margin-top:15px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:12px;">
                <div>
                    <label>Nombre Completo</label>
                    <input type="text" id="ag1" value="${a.nombre}">
                </div>
                <div>
                    <label>Especialidad</label>
                    <input type="text" id="ag2" value="${a.especialidad}" placeholder="ej: Asesor de Inversiones">
                </div>
                <div>
                    <label>Teléfono WhatsApp (+591 ...)</label>
                    <input type="text" id="ag3" value="${a.telefono}">
                </div>
                <div>
                    <label>Email Corporativo</label>
                    <input type="text" id="ag4" value="${a.email}">
                </div>
            </div>

            <label class="cms-upload-dropzone">
                <i class="fas fa-user-circle"></i>
                <span>SUBIR FOTO DEL AGENTE</span>
                <input type="file" accept="image/*" onchange="handleImageUpload(this, 'ag5', 'preview-ag5')" style="display:none;">
            </label>
            <div id="preview-ag5" style="margin-bottom:14px; text-align:center;">${a.imagen ? `<img src="${a.imagen}" style="width:90px; height:90px; object-fit:cover; border-radius:50%; border:3px solid var(--primary-color);">` : ''}</div>
            <input type="hidden" id="ag5" value="${a.imagen}">
            
            <div style="display:flex; justify-content:flex-end; gap:10px;">
                <button class="cms-btn-secondary" onclick="showAdminSection('agents')">CANCELAR</button>
                <button class="cms-btn-primary" onclick="saveAgent(${id})"><i class="fas fa-save"></i> GUARDAR AGENTE</button>
            </div>
        </div>
    `;
}

async function saveAgent(id) {
    const agentData = {
        nombre: document.getElementById('ag1').value,
        especialidad: document.getElementById('ag2').value,
        telefono: document.getElementById('ag3').value,
        email: document.getElementById('ag4').value,
        imagen: document.getElementById('ag5').value
    };
    if (id) {
        const a = MIS_AGENTES.find(i => i.id === id);
        if (a) Object.assign(a, agentData);
    } else {
        const nextId = MIS_AGENTES.length ? Math.max(...MIS_AGENTES.map(i => i.id || 0)) + 1 : 1;
        MIS_AGENTES.push({ id: nextId, ...agentData });
    }
    await persistCMSData();
    showAdminSection('agents');
}

async function deleteAgent(id) {
    if (!confirm('¿Eliminar este agente?')) return;
    MIS_AGENTES = MIS_AGENTES.filter(a => a.id !== id);
    await persistCMSData();
    showAdminSection('agents');
}

function buildExportCode() {
    return `/* Estado del sistema: ${new Date().toLocaleString('es-BO')} */\n/* Propiedades: ${MIS_PROPIEDADES.length} | Agentes: ${MIS_AGENTES.length} | Proyectos: ${MIS_PROYECTOS.length} */\n/* Los datos se gestionan y persisten en el backend (backend/realty_one_data.json) */\n/* No es necesario copiar código — todos los cambios ya están guardados. */`;
}

// File System Access API - handle persistente en disco
let _scriptFileHandle = null;

async function saveToFile() {
    const banner = document.createElement('div');
    banner.innerHTML = '<i class="fas fa-check-circle"></i> Los cambios ya están guardados en el servidor automáticamente.';
    banner.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#1a7f3c;color:#fff;padding:14px 22px;border-radius:8px;font-weight:bold;z-index:99999;box-shadow:0 4px 15px rgba(0,0,0,0.4);max-width:380px;line-height:1.4;';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 4000);
    const section = document.getElementById('export-section');
    if (section) section.style.display = 'none';
}

function updateExportCode() {
    const t = document.getElementById('export-code');
    if (t) t.value = buildExportCode();
}

function showSaveOption() {
    const section = document.getElementById('export-section');
    if (section) {
        section.style.display = 'block';
        updateExportCode();
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function copyCode() {
    const t = document.getElementById('export-code');
    const text = t?.value || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('¡Código copiado al portapapeles!', 'success');
        }).catch(() => {
            t.select();
            document.execCommand('copy');
            showToast('¡Código copiado!', 'success');
        });
    } else {
        t.select();
        document.execCommand('copy');
        showToast('¡Código copiado!', 'success');
    }
    const section = document.getElementById('export-section');
    if (section) section.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async () => {
    initAuthSystem();
    await loadFromAPI();
    renderAll();
    if (typeof AOS !== 'undefined') AOS.init({ duration: 1000, once: true });
});

window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (header) {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
            document.body.classList.add('topbar-hidden');
        } else {
            header.classList.remove('scrolled');
            document.body.classList.remove('topbar-hidden');
        }
    }

    // Back to top button visibility
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        if (window.scrollY > 500) backToTop.classList.add('visible');
        else backToTop.classList.remove('visible');
    }
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const menuToggle = document.getElementById('menu-toggle');
const navMenu = document.getElementById('nav-menu');
if (menuToggle) {
    menuToggle.onclick = (e) => {
        e.stopPropagation();
        navMenu.classList.toggle('active');
        const isActive = navMenu.classList.contains('active');
        menuToggle.querySelector('i').className = isActive ? 'fas fa-times' : 'fas fa-bars';
        document.body.style.overflow = isActive ? 'hidden' : '';
    };
}

// Cerrar al hacer click fuera (en el overlay)
if (navMenu) {
    navMenu.onclick = (e) => {
        if (e.target === navMenu) {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
            if (menuToggle) menuToggle.querySelector('i').className = 'fas fa-bars';
        }
    };
}

// Manejo de estado activo en el menú
document.querySelectorAll('#nav-menu a').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('#nav-menu a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        // Cerrar menú móvil si está abierto
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
            const icon = menuToggle?.querySelector('i');
            if (icon) { icon.className = 'fas fa-bars'; }
        }
    });
});

// Nota: La carga inicial ya se realiza en DOMContentLoaded con await loadFromAPI()
