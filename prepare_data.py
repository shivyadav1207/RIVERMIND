import pandas as pd
import json
import urllib.request
import os

print("Starting data preparation...")
df_proc = pd.read_csv('processed_rivermind_data.csv')
df_meta = pd.read_csv('metadata_indofloods (2).csv')

print(f"Loaded processed data: {len(df_proc)} rows")
print(f"Loaded metadata: {len(df_meta)} rows")

# Strip string columns
df_proc['Station'] = df_proc['Station'].astype(str).str.strip()
df_meta['Station'] = df_meta['Station'].astype(str).str.strip()
df_meta['State'] = df_meta['State'].astype(str).str.strip()

# Merge
merged = pd.merge(df_proc, df_meta, on='Station', how='left', suffixes=('', '_meta'))

print("Merged columns:", merged.columns.tolist())
print(f"State nulls: {merged['State'].isna().sum()}")

# Fill missing states or lat/lon if needed
if merged['State'].isna().sum() > 0:
    print("Null state rows:")
    print(merged[merged['State'].isna()][['Station', 'Latitude', 'Longitude']])

# Download India state geojson if not present
geojson_url = "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States"
# Or civictech / datameet
geojson_file = "india_states.geojson"

urls_to_try = [
    "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States",
    "https://raw.githubusercontent.com/civictech-India/INDIA-GEO-JSON-Datasets/master/india_states.json",
    "https://raw.githubusercontent.com/udit-001/india-maps-data/master/geojson/india.geojson",
    "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson"
]

geojson_data = None
for url in urls_to_try:
    try:
        print(f"Trying to download GeoJSON from {url}...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            content = response.read().decode('utf-8')
            data = json.loads(content)
            if 'features' in data and len(data['features']) > 15:
                geojson_data = data
                print(f"Successfully downloaded GeoJSON with {len(data['features'])} features!")
                with open(geojson_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                break
    except Exception as e:
        print(f"Failed {url}: {e}")

if geojson_data:
    print("Sample feature properties in GeoJSON:")
    for f in geojson_data['features'][:5]:
        print(f['properties'])
