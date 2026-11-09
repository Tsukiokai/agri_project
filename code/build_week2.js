const L = require("./lib");
const { P, H1, H2, H3, B, N, spacer, pageBreak, table, img, callout, code, cover, build, results: R } = L;
const E = R.eda, dq = E.dq, mb = R.missing_before, imp = E.imputation_rmse;
const anomTotal = Object.values(R.anomalies).reduce((a, b) => a + b, 0);
const afterDup = R.raw_rows - R.duplicates_removed;
const afterOut = afterDup - R.yield_outliers - R.plausibility_removed;

const c = [];
c.push(...cover("Week 2 Task", "Data Cleaning and Preparation for Agribusiness Analysis", "Turning an aggregated raw dataset from several public sources into an analysis-ready table"));

c.push(H1("Contents"));
["1. Scenario and Raw Data Description", "2. Inventory of Data Quality Issues", "3. Step-by-Step Cleaning Plan with Rationale",
 "4. Technique Selection: Duplicates, Missing Values, Outliers and Normalisation", "5. Challenges Faced and Strategies Used",
 "6. Integrity and Readiness Checks", "7. Outcomes of the Cleaning Process", "8. Recommendations for Continuous Quality Improvement", "9. Conclusion"]
 .forEach((t) => c.push(P(t, { para: { spacing: { after: 40 } } })));
c.push(pageBreak());

// 1 ---------------------------------------------------------------
c.push(H1("1. Scenario and Raw Data Description"));
c.push(P(`In Week 1, public data sources were identified for production, weather, prices, soil and farm practices. This week simulates what happens next: an analyst receives an **aggregated raw file** assembled from several of those sources and from the co-operative's own field records. The file contains **${R.raw_rows.toLocaleString()} farm-season records and 16 fields** for four crops (rice, maize, ragi, tomato) in eight Karnataka districts from 2019 to 2024. The data are synthetic, but they were built to reproduce the problems that appear when data from different publishers are merged.`));
c.push(table(["Field group", "Fields", "Likely origin in the aggregated file"], [
  ["Identifiers and geography", "record_id, farm_id, district", "Co-operative field records; district names typed by hand"],
  ["Crop and season", "crop, season, year, month, area_ha", "Production statistics (data.gov.in / ICRISAT style) and field logs"],
  ["Weather", "rainfall_mm, avg_temp_c", "IMD / NASA POWER style weather series"],
  ["Practices and soil", "irrigation, fertilizer_kg_ha, soil_ph", "Farm survey and soil test records"],
  ["Outcome and market", "yield_t_ha, farmgate_price_inr_qtl, transport_cost_inr_qtl", "Harvest records and Agmarknet-style prices"],
], [2400, 3300, 3606], { size: 17 }));
c.push(spacer());
c.push(P("Because the file mixes sources, it carries **source-specific habits**: some sources report yield in kg/ha and others in t/ha; some write prices with a currency prefix; district names are typed in different cases and spellings; and weather gaps are common."));

