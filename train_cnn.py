import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import json
import os
import matplotlib.pyplot as plt

# ==========================================
# CONFIGURATION
# ==========================================
WINDOW_LENGTH = 30 # Number of past days to look at
TARGET_HORIZON = 1 # Predict next day rainfall
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.001
PATIENCE = 10 # Early stopping patience
DATA_FILE = 'precipitation2021-25.csv'
MODEL_PATH = 'cnn_rainfall_model.pth'
SCALER_PATH = 'scaler.json'
# ==========================================

class Rainfall1DCNN(nn.Module):
    def __init__(self, window_length, num_features=1):
        super(Rainfall1DCNN, self).__init__()
        # Using 1D CNN over sliding window of past rainfall observations
        self.conv1 = nn.Conv1d(in_channels=num_features, out_channels=32, kernel_size=3, padding=1)
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool1d(kernel_size=2)
        self.conv2 = nn.Conv1d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.dropout = nn.Dropout(0.2)
        self.flatten = nn.Flatten()
        
        # Calculate flattened size
        flat_size = 64 * (window_length // 2 // 2)
        self.fc1 = nn.Linear(flat_size, 64)
        self.fc2 = nn.Linear(64, 1)

    def forward(self, x):
        # x shape: (batch_size, num_features, window_length)
        x = self.conv1(x)
        x = self.relu(x)
        x = self.pool(x)
        x = self.conv2(x)
        x = self.relu(x)
        x = self.pool(x)
        x = self.dropout(x)
        x = self.flatten(x)
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

def create_sequences(data, seq_length, target_horizon):
    xs = []
    ys = []
    for i in range(len(data) - seq_length - target_horizon + 1):
        x = data[i:(i + seq_length)]
        y = data[i + seq_length + target_horizon - 1]
        xs.append(x)
        ys.append(y)
    return np.array(xs), np.array(ys)

def main():
    print("Loading historical data...")
    df = pd.read_csv(DATA_FILE)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['state_name', 'date'])
    
    # We will use 'actual' rainfall as the historical variable to learn from
    # Handle missing values by interpolating linearly
    df['actual'] = df.groupby('state_name')['actual'].transform(lambda x: x.interpolate().fillna(0))
    
    # Build dataset
    all_x, all_y = [], []
    for state, group in df.groupby('state_name'):
        values = group['actual'].values
        if len(values) > WINDOW_LENGTH + TARGET_HORIZON:
            x, y = create_sequences(values, WINDOW_LENGTH, TARGET_HORIZON)
            all_x.append(x)
            all_y.append(y)
            
    X = np.concatenate(all_x)
    y = np.concatenate(all_y)
    
    # Chronological split (70/15/15) - no shuffling across time
    n = len(X)
    train_end = int(n * 0.7)
    val_end = int(n * 0.85)
    
    X_train, y_train = X[:train_end], y[:train_end]
    X_val, y_val = X[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X[val_end:], y[val_end:]
    
    # Normalize using statistics from the training set only to prevent data leakage
    scaler_mean = float(np.mean(X_train))
    scaler_std = float(np.std(X_train))
    if scaler_std == 0: scaler_std = 1.0
    
    X_train = (X_train - scaler_mean) / scaler_std
    X_val = (X_val - scaler_mean) / scaler_std
    X_test = (X_test - scaler_mean) / scaler_std
    
    # Reshape for CNN: (batch_size, channels, sequence_length)
    X_train = X_train.reshape(-1, 1, WINDOW_LENGTH)
    X_val = X_val.reshape(-1, 1, WINDOW_LENGTH)
    X_test = X_test.reshape(-1, 1, WINDOW_LENGTH)
    
    # To PyTorch tensors
    train_data = TensorDataset(torch.tensor(X_train, dtype=torch.float32), torch.tensor(y_train, dtype=torch.float32).unsqueeze(1))
    val_data = TensorDataset(torch.tensor(X_val, dtype=torch.float32), torch.tensor(y_val, dtype=torch.float32).unsqueeze(1))
    test_data = TensorDataset(torch.tensor(X_test, dtype=torch.float32), torch.tensor(y_test, dtype=torch.float32).unsqueeze(1))
    
    train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=False)
    val_loader = DataLoader(val_data, batch_size=BATCH_SIZE, shuffle=False)
    test_loader = DataLoader(test_data, batch_size=BATCH_SIZE, shuffle=False)
    
    model = Rainfall1DCNN(WINDOW_LENGTH)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    
    # Training Loop with Early Stopping
    best_val_loss = float('inf')
    patience_counter = 0
    train_losses, val_losses = [], []
    
    print("Starting training...")
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * batch_x.size(0)
        train_loss /= len(train_loader.dataset)
        
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                val_loss += loss.item() * batch_x.size(0)
        val_loss /= len(val_loader.dataset)
        
        train_losses.append(train_loss)
        val_losses.append(val_loss)
        
        print(f"Epoch {epoch+1}/{EPOCHS} | Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), MODEL_PATH)
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print("Early stopping triggered.")
                break
                
    # Save Scaler
    with open(SCALER_PATH, 'w') as f:
        json.dump({'mean': scaler_mean, 'std': scaler_std}, f)
        
    # Plot loss
    plt.figure(figsize=(10, 5))
    plt.plot(train_losses, label='Train Loss')
    plt.plot(val_losses, label='Validation Loss')
    plt.legend()
    plt.title('Training and Validation Loss')
    plt.savefig('loss_curve.png')
    
    # Evaluate on Test Set
    model.load_state_dict(torch.load(MODEL_PATH))
    model.eval()
    preds, actuals = [], []
    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            outputs = model(batch_x)
            preds.extend(outputs.squeeze(1).tolist())
            actuals.extend(batch_y.squeeze(1).tolist())
            
    mae = mean_absolute_error(actuals, preds)
    rmse = np.sqrt(mean_squared_error(actuals, preds))
    r2 = r2_score(actuals, preds)
    
    # Baseline (Persistence: predict last known value, i.e. X_test last element * std + mean)
    # X_test is shape (N, 1, 30). The last element is the previous day's rainfall (normalized).
    baseline_preds = [x[-1][-1] * scaler_std + scaler_mean for x in X_test]
    baseline_mae = mean_absolute_error(actuals, baseline_preds)
    
    print("\n--- Test Set Evaluation ---")
    print(f"CNN MAE: {mae:.2f}")
    print(f"CNN RMSE: {rmse:.2f}")
    print(f"CNN R²: {r2:.4f}")
    print(f"Baseline (Persistence) MAE: {baseline_mae:.2f}")
    
    # Plot predictions
    plt.figure(figsize=(12, 6))
    plt.plot(actuals[:100], label='Actual', marker='o')
    plt.plot(preds[:100], label='Predicted', marker='x')
    plt.title('Predicted vs Actual (First 100 samples)')
    plt.legend()
    plt.savefig('predictions_sample.png')
    
    print("\nModel saved to", MODEL_PATH)

if __name__ == '__main__':
    main()
