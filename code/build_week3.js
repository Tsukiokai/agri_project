const L = require("./lib");
const { P, H1, H2, H3, B, N, spacer, pageBreak, table, img, callout, code, cover, build, results: R } = L;
const E = R.eda, S = R.stats, W = R.w5;
const f = (v, d = 2) => Number(v).toLocaleString(undefined, { maximumFractionDigits: d });
const names = { area_ha: "Farm area (ha)", rainfall_mm: "Rainfall (mm)", avg_temp_c: "Temperature (C)", fertilizer_kg_ha: "Fertiliser (kg/ha)",
  soil_ph: "Soil pH", yield_t_ha: "Yield (t/ha)", farmgate_price_inr_qtl: "Farm-gate price (INR/qtl)", transport_cost_inr_qtl: "Transport cost (INR/qtl)", yidx: "Yield index" };
const pm = E.price_idx_by_month, yt = E.year_trend;
const kh = (pm["6"] + pm["7"] + pm["8"]) / 3, rb = (pm["11"] + pm["12"] + pm["1"]) / 3;

const c = [];
c.push(...cover("Week 3 Task", "Exploratory Data Analysis and Visualization in Agribusiness", "Patterns, trends and anomalies in crop yield, weather and price data"));

c.push(H1("Contents"));
["1. Dataset Context and Variables", "2. EDA Plan", "3. Summary Statistics", "4. Distributions", "5. Relationships and Correlation Analysis",
 "6. Trends and Seasonality", "7. Spatial and Segment Comparison", "8. Anomalies and Unexpected Patterns", "9. Business Implications of the Trends",
 "10. Challenges in Identifying Meaningful Trends", "11. Recommendations for Further Analysis", "12. Visualization Principles Applied", "13. Conclusion"]
 .forEach((t) => c.push(P(t, { para: { spacing: { after: 40 } } })));
c.push(pageBreak());

// 1 ---------------------------------------------------------------
c.push(H1("1. Dataset Context and Variables"));
c.push(P(`The analysis uses the cleaned, simulated dataset from Week 2: **${R.clean_rows} farm-season records** for GreenHarvest Agri Co-operative, covering rice, maize, ragi and tomato in eight Karnataka districts between 2019 and 2024. The data are synthetic; their value here is to practise and demonstrate a full exploratory workflow.`));
c.push(table(["Variable group", "Variables", "Role in the analysis"], [
  ["Crop performance", "yield_t_ha, yield index (yield / crop average), total production", "Outcome of interest"],
  ["Weather patterns", "rainfall_mm (season total), avg_temp_c", "Natural drivers of yield"],
  ["Pricing trends", "farm-gate price (INR/quintal), price index, transport cost, net price", "Market outcome and cost"],
  ["Farm practice and soil", "irrigation type, fertiliser (kg/ha), soil pH, farm area", "Controllable drivers"],
  ["Context", "district, crop, season, year, month", "Segments and time"],
], [2300, 4200, 2806], { size: 17 }));
c.push(spacer());
c.push(P(`Record counts by crop are balanced (ragi ${E.records_by_crop.Ragi}, rice ${E.records_by_crop.Rice}, maize ${E.records_by_crop.Maize}, tomato ${E.records_by_crop.Tomato}), so no crop dominates simply through sample size.`));

// 2 ---------------------------------------------------------------
c.push(H1("2. EDA Plan"));
c.push(table(["Step", "Question", "Techniques", "Visual aid"], [
  ["1. Summary statistics", "What are typical values and how variable are they?", "Mean, median, SD, CV, min, max, skewness, kurtosis", "Table"],
  ["2. Distributions", "Are variables symmetric, skewed or multi-modal?", "Histograms, box plots", "Histogram grid, box plot"],
  ["3. Relationships", "Which variables move together with yield?", "Pearson and Spearman correlation, binned means, group comparisons", "Heat map, scatter, box plot"],
  ["4. Trends and seasonality", "How do price, yield and rainfall change over years and seasons?", "Yearly means, monthly index", "Line and bar charts"],
  ["5. Segments", "Which districts and crops perform best or worst?", "Group means, cross-tabulation", "Heat map, stacked bar"],
  ["6. Anomalies", "What is surprising or suspicious?", "Residual checks, pooled vs within-group comparisons", "Annotated charts"],
], [1700, 3000, 3000, 1606], { size: 17 }));
c.push(spacer());

