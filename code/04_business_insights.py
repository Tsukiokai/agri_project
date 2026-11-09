"""
04_business_insights.py
Business-focused metrics and charts for the Week 5 report.
Uses the cleaned dataset and the Week 3 linear-model coefficients.
"""
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

GREEN, DARK, AMBER, RED, GREY = "#2E7D32", "#1B4332", "#E9A23B", "#C0392B", "#6B7280"
plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False,
                     "axes.spines.right": False, "figure.dpi": 150})
res = json.load(open("../data/results.json"))
df = pd.read_csv("../data/clean_farm_data.csv")
w5 = {}

# 1. revenue per ha by crop (INR lakh/ha) ------------------------------------
rev = df.groupby("crop")["revenue_inr_per_ha"].mean() / 1e5
w5["rev_lakh_per_ha"] = rev.round(2).to_dict()
fig, ax = plt.subplots(figsize=(6.6, 3.4))
order = rev.sort_values().index
ax.barh(order, rev[order], color=[GREEN if c != "Tomato" else AMBER for c in order])
for i, c in enumerate(order): ax.text(rev[c] + .05, i, f"{rev[c]:.2f}", va="center", fontsize=8)
ax.set_xlabel("Average gross revenue (INR lakh per hectare per season)")
plt.tight_layout(); plt.savefig("../charts/w5_revenue.png"); plt.close()

# 2. transport share of farm-gate price ---------------------------------------
df["tshare"] = df.transport_cost_inr_qtl / df.farmgate_price_inr_qtl * 100
ts = df.groupby("crop")["tshare"].mean()
w5["transport_share_pct"] = ts.round(1).to_dict()
fig, ax = plt.subplots(figsize=(6.6, 3.4))
o2 = ts.sort_values().index
ax.bar(o2, ts[o2], color=[RED if ts[c] == ts.max() else GREY for c in o2])
for i, c in enumerate(o2): ax.text(i, ts[c] + .1, f"{ts[c]:.1f}%", ha="center", fontsize=8)
ax.set_ylabel("Transport cost as % of farm-gate price")
plt.tight_layout(); plt.savefig("../charts/w5_transport.png"); plt.close()

# 3. irrigation upgrade scenario ------------------------------------------------
gain_idx = res["lr_coefs"]["irr_Drip"] - res["lr_coefs"]["irr_Rainfed"]    # index points
w5["gain_idx"] = round(gain_idx, 3)
rf = df[df.irrigation == "Rainfed"]
crop_mean_yield = df.groupby("crop")["yield_t_ha"].mean()
price = df.groupby("crop")["farmgate_price_inr_qtl"].mean()
gain_per_ha = {c: gain_idx * crop_mean_yield[c] * 10 * price[c] for c in crop_mean_yield.index}
w5["gain_per_rainfed_ha_inr"] = {k: round(v) for k, v in gain_per_ha.items()}
w5["rainfed_records"] = int(len(rf))
w5["rainfed_area_ha"] = round(float(rf.area_ha.sum()), 1)
w5["total_area_ha"] = round(float(df.area_ha.sum()), 1)
# scenario: convert 25/50/100% of rainfed area; gross gain for 1,000 ha cooperative footprint
share_rainfed = rf.area_ha.sum() / df.area_ha.sum()
rf_mix = rf.groupby("crop")["area_ha"].sum() / rf.area_ha.sum()
avg_gain = float(sum(rf_mix[c] * gain_per_ha[c] for c in rf_mix.index))
w5["avg_gain_per_rainfed_ha"] = round(avg_gain)
w5["rainfed_area_share_pct"] = round(float(share_rainfed * 100), 1)
foot = 1000  # hypothetical 1,000 ha footprint
scen = {}
for pct in (25, 50, 100):
    scen[pct] = round(foot * share_rainfed * pct / 100 * avg_gain / 1e5, 1)   # INR lakh
w5["scenario_lakh_per_1000ha"] = scen
fig, ax = plt.subplots(figsize=(6.6, 3.4))
ax.bar([f"{k}% of\nrainfed area" for k in scen], list(scen.values()), color=[ "#A5D6A7", GREEN, DARK])
for i, v in enumerate(scen.values()): ax.text(i, v + .8, f"{v:.0f}", ha="center", fontsize=9)
ax.set_ylabel("Extra gross revenue per season\n(INR lakh, per 1,000 ha footprint)")
plt.tight_layout(); plt.savefig("../charts/w5_scenario.png"); plt.close()

# 4. prioritisation matrix --------------------------------------------------------
recs = [("R1 Irrigation support", 4.4, 2.6, 4.0), ("R2 Soil-test fertiliser", 3.6, 4.2, 3.0),
        ("R3 Rainfall-based planning", 3.8, 4.0, 2.5), ("R4 Rabi storage / contracts", 3.5, 3.2, 3.5),
        ("R5 Net-price & logistics", 3.2, 3.8, 2.5), ("R6 Data pipeline", 3.0, 4.6, 1.8),
        ("R7 Model revalidation", 2.6, 4.4, 1.2)]
fig, ax = plt.subplots(figsize=(6.8, 4.4))
for n, imp, fea, cost in recs:
    ax.scatter(fea, imp, s=cost * 160, color=GREEN, alpha=.55, edgecolor=DARK)
    ax.annotate(n, (fea, imp), textcoords="offset points", xytext=(8, 6), fontsize=7.5)
ax.axhline(3.3, color="#999", ls=":"); ax.axvline(3.3, color="#999", ls=":")
ax.set_xlim(1.8, 5.2); ax.set_ylim(2.2, 5)
ax.set_xlabel("Feasibility (1 = hard, 5 = easy)"); ax.set_ylabel("Expected business impact (1-5)")
ax.text(5.15, 4.92, "Do first", ha="right", fontsize=8, color=DARK, weight="bold")
ax.text(1.85, 4.92, "Plan and fund", fontsize=8, color=DARK, weight="bold")
ax.text(5.15, 2.28, "Quick wins", ha="right", fontsize=8, color=DARK, weight="bold")
plt.tight_layout(); plt.savefig("../charts/w5_matrix.png"); plt.close()

# 5. district performance quadrant data -------------------------------------------
df["yidx"] = df.yield_t_ha / df.groupby("crop").yield_t_ha.transform("mean")
d = df.groupby("district").agg(yidx=("yidx", "mean"), rain=("rainfed_flag" if "rainfed_flag" in df else "yidx", "mean"))
dist = df.assign(rainfed=(df.irrigation == "Rainfed")).groupby("district").agg(
    yidx=("yidx", "mean"), rainfed_pct=("rainfed", "mean"), tshare=("tshare", "mean"))
dist["rainfed_pct"] = (dist.rainfed_pct * 100).round(1); dist["yidx"] = dist.yidx.round(3); dist["tshare"] = dist.tshare.round(1)
w5["district_table"] = dist.sort_values("yidx").reset_index().values.tolist()

res["w5"] = w5
json.dump(res, open("../data/results.json", "w"), indent=2, default=str)
print(json.dumps(w5, indent=1))
