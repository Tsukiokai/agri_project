const L = require("./lib");
const { P, H1, H2, H3, B, N, spacer, pageBreak, table, img, callout, cover, build, results: R } = L;

const c = [];
c.push(...cover("Week 1 Task", "Agribusiness Data Landscape Exploration and Planning", "Public data sources, data types, decision use-cases and a strategic analysis plan with KPIs"));

c.push(H1("Contents"));
["1. Introduction and Objectives", "2. The Agribusiness Landscape and Its Challenges", "3. Publicly Available Sources of Agribusiness Data",
 "4. Review of Key Data Types", "5. Using Data for Decision-Making in Agribusiness", "6. Planned Analysis Functions: Data, Metrics and Business Impact",
 "7. How the Approaches Address Common Agribusiness Challenges", "8. Strategic Plan for Data Exploration and Analysis", "9. Key Performance Indicators and Metrics",
 "10. Timeline, Risks and Governance", "11. Conclusion", "References and Source Portals"].forEach((t) => c.push(P(t, { para: { spacing: { after: 40 } } })));
c.push(pageBreak());

// 1 ---------------------------------------------------------------
c.push(H1("1. Introduction and Objectives"));
c.push(P("Agribusiness covers the whole chain from inputs (seed, fertiliser, water) through farming, aggregation, storage and transport to markets. Every stage now generates data, and a large share of it is published openly by governments and international agencies. Using this data well starts with understanding what exists, what each dataset can and cannot tell us, and how it connects to real decisions."));
c.push(P("This document is the Week 1 exploratory research and planning report for a five-week analytics project. It is written for a hypothetical client, **GreenHarvest Agri Co-operative**, which procures rice, maize, ragi (finger millet) and tomato from smallholder farms in eight Karnataka districts."));
c.push(H2("1.1 Objectives"));
c.push(B("Identify and describe at least five publicly available sources of agribusiness data (this report covers eight)."));
c.push(B("Review the main data types: crop yields, weather, market prices, supply-chain metrics and supporting soil and input data."));
c.push(B("Explain how each type of data supports decisions in agribusiness."));
c.push(B("Define the planned analysis functions, with data types, metrics and business impact."));
c.push(B("Set out a strategic plan, including KPIs, for the data exploration and analysis in Weeks 2 to 5."));

// 2 ---------------------------------------------------------------
c.push(H1("2. The Agribusiness Landscape and Its Challenges"));
c.push(P("A review of public research and policy material (FAO, World Bank, NITI Aayog, Ministry of Agriculture and Farmers Welfare and ICRISAT publications) shows a consistent set of challenges. They shape what data we need and which questions are worth asking."));
c.push(table(["Challenge", "What is happening", "Data question it raises"], [
  ["Climate variability", "Erratic monsoon onset and heat stress shift sowing windows and yields.", "How much of yield variation is explained by rainfall and temperature?"],
  ["Price volatility", "Prices move with arrivals, storage and demand; perishables such as tomato are the most volatile.", "What are the trend, seasonality and volatility of farm-gate prices?"],
  ["Fragmented supply chains", "Many small producers, long chains and several intermediaries reduce farmer share of price.", "How much of the price is absorbed by transport and handling?"],
  ["Post-harvest loss", "Handling, storage and transit losses are significant, especially for fresh produce.", "Where are losses highest and what do they cost?"],
  ["Rising input costs", "Fertiliser, fuel and labour costs rise while subsidies change.", "Which inputs give the best return per rupee?"],
  ["Water stress and unequal access", "Groundwater depletion; rainfed farms lag irrigated farms.", "How large is the productivity gap between irrigation types?"],
  ["Poor data quality and coverage", "Manual entry, mixed units, naming differences and gaps.", "Can the data be trusted, and how should it be cleaned?"],
], [2000, 3700, 3606], { size: 17 }));
c.push(spacer());

