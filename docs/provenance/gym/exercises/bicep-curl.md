## `bicepCurl` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (biceps + forearms)

- **Code pointer**: `bicepCurl.baseTargets`
- **Rationale**: Elbow flexion in a curl is primarily biceps brachii with meaningful contribution from brachialis/brachioradialis (tracked here as `forearms`).
- **Sources**
  - Curl variants EMG (biceps brachii + brachioradialis): `https://ncbi.nlm.nih.gov/pmc/articles/PMC6047503/`
  - Handgrip synergy paper (biceps + brachioradialis excitation): `https://pubmed.ncbi.nlm.nih.gov/36976950/`
- **Confidence**: High for “biceps primary, forearms secondary”; Low for exact weight split.

### Grip (pronated/neutral vs supinated)

- **Code pointer**: `bicepCurl.variationEffects.grip`
- **What it supports**: Pronated/neutral grips tend to reduce biceps brachii contribution and increase reliance on brachioradialis/forearm musculature vs supinated.
- **Sources**
  - `https://ncbi.nlm.nih.gov/pmc/articles/PMC6047503/`
  - `https://pubmed.ncbi.nlm.nih.gov/36976950/`
- **Confidence**: Medium for direction; Low for exact magnitudes.

### Support / body position / resistance source / bar type / cadence / pause

- **Code pointers**: `bicepCurl.variationEffects.support`, `.bodyPosition`, `.resistanceSource`, `.barType`, `.cadence`, `.pause`
- **Notes**: Evidence is weaker and highly protocol-dependent (ROM, elbow position, cheating). Deltas are intentionally conservative.
- **Confidence**: Low.