// 2 ---------------------------------------------------------------
c.push(H1("2. Inventory of Data Quality Issues"));
c.push(P("Profiling comes before cleaning. The raw file was checked field by field for eight classes of problem, and the number of affected records was counted so that the size of each issue is known."));
c.push(table(["Issue class", "Examples found", "Records affected"], [
  ["Missing values", "Blank fertiliser, price, soil pH, rainfall, temperature, yield, irrigation, area", `${Object.values(mb).reduce((a, b) => a + b, 0)} blank cells across 8 fields`],
  ["Duplicate entries", "Identical rows from double data entry", String(R.duplicates_removed)],
  ["Inconsistent categories", "'MANDYA', ' mandya ', 'Mysore' vs 'Mysuru', 'Ragi (Finger millet)', 'bore well'", `${dq.labels[0]} distinct labels where only ${dq.labels[1]} are valid`],
  ["Unit inconsistency", "Yield recorded as '5003.0 kg/ha' instead of t/ha", String(R.yield_unit_fixed)],
  ["Format inconsistency", "Price stored as text, 'Rs. 2600.0'", String(R.price_format_fixed)],
  ["Impossible values", `Rainfall 9999 mm, soil pH 0 / 14 / 66, negative area, temperature 99 C`, String(anomTotal)],
  ["Statistical outliers", "Yield far above or below what is plausible for the crop", String(R.yield_outliers)],
  ["Cross-field inconsistency", "Yield that does not fit the crop label (for example a rice-like 4.5 t/ha under 'Ragi')", `${R.plausibility_removed} found (see Section 5)`],
], [2200, 4700, 2406], { size: 17 }));
c.push(spacer());
c.push(...img("fig1_missing.png", 460, "Figure 1: Missing values by field in the raw file. Fertiliser, price and soil pH have the largest gaps."));
c.push(H2("2.1 Baseline data-quality scorecard"));
c.push(P("Four quality dimensions were scored before cleaning. These scores are repeated after cleaning in Section 7."));
c.push(table(["Dimension", "Definition", "Raw score"], [
  ["Completeness", "Non-missing cells in key fields / all cells", `${dq.completeness[0]}%`],
  ["Validity", "Values inside agreed ranges / all values present", `${dq.validity[0]}%`],
  ["Uniqueness", "Non-duplicate records / all records", `${dq.uniqueness[0]}%`],
  ["Format consistency", "Numeric fields stored as clean numbers", `${dq.format[0]}%`],
], [2300, 4800, 2206]));
c.push(spacer());

