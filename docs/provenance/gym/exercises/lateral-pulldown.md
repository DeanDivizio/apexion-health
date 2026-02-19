## `lateralPulldown` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (lats + upper back + elbow flexors)

- **Code pointer**: `lateralPulldown.baseTargets`
- **Rationale**: Vertical pulling primarily targets lats with contribution from scapular retractors/depressors and elbow flexors.
- **Sources**
  - Grip width comparison: `https://pubmed.ncbi.nlm.nih.gov/24662157/`
- **Confidence**: Medium for prime movers; Low for exact split.

### Grip width effects are modest/inconsistent

- **Code pointer**: `lateralPulldown` → `variationEffects.width`
- **What it supports**: across typical grip widths, **lat activation is often similar**; differences tend to be smaller than gym lore suggests.
- **Sources**
  - `https://pubmed.ncbi.nlm.nih.gov/24662157/`
  - `https://journals.lww.com/nsca-jscr/fulltext/2014/04000/Effects_of_Grip_Width_on_Muscle_Strength_and.35.aspx`
- **Confidence**: Medium for “effects are small”; Low for any specific lats↔rhomboids reallocation.

### Grip orientation

- **Code pointer**: `lateralPulldown` → `variationEffects.grip`
- **Notes**: Hand orientation can change elbow flexor involvement in many pulling movements; evidence is more consistent for “orientation matters” than for exact magnitudes in pulldowns. Deltas are conservative.
- **Confidence**: Low-to-Medium.

### Attachment / cadence / pause

- **Code pointers**: `lateralPulldown.variationEffects.cableAttachment`, `.cadence`, `.pause`
- **Notes**: We don’t encode attachment-specific muscle redistribution due to limited high-quality, generalizable evidence. Cadence/pause are tracked for logging but neutral for muscle targeting.
- **Confidence**: Low.

