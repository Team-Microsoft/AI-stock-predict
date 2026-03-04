import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout



def train_models(df, target_date_str):
    print("--- 🧠 Starting Model Training ---")
    df['Date'] = pd.to_datetime(df['Date'])
    df['Day'] = (df['Date'] - df['Date'].min()).dt.days
    stock_cols = [c for c in df.columns if c not in ("Date", "Day")]
    
    predict_date = pd.to_datetime(target_date_str)
    predict_day = (predict_date - df['Date'].min()).days
    
    trained_results = {}

    for stock in stock_cols:
        X = df[['Day']].values.astype(np.float32)
        y = df[stock].values.astype(np.float32)
        
        # Train-Test Split (80/20)
        split = int(len(df) * 0.8)
        X_train, X_test, y_train, y_test = X[:split], X[split:], y[:split], y[split:]

        # 1. Linear Regression
        lr = LinearRegression().fit(X_train, y_train)
        
        # 2. Random Forest
        rf = RandomForestRegressor(n_estimators=100, random_state=42).fit(X_train, y_train)
        
        # 3. XGBoost
        xgb = XGBRegressor(n_estimators=100, random_state=42).fit(X_train, y_train)

        # 4. LSTM Model
        scaler = MinMaxScaler()
        scaled_y = scaler.fit_transform(y.reshape(-1, 1))
        lookback = 10
        X_l, y_l = [], []
        for i in range(lookback, len(scaled_y)):
            X_l.append(scaled_y[i-lookback:i, 0])
            y_l.append(scaled_y[i, 0])
        X_l, y_l = np.array(X_l, dtype=np.float32).reshape(-1, lookback, 1), np.array(y_l, dtype=np.float32)
        
        lstm = Sequential([
            LSTM(50, return_sequences=True, input_shape=(lookback, 1)),
            Dropout(0.2),
            LSTM(50),
            Dense(1)
        ])
        lstm.compile(optimizer='adam', loss='mse')
        lstm.fit(X_l, y_l, epochs=5, batch_size=32, verbose=0)

        # Future Prediction Inputs
        day_in = np.array([[predict_day]], dtype=np.float32)
        last_win = scaled_y[-lookback:].reshape(1, lookback, 1).astype(np.float32)

        trained_results[stock] = {
            'actual_test': y_test,
            'pred_test_xgb': xgb.predict(X_test),
            'f_lr': lr.predict(day_in)[0],
            'f_rf': rf.predict(day_in)[0],
            'f_xgb': xgb.predict(day_in)[0],
            'f_lstm': scaler.inverse_transform(lstm.predict(last_win, verbose=0))[0][0]
        }
    
    print("✅ Training Complete.")
    return trained_results, stock_cols