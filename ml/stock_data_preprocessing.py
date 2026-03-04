import yfinance as yf
import pandas as pd
import numpy as np
from scipy import stats

def load_and_clean_data(symbols, start_date, end_date):
    print("--- 🛠️ Starting Data Preprocessing ---")
    all_data = {}
    
    for symbol in symbols:
        df = yf.download(symbol, start=start_date, end=end_date, progress=False)
        if df.empty:
            print(f"Skipping {symbol}: No data.")
            continue
            
        # Flatten MultiIndex if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
        df = df[["Close"]].copy()
        df.ffill(inplace=True)
        
        # Outlier Removal (Z-Score)
        z_scores = np.abs(stats.zscore(df['Close']))
        df = df[(z_scores < 3)]
        all_data[symbol] = df

    # Merging Datasets
    final_df = pd.DataFrame()
    for symbol, df in all_data.items():
        df = df.reset_index()
        stock_name = str(symbol.split('.')[0])
        df = df[['Date', 'Close']]
        df.rename(columns={'Close': stock_name}, inplace=True)
        
        if final_df.empty:
            final_df = df
        else:
            final_df = pd.merge(final_df, df, on='Date', how='outer')

    final_df.sort_values('Date', inplace=True)
    final_df.ffill(inplace=True)
    final_df.bfill(inplace=True)
    
    # Save to CSV for the next module
    final_df.to_csv("processed_stocks.csv", index=False)
    print("✅ Preprocessing Complete. File saved as 'processed_stocks.csv'.")
    return final_df