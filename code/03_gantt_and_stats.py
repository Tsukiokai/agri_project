"""
03_gantt_and_stats.py
(a) Project timeline (Gantt) chart for the Week 1 strategy document.
(b) Statistical tests (ANOVA, Pearson significance) used in Week 3.
"""
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy import stats

GREEN, DARK, AMBER = "#2E7D32", "#1B4332", "#E9A23B"
plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False,
                     "axes.spines.right": False, "figure.dpi": 150})

# ---------------- Gantt ----------------
tasks = [
    ("Wk 1  Landscape exploration & planning", 1, 7, GREEN),
    ("Wk 2  Data cleaning & preparation", 6, 14, GREEN),
    ("Wk 3  Exploratory analysis & visualisation", 13, 21, AMBER),
    ("Wk 4  Statistical analysis & modelling", 20, 28, AMBER),
    ("Wk 5  Business insights & final report", 27, 35, DARK),
]
fig, ax = plt.subplots(figsize=(7.2, 3.0))
for i, (n, s, e, c) in enumerate(tasks[::-1]):
    ax.barh(i, e - s + 1, left=s, color=c, height=.55)
ax.set_yticks(range(len(tasks))); ax.set_yticklabels([t[0] for t in tasks[::-1]], fontsize=8)
ax.set_xlabel("Project day (5-week plan)")
for x, lab in [(7.5, "M1"), (14.5, "M2"), (21.5, "M3"), (28.5, "M4"), (35.5, "M5")]:
    ax.axvline(x, color="#999", ls=":", lw=1); ax.text(x, len(tasks) - .3, lab, ha="center", fontsize=8, color="#444")
ax.set_xlim(0, 37)
plt.tight_layout(); plt.savefig("../charts/w1_gantt.png"); plt.close()

# ---------------- statistics ----------------
df = pd.read_csv("../data/clean_farm_data.csv")
df["yidx"] = df.yield_t_ha / df.groupby("crop").yield_t_ha.transform("mean")
out = {}
groups = [g["yidx"].values for _, g in df.groupby("irrigation")]
F, p = stats.f_oneway(*groups)
out["anova_irrigation"] = {"F": round(float(F), 2), "p": float(p)}
for v in ["rainfall_mm", "fertilizer_kg_ha", "avg_temp_c", "soil_ph"]:
    r, pv = stats.pearsonr(df[v], df["yidx"])
    out[f"pearson_{v}"] = {"r": round(float(r), 3), "p": float(pv)}
# season effect on price
a = df[df.season == "Rabi"].farmgate_price_inr_qtl; b = df[df.season == "Kharif"].farmgate_price_inr_qtl
df["pidx"] = df.farmgate_price_inr_qtl / df.groupby("crop").farmgate_price_inr_qtl.transform("mean")
t, pv = stats.ttest_ind(df[df.season == "Rabi"].pidx, df[df.season == "Kharif"].pidx, equal_var=False)
out["ttest_season_price_idx"] = {"t": round(float(t), 2), "p": float(pv)}
# district yield-index spread
dm = df.groupby("district")["yidx"].mean().round(3).sort_values()
out["district_yield_idx"] = dm.to_dict()
# share of area under rainfed
out["rainfed_share_pct"] = round(float((df.irrigation == "Rainfed").mean() * 100), 1)
out["mean_revenue_per_ha"] = df.groupby("crop")["revenue_inr_per_ha"].mean().round(0).to_dict()

res = json.load(open("../data/results.json"))
res["stats"] = out
json.dump(res, open("../data/results.json", "w"), indent=2, default=str)
print(json.dumps(out, indent=1))
