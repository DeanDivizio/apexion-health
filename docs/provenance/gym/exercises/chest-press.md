## `chestPress` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (chest + triceps + anterior deltoid)

- **Code pointer**: `chestPress.baseTargets`
- **Rationale**: Horizontal pressing primarily targets pectoralis major with triceps and anterior deltoid as major synergists. Machine/fixed-path presses often reduce stabilization demands vs free weights.
- **Sources**
  - Stability requirement comparison across chest press variants: `https://pubmed.ncbi.nlm.nih.gov/21225489/`
  - Free-weight vs machine bench press EMG (classic): `https://journals.lww.com/nsca-jscr/abstract/1994/11000/a_comparison_of_muscle_activity_between_a_free.11.aspx`
- **Confidence**: High for prime movers; Low for exact region split (`chestUpper`/`chestMid`/`chestLower`).

### Grip width

- **Code pointer**: `chestPress.variationEffects.width`
- **Notes**: Direction is generally similar to bench press (narrower tends to increase elbow extensor demand), but machine path/handle style changes details. We keep deltas conservative.
- **Confidence**: Medium for direction; Low for magnitude.

### Plane angle

- **Code pointer**: `chestPress.variationEffects.planeAngle`
- **Notes**: Evidence is stronger for pressing angle effects in bench press than in every machine press; we mirror the bench-press direction conservatively.
- **Confidence**: Medium for direction; Low for magnitude.

### Resistance source / cadence / pause

- **Code pointers**: `chestPress.variationEffects.resistanceSource`, `.cadence`, `.pause`
- **Notes**: We track these for logging but don’t encode systematic muscle-weight redistribution due to limited generalizable evidence.
- **Confidence**: Low.

