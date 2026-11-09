"""
06_stats_regression.py
Hypothesis tests, OLS regression with inference, assumption diagnostics,
robustness checks and a price (market) regression for the Week 4 report.
Requires: pandas numpy scipy statsmodels matplotlib scikit-learn
"""
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import statsmodels.api as sm
import statsmodels.formula.api as smf
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan
from statsmodels.stats.stattools import durbin_watson, jarque_bera
from scipy import stats
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error

GREEN, DARK, AMBER, RED, GREY = "#2E7D32", "#1B4332", "#E9A23B", "#C0392B", "#6B7280"
plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False,
                     "axes.spines.right": False, "figure.dpi": 150})
CH = "../charts/"
res = json.load(open("../data/results.json"))
df = pd.read_csv("../data/clean_farm_data.csv")
df["yidx"] = df.yield_t_ha / df.groupby("crop").yield_t_ha.transform("mean")
df["pidx"] = df.farmgate_price_inr_qtl / df.groupby("crop").farmgate_price_inr_qtl.transform("mean")
df["irrigation"] = pd.Categorical(df.irrigation, ["Borewell", "Canal", "Drip", "Rainfed"])
out = {}

# ---------------- hypothesis tests ----------------
H = []
r, p = stats.pearsonr(df.fertilizer_kg_ha, df.yidx)
H.append(["H1", "Fertiliser rate is positively related to yield index", "Pearson correlation",
          f"r = {r:.3f}", p, "Reject H0"])
r, p = stats.pearsonr(df.rainfall_mm, df.yidx)
H.append(["H2", "Seasonal rainfall is positively related to yield index", "Pearson correlation",
          f"r = {r:.3f}", p, "Reject H0"])
groups = [g.yidx.values for _, g in df.groupby("irrigation", observed=True)]
F, p = stats.f_oneway(*groups)
H.append(["H3", "Mean yield index differs across irrigation types", "One-way ANOVA", f"F = {F:.2f}", p, "Reject H0"])
Hs, p = stats.kruskal(*groups)
H.append(["H3b", "Same as H3, without assuming normality", "Kruskal-Wallis", f"H = {Hs:.2f}", p, "Reject H0"])
t, p = stats.ttest_ind(df[df.season == "Rabi"].pidx, df[df.season == "Kharif"].pidx, equal_var=False)
H.append(["H4", "Price index differs between Rabi and Kharif", "Welch t-test", f"t = {t:.2f}", p, "Reject H0"])
r, p = stats.pearsonr(df.soil_ph, df.yidx)
H.append(["H5", "Soil pH is linearly related to yield index", "Pearson correlation", f"r = {r:.3f}", p,
          "Fail to reject H0" if p > .05 else "Reject H0"])
out["hypotheses"] = [[a, b, c, d, float(e), f] for a, b, c, d, e, f in H]
# post-hoc pairwise (Tukey HSD)
tk = stats.tukey_hsd(*groups)
names = list(df.irrigation.cat.categories)
post = []
for i in range(4):
    for j in range(i + 1, 4):
        post.append([f"{names[i]} vs {names[j]}", round(float(groups[i].mean() - groups[j].mean()), 3), float(tk.pvalue[i][j])])
out["tukey"] = post

# ---------------- OLS regression ----------------
formula = "yidx ~ rainfall_mm + avg_temp_c + fertilizer_kg_ha + soil_ph + area_ha + C(irrigation) + C(season)"
ols = smf.ols(formula, data=df).fit()
ci = ols.conf_int()
coef = []
for n in ols.params.index:
    coef.append([n.replace("C(irrigation)[T.", "irrigation: ").replace("C(season)[T.", "season: ").replace("]", ""),
                 round(float(ols.params[n]), 4), round(float(ols.bse[n]), 4), round(float(ols.tvalues[n]), 2),
                 float(ols.pvalues[n]), round(float(ci.loc[n, 0]), 4), round(float(ci.loc[n, 1]), 4)])
out["ols_coef"] = coef
out["ols_fit"] = {"r2": round(ols.rsquared, 3), "adj_r2": round(ols.rsquared_adj, 3), "F": round(ols.fvalue, 1),
                  "F_p": float(ols.f_pvalue), "n": int(ols.nobs), "aic": round(ols.aic, 1), "df_model": int(ols.df_model),
                  "resid_se": round(float(np.sqrt(ols.scale)), 4)}
