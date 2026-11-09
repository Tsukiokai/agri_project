"""
02_clean_analyse_model.py
Cleans the raw hypothetical dataset, produces charts, trains yield models,
and writes results.json used by the report builder.
"""
import json, re
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False,
                     "axes.spines.right": False, "figure.dpi": 150})
GREEN, DARK, AMBER, GREY = "#2E7D32", "#1B4332", "#E9A23B", "#6B7280"
CH = "../charts/"
res = {}

raw = pd.read_csv("../data/raw_farm_data.csv")
res["raw_rows"] = len(raw)
df = raw.copy()

# ---------- missingness BEFORE (after parsing units, so counts are comparable) ----------
def to_num(s):
    return pd.to_numeric(s.astype(str).str.replace(r"[^0-9.\-]", "", regex=True), errors="coerce")

# ---------- 1. deduplicate ----------
before = len(df)
df = df.drop_duplicates()
res["duplicates_removed"] = before - len(df)

# ---------- 2. standardise categoricals ----------
for c in ["district", "crop", "season", "irrigation"]:
    df[c] = df[c].astype("string").str.strip().str.title()
df["district"] = df["district"].replace({"Mysore": "Mysuru"})
df["crop"] = df["crop"].replace({"Ragi (Finger Millet)": "Ragi"})
df["irrigation"] = df["irrigation"].replace({"Bore Well": "Borewell"})

# ---------- 3. fix units / formats ----------
y_kg = df["yield_t_ha"].astype(str).str.contains("kg/ha")
res["yield_unit_fixed"] = int(y_kg.sum())
df["yield_t_ha"] = to_num(df["yield_t_ha"])
df.loc[y_kg, "yield_t_ha"] = df.loc[y_kg, "yield_t_ha"] / 1000
p_rs = df["farmgate_price_inr_qtl"].astype(str).str.contains("Rs")
res["price_format_fixed"] = int(p_rs.sum())
df["farmgate_price_inr_qtl"] = to_num(df["farmgate_price_inr_qtl"])

# ---------- 4. anomalies -> NaN (rule-based validity ranges) ----------
rules = {"rainfall_mm": (0, 2500), "soil_ph": (3.5, 9.5), "area_ha": (0.05, 50),
         "avg_temp_c": (5, 45)}
res["anomalies"] = {}
for col, (lo, hi) in rules.items():
    bad = (df[col] < lo) | (df[col] > hi)
    res["anomalies"][col] = int(bad.sum())
    df.loc[bad, col] = np.nan

miss_before = df.isna().sum()[["rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph",
                                "yield_t_ha", "farmgate_price_inr_qtl", "irrigation", "area_ha"]]
res["missing_before"] = {k: int(v) for k, v in miss_before.items()}

# ---------- 5. IQR outlier flag on yield (within crop) ----------
def iqr_flag(g):
    q1, q3 = g.quantile(.25), g.quantile(.75)
    i = q3 - q1
    return (g < q1 - 3 * i) | (g > q3 + 3 * i)
df["yield_outlier"] = df.groupby("crop")["yield_t_ha"].transform(iqr_flag).fillna(False)
res["yield_outliers"] = int(df["yield_outlier"].sum())
df = df[~df["yield_outlier"]].drop(columns="yield_outlier")

# ---------- 5b. cross-field plausibility: yield vs crop median (catches mislabelled crops) ----------
med = df.groupby("crop")["yield_t_ha"].transform("median")
implausible = (df["yield_t_ha"] > 1.5 * med) | (df["yield_t_ha"] < 0.4 * med)
res["plausibility_removed"] = int(implausible.sum())
df = df[~implausible]

# ---------- 6. missing values: drop target-missing, impute the rest ----------
n0 = len(df)
df = df.dropna(subset=["yield_t_ha"])
res["rows_dropped_no_yield"] = n0 - len(df)
for c in ["rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph", "area_ha", "farmgate_price_inr_qtl"]:
    df[c] = df[c].fillna(df.groupby(["district", "season"])[c].transform("median"))
    df[c] = df[c].fillna(df[c].median())
df["irrigation"] = df["irrigation"].fillna(df["irrigation"].mode()[0])
res["missing_after"] = int(df.isna().sum().sum())

