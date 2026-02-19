## `shoulderPress` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (delts + triceps)

- **Code pointer**: `shoulderPress.baseTargets`
- **Rationale**: Overhead pressing is primarily anterior/medial deltoid with triceps as major synergists.
- **Sources**
  - Body position + loading modality study: `https://pubmed.ncbi.nlm.nih.gov/23096062/`
  - Overhead press EMG comparison (front vs back; barbell vs machine): `https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2022.825880/full`
- **Confidence**: High for prime movers; Low for exact split between delt heads.

### Standing vs seated

- **Code pointer**: `shoulderPress.variationEffects.bodyPosition.standing`
- **What it supports**: Standing increases whole-body stabilization demands; we record a small core contribution delta and keep shoulder/triceps redistribution conservative.
- **Sources**
  - `https://pubmed.ncbi.nlm.nih.gov/23096062/`
- **Confidence**: Medium for mechanism; Low for exact magnitude.

### Grip width / resistance source / bar type / cadence / pause

- **Code pointers**: `shoulderPress.variationEffects.width`, `.resistanceSource`, `.barType`, `.cadence`, `.pause`
- **Notes**: Evidence is mixed and equipment-specific; defaults remain conservative.
- **Confidence**: Low-to-Medium.

