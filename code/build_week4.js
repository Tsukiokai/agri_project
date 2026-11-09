const L = require("./lib");
const { P, H1, H2, H3, B, N, spacer, pageBreak, table, img, callout, code, cover, build, results: R } = L;
const T = R.stat, m = R.model_table, fit = T.ols_fit, dg = T.diag;
const f = (v, d = 3) => { const s = Number(v).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }); return /^-0\.0*$/.test(s) ? s.slice(1) : s; };
const pv = (p) => (p < 0.001 ? "< 0.001" : p.toFixed(3));
const coefP = Object.fromEntries(T.ols_coef.map((r) => [r[0], r[4]]));
const pmap = { "Fertiliser (+10 kg/ha)": "fertilizer_kg_ha", "Rainfall (+100 mm)": "rainfall_mm", "Temperature (+1 C)": "avg_temp_c", "Soil pH (+1 unit)": "soil_ph",
  "Farm area (+1 ha)": "area_ha", "Canal vs borewell": "irrigation: Canal", "Drip vs borewell": "irrigation: Drip", "Rainfed vs borewell": "irrigation: Rainfed", "Rabi vs Kharif": "season: Rabi" };
const maxVif = Math.max(...T.vif.map((v) => v[1]));
const pmod = T.price_model;

const c = [];
c.push(...cover("Week 4 Task", "Statistical Analysis and Predictive Modeling in Agribusiness", "Hypothesis tests, regression, assumption checks and limitations for crop yield"));

c.push(H1("Contents"));
["1. Objective, Variables and Data", "2. Methodology", "3. Statistical Analysis: Hypothesis Tests", "4. Predictive Modeling: Regression Results",
 "5. Model Assumptions and Diagnostics", "6. Predictive Performance and Validation", "7. Extension: Modeling Price (Market) Outcomes",
 "8. Discussion and Business Implications", "9. Limitations and Reliability", "10. Conclusions"].forEach((t) => c.push(P(t, { para: { spacing: { after: 40 } } })));
c.push(pageBreak());

// 1 ---------------------------------------------------------------
c.push(H1("1. Objective, Variables and Data"));
c.push(P(`This report applies statistical analysis and a predictive model to the cleaned, simulated dataset of **${R.clean_rows} farm-season records** from GreenHarvest Agri Co-operative. The aim is to understand how weather, farm practices and inputs relate to crop yield, to predict yield, and to state clearly how far the results can be trusted.`));
c.push(table(["Role", "Variable", "Notes"], [
  ["Target (dependent)", "Yield index = yield / average yield of the same crop", "Unit-free; 1.0 is average for the crop. Allows four crops in one model."],
  ["Predictor", "Rainfall (mm, season total)", "Weather driver"],
  ["Predictor", "Average temperature (C)", "Weather driver"],
  ["Predictor", "Fertiliser rate (kg/ha)", "Used as the **input-cost proxy**: spend scales with quantity at a given price"],
  ["Predictor", "Soil pH", "Soil condition"],
  ["Predictor", "Farm area (ha)", "Scale"],
  ["Predictor (categorical)", "Irrigation type (borewell = reference)", "Canal, drip, rainfed indicators"],
  ["Predictor (categorical)", "Season (Kharif = reference)", "Rabi indicator"],
  ["Market outcome (Section 7)", "Price index = price / average price of the same crop", "Second model for price"],
], [2000, 3700, 3606], { size: 17 }));
c.push(spacer());
c.push(P("Transport cost was tested separately (Week 3: correlation with yield about 0.05) and is not a yield driver; it belongs to the market and supply-chain side of the analysis."));

// 2 ---------------------------------------------------------------
c.push(H1("2. Methodology"));
c.push(H2("2.1 Theoretical walkthrough of data processing and analysis"));
c.push(table(["Stage", "What happens", "Why"], [
  ["1. Ingest and clean", "Load cleaned data (Week 2); confirm no missing values and valid ranges", "Models assume complete, valid inputs"],
  ["2. Define target and features", "Compute crop-normalised yield index; list predictors; choose reference categories", "Comparable target; clear interpretation"],
  ["3. Encode and scale", "One-hot encode irrigation and season; standardise numeric predictors for the machine-learning comparison", "Regression needs numeric inputs; scaling aids comparison of effects"],
  ["4. Hypothesis testing", "Test relationships and group differences with pre-stated hypotheses", "Separate real effects from random variation"],
  ["5. Fit the regression", "Estimate coefficients by ordinary least squares (OLS) with standard errors and confidence intervals", "Interpretable, quantified effects"],
  ["6. Check assumptions", "Residual analysis, multicollinearity, influence", "Validity of p-values and intervals depends on assumptions"],
  ["7. Validate predictions", "80/20 train-test split; 5-fold cross-validation; compare with baseline and other models", "Estimate performance on unseen data"],
  ["8. Interpret", "Convert coefficients to business meaning; discuss limits", "Decision support"],
  ["9. Monitor", "Re-fit with new seasons; watch error by group", "Models drift as conditions change"],
], [2200, 4300, 2806], { size: 17 }));
c.push(spacer());
c.push(H2("2.2 Model specification"));
c.push(P("The main model is a multiple linear regression:"));
c.push(code(["YieldIndex = b0 + b1*Rainfall + b2*Temperature + b3*Fertiliser + b4*SoilpH + b5*Area",
  "           + b6*Canal + b7*Drip + b8*Rainfed + b9*Rabi + error"]));