// 3 ---------------------------------------------------------------
c.push(H1("3. Summary Statistics"));
c.push(table(["Variable", "Mean", "Median", "SD", "CV %", "Min", "Max", "Skew", "Kurt."], E.eda_desc.map((r) => [names[r[0]], ...r.slice(1).map((v) => f(v))]), [2300, 850, 850, 850, 750, 850, 850, 700, 706], { size: 16 }));
c.push(P("CV = coefficient of variation (SD / mean). Skew: 0 is symmetric. Kurt. = excess kurtosis (0 is normal-like tails).", { run: { italics: true, size: 18 } }));
c.push(H2("Interpretation"));
c.push(B(`**Yield is a mixture.** The raw yield has mean ${f(E.eda_desc[5][1])} but median ${f(E.eda_desc[5][2])} t/ha and a CV near 100%, because tomato (about 22 t/ha) is mixed with cereals (2.5 to 5 t/ha). The crop-normalised yield index has mean 1.00 and CV of ${f(E.eda_desc[8][4], 1)}%, a far more meaningful measure.`));
c.push(B(`**Farm area is right-skewed** (skew ${f(E.eda_desc[0][7])}): most farms are small, with a few large plots. Medians describe typical farms better than means.`));
c.push(B(`**Rainfall varies strongly** (CV ${f(E.eda_desc[1][4], 0)}%), which is the widest spread among the weather and input variables, so it has the most room to explain differences.`));
c.push(B("**Soil pH and temperature are tightly clustered** (CV under 10%), leaving little variation to explain yield."));
c.push(B(`**Price is right-skewed** (skew ${f(E.eda_desc[6][7])}) because ragi is priced far above the other crops.`));

// 4 ---------------------------------------------------------------
c.push(H1("4. Distributions"));
c.push(...img("eda_distributions.png", 520, "Figure 1: Distributions of key variables (amber line = median). Farm area is skewed; the others are roughly symmetric."));
c.push(P("Rainfall, fertiliser, temperature, soil pH and the yield index are roughly bell-shaped. Farm area has a long right tail. The distributions show no signs of the impossible values removed in Week 2."));
c.push(...img("eda_yield_by_crop.png", 440, "Figure 2: Yield by crop. Scales differ by an order of magnitude, so crops must be compared through an index."));
c.push(table(["Crop", "Yield CV %", "Price CV %", "Gross revenue (INR lakh/ha)"], ["Rice", "Maize", "Ragi", "Tomato"].map((k) => [k, f(E.yield_cv_by_crop[k], 1), f(E.price_cv_by_crop[k], 1), f(W.rev_lakh_per_ha[k])]), [2000, 2200, 2200, 2906]));
c.push(P(`Yield variability is similar across crops (16 to 20%), but **ragi and tomato prices vary most** (${f(E.price_cv_by_crop.Ragi, 1)}% and ${f(E.price_cv_by_crop.Tomato, 1)}%), while rice and maize prices are steadier (about 9%). Tomato also generates roughly four times the gross revenue per hectare of rice, which is the combination of high yield and high price risk typical of horticulture.`));

// 5 ---------------------------------------------------------------
c.push(H1("5. Relationships and Correlation Analysis"));
c.push(...img("fig5_corr.png", 400, "Figure 3: Correlation matrix (Pearson). Green = positive, red = negative."));
c.push(table(["Variable vs yield index", "Pearson r", "Spearman rho", "Reading"], E.pearson_spearman.map((r) => [names[r[0]] || r[0], f(r[1], 3), f(r[2], 3),
  Math.abs(r[1]) > 0.4 ? "Moderate association" : Math.abs(r[1]) > 0.15 ? "Weak association" : "No clear association"]), [3000, 1500, 1700, 3106], { size: 17 }));
