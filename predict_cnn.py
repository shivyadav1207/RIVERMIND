import torch
import torch.nn as nn
import json
import numpy as np

# Configuration - must match train_cnn.py
WINDOW_LENGTH = 30
MODEL_PATH = 'cnn_rainfall_model.pth'
SCALER_PATH = 'scaler.json'

class Rainfall1DCNN(nn.Module):
    def __init__(self, window_length, num_features=1):
        super(Rainfall1DCNN, self).__init__()
        self.conv1 = nn.Conv1d(in_channels=num_features, out_channels=32, kernel_size=3, padding=1)
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool1d(kernel_size=2)
        self.conv2 = nn.Conv1d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.dropout = nn.Dropout(0.2)
        self.flatten = nn.Flatten()
        
        flat_size = 64 * (window_length // 2 // 2)
        self.fc1 = nn.Linear(flat_size, 64)
        self.fc2 = nn.Linear(64, 1)

    def forward(self, x):
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

def predict(recent_history):
    """
    Predict next day's rainfall from past historical patterns.
    recent_history: list or numpy array of length WINDOW_LENGTH containing past daily rainfall
    Does NOT require current 1-day or 2-day rainfall accumulation features.
    """
    if len(recent_history) != WINDOW_LENGTH:
        raise ValueError(f"Expected history of length {WINDOW_LENGTH}, got {len(recent_history)}")
        
    with open(SCALER_PATH, 'r') as f:
        scaler = json.load(f)
        
    model = Rainfall1DCNN(WINDOW_LENGTH)
    model.load_state_dict(torch.load(MODEL_PATH))
    model.eval()
    
    # Scale input using training statistics
    scaled_input = (np.array(recent_history) - scaler['mean']) / scaler['std']
    
    # Reshape to (1, 1, WINDOW_LENGTH) -> batch, channel, sequence
    tensor_input = torch.tensor(scaled_input, dtype=torch.float32).view(1, 1, WINDOW_LENGTH)
    
    with torch.no_grad():
        prediction = model(tensor_input).item()
        
    return prediction

if __name__ == '__main__':
    # Sample usage and test
    print("Testing prediction interface with dummy historical data...")
    dummy_data = np.random.rand(WINDOW_LENGTH) * 100 # Random rainfall between 0-100mm
    try:
        pred = predict(dummy_data)
        print(f"Past 30 days rainfall dummy: {dummy_data[:5].round(2)}... -> Predicted next day: {pred:.2f} mm")
    except Exception as e:
        print(f"Prediction error: {e}")
