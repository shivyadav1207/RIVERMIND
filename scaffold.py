import os

base = 'assam_flood_engine'
dirs = ['data', 'models', 'inference', 'api', 'visualization', 'config', 'tests', 'scripts']

for d in dirs:
    os.makedirs(os.path.join(base, d), exist_ok=True)

with open(os.path.join(base, 'requirements_assam.txt'), 'w') as f:
    f.write('tensorflow==2.15.0\npandas==2.1.0\nnumpy==1.26.0\nfastapi==0.109.0\nuvicorn==0.27.0\npydantic==2.5.0\nmatplotlib==3.8.0\nseaborn==0.13.0\nplotly==5.18.0\ngeopandas==0.14.0\nfolium==0.15.0\nrequests==2.31.0\n')

with open(os.path.join(base, 'Dockerfile'), 'w') as f:
    f.write('FROM python:3.10-slim\nWORKDIR /app\nCOPY requirements_assam.txt .\nRUN pip install --no-cache-dir -r requirements_assam.txt\nCOPY . .\nCMD ["uvicorn", "api.main_assam:app", "--host", "0.0.0.0", "--port", "8000"]\n')

with open(os.path.join(base, 'docker-compose.yml'), 'w') as f:
    f.write('version: "3.8"\nservices:\n  api:\n    build: .\n    ports:\n      - "8000:8000"\n    depends_on:\n      - redis\n      - db\n  redis:\n    image: "redis:alpine"\n  db:\n    image: "postgres:13"\n    environment:\n      POSTGRES_USER: assam\n      POSTGRES_PASSWORD: password\n      POSTGRES_DB: assam_floods\n')

with open(os.path.join(base, 'README_assam.md'), 'w') as f:
    f.write('# RiverMind - Assam Insights Module\n\nProduction-grade 1D CNN + LSTM hybrid model for rainfall forecasting specifically for Assam, India.\n')

files = [
    'data/loader_assam.py', 'data/preprocessing_assam.py', 'data/imputation_assam.py',
    'models/architecture_cnn_lstm.py', 'models/training_assam.py', 'models/evaluation_assam.py', 'models/zone_clustering.py',
    'inference/predictor_assam.py', 'inference/flood_integration_assam.py', 'inference/assamese_translation.py',
    'api/main_assam.py', 'api/schemas_assam.py', 'api/utils_assam.py',
    'visualization/plots_assam.py', 'visualization/dashboards_assam.py',
    'config/config_assam.yaml', 'config/districts_assam.yaml', 'config/thresholds_assam.yaml', 'config/gauge_levels_assam.yaml',
    'tests/test_assam_data_loader.py', 'tests/test_assam_model.py', 'tests/test_assam_api.py',
    'scripts/train_all_zones_assam.py', 'scripts/evaluate_all_districts_assam.py', 'scripts/deploy_assam_model.py'
]

for file in files:
    with open(os.path.join(base, file), 'w') as f:
        f.write('# Auto-generated placeholder for ' + file.split('/')[-1] + '\n')
