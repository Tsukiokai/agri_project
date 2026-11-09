const L = require("./lib");
const { P, H1, H2, H3, B, N, spacer, pageBreak, table, img, callout, cover, build, results: R } = L;
const S = R.stats, W = R.w5, m = R.model_table;
const inr = (v) => Number(v).toLocaleString("en-IN");

const c = [];
c.push(...cover("Week 5 Task", "Business Insights, Reporting and Strategic Recommendations", "A business report for GreenHarvest Agri Co-operative on improving efficiency, competitiveness and performance"));

c.push(H1("Contents"));
["1. Executive Summary", "2. Business Context and Purpose", "3. Methodological Overview", "4. Consolidated Key Findings",
 "5. Business Insights: Linking Evidence to Real-World Challenges", "6. Strategic Recommendations", "7. Prioritisation, Financial View and Roadmap",
 "8. Cross-Cutting Risks and Pitfalls", "9. Further Research and Data-Driven Opportunities", "10. Conclusion", "Appendix: Evidence Map and Assumptions"]
 .forEach((t) => c.push(P(t, { para: { spacing: { after: 40 } } })));
c.push(pageBreak());

// 1 ---------------------------------------------------------------
c.push(H1("1. Executive Summary"));
c.push(P("This report brings together four weeks of analysis (planning, data preparation, statistical analysis and predictive modelling) and converts it into strategic recommendations for **GreenHarvest Agri Co-operative**, a hypothetical procurement and advisory organisation working with smallholder farms in eight Karnataka districts. The co-operative's central problem is that it must commit to purchasing, storage and farmer-support decisions before it knows what the harvest or the market will look like."));
c.push(callout("What the evidence says", [
  `**Yield is driven by controllable factors.** Fertiliser, rainfall and irrigation type explain most of the variation in yield. A simple model predicts yield with an R-squared of about ${m[1][3]} on unseen data.`,
  `**Rainfed farms are the largest opportunity.** About ${W.rainfed_area_share_pct}% of cultivated area is rainfed; these farms yield about 11% below crop average. Moving a rainfed hectare to drip is associated with roughly ${(W.gain_idx * 100).toFixed(0)}% of crop-average yield, worth about INR ${inr(W.avg_gain_per_rainfed_ha)} of extra gross revenue per hectare per season on average (before the cost of the system).`,
  `**Prices are rising and seasonal.** Average farm-gate prices grew about ${R.price_pct_growth_pa}% per year, and Rabi-season prices are significantly higher than Kharif.`,
  `**Logistics is a modest but visible cost.** Transport takes about ${W.transport_share_pct.Rice}% to ${W.transport_share_pct.Tomato}% of the farm-gate price depending on crop.`,
  `**Data quality is a business risk in itself.** About ${(R.rows_removed_total / R.raw_rows * 100).toFixed(1)}% of raw records had to be removed, and many more needed repair.`]));
c.push(spacer());
c.push(P("**Recommended strategy.** Seven recommendations are organised under three pillars: **operational efficiency** (data pipeline, rainfall-based procurement planning, logistics), **market competitiveness** (seasonal selling and storage, crop mix and value-added options) and **business performance** (irrigation and fertiliser support to lift farm productivity and income). Each is presented with its benefits and its pitfalls. The highest-priority actions are an irrigation pilot for rainfed farms, soil-test-based fertiliser advice and rainfall-triggered procurement planning, supported by a stronger data foundation."));
c.push(P("**Important caution.** All data are synthetic. The method, the logic and the relative size of effects are what this project demonstrates. Figures must be re-estimated on the co-operative's real records before any investment is committed."));

