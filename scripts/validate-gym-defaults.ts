import {
  DEFAULT_EXERCISES,
  VARIATION_TEMPLATE_MAP,
  computeEffectiveTargets,
  type MuscleTargets,
} from "../lib/gym";

function sumTargets(targets: MuscleTargets) {
  return targets.reduce((acc, t) => acc + t.weight, 0);
}

function approxEqual(a: number, b: number, tol = 1e-6) {
  return Math.abs(a - b) <= tol;
}

function formatId(exerciseId: string, variationId?: string, optionKey?: string) {
  return [exerciseId, variationId, optionKey].filter(Boolean).join(" :: ");
}

function validate() {
  const errors: string[] = [];

  for (const ex of DEFAULT_EXERCISES) {
    // Base targets
    const baseSum = sumTargets(ex.baseTargets);
    if (!approxEqual(baseSum, 1, 1e-6)) {
      errors.push(`${ex.id}: baseTargets must sum to 1.0; got ${baseSum}`);
    }
    for (const t of ex.baseTargets) {
      if (!Number.isFinite(t.weight) || t.weight < 0) {
        errors.push(`${ex.id}: invalid base target weight for ${t.muscle}: ${t.weight}`);
      }
    }

    const variationTemplates = ex.variationTemplates ?? {};
    const variationEffects = ex.variationEffects ?? {};

    // Template ids exist
    for (const [variationId, override] of Object.entries(variationTemplates)) {
      if (!VARIATION_TEMPLATE_MAP.has(override.templateId)) {
        errors.push(`${formatId(ex.id, variationId)}: unknown templateId "${override.templateId}"`);
      }
    }

    // Effect option keys exist in template
    for (const [variationId, optionEffects] of Object.entries(variationEffects)) {
      const override = variationTemplates[variationId];
      if (!override) {
        errors.push(`${formatId(ex.id, variationId)}: has variationEffects but no variationTemplates entry`);
        continue;
      }

      const tpl = VARIATION_TEMPLATE_MAP.get(override.templateId);
      if (!tpl) continue;
      const allowed = new Set(tpl.options.map((o) => o.key));
      for (const optionKey of Object.keys(optionEffects)) {
        if (!allowed.has(optionKey)) {
          errors.push(
            `${formatId(ex.id, variationId, optionKey)}: optionKey not in template "${override.templateId}"`,
          );
        }
      }
    }

    // Exercise + each option in isolation should yield sane targets
    for (const [variationId, override] of Object.entries(variationTemplates)) {
      const tpl = VARIATION_TEMPLATE_MAP.get(override.templateId);
      if (!tpl) continue;

      for (const opt of tpl.options) {
        try {
          const effective = computeEffectiveTargets(ex, { [variationId]: opt.key });
          const s = sumTargets(effective);
          if (!approxEqual(s, 1, 1e-6)) {
            errors.push(`${formatId(ex.id, variationId, opt.key)}: effective targets must sum to 1.0; got ${s}`);
          }
          for (const t of effective) {
            if (!Number.isFinite(t.weight) || t.weight < 0) {
              errors.push(`${formatId(ex.id, variationId, opt.key)}: invalid weight for ${t.muscle}: ${t.weight}`);
            }
          }
        } catch (e) {
          errors.push(`${formatId(ex.id, variationId, opt.key)}: ${String(e)}`);
        }
      }
    }
  }

  return errors;
}

const errors = validate();
if (errors.length) {
  // eslint-disable-next-line no-console
  console.error(`validate:gym-defaults failed with ${errors.length} issue(s):\n`);
  for (const err of errors) {
    // eslint-disable-next-line no-console
    console.error(`- ${err}`);
  }
  process.exit(1);
} else {
  // eslint-disable-next-line no-console
  console.log(`validate:gym-defaults passed (${DEFAULT_EXERCISES.length} exercises checked)`);
}