c.push(spacer());
c.push(P("**Why regression?** It gives interpretable coefficients (the change in yield index for a one-unit change in a predictor with others held fixed), standard errors and confidence intervals, and allows assumption checks. Decision tree and random forest models are used as comparators to test whether non-linear structure was missed."));
c.push(H2("2.3 Tools and settings"));
c.push(P("Python with pandas, SciPy and statsmodels for tests and OLS; scikit-learn for train-test split, cross-validation and comparison models. Significance level 0.05; random seed 42; all code in the project folder (scripts 03 and 06)."));

// 3 ---------------------------------------------------------------
c.push(H1("3. Statistical Analysis: Hypothesis Tests"));
c.push(H2("3.1 Hypotheses"));
c.push(table(["ID", "Null hypothesis (H0)", "Alternative (H1)", "Test"], [
  ["H1", "Fertiliser rate is unrelated to yield index", "Positively related", "Pearson correlation"],
  ["H2", "Rainfall is unrelated to yield index", "Positively related", "Pearson correlation"],
  ["H3", "Mean yield index is equal across irrigation types", "At least one mean differs", "One-way ANOVA; Kruskal-Wallis as non-parametric check; Tukey HSD post hoc"],
  ["H4", "Rabi and Kharif price indices are equal", "They differ", "Welch t-test"],
  ["H5", "Soil pH is unrelated to yield index", "Linearly related", "Pearson correlation"],
], [600, 3300, 2500, 2906], { size: 17 }));
c.push(spacer());
c.push(H2("3.2 Results"));
c.push(table(["ID", "Test", "Statistic", "p-value", "Decision at 5%"], T.hypotheses.map((h) => [h[0], h[2], h[3], pv(h[4]), h[5]]), [800, 3000, 1800, 1500, 2206], { size: 17 }));
c.push(spacer());
c.push(P(`**Interpretation.** Fertiliser (r about 0.55) and rainfall (r about 0.51) are both strongly and significantly related to yield, so H1 and H2 are rejected. Irrigation type clearly matters: the parametric ANOVA and non-parametric Kruskal-Wallis tests agree (H3). Rabi prices differ from Kharif prices (H4). Soil pH shows no significant linear link (H5 is not rejected).`));
c.push(P("**A caution on p-values.** With over 1,400 records, even small differences become 'significant'. The size of an effect (and its confidence interval) matters more to a business than the p-value alone, so Section 4 emphasises effect sizes."));
c.push(H2("3.3 Which irrigation types differ? (Tukey HSD)"));
c.push(table(["Comparison", "Difference in mean yield index", "Adjusted p-value"], T.tukey.map((r) => [r[0], f(r[1]), pv(r[2])]), [3600, 3200, 2506], { size: 17 }));
c.push(P("All pairs differ significantly. Rainfed farms are about 0.12 to 0.18 index points below the others, which is the largest gap; the differences among canal, borewell and drip are smaller (0.03 to 0.07)."));

