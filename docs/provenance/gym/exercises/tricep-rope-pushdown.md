## `tricepRopePushdown` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (triceps 0.88 + forearms 0.12)

- **Code pointer**: `tricepRopePushdown.baseTargets`
- **Rationale**: The rope pushdown produces higher absolute triceps activation than bar-based pushdowns, with the lateral head showing the largest increase. The ACE-sponsored EMG study (Boehler, Porcari et al.) found rope pushdowns at 74% combined triceps activation vs 67% for bar pushdowns (relative to triangle push-up baseline), with the lateral head jumping from 59% to 67%. The neutral grip and end-range rope splay preferentially load the lateral head. While forearm stabilizer demand also increases (non-rigid handle, neutral grip — Villalba et al. 2024 found ER activity higher with non-pronated grip; Rendos et al. 2016 found ED activity higher with unstable handles), the triceps activation increase is proportionally larger, yielding a *higher* triceps fraction than bar pushdowns (0.85/0.15).
- **Sources**
  - ACE-sponsored triceps EMG study — rope vs bar pushdown direct comparison (Boehler, Porcari et al.): `https://acewebcontent.azureedge.net/certifiednews/images/article/pdfs/ACETricepsStudy.pdf`
  - Forearm position influences triceps activation during pushdowns (Villalba et al. 2024): `https://doi.org/10.47206/ijsc.v4i1.250`
  - Handle type affects forearm muscle activity during cable pushdowns (Rendos et al. 2016): `https://doi.org/10.1519/JSC.0000000000001293`
  - Muscle fatigue across the three triceps heads during push-down exercise (Hussain et al. 2020): `https://pmc.ncbi.nlm.nih.gov/articles/PMC7047337/`
- **Confidence**: Medium for "higher triceps proportion than bar pushdown"; Low for exact split.

### Note on perceived difficulty

Rope pushdowns feel harder than bar pushdowns despite a higher triceps proportion. The ACE data shows this is because **absolute activation of all muscles increases** — both triceps heads and the forearm stabilizers work harder in absolute terms. Villalba et al. 2024 confirmed this: subjects performed significantly fewer reps (p<0.001) with non-pronated grip at the same load. The difficulty comes from higher total motor unit recruitment and grip instability fatigue, not from the forearms taking a larger proportional share. Our model tracks proportional distribution, not absolute difficulty.

### Why a separate exercise from `tricepPushdown`

The rope pushdown is commonly treated as a distinct exercise in training programs. The rope forces a neutral grip and allows end-range splay that bar-based attachments do not. This is modeled as a separate canonical exercise rather than a variation of `tricepPushdown` for the same reason `preacherCurl` is separate from `bicepCurl` — the mechanical constraint (fixed attachment type + grip) is intrinsic to the movement.

### Cadence / pause

- **Code pointers**: `tricepRopePushdown.variationEffects.cadence`, `.pause`
- **Notes**: Tracked for logging; effects are neutral. Speed variation affects fatigue rate across all three triceps heads, but generalizable muscle-weight redistribution evidence is limited.
- **Sources**
  - `https://pmc.ncbi.nlm.nih.gov/articles/PMC7047337/`
- **Confidence**: Low.