// 3 ---------------------------------------------------------------
c.push(H1("3. Step-by-Step Cleaning Plan with Rationale"));
c.push(P("The order of steps matters. Structure is fixed first, then formats and units, then validity, then statistics, and only then are missing values filled. If imputation came first, wrong values would spread into the medians used to fill gaps. The raw file is never overwritten; each run produces a new cleaned file and a log."));
c.push(table(["Step", "Action", "Rationale"], [
  ["0", "Load raw file and take a read-only copy; log row count", "Raw data stay intact for audit and re-runs"],
  ["1", "Remove exact duplicates", "Duplicates double-count farms and bias averages"],
  ["2", "Standardise text categories", "One district must be one label or group-by results are wrong"],
  ["3", "Convert units and formats to numbers", "Mixed units create false outliers and wrong medians"],
  ["4", "Apply validity ranges; set impossible values to missing", "Impossible values are entry errors, not information"],
  ["5", "Detect statistical outliers within each crop (3 x IQR)", "Scales differ by crop; a global rule would mis-flag"],
  ["5b", "Cross-field plausibility check (yield vs crop median)", "Catches errors that pass range checks, such as mislabelled crops"],
  ["6", "Drop rows with missing target; impute other gaps", "Never impute the quantity you want to explain"],
  ["7", "Normalise and engineer features", "Makes crops comparable and adds business metrics"],
  ["8", "Re-score quality, reconcile row counts, save clean file and log", "Proves the data are ready and that nothing vanished silently"],
], [600, 4300, 4406], { size: 17 }));
c.push(spacer());
c.push(H2("Step 1: Remove duplicates"));
c.push(P(`Rows identical in every field were treated as double entries: **${R.duplicates_removed}** were removed (${R.raw_rows} to ${afterDup} rows). Near-duplicates (same farm, crop and season but different values) were kept for review because they may be genuine corrections.`));
c.push(code(["# pseudo-code", "df = df.drop_duplicates()                      # exact duplicates only", "log('duplicates removed', before - len(df))"]));
c.push(spacer());
c.push(H2("Step 2: Standardise categories"));
c.push(P("Text was trimmed, converted to title case and mapped to a master list. This removed spelling and case variants and collapsed alias names (Mysore to Mysuru, 'Ragi (Finger millet)' to Ragi, 'Bore well' to Borewell)."));
c.push(code(["for col in ['district','crop','season','irrigation']:", "    df[col] = df[col].str.strip().str.title()", "df['district'] = df['district'].replace({'Mysore': 'Mysuru'})", "df['crop'] = df['crop'].replace({'Ragi (Finger Millet)': 'Ragi'})"]));
c.push(spacer());
c.push(H2("Step 3: Convert units and formats"));
c.push(P(`**${R.yield_unit_fixed}** yields recorded in kg/ha were divided by 1,000, and **${R.price_format_fixed}** prices stored as text were stripped of the currency prefix and converted to numbers. Converted values were checked against crop medians to confirm they now sit in the right range.`));
c.push(code(["is_kg = df['yield_t_ha'].astype(str).str.contains('kg/ha')", "df['yield_t_ha'] = to_number(df['yield_t_ha'])", "df.loc[is_kg, 'yield_t_ha'] /= 1000", "df['price'] = to_number(df['price'])        # strips 'Rs.' and spaces"]));
c.push(spacer());
c.push(H2("Step 4: Validity ranges"));
c.push(P("Domain ranges were applied. A pH of 66 or a temperature of 99 C is physically impossible, so these were **set to missing rather than deleted**. This keeps the other valid fields of the record and lets the gap be filled in Step 6."));
c.push(table(["Field", "Valid range", "Basis for range", "Set to missing"], [
  ["rainfall_mm", "0-2500", "Seasonal totals in the region", String(R.anomalies.rainfall_mm)],
  ["soil_ph", "3.5-9.5", "Plausible agricultural soil pH", String(R.anomalies.soil_ph)],
  ["area_ha", "0.05-50", "Smallholder plots; area cannot be negative", String(R.anomalies.area_ha)],
  ["avg_temp_c", "5-45", "Realistic seasonal mean temperature", String(R.anomalies.avg_temp_c)],
], [1800, 1500, 4000, 2006], { size: 17 }));
c.push(spacer());
c.push(H2("Step 5 and 5b: Outliers and plausibility"));
c.push(P(`Yield was examined **within each crop**. Records beyond 3 x IQR from the quartiles were removed (**${R.yield_outliers}**). A wide threshold was used so genuine good and bad harvests stay. A second, domain-based rule then removed records with yield above 1.5 times or below 0.4 times the crop median (**${R.plausibility_removed}**), which targets errors that look normal on a range check but not for the crop.`));
c.push(code(["q1, q3 = df.groupby('crop')['yield'].quantile([.25,.75])", "flag = (y < q1 - 3*IQR) | (y > q3 + 3*IQR)       # within crop", "med = df.groupby('crop')['yield'].transform('median')", "flag |= (y > 1.5*med) | (y < 0.4*med)            # cross-field plausibility", "df = df[~flag]"]));
c.push(spacer());
c.push(H2("Step 6: Missing values"));
c.push(P(`Rows with no yield (**${R.rows_dropped_no_yield}**) were dropped because the yield is the outcome to be explained; imputing it would create artificial patterns. Other numeric gaps were filled with the **median of the same district and season**, falling back to the overall median. The categorical field irrigation used its most common value. The choice of method is justified experimentally in Section 4.`));
c.push(code(["df = df.dropna(subset=['yield_t_ha'])", "for c in numeric_cols:", "    df[c] = df[c].fillna(df.groupby(['district','season'])[c].transform('median'))", "    df[c] = df[c].fillna(df[c].median())", "df['irrigation'] = df['irrigation'].fillna(df['irrigation'].mode()[0])"]));
c.push(spacer());
c.push(H2("Step 7 and 8: Normalise, validate, save"));
c.push(P("Yield was normalised within crop (Section 4.4), new business fields were created, quality was re-scored and the cleaned file and cleaning log were saved."));

