"""
05_eda_and_quality.py
(a) Data-quality scorecard: raw vs cleaned data (Week 2)
(b) Imputation-method experiment (Week 2)
(c) Exploratory data analysis statistics and charts (Week 3)
"""
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy import stats

GREEN, DARK, AMBER, RED, GREY = "#2E7D32", "#1B4332", "#E9A23B", "#C0392B", "#6B7280"
plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False,
                     "axes.spines.right": False, "figure.dpi": 150})
CH = "../charts/"
res = json.load(open("../data/results.json"))
raw = pd.read_csv("../data/raw_farm_data.csv")
df = pd.read_csv("../data/clean_farm_data.csv")
out = {}

# ============ (a) data-quality scorecard ============
num_cols = ["area_ha", "rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph",
            "yield_t_ha", "farmgate_price_inr_qtl", "transport_cost_inr_qtl"]
fields = ["district", "crop", "season", "irrigation"] + num_cols
def numeric(s): return pd.to_numeric(s.astype(str).str.replace(r"[^0-9.\-]", "", regex=True), errors="coerce")
rawn = raw.copy()
rawn["yield_t_ha"] = numeric(rawn["yield_t_ha"]); rawn["farmgate_price_inr_qtl"] = numeric(rawn["farmgate_price_inr_qtl"])
# completeness: share of non-missing cells in key fields
comp_raw = float(raw[fields].notna().mean().mean() * 100)
comp_clean = float(df[fields].notna().mean().mean() * 100)
# validity: numeric values inside the allowed range
rules = {"rainfall_mm": (0, 2500), "soil_ph": (3.5, 9.5), "area_ha": (0.05, 50), "avg_temp_c": (5, 45)}
v_tot = v_ok_raw = v_ok_clean = 0
for col, (lo, hi) in rules.items():
    a = rawn[col].dropna(); b = df[col].dropna()
    v_tot_a, v_tot_b = len(a), len(b)
    v_ok_raw += ((a >= lo) & (a <= hi)).sum(); v_ok_clean += ((b >= lo) & (b <= hi)).sum()
    v_tot += 0
valid_raw = float(v_ok_raw / sum(rawn[c].notna().sum() for c in rules) * 100)
valid_clean = float(v_ok_clean / sum(df[c].notna().sum() for c in rules) * 100)
# uniqueness
uniq_raw = float((1 - raw.duplicated().sum() / len(raw)) * 100)
uniq_clean = float((1 - df.duplicated().sum() / len(df)) * 100)
# consistency: distinct labels for district/crop/season/irrigation vs expected 8+4+2+4=18
labels_raw = int(sum(raw[c].dropna().nunique() for c in ["district", "crop", "season", "irrigation"]))
labels_clean = int(sum(df[c].dropna().nunique() for c in ["district", "crop", "season", "irrigation"]))
# unit/format consistency: share of numeric fields stored as clean numbers
fmt_raw = float((1 - (raw["yield_t_ha"].astype(str).str.contains("kg|Rs").mean()
                      + raw["farmgate_price_inr_qtl"].astype(str).str.contains("Rs|kg").mean()) / 2) * 100)
fmt_clean = 100.0
out["dq"] = {"completeness": [round(comp_raw, 1), round(comp_clean, 1)],
             "validity": [round(valid_raw, 1), round(valid_clean, 1)],
             "uniqueness": [round(uniq_raw, 1), round(uniq_clean, 1)],
             "format": [round(fmt_raw, 1), fmt_clean],
             "labels": [labels_raw, labels_clean]}

fig, ax = plt.subplots(figsize=(6.8, 3.4))
dims = ["Completeness", "Validity", "Uniqueness", "Format\nconsistency"]
bef = [out["dq"][k][0] for k in ["completeness", "validity", "uniqueness", "format"]]
aft = [out["dq"][k][1] for k in ["completeness", "validity", "uniqueness", "format"]]
x = np.arange(4); w = .36
ax.bar(x - w / 2, bef, w, color=GREY, label="Raw"); ax.bar(x + w / 2, aft, w, color=GREEN, label="Cleaned")
for i in range(4):
    ax.text(x[i] - w / 2, bef[i] + .3, f"{bef[i]:.1f}", ha="center", fontsize=7.5)
    ax.text(x[i] + w / 2, aft[i] + .3, f"{aft[i]:.1f}", ha="center", fontsize=7.5)
