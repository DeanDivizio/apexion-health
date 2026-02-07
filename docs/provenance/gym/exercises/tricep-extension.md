## `tricepExtension` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (triceps)

- **Code pointer**: `tricepExtension.baseTargets`
- **Rationale**: Elbow extension isolation movements primarily target triceps brachii. Overhead variants often bias the long head due to shoulder position, but we don’t track triceps heads separately.
- **Confidence**: High for triceps primary; Low for head-specific claims in our muscle model.

### Body position / resistance source / attachment / bar type / cadence / pause

- **Code pointers**: `tricepExtension.variationEffects.bodyPosition`, `.resistanceSource`, `.cableAttachment`, `.barType`, `.cadence`, `.pause`
- **Notes**: Evidence is exercise-variant specific (overhead extension vs skullcrusher vs pushdown). Defaults remain neutral/conservative unless we add a shoulder-angle dimension.
- **Confidence**: Low.