// 4 ---------------------------------------------------------------
c.push(H1("4. Technique Selection: Duplicates, Missing Values, Outliers and Normalisation"));
c.push(H2("4.1 Duplicates"));
c.push(table(["Option", "When it is right", "Decision"], [
  ["Drop exact duplicates", "Every field identical; clearly double entry", "Used"],
  ["Key-based de-duplication (e.g. farm + crop + season + year)", "A unique key must exist; keeps the latest or most complete record", "Recommended once farm keys are reliable"],
  ["Fuzzy matching on names", "Name variants of the same entity", "Not needed for this file"],
], [3300, 3800, 2206], { size: 17 }));
c.push(spacer());
c.push(H2("4.2 Missing values: imputation techniques compared"));
c.push(P("No single imputation method is best. To choose, a **hide-and-recover experiment** was run on the cleaned data: 15% of known values were hidden at random, filled with each method, and compared with the true values (lower RMSE is better)."));
c.push(table(["Method", "Fertiliser (kg/ha) RMSE", "Rainfall (mm) RMSE"], Object.keys(imp.fertilizer_kg_ha).map((k) => [k, String(imp.fertilizer_kg_ha[k]), String(imp.rainfall_mm[k])]), [4300, 2500, 2506]));
c.push(spacer());
c.push(P(`**Reading the result.** For rainfall, using the median of the same district and season cuts the error almost in half (from about ${imp.rainfall_mm["Median (global)"]} to ${imp.rainfall_mm["Group median (district + season)"]} mm) because rainfall varies strongly by place and season. For fertiliser, group medians give no gain (${imp.fertilizer_kg_ha["Group median (district + season)"]} vs ${imp.fertilizer_kg_ha["Median (global)"]}), because fertiliser use does not depend on district or season in this data. Adding crop to the grouping made nothing better and slightly worse on both fields, since smaller groups are noisier. The district-and-season median was therefore kept as a single, simple rule that is never worse than the global median.`));
c.push(table(["Technique", "Strength", "Weakness", "Use here"], [
  ["Mean", "Simple", "Pulled by outliers; shrinks variance", "No"],
  ["Median (global)", "Robust to outliers", "Ignores group differences", "Fallback"],
  ["Group median", "Uses context (district, season); robust", "Small groups are noisy", "Primary method"],
  ["Regression or k-nearest-neighbour imputation", "Uses relationships between fields", "More complex; may leak target information", "Future option"],
  ["Multiple imputation", "Reflects imputation uncertainty", "Heavier to run and explain", "Future option"],
  ["Deletion of rows", "No artificial values", "Loses data; biases if not random", "Only for missing target"],
], [2400, 2700, 2700, 1506], { size: 16 }));
c.push(spacer());
c.push(H2("4.3 Outlier detection"));
c.push(table(["Method", "How it works", "Used for"], [
  ["Domain ranges", "Reject values that are impossible (pH 66, 99 C)", "Impossible values"],
  ["IQR within group", "Flag values beyond 3 x IQR within each crop", "Extreme yields"],
  ["Cross-field plausibility", "Compare yield with the crop median", "Mislabelled or inconsistent records"],
  ["Model residuals (Week 4)", "Inspect records the model cannot explain", "Final safety net"],
], [2300, 4500, 2506], { size: 17 }));
c.push(spacer());
c.push(H2("4.4 Normalisation and scaling"));
c.push(table(["Technique", "Formula", "Use"], [
  ["Crop-wise index (used for yield)", "yield / mean yield of the crop", "Makes rice, maize, ragi and tomato comparable; 1.0 = average"],
  ["Z-score standardisation", "(x - mean) / SD", "Put predictors on one scale for regression coefficients; fit on training data only"],
  ["Min-max scaling", "(x - min) / (max - min)", "Distance-based methods or neural networks (not needed here)"],
  ["Log transform", "log(x)", "Right-skewed values such as farm area"],
], [2800, 2500, 4006], { size: 17 }));
c.push(spacer());
c.push(...img("fig7_normalisation.png", 480, "Figure 2: Raw yield mixes four crops with very different scales; the normalised index gives one comparable distribution."));
c.push(H2("4.5 Feature engineering"));
c.push(table(["New field", "Formula", "Purpose"], [
  ["total_production_t", "area x yield", "Compare districts by volume"],
  ["net_price_inr_qtl", "price - transport cost", "What the farmer keeps"],
  ["revenue_inr_per_ha", "yield x 10 x price", "Compare crops on economic return"],
  ["date", "year + month", "Time-series analysis"],
], [2600, 2800, 3906], { size: 17 }));
c.push(spacer());

