## `bayesianCurl` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (biceps 0.85 + forearms 0.15)

- **Code pointer**: `bayesianCurl.baseTargets`
- **Rationale**: The Bayesian curl (popularized by Menno Henselmans) is performed facing away from a cable machine with the arm behind the body in shoulder extension. This elongates the biceps long head at the start of the movement, applying peak tension in the lengthened position. The movement is a strict elbow flexion pattern with minimal brachioradialis compensation due to the supinated grip and behind-body arm position.
- **Sources**
  - EMG comparison of dumbbell curl vs Bayesian cable curl (Bayesian curl: 93.39 ± 15.65% MVC vs dumbbell: 111.46 ± 26.80% MVC; p=0.003, d=0.82): `https://pmc.ncbi.nlm.nih.gov/articles/PMC12550948/`
  - Same study published in MDPI Muscles journal: `https://www.mdpi.com/2813-0413/4/4/45`
- **Confidence**: Medium for direction (biceps-dominant isolation); Low for exact 0.85/0.15 split. The split matches `preacherCurl` (0.85/0.15) — both are isolation curls with fixed upper-arm position that reduce brachioradialis compensation relative to standing curls. The Bayesian curl's lower overall EMG amplitude vs dumbbell curl is attributed to the lengthened starting position (length–tension relationship) and increased stabilizer demands, not reduced biceps targeting.

### Long head emphasis

- **Notes**: The behind-body arm position (shoulder extension) stretches the biceps long head across the shoulder joint. Growing evidence suggests lengthened-position loading may be especially effective for hypertrophy. We currently track biceps as a single muscle group, so no head-specific delta is applied.
- **Sources**
  - Length–tension relationship discussion: `https://pmc.ncbi.nlm.nih.gov/articles/PMC12550948/` (Discussion section)
  - General lengthened partial training review: `https://pubmed.ncbi.nlm.nih.gov/37903146/`
- **Confidence**: Low for quantitative long-head bias.

### Cadence / pause

- **Code pointers**: `bayesianCurl.variationEffects.cadence`, `.pause`
- **Notes**: Tracked for logging; effects are neutral due to limited exercise-specific evidence. Slow eccentrics are commonly recommended for this exercise to maximize time under tension in the stretched position.
- **Confidence**: Low.
