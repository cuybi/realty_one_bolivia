import json
import os
import re
from datetime import datetime, date, timedelta
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# ==============================================================================
# CONFIGURACIÓN DE PÁGINA & TEMA VISUAL LUXURY GOLD & OBSIDIAN
# ==============================================================================
st.set_page_config(
    page_title="Realty ONE Group Bolivia • Sales & Leads Intelligence",
    page_icon="🦁",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Inyección de estilos CSS premium (Glassmorphism + Tipografía Outfit/Inter + Oro #D4AF37)
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

:root {
    --gold-primary: #D4AF37;
    --gold-light: #F4E5A1;
    --gold-dark: #AA820A;
    --bg-dark: #0A0C10;
    --bg-card: rgba(18, 22, 31, 0.75);
    --border-gold: rgba(212, 175, 55, 0.25);
    --text-muted: #8E9BAE;
}

html, body, [class*="css"] {
    font-family: 'Outfit', 'Inter', sans-serif;
}

.stApp {
    background: radial-gradient(circle at 10% 20%, rgba(20, 24, 33, 0.95) 0%, rgba(10, 12, 16, 1) 90%);
    color: #FFFFFF;
}

/* Header corporativo */
.gold-header {
    background: linear-gradient(135deg, rgba(26, 32, 44, 0.85) 0%, rgba(18, 22, 31, 0.95) 100%);
    border: 1px solid var(--border-gold);
    border-radius: 16px;
    padding: 24px 32px;
    margin-bottom: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(212, 175, 55, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(12px);
}

.gold-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin: 0;
    background: linear-gradient(135deg, #FFF6D6 0%, #D4AF37 50%, #F5C542 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.gold-subtitle {
    color: var(--text-muted);
    font-size: 14px;
    margin-top: 4px;
    font-weight: 400;
}

/* Tarjetas KPI */
.kpi-card {
    background: linear-gradient(145deg, rgba(22, 27, 38, 0.8) 0%, rgba(15, 18, 26, 0.9) 100%);
    border: 1px solid var(--border-gold);
    border-radius: 14px;
    padding: 20px 22px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.kpi-card:hover {
    transform: translateY(-3px);
    border-color: rgba(212, 175, 55, 0.6);
    box-shadow: 0 12px 30px rgba(212, 175, 55, 0.15);
}

.kpi-title {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.kpi-value {
    font-size: 32px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.1;
    margin-bottom: 6px;
    font-family: 'Outfit', sans-serif;
}

.kpi-caption {
    font-size: 12px;
    color: #D4AF37;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
}

/* Badges de Prioridad y Estado */
.badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
}
.badge-potencial { background: rgba(255, 75, 75, 0.18); color: #FF6B6B; border: 1px solid rgba(255, 75, 75, 0.4); }
.badge-indeciso { background: rgba(255, 170, 0, 0.18); color: #FFAA00; border: 1px solid rgba(255, 170, 0, 0.4); }
.badge-pasivo { background: rgba(0, 180, 216, 0.18); color: #00B4D8; border: 1px solid rgba(0, 180, 216, 0.4); }
.badge-propietario { background: rgba(157, 78, 221, 0.18); color: #C77DFF; border: 1px solid rgba(157, 78, 221, 0.4); }

.badge-visita { background: rgba(0, 210, 135, 0.18); color: #00D287; border: 1px solid rgba(0, 210, 135, 0.4); }
.badge-contactado { background: rgba(212, 175, 55, 0.18); color: #F4E5A1; border: 1px solid rgba(212, 175, 55, 0.4); }
.badge-nuevo { background: rgba(100, 116, 139, 0.2); color: #CBD5E1; border: 1px solid rgba(100, 116, 139, 0.4); }

/* Botones de acción */
.stButton>button {
    background: linear-gradient(135deg, #AA820A 0%, #D4AF37 50%, #C5A028 100%);
    color: #0A0C10;
    font-weight: 700;
    border: none;
    border-radius: 8px;
    padding: 8px 20px;
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);
    transition: all 0.2s ease;
}
.stButton>button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
    color: #000;
}

/* Tab styling */
.stTabs [data-baseweb="tab-list"] {
    gap: 8px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.2);
    padding-bottom: 6px;
}
.stTabs [data-baseweb="tab"] {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px 8px 0 0;
    padding: 10px 18px;
    color: #8E9BAE;
    font-weight: 500;
    border: 1px solid transparent;
}
.stTabs [aria-selected="true"] {
    background: rgba(212, 175, 55, 0.12) !important;
    border: 1px solid var(--border-gold) !important;
    border-bottom: 2px solid #D4AF37 !important;
    color: #F4E5A1 !important;
    font-weight: 700 !important;
}
</style>
""", unsafe_allow_html=True)


# ==============================================================================
# CARGA Y NORMALIZACIÓN DE DATOS
# ==============================================================================
def find_leads_filepath():
    candidates = [
        os.path.join(os.path.dirname(__file__), "leads.json"),
        os.path.join(os.path.dirname(__file__), "backend", "leads.json"),
        "leads.json",
        "backend/leads.json"
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return "leads.json"


@st.cache_data(ttl=15)
def load_leads_data():
    filepath = find_leads_filepath()
    if not os.path.exists(filepath):
        return pd.DataFrame(), []

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            raw_leads = json.load(f)
    except Exception as e:
        st.error(f"Error al leer {filepath}: {e}")
        return pd.DataFrame(), []

    if not isinstance(raw_leads, list) or len(raw_leads) == 0:
        return pd.DataFrame(), raw_leads

    records = []
    for l in raw_leads:
        # Extracción y limpieza de fecha
        fecha_str = l.get("fecha_creacion") or l.get("fecha_completa") or ""
        dt_val = None
        if fecha_str:
            try:
                # Soporta ISO 8601 con offset o sin offset
                clean_date = fecha_str.replace("Z", "")
                if "+" in clean_date:
                    clean_date = clean_date.split("+")[0]
                elif clean_date.count("-") > 2: # Timezone offset
                    parts = clean_date.rsplit("-", 1)
                    clean_date = parts[0]
                dt_val = pd.to_datetime(clean_date)
            except Exception:
                dt_val = pd.to_datetime(fecha_str, errors="coerce")
        if pd.isna(dt_val) or dt_val is None:
            dt_val = datetime.now()

        # Parseo de presupuesto estimado
        presupuesto_raw = str(l.get("presupuesto") or "")
        presupuesto_num = 0.0
        # Buscar números en el texto
        nums = re.findall(r"\d+", presupuesto_raw.replace(".", "").replace(",", ""))
        if nums:
            try:
                val = float(nums[0])
                # Si es un número pequeño menor a 1000 y parece un prefijo telefónico accidental, normalizar
                if val < 1000 and "mar adentro" in str(l.get("campana", "")).lower():
                    presupuesto_num = 112500.0
                elif val < 1000 and "g77" in str(l.get("campana", "")).lower():
                    presupuesto_num = 2413793.0
                elif val < 1000 and "4 dorm" in str(l.get("campana", "")).lower():
                    presupuesto_num = 120000.0
                else:
                    presupuesto_num = val
            except Exception:
                presupuesto_num = 0.0

        # Si aún es 0, estimar según la propiedad o campaña consultada
        camp_low = (str(l.get("campana", "")) + " " + str(l.get("zona_interes", ""))).lower()
        if presupuesto_num == 0.0:
            if "mar adentro" in camp_low:
                presupuesto_num = 112500.0
            elif "g77" in camp_low or "industrial" in camp_low:
                presupuesto_num = 2413793.0 # ~Bs 16.8M / 6.96
            elif "120" in camp_low or "4 dorm" in camp_low:
                presupuesto_num = 120000.0
            elif "urubo" in camp_low or "mansión" in camp_low or "mansion" in camp_low:
                presupuesto_num = 450000.0
            elif "anticret" in camp_low:
                presupuesto_num = 45000.0
            elif "alquil" in camp_low:
                presupuesto_num = 1500.0
            else:
                presupuesto_num = 85000.0

        score_val = l.get("score")
        if score_val is None or not isinstance(score_val, (int, float)):
            score_val = 60 if l.get("prioridad") == "INDECISO" else (100 if l.get("prioridad") == "POTENCIAL" else 40)

        # Teléfono limpio para WhatsApp
        tel_raw = str(l.get("numero_celular") or "")
        clean_phone = re.sub(r"[^\d]", "", tel_raw)
        if len(clean_phone) == 8:
            clean_phone = "591" + clean_phone

        records.append({
            "id": l.get("id", ""),
            "nombre": l.get("cliente_nombre") or l.get("formulario_datos", {}).get("nombre") or "Cliente WhatsApp",
            "celular": tel_raw,
            "whatsapp_num": clean_phone,
            "email": l.get("email") or l.get("formulario_datos", {}).get("email") or "No registrado",
            "fecha": dt_val,
            "fecha_corta": dt_val.strftime("%Y-%m-%d"),
            "hora": l.get("hora") or dt_val.strftime("%H:%M"),
            "dia_semana": l.get("dia_semana") or dt_val.strftime("%A"),
            "canal": l.get("canal_origen") or "WhatsApp (+591 60937050)",
            "campana": l.get("campana") or "Consulta General",
            "estado": l.get("estado_comercial") or "Nuevo",
            "etapa": l.get("etapa_embudo") or "NUEVO",
            "zona": l.get("zona_interes") or "Santa Cruz (General)",
            "tipo_interes": l.get("tipo_interes") or "Compra",
            "presupuesto_usd": presupuesto_num,
            "prioridad": l.get("prioridad") or "POTENCIAL",
            "prioridad_label": l.get("prioridad_label") or "🔥 Potencial",
            "score": int(score_val),
            "asesor": l.get("e_realtor_asignado") or "Carlos Rodríguez",
            "asesor_tel": l.get("e_realtor_telefono") or "+591 70123456",
            "asesor_esp": l.get("e_realtor_especialidad") or "Venta de Lujo",
            "ultimo_mensaje": l.get("ultimo_mensaje") or "",
            "accion_sugerida": l.get("accion_sugerida") or "Contacto inmediato",
            "raw_data": l
        })

    df = pd.DataFrame(records)
    return df, raw_leads


df_leads, raw_leads_data = load_leads_data()


# ==============================================================================
# HEADER PRINCIPAL
# ==============================================================================
st.markdown("""
<div class="gold-header">
    <div>
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">🦁</span>
            <div>
                <h1 class="gold-title">REALTY ONE GROUP BOLIVIA</h1>
                <div class="gold-subtitle">Portal Comercial & Inteligencia de Ventas de e-Realtors • Santa Cruz & Urubó</div>
            </div>
        </div>
    </div>
    <div style="text-align: right;">
        <span class="badge" style="background: rgba(212, 175, 55, 0.15); color: #F4E5A1; border: 1px solid #D4AF37;">
            ⚡ CRM EN VIVO & CHATBOT IA
        </span>
        <div style="font-size: 12px; color: #8E9BAE; margin-top: 6px;">
            Línea Corporativa: <b>+591 60937050</b>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)


# ==============================================================================
# SIDEBAR: FILTROS DINÁMICOS & BÚSQUEDA
# ==============================================================================
st.sidebar.markdown("""
<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
    <span style="font-size: 24px;">⚙️</span>
    <h3 style="margin: 0; color: #F4E5A1; font-weight: 700;">FILTROS COMERCIALES</h3>
</div>
""", unsafe_allow_html=True)

search_query = st.sidebar.text_input("🔍 Búsqueda rápida (Nombre, Celular, Zona):", "")

# Filtro por rango de fechas
preset_fechas = st.sidebar.selectbox(
    "📅 Ventana de Tiempo:",
    ["Todo el Historial", "Últimos 7 Días", "Últimos 30 Días", "Rango Personalizado"]
)

min_date = df_leads["fecha"].min().date() if not df_leads.empty else date.today() - timedelta(days=30)
max_date = df_leads["fecha"].max().date() if not df_leads.empty else date.today()

if preset_fechas == "Últimos 7 Días":
    start_filter = date.today() - timedelta(days=7)
    end_filter = date.today()
elif preset_fechas == "Últimos 30 Días":
    start_filter = date.today() - timedelta(days=30)
    end_filter = date.today()
elif preset_fechas == "Rango Personalizado":
    date_range = st.sidebar.date_input("Seleccionar Rango:", [min_date, max_date])
    if isinstance(date_range, (list, tuple)) and len(date_range) == 2:
        start_filter, end_filter = date_range[0], date_range[1]
    else:
        start_filter, end_filter = min_date, max_date
else:
    start_filter, end_filter = min_date - timedelta(days=1), max_date + timedelta(days=1)

# Filtros categóricos
asesores_disponibles = sorted(df_leads["asesor"].unique().tolist()) if not df_leads.empty else []
sel_asesores = st.sidebar.multiselect("👤 e-Realtors Asignados:", asesores_disponibles, default=asesores_disponibles)

prioridades_disponibles = sorted(df_leads["prioridad"].unique().tolist()) if not df_leads.empty else []
sel_prioridades = st.sidebar.multiselect("🔥 Nivel de Prioridad:", prioridades_disponibles, default=prioridades_disponibles)

etapas_disponibles = sorted(df_leads["etapa"].unique().tolist()) if not df_leads.empty else []
sel_etapas = st.sidebar.multiselect("📊 Etapa del Embudo:", etapas_disponibles, default=etapas_disponibles)

score_min = st.sidebar.slider("⭐ Score Mínimo del Prospecto (0-100):", min_value=0, max_value=100, value=0, step=5)

st.sidebar.markdown("---")
if st.sidebar.button("🔄 Recargar Datos en Vivo", use_container_width=True):
    st.cache_data.clear()
    st.rerun()


# ==============================================================================
# APLICACIÓN DE FILTROS AL DATAFRAME
# ==============================================================================
if df_leads.empty:
    st.warning("⚠️ No se encontraron prospectos en leads.json. Puedes ingresar el primer prospecto en la pestaña 'Nuevo Lead'.")
    df_filtered = pd.DataFrame()
else:
    df_filtered = df_leads.copy()

    # Filtro de búsqueda
    if search_query:
        sq = search_query.lower()
        df_filtered = df_filtered[
            df_filtered["nombre"].str.lower().str.contains(sq, na=False) |
            df_filtered["celular"].str.lower().str.contains(sq, na=False) |
            df_filtered["zona"].str.lower().str.contains(sq, na=False) |
            df_filtered["campana"].str.lower().str.contains(sq, na=False) |
            df_filtered["email"].str.lower().str.contains(sq, na=False)
        ]

    # Filtro fecha
    df_filtered = df_filtered[
        (df_filtered["fecha"].dt.date >= start_filter) &
        (df_filtered["fecha"].dt.date <= end_filter)
    ]

    # Filtros selecciones
    if sel_asesores:
        df_filtered = df_filtered[df_filtered["asesor"].isin(sel_asesores)]
    if sel_prioridades:
        df_filtered = df_filtered[df_filtered["prioridad"].isin(sel_prioridades)]
    if sel_etapas:
        df_filtered = df_filtered[df_filtered["etapa"].isin(sel_etapas)]
    if score_min > 0:
        df_filtered = df_filtered[df_filtered["score"] >= score_min]


# ==============================================================================
# TARJETAS DE MÉTRICAS KPI (BANNER SUPERIOR)
# ==============================================================================
total_leads = len(df_filtered)
leads_potenciales = len(df_filtered[df_filtered["prioridad"] == "POTENCIAL"]) if total_leads > 0 else 0
visitas_agendadas = len(df_filtered[df_filtered["etapa"] == "VISITA_AGENDADA"]) if total_leads > 0 else 0
score_promedio = int(df_filtered["score"].mean()) if total_leads > 0 else 0
pipeline_usd = df_filtered["presupuesto_usd"].sum() if total_leads > 0 else 0.0
tasa_visitas = (visitas_agendadas / total_leads * 100) if total_leads > 0 else 0.0

col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title"><i class="fas fa-users"></i> Total Leads</div>
        <div class="kpi-value">{total_leads}</div>
        <div class="kpi-caption">⚡ Registrados en One Comsys</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title"><i class="fas fa-fire"></i> Leads Potenciales</div>
        <div class="kpi-value" style="color: #FF6B6B;">{leads_potenciales}</div>
        <div class="kpi-caption">🔥 Score >= 80 (Calientes)</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title"><i class="fas fa-calendar-check"></i> Visitas Agendadas</div>
        <div class="kpi-value" style="color: #00D287;">{visitas_agendadas}</div>
        <div class="kpi-caption">🤝 {tasa_visitas:.1f}% tasa de agendamiento</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title"><i class="fas fa-star"></i> Score Promedio</div>
        <div class="kpi-value" style="color: #F4E5A1;">{score_promedio}<span style="font-size: 16px; color: #8E9BAE;">/100</span></div>
        <div class="kpi-caption">🎯 Calidad global del embudo</div>
    </div>
    """, unsafe_allow_html=True)

with col5:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title"><i class="fas fa-dollar-sign"></i> Pipeline Estimado</div>
        <div class="kpi-value" style="color: #D4AF37;">${pipeline_usd:,.0f}</div>
        <div class="kpi-caption">💼 Bs {(pipeline_usd * 6.96):,.0f} aprox.</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<div style='height: 20px;'></div>", unsafe_allow_html=True)


# ==============================================================================
# PESTAÑAS PRINCIPALES DEL DASHBOARD
# ==============================================================================
tab_resumen, tab_asesores, tab_zonas, tab_campanas, tab_crm, tab_nuevo = st.tabs([
    "📊 Resumen Ejecutivo & Embudo",
    "👥 Rendimiento e-Realtors",
    "🗺️ Zonas & Demanda",
    "🎯 Campañas & Marketing",
    "📋 Explorador & CRM WhatsApp",
    "➕ Registrar Nuevo Lead"
])


# ------------------------------------------------------------------------------
# TAB 1: RESUMEN EJECUTIVO & EMBUDO
# ------------------------------------------------------------------------------
with tab_resumen:
    col_funnel, col_donut = st.columns([3, 2])

    with col_funnel:
        st.markdown("#### 🏆 Embudo de Conversión Comercial (Etapas)")
        if not df_filtered.empty:
            # Conteo de etapas ordenadas
            order_stages = ["NUEVO", "CONTACTADO", "VISITA_AGENDADA", "NEGOCIACION", "CERRADO"]
            counts_stage = df_filtered["etapa"].value_counts().to_dict()
            funnel_data = []
            for stg in order_stages:
                funnel_data.append({"Etapa": stg.replace("_", " ").title(), "Prospectos": counts_stage.get(stg, 0)})

            df_f = pd.DataFrame(funnel_data)
            # Solo mostrar etapas con al menos 1 o etapas clave
            fig_funnel = go.Figure(go.Funnel(
                y=df_f["Etapa"],
                x=df_f["Prospectos"],
                textinfo="value+percent initial",
                marker={"color": ["#4A5568", "#D4AF37", "#00D287", "#3182CE", "#805AD5"]},
                connector={"line": {"color": "rgba(212, 175, 55, 0.4)", "width": 1.5}}
            ))
            fig_funnel.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                height=340,
                margin=dict(l=20, r=20, t=20, b=20)
            )
            st.plotly_chart(fig_funnel, use_container_width=True)
        else:
            st.info("Sin datos para renderizar el embudo.")

    with col_donut:
        st.markdown("#### 🔥 Segmentación por Calidad / Prioridad")
        if not df_filtered.empty:
            df_prio = df_filtered["prioridad"].value_counts().reset_index()
            df_prio.columns = ["Prioridad", "Total"]
            color_map = {
                "POTENCIAL": "#FF6B6B",
                "INDECISO": "#FFAA00",
                "PASIVO": "#00B4D8",
                "PROPIETARIO": "#C77DFF"
            }
            fig_donut = px.pie(
                df_prio,
                names="Prioridad",
                values="Total",
                hole=0.6,
                color="Prioridad",
                color_discrete_map=color_map
            )
            fig_donut.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                height=340,
                margin=dict(l=10, r=10, t=20, b=20),
                legend=dict(orientation="h", yanchor="bottom", y=-0.15, xanchor="center", x=0.5)
            )
            st.plotly_chart(fig_donut, use_container_width=True)
        else:
            st.info("Sin datos de segmentación.")

    st.markdown("---")
    st.markdown("#### 📈 Velocidad de Captación en el Tiempo")
    if not df_filtered.empty:
        df_trend = df_filtered.groupby([df_filtered["fecha"].dt.date, "prioridad"]).size().reset_index(name="Cantidad")
        df_trend.rename(columns={"fecha": "Fecha"}, inplace=True)
        fig_trend = px.bar(
            df_trend,
            x="Fecha",
            y="Cantidad",
            color="prioridad",
            barmode="stack",
            color_discrete_map={"POTENCIAL": "#FF6B6B", "INDECISO": "#FFAA00", "PASIVO": "#00B4D8", "PROPIETARIO": "#C77DFF"},
            title="Leads ingresados por fecha y nivel de prioridad"
        )
        fig_trend.update_layout(
            template="plotly_dark",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            height=320,
            margin=dict(l=20, r=20, t=40, b=20)
        )
        st.plotly_chart(fig_trend, use_container_width=True)


# ------------------------------------------------------------------------------
# TAB 2: RENDIMIENTO DE E-REALTORS
# ------------------------------------------------------------------------------
with tab_asesores:
    st.markdown("### 🏆 Leaderboard de e-Realtors Oficiales")
    st.markdown("Métricas de atención inmediata, prospección de cartera y tasa de visitas cerradas.")

    if not df_filtered.empty:
        agent_group = df_filtered.groupby("asesor").agg(
            Total_Leads=("id", "count"),
            Potenciales=("prioridad", lambda x: (x == "POTENCIAL").sum()),
            Visitas_Agendadas=("etapa", lambda x: (x == "VISITA_AGENDADA").sum()),
            Score_Promedio=("score", "mean"),
            Pipeline_Total=("presupuesto_usd", "sum"),
            Especialidad=("asesor_esp", "first"),
            Telefono=("asesor_tel", "first")
        ).reset_index()

        agent_group["Tasa_Visitas"] = (agent_group["Visitas_Agendadas"] / agent_group["Total_Leads"] * 100).round(1)
        agent_group["Score_Promedio"] = agent_group["Score_Promedio"].round(0).astype(int)
        agent_group = agent_group.sort_values(by="Total_Leads", ascending=False)

        col_left, col_right = st.columns([3, 2])

        with col_left:
            fig_agents = px.bar(
                df_filtered,
                x="asesor",
                color="etapa",
                title="Carga de Leads por Asesor y Etapa Comercial",
                color_discrete_map={
                    "VISITA_AGENDADA": "#00D287",
                    "CONTACTADO": "#D4AF37",
                    "NUEVO": "#4A5568",
                    "NEGOCIACION": "#3182CE",
                    "CERRADO": "#9F7AEA"
                }
            )
            fig_agents.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                height=350,
                xaxis_title="e-Realtor",
                yaxis_title="Cantidad de Leads",
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_agents, use_container_width=True)

        with col_right:
            fig_radar = px.scatter(
                agent_group,
                x="Total_Leads",
                y="Score_Promedio",
                size="Pipeline_Total",
                color="asesor",
                text="asesor",
                title="Matriz de Calidad: Volumen vs Score Promedio",
                color_discrete_sequence=["#D4AF37", "#00D287", "#FF6B6B", "#3182CE", "#9F7AEA"]
            )
            fig_radar.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                height=350,
                showlegend=False,
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_radar, use_container_width=True)

        st.markdown("#### 📋 Detalle de Productividad por Asesor")
        st.dataframe(
            agent_group.rename(columns={
                "asesor": "e-Realtor",
                "Total_Leads": "Total Prospectos",
                "Potenciales": "🔥 Potenciales",
                "Visitas_Agendadas": "📅 Visitas",
                "Tasa_Visitas": "% Citas",
                "Score_Promedio": "Score Prom.",
                "Pipeline_Total": "Cartera USD ($)",
                "Especialidad": "Especialidad Comercial",
                "Telefono": "Celular"
            }),
            use_container_width=True,
            hide_index=True
        )
    else:
        st.info("Sin registros de asesores en el periodo seleccionado.")


# ------------------------------------------------------------------------------
# TAB 3: ZONAS & DEMANDA
# ------------------------------------------------------------------------------
with tab_zonas:
    st.markdown("### 🗺️ Inteligencia Territorial & Preferencias Inmobiliarias")
    st.markdown("Análisis de demanda por zonas de Santa Cruz, Urubó y proyectos insignia.")

    if not df_filtered.empty:
        col_z1, col_z2 = st.columns(2)

        with col_z1:
            df_zona = df_filtered["zona"].value_counts().reset_index()
            df_zona.columns = ["Zona de Interés", "Total Prospectos"]
            fig_zona = px.bar(
                df_zona,
                x="Total Prospectos",
                y="Zona de Interés",
                orientation="h",
                title="Demanda por Ubicación / Proyecto",
                color="Total Prospectos",
                color_continuous_scale=["#AA820A", "#D4AF37", "#F4E5A1"]
            )
            fig_zona.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                height=360,
                yaxis=dict(autorange="reversed"),
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_zona, use_container_width=True)

        with col_z2:
            fig_pres_zona = px.box(
                df_filtered,
                x="zona",
                y="presupuesto_usd",
                title="Distribución de Presupuestos por Zona ($ USD)",
                color="zona",
                color_discrete_sequence=["#D4AF37", "#00D287", "#3182CE", "#E53E3E", "#9F7AEA"]
            )
            fig_pres_zona.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                height=360,
                showlegend=False,
                yaxis_title="Presupuesto ($ USD)",
                xaxis_title="Zona",
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_pres_zona, use_container_width=True)


# ------------------------------------------------------------------------------
# TAB 4: CAMPAÑAS & MARKETING ROI
# ------------------------------------------------------------------------------
with tab_campanas:
    st.markdown("### 🎯 Rendimiento de Campañas Click-to-WhatsApp (Meta Ads)")
    st.markdown("Eficacia de anuncios publicitarios: Terreno G77, Condominio Mar Adentro, Depto 4 Dormitorios y Orgánico.")

    if not df_filtered.empty:
        camp_metrics = df_filtered.groupby("campana").agg(
            Leads=("id", "count"),
            Potenciales=("prioridad", lambda x: (x == "POTENCIAL").sum()),
            Visitas=("etapa", lambda x: (x == "VISITA_AGENDADA").sum()),
            Score_Medio=("score", "mean"),
            Pipeline=("presupuesto_usd", "sum")
        ).reset_index()

        camp_metrics["Conversion_Visita"] = (camp_metrics["Visitas"] / camp_metrics["Leads"] * 100).round(1)
        camp_metrics["Score_Medio"] = camp_metrics["Score_Medio"].round(1)

        c_col1, c_col2 = st.columns([3, 2])
        with c_col1:
            fig_camp = px.bar(
                camp_metrics,
                x="campana",
                y="Leads",
                color="Conversion_Visita",
                text="Leads",
                title="Prospectos Generados y Tasa de Conversión a Cita (%)",
                color_continuous_scale=["#3182CE", "#D4AF37", "#00D287"]
            )
            fig_camp.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                height=350,
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_camp, use_container_width=True)

        with c_col2:
            fig_p_camp = px.pie(
                camp_metrics,
                names="campana",
                values="Pipeline",
                hole=0.5,
                title="Volumen Económico por Campaña ($ USD)",
                color_discrete_sequence=["#D4AF37", "#00D287", "#3182CE", "#9F7AEA", "#ED8936"]
            )
            fig_p_camp.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                height=350,
                margin=dict(l=10, r=10, t=40, b=20)
            )
            st.plotly_chart(fig_p_camp, use_container_width=True)

        st.dataframe(camp_metrics.rename(columns={
            "campana": "Campaña Publicitaria",
            "Leads": "Total Leads",
            "Potenciales": "🔥 Potenciales",
            "Visitas": "📅 Visitas Agendadas",
            "Conversion_Visita": "% Conversión a Visita",
            "Score_Medio": "Score Medio",
            "Pipeline": "Valor Proyectado ($ USD)"
        }), use_container_width=True, hide_index=True)


# ------------------------------------------------------------------------------
# TAB 5: EXPLORADOR DE LEADS & CRM WHATSAPP EN 1 CLIC
# ------------------------------------------------------------------------------
with tab_crm:
    st.markdown("### 📋 Directorio Comercial & Atención Directa por WhatsApp")
    st.markdown("Selecciona un prospecto para ver el historial de chat con ONEBot y contactarlo con un solo clic.")

    if not df_filtered.empty:
        # Preparar tabla visual
        display_df = df_filtered[[
            "id", "fecha_corta", "nombre", "celular", "zona", "campana",
            "etapa", "prioridad", "score", "asesor", "presupuesto_usd"
        ]].copy()

        st.dataframe(
            display_df.rename(columns={
                "id": "ID Lead",
                "fecha_corta": "Fecha",
                "nombre": "Cliente",
                "celular": "Celular",
                "zona": "Zona / Interés",
                "campana": "Campaña",
                "etapa": "Etapa",
                "prioridad": "Prioridad",
                "score": "Score",
                "asesor": "e-Realtor",
                "presupuesto_usd": "Presupuesto ($)"
            }),
            use_container_width=True,
            hide_index=True,
            height=300
        )

        st.markdown("#### 🔍 Ficha Detallada del Prospecto")
        lead_options = df_filtered["id"].tolist()
        selected_lead_id = st.selectbox(
            "Seleccionar ID de Lead para inspeccionar:",
            lead_options,
            format_func=lambda x: f"{x} — {df_filtered.loc[df_filtered['id'] == x, 'nombre'].values[0]} ({df_filtered.loc[df_filtered['id'] == x, 'celular'].values[0]})"
        )

        lead_row = df_filtered[df_filtered["id"] == selected_lead_id].iloc[0]
        raw_obj = lead_row["raw_data"]

        c_d1, c_d2 = st.columns([1, 1])

        with c_d1:
            st.markdown(f"""
            <div style="background: rgba(22, 27, 38, 0.85); border: 1px solid var(--border-gold); border-radius: 12px; padding: 18px;">
                <h4 style="margin: 0 0 12px 0; color: #F4E5A1;">👤 Datos del Prospecto</h4>
                <p><b>Nombre:</b> {lead_row['nombre']}</p>
                <p><b>Celular:</b> {lead_row['celular']} &nbsp;
                    <a href="https://wa.me/{lead_row['whatsapp_num']}" target="_blank" style="background: #25D366; color: white; padding: 3px 8px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">
                        📲 Abrir WhatsApp
                    </a>
                </p>
                <p><b>Email:</b> {lead_row['email']}</p>
                <p><b>Zona de Interés:</b> {lead_row['zona']}</p>
                <p><b>Presupuesto Estimado:</b> ${lead_row['presupuesto_usd']:,.0f} USD (Bs {lead_row['presupuesto_usd']*6.96:,.0f})</p>
                <p><b>e-Realtor Asignado:</b> {lead_row['asesor']} ({lead_row['asesor_esp']})</p>
                <p><b>Acción Recomendada:</b> {lead_row['accion_sugerida']}</p>
            </div>
            """, unsafe_allow_html=True)

        with c_d2:
            st.markdown("#### 💬 Historial de Conversación con ONEBot")
            historial = raw_obj.get("historial", [])
            if historial:
                chat_box = '<div style="background: rgba(10, 12, 16, 0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; max-height: 250px; overflow-y: auto;">'
                for msg in historial:
                    rol = msg.get("rol", "usuario")
                    txt = msg.get("texto", "")
                    hora = msg.get("hora", "")
                    if rol == "usuario":
                        chat_box += f'<div style="text-align: right; margin-bottom: 8px;"><span style="background: #005c4b; color: #fff; padding: 6px 12px; border-radius: 10px; display: inline-block; font-size: 13px;">{txt} <span style="font-size: 10px; opacity: 0.7;">{hora}</span></span></div>'
                    else:
                        chat_box += f'<div style="text-align: left; margin-bottom: 8px;"><span style="background: #202c33; color: #fff; padding: 6px 12px; border-radius: 10px; display: inline-block; font-size: 13px;">🤖 {txt} <span style="font-size: 10px; opacity: 0.7;">{hora}</span></span></div>'
                chat_box += '</div>'
                st.markdown(chat_box, unsafe_allow_html=True)
            else:
                st.info("Sin mensajes previos registrados en el historial.")

        st.markdown("---")
        st.markdown("#### 📥 Exportar Base de Datos")
        exp_col1, exp_col2 = st.columns(2)
        with exp_col1:
            csv_data = df_filtered.to_csv(index=False).encode("utf-8-sig")
            st.download_button(
                label="📄 Descargar Leads Filtrados (.CSV UTF-8)",
                data=csv_data,
                file_name=f"realty_one_leads_{date.today()}.csv",
                mime="text/csv",
                use_container_width=True
            )
        with exp_col2:
            # Excel export
            import io
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
                df_filtered.to_excel(writer, sheet_name="Leads", index=False)
            st.download_button(
                label="📊 Descargar Reporte Completo (.XLSX Excel)",
                data=buffer.getvalue(),
                file_name=f"realty_one_leads_{date.today()}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                use_container_width=True
            )


# ------------------------------------------------------------------------------
# TAB 6: REGISTRO MANUAL DE NUEVO LEAD
# ------------------------------------------------------------------------------
with tab_nuevo:
    st.markdown("### ➕ Registrar Nuevo Prospecto en One Comsys")
    st.markdown("Ingreso rápido para llamadas telefónicas, clientes walk-in a oficina o captaciones directas.")

    with st.form("form_nuevo_lead"):
        f_col1, f_col2 = st.columns(2)
        with f_col1:
            in_nombre = st.text_input("👤 Nombre y Apellido:", "")
            in_celular = st.text_input("📱 Número de Celular / WhatsApp (ej: 77012345):", "")
            in_email = st.text_input("✉️ Correo Electrónico:", "")
            in_zona = st.selectbox("📍 Zona / Proyecto de Interés:", [
                "Condominio Mar Adentro / Urubó",
                "Terreno Parque Industrial / G77 (7.000 m²)",
                "Departamento 4 Dormitorios (119 m²)",
                "Equipetrol (Venta / Alquiler)",
                "Sirari / Las Palmas",
                "Zona Norte / Av. Banzer",
                "Anticrético Seguro",
                "Otra Ubicación"
            ])

        with f_col2:
            in_presupuesto = st.number_input("💰 Presupuesto Estimado ($ USD):", min_value=0.0, value=100000.0, step=5000.0)
            in_canal = st.selectbox("📢 Canal de Origen:", [
                "Llamada Telefónica Directa",
                "Oficina Presencial (Walk-in)",
                "WhatsApp (+591 60937050)",
                "Referido por Amigo / Cliente",
                "Facebook / Instagram Orgánico"
            ])
            in_asesor = st.selectbox("👤 e-Realtor Asignado:", [
                "Carlos Rodríguez (Venta de Lujo)",
                "Andrés Montaño (Terrenos & Parque Industrial)",
                "Valeria Suárez (Alquileres Corporativos)",
                "Lucía Vaca (Anticréticos Seguros)",
                "Robert Oliva (Master Broker / Captaciones)"
            ])
            in_notas = st.text_area("📝 Notas y Requerimientos del Cliente:", "")

        submit_btn = st.form_submit_button("💾 Guardar y Registrar en CRM", use_container_width=True)

        if submit_btn:
            if not in_nombre.strip() or not in_celular.strip():
                st.error("Por favor ingresa al menos Nombre y Celular del prospecto.")
            else:
                new_lead_id = f"lead_{int(datetime.now().timestamp()*1000)}"
                now_iso = datetime.now().isoformat()
                asesor_name = in_asesor.split(" (")[0]

                new_record = {
                    "id": new_lead_id,
                    "numero_celular": in_celular.strip(),
                    "cliente_nombre": in_nombre.strip(),
                    "email": in_email.strip(),
                    "fecha_creacion": now_iso,
                    "fecha_completa": str(date.today()),
                    "hora": datetime.now().strftime("%H:%M:%S"),
                    "dia": datetime.now().strftime("%d"),
                    "dia_semana": datetime.now().strftime("%A"),
                    "mes": datetime.now().strftime("%B"),
                    "anio": str(date.today().year),
                    "canal_origen": in_canal,
                    "campana": in_zona,
                    "estado_comercial": "Visita Agendada" if "Visita" in in_notas else "Contactado",
                    "etapa_embudo": "VISITA_AGENDADA" if "Visita" in in_notas else "CONTACTADO",
                    "notas_asesor": in_notas,
                    "ultimo_mensaje": in_notas or "Lead registrado manualmente desde Streamlit CRM",
                    "total_mensajes": 1,
                    "historial": [
                        {"rol": "usuario", "texto": in_notas or "Registro inicial", "fecha": str(date.today()), "hora": datetime.now().strftime("%H:%M:%S")}
                    ],
                    "zona_interes": in_zona,
                    "tipo_interes": "Compra",
                    "presupuesto": str(in_presupuesto),
                    "e_realtor_asignado": asesor_name,
                    "e_realtor_telefono": "+591 60937050",
                    "e_realtor_especialidad": in_asesor,
                    "prioridad": "POTENCIAL",
                    "prioridad_label": "🔥 Potencial (Alta)",
                    "prioridad_badge": "badge-potencial",
                    "score": 90,
                    "accion_sugerida": "Llamada de bienvenida y coordinación de visita.",
                    "resumen": in_notas or "Lead registrado desde panel administrativo.",
                    "ultima_actividad": now_iso
                }

                # Guardar en leads.json
                fp = find_leads_filepath()
                try:
                    all_leads = []
                    if os.path.exists(fp):
                        with open(fp, "r", encoding="utf-8") as f:
                            all_leads = json.load(f)
                    all_leads.insert(0, new_record)
                    with open(fp, "w", encoding="utf-8") as f:
                        json.dump(all_leads, f, indent=2, ensure_ascii=False)

                    # Si existe backend/leads.json sincronizarlo
                    bp = os.path.join(os.path.dirname(__file__), "backend", "leads.json")
                    if os.path.exists(bp) and os.path.abspath(bp) != os.path.abspath(fp):
                        with open(bp, "w", encoding="utf-8") as f:
                            json.dump(all_leads, f, indent=2, ensure_ascii=False)

                    st.success(f"🎉 ¡Prospecto {in_nombre} registrado con éxito en One Comsys con ID `{new_lead_id}`!")
                    st.cache_data.clear()
                    st.rerun()
                except Exception as ex:
                    st.error(f"Error al guardar lead: {ex}")
