## `benchPress` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (pec regions + anterior deltoid + triceps)

- **Code pointer**: `benchPress.baseTargets`
- **Rationale**: Horizontal pressing primarily targets pectoralis major, with anterior deltoid and triceps as major synergists.
- **Sources**
  - Bench press inclination EMG (pec/anterior deltoid/triceps): `https://pubmed.ncbi.nlm.nih.gov/33049982/`
  - Bench press angle EMG analysis: `https://journals.lww.com/nsca-jscr/fulltext/2010/07000/an_electromyography_analysis_of_3_muscles.31.aspx`
- **Confidence**: High for prime movers; Low for the exact split across `chestUpper`/`chestMid`/`chestLower`.

### Grip width → triceps vs chest

- **Code pointer**: `benchPress` → `variationEffects.width`
- **What it supports**: narrower/close grip tends to increase **triceps** involvement; wider grip tends to increase **pec** involvement / reduce triceps.
- **Sources**
  - `https://ncbi.nlm.nih.gov/pmc/articles/PMC5504579/`
  - `https://pmc.ncbi.nlm.nih.gov/articles/PMC10203828/`
  - `https://journal.iusca.org/index.php/Journal/article/view/39`
- **Confidence**: Medium (direction is consistent; exact magnitudes vary by protocol/population).

### Incline angle → upper pec + anterior delt

- **Code pointer**: `benchPress` → `variationEffects.planeAngle`
- **What it supports**: increasing incline angle tends to increase **clavicular (upper) pec** and **anterior deltoid** activation; sternocostal/lower pec tends to decrease vs flat.
- **Sources**
  - `https://pubmed.ncbi.nlm.nih.gov/33049982/`
  - `https://journals.lww.com/nsca-jscr/fulltext/2010/07000/an_electromyography_analysis_of_3_muscles.31.aspx`
- **Confidence**: Medium (direction is consistent; exact angle breakpoints vary across studies).

### Other tracked variations (bar type, grip technique, cadence, pause)

- **Code pointers**: `benchPress.variationEffects.barType`, `.gripTechnique`, `.cadence`, `.pause`
- **Notes**: At present we don’t encode muscle-weight redistribution for these because high-quality, generalizable evidence is limited and often context-dependent (load, ROM, lifter skill). Defaults are neutral and documented here to avoid implying evidence that isn’t there.
- **Confidence**: Low.

