## `gluteBridge` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (glutes + hamstrings)

- **Code pointer**: `gluteBridge.baseTargets`
- **Rationale**: Glute bridges and hip thrusts are hip extension patterns emphasizing gluteus maximus, with hamstring contribution influenced by knee angle/foot placement.
- **Sources**
  - Hip thrust systematic review (includes technique/position discussion): `https://ncbi.nlm.nih.gov/pmc/articles/PMC6544005/`
- **Confidence**: Medium for glute emphasis; Low for exact split and for mapping bridge vs thrust differences.

### Knee angle / foot angle / stance width

- **Code pointers**: `gluteBridge.variationEffects.kneeAngle`, `.footAngle`, `.width`
- **Notes**: Knee angle is a reasonable proxy for hamstrings vs glutes bias via moment-arm and length-tension considerations; exact magnitudes remain uncertain so deltas are conservative.
- **Confidence**: Medium for direction; Low for magnitude.

### Resistance source / cadence / pause

- **Code pointers**: `gluteBridge.variationEffects.resistanceSource`, `.cadence`, `.pause`
- **Notes**: Tracked for logging; neutral for targeting.
- **Confidence**: Low.