c.push(spacer());
c.push(P("Pearson and Spearman values are close for every variable, which indicates the relationships are broadly monotonic and not driven by a few extreme points. **Fertiliser and rainfall** show the strongest association with yield; soil pH, farm area and transport cost show none."));
c.push(...img("eda_fert_scatter.png", 460, "Figure 4: Fertiliser rate vs yield index. The binned means (green) rise steadily without an obvious plateau within the observed range."));
c.push(...img("fig4_rain_scatter.png", 460, "Figure 5: Seasonal rainfall vs yield index (colour = fertiliser)."));
c.push(...img("fig3_irrigation_box.png", 440, "Figure 6: Yield index by irrigation type."));
c.push(P(`Irrigation shows a clear gradient: drip ${R.yield_by_irrig.Drip}, canal ${R.yield_by_irrig.Canal}, borewell ${R.yield_by_irrig.Borewell}, rainfed ${R.yield_by_irrig.Rainfed} (1.0 = crop average). Boxes overlap, so irrigation matters but does not decide the outcome alone.`));

// 6 ---------------------------------------------------------------
c.push(H1("6. Trends and Seasonality"));
c.push(...img("fig2_price_trend.png", 480, "Figure 7: Average farm-gate price by crop, 2019-2024."));
c.push(P(`All crops show a steady rise. Across the dataset, average farm-gate price grew from about INR ${f(R.price_growth["2019"], 0)} (2019) to INR ${f(R.price_growth["2024"], 0)} (2024) per quintal, roughly **${R.price_pct_growth_pa}% a year** on a linear trend. Note that the overall average mixes crops, so crop-level lines are more reliable than the pooled figure.`));
c.push(...img("eda_year_trends.png", 520, "Figure 8: Yearly yield index, rainfall and price index."));
c.push(table(["Year", "Yield index", "Mean rainfall (mm)", "Price index"], yt.map((r) => [String(r[0]), f(r[1], 3), f(r[2], 0), f(r[3], 3)]), [1800, 2400, 2700, 2406]));
c.push(spacer());
c.push(P("The **price index rises about 3.7% of the crop average per year**, while the yield index is flat around 1.0 (no long-term yield trend). Rainfall is stable until 2023 and then higher in 2024. With only six years, a trend can be described but not firmly forecast."));
c.push(...img("eda_price_season.png", 460, "Figure 9: Price index by sowing month (green = Kharif months, amber = Rabi months)."));
c.push(P(`Rabi-season sowing months carry a higher price index (about ${f(rb, 3)}) than Kharif months (about ${f(kh, 3)}), a premium of roughly ${f((rb - kh) * 100, 1)} percentage points. This pattern is consistent with seasonal supply. Part of the monthly shape is also the upward price trend mixing into the month profile, which is why seasonality should be re-tested with detrended data.`));

// 7 ---------------------------------------------------------------
c.push(H1("7. Spatial and Segment Comparison"));
c.push(...img("eda_district_crop_heat.png", 420, "Figure 10: Mean yield index by district and crop."));
c.push(P(`District averages range from ${f(S.district_yield_idx.Tumakuru, 3)} (Tumakuru) to ${f(S.district_yield_idx.Belagavi, 3)} (Belagavi). Belagavi and Hassan, the districts with the highest average rainfall, lead; Tumakuru, Raichur and Kolar trail. Cell values in the district-by-crop map run only from ${E.heat_min[0]} to ${E.heat_min[1]}, so geography matters less than practice: the spread between irrigation types is almost double the spread between districts.`));
c.push(...img("fig6_district_prod.png", 480, "Figure 11: Total recorded production by district and crop (tonnes)."));
c.push(P("Tomato dominates tonnage because of its yield per hectare. Volume and value are different things, and neither reflects the quantity of farms involved; a district can lead in tonnes simply by growing more tomato."));