// 3 ---------------------------------------------------------------
c.push(H1("3. Publicly Available Sources of Agribusiness Data"));
c.push(P("Eight public sources were researched. Each is described by publisher, content, granularity, typical format and access method, and then assessed for strengths and limitations. Portal layouts and licence terms change, so availability should be re-verified on the day of extraction."));
c.push(H2("3.1 Source catalogue"));
c.push(table(["#", "Source (publisher)", "Content", "Granularity / frequency", "Format / access"], [
  ["1", "Agmarknet (Government of India, agricultural marketing)", "Daily mandi prices (min, max, modal) and arrivals by commodity, variety and market", "Market; daily", "Web query and CSV export"],
  ["2", "data.gov.in Open Government Data (Ministry of Agriculture & Farmers Welfare and others)", "Crop area, production and yield by state/district and season; input and scheme data", "District; annual / seasonal", "CSV, JSON API (key needed)"],
  ["3", "India Meteorological Department (IMD)", "Gridded and district rainfall and temperature, forecasts", "Grid or district; daily", "NetCDF / CSV via data portal"],
  ["4", "NASA POWER (NASA)", "Agroclimatology: rainfall, temperature, solar radiation, humidity for any coordinates", "Point (0.5 degree grid); daily", "REST API, JSON / CSV"],
  ["5", "ICRISAT District Level Database (ICRISAT)", "Long-run district data on area, yield, irrigation, fertiliser, labour and inputs", "District; annual", "CSV / Excel download"],
  ["6", "FAOSTAT (FAO, United Nations)", "Production, trade, producer prices, fertiliser use and land use by country", "Country; annual", "Bulk CSV, API"],
  ["7", "World Bank commodity price data (the 'Pink Sheet')", "Monthly benchmark prices for grains, fertilisers and energy", "Global; monthly", "Excel / CSV"],
  ["8", "Soil Health Card portal (Government of India)", "Soil test results (pH, organic carbon, nutrients) summarised by region", "District / block; periodic", "Portal reports"],
], [400, 2400, 3000, 1700, 1806], { size: 16 }));
c.push(spacer());
c.push(H2("3.2 Strengths, limitations and best use"));
c.push(table(["Source", "Strengths", "Limitations", "Best used for"], [
  ["Agmarknet", "Direct price signal; long history; many markets", "Missing days, spelling variants, modal price only is a summary", "Price trend, seasonality, volatility"],
  ["data.gov.in", "Official; free; machine-readable", "District splits and renamed districts; publication lag", "Yield and production backbone"],
  ["IMD", "Authoritative Indian weather record", "Gridded files need spatial aggregation; access steps", "Rainfall and temperature drivers"],
  ["NASA POWER", "Simple API; consistent global coverage", "Modelled (not station) values; coarse grid", "Gap-filling and point-level weather"],
  ["ICRISAT", "Rich input and irrigation variables", "Annual only; coverage ends in some years", "Farm-practice context and benchmarks"],
  ["FAOSTAT", "Cross-country comparability", "National level only", "Benchmarking and context"],
  ["World Bank", "Clean monthly series", "Global prices, not local farm-gate", "Fertiliser cost and global price pressure"],
  ["Soil Health Card", "Soil-specific nutrient data", "Aggregation level limits use at farm level", "Fertiliser advice and soil analysis"],
], [1500, 2600, 2700, 2506], { size: 16 }));
c.push(spacer());
c.push(H2("3.3 How the sources combine"));
c.push(callout("Integration design", [
  "**Spine:** district + crop + season + year production table (data.gov.in, ICRISAT).",
  "**Weather join:** district + month or season (IMD, NASA POWER).",
  "**Price join:** commodity + market + date from Agmarknet, aggregated to district-season.",
  "**Context join:** soil (Soil Health Card), fertiliser price (World Bank) and national benchmarks (FAOSTAT).",
  "The result is one analysis table at farm-season or district-season grain; this is what the simulated dataset in Weeks 2 to 4 imitates."]));
c.push(spacer());

