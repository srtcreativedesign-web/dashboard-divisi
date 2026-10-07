import pandas as pd
import os
import glob

uploads_dir = "/sessions/festive-quirky-hopper/mnt/uploads/"
files = sorted(glob.glob(uploads_dir + "*.xls*"))

for f in files:
    print(f"\n====================== {os.path.basename(f)} ======================")
    try:
        df = pd.read_excel(f, skiprows=5, nrows=15)
        # Drop columns that are completely empty
        df = df.dropna(axis=1, how='all')
        print(df.to_string())
    except Exception as e:
        print(f"Error: {e}")
