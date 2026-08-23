import json
import pandas as pd
import re
import sys

print("Loading datasets...", flush=True)
with open('india_states_updated.geojson', 'r', encoding='utf-8') as f:
    geojson = json.load(f)

# Normalize state names in geojson
states_in_geojson = []
for feat in geojson['features']:
    props = feat['properties']
    name = props.get('NAME_1') or props.get('st_nm') or props.get('STATE') or props.get('name')
    # Standardize names
    if name == 'Orissa':
        name = 'Odisha'
    elif name == 'Uttaranchal':
        name = 'Uttarakhand'
    elif name == 'Telengana':
        name = 'Telangana'
    props['NAME_1'] = name
    props['state_name'] = name
    states_in_geojson.append(name)

print(f"GeoJSON contains {len(states_in_geojson)} states/UTs: {sorted(states_in_geojson)}", flush=True)

# Process hotspots
df_proc = pd.read_csv('processed_rivermind_data.csv')
df_meta = pd.read_csv('metadata_indofloods (2).csv')

def clean_str(s):
    if pd.isna(s): return ''
    return str(s).strip()

def norm_key(s):
    return re.sub(r'[^a-zA-Z0-9]', '', str(s).lower())

df_proc['clean_station'] = df_proc['Station'].apply(clean_str)
df_proc['norm_station'] = df_proc['Station'].apply(norm_key)
df_meta['clean_station'] = df_meta['Station'].apply(clean_str)
df_meta['norm_station'] = df_meta['Station'].apply(norm_key)

meta_by_norm = {}
meta_by_coords = {}
for idx, row in df_meta.iterrows():
    meta_by_norm[row['norm_station']] = row
    lat_r = round(float(row['Latitude']), 2)
    lon_r = round(float(row['Longitude']), 2)
    meta_by_coords[(lat_r, lon_r)] = row

sev_map = {
    'red': 'Red',
    'orange': 'Orange',
    'yellow': 'Yellow',
    'RED': 'Red',
    'ORANGE': 'Orange',
    'YELLOW': 'Yellow',
    'Red': 'Red',
    'Orange': 'Orange',
    'Yellow': 'Yellow'
}

