## `seatedRow` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (lats + scapular retractors + biceps)

- **Code pointer**: `seatedRow.baseTargets`
- **Rationale**: Horizontal pulling typically targets lats and scapular retractors (rhomboids/mid traps), with biceps as a major synergist.
- **Sources**
  - Lat/back exercise activation variations (classic dataset): `https://pmc.ncbi.nlm.nih.gov/articles/PMC449729/`
  - Grip/shoulder-abduction effects in seated cable row (IUSCA): `https://journal.iusca.org/index.php/Journal/article/view/190`
- **Confidence**: Medium for prime movers; Low for exact weights.

### Width / grip

- **Code pointers**: `seatedRow.variationEffects.width`, `seatedRow.variationEffects.grip`
- **Notes**: Grip and shoulder abduction angle can shift relative demand between elbow flexors and back musculature; supinated/neutral conditions often increase biceps involvement. Deltas are conservative.
- **Sources**
  - `https://journal.iusca.org/index.php/Journal/article/view/190`
- **Confidence**: Medium for direction; Low for magnitude.

### Support

- **Code pointer**: `seatedRow.variationEffects.support`
- **Rationale**: External support can reduce trunk/lower-back stabilization demands and allow higher back muscle focus.
- **Confidence**: Medium for mechanism; Low for numeric deltas.

### Resistance source / attachment / cadence / pause

- **Code pointers**: `seatedRow.variationEffects.resistanceSource`, `.cableAttachment`, `.cadence`, `.pause`
- **Notes**: Tracked for logging; effects are neutral due to limited generalizable evidence.
- **Confidence**: Low.