ax.set_xticks(x); ax.set_xticklabels(dims, fontsize=8.5); ax.set_ylim(85, 102)
ax.set_ylabel("Score (%)"); ax.legend(frameon=False, fontsize=8, loc="lower right")
plt.tight_layout(); plt.savefig(CH + "w2_quality_scorecard.png"); plt.close()

# ============ (b) imputation experiment ============
rng = np.random.default_rng(7)
exp = {}
for col in ["fertilizer_kg_ha", "rainfall_mm"]:
    base = df[["district", "season", "crop", col]].copy()
    truth = base[col].copy()
    mask = rng.random(len(base)) < .15
    base.loc[mask, col] = np.nan
    rows = {}
    rows["Mean (global)"] = base[col].fillna(base[col].mean())
    rows["Median (global)"] = base[col].fillna(base[col].median())
    rows["Group median (district + season)"] = base[col].fillna(base.groupby(["district", "season"])[col].transform("median")).fillna(base[col].median())
    rows["Group median (district + season + crop)"] = base[col].fillna(base.groupby(["district", "season", "crop"])[col].transform("median")).fillna(base[col].median())
    exp[col] = {k: round(float(np.sqrt(((v[mask] - truth[mask]) ** 2).mean())), 2) for k, v in rows.items()}
out["imputation_rmse"] = exp

# ============ (c) EDA ============
df["yidx"] = df.yield_t_ha / df.groupby("crop").yield_t_ha.transform("mean")
df["pidx"] = df.farmgate_price_inr_qtl / df.groupby("crop").farmgate_price_inr_qtl.transform("mean")
eda_cols = ["area_ha", "rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph", "yield_t_ha",
            "farmgate_price_inr_qtl", "transport_cost_inr_qtl", "yidx"]
desc = []
for c in eda_cols:
    s = df[c]
    desc.append([c, round(s.mean(), 2), round(s.median(), 2), round(s.std(), 2), round(s.std() / s.mean() * 100, 1),
                 round(s.min(), 2), round(s.max(), 2), round(float(stats.skew(s)), 2), round(float(stats.kurtosis(s)), 2)])
out["eda_desc"] = desc

# distributions grid
fig, axs = plt.subplots(2, 3, figsize=(7.6, 4.4))
for ax, (c, lab) in zip(axs.ravel(), [("area_ha", "Farm area (ha)"), ("rainfall_mm", "Rainfall (mm)"),
        ("avg_temp_c", "Temperature (C)"), ("fertilizer_kg_ha", "Fertiliser (kg/ha)"), ("soil_ph", "Soil pH"), ("yidx", "Yield index")]):
    ax.hist(df[c], bins=30, color=GREEN, edgecolor="white", linewidth=.3)
    ax.axvline(df[c].median(), color=AMBER, lw=1.5)
    ax.set_title(lab, fontsize=8.5); ax.tick_params(labelsize=7)
plt.tight_layout(); plt.savefig(CH + "eda_distributions.png"); plt.close()

# raw yield by crop (shows why pooling is misleading)
fig, ax = plt.subplots(figsize=(6.6, 3.4))
crops = ["Ragi", "Rice", "Maize", "Tomato"]
bp = ax.boxplot([df[df.crop == c].yield_t_ha for c in crops], tick_labels=crops, patch_artist=True, showfliers=False)
for p in bp["boxes"]: p.set_facecolor("#A5D6A7")
for mm in bp["medians"]: mm.set_color(DARK)
ax.set_ylabel("Yield (t/ha)")
plt.tight_layout(); plt.savefig(CH + "eda_yield_by_crop.png"); plt.close()

# price seasonality by month (price index)
mon = df.groupby("month")["pidx"].mean()
order = [6, 7, 8, 11, 12, 1]
fig, ax = plt.subplots(figsize=(6.6, 3.3))
labs = {6: "Jun", 7: "Jul", 8: "Aug", 11: "Nov", 12: "Dec", 1: "Jan"}
ax.bar([labs[m] for m in order], [mon[m] for m in order], color=[GREEN] * 3 + [AMBER] * 3)
ax.axhline(1, ls="--", color=GREY, lw=1)
ax.set_ylim(.9, 1.1); ax.set_ylabel("Price index (1.0 = crop average)")
for i, m in enumerate(order): ax.text(i, mon[m] + .003, f"{mon[m]:.3f}", ha="center", fontsize=8)
plt.tight_layout(); plt.savefig(CH + "eda_price_season.png"); plt.close()
out["price_idx_by_month"] = {int(k): round(float(v), 3) for k, v in mon.items()}

