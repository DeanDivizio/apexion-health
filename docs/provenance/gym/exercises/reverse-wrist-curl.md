## `reverseWristCurl` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (forearms)

- **Code pointer**: `reverseWristCurl.baseTargets`
- **Rationale**: Reverse wrist curl is loaded wrist extension, primarily driven by forearm wrist extensors (especially extensor carpi radialis and extensor carpi ulnaris), so this is modeled as a pure `forearms` movement.
- **Sources**
  - Activity patterns of wrist extensor muscles during wrist extension/deviation (surface + intramuscular EMG): `https://onlinelibrary.wiley.com/doi/10.1002/mus.20237`
  - Effects of forearm rotation on wrist flexor and extensor activity (healthy participants; extension torque with ECRB/ECU activation): `https://pmc.ncbi.nlm.nih.gov/articles/PMC11740565/`
  - Strict actions of human wrist extensors (ECRL/ECRB/ECU force direction confirms extension role): `https://www.sciencedirect.com/science/article/abs/pii/S1050641110000921`
- **Confidence**: High for "forearms primary"; Low for exact within-forearm distribution (not tracked in current muscle taxonomy).

### Resistance source / cadence / pause

- **Code pointers**: `reverseWristCurl.variationEffects.resistanceSource`, `.cadence`, `.pause`
- **Notes**: These are tracked for logging consistency; deltas remain neutral because broad, externally valid evidence for universal source/tempo deltas is limited.
- **Confidence**: Low.