// 8 ---------------------------------------------------------------
c.push(H1("8. Anomalies and Unexpected Patterns"));
c.push(table(["Observation", "Evidence", "Explanation / action"], [
  ["Yield is much lower in Rabi", `Yield index: Kharif ${E.yidx_by_season.Kharif}, Rabi ${E.yidx_by_season.Rabi}`, `Rabi has about half the rainfall (${f(E.rain_by_season.Rabi, 0)} mm vs ${f(E.rain_by_season.Kharif, 0)} mm). Season and rainfall overlap, so the effect cannot be read from the season difference alone (tested in Week 4).`],
  ["Rabi price is higher but yield is lower", "Price premium and yield deficit move in opposite directions", "Consistent with supply effects: lower supply, higher price."],
  ["Pooled correlations exaggerate", `Yield vs price correlation: ${E.simpson.pooled} pooled, but only ${E.simpson.within.Rice} (rice), ${E.simpson.within.Maize} (maize), ${E.simpson.within.Ragi} (ragi), ${E.simpson.within.Tomato} (tomato) within crop`, "Crop differences (high-yield crops with low per-quintal prices) inflate the pooled link. Always analyse within crop or on indices."],
  ["Mislabelled crop records", "A few 'ragi' records with 4+ t/ha yield showed up as extreme residuals", "Fixed in Week 2 with a cross-field plausibility rule; shows that EDA and cleaning inform each other."],
  ["2024 rainfall jump", `Mean rainfall rose to about ${f(yt[5][2], 0)} mm from about ${f(yt[4][2], 0)} mm`, "Possible weather shift or sampling variation; flag for monitoring."],
  ["Soil pH has almost no relationship with yield", `Pearson r = ${f(E.pearson_spearman[3][1], 3)}`, "pH varies little (CV about 7%); the relationship may be non-linear or visible only at extremes."],
], [2200, 3600, 3506], { size: 16 }));
c.push(spacer());

// 9 ---------------------------------------------------------------
c.push(H1("9. Business Implications of the Trends"));
c.push(table(["Trend or pattern", "Implication for the business", "Possible action"], [
  ["Fertiliser and rainfall track yield", "Output is partly predictable from controllable and observable factors", "Track rainfall in season; use soil-test-based fertiliser advice"],
  ["Rainfed farms about 11% below average", "Largest gap between farm groups", "Prioritise irrigation support and water harvesting for rainfed farms"],
  ["Prices rising about 3.4% a year", "Income growth is possible, but input costs may rise faster", "Monitor margin, not just price"],
  ["Rabi price premium", "Timing of sale can raise realised price", "Reserve storage and arrange contracts for Rabi sales where feasible"],
  ["Ragi and tomato price volatility", "Higher revenue risk for these crops", "Use staggered selling and forward contracts for tomato; diversify"],
  ["Tomato gross revenue per hectare is about four times rice", "Crop mix strongly affects farmer income", "Collect cost data; assess net margin before advising a switch"],
  ["Small spread between districts", "District-level programmes are less effective than practice-level ones", "Target by farm characteristics"],
], [2800, 3300, 3206], { size: 17 }));
c.push(spacer());

