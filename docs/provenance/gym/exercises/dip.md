## `dip` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (triceps + chest + anterior deltoid)

- **Code pointer**: `dip.baseTargets`
- **Rationale**: Dips are a closed-chain press emphasizing triceps and lower/sternaI pec fibers, with anterior deltoid contribution depending on technique.
- **Sources**
  - Dip variation kinematics + muscle activity: `https://researchportal.scu.edu.au/esploro/fulltext/journalArticle/Bench-Bar-and-Ring-Dips-Do/991013054212502368?repId=12103278600002368&mId=13103278590002368&institution=61SCU_INST`
- **Confidence**: Medium.

### Grip width (proxy for emphasis)

- **Code pointer**: `dip.variationEffects.width`
- **Notes**: The strongest “chest vs triceps” driver is typically torso lean/shoulder angle, which we don’t explicitly track yet. Width deltas are a conservative proxy.
- **Confidence**: Low.

### Resistance source / cadence / pause

- **Code pointers**: `dip.variationEffects.resistanceSource`, `.cadence`, `.pause`
- **Notes**: Tracked for logging; effects are neutral due to limited generalizable evidence.
- **Confidence**: Low.

