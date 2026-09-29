import os
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, BatchNormalization, Dropout, MaxPooling1D, LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from sklearn.preprocessing import MinMaxScaler
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('AssamRainfallModel')

# Assam 5 Hydro-climatic Zones
ZONE_MAPPING = {
    'Dibrugarh': 'upper', 'Tinsukia': 'upper', 'Sivasagar': 'upper',
    'Jorhat': 'upper', 'Golaghat': 'upper', 'Lakhimpur': 'upper',
    'Dhemaji': 'upper', 'Majuli': 'upper',
    'Nagaon': 'central', 'Sonitpur': 'central', 'Biswanath': 'central',
    'Udalguri': 'central', 'Darrang': 'central',
    'Kamrup': 'lower', 'Nalbari': 'lower', 'Barpeta': 'lower',
    'Dhubri': 'lower', 'Goalpara': 'lower', 'Bongaigaon': 'lower',
    'Chirang': 'lower', 'Baksa': 'lower', 'Kokrajhar': 'lower',
    'Cachar': 'barak', 'Karimganj': 'barak', 'Hailakandi': 'barak',
    'Dima Hasao': 'hills', 'Karbi Anglong': 'hills', 'West Karbi Anglong': 'hills',
    'Kamrup Metropolitan': 'lower', 'South Salmara-Mankachar': 'lower',
    'Tamulpur': 'lower', 'Hojai': 'central', 'Charaideo': 'upper'
}

THRESHOLDS = {
    'upper': {'red_24h': 150, 'red_72h': 300, 'orange_24h': 80, 'orange_72h': 180, 'yellow_24h': 40, 'yellow_72h': 100},
    'central': {'red_24h': 150, 'red_72h': 300, 'orange_24h': 80, 'orange_72h': 180, 'yellow_24h': 40, 'yellow_72h': 100},
    'lower': {'red_24h': 150, 'red_72h': 300, 'orange_24h': 80, 'orange_72h': 180, 'yellow_24h': 40, 'yellow_72h': 100},
    'barak': {'red_24h': 200, 'red_72h': 400, 'orange_24h': 100, 'orange_72h': 220, 'yellow_24h': 50, 'yellow_72h': 120},
    'hills': {'red_24h': 180, 'red_72h': 350, 'orange_24h': 90, 'orange_72h': 200, 'yellow_24h': 45, 'yellow_72h': 110}
}

# --- 1. DATA PREPROCESSING ---
class AssamDataPreprocessor:
    def __init__(self, lookback=30, forecast_horizon=7):
        self.lookback = lookback
        self.forecast_horizon = forecast_horizon
        self.scalers = {}

    def preprocess_district_data(self, df, district):
        # df should contain ['date', 'rainfall_mm']
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').set_index('date')
        
        # Handle missing (forward fill <3 days, else interpolate)
        df['rainfall_mm'] = df['rainfall_mm'].ffill(limit=3).interpolate(method='time')
        
        # Feature Engineering
        df['rain_1d'] = df['rainfall_mm'].shift(1).fillna(0)
        df['rain_3d_sum'] = df['rainfall_mm'].rolling(window=3, min_periods=1).sum().shift(1).fillna(0)
        df['rain_7d_sum'] = df['rainfall_mm'].rolling(window=7, min_periods=1).sum().shift(1).fillna(0)
        df['rain_15d_sum'] = df['rainfall_mm'].rolling(window=15, min_periods=1).sum().shift(1).fillna(0)
        
        df['extreme_flag'] = (df['rainfall_mm'] > 150).astype(int).shift(1).fillna(0)
        
        # Month-based monsoon phase
        month = df.index.month
        df['is_monsoon'] = ((month >= 6) & (month <= 9)).astype(int)
        df['is_pre_monsoon'] = ((month >= 3) & (month <= 5)).astype(int)
        
        # Normalize
        scaler = MinMaxScaler()
        features = ['rainfall_mm', 'rain_1d', 'rain_3d_sum', 'rain_7d_sum', 'rain_15d_sum', 'extreme_flag', 'is_monsoon', 'is_pre_monsoon']
        df[features] = scaler.fit_transform(df[features])
        self.scalers[district] = scaler
        
        return df, features

    def create_sequences(self, df, feature_cols):
        X, y = [], []
        data = df[feature_cols].values
        target = df['rainfall_mm'].values # Assuming target is normalized rainfall
        
        for i in range(len(data) - self.lookback - self.forecast_horizon + 1):
            X.append(data[i:(i + self.lookback)])
            y.append(target[(i + self.lookback):(i + self.lookback + self.forecast_horizon)])
            
        return np.array(X), np.array(y)