hotspots = []
for idx, row in df_proc.iterrows():
    st_name = row['clean_station']
    norm_st = row['norm_station']
    lat = float(row['Latitude'])
    lon = float(row['Longitude'])
    lat_r = round(lat, 2)
    lon_r = round(lon, 2)
    
    meta_row = meta_by_norm.get(norm_st)
    if meta_row is None:
        meta_row = meta_by_coords.get((lat_r, lon_r))
    
    state_name = None
    river = ""
    basin = ""
    warning_lvl = None
    danger_lvl = None
    reliability = "Verified"
    
    if meta_row is not None:
        state_name = clean_str(meta_row.get('State', ''))
        river = clean_str(meta_row.get('River Name/ Tributory/ SubTributory', ''))
        basin = clean_str(meta_row.get('Basin', ''))
        warning_lvl = meta_row.get('Warning Level')
        danger_lvl = meta_row.get('Danger Level')
        reliability = clean_str(meta_row.get('Reliability', 'Safe'))
    
    # State name normalization
    if not state_name or state_name == 'nan':
        if any(x in st_name for x in ['Assam', 'Brahmaputra', 'Guwahati', 'Jorhat', 'Dibrugarh', 'Silchar']):
            state_name = 'Assam'
        elif any(x in st_name for x in ['Bihar', 'Kosi', 'Darbhanga', 'Dheng Bridge']):
            state_name = 'Bihar'
        elif 'Delhi' in st_name:
            state_name = 'Delhi'
        elif any(x in st_name for x in ['Haridwar', 'Rishikesh', 'Shrinagar', 'Karanprayag', 'Koteswar', 'Joshimath']):
            state_name = 'Uttarakhand'
        elif any(x in st_name for x in ['Lucknow', 'Kanpur', 'Moradabad', 'Bareilly', 'Garhmukteshwar', 'Narora', 'Fatehgarh', 'Kannauj', 'Ankinghat', 'Dalmau', 'Bhatpurwagat', 'Dabri', 'Kachlabridge', 'Mawi']):
            state_name = 'Uttar Pradesh'
        elif 'Karnal' in st_name:
            state_name = 'Haryana'
        elif 'Paonta' in st_name:
            state_name = 'Himachal Pradesh'
        elif 'Mettur' in st_name:
            state_name = 'Tamil Nadu'
        elif any(x in st_name for x in ['Bhadra', 'T.K.Halli', 'T. Bekkupe', 'Gokak', 'Narayanpur']):
            state_name = 'Karnataka'
        elif any(x in st_name for x in ['Srisailam', 'Dowlaiswaram', 'K. Agraharam']):
            state_name = 'Andhra Pradesh'
        elif any(x in st_name for x in ['Singur', 'Nizam Sagar', 'Deongaon']):
            state_name = 'Telangana'
        elif any(x in st_name for x in ['Sadalga', 'Terwad', 'Arjunwad', 'Samdoli', 'Ujani', 'Bamni']):
            state_name = 'Maharashtra'
        elif any(x in st_name for x in ['Rengali', 'Govindapur']):
            state_name = 'Odisha'
        elif 'Indirasagar' in st_name:
            state_name = 'Madhya Pradesh'
        elif any(x in st_name for x in ['Panam', 'Kadana', 'Shahijina']):
            state_name = 'Gujarat'
        elif any(x in st_name for x in ['Aklera', 'Banas At Abu', 'Mahi Dam']):
            state_name = 'Rajasthan'
        elif any(x in st_name for x in ['Englishbazar', 'Mathabhanga', 'Domohani', 'Patna (Lgd) Kalna', 'Gheropara']):
            state_name = 'West Bengal'
        elif 'Bani' in st_name:
            state_name = 'Jammu and Kashmir'
        else:
            state_name = 'Unknown'
            
    if state_name == 'Orissa': state_name = 'Odisha'
    if state_name == 'Uttaranchal': state_name = 'Uttarakhand'
    if state_name == 'Telengana': state_name = 'Telangana'
    if state_name == 'Dadra and Nagar Haveli and Daman and Diu': state_name = 'Dadra and Nagar Haveli'

    raw_sev = str(row['Danger_Color']).strip()
    sev = sev_map.get(raw_sev, 'Yellow')
    
    peak_flood = row.get('Peak_Flood_Level', 0.0)
    danger_level = row.get('Danger_Level', 0.0) if pd.notna(row.get('Danger_Level')) else danger_lvl
    risk_score = row.get('Calculated_Risk', 0.0)
    precip = row.get('Precipitation_mm', 0.0)
    rain_tier = row.get('Rain_Tier', 'moderate')
    
    loc_details = {
        "station_name": st_name,
        "state": state_name,
        "river": river if river else "Regional Tributary",
        "basin": basin if basin else "River Basin",
        "peak_flood_level_m": round(float(peak_flood), 2) if pd.notna(peak_flood) else 0.0,
        "danger_level_m": round(float(danger_level), 2) if pd.notna(danger_level) else 0.0,
        "calculated_risk_score": round(float(risk_score), 2) if pd.notna(risk_score) else 0.0,
        "precipitation_mm": round(float(precip), 2) if pd.notna(precip) else 0.0,
        "rain_tier": str(rain_tier).capitalize() if pd.notna(rain_tier) else 'Moderate',
        "reliability": str(reliability) if reliability else 'Safe'
    }
    
    hotspots.append({
        "id": f"hotspot-{idx+1}",
        "latitude": round(lat, 5),
        "longitude": round(lon, 5),
        "severity_level": sev,
        "state_name": state_name,
        "location_details": loc_details
    })

print(f"Total hotspots created: {len(hotspots)}", flush=True)

# Calculate dominant severity for each state with tie breaker: Red > Orange > Yellow
sev_weight = {'Red': 3, 'Orange': 2, 'Yellow': 1}
state_groups = {}
for h in hotspots:
    sn = h['state_name']
    state_groups.setdefault(sn, []).append(h['severity_level'])

state_dominant_map = {}
for sn, sevs in state_groups.items():
    counts = {}
    for s in sevs:
        counts[s] = counts.get(s, 0) + 1
    
    # Statistical mode with tie-breaker: Red > Orange > Yellow
    # Max by (count, sev_weight)
    dominant = max(counts.keys(), key=lambda k: (counts[k], sev_weight[k]))
    state_dominant_map[sn] = {
        'dominant_severity': dominant,
        'total_stations': len(sevs),
        'counts': counts
    }
    print(f"State: {sn:25} -> Dominant: {dominant:6} (Counts: {counts})", flush=True)

# Inject dominant severity and properties into GeoJSON
for feat in geojson['features']:
    sn = feat['properties']['NAME_1']
    info = state_dominant_map.get(sn)
    if info:
        feat['properties']['dominant_severity'] = info['dominant_severity']
        feat['properties']['total_stations'] = info['total_stations']
        feat['properties']['red_count'] = info['counts'].get('Red', 0)
        feat['properties']['orange_count'] = info['counts'].get('Orange', 0)
        feat['properties']['yellow_count'] = info['counts'].get('Yellow', 0)
    else:
        feat['properties']['dominant_severity'] = 'None'
        feat['properties']['total_stations'] = 0
        feat['properties']['red_count'] = 0
        feat['properties']['orange_count'] = 0
        feat['properties']['yellow_count'] = 0

# Save clean states geojson & hotspots json
with open('cleaned_india_states.geojson', 'w', encoding='utf-8') as f:
    json.dump(geojson, f)

with open('hotspots.json', 'w', encoding='utf-8') as f:
    json.dump(hotspots, f, indent=2)

print("All datasets prepared and validated successfully!", flush=True)