// 4 ---------------------------------------------------------------
c.push(H1("4. Review of Key Data Types"));
c.push(table(["Data type", "Typical variables and units", "Usual grain", "Common quality issues", "Metrics that can be derived"], [
  ["Crop yields and production", "Area (ha), production (t), yield (t/ha or kg/ha), sowing and harvest dates", "Farm, district; season", "Unit mix (kg vs t, quintal vs t), revised figures, missing years", "Yield index, production volume, year-on-year change, yield gap"],
  ["Weather patterns", "Rainfall (mm), temperature (C), humidity, solar radiation, dry-spell days", "Station / grid; daily", "Sensor faults, missing days, spatial mismatch with farm location", "Seasonal rainfall, rainfall anomaly, growing degree days, heat-stress days"],
  ["Market prices", "Modal / min / max price (INR per quintal), arrivals (tonnes)", "Market; daily", "Gaps on market holidays, name variants, outlier quotes", "Monthly average, seasonal index, volatility (CV), price spread"],
  ["Supply-chain metrics", "Transport cost, distance, storage capacity, loss %, lead time, margin by intermediary", "Route, lot, market", "Rarely published; often self-reported; inconsistent definitions", "Net price, transport share of price, loss rate, on-time delivery, cost per tonne-km"],
  ["Soil and inputs", "Soil pH, organic carbon, N-P-K levels; fertiliser kg/ha and price", "Farm or block; periodic", "Sampling bias, lab differences, old test dates", "Nutrient balance, input cost per hectare, return per rupee of input"],
  ["Farm practice", "Irrigation type, seed variety, crop mix, farm size", "Farm; seasonal", "Free-text labels, spelling variants", "Share of irrigated area, adoption rate, productivity by practice"],
], [1400, 2400, 1200, 2200, 2106], { size: 16 }));
c.push(spacer());
c.push(P("Two cautions apply to all data types. First, **granularity must be reconciled** before joining: daily prices and annual yields cannot be compared until aggregated to a common period. Second, **definitions differ between sources**: a 'season' or 'district' in one dataset may not match another, which is why a master lookup table is part of the plan."));

// 5 ---------------------------------------------------------------
c.push(H1("5. Using Data for Decision-Making in Agribusiness"));
c.push(table(["Business decision", "Data used", "Analysis", "How the decision improves"], [
  ["How much to procure and when", "Yield history, rainfall, area sown", "Yield forecasting from weather and practices", "Fewer shortfalls and fewer distress purchases"],
  ["When to sell or store", "Price history, arrivals, storage cost", "Seasonality and trend analysis; break-even storage", "Higher realised price; lower waste"],
  ["Which farms to support", "Yield by irrigation, soil, district", "Segmentation and gap analysis", "Support goes where the return is highest"],
  ["Fertiliser and input advice", "Soil tests, fertiliser use, yield response, input prices", "Regression of yield on inputs; return per rupee", "Higher yield per rupee; less waste"],
  ["Logistics and route planning", "Transport cost, distance, volumes", "Cost-to-serve by route; net price", "Lower cost per tonne; better farmer net price"],
  ["Contracts and risk management", "Price volatility, yield variability", "Volatility metrics; scenario analysis", "Contracts and insurance sized to actual risk"],
  ["Crop-mix advice", "Revenue and cost per hectare by crop", "Margin and risk comparison", "More stable farmer income"],
], [2000, 2300, 2500, 2506], { size: 17 }));
c.push(spacer());

// 6 ---------------------------------------------------------------
c.push(H1("6. Planned Analysis Functions: Data, Metrics and Business Impact"));
c.push(P("Each analysis function below will be used in the later weeks. The table links the function to the data it needs, the metrics it produces and the business impact it supports."));
c.push(table(["Analysis function", "Data types", "Key metrics", "Business impact", "Week"], [
  ["Data profiling and quality scoring", "All fields", "Completeness, validity, uniqueness, consistency (%)", "Trust in every later number; lower rework", "2"],
  ["Cleaning and transformation", "All fields", "Rows removed, values corrected, missingness after cleaning", "Analysis-ready dataset with audit trail", "2"],
  ["Descriptive statistics and distributions", "Yield, weather, price, inputs", "Mean, median, SD, CV, skewness, kurtosis", "Understanding typical values and variability", "3"],
  ["Correlation and relationship analysis", "Yield vs weather, inputs, practices", "Pearson / Spearman r, group means", "Identifies which factors matter most", "3"],
  ["Trend and seasonality analysis", "Prices, yield, rainfall over time", "Annual growth %, seasonal index, volatility", "Timing of sales and storage", "3"],
  ["Spatial and segment comparison", "District, crop, irrigation", "Yield index, production share, gap to best", "Targeting of advisory and investment", "3"],
  ["Hypothesis testing", "Yield, price by group", "p-values, effect size, confidence intervals", "Separates real differences from noise", "4"],
  ["Regression and predictive modelling", "Yield and drivers", "R-squared, MAE, RMSE, coefficients", "Early yield estimate; quantified effects", "4"],
  ["Scenario and financial analysis", "Model outputs, prices", "Revenue gain per hectare, payback", "Investment decisions", "5"],
  ["KPI dashboards and reporting", "All derived metrics", "KPI values versus targets", "Monitoring and accountability", "5"],
], [2200, 1800, 2300, 2300, 706], { size: 16 }));
c.push(spacer());