// 2 ---------------------------------------------------------------
c.push(H1("2. Business Context and Purpose"));
c.push(P("Agribusiness organisations operate between two sources of uncertainty: biological (weather, pests, soil) and economic (prices, input costs, demand). Smallholder-based supply chains add a third: fragmentation, where thousands of small, dispersed producers make information collection and quality control hard."));
c.push(table(["Business challenge", "Why it matters to the co-operative"], [
  ["Yield variability", "Unpredictable supply makes procurement, storage and logistics planning difficult."],
  ["Price volatility and seasonality", "Selling at the wrong time reduces income for both farmers and the co-operative."],
  ["Input and logistics costs", "Rising costs squeeze margins and reduce farmer trust in the co-operative."],
  ["Unequal access to water and advice", "Farmers on rainfed land risk falling behind, which affects supply volumes and rural livelihoods."],
  ["Poor data quality", "Decisions made on unreliable records are unreliable, and cleaning consumes analyst time."],
], [3200, 6106]));
c.push(spacer());
c.push(P("**Purpose of this report:** to consolidate the analytical outcomes, to show what they mean for operations, competitiveness and performance, to recommend actions with realistic benefits and pitfalls, and to point to the next research and data opportunities."));

// 3 ---------------------------------------------------------------
c.push(H1("3. Methodological Overview"));
c.push(table(["Stage", "Approach", "Main output"], [
  ["Landscape and planning (Week 1)", "Researched eight public sources (Agmarknet, data.gov.in, IMD, NASA POWER, ICRISAT, FAOSTAT, World Bank, Soil Health Card); reviewed yield, weather, price and supply-chain data types; defined analysis functions, KPIs, timeline and risks.", "Landscape and strategy plan"],
  ["Cleaning and preparation (Week 2)", `Profiled ${R.raw_rows} synthetic records from an aggregated multi-source file; removed duplicates, standardised text, converted units, treated impossible values, outliers and mislabelled records; compared imputation methods; normalised yield by crop.`, `${R.clean_rows} analysis-ready records; cleaning log; quality scorecard`],
  ["Exploratory analysis (Week 3)", "Summary statistics, distributions, correlation, price and yield trends, seasonality, district and crop comparisons, anomaly review.", "EDA report and chart set"],
  ["Statistical analysis and modelling (Week 4)", "Pre-stated hypotheses (correlation, ANOVA, t-test); OLS regression with confidence intervals; assumption diagnostics; comparison with decision tree and random forest on held-out data.", "Quantified drivers; validated model; limitations"],
  ["Business translation (Week 5)", "Converted results to rupee values per hectare, transport shares, scenarios and a prioritised action plan with benefits and pitfalls.", "This report"],
], [2100, 5300, 1906], { size: 17 }));
c.push(spacer());
c.push(P("Two design choices matter for interpretation. First, yield is analysed as a **crop-normalised index** (1.0 = the crop average) so that rice, maize, ragi and tomato can be compared in one model. Second, models were judged on **held-out data**, not the data they learned from, to avoid overstating accuracy."));