# ---------- 7. feature engineering ----------
df["year"] = df["year"].astype(int); df["month"] = df["month"].astype(int)
df["date"] = pd.to_datetime(dict(year=df.year, month=df.month, day=1))
df["total_production_t"] = df["area_ha"] * df["yield_t_ha"]
df["net_price_inr_qtl"] = df["farmgate_price_inr_qtl"] - df["transport_cost_inr_qtl"]
df["revenue_inr_per_ha"] = df["yield_t_ha"] * 10 * df["farmgate_price_inr_qtl"]
df = df.reset_index(drop=True)
df.to_csv("../data/clean_farm_data.csv", index=False)
res["clean_rows"] = len(df)
res["rows_removed_total"] = res["raw_rows"] - len(df)

# ---------- descriptive stats ----------
num = ["area_ha", "rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph", "yield_t_ha",
       "farmgate_price_inr_qtl", "transport_cost_inr_qtl"]
res["describe"] = df[num].describe().round(2).T[["mean", "std", "min", "50%", "max"]].reset_index().values.tolist()
res["yield_by_crop"] = df.groupby("crop")["yield_t_ha"].agg(["mean", "std"]).round(2).reset_index().values.tolist()
res["yield_by_irrig"] = (df.assign(rel=df.yield_t_ha / df.groupby("crop").yield_t_ha.transform("mean"))
                         .groupby("irrigation")["rel"].mean().round(3).to_dict())
res["price_growth"] = (df.groupby(["year"])["farmgate_price_inr_qtl"].mean().round(0)).to_dict()

# ---------- CHART 1: missing values before ----------
fig, ax = plt.subplots(figsize=(7, 3.6))
mb = pd.Series(res["missing_before"]).sort_values()
ax.barh([k.replace("_", " ") for k in mb.index], mb.values, color=GREEN)
for i, v in enumerate(mb.values): ax.text(v + 2, i, str(v), va="center", fontsize=8)
ax.set_title("Missing values per field in the raw dataset (after validity checks)", fontsize=9.5, loc="left")
ax.set_xlabel("Number of records")
plt.tight_layout(); plt.savefig(CH + "fig1_missing.png"); plt.close()

# ---------- CHART 2: price trend line ----------
fig, ax = plt.subplots(figsize=(7, 3.8))
pt = df.groupby(["year", "crop"])["farmgate_price_inr_qtl"].mean().unstack()
for c, col in zip(pt.columns, [GREEN, AMBER, "#8B5E34", "#C0392B"]):
    ax.plot(pt.index, pt[c], marker="o", lw=2, label=c, color=col)
ax.set_title("Average farm-gate price by crop, 2019-2024", fontsize=9.5, loc="left")
ax.set_ylabel("INR per quintal"); ax.legend(frameon=False, ncol=4, fontsize=8, loc="upper left")
ax.set_ylim(0, pt.max().max() * 1.2)
plt.tight_layout(); plt.savefig(CH + "fig2_price_trend.png"); plt.close()

# ---------- CHART 3: yield by irrigation (relative) ----------
fig, ax = plt.subplots(figsize=(7, 3.6))
rel = df.assign(rel=df.yield_t_ha / df.groupby("crop").yield_t_ha.transform("mean"))
order = ["Drip", "Canal", "Borewell", "Rainfed"]
data = [rel[rel.irrigation == o]["rel"] for o in order]
bp = ax.boxplot(data, tick_labels=order, patch_artist=True, showfliers=False)
for patch in bp["boxes"]: patch.set_facecolor("#A5D6A7")
for m in bp["medians"]: m.set_color(DARK)
ax.axhline(1, ls="--", color=GREY, lw=1)
ax.set_title("Yield relative to crop average, by irrigation type", fontsize=9.5, loc="left")
ax.set_ylabel("Yield index (1.0 = crop mean)")
plt.tight_layout(); plt.savefig(CH + "fig3_irrigation_box.png"); plt.close()

# ---------- CHART 4: rainfall vs yield index scatter ----------
fig, ax = plt.subplots(figsize=(7, 3.8))
sc = ax.scatter(rel.rainfall_mm, rel.rel, c=rel.fertilizer_kg_ha, cmap="YlGn", s=12, alpha=.7)
z = np.polyfit(rel.rainfall_mm, rel.rel, 1)
xs = np.linspace(rel.rainfall_mm.min(), rel.rainfall_mm.max(), 50)
ax.plot(xs, np.polyval(z, xs), color=DARK, lw=2)
cb = plt.colorbar(sc); cb.set_label("Fertilizer (kg/ha)", fontsize=8)
ax.set_title("Seasonal rainfall vs yield index (colour = fertilizer use)", fontsize=9.5, loc="left")
ax.set_xlabel("Seasonal rainfall (mm)"); ax.set_ylabel("Yield index")
plt.tight_layout(); plt.savefig(CH + "fig4_rain_scatter.png"); plt.close()