// 7 ---------------------------------------------------------------
c.push(H1("7. How the Approaches Address Common Agribusiness Challenges"));
c.push(table(["Challenge", "Planned approach", "Expected result"], [
  ["Yield variability from climate", "Combine weather series with yield data; regression and early-season forecasting", "Procurement ranges (low / base / high) before harvest"],
  ["Price volatility", "Seasonal index, volatility metrics and trend analysis of Agmarknet prices", "Better timing of sales; informed contract design"],
  ["Fragmented supply chain", "Net-price and transport-share analysis by district and crop", "Visible cost-to-serve and routes to improve"],
  ["Rising input costs", "Yield-response analysis for fertiliser and irrigation; return per rupee", "Targeted input advice instead of blanket increases"],
  ["Unequal water access", "Group comparison (ANOVA) of yield by irrigation type", "Evidence for irrigation support to rainfed farms"],
  ["Post-harvest loss", "Define loss metrics now; collect lot-level data in later phases", "Baseline for storage and cold-chain decisions"],
  ["Poor data quality", "Validation rules, cleaning log, quality scorecard and continuous monitoring", "Data that decision makers can trust"],
], [2300, 4200, 2806], { size: 17 }));
c.push(spacer());

// 8 ---------------------------------------------------------------
c.push(H1("8. Strategic Plan for Data Exploration and Analysis"));
c.push(H2("8.1 Approach in phases"));
c.push(table(["Phase", "Focus", "Main activities", "Output"], [
  ["1. Landscape and plan (this week)", "Understand what data exist", "Research sources; review data types; define functions, KPIs and risks", "This document"],
  ["2. Cleaning and preparation (Week 2)", "Make data reliable", "Assume an aggregated raw file from several sources; profile; remove duplicates; fix formats and units; handle missing values and outliers; normalise", "Clean dataset; cleaning log; quality scorecard"],
  ["3. Exploratory analysis (Week 3)", "Find patterns and anomalies", "Summary statistics; distributions; correlation; trends; seasonal and district comparisons; visual aids", "EDA report; chart set"],
  ["4. Statistical and predictive analysis (Week 4)", "Test and predict", "Hypotheses and tests; regression; assumption checks; validation; limitations", "Model and inference report"],
  ["5. Business insight and reporting (Week 5)", "Turn analysis into action", "Link findings to challenges; recommendations with benefits and pitfalls; roadmap; further research", "Strategic business report"],
], [2100, 1700, 3700, 1806], { size: 16 }));
c.push(spacer());
c.push(H2("8.2 Working principles"));
c.push(B("**Reproducible:** all steps are scripted (Python) and versioned in a project repository; raw data are never edited."));
c.push(B("**Documented:** every cleaning decision is logged with the rule, the rows affected and the reason."));
c.push(B("**Question-led:** every chart or model answers a business question listed in Section 2."));
c.push(B("**Honest about uncertainty:** report intervals and limits, and test on held-out data."));
c.push(H2("8.3 Tools"));
c.push(P("Python (pandas, NumPy, SciPy, statsmodels, scikit-learn, matplotlib) for analysis; Git/GitHub for version control; Excel for quick inspection; Word for reporting."));

// 9 ---------------------------------------------------------------
c.push(H1("9. Key Performance Indicators and Metrics"));
c.push(P("Metrics are grouped so that progress can be tracked both for the **business** and for the **analytics work** itself."));
c.push(H2("9.1 Business KPIs"));
c.push(table(["Area", "KPI", "Definition", "Direction"], [
  ["Agronomic", "Yield index", "Yield / average yield for the same crop (1.0 = average)", "Higher is better"],
  ["Agronomic", "Yield gap", "Gap between a farm group and the best-performing group, in %", "Lower is better"],
  ["Agronomic", "Irrigated area share", "Irrigated area / total area (%)", "Higher is better"],
  ["Market", "Average realised price", "Average farm-gate price, INR per quintal", "Higher is better"],
  ["Market", "Price volatility", "Coefficient of variation of price (%)", "Lower is better"],
  ["Market", "Seasonal price premium", "Rabi price index minus Kharif price index", "Used for timing"],
  ["Supply chain", "Transport share of price", "Transport cost / farm-gate price (%)", "Lower is better"],
  ["Supply chain", "Net price", "Farm-gate price minus transport cost", "Higher is better"],
  ["Supply chain", "Post-harvest loss rate", "Quantity lost / quantity handled (%)", "Lower is better"],
  ["Financial", "Revenue per hectare", "Yield x price x 10 (INR per ha)", "Higher is better"],
  ["Financial", "Return per rupee of fertiliser", "Extra revenue / fertiliser cost", "Higher is better"],
], [1300, 2300, 4000, 1706], { size: 16 }));
c.push(spacer());
c.push(H2("9.2 Analytics and data-quality KPIs"));
c.push(table(["KPI", "Definition", "Target"], [
  ["Completeness", "Share of non-missing cells in key fields", "At least 98% after cleaning"],
  ["Validity", "Share of values inside agreed ranges", "100% after cleaning"],
  ["Uniqueness", "Share of records that are not duplicates", "100%"],
  ["Consistency", "Distinct category labels versus master list", "Exactly one label per category"],
  ["Model accuracy", "R-squared and MAE on held-out data", "Beat the mean baseline; MAE below 0.10 yield-index points"],
  ["Reproducibility", "Pipeline runs end to end from raw data", "Yes, with one command"],
], [2300, 4500, 2506], { size: 17 }));
c.push(spacer());

