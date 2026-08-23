import streamlit as st
import pandas as pd
import folium
from streamlit_folium import st_folium
from folium.plugins import HeatMap

# 1. Page Setup & App Logo in Browser Tab
st.set_page_config(
    page_title="RiverMind Flood & Rainfall Predictor", 
    page_icon="logo.jpeg", 
    layout="wide"
)
st.markdown("""
    <style>
        .block-container {
            padding-top: 1rem !important;
        }
        header.stAppHeader {
            background-color: transparent;
        }
    </style>
""", unsafe_allow_html=True)
# Custom Styling
st.markdown("""
    <style>
        .main-title { font-size: 32px; font-weight: 700; color: #1e3d59; margin-bottom: 0px; }
        .sub-text { font-size: 16px; color: #576574; margin-bottom: 20px; }
    </style>
""", unsafe_allow_html=True)

st.markdown('<p class="main-title">RiverMind: Multi-Tier Flood & Rainfall Analyzer</p>', unsafe_allow_html=True)
st.markdown('<p class="sub-text">Interactive multi-tier hotspot analysis with clean, streamlined gauge popups.</p>', unsafe_allow_html=True)

# 2. Load Processed Data
@st.cache_data
def load_data():
    return pd.read_csv('processed_rivermind_data.csv')

try:
    station_df = load_data()
    tier_counts = station_df['Danger_Color'].value_counts()
    rain_counts = station_df['Rain_Tier'].value_counts() if 'Rain_Tier' in station_df.columns else {}

    # 3. Sidebar Controls & Logo Display
    try:
        st.sidebar.image("logo.jpeg", use_container_width=True)
    except Exception:
        pass

    st.sidebar.header("Map Layer Controls")
    map_mode = st.sidebar.radio(
        "Select Map Visualization:",
        ["Flood Risk Tiers (Red/Orange/Yellow)", "Rainfall Tiers (Blue Spectrum)"]
    )

    st.sidebar.markdown("---")
    st.sidebar.header("Station Summary")
    st.sidebar.markdown(f"**Total Gauges Analyzed:** {len(station_df)}")
    
    if map_mode.startswith("Flood"):
        st.sidebar.markdown(f"🔴 **High Danger:** {tier_counts.get('red', 0)}")
        st.sidebar.markdown(f"🟠 **Moderate Danger:** {tier_counts.get('orange', 0)}")
        st.sidebar.markdown(f"🟡 **Low Danger:** {tier_counts.get('yellow', 0)}")
    else:
        st.sidebar.markdown(f"🔵 **Heavy Rain (>67%):** {rain_counts.get('heavy', 0)}")
        st.sidebar.markdown(f"🔵 **Moderate Rain:** {rain_counts.get('moderate', 0)}")
        st.sidebar.markdown(f"🔵 **Light Rain (<33%):** {rain_counts.get('light', 0)}")

    # 4. Base Map Setup
    india_map = folium.Map(
        location=[20.5937, 78.9629], 
        zoom_start=5, 
        tiles='OpenStreetMap'
    )

    lat_col = 'Latitude'
    lon_col = 'Longitude'

    if map_mode.startswith("Rainfall"):
        st.markdown("### Rainfall View(HIGH/MODERATE/LOW)")
        st.info("Displaying independent light, moderate, and heavy rainfall tiers with zoom-scaled heatmaps.")
        
        rain_heavy = station_df[station_df['Rain_Tier'] == 'heavy']
        rain_moderate = station_df[station_df['Rain_Tier'] == 'moderate']
        rain_light = station_df[station_df['Rain_Tier'] == 'light']
        HeatMap(
            rain_light[[lat_col, lon_col]].values.tolist(),
            radius=12, blur=8, min_opacity=0.3, scale_radius=True,
            gradient={0.2: '#eff3ff', 0.6: '#bdd7e3', 1.0: '#6baed6'},
            name="Light Rain Heatmap"
        ).add_to(india_map)

        HeatMap(
            rain_moderate[[lat_col, lon_col]].values.tolist(),
            radius=12, blur=8, min_opacity=0.4, scale_radius=True,
            gradient={0.2: '#bdd7e3', 0.6: '#6baed6', 1.0: '#3182bd'},
            name="Moderate Rain Heatmap"
        ).add_to(india_map)

        HeatMap(
            rain_heavy[[lat_col, lon_col]].values.tolist(),
            radius=14, blur=9, min_opacity=0.5, scale_radius=True,
            gradient={0.2: '#6baed6', 0.6: '#3182bd', 1.0: '#08519c'},
            name="Heavy Rain Heatmap"
        ).add_to(india_map)

        for idx, row in station_df.iterrows():
            rtier = row.get('Rain_Tier', 'light')
            if rtier == 'heavy':
                radius, fill_color, border_color = 6, '#08519c', '#04204d'
            elif rtier == 'moderate':
                radius, fill_color, border_color = 5, '#3182bd', '#104e8b'
            else:
                radius, fill_color, border_color = 4, '#6baed6', '#317873'

            station_name = row.get('Station', 'Gauge Station')
            precip = row.get('Precipitation_mm', 0.0)

            popup_html = f"""
            <div style="font-family: Arial, sans-serif; width: 210px; padding: 5px;">
                <h4 style="margin: 0px 0px 8px 0px; color: #08519c; border-bottom: 2px solid {fill_color}; padding-bottom: 4px;">
                    {station_name}
                </h4>
                <p style="margin: 4px 0px;"><b>Max Precipitation:</b> {precip:.1f} mm</p>
                <p style="margin: 4px 0px;"><b>Rainfall Tier:</b> <span style="color: {fill_color}; font-weight: bold; text-transform: uppercase;">{rtier}</span></p>
            </div>
            """

            folium.CircleMarker(
                location=[row[lat_col], row[lon_col]],
                radius=radius, color=border_color, fill=True,
                fill_color=fill_color, fill_opacity=0.85,
                tooltip=f"Click for details: {station_name}",
                popup=folium.Popup(popup_html, max_width=300)
            ).add_to(india_map)

    else:
        st.markdown("### Flood Risk Severity View")
        red_data = station_df[station_df['Danger_Color'] == 'red']
        orange_data = station_df[station_df['Danger_Color'] == 'orange']
        yellow_data = station_df[station_df['Danger_Color'] == 'yellow']

        # Background Heatmaps for Flood Risk
        HeatMap(
            yellow_data[[lat_col, lon_col]].values.tolist(),
            radius=12, blur=8, min_opacity=0.3, scale_radius=True,
            gradient={0.2: '#ffffb2', 0.6: '#fed976', 1.0: '#feb24c'},
            name="🟡 Low Danger"
        ).add_to(india_map)

        HeatMap(
            orange_data[[lat_col, lon_col]].values.tolist(),
            radius=12, blur=8, min_opacity=0.4, scale_radius=True,
            gradient={0.2: '#fed976', 0.6: '#fd8d3c', 1.0: '#f03b20'},
            name="🟠 Moderate Danger"
        ).add_to(india_map)

        HeatMap(
            red_data[[lat_col, lon_col]].values.tolist(),
            radius=14, blur=9, min_opacity=0.5, scale_radius=True,
            gradient={0.2: '#fc9272', 0.6: '#de2d26', 1.0: '#99000d'},
            name="🔴 High Danger"
        ).add_to(india_map)

        # Gauge Markers for Flood View with Clean Popups
        for idx, row in station_df.iterrows():
            color = row['Danger_Color']
            radius = 6 if color == 'red' else (5 if color == 'orange' else 4)
            border_color = 'darkred' if color == 'red' else ('#d35400' if color == 'orange' else '#b7950b')
            fill_color = 'red' if color == 'red' else ('#e67e22' if color == 'orange' else '#f1c40f')

            station_name = row.get('Station', 'Monitoring Station')
            peak_level = row.get('Peak_Flood_Level', 'N/A')
            danger_level = row.get('Danger_Level', 'N/A')

            popup_html = f"""
            <div style="font-family: Arial, sans-serif; width: 210px; padding: 5px;">
                <h4 style="margin: 0px 0px 8px 0px; color: #1e3d59; border-bottom: 2px solid {color}; padding-bottom: 4px;">
                    {station_name}
                </h4>
                <p style="margin: 4px 0px;"><b>Peak Flood Level:</b> {peak_level} m</p>
                <p style="margin: 4px 0px;"><b>Danger Threshold:</b> {danger_level} m</p>
                <p style="margin: 4px 0px;"><b>Risk Severity:</b> <span style="color: {color}; font-weight: bold; text-transform: uppercase;">{color}</span></p>
            </div>
            """

            folium.CircleMarker(
                location=[row[lat_col], row[lon_col]],
                radius=radius, color=border_color, fill=True,
                fill_color=fill_color, fill_opacity=0.85,
                tooltip=f"Click for details: {station_name}",
                popup=folium.Popup(popup_html, max_width=300)
            ).add_to(india_map)

    # 5. Render Map
    folium.LayerControl(collapsed=False).add_to(india_map)
    st_folium(india_map, width=1200, height=600, use_container_width=True)

except Exception as e:
    st.error(f"Error loading app: {e}")