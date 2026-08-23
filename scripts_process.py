import pandas as pd
import json
import re

# Load data
df_proc = pd.read_csv('processed_rivermind_data.csv')
df_meta = pd.read_csv('metadata_indofloods (2).csv')
with open('india_states.geojson', 'r', encoding='utf-8') as f:
    geojson = json.load(f)

geojson_states = [feat['properties']['NAME_1'] for feat in geojson['features']]
print("GeoJSON States count:", len(geojson_states))
print("GeoJSON States:", sorted(geojson_states))

# Standardize Station names in both datasets
def clean_str(s):
    if pd.isna(s):
        return ''
    s = str(s).strip()
    return s

def norm_key(s):
    return re.sub(r'[^a-zA-Z0-9]', '', str(s).lower())

df_proc['clean_station'] = df_proc['Station'].apply(clean_str)
df_proc['norm_station'] = df_proc['Station'].apply(norm_key)

df_meta['clean_station'] = df_meta['Station'].apply(clean_str)
df_meta['norm_station'] = df_meta['Station'].apply(norm_key)

# Let's create lookup dict from meta
meta_by_norm = {}
meta_by_coords = {}
for idx, row in df_meta.iterrows():
    meta_by_norm[row['norm_station']] = row
    # round lat lon to 2 decimals
    lat_r = round(float(row['Latitude']), 2)
    lon_r = round(float(row['Longitude']), 2)
    meta_by_coords[(lat_r, lon_r)] = row

# State name normalizer
state_mapping = {
    'orissa': 'Odisha',
    'uttaranchal': 'Uttarakhand',
    'delhi': 'NCT of Delhi' if 'NCT of Delhi' in geojson_states else 'Delhi',
    'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli' if 'Dadra and Nagar Haveli' in geojson_states else 'Daman and Diu'
}

hotspots = []
unmatched = []

# Color / severity normalizer
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
    river = None
    basin = None
    warning_lvl = None
    danger_lvl = None
    reliability = None
    
    if meta_row is not None:
        state_name = clean_str(meta_row['State'])
        river = clean_str(meta_row.get('River Name/ Tributory/ SubTributory', ''))
        basin = clean_str(meta_row.get('Basin', ''))
        warning_lvl = meta_row.get('Warning Level', '')
        danger_lvl = meta_row.get('Danger Level', '')
        reliability = meta_row.get('Reliability', '')
    
    # If state still missing, let's look at special names or lat/lon
    if not state_name or state_name == 'nan':
        if 'Assam' in st_name or 'Brahmaputra' in st_name or 'Guwahati' in st_name or 'Jorhat' in st_name or 'Dibrugarh' in st_name or 'Silchar' in st_name:
            state_name = 'Assam'
        elif 'Bihar' in st_name or 'Kosi' in st_name or 'Darbhanga' in st_name:
            state_name = 'Bihar'
        elif 'Delhi' in st_name:
            state_name = 'Delhi'
        elif 'Haridwar' in st_name or 'Rishikesh' in st_name or 'Shrinagar' in st_name or 'Karanprayag' in st_name or 'Koteswar' in st_name or 'Joshimath' in st_name:
            state_name = 'Uttarakhand'
        elif 'Lucknow' in st_name or 'Kanpur' in st_name or 'Moradabad' in st_name or 'Bareilly' in st_name or 'Garhmukteshwar' in st_name or 'Narora' in st_name or 'Fatehgarh' in st_name or 'Kannauj' in st_name or 'Ankinghat' in st_name or 'Dalmau' in st_name or 'Bhatpurwagat' in st_name or 'Dabri' in st_name or 'Kachlabridge' in st_name or 'Mawi' in st_name:
            state_name = 'Uttar Pradesh'
        elif 'Karnal' in st_name:
            state_name = 'Haryana'
        elif 'Paonta' in st_name:
            state_name = 'Himachal Pradesh'
        elif 'Mettur' in st_name:
            state_name = 'Tamil Nadu'
        elif 'Bhadra' in st_name or 'T.K.Halli' in st_name or 'T. Bekkupe' in st_name or 'Gokak' in st_name or 'Narayanpur' in st_name:
            state_name = 'Karnataka'
        elif 'Srisailam' in st_name or 'Dowlaiswaram' in st_name or 'K. Agraharam' in st_name:
            state_name = 'Andhra Pradesh'
        elif 'Singur' in st_name or 'Nizam Sagar' in st_name or 'Deongaon' in st_name:
            state_name = 'Telangana'
        elif 'Sadalga' in st_name or 'Terwad' in st_name or 'Arjunwad' in st_name or 'Samdoli' in st_name or 'Ujani' in st_name or 'Bamni' in st_name:
            state_name = 'Maharashtra'
        elif 'Rengali' in st_name or 'Govindapur' in st_name:
            state_name = 'Odisha'
        elif 'Indirasagar' in st_name:
            state_name = 'Madhya Pradesh'
        elif 'Panam' in st_name or 'Kadana' in st_name or 'Shahijina' in st_name:
            state_name = 'Gujarat'
        elif 'Aklera' in st_name or 'Banas At Abu' in st_name or 'Mahi Dam' in st_name:
            state_name = 'Rajasthan'
        elif 'Englishbazar' in st_name or 'Mathabhanga' in st_name or 'Domohani' in st_name or 'Patna (Lgd) Kalna' in st_name or 'Gheropara' in st_name:
            state_name = 'West Bengal'
        elif 'Dheng Bridge' in st_name:
            state_name = 'Bihar'
        elif 'Bani' in st_name:
            state_name = 'Jammu and Kashmir'
        else:
            unmatched.append((st_name, lat, lon))
            
    # Normalize state name to match GeoJSON properties if needed
    for g_state in geojson_states:
        if state_name and (g_state.lower() == state_name.lower() or state_name.lower() in g_state.lower() or g_state.lower() in state_name.lower()):
            state_name = g_state
            break
            
    raw_sev = str(row['Danger_Color']).strip()
    sev = sev_map.get(raw_sev, 'Yellow')
    
    peak_flood = row.get('Peak_Flood_Level', 0.0)
    danger_level = row.get('Danger_Level', 0.0)
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
        "reliability": str(reliability) if reliability and pd.notna(reliability) else 'Verified'
    }
    
    hotspots.append({
        "latitude": round(lat, 5),
        "longitude": round(lon, 5),
        "severity_level": sev,
        "state_name": state_name,
        "location_details": loc_details
    })

print(f"Total Hotspots prepared: {len(hotspots)}")
print(f"Unmatched: {len(unmatched)}")
if unmatched:
    print("Unmatched items:", unmatched)

# State distribution
state_counts = {}
for h in hotspots:
    sn = h['state_name']
    state_counts[sn] = state_counts.get(sn, 0) + 1

print("\nHotspots count per State:")
for sn, count in sorted(state_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {sn}: {count}")

# Verify GeoJSON matching
geojson_names = set(geojson_states)
for sn in state_counts:
    if sn not in geojson_names:
        print(f"WARNING: State '{sn}' not in GeoJSON features!")

# Save to hotspots.json
with open('hotspots.json', 'w', encoding='utf-8') as f:
    json.dump(hotspots, f, indent=2)

print("Saved hotspots.json successfully!")