// 4 ---------------------------------------------------------------
c.push(H1("4. Consolidated Key Findings"));
c.push(H2("4.1 Data quality"));
c.push(P(`The raw file of ${R.raw_rows} records contained ${R.duplicates_removed} duplicate rows, ${R.yield_unit_fixed} yields in the wrong unit, ${R.price_format_fixed} prices stored as text, ${Object.values(R.anomalies).reduce((a, b) => a + b, 0)} physically impossible values and ${R.yield_outliers} implausible yield outliers plus ${R.plausibility_removed} cross-field inconsistencies (mislabelled crops). After a documented cleaning process, ${R.clean_rows} records remained (${R.rows_removed_total} removed, ${(R.rows_removed_total / R.raw_rows * 100).toFixed(1)}%). **Business reading:** a data problem at the point of entry becomes a decision problem later. Prevention is cheaper than correction.`));
c.push(H2("4.2 Trends"));
c.push(...img("fig2_price_trend.png", 470, "Figure 1: Average farm-gate price by crop, 2019-2024."));
c.push(P(`All four crops show rising prices, at about INR ${R.price_trend_slope} per quintal per year on average (${R.price_pct_growth_pa}% a year). Ragi has the highest price per quintal, but **tomato generates by far the highest revenue per hectare** because of its high yield.`));
c.push(...img("w5_revenue.png", 440, "Figure 2: Average gross revenue per hectare per season, by crop."));
c.push(H2("4.3 Statistical insights"));
c.push(table(["Insight", "Statistical evidence"], [
  ["Fertiliser is positively related to yield", `Pearson r = ${S.pearson_fertilizer_kg_ha.r}, p < 0.001`],
  ["Rainfall is positively related to yield", `Pearson r = ${S.pearson_rainfall_mm.r}, p < 0.001`],
  ["Irrigation type matters", `ANOVA F = ${S.anova_irrigation.F}, p < 0.001; index: drip ${R.yield_by_irrig.Drip}, canal ${R.yield_by_irrig.Canal}, borewell ${R.yield_by_irrig.Borewell}, rainfed ${R.yield_by_irrig.Rainfed}`],
  ["Soil pH shows no clear linear link in this data", `r = ${S.pearson_soil_ph.r}, p = ${S.pearson_soil_ph.p.toFixed(2)} (not significant)`],
  ["Rabi prices exceed Kharif prices", `Welch t = ${S.ttest_season_price_idx.t}, p < 0.001`],
  ["Districts differ moderately", "Top (Belagavi, Hassan) about 5% above crop average; bottom (Tumakuru, Raichur) about 3-4% below"],
], [3700, 5606], { size: 18 }));
c.push(spacer());
c.push(H2("4.4 Predictive model outcomes"));
c.push(table(["Model", "MAE", "RMSE", "R-squared (test)", "R-squared (CV)"], m.map((r) => [r[0], String(r[1]), String(r[2]), String(r[3]), r[4] === null ? "n/a" : String(r[4])]), [3100, 1100, 1100, 2000, 2006]));
c.push(spacer());
c.push(P(`The ${R.best_model.toLowerCase()} was best, with an average error of about ${(m[1][1] * 100).toFixed(0)} percentage points of crop-average yield, and the random forest agreed closely on which factors matter. **Business reading:** a transparent model is accurate enough to produce planning *ranges* (low, base, high) in-season, but it is not accurate enough to guarantee the outcome for any single farm.`));
c.push(...img("fig9_importance.png", 430, "Figure 3: Relative importance of yield drivers (random forest)."));

c.push(H2("4.5 Exploration and diagnostic highlights"));
const E5 = R.eda, T5 = R.stat;
c.push(B(`**Seasonality:** Rabi sowing months carry a price premium of about ${(((E5.price_idx_by_month["11"] + E5.price_idx_by_month["12"] + E5.price_idx_by_month["1"]) - (E5.price_idx_by_month["6"] + E5.price_idx_by_month["7"] + E5.price_idx_by_month["8"])) / 3 * 100).toFixed(1)} percentage points over Kharif months, while Rabi yields are lower because rainfall is lower (the season effect disappears once rainfall is controlled in the regression).`));
c.push(B(`**Volatility:** ragi and tomato prices vary most (coefficients of variation ${E5.price_cv_by_crop.Ragi}% and ${E5.price_cv_by_crop.Tomato}%) compared with about 9% for rice and maize.`));
c.push(B(`**Pooled statistics mislead:** the pooled yield-price correlation (${E5.simpson.pooled}) is about double the within-crop values, so crop-level analysis is essential.`));
c.push(B(`**Model reliability:** regression assumptions on linearity, constant variance, independence, multicollinearity and influence were met; residuals show slightly heavy tails, which do not change conclusions. Accuracy is lowest for tomato, so planning ranges for tomato should be wider.`));
c.push(B("**Diagnostics improved the data:** residual review exposed mislabelled crop records that range checks had missed, which led to an extra cleaning rule and a better model."));

