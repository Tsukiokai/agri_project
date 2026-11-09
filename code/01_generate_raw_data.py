"""
01_generate_raw_data.py
Generates a HYPOTHETICAL, deliberately messy dataset of farm-season records
for a fictional agribusiness ("GreenHarvest Agri Co-operative", southern India).
All values are synthetic; they are designed to look realistic and to contain
the typical data-quality problems seen in real agricultural data.
"""
import numpy as np
import pandas as pd

rng = np.random.default_rng(42)
N = 1500

districts = ["Mandya", "Mysuru", "Tumakuru", "Hassan", "Belagavi", "Dharwad", "Kolar", "Raichur"]
crops = {            # base yield t/ha, base farm-gate price INR/quintal
    "Rice":    (4.2, 2100),
    "Maize":   (5.5, 2000),
    "Ragi":    (2.6, 3300),
    "Tomato":  (24.0, 1500),
}
dist_rain = {"Mandya": 780, "Mysuru": 800, "Tumakuru": 700, "Hassan": 1000,
             "Belagavi": 1100, "Dharwad": 850, "Kolar": 700, "Raichur": 620}
seasons = ["Kharif", "Rabi"]

rows = []
for i in range(N):
    d = rng.choice(districts)
    c = rng.choice(list(crops))
    s = rng.choice(seasons, p=[0.6, 0.4])
    year = rng.choice([2019, 2020, 2021, 2022, 2023, 2024])
    month = rng.choice([6, 7, 8] if s == "Kharif" else [11, 12, 1])
    area = np.round(rng.gamma(2.0, 1.1) + 0.3, 2)
    rain = max(80, rng.normal(dist_rain[d] * (0.55 if s == "Kharif" else 0.25), 90))
    temp = rng.normal(27.5 if s == "Kharif" else 24.0, 1.8)
    fert = max(20, rng.normal(110, 35))
    irrig = rng.choice(["Drip", "Canal", "Borewell", "Rainfed"], p=[0.2, 0.3, 0.25, 0.25])
    ph = np.round(rng.normal(6.6, 0.5), 2)
    by, bp = crops[c]
    irr_boost = {"Drip": 0.12, "Canal": 0.08, "Borewell": 0.05, "Rainfed": -0.06}[irrig]
    y = by * (1 + 0.00045 * (rain - 450) + 0.0025 * (fert - 110) + irr_boost
              - 0.045 * abs(ph - 6.5) - 0.02 * abs(temp - 26)) * rng.normal(1, 0.07)
    y = max(0.2, y)
    trend = 1 + 0.045 * (year - 2019)
    seas_eff = 1.04 if s == "Rabi" else 1.0
    price = bp * trend * seas_eff * (1 - 0.15 * (y / by - 1)) * rng.normal(1, 0.06)
    transport = np.round(rng.normal(95, 25), 1)
    rows.append([f"R{i+1:05d}", f"F{rng.integers(1, 700):04d}", d, c, s, year, month,
                 area, rain, temp, fert, irrig, ph, y, price, transport])

df = pd.DataFrame(rows, columns=[
    "record_id", "farm_id", "district", "crop", "season", "year", "month",
    "area_ha", "rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "irrigation",
    "soil_ph", "yield_t_ha", "farmgate_price_inr_qtl", "transport_cost_inr_qtl"])

# ---------- inject data-quality problems ----------
# 1. missing values
for col, frac in [("rainfall_mm", .06), ("avg_temp_c", .04), ("fertilizer_kg_ha", .09),
                  ("soil_ph", .07), ("yield_t_ha", .03), ("farmgate_price_inr_qtl", .05),
                  ("irrigation", .03)]:
    df.loc[rng.random(N) < frac, col] = np.nan

# 2. inconsistent categorical formats
def messy(v):
    r = rng.random()
    if pd.isna(v): return v
    if r < .08: return v.upper()
    if r < .15: return v.lower()
    if r < .20: return " " + v + " "
    return v
for col in ["district", "crop", "season"]:
    df[col] = df[col].apply(messy)
df["district"] = df["district"].replace({"Mysuru": "Mysore"}).where(rng.random(N) > .5, df["district"])
df.loc[rng.random(N) < .03, "crop"] = "Ragi (Finger millet)"
df.loc[rng.random(N) < .02, "irrigation"] = "bore well"

# 3. inconsistent units / formats
unit_idx = rng.random(N) < .04
df["yield_t_ha"] = df["yield_t_ha"].astype(object)
df.loc[unit_idx, "yield_t_ha"] = (df.loc[unit_idx, "yield_t_ha"].astype(float) * 1000).round(0).astype(str) + " kg/ha"
df["farmgate_price_inr_qtl"] = df["farmgate_price_inr_qtl"].astype(object)
pr_idx = rng.random(N) < .05
df.loc[pr_idx, "farmgate_price_inr_qtl"] = "Rs. " + df.loc[pr_idx, "farmgate_price_inr_qtl"].astype(float).round(0).astype(str)

# 4. anomalies / outliers
df.loc[rng.choice(N, 12, replace=False), "rainfall_mm"] = 9999
df.loc[rng.choice(N, 8, replace=False), "soil_ph"] = rng.choice([0, 14, 66], 8)
df.loc[rng.choice(N, 10, replace=False), "area_ha"] = -1 * rng.integers(1, 4, 10)
df.loc[rng.choice(N, 6, replace=False), "avg_temp_c"] = 99

# 5. duplicates
dups = df.sample(45, random_state=1)
df = pd.concat([df, dups], ignore_index=True).sample(frac=1, random_state=3).reset_index(drop=True)

df.to_csv("../data/raw_farm_data.csv", index=False)
print("Raw dataset:", df.shape)