// 10 ---------------------------------------------------------------
c.push(H1("10. Challenges in Identifying Meaningful Trends"));
c.push(table(["Challenge", "Why it matters", "How it was addressed"], [
  ["Mixing crops with different scales", "Pooled yield and price statistics are dominated by tomato and ragi", "Used crop-normalised indices and within-crop comparisons"],
  ["Confounding (season and rainfall overlap)", "A season effect can really be a rainfall effect", "Examined season and rainfall together; planned regression with both (Week 4)"],
  ["Correlation versus causation", "Associations can reflect unmeasured differences between farms", "Described patterns as associations; recommended pilots and controlled tests"],
  ["Short time series", "Six annual points limit trend reliability", "Reported direction, avoided precise forecasts"],
  ["Skewed variables", "Means mislead for skewed variables such as area", "Reported medians and used Spearman as a check"],
  ["Hidden data errors", "Mislabelled records distort relationships", "Residual review and a new plausibility rule"],
  ["Visual over-interpretation", "Eye sees patterns in noise", "Added binned means and trend lines; checked with correlation coefficients"],
  ["Synthetic data", "Real data will be messier", "Treat findings as method demonstration"],
], [2700, 3000, 3606], { size: 17 }));
c.push(spacer());

// 11 ---------------------------------------------------------------
c.push(H1("11. Recommendations for Further Analysis"));
c.push(N("**Formal hypothesis tests and regression (Week 4)** to separate the effects of rainfall, season, fertiliser and irrigation and to attach confidence intervals.", "nums"));
c.push(N("**Detrended seasonality.** Remove the price trend, then estimate monthly seasonal indices for each crop separately.", "nums"));
c.push(N("**Interaction effects.** Test whether the benefit of irrigation is larger in dry districts or low-rainfall seasons.", "nums"));
c.push(N("**Non-linear response.** Check whether fertiliser benefits flatten at higher doses (for example with polynomial or spline terms).", "nums"));
c.push(N("**Weather timing.** Replace seasonal totals with monthly rainfall, dry spells and heat-stress days.", "nums"));
c.push(N("**Net margin analysis.** Add cost of cultivation to compare crops on profit, not revenue.", "nums"));
c.push(N("**Supply-chain detail.** Collect distance, storage time and spoilage to explain transport and loss costs.", "nums"));
c.push(N("**Clustering of farms.** Group farms by practices and outcomes to design tailored advice.", "nums"));
c.push(N("**Real-data validation.** Repeat the EDA with public data from Agmarknet, data.gov.in and IMD.", "nums"));

// 12 ---------------------------------------------------------------
c.push(H1("12. Visualization Principles Applied"));
c.push(table(["Principle", "How it was used"], [
  ["Match chart to question", "Line for trends, box plot for group distributions, scatter for relationships, heat map for two-way comparison, stacked bar for composition"],
  ["Compare like with like", "Indices instead of raw yield or price across crops"],
  ["Show the data, not just the summary", "Scatter points behind binned means; box plots rather than bar averages"],
  ["Reduce clutter", "No 3-D, no pie charts, light gridlines, one highlight colour"],
  ["Label for non-technical readers", "Units on axes, plain language in captions, a one-line takeaway under each figure"],
  ["Accessible colour", "Green-amber palette with direct labels; meaning not carried by colour alone"],
], [3000, 6306], { size: 17 }));
c.push(spacer());

// 13 ---------------------------------------------------------------
c.push(H1("13. Conclusion"));
c.push(callout("Key takeaways from the exploration", [
  "**Fertiliser, rainfall and irrigation** show the strongest links to yield; soil pH, farm area and transport cost show none.",
  `**Rainfed farms lag** (yield index ${R.yield_by_irrig.Rainfed}); drip farms lead (${R.yield_by_irrig.Drip}).`,
  `**Prices rise about ${R.price_pct_growth_pa}% a year** and are higher for Rabi sowing months; ragi and tomato prices are the most volatile.`,
  "**Pooled statistics mislead** when crops differ; indices and within-crop comparisons are essential.",
  "**EDA exposed a data error** (mislabelled records) that range checks had missed, which led to an improved cleaning rule."]));
c.push(spacer());
c.push(P("These patterns are hypotheses to be tested, not conclusions. Week 4 applies formal statistical tests and regression to quantify them and to examine the assumptions behind the model."));

build("Week3_Exploratory_Data_Analysis_and_Visualization.docx", "Week 3: Exploratory Data Analysis and Visualization", c);
