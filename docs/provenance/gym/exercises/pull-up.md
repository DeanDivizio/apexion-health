## `pullUp` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (lats + elbow flexors + upper back)

- **Code pointer**: `pullUp.baseTargets`
- **Rationale**: Pull-ups/chin-ups are vertical pulls emphasizing lats with elbow flexors and scapular musculature assisting.
- **Sources**
  - Grip width + hand orientation analysis (review/article): `https://journals.lww.com/nsca-scj/fulltext/2013/02000/the_effect_of_grip_width_and_hand_orientation_on.12.aspx`
- **Confidence**: Medium.

### Grip orientation → biceps involvement (more reliable than width)

- **Code pointer**: `pullUp` → `variationEffects.grip`
- **What it supports**: supinated/neutral grips tend to increase **biceps** involvement vs pronated, relative to lats/upper back (protocol-dependent).
- **Sources**
  - `https://journals.lww.com/nsca-scj/fulltext/2013/02000/the_effect_of_grip_width_and_hand_orientation_on.12.aspx`
- **Confidence**: Medium.

### Grip width effects are modest

- **Code pointer**: `pullUp` → `variationEffects.width`
- **What it supports**: width-based shifts are generally smaller/less consistent than orientation-based shifts.
- **Sources**
  - `https://journals.lww.com/nsca-scj/fulltext/2013/02000/the_effect_of_grip_width_and_hand_orientation_on.12.aspx`
- **Confidence**: Low–Medium.

### Cadence / pause

- **Code pointers**: `pullUp.variationEffects.cadence`, `.pause`
- **Notes**: We track tempo/pause for logging; we don’t encode muscle redistribution because evidence is highly protocol- and individual-dependent.
- **Confidence**: Low.