// 10 ---------------------------------------------------------------
c.push(H1("10. Timeline, Risks and Governance"));
c.push(...img("w1_gantt.png", 560, "Figure 1: Five-week project timeline with weekly milestones (M1 to M5)."));
c.push(H2("10.1 Preliminary risk assessment"));
c.push(table(["Risk", "L", "I", "Mitigation"], [
  ["Portal changes, downtime or access limits", "M", "H", "Keep raw snapshots; use NASA POWER or FAOSTAT as fallback; buffer days"],
  ["Geography mismatches (district renamed or split)", "H", "M", "Master district lookup; map all variants"],
  ["Sparse or missing data for some crops and years", "H", "M", "Minimum coverage rule; documented imputation"],
  ["Unit and format inconsistencies", "H", "L", "Automated parsing and unit tests"],
  ["Mislabelled records not caught by range checks", "M", "M", "Cross-field plausibility rules; residual diagnostics after modelling"],
  ["Licensing or terms-of-use limits on scraping", "L", "H", "Prefer official downloads and APIs; cite sources"],
  ["Model over-fitting on small samples", "M", "M", "Train/test split, cross-validation, simple models first"],
  ["Scope creep or schedule slip", "M", "M", "Fixed scope and weekly milestone review"],
], [3500, 400, 400, 5006], { size: 17 }));
c.push(spacer());
c.push(H2("10.2 Ethics, licensing and governance"));
c.push(B("Record each dataset's licence and cite the publisher (for example, the Government Open Data License - India for data.gov.in)."));
c.push(B("Respect robots.txt, rate limits and terms of use; prefer official downloads and APIs."));
c.push(B("Use aggregate public data; remove personal identifiers if farm-level records are ever obtained."));
c.push(B("State clearly who and what the data do not represent."));

// 11 ---------------------------------------------------------------
c.push(H1("11. Conclusion"));
c.push(P("Agribusiness has a rich public data landscape, but the data are scattered across publishers with different grains, units and definitions. This report mapped eight public sources, reviewed the four main data types plus soil and practice data, and connected each to concrete decisions on procurement, selling, input advice, logistics and risk. It defined ten analysis functions with metrics and business impact, a phased plan for Weeks 2 to 5, a KPI framework for both the business and the analytics work, and a risk register. This plan is the foundation for the cleaning, exploration, modelling and reporting that follow."));

c.push(H2("References and Source Portals"));
["Agmarknet - Agricultural Marketing Information Network, Government of India (agmarknet.gov.in)",
 "Open Government Data Platform India (data.gov.in)",
 "India Meteorological Department data supply portal (mausam.imd.gov.in / imdpune.gov.in)",
 "NASA POWER - Prediction Of Worldwide Energy Resources (power.larc.nasa.gov)",
 "ICRISAT District Level Database (data.icrisat.org/dld)",
 "FAOSTAT - Food and Agriculture Organization of the United Nations (fao.org/faostat)",
 "World Bank Commodity Markets - Pink Sheet (worldbank.org/en/research/commodity-markets)",
 "Soil Health Card portal, Government of India (soilhealth.dac.gov.in)"].forEach((t) => c.push(B(t)));

build("Week1_Agribusiness_Data_Landscape_Exploration_and_Planning.docx", "Week 1: Agribusiness Data Landscape Exploration and Planning", c);