# ---------- CHART 5: correlation heatmap ----------
cc = ["rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph", "area_ha", "yield_idx", "farmgate_price_inr_qtl"]
d2 = df.assign(yield_idx=rel.rel)[cc]
corr = d2.corr()
res["corr_yield_idx"] = corr["yield_idx"].round(2).to_dict()
fig, ax = plt.subplots(figsize=(6.4, 4.8))
im = ax.imshow(corr, cmap="RdYlGn", vmin=-1, vmax=1)
labs = ["Rainfall", "Temp", "Fertilizer", "Soil pH", "Area", "Yield idx", "Price"]
ax.set_xticks(range(len(labs))); ax.set_xticklabels(labs, rotation=40, ha="right", fontsize=8)
ax.set_yticks(range(len(labs))); ax.set_yticklabels(labs, fontsize=8)
for i in range(len(labs)):
    for j in range(len(labs)):
        ax.text(j, i, f"{corr.iloc[i, j]:.2f}", ha="center", va="center", fontsize=7)
ax.spines[:].set_visible(False)
ax.set_title("Correlation matrix of key variables", fontsize=9.5, loc="left")
plt.colorbar(im, shrink=.8); plt.tight_layout(); plt.savefig(CH + "fig5_corr.png"); plt.close()

# ---------- CHART 6: production by district ----------
fig, ax = plt.subplots(figsize=(7, 3.8))
pd_ = df.groupby(["district", "crop"])["total_production_t"].sum().unstack().fillna(0)
pd_ = pd_.loc[pd_.sum(axis=1).sort_values().index]
pd_.plot(kind="barh", stacked=True, ax=ax, color=[GREEN, AMBER, "#8B5E34", "#C0392B"], width=.75)
ax.set_title("Total recorded production by district and crop (tonnes)", fontsize=9.5, loc="left")
ax.set_xlabel("Tonnes"); ax.set_ylabel(""); ax.legend(frameon=False, fontsize=8)
plt.tight_layout(); plt.savefig(CH + "fig6_district_prod.png"); plt.close()

# ---------- normalisation example chart (before / after) ----------
fig, axs = plt.subplots(1, 2, figsize=(7, 3.2))
axs[0].hist(df.yield_t_ha, bins=40, color=GREY); axs[0].set_title("Raw yield (t/ha)", fontsize=9)
yi = rel.rel
axs[1].hist(yi, bins=40, color=GREEN); axs[1].set_title("Crop-normalised yield index", fontsize=9)
fig.suptitle("Effect of crop-wise normalisation on yield", fontsize=9.5, x=0.02, ha="left")
plt.tight_layout(); plt.savefig(CH + "fig7_normalisation.png"); plt.close()

# =================== PREDICTIVE MODELLING ===================
mdf = df.copy()
mdf["y"] = mdf["yield_t_ha"] / mdf.groupby("crop")["yield_t_ha"].transform("mean")   # normalised target
feat_num = ["rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph", "area_ha"]
X = pd.concat([mdf[feat_num],
               pd.get_dummies(mdf["irrigation"], prefix="irr", drop_first=True),
               pd.get_dummies(mdf["season"], prefix="season", drop_first=True)], axis=1).astype(float)
y = mdf["y"]
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=.2, random_state=42)
res["n_train"], res["n_test"] = len(Xtr), len(Xte)

sc_ = StandardScaler().fit(Xtr[feat_num])
Xtr_s, Xte_s = Xtr.copy(), Xte.copy()
Xtr_s[feat_num] = sc_.transform(Xtr[feat_num]); Xte_s[feat_num] = sc_.transform(Xte[feat_num])

