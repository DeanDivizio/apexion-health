## `hammerCurl` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (elbow flexors with brachioradialis emphasis)

- **Code pointer**: `hammerCurl.baseTargets`
- **Rationale**: Neutral-grip curling tends to increase brachioradialis/brachialis contribution relative to supinated curls, so we model more `forearms` contribution than a standard curl.
- **Sources**
  - Curl handgrip EMG (biceps + brachioradialis): `https://ncbi.nlm.nih.gov/pmc/articles/PMC6047503/`
  - Handgrip synergy paper: `https://pubmed.ncbi.nlm.nih.gov/36976950/`
- **Confidence**: Medium.

### Body position / resistance source / cadence / pause

- **Code pointers**: `hammerCurl.variationEffects.bodyPosition`, `.resistanceSource`, `.cadence`, `.pause`
- **Notes**: Technique and implement (DB vs cable) drive most differences; defaults are conservative.
- **Confidence**: Low.