// 5 ---------------------------------------------------------------
c.push(H1("5. Challenges Faced and Strategies Used"));
c.push(table(["Challenge", "What happened", "Strategy used"], [
  ["Error or extreme truth?", "A very high yield could be an entry error or a real record harvest.", "Used a wide 3 x IQR threshold within crop and removed only values implausible for the crop."],
  ["Order of operations", "Unconverted kg/ha values would have been flagged as outliers and distorted medians.", "Fixed the sequence: duplicates, text, units, ranges, outliers, then imputation."],
  ["Hidden missing data", "Impossible values (pH 66) are missing data in disguise.", "Applied validity rules before counting and imputing missing values."],
  ["Mislabelled records slipped through", `Range checks passed, but residual diagnostics later showed about ten 'Ragi' records with yields of 4 to 4.6 t/ha (ragi normally gives about 2.5). A mislabelled crop name had overwritten other crops' labels.`, `Added a cross-field plausibility rule (Step 5b) removing ${R.plausibility_removed} records, then re-ran the whole pipeline. Regression R-squared improved and residuals became more symmetric.`],
  ["Imputation can understate variability", "Filled values sit at the median and reduce variance.", "Limited imputation to fields with under 10% missing; compared methods by experiment; flagged re-check without imputed rows."],
  ["Reproducibility", "Manual fixes cannot be repeated or audited.", "Every rule was scripted and logged with counts."],
], [2200, 3700, 3406], { size: 17 }));
c.push(spacer());
c.push(callout("Lesson", ["Cleaning is iterative. Some errors only show up when the data are used (for example in a model residual plot), so the cleaning rules should be updated whenever later analysis reveals a new kind of error."]));
c.push(spacer());

// 6 ---------------------------------------------------------------
c.push(H1("6. Integrity and Readiness Checks"));
c.push(table(["Check", "Method", "Result"], [
  ["Row reconciliation", "Raw rows - removed rows = clean rows", `${R.raw_rows} - ${R.rows_removed_total} = ${R.clean_rows} (reconciled)`],
  ["No duplicates", "Count of duplicated rows", "0"],
  ["No missing values in modelling fields", "isna().sum()", String(R.missing_after)],
  ["All values in valid ranges", "Re-apply Step 4 rules", "100% valid"],
  ["Single label per category", "nunique() on category fields", `${dq.labels[1]} labels (expected 18: 8 districts + 4 crops + 2 seasons + 4 irrigation types)`],
  ["Units consistent", "Median yield per crop", "t/ha for all crops"],
], [2600, 3200, 3506], { size: 17 }));
c.push(spacer());

