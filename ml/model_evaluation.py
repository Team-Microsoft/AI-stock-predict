import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from sklearn.metrics import mean_squared_error, r2_score



def generate_performance_report(df, results, stock_cols, target_date):
    print("--- 📊 Generating Results & Metrics ---")
    metrics_log = []
    
    for stock in stock_cols:
        res = results[stock]
        s_vals = pd.to_numeric(df[stock], errors='coerce')
        
        # Metrics Calculation
        rmse = np.sqrt(mean_squared_error(res['actual_test'], res['pred_test_xgb']))
        r2 = r2_score(res['actual_test'], res['pred_test_xgb'])
        ma200 = s_vals.rolling(window=200).mean().iloc[-1]
        
        metrics_log.append({
            'Stock': stock, 'RMSE': rmse, 'R2': r2, 'MA200': ma200,
            'Pred_LR': res['f_lr'], 'Pred_XGB': res['f_xgb'], 
            'Pred_LSTM': res['f_lstm'],
            'Signal': "BULLISH" if res['f_lstm'] > ma200 else "BEARISH"
        })

        # Visualization
        plt.figure(figsize=(10, 4))
        plt.plot(df['Date'], s_vals, label="History")
        plt.scatter(pd.to_datetime(target_date), res['f_lstm'], color='purple', marker='x', label="LSTM Prediction")
        plt.title(f"{stock} Performance Analysis")
        plt.legend()
        plt.show()

    report_df = pd.DataFrame(metrics_log)
    report_df.to_csv("final_report.csv", index=False)
    print("\n--- SUMMARY REPORT ---\n", report_df.to_string(index=False))
    return report_df