# yearly trend: yield index, rainfall, price index
yt = df.groupby("year").agg(yidx=("yidx", "mean"), rain=("rainfall_mm", "mean"), pidx=("pidx", "mean"))
out["year_trend"] = yt.round(3).reset_index().values.tolist()
fig, axs = plt.subplots(1, 3, figsize=(7.6, 2.8))
for ax, c, t, col in zip(axs, ["yidx", "rain", "pidx"], ["Yield index", "Rainfall (mm)", "Price index"], [GREEN, "#2874A6", AMBER]):
    ax.plot(yt.index, yt[c], marker="o", color=col, lw=2); ax.set_title(t, fontsize=9); ax.tick_params(labelsize=7)
plt.tight_layout(); plt.savefig(CH + "eda_year_trends.png"); plt.close()

# fertiliser vs yield (binned means + scatter)
fig, ax = plt.subplots(figsize=(6.6, 3.7))
ax.scatter(df.fertilizer_kg_ha, df.yidx, s=7, alpha=.35, color=GREY)
bins = pd.cut(df.fertilizer_kg_ha, 10)
bm = df.groupby(bins, observed=True).agg(x=("fertilizer_kg_ha", "mean"), y=("yidx", "mean"))
ax.plot(bm.x, bm.y, color=GREEN, lw=2.5, marker="o", label="Binned mean")
ax.set_xlabel("Fertiliser (kg/ha)"); ax.set_ylabel("Yield index"); ax.legend(frameon=False, fontsize=8)
plt.tight_layout(); plt.savefig(CH + "eda_fert_scatter.png"); plt.close()

# district x crop heat map of yield index
hm = df.pivot_table(index="district", columns="crop", values="yidx", aggfunc="mean")
fig, ax = plt.subplots(figsize=(6.2, 3.8))
im = ax.imshow(hm.values, cmap="RdYlGn", vmin=.85, vmax=1.15, aspect="auto")
ax.set_xticks(range(hm.shape[1])); ax.set_xticklabels(hm.columns, fontsize=8)
ax.set_yticks(range(hm.shape[0])); ax.set_yticklabels(hm.index, fontsize=8)
for i in range(hm.shape[0]):
    for j in range(hm.shape[1]): ax.text(j, i, f"{hm.values[i, j]:.2f}", ha="center", va="center", fontsize=7.5)
ax.spines[:].set_visible(False); plt.colorbar(im, shrink=.8)
plt.tight_layout(); plt.savefig(CH + "eda_district_crop_heat.png"); plt.close()
out["heat_min"] = [round(float(hm.min().min()), 2), round(float(hm.max().max()), 2)]

# Pearson vs Spearman
cc = ["rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph", "area_ha", "transport_cost_inr_qtl"]
tab = []
for c in cc:
    pr = stats.pearsonr(df[c], df.yidx)[0]; sr = stats.spearmanr(df[c], df.yidx)[0]
    tab.append([c, round(float(pr), 3), round(float(sr), 3)])
out["pearson_spearman"] = tab

# correlation of rainfall with temperature by season (confounding check)
out["rain_by_season"] = df.groupby("season")["rainfall_mm"].mean().round(0).to_dict()
out["yidx_by_season"] = df.groupby("season")["yidx"].mean().round(3).to_dict()
out["yield_cv_by_crop"] = (df.groupby("crop")["yield_t_ha"].std() / df.groupby("crop")["yield_t_ha"].mean() * 100).round(1).to_dict()
# tomato vs ragi price volatility (CV of price index)
out["price_cv_by_crop"] = (df.groupby("crop")["farmgate_price_inr_qtl"].std() / df.groupby("crop")["farmgate_price_inr_qtl"].mean() * 100).round(1).to_dict()
# Simpson-style illustration: pooled correlation of raw yield and price vs within-crop
pooled = stats.pearsonr(df.yield_t_ha, df.farmgate_price_inr_qtl)[0]
within = {c: round(float(stats.pearsonr(g.yield_t_ha, g.farmgate_price_inr_qtl)[0]), 2) for c, g in df.groupby("crop")}
out["simpson"] = {"pooled": round(float(pooled), 2), "within": within}
# crop-share of records
out["records_by_crop"] = df.crop.value_counts().to_dict()

res["eda"] = out
json.dump(res, open("../data/results.json", "w"), indent=2, default=str)
print(json.dumps({k: out[k] for k in ["dq", "imputation_rmse", "simpson", "pearson_spearman", "price_idx_by_month", "year_trend", "yield_cv_by_crop", "price_cv_by_crop"]}, indent=1))
