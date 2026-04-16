## `wristCurl` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (forearms)

- **Code pointer**: `wristCurl.baseTargets`
- **Rationale**: Wrist curl is wrist flexion under load, which is produced primarily by forearm wrist flexors (notably flexor carpi radialis and flexor carpi ulnaris), so this is modeled as a pure `forearms` movement.
- **Sources**
  - Effects of forearm rotation on wrist flexor and extensor activity (healthy participants; wrist flexion and extension EMG): `https://pmc.ncbi.nlm.nih.gov/articles/PMC11740565/`
  - Strict actions of human wrist flexors (FCR/FCU force direction confirms primary wrist-flexion role): `https://www.sciencedirect.com/science/article/abs/pii/S1050641115000723`
- **Confidence**: High for "forearms primary"; Low for exact within-forearm distribution (not tracked in current muscle taxonomy).

### Resistance source / cadence / pause

- **Code pointers**: `wristCurl.variationEffects.resistanceSource`, `.cadence`, `.pause`
- **Notes**: These are tracked for logging consistency. Current defaults keep neutral deltas because evidence is stronger for movement pattern (flexion vs extension) than for generalized load-source or tempo-specific hypertrophy differences.
- **Confidence**: Low.