// 5 ---------------------------------------------------------------
c.push(H1("5. Business Insights: Linking Evidence to Real-World Challenges"));
c.push(table(["Real-world challenge", "Evidence from the analysis", "Business insight"], [
  ["Climate and rainfall risk", "Rainfall explains a large share of yield differences (r = " + S.pearson_rainfall_mm.r + "); +100 mm is associated with about +" + (R.rain_effect_per_100mm * 100).toFixed(1) + "% yield.", "Rainfall is an early-warning signal. Tracking it in-season gives the co-operative lead time to adjust procurement and logistics."],
  ["Water inequality", `Rainfed farms are ${W.rainfed_area_share_pct}% of area and yield about 11% less; drip about 7% more.`, "Irrigation is the main lever the co-operative can influence and it targets a defined group of farms."],
  ["Input efficiency", "Fertiliser has a strong positive relationship with yield (+" + (R.fert_effect_per_10kg * 100).toFixed(1) + "% per 10 kg/ha), but effects flatten in reality.", "Blanket fertiliser increases waste money. Targeting by soil test and crop is more efficient."],
  ["Price volatility and timing", "Prices rise about " + R.price_pct_growth_pa + "% a year; Rabi prices are significantly higher.", "Seasonal storage and staggered selling can raise realised prices without changing production."],
  ["Supply-chain cost", `Transport is ${W.transport_share_pct.Ragi}% to ${W.transport_share_pct.Tomato}% of farm-gate price; highest for perishable tomato.`, "Savings exist but are modest in percentage terms; perishability and spoilage (not measured here) may matter more than freight."],
  ["Crop economics", `Tomato revenue about INR ${(W.rev_lakh_per_ha.Tomato * 100000).toLocaleString("en-IN")}/ha vs ragi INR ${(W.rev_lakh_per_ha.Ragi * 100000).toLocaleString("en-IN")}/ha (gross).`, "Higher revenue crops also carry higher cost and risk. Net margin data are needed before shifting crop mix."],
  ["Data reliability", `About ${(R.rows_removed_total / R.raw_rows * 100).toFixed(1)}% of records removed; many more repaired.`, "Investing in data entry standards and validation protects every later decision."],
], [2000, 3700, 3606], { size: 17 }));
c.push(spacer());
c.push(...img("w5_transport.png", 420, "Figure 4: Transport cost as a share of farm-gate price, by crop."));
c.push(P("District differences are small compared to practice differences. This suggests that **programmes should be targeted by farm characteristics (rainfed or not, soil, crop) rather than by district alone**."));
c.push(table(["District", "Yield index", "Rainfed farms (%)", "Transport share of price (%)"], W.district_table.slice().reverse().map((r) => [r[0], String(r[1]), String(r[2]), String(r[3])]), [2600, 2000, 2200, 2506], { size: 18 }));
c.push(spacer());

// 6 ---------------------------------------------------------------
c.push(H1("6. Strategic Recommendations"));
c.push(P("Seven recommendations are grouped into three pillars. For each, the report gives the reason, the way to implement it, the benefits and the pitfalls, and a feasibility rating."));

function rec(id, title, why, how, benefits, pitfalls, feas) {
  c.push(H3(`${id}: ${title}`));
  c.push(P(`**Why:** ${why}`));
  c.push(P(`**How:** ${how}`));
  c.push(table(["Potential benefits", "Potential pitfalls and how to manage them"], [[benefits.join("\n"), pitfalls.join("\n")]], [4653, 4653], { size: 17 }));
  c.push(P(`**Feasibility:** ${feas}`, { para: { spacing: { before: 80, after: 160 } } }));
}

