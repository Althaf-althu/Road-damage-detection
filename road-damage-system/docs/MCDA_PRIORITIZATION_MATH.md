# Multi-Criteria Decision Analysis (MCDA) Prioritization Formulation

## 1. Master Formula

The Priority Score is a deterministic score ranging from **0.0 to 100.0** calculated for each road distress report:

$$\text{Priority Score} = 100 \times \left( 0.40 \cdot S_{\text{norm}} + 0.25 \cdot T_{\text{norm}} + 0.20 \cdot R_{\text{norm}} + 0.15 \cdot Z_{\text{norm}} \right)$$

Where:
- $S_{\text{norm}}$: Normalized Visual Distress Severity ($[0.0, 1.0]$)
- $T_{\text{norm}}$: Normalized Traffic Exposure Factor ($[0.0, 1.0]$)
- $R_{\text{norm}}$: Normalized Road Network Hierarchy ($[0.0, 1.0]$)
- $Z_{\text{norm}}$: Sensitive Zone & Safety Risk Multiplier ($0.0 \text{ or } 1.0$)

---

## 2. Parameter Definitions & Normalization Scales

### A. Defect Severity ($S_{\text{norm}}$) — Weight: 40%
A composite indicator factoring surface area ($m^2$), estimated depth ($cm$), and civil defect taxonomy weights:

$$S_{\text{raw}} = w_{\text{type}} \times \left( 0.6 \cdot \min\left(\frac{\text{area}}{5.0}, 1.0\right) + 0.4 \cdot \min\left(\frac{\text{depth}}{15.0}, 1.0\right) \right)$$

Defect Taxonomy Weights ($w_{\text{type}}$):
- **Pothole**: $1.00$ (Direct vehicle damage, loss of control risk)
- **Rutting**: $0.85$ (Aquaplaning risk during Kerala monsoons)
- **Fatigue Crack (Alligator)**: $0.70$ (Subgrade structural failure precursor)
- **Transverse Crack**: $0.50$ (Thermal/shrinkage cracking)

$$S_{\text{norm}} = \min(S_{\text{raw}}, 1.0)$$

---

### B. Traffic Exposure ($T_{\text{norm}}$) — Weight: 25%
Derived from Average Daily Traffic (ADT) volume:

$$T_{\text{norm}} = \min\left(\frac{\text{ADT}}{15000}, 1.0\right)$$

- ADT $\ge 15,000$ (High-density NH/SH trunk): $T_{\text{norm}} = 1.00$
- ADT $\approx 8,000$ (Major District Road): $T_{\text{norm}} = 0.53$
- ADT $\le 1,500$ (Village / Residential): $T_{\text{norm}} \le 0.10$

---

### C. Road Classification Hierarchy ($R_{\text{norm}}$) — Weight: 20%
Calibrated to Indian Roads Congress (IRC) road classifications:

| OSM Highway Class | Kerala Designation | $R_{\text{norm}}$ |
|---|---|---|
| `motorway` | National Expressway / NH 66 Corridor | **1.00** |
| `trunk` | National Highway (NH) | **0.85** |
| `primary` | State Highway (SH) | **0.70** |
| `secondary` | Major District Road (MDR) | **0.55** |
| `tertiary` | Other District Road (ODR) | **0.40** |
| `residential` | Municipal / Ward Road | **0.25** |
| `unclassified` / `service` | Rural / Access Road | **0.15** |

---

### D. Sensitive Zone Multiplier ($Z_{\text{norm}}$) — Weight: 15%
Flagged when a road corridor traverses:
- School zones or hospital approaches
- Western Ghats hairpin bends with gradient $> 7\%$
- Historically flood-prone coastal/backwater road sections (e.g. Kuttanad)

$$Z_{\text{norm}} = \begin{cases} 1.0 & \text{if } \text{is\_sensitive\_zone} = \text{TRUE} \\ 0.0 & \text{otherwise} \end{cases}$$

---

## 3. Prioritization Thresholds & Dispatch Tiers

| Score Range | Priority Tier | Operational Action | Map Polyline Halo |
|---|---|---|---|
| **$\ge 75.0$** | 🔴 **CRITICAL / URGENT** | 24-hour mandatory crew dispatch | Glowing Crimson Red |
| **$50.0 \le \text{Score} < 75.0$** | 🟡 **MODERATE** | Routine weekly patch cycle | Amber Yellow |
| **$< 50.0$** | 🟢 **ROUTINE** | Scheduled annual resurfacing | Emerald Green |