models = {
    "Baseline (mean)": None,
    "Linear Regression": LinearRegression(),
    "Decision Tree (depth 5)": DecisionTreeRegressor(max_depth=5, min_samples_leaf=15, random_state=42),
    "Random Forest (200 trees)": RandomForestRegressor(n_estimators=200, max_depth=8, min_samples_leaf=5, random_state=42),
}
rows = []; preds = {}
for name, m in models.items():
    if m is None:
        p = np.full(len(yte), ytr.mean()); cv = float("nan")
    else:
        Xa, Xb = (Xtr_s, Xte_s) if "Linear" in name else (Xtr, Xte)
        m.fit(Xa, ytr); p = m.predict(Xb)
        cv = cross_val_score(m, Xa, ytr, cv=5, scoring="r2").mean()
    preds[name] = p
    rows.append([name, round(mean_absolute_error(yte, p), 3),
                 round(float(np.sqrt(mean_squared_error(yte, p))), 3),
                 round(r2_score(yte, p), 3), None if np.isnan(cv) else round(cv, 3)])
res["model_table"] = rows

lr = models["Linear Regression"]
res["lr_coefs"] = {c: round(float(v), 3) for c, v in zip(X.columns, lr.coef_)}
rf = models["Random Forest (200 trees)"]
imp = pd.Series(rf.feature_importances_, index=X.columns).sort_values()
res["rf_importance"] = imp.round(3).to_dict()

best = "Linear Regression" if rows[1][3] >= rows[3][3] - 0.01 else "Random Forest (200 trees)"
res["best_model"] = best
pbest = preds[best]
resid = yte.values - pbest
res["resid_mean"] = round(float(resid.mean()), 4); res["resid_std"] = round(float(resid.std()), 4)

# CHART 8: actual vs predicted
fig, ax = plt.subplots(figsize=(5.6, 4.6))
ax.scatter(yte, pbest, s=12, alpha=.6, color=GREEN)
lim = [min(yte.min(), pbest.min()) - .05, max(yte.max(), pbest.max()) + .05]
ax.plot(lim, lim, "--", color=DARK); ax.set_xlim(lim); ax.set_ylim(lim)
ax.set_xlabel("Actual yield index"); ax.set_ylabel("Predicted yield index")
ax.set_title(f"Actual vs predicted ({best})", fontsize=9.5, loc="left")
plt.tight_layout(); plt.savefig(CH + "fig8_actual_pred.png"); plt.close()

# CHART 9: feature importance
fig, ax = plt.subplots(figsize=(6.4, 3.6))
ax.barh([i.replace("_", " ") for i in imp.index], imp.values, color=GREEN)
ax.set_title("Random forest feature importance", fontsize=9.5, loc="left")
plt.tight_layout(); plt.savefig(CH + "fig9_importance.png"); plt.close()

# CHART 10: residuals
fig, ax = plt.subplots(figsize=(6.4, 3.4))
ax.hist(resid, bins=30, color=AMBER, edgecolor="white")
ax.axvline(0, color=DARK, ls="--")
ax.set_title("Distribution of prediction errors (test set)", fontsize=9.5, loc="left")
ax.set_xlabel("Actual - predicted yield index")
plt.tight_layout(); plt.savefig(CH + "fig10_residuals.png"); plt.close()

# --------- scenario: fertilizer what-if using linear model ---------
res["fert_effect_per_10kg"] = round(float(lr.coef_[feat_num.index("fertilizer_kg_ha")] / sc_.scale_[feat_num.index("fertilizer_kg_ha")] * 10), 4)
res["rain_effect_per_100mm"] = round(float(lr.coef_[feat_num.index("rainfall_mm")] / sc_.scale_[feat_num.index("rainfall_mm")] * 100), 4)
res["irr_effects"] = {k: v for k, v in res["lr_coefs"].items() if k.startswith("irr_")}

# --------- price forecast (simple trend + seasonality) ---------
ts = df.groupby("year")["farmgate_price_inr_qtl"].mean()
slope, icpt = np.polyfit(ts.index, ts.values, 1)
res["price_trend_slope"] = round(float(slope), 1)
res["price_forecast_2025"] = round(float(slope * 2025 + icpt), 0)
res["price_pct_growth_pa"] = round(float(slope / ts.mean() * 100), 2)

json.dump(res, open("../data/results.json", "w"), indent=2, default=str)
print(json.dumps({k: res[k] for k in ["raw_rows", "clean_rows", "duplicates_removed", "yield_unit_fixed",
      "price_format_fixed", "anomalies", "yield_outliers", "rows_dropped_no_yield", "missing_after",
      "model_table", "best_model", "corr_yield_idx", "yield_by_irrig", "price_pct_growth_pa"]}, indent=1, default=str))