c.push(H2("Pillar A: Operational efficiency"));
rec("R6", "Build a reliable data pipeline", `Cleaning removed about ${(R.rows_removed_total / R.raw_rows * 100).toFixed(1)}% of records and repaired many others; poor data quality slows analysis and erodes trust.`,
  "Standardise data entry with drop-down lists, unit prompts and range checks; maintain a district master list; run the automated validation script at each upload; keep a cleaning log and version-controlled raw data.",
  ["- Faster, more trusted reporting", "- Less analyst time spent cleaning", "- Foundation for every other recommendation"],
  ["- Field staff may resist extra steps: keep forms short and train them", "- Over-validation can reject real extremes: review flagged values before deleting"],
  "High. Low cost, uses existing staff and free tools.");
rec("R3", "Rainfall-triggered procurement planning", "Rainfall is a leading indicator of yield, and the model predicts yield within about 7 index points on average.",
  "Each month of the season, update expected volume by district using rainfall and the model; present low, base and high scenarios; link thresholds to actions (extra storage booking, transport capacity, buyer notification).",
  ["- Fewer procurement shortfalls and last-minute spot purchases", "- Better storage and truck utilisation", "- Earlier warning to buyers"],
  ["- Model may be over-trusted: always show ranges and let experts override", "- Synthetic training data: retrain on real data first", "- Rainfall timing, not just total, matters: add weather-timing variables later"],
  "Medium-high. Needs a weather feed (NASA POWER or IMD) and a monthly analyst routine.");
rec("R5", "Track net price and optimise logistics", `Transport takes about ${W.transport_share_pct.Rice}-${W.transport_share_pct.Tomato}% of farm-gate price, highest for tomato.`,
  "Report net price (price minus transport) by district and crop; consolidate loads on high-cost routes; test shared transport with neighbouring co-operatives; for tomato, add spoilage tracking.",
  ["- Visible margin improvement on costly routes", "- Better negotiating position with transporters", "- Transparent reporting to farmers"],
  ["- Savings are small in percentage terms; gains depend on volume", "- Consolidation may delay pickup and increase spoilage for perishables"],
  "Medium. Requires route-level cost data that is not currently captured.");

c.push(H2("Pillar B: Market competitiveness"));
rec("R4", "Use seasonal price patterns in storage and contracts", `Rabi-season prices are significantly higher than Kharif (t = ${S.ttest_season_price_idx.t}), and prices rise about ${R.price_pct_growth_pa}% a year.`,
  "Reserve storage for crops where Rabi sales are feasible; stagger sales; pilot forward contracts with institutional buyers for a share of volume; analyse each crop separately with monthly prices from Agmarknet.",
  ["- Higher average realised price", "- More predictable income for members", "- Stronger relationships with buyers"],
  ["- Storage costs and losses can wipe out the price gain: model break-even first", "- Forward contracts can lock in prices that later turn out low", "- Perishable crops (tomato) may not store at all"],
  "Medium. Needs storage capacity and working capital.");
rec("R8", "Evaluate crop mix and value-added options", `Gross revenue per hectare differs sharply (tomato about INR ${inr(W.rev_lakh_per_ha.Tomato * 100000)} vs ragi about INR ${inr(W.rev_lakh_per_ha.Ragi * 100000)}).`,
  "Collect cost-of-cultivation data by crop; compute net margin and risk (price and yield variability); advise farmers on diversification; explore processing or branding for ragi and millet products, which may add value even at lower revenue per hectare.",
  ["- Higher and more stable farmer income", "- Product differentiation in competitive markets", "- Reduced dependence on a single crop"],
  ["- High-revenue crops carry high cost and price risk: advise on portfolio, not a single switch", "- Processing needs capital and market access", "- Revenue figures here are gross and synthetic"],
  "Medium-low in year 1. Start with analysis and a small pilot.");

