/**
 * ==============================================================================
 * REALTY ONE GROUP BOLIVIA — CONFIGURACIÓN GLOBAL NUBE 24/7
 * ==============================================================================
 * Configura aquí tus endpoints de base de datos en la nube.
 * Soporta Supabase, Google Sheets (Apps Script), Firebase o SiteGround PHP.
 */

const CONFIG = {
    // 1. SUPABASE (PostgreSQL Cloud 24/7 Gratis)
    // Obtén estos datos en: https://supabase.com > Settings > API
    SUPABASE_URL: window.SUPABASE_URL || 'https://xyzcompany.supabase.co',
    SUPABASE_ANON_KEY: window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',

    // 2. GOOGLE SHEETS / APPS SCRIPT (Alternativa 100% Inmortal 24/7)
    // Pega aquí la URL que te da Google Apps Script al publicar tu Web App:
    GOOGLE_APPS_SCRIPT_URL: window.GOOGLE_APPS_SCRIPT_URL || '',

    // 3. WHATSAPP ASIGNADO PARA CONTACTO INMEDIATO POST-REGISTRO
    WHATSAPP_NUMERO_OFICIAL: '59160937050', // Línea oficial de Realty ONE Group Bolivia

    // 4. CLAVE ADMINISTRATIVA PARA EL PANEL CRM EN LA NUBE
    CRM_ACCESS_KEY: 'ONE2026',

    // 5. MODO DE PERSISTENCIA POR DEFECTO ('supabase' | 'googlesheets' | 'dual' | 'local_storage')
    // 'dual' envía a Supabase y a Google Sheets en simultáneo para respaldo total.
    MODO_PERSISTENCIA: 'dual'
};

// Exportar globalmente
window.ROG_CONFIG = CONFIG;