// 4 ---------------------------------------------------------------
c.push(H1("4. Predictive Modeling: Regression Results"));
c.push(P(`The OLS model has **R-squared ${fit.r2}** (adjusted ${fit.adj_r2}) on ${fit.n} records; the overall F-test is highly significant (F = ${fit.F}, p < 0.001). The residual standard error is ${fit.resid_se} yield-index points, so a typical prediction misses by about nine percentage points of the crop-average yield.`));
c.push(table(["Predictor (unit change)", "Effect on yield index", "95% CI", "p-value"], T.coef_plot_rows.map((r) => [r[0], (r[1] >= 0 ? "+" : "") + f(r[1]), `${f(r[2])} to ${f(r[3])}`, pv(coefP[pmap[r[0]]])]), [3000, 2200, 2400, 1706], { size: 17 }));
c.push(spacer());
c.push(...img("stat_coef.png", 470, "Figure 1: Estimated effects with 95% confidence intervals. Intervals that cross the red zero line are not significant."));
c.push(H2("4.1 Interpretation of coefficients"));
c.push(B(`**Fertiliser:** each extra 10 kg/ha is associated with about +${f(T.coef_plot_rows[0][1] * 100, 1)}% of crop-average yield, holding other factors fixed.`));
c.push(B(`**Rainfall:** each extra 100 mm is associated with about +${f(T.coef_plot_rows[1][1] * 100, 1)}%.`));
c.push(B(`**Irrigation (versus borewell):** drip +${f(T.coef_plot_rows[6][1] * 100, 1)}%, canal +${f(T.coef_plot_rows[5][1] * 100, 1)}%, rainfed ${f(T.coef_plot_rows[7][1] * 100, 1)}%.`));
c.push(B("**Temperature, soil pH, farm area and Rabi season:** not statistically distinguishable from zero. The Rabi yield deficit seen in raw averages (Week 3) is explained by lower rainfall once rainfall is in the model."));
c.push(H2("4.2 Relative importance (standardised effects)"));
c.push(table(["Predictor", "Standardised beta", "Meaning"], [
  ["Fertiliser", f(T.std_beta.fertilizer_kg_ha), "One SD more fertiliser: about half an SD more yield"],
  ["Rainfall", f(T.std_beta.rainfall_mm), "One SD more rainfall: about 0.48 SD more yield"],
  ["Area", f(T.std_beta.area_ha), "Negligible"],
  ["Soil pH", f(T.std_beta.soil_ph), "Negligible"],
  ["Temperature", f(T.std_beta.avg_temp_c), "Negligible"],
], [2500, 2500, 4306], { size: 17 }));
c.push(spacer());

// 5 ---------------------------------------------------------------
c.push(H1("5. Model Assumptions and Diagnostics"));
c.push(P("OLS estimates are valid without special assumptions, but the p-values and confidence intervals rely on several. Each assumption was tested and is reported with its verdict."));
c.push(table(["Assumption", "Check", "Result", "Verdict"], [
  ["Linearity of relationships", "Ramsey RESET test; residual vs fitted plot", `t = ${f(T.reset.t, 2)}, p = ${f(T.reset.p, 2)}; no curve in residual plot`, "Met"],
  ["Independent errors", "Durbin-Watson statistic (about 2 = no autocorrelation)", `DW = ${f(dg.dw, 2)}`, "Met (but see farm clustering in Section 9)"],
  ["Constant variance (homoscedasticity)", "Breusch-Pagan test", `LM = ${f(dg.bp_lm, 2)}, p = ${f(dg.bp_p, 2)}`, "Met"],
  ["Normal residuals", "Jarque-Bera, Q-Q plot", `Skewness ${f(dg.skew, 2)}, kurtosis ${f(dg.kurt, 2)} (normal = 3); JB p ${pv(dg.jb_p)}`, "Mildly violated: slightly heavy tails"],
  ["No severe multicollinearity", "Variance inflation factors", `Highest VIF ${f(maxVif, 2)} (season); all below 5`, "Met"],
  ["No dominant influential points", "Cook's distance", `Maximum ${f(T.cook.max, 3)} (concern above 1); ${T.cook.n_gt_4n} points above 4/n`, "Met"],
], [2300, 2600, 2800, 1606], { size: 16 }));
c.push(spacer());
c.push(...img("stat_resid_fitted.png", 440, "Figure 2: Residuals vs fitted values. The amber line stays close to zero, showing no curvature or funnel shape."));
c.push(...img("stat_qq.png", 330, "Figure 3: Normal Q-Q plot of residuals. Points follow the line except slightly in the tails."));
c.push(P(`**Handling the normality departure.** Residuals are nearly symmetric (skewness ${f(dg.skew, 2)}) but with slightly heavier tails than a normal curve. The Jarque-Bera test flags this because the sample is large, but with 1,400+ records the coefficient estimates are still reliable and confidence intervals are approximately valid by the central limit theorem. As a check, heteroscedasticity-robust (HC3) standard errors were computed: for fertiliser the standard error is ${T.robust_vs_classic_se.fertilizer_kg_ha[0].toExponential(1)} (classic) versus ${T.robust_vs_classic_se.fertilizer_kg_ha[1].toExponential(1)} (robust), and for rainfall the two are essentially identical, so conclusions do not change.`));
c.push(callout("Diagnostics as a cleaning tool", [
  "An earlier run of this model on data without the cross-field plausibility rule gave a heavy right tail (skewness above 2, kurtosis above 18). Tracing the largest residuals revealed mislabelled crop records. After adding that rule in Week 2, R-squared rose from about 0.62 to 0.70 and the residuals became much closer to normal."]));
