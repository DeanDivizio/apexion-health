## `calfRaise` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (triceps surae)

- **Code pointer**: `calfRaise.baseTargets`
- **Rationale**: Plantarflexion primarily targets the triceps surae (gastrocnemius + soleus). We track this as `calves`.
- **Confidence**: High.

### Standing vs seated

- **Code pointer**: `calfRaise.variationEffects.bodyPosition`
- **What it supports**: Training outcomes differ by knee angle/position (standing vs seated), likely due to muscle length differences; however we don’t split gastrocnemius vs soleus in the model, so effects remain neutral at the `calves` level.
- **Sources**
  - Standing vs seated calf-raise hypertrophy (Frontiers 2023): `https://pubmed.ncbi.nlm.nih.gov/38156065/`
- **Confidence**: Medium (but limited by our muscle-group granularity).

### Foot angle / resistance source / cadence / pause

- **Code pointers**: `calfRaise.variationEffects.footAngle`, `.resistanceSource`, `.cadence`, `.pause`
- **Notes**: Evidence for systematic redistribution within our coarse `calves` bucket is limited; defaults remain neutral.
- **Confidence**: Low.