# --- 2. MODEL ARCHITECTURE ---
def build_cnn_lstm_model(input_shape=(30, 8)):
    # Mixed precision for faster GPU training
    tf.keras.mixed_precision.set_global_policy('mixed_float16')
    
    model = Sequential([
        # CNN Block
        Conv1D(filters=128, kernel_size=3, activation='relu', padding='same', input_shape=input_shape),
        BatchNormalization(),
        Dropout(0.3),
        Conv1D(filters=64, kernel_size=3, activation='relu', padding='same'),
        BatchNormalization(),
        Dropout(0.3),
        MaxPooling1D(pool_size=2),
        
        # LSTM Block
        LSTM(units=100, return_sequences=True),
        Dropout(0.3),
        LSTM(units=50, return_sequences=False),
        Dropout(0.3),
        
        # Dense Block
        Dense(units=64, activation='relu'),
        Dropout(0.3),
        Dense(units=7, activation='linear', dtype='float32') # 7-day forecast (float32 for numeric stability)
    ])
    
    model.compile(optimizer='adam', loss='mse', metrics=['mae', 'mape'])
    return model

# --- 3. CUSTOM LOSS & TRAINING LOGIC ---
def weighted_mse(y_true, y_pred):
    # Apply 3x weight to samples where actual normalized rainfall represents >150mm
    # For simplicity in graph mode, assume extreme values > 0.5 get weighted more
    weights = tf.where(y_true > 0.5, 3.0, 1.0)
    loss = tf.square(y_true - y_pred) * weights
    return tf.reduce_mean(loss)

def train_zone_model(X_train, y_train, X_val, y_val):
    model = build_cnn_lstm_model(input_shape=(X_train.shape[1], X_train.shape[2]))
    
    early_stopping = EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=7, min_lr=1e-6)
    
    logger.info("Starting training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=100,
        batch_size=32,
        callbacks=[early_stopping, reduce_lr],
        verbose=1
    )
    return model, history

# --- 8. FLOOD INTEGRATION MODULE ---
def get_danger_level(district):
    # Dummy implementation for CWC danger levels
    return 50.0

def predict_assam_flood_risk(rainfall_forecast, district, river_gauge_level=None, soil_moisture=None):
    zone = ZONE_MAPPING.get(district, 'lower')
    t = THRESHOLDS[zone]
    
    rainfall_24h = rainfall_forecast[0]
    rainfall_72h = sum(rainfall_forecast[0:3])
    rainfall_7day = sum(rainfall_forecast)
    
    gauge_risk = False
    if river_gauge_level:
        danger_level = get_danger_level(district)
        if river_gauge_level > danger_level * 0.95:
            gauge_risk = True
            
    if (rainfall_24h > t['red_24h'] or rainfall_72h > t['red_72h'] or gauge_risk):
        alert = "RED"
        probability = 0.85
        lead_time_hours = 12
    elif (rainfall_24h > t['orange_24h'] or rainfall_72h > t['orange_72h']):
        alert = "ORANGE"
        probability = 0.60
        lead_time_hours = 18
    elif (rainfall_24h > t['yellow_24h'] or rainfall_72h > t['yellow_72h']):
        alert = "YELLOW"
        probability = 0.30
        lead_time_hours = 24
    else:
        alert = "GREEN"
        probability = 0.10
        lead_time_hours = 72

    alert_assamese = {
        'RED': 'ৰঙা (বিপদ)',
        'ORANGE': 'হালধীয়া (সতৰ্ক)',
        'YELLOW': 'হালধীয়া (সাৱধান)',
        'GREEN': 'সেউজীয়া (সুৰক্ষিত)'
    }
    
    return {
        'alert': alert,
        'alert_assamese': alert_assamese[alert],
        'probability': probability,
        'lead_time_hours': lead_time_hours,
        'rainfall_24h': round(rainfall_24h, 1),
        'rainfall_72h': round(rainfall_72h, 1),
        'rainfall_7day': round(rainfall_7day, 1),
        'zone': zone,
        'threshold_used': t
    }

if __name__ == "__main__":
    print("Assam 1D CNN + LSTM Hybrid Model Framework loaded.")
    # Example integration test
    dummy_forecast = [160, 50, 20, 10, 5, 0, 0] # Extreme day 1
    res = predict_assam_flood_risk(dummy_forecast, "Dibrugarh", river_gauge_level=48.0)
    print(f"Test Result for Dibrugarh: {res['alert']} - {res['alert_assamese']}")