c.push(spacer());

// 6 ---------------------------------------------------------------
c.push(H1("6. Predictive Performance and Validation"));
c.push(P(`The data were split 80/20 (${R.n_train} training and ${R.n_test} test records). Models were fitted on the training set and scored on the test set, with 5-fold cross-validation on the training set as a stability check. The baseline predicts the training mean for every record.`));
c.push(table(["Model", "MAE", "RMSE", "R-squared (test)", "R-squared (5-fold CV)"], m.map((r) => [r[0], String(r[1]), String(r[2]), String(r[3]), r[4] === null ? "n/a" : String(r[4])]), [3000, 1100, 1100, 1900, 2206], { size: 17 }));
c.push(spacer());
c.push(P(`Linear regression (R-squared ${m[1][3]}) and the random forest (${m[3][3]}) are effectively tied; the decision tree is weaker (${m[2][3]}). Because the flexible random forest adds nothing, the straight-line additive model is **adequate and preferred for its interpretability**. The cross-validated score (${m[1][4]}) is a little below the test score, which suggests the test split was slightly favourable and that about 0.69 is a more cautious expectation for new data.`));
c.push(...img("fig8_actual_pred.png", 360, "Figure 4: Actual vs predicted yield index on the test set."));
c.push(H2("6.1 Is accuracy uniform?"));
c.push(table(["Group", "Mean absolute error (index points)"], [
  ...Object.entries(T.mae_by_irrig).map(([k, v]) => [`Irrigation: ${k}`, f(v)]),
  ...Object.entries(T.mae_by_crop).map(([k, v]) => [`Crop: ${k}`, f(v)]),
], [4500, 4806], { size: 17 }));
c.push(P("Errors are similar across groups (about 0.05 to 0.08), with the highest errors for tomato and for canal farms. No group is badly predicted, but tomato is the least precise crop."));
c.push(H2("6.2 Robustness: does the model work crop by crop?"));
c.push(...img("stat_per_crop.png", 430, "Figure 5: Fertiliser and rainfall effects estimated separately for each crop."));
c.push(table(["Crop", "n", "Fertiliser +10 kg/ha", "Rainfall +100 mm", "R-squared"], Object.entries(T.per_crop).map(([k, v]) => [k, String(v.n), f(v.fert10), f(v.rain100), f(v.r2, 2)]), [1800, 1000, 2400, 2200, 1906], { size: 17 }));
c.push(P("The effects have the same sign and similar size in all four crops (fertiliser about +0.025 to +0.028; rainfall about +0.045 to +0.056), which supports pooling crops through the yield index."));

// 7 ---------------------------------------------------------------
c.push(H1("7. Extension: Modeling Price (Market) Outcomes"));
c.push(P("To address market outcomes as well as yield, a second regression models the price index using yield index, a year trend and season."));
c.push(table(["Term", "Coefficient", "95% CI", "p-value"], pmod.coef.map((r) => [r[0], (r[1] >= 0 ? "+" : "") + f(r[1], 4), `${f(r[3], 4)} to ${f(r[4], 4)}`, pv(r[2])]), [3200, 1800, 2400, 1906], { size: 17 }));
c.push(spacer());
c.push(...img("stat_price_yield.png", 400, "Figure 6: Price index vs yield index (fitted line at mid-period)."));
c.push(P(`The model explains about ${Math.round(pmod.r2 * 100)}% of the variation in the price index. Three results stand out: prices trend up about 3.7% of the crop average per year; Rabi prices are about 3% higher than Kharif; and a better harvest is associated with a slightly lower price (a 0.1 rise in yield index goes with about 1.4% lower price), the expected supply effect. The remaining variation reflects factors not in the data, such as demand, arrivals and policy, so this model is a description, not a price forecast.`));

