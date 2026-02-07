## `tricepPushdown` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (triceps + forearms)

- **Code pointer**: `tricepPushdown.baseTargets`
- **Rationale**: Elbow extension is primarily triceps brachii. Forearm musculature contributes as grip/handle stabilizers (tracked as `forearms`).
- **Confidence**: High for direction; Low for exact weight split.

### Forearm position / grip (supinated vs pronated)

- **Code pointer**: `tricepPushdown.variationEffects.grip`
- **What it supports**: Forearm position influences recruitment patterns during pushdowns; some EMG data suggests supinated pushdowns can increase activation of the triceps long head vs pronated conditions (protocol-dependent).
- **Sources**
  - Forearm position influences triceps activation (IUSCA / 2024): `https://journal.iusca.org/index.php/Journal/article/download/250/349/4974`
- **Confidence**: Medium for direction; Low for magnitude.

### Attachment / cadence / pause

- **Code pointers**: `tricepPushdown.variationEffects.cableAttachment`, `.cadence`, `.pause`
- **Notes**: Attachment-specific EMG comparisons are limited and protocols vary; defaults remain neutral.
- **Confidence**: Low.

