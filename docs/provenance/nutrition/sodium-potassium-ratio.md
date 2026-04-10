## Sodium-to-Potassium Ratio (Na:K)

Display location: `components/home/HydrationSummary.tsx` (ring chart in electrolytes section)

### Target value

**3:2 (sodium : potassium)** — based on the stoichiometry of the Na+/K+-ATPase pump.

### Biological basis

The Na+/K+-ATPase (sodium-potassium pump) is a transmembrane enzyme present in all
animal cells. Each transport cycle hydrolyzes one ATP molecule to extrude 3 Na+ ions
from the cell and import 2 K+ ions. This 3:2 stoichiometry is robust across cell types
and membrane potentials, and is fundamental to maintaining the electrochemical gradient
that drives nerve impulses, muscle contraction, nutrient absorption, and cell volume
regulation.

### Color thresholds

| Color  | Deviation from 3:2 | Interpretation                    |
|--------|:------------------:|-----------------------------------|
| Teal   | ≤ 15%              | Near-optimal balance              |
| Amber  | 15–40%             | Moderate imbalance                |
| Gray   | > 40% or no data   | Significant imbalance / no data   |

### Sources

#### Cellular stoichiometry (3 Na+ : 2 K+ per ATP)

- **Peluffo, R.D. (2023)** — "The Na+,K+-ATPase and its stoichiometric ratio: some
  thermodynamic speculations"
  - *Biophysical Reviews*, 15(4):539–552
  - Confirms the 3:2 ratio is independent of membrane potential via voltage-clamp
    measurements in squid giant axons. Demonstrates thermodynamic optimality of 3:2
    over alternative stoichiometries (e.g. 4:3 or 4:2) at physiological resting
    membrane potentials.
  - `https://pmc.ncbi.nlm.nih.gov/articles/PMC10480117/`

- **Bhatt et al. (2022)** — "Structural basis for gating mechanism of the human
  sodium-potassium pump"
  - *Nature Communications*, 13:5293
  - Cryo-EM structures of human α3 Na+/K+-ATPase resolving 3 Na+ binding sites in
    E1 state and 2 K+ sites in E2 state, providing direct structural evidence for the
    3:2 transport stoichiometry.
  - `https://www.nature.com/articles/s41467-022-32990-x`

- **Shinoda et al. (2015)** — "Sequential substitution of K+ bound to Na+,K+-ATPase
  visualized by X-ray crystallography"
  - *Nature Communications*, 6:8004
  - X-ray crystallography visualizing the two K+ binding sites and their sequential
    substitution kinetics in the E2·Pi state.
  - `https://www.nature.com/articles/ncomms9004`

- **Bhatt et al. (2015)** — "Mechanism of potassium ion uptake by the Na+/K+-ATPase"
  - *Nature Communications*, 6:7622
  - Electrophysiological characterization of external K+ binding and occlusion,
    confirming the two-K+ uptake step of the transport cycle.
  - `https://www.nature.com/articles/ncomms8622`

- **Contreras et al. (2024)** — "Na+/K+-ATPase: More than an Electrogenic Pump"
  - *International Journal of Molecular Sciences*, 25(11):6122
  - Comprehensive review of NKA structure, 3:2 stoichiometry, signaling roles, and
    clinical relevance of intracellular Na+/K+ ratio changes on gene transcription.
  - `https://www.mdpi.com/1422-0067/25/11/6122`

#### Dietary Na:K ratio and health outcomes

- **Mosallanezhad et al. (2023)** — "Dietary sodium to potassium ratio is an independent
  predictor of cardiovascular events: a longitudinal follow-up study"
  - *BMC Public Health*, 23:961
  - 10.6-year prospective cohort (n=2,050): higher dietary Na:K ratio associated with
    99% increased CVD risk (HR=1.99, 95% CI 1.13–3.52). Optimal cut-off Na:K ≤ 1.26
    by Youden index.
  - `https://link.springer.com/article/10.1186/s12889-023-15618-7`

- **Okayama et al. (2016)** — "Dietary sodium-to-potassium ratio as a risk factor for
  stroke, cardiovascular disease and all-cause mortality in Japan: the NIPPON DATA80
  cohort study"
  - *BMJ Open*, 6:e011632
  - 24-year follow-up (n=8,283): highest vs. lowest Na:K quintile showed HRs of 1.43
    for stroke, 1.39 for CVD, and 1.16 for all-cause mortality. Relationship was
    non-linear and significant after full adjustment.
  - `https://bmjopen.bmj.com/content/6/7/e011632`

- **Du et al. (2024)** — "Sex-specific associations between sodium and potassium intake
  and overall and cause-specific mortality"
  - *BMC Medicine*, 22:122
  - Large US prospective cohort with meta-analysis (42 risk estimates, 2M+ participants):
    higher Na:K ratio associated with CVD events (pooled RR=1.13, 95% CI 1.06–1.20).
    Women showed stronger Na:K ratio–mortality associations than men.
  - `https://link.springer.com/article/10.1186/s12916-024-03350-x`

- **Yang et al. (2022)** — "Sodium and potassium intake and the ratio with risk of CVD"
  - *Nutrients*, 14(5):1121
  - Prospective cohort of 180,000+ US veterans: Na:K ratio positively associated with
    CVD (HR per SD increment: 1.12 for MI, 1.11 for stroke). The ratio was a stronger
    predictor than sodium or potassium alone.
  - `https://doi.org/10.3390/nu14051121`

### Confidence

Medium-High. The 3:2 stoichiometry of the Na+/K+-ATPase is among the most
well-established facts in cell biology, confirmed by electrophysiology, X-ray
crystallography, cryo-EM, and flux assays across multiple labs and decades. The clinical
evidence for dietary Na:K ratio as a CVD risk factor is strong and consistent across
populations, though the optimal dietary ratio in mg terms depends on absolute intake
levels and individual health status.

### Limitations

- The 3:2 ratio is a cellular pump stoichiometry, not a direct dietary recommendation.
  Dietary intake, absorption, renal excretion, and intracellular concentrations are all
  regulated independently.
- Clinical studies use urinary Na:K or dietary Na:K (by weight), which differ from molar
  ratios. Our display uses mg-based intake, which is an approximation.
- Individual requirements vary with kidney function, medication use, and activity level.
  Users on potassium-sparing diuretics or with CKD should consult their physician.
