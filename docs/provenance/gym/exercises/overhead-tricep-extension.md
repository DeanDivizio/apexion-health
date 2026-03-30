## `overheadTricepExtension` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (triceps 0.95 + forearms 0.05)

- **Code pointer**: `overheadTricepExtension.baseTargets`
- **Rationale**: Overhead elbow-extension training is a triceps-dominant pattern, with evidence of greater overall triceps hypertrophy versus neutral-arm elbow-extension patterns. The long head is likely a major driver due to shoulder position, but our model tracks `triceps` as one muscle group (not per-head), so this is represented as a high triceps share plus a small forearm stabilization component.
- **Sources**
  - Overhead vs neutral arm-position elbow extension (greater triceps hypertrophy in overhead condition): `https://pubmed.ncbi.nlm.nih.gov/35819335/`
  - Full publication (European Journal of Sport Science): `https://doi.org/10.1080/17461391.2022.2100279`
  - Triceps-head functional differences by shoulder elevation (mechanistic context): `https://pmc.ncbi.nlm.nih.gov/articles/PMC6136322/`
- **Confidence**: High for triceps primary; Medium for overhead-specific advantage; Low for exact 0.95/0.05 split.

### Body position / resistance source / grip / cadence / pause

- **Code pointers**: `overheadTricepExtension.variationEffects.bodyPosition`, `.resistanceSource`, `.grip`, `.cadence`, `.pause`
- **Notes**: We currently keep these neutral/conservative because evidence is strongest for arm-position effects and triceps-head behavior, while robust option-level redistribution values (for our current variation dimensions) remain limited.
- **Confidence**: Low.

