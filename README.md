# W.A.S.P. — Wastewater Analysis & Supervised Prediction

An interactive web dashboard and real-time soft-sensor analyzer for **W.A.S.P. (Wastewater Analysis & Supervised Prediction)**, developed at the Department of Computer Science and Engineering, SRM Institute of Science and Technology, Tiruchirappalli.

## Overview

Conventional Sewage Treatment Plants (STPs) and Common Effluent Treatment Plants (CETPs) rely on 5-day Biochemical Oxygen Demand ($\text{BOD}_5$), which requires 120 hours of wet-laboratory incubation at 20 °C. **W.A.S.P.** eliminates this bottleneck with an instant browser-based prediction engine and project showcase calibrated to a 600-record CPCB-monitored multi-plant dataset across five Indian STP/CETP corridors.

## Features

* **Interactive Water Quality Analyzer (`#predict`)**
  * Dual numeric + range-slider telemetry inputs for 8 online parameters (`DO`, `COD`, `pH`, `Turbidity`, `TSS`, `NH₃-N`, `Conductivity`, `Temperature`) with live auto-prediction.
  * Station presets for **Tiruchirappalli (Panchapur STP)**, **Chennai (Nesapakkam STP)**, **Hyderabad (Amberpet STP)**, **Bengaluru (Bellandur STP)**, and **Vellore (Ranipet Tannery CETP)**, plus quick test scenarios (*Clean*, *Polluted*, *Critical*, *Shock Event*).
  * Instant $\text{BOD}_5$ soft-sensor prediction, **CPCB 3-Tier Classification** (*Acceptable*, *Polluted*, *Highly Polluted*), **EPLI Index**, **Mahalanobis $D^2$** shock anomaly detection ($D^2 \ge 22.0$), **$\text{COD}/\text{BOD}_5$** biodegradability ratio, **Tertiary Treatment Impact** simulation (MBBR + PAC-UF + Ozonation), and an **Automated Process-Control Matrix** with one-click report export.
* **Project Documentation & Benchmarks**
  * Model comparison across OLS, Ridge Regression, Gradient Boosting, and Random Forest ($R^2 = 0.9918$, $\text{RMSE} = 2.84\text{ mg/L}$, $\text{MAE} = 2.01\text{ mg/L}$).
  * Feature attribution breakdown ($\text{COD}$ 27.88%, $\text{DO}$ 20.72%, $\text{Turbidity}$ 13.42%, $\text{Conductivity}$ 11.20%, $\text{NH}_3\text{-N}$ 10.99%).

## Project Structure

```text
W.A.S.P/
├── index.html   # Single-page website & interactive prediction engine
├── styles.css   # Navy blue, white, and hot pink UI design system
├── script.js    # Soft-sensor approximation, CPCB classifier & UI interactivity
└── README.md    # Project documentation
```

## Run Locally

Open `index.html` directly in any modern web browser—no build step or external server dependencies required.

## Team

* **B. Sai Chethan** (`RA2411026050043`)
* **B. Sai Nikhil** (`RA2411026050036`)
* **G. Kalyan** (`RA2411026050027`)

Guided by **Dr. B. Ujjwala**, Assistant Professor, School of Computing, SRMIST Tiruchirappalli.