c.push(H2("Pillar C: Business performance (farm productivity and income)"));
rec("R1", "Irrigation support for rainfed farms", `Rainfed farms are ${W.rainfed_area_share_pct}% of area and yield about 11% below average; the model associates a move from rainfed to drip with about +${(W.gain_idx * 100).toFixed(0)}% of crop-average yield.`,
  "Identify rainfed farms; pilot drip kits, farm ponds or shared borewells on about 50 farms in the two driest districts with matched control farms; link to subsidy schemes and bank finance; measure yield and net income after one to two seasons.",
  [`- Largest yield gap in the data is addressed`, `- Estimated extra gross revenue about INR ${inr(W.avg_gain_per_rainfed_ha)} per rainfed hectare (average across crops)`, "- Better drought resilience and more reliable supply"],
  ["- Installation cost and loan burden may exceed gains for small plots: calculate payback per farm", "- Groundwater depletion if borewells are expanded: favour efficient or shared systems", "- Association is not proof of cause: the pilot with controls tests it"],
  "Medium. Needs finance partners and farmer buy-in; benefits clear for high-value crops.");
rec("R2", "Soil-test-based fertiliser advice", `Fertiliser is the top yield driver (+${(R.fert_effect_per_10kg * 100).toFixed(1)}% per 10 kg/ha) but real-world returns diminish at high doses and costs are rising.`,
  "Offer soil testing at enrolment; publish a simple dose guide by crop and soil; track fertiliser cost against revenue per hectare; avoid blanket recommendations to raise doses.",
  ["- Higher yield per rupee spent", "- Less fertiliser waste and runoff", "- Credible, evidence-based advisory brand"],
  ["- Testing capacity and cost: partner with local labs or agricultural universities", "- Farmers may over-apply if told 'more is better': train advisors to give ranges", "- Over-use harms soil: monitor soil health over time"],
  "High. Existing institutions already offer soil testing.");
rec("R7", "Revalidate and govern the model each season", "The model was trained on synthetic data and conditions change from year to year.",
  "Retrain each season with new records; use a time-based split; track error by district and crop; record every model version and the data used.",
  ["- Predictions stay reliable", "- Early detection of drift or bias"],
  ["- Model upkeep needs skilled staff: document a simple routine", "- Governance fatigue: keep checks light but regular"],
  "High. Low cost once the pipeline exists.");

// 7 ---------------------------------------------------------------
c.push(H1("7. Prioritisation, Financial View and Roadmap"));
c.push(H2("7.1 Prioritisation"));
c.push(P("Each recommendation was scored for expected business impact and feasibility (1 to 5). The bubble size shows relative cost. These are judgement-based scores for discussion, not statistical outputs."));
c.push(...img("w5_matrix.png", 470, "Figure 5: Prioritisation matrix of the recommendations (R8, crop mix, is deferred to analysis in year 1)."));
c.push(P("**Do first:** R2 (soil-test advice), R3 (rainfall-based planning) and R6 (data pipeline) are high-impact or foundational and relatively easy. **Plan and fund:** R1 (irrigation) has the highest impact but needs finance and a controlled pilot. **Quick wins:** R7 and R5 are inexpensive to start."));
c.push(H2("7.2 Illustrative financial view of the irrigation pilot"));
c.push(P(`Using the model's estimated yield effect and average prices, the extra gross revenue from upgrading rainfed land is about INR ${inr(W.avg_gain_per_rainfed_ha)} per hectare per season on average (INR ${inr(W.gain_per_rainfed_ha_inr.Rice)} for rice, ${inr(W.gain_per_rainfed_ha_inr.Maize)} for maize, ${inr(W.gain_per_rainfed_ha_inr.Ragi)} for ragi and ${inr(W.gain_per_rainfed_ha_inr.Tomato)} for tomato). For an illustrative co-operative footprint of 1,000 hectares, with ${W.rainfed_area_share_pct}% rainfed, the scenarios are:`));
c.push(...img("w5_scenario.png", 440, "Figure 6: Extra gross revenue per season by share of rainfed area upgraded (1,000 ha footprint)."));
c.push(callout("How to read this honestly", [
  "These are **gross** revenue gains from a statistical association in synthetic data. The averages are pulled up by tomato, where yield and price per hectare are high.",
  "Net benefit = extra revenue minus system cost, water and energy, maintenance, and loan interest. A real payback period can only be computed with those costs.",
  "A decision to scale should depend on pilot results, not on this scenario alone."]));
