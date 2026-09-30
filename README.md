# RiverMind
Just a Repository for SIH for now.

## Rainfall Prediction Model Update
We've replaced the old model (which used 1-day/2-day accumulated rainfall as direct features) with a Convolutional Neural Network (1D CNN) that learns from a historical sliding window of rainfall. The previous model has been moved to the `old_model/` folder.

### Assumptions & Changes
- **Framework**: PyTorch
- **Data**: Uses daily time series from `precipitation2021-25.csv`.
- **Target**: Next day's rainfall (`TARGET_HORIZON = 1`).
- **Input**: The past 30 days of rainfall patterns (`WINDOW_LENGTH = 30`).
- The 1-day/2-day (T1d/T2d) explicit features were completely removed from input requirements.
- The model uses early stopping, standard scaling fitted only on the train set (to prevent data leakage), and splits chronologically (70% train / 15% validation / 15% test).

### How to Train
Run the training script to train the model from scratch on historical data:
```bash
python train_cnn.py
```
This script will output `cnn_rainfall_model.pth` (model weights), `scaler.json` (scaling statistics), `loss_curve.png` (training history), and `predictions_sample.png` (predicted vs actual on the test set).

### How to Predict
You can use the prediction interface inside `predict_cnn.py`. It requires exactly the past 30 days of rainfall as a simple list/array, and it will output the prediction for the next day.
```python
from predict_cnn import predict

past_30_days = [12.5, 0.0, ...] # length exactly 30
predicted_rainfall = predict(past_30_days)
print(predicted_rainfall)
```
Or you can test it directly:
```bash
python predict_cnn.py
```
