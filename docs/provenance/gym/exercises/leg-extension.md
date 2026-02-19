## `legExtension` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (quadriceps)

- **Code pointer**: `legExtension.baseTargets`
- **Rationale**: Knee extension is primarily quadriceps (rectus femoris + vasti). We track this as `quads`.
- **Confidence**: High.

### Foot angle / rotation

- **Code pointer**: `legExtension.variationEffects.footAngle`
- **What it supports**: Foot/hip rotation can shift relative activation between quadriceps portions (e.g., rectus femoris vs vasti). Since we don’t track quad heads separately, we keep effects neutral.
- **Sources**
  - Foot position impacts superficial quadriceps EMG during leg extension: `https://pubmed.ncbi.nlm.nih.gov/16437818/`
- **Confidence**: Medium for “head-specific shifts exist”; Low for mapping to our coarse `quads` bucket.

### Cadence / pause

- **Code pointers**: `legExtension.variationEffects.cadence`, `.pause`
- **Notes**: Tracked for logging; effects remain neutral.
- **Confidence**: Low.