c.push(spacer());
c.push(H2("7.3 Roadmap"));
c.push(table(["Phase", "Months", "Actions", "Owner"], [
  ["Foundation", "0-2", "R6 data standards and validation; baseline KPIs; start soil testing (R2)", "Analyst; field team"],
  ["Pilot", "3-6", "R1 irrigation pilot with controls; R3 first in-season volume ranges; R5 net-price report", "Agronomy lead; analyst"],
  ["Scale", "7-9", "R2 advisory in all districts; R4 Rabi storage plan and contract pilot", "Operations manager"],
  ["Review", "10-12", "Evaluate pilot; R7 retrain model; start R8 margin study; decide on scale-up", "Management committee"],
], [1500, 1000, 5006, 1800], { size: 17 }));
c.push(spacer());
c.push(H2("7.4 Key performance indicators"));
c.push(table(["Dimension", "KPI", "Baseline", "12-month target"], [
  ["Operational", "Records failing validation at entry", `About ${(R.rows_removed_total / R.raw_rows * 100).toFixed(1)}% removed in cleaning`, "Under 3%"],
  ["Operational", "In-season procurement forecast error", "Not measured", "Within 10% of actual"],
  ["Operational", "Net price reported by district and crop", "Not reported", "Monthly"],
  ["Competitiveness", "Average realised price in Rabi sales", "Year-1 baseline", "+3%"],
  ["Performance", "Yield index of rainfed pilot farms", "About " + R.yield_by_irrig.Rainfed, "0.95 or higher"],
  ["Performance", "Farms with soil test on record", "0%", "60%"],
  ["Performance", "Fertiliser cost per tonne of produce", "Year-1 baseline", "Down 5%"],
], [1700, 3600, 2000, 2006], { size: 17 }));
c.push(spacer());

// 8 ---------------------------------------------------------------
c.push(H1("8. Cross-Cutting Risks and Pitfalls"));
c.push(table(["Risk", "Description", "Mitigation"], [
  ["Synthetic-data risk", "All effect sizes come from simulated data with designed relationships.", "Re-estimate on real records; treat figures as illustrative."],
  ["Correlation vs causation", "Better-resourced farms may adopt irrigation and fertiliser and also manage land better.", "Pilot with matched control farms; collect farm characteristics."],
  ["Over-reliance on the model", "A good average fit can hide poor predictions in some districts or years.", "Show ranges; track error by district; keep expert judgement."],
  ["Adoption and trust", "Farmers may distrust advice or fear debt from irrigation loans.", "Involve farmer representatives; start small; share pilot results openly."],
  ["Equity", "Programmes may favour farms that are easiest to reach and be better recorded in the data.", "Monitor coverage; prioritise vulnerable rainfed farms; state who is missing."],
  ["Environmental", "Water over-extraction and fertiliser overuse.", "Favour efficient irrigation; set dose ranges; monitor soil and groundwater."],
  ["Climate shocks", "Drought or floods can overwhelm any plan.", "Scenario planning; link to crop insurance; keep reserve funds."],
  ["Data privacy", "Farm-level records are personal and commercially sensitive.", "Aggregate in reports, restrict access, obtain consent."],
], [2000, 3700, 3606], { size: 17 }));
c.push(spacer());

