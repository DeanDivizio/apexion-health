## `preacherCurl` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (biceps 0.85 + forearms 0.15)

- **Code pointer**: `preacherCurl.baseTargets`
- **Rationale**: The preacher bench locks the upper arm against the pad, eliminating shoulder flexion and momentum. This isolates elbow flexion more than a standing curl, increasing relative biceps brachii demand and reducing brachioradialis compensation. The distal elbow flexors (short head of biceps) are preferentially loaded due to the shoulder-forward position.
- **Sources**
  - Preacher curl produces greater distal elbow flexor hypertrophy vs incline curl (regional growth differences): `https://pubmed.ncbi.nlm.nih.gov/39809454/`
  - Preacher curl biceps activation is maximal near full extension; standing/incline curls show higher activation across full ROM (Oliveira et al. 2009): `https://pmc.ncbi.nlm.nih.gov/articles/PMC3737788/`
  - Curl variant EMG comparison (BB + BR activation across bar/dumbbell types): `https://pmc.ncbi.nlm.nih.gov/articles/PMC6047503/`
- **Confidence**: Medium for "higher biceps isolation than standing curl"; Low for exact 0.85/0.15 split. The +0.05 biceps / -0.05 forearms shift relative to `bicepCurl` (0.80/0.20) is consistent with the `support: inclineBenchSupported` delta already encoded on bicep curl.

### Grip (pronated/neutral vs supinated)

- **Code pointer**: `preacherCurl.variationEffects.grip`
- **What it supports**: Pronated/neutral grips shift demand toward brachioradialis and away from biceps brachii. Effect direction and magnitude match the standing bicep curl — grip biomechanics are independent of upper-arm fixation.
- **Sources**
  - `https://pmc.ncbi.nlm.nih.gov/articles/PMC6047503/`
  - `https://pubmed.ncbi.nlm.nih.gov/36976950/`
- **Confidence**: Medium for direction; Low for exact magnitudes.

### Resistance source / cadence / pause

- **Code pointers**: `preacherCurl.variationEffects.resistanceSource`, `.cadence`, `.pause`
- **Notes**: Tracked for logging; effects are neutral due to limited generalizable evidence. Cable vs free-weight preacher curls showed similar hypertrophy outcomes (Pedrosa et al. 2023).
- **Sources**
  - Cable vs barbell preacher curl hypertrophy comparison: `https://pubmed.ncbi.nlm.nih.gov/32823490/`
- **Confidence**: Low.

