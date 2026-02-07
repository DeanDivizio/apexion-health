## `pecFly` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (pectoralis major)

- **Code pointer**: `pecFly.baseTargets`
- **Rationale**: Fly variations are primarily horizontal adduction of the shoulder with pectoralis major as the prime mover; anterior deltoid contribution depends on arm path and angle.
- **Sources**
  - Bench press vs dumbbell fly EMG comparison: `https://ncbi.nlm.nih.gov/pmc/articles/PMC7675616/`
  - Pectoralis major + anterior deltoid EMG during upper-body lifts: `https://pubmed.ncbi.nlm.nih.gov/15903389/`
- **Confidence**: High for pec primary; Low for regional (upper/mid/lower) split.

### Angle (incline/decline style)

- **Code pointer**: `pecFly.variationEffects.planeAngle`
- **Notes**: Angle-based “upper vs lower chest” effects are clearer in pressing than in flyes; we keep deltas conservative and treat them as bias signals, not literal activation percentages.
- **Confidence**: Low-to-Medium.

### Body position / resistance source / cadence / pause

- **Code pointers**: `pecFly.variationEffects.bodyPosition`, `.resistanceSource`, `.cadence`, `.pause`
- **Notes**: Evidence is highly equipment- and technique-dependent; defaults are neutral or conservative.
- **Confidence**: Low.

