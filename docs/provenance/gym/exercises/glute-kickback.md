## `gluteKickback` evidence

Defaults location: `lib/gym/exercises.ts`

### Base targets (glutes 0.70 + hamstrings 0.25 + lowerBack 0.05)

- **Code pointer**: `gluteKickback.baseTargets`
- **Rationale**: The cable glute kickback is a hip extension isolation exercise performed with an ankle cuff attached to a low cable. The movement primarily loads the gluteus maximus through hip extension, with significant hamstring (biceps femoris) co-activation across all regions (proximal, medial, distal). EMG research shows cable kickbacks produce high glute max activation comparable to step-ups, and high BF activation across all regions comparable to Nordics and leg curls — substantially higher than RDLs and step-ups for hamstring activation.
- **Sources**
  - BF proximal/medial/distal + GMax EMG across 6 hip extension exercises (kickbacks showed high BF activation in all regions and high GMax): `https://pmc.ncbi.nlm.nih.gov/articles/PMC9362892/`
  - Cable kickback muscle activation overview: `https://fitactiveliving.com/cable-glute-kickbacks/`
  - Glute kickback comprehensive guide: `https://www.performancelab.com/blogs/fitness/glute-cable-kickbacks`
- **Confidence**: Medium for glute-dominant + strong hamstring secondary. Low for exact 0.70/0.25/0.05 split. The 0.05 lower back contribution reflects its role as a stabilizer during standing hip extension — kneeling variants reduce this.

### Body position (standing vs kneeling)

- **Code pointer**: `gluteKickback.variationEffects.bodyPosition`
- **What it supports**: Kneeling (e.g., on a bench) reduces lower back stabilization demands and may increase glute isolation by eliminating standing balance requirements. The +0.05 glute / -0.05 lower back delta for kneeling reflects the reduced spinal erector demand.
- **Sources**
  - Biomechanical rationale: kneeling removes hip stabilizer demand on planted leg and reduces compensatory trunk extension. No direct EMG study comparing standing vs kneeling cable kickback variants was found.
- **Confidence**: Low for exact delta magnitudes; Medium for directional effect.

### Resistance source / cadence / pause

- **Code pointers**: `gluteKickback.variationEffects.resistanceSource`, `.cadence`, `.pause`
- **Notes**: Tracked for logging; effects are neutral. Cable is the most common modality, but resistance bands and machines (e.g., multi-hip machine) are viable alternatives. No comparative EMG data across resistance sources for this specific exercise.
- **Confidence**: Low.

### Notes / gaps

- The EMG study (PMC9362892) used a 45-degree hip extension machine for its "hip extension" condition, not a cable kickback — though the cable kickback condition was specifically tested and showed strong activation patterns.
- Foot angle (toes out vs forward) may influence glute activation similarly to hip thrusts, but no kickback-specific data exists. Not included as a variation dimension to avoid unsupported claims.