rob = smf.ols(formula, data=df).fit(cov_type="HC3")
out["robust_vs_classic_se"] = {n: [round(float(ols.bse[n]), 6), round(float(rob.bse[n]), 6)] for n in ols.params.index if n in
                               ["rainfall_mm", "fertilizer_kg_ha", "avg_temp_c"]}

# standardised effect sizes (numeric predictors)
z = df[["rainfall_mm", "avg_temp_c", "fertilizer_kg_ha", "soil_ph", "area_ha"]]
beta = {}
for c in z.columns:
    beta[c] = round(float(ols.params[c] * z[c].std() / df.yidx.std()), 3)
out["std_beta"] = beta

# ---------------- diagnostics ----------------
resid, fitted = ols.resid, ols.fittedvalues
Xv = ols.model.exog
vif = [[ols.model.exog_names[i], round(float(variance_inflation_factor(Xv, i)), 2)] for i in range(1, Xv.shape[1])]
out["vif"] = vif
bp = het_breuschpagan(resid, Xv)
jb = jarque_bera(resid)
out["diag"] = {"bp_lm": round(float(bp[0]), 2), "bp_p": float(bp[1]),
               "jb": round(float(jb[0]), 2), "jb_p": float(jb[1]), "skew": round(float(jb[2]), 3), "kurt": round(float(jb[3]), 3),
               "dw": round(float(durbin_watson(resid)), 2),
               "shapiro_p": float(stats.shapiro(resid.sample(500, random_state=1))[1])}
infl = ols.get_influence()
cook = infl.cooks_distance[0]
out["cook"] = {"max": round(float(cook.max()), 4), "n_gt_4n": int((cook > 4 / len(df)).sum()), "threshold": round(4 / len(df), 4)}
# linearity check: ramsey RESET via added fitted^2
Xr = sm.add_constant(pd.DataFrame({"f2": fitted ** 2}))
reset = smf.ols(formula + " + I(fitted_sq)", data=df.assign(fitted_sq=fitted ** 2)).fit()
out["reset"] = {"t": round(float(reset.tvalues["I(fitted_sq)"]), 2), "p": float(reset.pvalues["I(fitted_sq)"])}

# charts: residual vs fitted
fig, ax = plt.subplots(figsize=(6.2, 3.6))
ax.scatter(fitted, resid, s=7, alpha=.4, color=GREEN)
ax.axhline(0, color=DARK, ls="--")
lo = pd.Series(resid.values, index=fitted.values).sort_index().rolling(120, min_periods=60).mean()
ax.plot(lo.index, lo.values, color=AMBER, lw=2)
ax.set_xlabel("Fitted yield index"); ax.set_ylabel("Residual")
plt.tight_layout(); plt.savefig(CH + "stat_resid_fitted.png"); plt.close()
# QQ plot
fig, ax = plt.subplots(figsize=(4.6, 3.8))
(osm, osr), (sl, ic, rr) = stats.probplot(resid, dist="norm")
ax.scatter(osm, osr, s=7, alpha=.5, color=GREEN); ax.plot(osm, sl * np.array(osm) + ic, color=DARK)
ax.set_xlabel("Theoretical quantiles"); ax.set_ylabel("Sample quantiles")
plt.tight_layout(); plt.savefig(CH + "stat_qq.png"); plt.close()
# coefficient plot (standardised numeric + irrigation effects with CI)
rows = [("Fertiliser (+10 kg/ha)", ols.params["fertilizer_kg_ha"] * 10, ci.loc["fertilizer_kg_ha"] * 10),
        ("Rainfall (+100 mm)", ols.params["rainfall_mm"] * 100, ci.loc["rainfall_mm"] * 100),
        ("Temperature (+1 C)", ols.params["avg_temp_c"], ci.loc["avg_temp_c"]),
        ("Soil pH (+1 unit)", ols.params["soil_ph"], ci.loc["soil_ph"]),
        ("Farm area (+1 ha)", ols.params["area_ha"], ci.loc["area_ha"])]
for lvl in ["Canal", "Drip", "Rainfed"]:
    k = f"C(irrigation)[T.{lvl}]"; rows.append((f"{lvl} vs borewell", ols.params[k], ci.loc[k]))
