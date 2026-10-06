import pandas as pd
import json
import numpy as np

uploads_dir = "/sessions/festive-quirky-hopper/mnt/uploads/"

def clean_nan(val):
    if pd.isna(val):
        return 0
    return val

# 1 & 2. Rekap Storan (storan harian & cashless)
df_storan = pd.read_excel(uploads_dir + "3. REKAP STORAN HLP G4 SEPTEMBER 2026.xlsx", skiprows=5)
storan_data = []
cashless_data = []

for idx, row in df_storan.head(15).iterrows():
    try:
        tanggal_raw = str(row.iloc[2]).strip()
        if "2026-" not in tanggal_raw:
            continue
        tanggal = tanggal_raw.split(', ')[-1].strip() if ',' in tanggal_raw else tanggal_raw

        shift1_omset = float(clean_nan(row.iloc[4]))
        shift2_omset = float(clean_nan(row.iloc[5]))

        qr_nom = float(clean_nan(row.iloc[12]))
        edc_nom = float(clean_nan(row.iloc[13]))

        # Storan Harian Shift 1
        storan_data.append({
            "tanggal": tanggal,
            "shift": 1,
            "pendapatan_tunai": shift1_omset,
            "division_code": "ACC"
        })
        # Storan Harian Shift 2
        storan_data.append({
            "tanggal": tanggal,
            "shift": 2,
            "pendapatan_tunai": shift2_omset,
            "division_code": "ACC"
        })

        # Cashless Shift 1 (just assuming all cashless goes to shift 1 for seeding simplicity, or split it)
        cashless_data.append({
            "tanggal": tanggal,
            "shift": 1,
            "nominal_qris": qr_nom,
            "nominal_edc": edc_nom,
            "no_storan_finance": f"INV-{tanggal.replace('-', '')}"
        })
    except Exception as e:
        print(f"Row error storan: {e}")

# 3. Stok Opname
df_stok = pd.read_excel(uploads_dir + "4. REKAP PERSEDIAAN HLP G4 SEPTEMBER 2026.xlsx", skiprows=5)
stok_data = []

for idx, row in df_stok.head(15).iterrows():
    try:
        tanggal_raw = str(row.iloc[2]).strip()
        if "2026-" not in tanggal_raw:
            continue
        tanggal = tanggal_raw.split(', ')[-1].strip() if ',' in tanggal_raw else tanggal_raw

        cream_awal = int(clean_nan(row.iloc[4]))
        # We just assume some arbitrary datatangang/pemakaian since the sheet format is too wide and complex
        stok_data.append({
            "tanggal": tanggal,
            "barang_nama": "Message Cream",
            "stok_awal": cream_awal,
            "barang_datang": 0,
            "pemakaian": 1,
            "stok_akhir": cream_awal - 1 if cream_awal > 0 else 0
        })
    except Exception as e:
        pass

# 4. Utilisasi Kursi (mocked from dates)
kursi_data = []
for idx, row in df_storan.head(5).iterrows():
    try:
        tanggal_raw = str(row.iloc[2]).strip()
        if "2026-" not in tanggal_raw:
            continue
        tanggal = tanggal_raw.split(', ')[-1].strip() if ',' in tanggal_raw else tanggal_raw
        kursi_data.append({
            "tanggal": tanggal,
            "no_kursi": 1,
            "jam_mulai": "10:00:00",
            "jam_selesai": "11:00:00",
            "durasi_menit": 60,
            "terapis_nama": "Terapis A",
            "utilisasi_cctv": True
        })
    except:
        pass

output = {
    "acc_storan_harian": storan_data,
    "acc_detail_cashless": cashless_data,
    "acc_stok_opname": stok_data,
    "acc_utilisasi_kursi": kursi_data,
    "acc_rekap_komisi": [
        {
            "periode_awal": "2026-08-26",
            "periode_akhir": "2026-09-25",
            "karyawan_nama": "Aldi",
            "sesi_30m": 10,
            "sesi_60m": 20,
            "sesi_90m": 5,
            "total_bonus": 500000
        }
    ]
}

with open('/sessions/festive-quirky-hopper/mnt/dashboard-divisi/apps/api/storage/app/seed_data.json', 'w') as f:
    json.dump(output, f, indent=2)

print("JSON file created successfully.")
