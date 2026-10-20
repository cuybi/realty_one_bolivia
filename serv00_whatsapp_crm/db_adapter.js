/**
 * ==============================================================================
 * REALTY ONE / CRM WHATSAPP — ADAPTADOR UNIVERSAL DE BASE DE DATOS
 * ==============================================================================
 * Conexión resiliente:
 * 1. Si hay MySQL configurado (Serv00/CPanel/VPS), usa MySQL con Pool.
 * 2. Si no hay MySQL disponible (Entorno local/Opción 2), usa SQLite / JSON persistente local
 *    sin requerir contraseñas, instalaciones externas ni cuentas de hosting.
 */

const fs = require('fs');
const path = require('path');

let mysqlPool = null;
let isUsingMySQL = false;
const LOCAL_LEADS_FILE = path.join(__dirname, 'leads.json');

async function initDatabase() {
    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPass = process.env.DB_PASS;
    const dbName = process.env.DB_NAME;

    // Verificar si las credenciales de MySQL no son las de ejemplo
    if (dbHost && dbUser && dbPass && !dbHost.includes('mysqlX')) {
        try {
            const mysql = require('mysql2/promise');
            mysqlPool = mysql.createPool({
                host: dbHost,
                user: dbUser,
                password: dbPass,
                database: dbName,
                port: parseInt(process.env.DB_PORT || '3306', 10),
                waitForConnections: true,
                connectionLimit: 4,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000
            });
            // Probar conexión
            await mysqlPool.query('SELECT 1');
            isUsingMySQL = true;
            console.log(`✅ [DB Adapter] Conectado a MySQL: ${dbUser}@${dbHost}/${dbName}`);
            return;
        } catch (e) {
            console.warn(`⚠️ [DB Adapter] MySQL no disponible (${e.message}). Activando Base de Datos Local...`);
        }
    }

    // Fallback: Base de datos local persistente
    if (!fs.existsSync(LOCAL_LEADS_FILE)) {
        fs.writeFileSync(LOCAL_LEADS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
    console.log(`✅ [DB Adapter] Base de datos local activa: ${LOCAL_LEADS_FILE}`);
}

async function guardarLead(lead) {
    const fechaHora = new Date().toISOString();

    // 1. Si MySQL está activo
    if (isUsingMySQL && mysqlPool) {
        try {
            const query = `
                INSERT INTO leads (nombre, telefono, correo, servicio, origen, estado)
                VALUES (?, ?, ?, ?, 'Facebook Ads', 'NUEVO')
            `;
            const [res] = await mysqlPool.execute(query, [lead.nombre, lead.telefono, lead.correo, lead.servicio]);
            return { id: res.insertId, storage: 'MySQL' };
        } catch (err) {
            console.error('⚠️ Error guardando en MySQL, respaldando en local:', err.message);
        }
    }

    // 2. Base de Datos Local (JSON / SQLite)
    let leads = [];
    try {
        if (fs.existsSync(LOCAL_LEADS_FILE)) {
            leads = JSON.parse(fs.readFileSync(LOCAL_LEADS_FILE, 'utf8') || '[]');
        }
    } catch (_) {
        leads = [];
    }

    const newId = leads.length > 0 ? (Math.max(...leads.map(l => l.id || 0)) + 1) : 1;
    const nuevoRegistro = {
        id: newId,
        nombre: lead.nombre,
        telefono: lead.telefono,
        correo: lead.correo,
        servicio: lead.servicio,
        origen: 'Facebook Ads',
        estado: 'NUEVO',
        fecha_creacion: fechaHora
    };

    leads.unshift(nuevoRegistro);
    fs.writeFileSync(LOCAL_LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');

    // También sincronizar con la base de datos principal de Realty ONE si existe
    const rootLeads = path.join(__dirname, '..', 'leads.json');
    try {
        if (fs.existsSync(rootLeads)) {
            let rl = JSON.parse(fs.readFileSync(rootLeads, 'utf8') || '[]');
            rl.unshift({
                ...nuevoRegistro,
                cliente_nombre: lead.nombre,
                numero_celular: lead.telefono,
                email: lead.correo,
                tipo_interes: lead.servicio,
                ultimo_mensaje: `Facebook Ad Lead: ${lead.servicio}`
            });
            fs.writeFileSync(rootLeads, JSON.stringify(rl, null, 2), 'utf8');
        }
    } catch (_) {}

    return { id: newId, storage: 'Local CRM Database' };
}

async function obtenerLeads() {
    if (isUsingMySQL && mysqlPool) {
        const [rows] = await mysqlPool.query('SELECT * FROM leads ORDER BY fecha_creacion DESC');
        return rows;
    }
    if (fs.existsSync(LOCAL_LEADS_FILE)) {
        return JSON.parse(fs.readFileSync(LOCAL_LEADS_FILE, 'utf8') || '[]');
    }
    return [];
}

module.exports = {
    initDatabase,
    guardarLead,
    obtenerLeads
};
