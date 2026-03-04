# main.py
from stock_data_preprocessing import load_and_clean_data
from trained_models import train_models
from results import generate_performance_report

# 1. Configuration
SYMBOLS = [
"APOLLOHOSP.NS", "EICHERMOT.NS", "DRREDDY.NS", "DIVISLAB.NS", "BPCL.NS",
"GODREJCP.NS", "JIOFIN.NS", "SIEMENS.NS", "IOC.NS", "BAJAJHLDNG.NS",
"HEROMOTOCO.NS", "TATAPOWER.NS", "ADANIPOWER.NS", "DLF.NS", "INDIGO.NS",
"GAIL.NS", "AMBUJACEM.NS", "BANKBARODA.NS", "CHOLAFIN.NS", "HAVELLS.NS",
"PIDILITIND.NS", "UNITDSPR.NS", "SHREECEM.NS", "ABB.NS", "VEDL.NS"
]
START = "2024-10-25"
END = "2025-10-25"
PREDICT_FOR = "2026-06-01"

# 2. Pipeline Execution
if __name__ == "__main__":
    # Step 1: Preprocess
    df = load_and_clean_data(SYMBOLS, START, END)
    
    # Step 2: Train
    results, stock_list = train_models(df, PREDICT_FOR)
    
    # Step 3: Visualize & Results
    report = generate_performance_report(df, results, stock_list, PREDICT_FOR)