// 7 ---------------------------------------------------------------
c.push(H1("7. Outcomes of the Cleaning Process"));
c.push(H2("7.1 Cleaning log"));
c.push(table(["Stage", "Action", "Rows after"], [
  ["Raw file", "Loaded as received", String(R.raw_rows)],
  ["Step 1", `Removed ${R.duplicates_removed} exact duplicates`, String(afterDup)],
  ["Steps 2-4", "Standardised text, fixed units and formats, flagged impossible values as missing (no row loss)", String(afterDup)],
  ["Step 5", `Removed ${R.yield_outliers} statistical yield outliers`, String(afterDup - R.yield_outliers)],
  ["Step 5b", `Removed ${R.plausibility_removed} implausible records (cross-field check)`, String(afterOut)],
  ["Step 6", `Dropped ${R.rows_dropped_no_yield} rows with no yield; imputed remaining gaps`, String(R.clean_rows)],
  ["**Final**", `${R.rows_removed_total} rows removed (${(R.rows_removed_total / R.raw_rows * 100).toFixed(1)}%)`, `**${R.clean_rows}**`],
], [1500, 5800, 2006], { size: 17 }));
c.push(spacer());
c.push(H2("7.2 Quality scorecard: before and after"));
c.push(...img("w2_quality_scorecard.png", 480, "Figure 3: Data-quality scorecard before and after cleaning (vertical axis starts at 85%)."));
c.push(table(["Dimension", "Raw", "Cleaned"], [
  ["Completeness", `${dq.completeness[0]}%`, `${dq.completeness[1]}%`],
  ["Validity", `${dq.validity[0]}%`, `${dq.validity[1]}%`],
  ["Uniqueness", `${dq.uniqueness[0]}%`, `${dq.uniqueness[1]}%`],
  ["Format consistency", `${dq.format[0]}%`, `${dq.format[1]}%`],
  ["Distinct category labels", String(dq.labels[0]), String(dq.labels[1])],
], [3500, 2900, 2906]));
c.push(spacer());
c.push(H2("7.3 What the clean data enable"));
c.push(B("Reliable group comparisons (district, crop, irrigation) because labels are consistent."));
c.push(B("Valid statistical tests and regression, because no impossible values or mixed units distort estimates."));
c.push(B("Business metrics (net price, revenue per hectare) that are comparable across crops."));
c.push(B(`A trusted starting point for exploration in Week 3: ${R.clean_rows} records with no missing values in modelling fields.`));

// 8 ---------------------------------------------------------------
c.push(H1("8. Recommendations for Continuous Quality Improvement"));
c.push(table(["Recommendation", "What to do", "Benefit"], [
  ["Fix errors at the source", "Use drop-down lists for district, crop, season and irrigation; unit prompts; range limits at entry", "Prevents the most common errors before they enter the file"],
  ["Automate validation", "Run the validation script on every new upload; reject or flag failing rows", "Early detection; less manual cleaning"],
  ["Maintain master data", "Keep a versioned list of districts, crops and aliases", "One label per entity across all sources"],
  ["Monitor quality KPIs", "Track completeness, validity, uniqueness and consistency each month; set alert thresholds", "Quality trends become visible"],
  ["Use model feedback", "Review largest model residuals each season for new error types", "Finds errors that rules miss, as with the mislabelled records"],
  ["Document and version", "Keep the cleaning log and data dictionary under version control", "Audit trail and reproducibility"],
  ["Assign data ownership", "Name a data steward per source; hold short quarterly quality reviews", "Accountability"],
  ["Train data collectors", "Brief field staff on units, formats and why quality matters; feed errors back to them", "Cultural improvement"],
  ["Record imputation flags", "Add a column showing which values were imputed", "Lets analysts test sensitivity to imputation"],
], [2300, 4200, 2806], { size: 17 }));
c.push(spacer());

// 9 ---------------------------------------------------------------
c.push(H1("9. Conclusion"));
c.push(P(`This report documented the preparation of an aggregated agribusiness dataset: profiling eight classes of quality issue, applying a deliberately ordered ten-step cleaning plan with a rationale for each choice, comparing imputation methods by experiment, normalising yield by crop, and verifying integrity with a reconciled cleaning log and a before-and-after quality scorecard. The raw file of ${R.raw_rows} records became ${R.clean_rows} validated records with 100% completeness, validity, uniqueness and format consistency in the modelling fields. The most important lesson was that cleaning is iterative: a later model diagnostic exposed mislabelled records that range checks missed, leading to an additional rule and a re-run. The recommendations in Section 8 aim to move quality control from repair after the fact to prevention at the source.`));

build("Week2_Data_Cleaning_and_Preparation.docx", "Week 2: Data Cleaning and Preparation", c);