// 8 ---------------------------------------------------------------
c.push(H1("8. Discussion and Business Implications"));
c.push(table(["Result", "Business meaning", "Action"], [
  ["Rainfed farms about 12 index points below borewell farms", "Water access is the largest controllable gap", "Targeted irrigation support; pilot with control farms"],
  ["+10 kg/ha fertiliser is about +2.6% yield", "Fertiliser is productive in this range, but returns must be set against cost and diminishing effects", "Soil-test-based advice and return-per-rupee tracking"],
  ["+100 mm rainfall is about +4.7% yield", "Rainfall is a leading indicator", "In-season procurement forecasts using rainfall"],
  ["Temperature, pH and area have no practical effect", "Do not spend advisory effort on these", "Focus on rainfall, fertiliser and irrigation"],
  ["Model error about 0.07 index points", "Usable for planning ranges, not guarantees", "Report low/base/high scenarios"],
  ["Prices rise and Rabi premium is positive", "Timing of sales matters", "Seasonal storage and contract planning"],
], [3300, 3300, 2706], { size: 17 }));
c.push(spacer());

// 9 ---------------------------------------------------------------
c.push(H1("9. Limitations and Reliability"));
c.push(H2("9.1 Critical discussion of limitations"));
c.push(table(["Limitation", "Why it matters", "How to address it"], [
  ["Synthetic data with designed relationships", "The model recovering them shows the method works, not that these effects exist in reality; real R-squared will be lower", "Re-estimate on real farm records before decisions"],
  ["Association is not causation", "Better-resourced farms may adopt drip and also manage land better (confounding); irrigation coefficient may include these effects", "Matched pilots; collect farm characteristics; consider instrumental or difference-in-differences designs"],
  ["Repeated farms (clustering)", "The same farm can appear in several seasons, so errors are not fully independent; standard errors may be too small", "Use cluster-robust standard errors or mixed-effects models with real farm IDs"],
  ["Omitted variables", "Pests, disease, seed variety, planting date and labour are absent", "Add variables; treat unexplained variance as real uncertainty"],
  ["Linear additive form", "Real fertiliser response flattens at high doses; interactions (irrigation x rainfall) are possible", "Test splines, polynomial terms and interactions"],
  ["Seasonal totals only", "Timing of rain (a dry spell at flowering) matters more than the total", "Use monthly or weekly weather features"],
  ["Mild non-normality of errors", "Intervals approximate rather than exact", "Robust standard errors and bootstrap intervals"],
  ["Imputed values", "Median filling reduces variability and can attenuate effects slightly", "Sensitivity analysis excluding imputed rows"],
  ["Extrapolation", "Predictions outside observed ranges (very high rain, very high fertiliser) are unreliable", "State valid ranges; refuse out-of-range predictions"],
  ["Multiple testing", "Many tests raise the chance of false positives", "Pre-state hypotheses; apply Bonferroni or similar when exploring"],
  ["Short time span", "Six years cannot capture long-run climate change", "Extend history; time-based validation"],
  ["Single random split", "Score depends on the split", "Repeated cross-validation; time-based splits for forecasting"],
], [2400, 3700, 3206], { size: 16 }));
c.push(spacer());
c.push(H2("9.2 Evidence that the model is reasonably reliable"));
c.push(B("Test performance (R-squared " + m[1][3] + ") is close to training and cross-validated performance, so there is no sign of serious over-fitting."));
c.push(B("Two very different models (linear and random forest) reach the same accuracy and agree on the main drivers."));
c.push(B("The effects have the same direction and size in each of the four crops."));
c.push(B("Residual diagnostics show no curvature, no changing variance and no dominant outliers."));
c.push(H2("9.3 Evidence of where care is needed"));
c.push(B("About 30% of yield variation is unexplained; any single farm's yield can differ by far more than the average error."));
c.push(B("Accuracy is lowest for tomato; use wider planning ranges for that crop."));

// 10 ---------------------------------------------------------------
c.push(H1("10. Conclusions"));
c.push(callout("Summary", [
  `**Drivers:** fertiliser, rainfall and irrigation type are significant and practically important; temperature, soil pH and farm area are not.`,
  `**Model:** a transparent linear model explains about ${Math.round(fit.r2 * 100)}% of yield variation (R-squared ${m[1][3]} on unseen data), matching a random forest.`,
  "**Validity:** key regression assumptions are met; normality is only mildly violated and does not change conclusions.",
  "**Business use:** supports targeted irrigation support, soil-test-based fertiliser advice and in-season procurement ranges.",
  "**Caution:** results come from synthetic data and describe associations; they must be revalidated on real records, ideally with clustered errors and a controlled pilot."]));
c.push(spacer());
c.push(P("Week 5 translates these results into strategic recommendations, with benefits, pitfalls, a roadmap and suggested further research."));

build("Week4_Statistical_Analysis_and_Predictive_Modeling.docx", "Week 4: Statistical Analysis and Predictive Modeling", c);