k = "C(season)[T.Rabi]"; rows.append(("Rabi vs Kharif", ols.params[k], ci.loc[k]))
fig, ax = plt.subplots(figsize=(6.8, 4.0))
ys = np.arange(len(rows))[::-1]
for y, (n, v, c_) in zip(ys, rows):
    ax.plot([c_.iloc[0], c_.iloc[1]], [y, y], color=GREEN, lw=2.5)
    ax.scatter(v, y, color=DARK, zorder=3, s=22)
ax.axvline(0, color=RED, ls="--", lw=1)
ax.set_yticks(ys); ax.set_yticklabels([r_[0] for r_ in rows], fontsize=8)
ax.set_xlabel("Change in yield index (point estimate and 95% confidence interval)")
plt.tight_layout(); plt.savefig(CH + "stat_coef.png"); plt.close()
out["coef_plot_rows"] = [[n, round(float(v), 4), round(float(c_.iloc[0]), 4), round(float(c_.iloc[1]), 4)] for n, v, c_ in rows]

# ---------------- robustness: per-crop fertiliser and rainfall effects ----------------
per = {}
for crop, g in df.groupby("crop"):
    m_ = smf.ols(formula, data=g).fit()
    per[crop] = {"fert10": round(float(m_.params["fertilizer_kg_ha"] * 10), 4), "rain100": round(float(m_.params["rainfall_mm"] * 100), 4),
                 "r2": round(float(m_.rsquared), 3), "n": int(m_.nobs)}
out["per_crop"] = per
fig, ax = plt.subplots(figsize=(6.4, 3.3))
cr = list(per)
x = np.arange(len(cr)); w = .36
ax.bar(x - w / 2, [per[c]["fert10"] for c in cr], w, color=GREEN, label="Fertiliser +10 kg/ha")
ax.bar(x + w / 2, [per[c]["rain100"] for c in cr], w, color=AMBER, label="Rainfall +100 mm")
ax.set_xticks(x); ax.set_xticklabels(cr); ax.set_ylabel("Effect on yield index")
ax.legend(frameon=False, fontsize=8)
plt.tight_layout(); plt.savefig(CH + "stat_per_crop.png"); plt.close()

# ---------------- out-of-sample check of the OLS specification ----------------
tr, te = train_test_split(df, test_size=.2, random_state=42)
m_tr = smf.ols(formula, data=tr).fit()
pt = m_tr.predict(te)
out["oos"] = {"r2": round(float(r2_score(te.yidx, pt)), 3), "mae": round(float(mean_absolute_error(te.yidx, pt)), 3),
              "r2_train": round(float(m_tr.rsquared), 3), "n_test": int(len(te))}
# error by irrigation group (is accuracy uniform?)
te2 = te.assign(err=(te.yidx - pt).abs())
out["mae_by_irrig"] = te2.groupby("irrigation", observed=True)["err"].mean().round(3).to_dict()
out["mae_by_crop"] = te2.groupby("crop")["err"].mean().round(3).to_dict()

# ---------------- market (price) regression ----------------
pf = "pidx ~ yidx + I(year - 2019) + C(season)"
pm = smf.ols(pf, data=df).fit()
pci = pm.conf_int()
out["price_model"] = {"r2": round(pm.rsquared, 3),
                      "coef": [[n.replace("C(season)[T.", "season: ").replace("]", "").replace("I(year - 2019)", "year trend (per year)"),
                                round(float(pm.params[n]), 4), float(pm.pvalues[n]), round(float(pci.loc[n, 0]), 4), round(float(pci.loc[n, 1]), 4)]
                               for n in pm.params.index]}
# price sensitivity chart: price index vs yield index with fit
fig, ax = plt.subplots(figsize=(6.2, 3.6))
ax.scatter(df.yidx, df.pidx, s=7, alpha=.35, color=GREY)
xs = np.linspace(df.yidx.min(), df.yidx.max(), 50)
ax.plot(xs, pm.params["Intercept"] + pm.params["yidx"] * xs + pm.params["I(year - 2019)"] * 2.5, color=GREEN, lw=2.5)
ax.set_xlabel("Yield index"); ax.set_ylabel("Price index")
plt.tight_layout(); plt.savefig(CH + "stat_price_yield.png"); plt.close()

res["stat"] = out
json.dump(res, open("../data/results.json", "w"), indent=2, default=str)
print(json.dumps({k: out[k] for k in ["ols_fit", "diag", "vif", "cook", "reset", "oos", "std_beta", "per_crop", "mae_by_irrig", "mae_by_crop"]}, indent=1))
print(out["price_model"]); print(out["ols_coef"])
