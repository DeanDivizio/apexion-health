## Gym defaults provenance log

This folder tracks **where our built-in exercise defaults come from** and **why they look the way they do**:

- **Base muscle targets** (the `baseTargets` weights)
- **Variation deltas** (the `variationEffects.*.*.deltas` tweaks)

The goal is to keep a durable, reviewable trail of **links to external studies** (EMG / biomechanics / systematic reviews)
that justify our defaults, plus notes where evidence is weak and we’re using “best guess”.

### Where the defaults live

- **Exercise definitions**: `lib/gym/exercises.ts`
- **Variation templates**: `lib/gym/variations.ts`
- **How deltas are applied**: `lib/gym/types.ts` (`applyVariationEffect`, `computeEffectiveTargets`)

### How to add new provenance

- Add/update an entry in the relevant per-exercise file in `exercises/`
- If the exercise doesn’t have a file yet, create one and link it from `exercise-defaults.md`

### Index of exercise defaults

- See [`exercise-defaults.md`](./exercise-defaults.md) for the full list of built-in exercises and their provenance pages.

