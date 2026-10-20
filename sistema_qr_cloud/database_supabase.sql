-- ==============================================================================
-- REALTY ONE GROUP BOLIVIA — ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Proyecto: Sistema de Captura de Leads por Código QR 24/7 en la Nube
-- ==============================================================================

-- 1. Crear tabla principal de leads capturados por QR
CREATE TABLE IF NOT EXISTS public.leads_qr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('America/La_Paz', now()),
    nombre_completo TEXT NOT NULL,
    celular TEXT NOT NULL,
    email TEXT,
    ciudad TEXT DEFAULT 'Santa Cruz',
    tipo_interes TEXT DEFAULT 'Comprar', -- 'Comprar', 'Alquilar', 'Anticrético', 'Inversión'
    propiedad_campana TEXT DEFAULT 'Catálogo General', -- Ej. 'Lote Mar Adentro', 'Terreno G77', 'Westgate Tower'
    presupuesto TEXT DEFAULT 'Por Definir',
    fecha_visita_preferida DATE,
    hora_visita_preferida TEXT,
    origen_qr TEXT DEFAULT 'Letrero / Banner Físico', -- 'Letrero Físico', 'Folleto', 'WhatsApp', 'Feria Inmobiliaria'
    agente_asignado TEXT DEFAULT 'Oficina Central (+591 60937050)',
    estado TEXT DEFAULT 'NUEVO', -- 'NUEVO', 'CONTACTADO', 'VISITA_PROGRAMADA', 'EN_NEGOCIACION', 'CERRADO'
    notas TEXT,
    ip_origen TEXT,
    dispositivo TEXT
);

-- 2. Índices para consultas ultra-rápidas en el CRM
CREATE INDEX IF NOT EXISTS idx_leads_qr_created_at ON public.leads_qr (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_qr_celular ON public.leads_qr (celular);
CREATE INDEX IF NOT EXISTS idx_leads_qr_estado ON public.leads_qr (estado);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.leads_qr ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad RLS:
-- Permitir que el formulario público inserte nuevos prospectos (anon key)
DROP POLICY IF EXISTS "Permitir insercion publica anónima de leads" ON public.leads_qr;
CREATE POLICY "Permitir insercion publica anónima de leads"
ON public.leads_qr
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir lectura y actualización autenticada para el panel CRM
DROP POLICY IF EXISTS "Permitir lectura publica con anon key para panel CRM" ON public.leads_qr;
CREATE POLICY "Permitir lectura publica con anon key para panel CRM"
ON public.leads_qr
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion para gestion de leads" ON public.leads_qr;
CREATE POLICY "Permitir actualizacion para gestion de leads"
ON public.leads_qr
FOR UPDATE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion de leads en CRM" ON public.leads_qr;
CREATE POLICY "Permitir eliminacion de leads en CRM"
ON public.leads_qr
FOR DELETE
TO anon, authenticated
USING (true);

-- ==============================================================================
-- ¡Listo! Copia y pega este script en el SQL Editor de tu proyecto en Supabase.
-- ==============================================================================