// 9 ---------------------------------------------------------------
c.push(H1("9. Further Research and Data-Driven Opportunities"));
c.push(N("**Validate on real data.** Repeat the pipeline with actual farm records and public data (data.gov.in, IMD, Agmarknet) and compare effect sizes.", "nums5"));
c.push(N("**Causal evaluation.** Use the irrigation pilot, or quasi-experimental methods such as matched comparisons, to estimate the true effect of irrigation and fertiliser.", "nums5"));
c.push(N("**Better weather features.** Add rainfall timing, dry-spell counts, heat-stress days and soil moisture, and test satellite indices such as NDVI for early yield estimates.", "nums5"));
c.push(N("**Time-series price forecasting.** Build crop-specific monthly models (for example seasonal ARIMA or gradient boosting) with arrivals and weather as inputs.", "nums5"));
c.push(N("**Cost and margin analysis.** Collect cost-of-cultivation data to move from gross revenue to net margin and risk-adjusted returns by crop.", "nums5"));
c.push(N("**Post-harvest and spoilage analytics.** Measure losses in storage and transit, particularly for tomato, and test cold-chain options.", "nums5"));
c.push(N("**Farmer segmentation.** Cluster farms by practices and resources to design tailored advisory packages.", "nums5"));
c.push(N("**Climate and sustainability metrics.** Track water use, emissions and soil health to support sustainability-linked buyers and finance.", "nums5"));
c.push(N("**Uncertainty quantification.** Produce prediction intervals and test models that capture non-linear fertiliser response.", "nums5"));

// 10 ---------------------------------------------------------------
c.push(H1("10. Conclusion"));
c.push(P("The four earlier weeks showed how to plan data sourcing, prepare messy data and build a validated model. This final report shows what it adds up to for the business. The strongest and most actionable finding is that yield is shaped by practices the co-operative can influence, especially irrigation and fertiliser, and by rainfall that it can monitor. A disciplined, modest programme (clean data, rainfall-based planning, soil-test advice and a controlled irrigation pilot) offers a realistic path to higher productivity, steadier supply and better income, provided the pitfalls described here are managed and the findings are re-tested on real data."));
c.push(P("The central message is that **data analytics is valuable not because it produces predictions, but because it changes decisions**. The value comes from linking each number to an action, an owner, a cost and a way of checking whether it worked."));

// Appendix ---------------------------------------------------------------
c.push(H1("Appendix: Evidence Map and Assumptions"));
c.push(H2("A. Evidence map"));
c.push(table(["Recommendation", "Supporting evidence", "Source week"], [
  ["R1 Irrigation support", "ANOVA, Tukey tests, group means, regression coefficients", "Weeks 3, 4"],
  ["R2 Soil-test fertiliser advice", "Correlation, regression and feature importance", "Weeks 3, 4"],
  ["R3 Rainfall-based planning", "Correlation, regression, held-out accuracy", "Weeks 3, 4"],
  ["R4 Seasonal storage and contracts", "Price trends, seasonal index, Welch t-test, price regression", "Weeks 3, 4"],
  ["R5 Net-price and logistics", "Transport share analysis; supply-chain KPIs defined in Week 1", "Weeks 1, 5"],
  ["R6 Data pipeline", "Quality scorecard, cleaning log, residual diagnostics", "Weeks 2, 4"],
  ["R7 Model governance", "Validation approach, assumption checks and limits", "Week 4"],
  ["R8 Crop mix", "Revenue per hectare, price and yield volatility by crop", "Weeks 3, 5"],
], [3000, 4506, 1800], { size: 18 }));
c.push(spacer());
c.push(H2("B. Key assumptions"));
c.push(B("Data are synthetic; relationships were designed into the data and real effects will differ."));
c.push(B("The yield effect of irrigation is taken from a linear model and assumed constant across crops as a yield index."));
c.push(B("Revenue is gross (yield x price) and excludes cost of cultivation, irrigation systems, labour and finance."));
c.push(B("Scenario assumes the dataset's crop mix and average prices apply to a 1,000-hectare footprint."));
c.push(B("Prioritisation scores are judgemental and should be reviewed with stakeholders."));

build("Week5_Business_Insights_Reporting_and_Strategic_Recommendations.docx", "Week 5: Business Insights and Strategic Recommendations", c);
