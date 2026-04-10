## `shrug` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (trapsUpper 0.80 + trapsMid 0.20)

- **Code pointer**: `shrug.baseTargets`
- **Rationale**: The shoulder shrug is a scapular elevation exercise that primarily loads the upper trapezius. EMG research consistently identifies the shrug as producing the greatest upper trapezius activation among common exercises. The middle trapezius contributes secondarily through isometric scapular stabilization during the movement, but its primary function (scapular retraction) is not the main action in a shrug.
- **Sources**
  - Unilateral shoulder shrug produces greatest upper trap EMG among 10 exercises tested; middle trap activation was significantly lower during shrugs vs horizontal extension exercises (Ekstrom et al. 2003): `https://pubmed.ncbi.nlm.nih.gov/12774999/`
  - 2018 EMG study (Journal of Applied Biomechanics) comparing dumbbell, barbell, and machine shrugs: dumbbell shrugs showed highest upper trap activation due to greater ROM and unilateral control; barbell shrugs showed strong activation but less ROM; machine shrugs lowest.
  - Barbell shrug upper trap activation reported at ~102% MVC in separate EMG analysis, highest among shrug variants.
- **Confidence**: High for upper trap dominance; Medium for 0.80/0.20 split. The minor middle trap allocation (0.20) reflects its isometric stabilization role — Ekstrom et al. confirmed middle trap EMG during shrugs is substantially lower than during retraction-focused exercises.

### Bar type: trap bar delta (trapsUpper +0.05, trapsMid -0.05)

- **Code pointer**: `shrug.variationEffects.barType.trapBar`
- **Rationale**: The trap bar centers the load around the body with a neutral grip, as opposed to a barbell which sits in front of the body. This loading position reduces any forward pull that would engage mid-trap scapular retraction, focusing more on pure scapular elevation (upper trap function). The delta is intentionally small because no direct EMG comparison between trap bar and barbell shrugs exists — the direction is based on biomechanical reasoning.
- **Sources**
  - Biomechanical comparison (no EMG study): trap bar positions load laterally with neutral grip, barbell positions load anteriorly — this changes scapular mechanics: `https://hortonbarbell.com/barbell-shrugs-vs-trap-bar-shrugs/`
  - Both variants activate upper traps strongly with no significant difference for hypertrophy outcomes reported: `https://www.totalhealthtools.com/wp/138/trap-bar-vs-barbell-shrugs-which-builds-more-muscle/`
- **Confidence**: Low for delta magnitude and direction. No EMG data directly supports the +0.05/-0.05 shift. Conservative placeholder pending direct comparison data.

### Grip width: wide/widest → lower trap recruitment

- **Code pointer**: `shrug.variationEffects.width`
- **What it supports**: Wider grip (snatch-grip) positions the arms at ~30° shoulder abduction, adding a component of scapular upward rotation to the pure elevation. This recruits the lower trapezius (an upward rotator) that is minimally active in standard-width shrugs. The delta adds trapsLower at the expense of trapsMid, since the upward rotation demand displaces the retraction contribution.
- **Sources**
  - Pizzari et al. (2014): modified shrug with ~30° abduction significantly increased upper and lower trapezius activation vs standard shrug in both healthy subjects and MDI patients: `https://doi.org/10.1016/j.clinbiomech.2013.11.011`
  - Nick Tumminello applied recommendation (wide-grip / snatch-grip shrug for increased upper trap involvement): `https://www.strengthzonetraining.com/trap-exercises-top-4-shrug-variations/`
- **Confidence**: Medium for direction (lower trap recruitment with abduction); Low for exact delta magnitudes. Upper trap delta is omitted because it's already dominant at 0.80 — any increase is proportionally small and absorbed by normalization.

### Resistance source / cadence / pause

- **Code pointers**: `shrug.variationEffects.resistanceSource`, `.cadence`, `.pause`
- **Notes**: Tracked for logging; effects are neutral except where noted above. Dumbbell shrugs may produce slightly higher activation than barbell due to greater ROM (2018 JAB study), but we encode equipment as resistance source rather than applying muscle-target deltas per source — the effect size is small enough that logging alone is sufficient.
- **Confidence**: Low.

### Notes / gaps

- Levator scapulae contributes to scapular elevation during shrugs but is not in the Apexion muscle group taxonomy.
