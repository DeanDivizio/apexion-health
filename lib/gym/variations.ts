/**
 * Variation Templates - Apexion Health
 * 
 * Portable variation templates that can be reused across exercises.
 * Templates define the dimension and options; effects are per-exercise.
 */

import type { VariationTemplate } from "./types";

// =============================================================================
// VARIATION TEMPLATES
// =============================================================================

/**
 * Portable "width" template used across exercises.
 * Note: exercises can override the display label (e.g., Grip Width vs Stance Width).
 */
export const WIDTH_TEMPLATE: VariationTemplate = {
  id: "width",
  label: "Width",
  description: "How wide your hands/feet are positioned.",
  options: [
    { key: "closest", label: "Closest", description: "Very narrow position.", order: 1 },
    { key: "close", label: "Close", description: "Narrower than neutral.", order: 2 },
    { key: "neutral", label: "Neutral", description: "Your usual/standard width.", order: 3 },
    { key: "wide", label: "Wide", description: "Wider than neutral.", order: 4 },
    { key: "widest", label: "Widest", description: "As wide as you comfortably go.", order: 5 },
  ],
};

/**
 * Portable "plane angle" template (degrees).
 */
export const PLANE_ANGLE_TEMPLATE: VariationTemplate = {
  id: "planeAngle",
  label: "Angle",
  description: "Bench/surface angle in degrees.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the angle.", order: 1 },
    { key: "-15", label: "-15°", description: "Decline angle.", order: 2 },
    { key: "0", label: "0°", description: "Flat position.", order: 3 },
    { key: "15", label: "15°", description: "Slight incline.", order: 4 },
    { key: "30", label: "30°", description: "Moderate incline.", order: 5 },
    { key: "45", label: "45°", description: "Steep incline.", order: 6 },
    { key: "60", label: "60°", description: "Very steep incline.", order: 7 },
  ],
};

/**
 * Portable "grip" template.
 */
export const GRIP_TEMPLATE: VariationTemplate = {
  id: "grip",
  label: "Grip",
  description: "Hand orientation on the bar/handle.",
  options: [
    { key: "normal", label: "Normal", description: "Default for this exercise.", order: 1 },
    { key: "pronated", label: "Pronated", description: "Palms facing down/away.", order: 2 },
    { key: "supinated", label: "Supinated", description: "Palms facing up/toward you.", order: 3 },
    { key: "neutral", label: "Neutral", description: "Palms facing each other.", order: 4 },
    { key: "neutralSupinated", label: "Neutral/Supinated", description: "Angled or semi-neutral grip.", order: 5 },
  ],
};

/**
 * Template for handle type.
 */
export const CABLE_ATTACHMENT_TEMPLATE: VariationTemplate = {
  id: "cableAttachment",
  label: "Cable Attachment",
  description: "The handle/attachment used on the cable.",
  options: [
    { key: "straightBar", label: "Straight Bar", description: "Long straight bar handle.", order: 1 },
    { key: "angledBar", label: "Angled Bar", description: "Straight bar with angled ends.", order: 2 },
    { key: "curvedBar", label: "Curved/Wavy Bar", description: "EZ-style curved bar.", order: 3 },
    { key: "rope", label: "Rope", description: "Two-ended rope attachment.", order: 4 },
    { key: "strap", label: "Strap", description: "Single strap handle.", order: 5 },
    { key: "singleDHandle", label: "Single D Handle", description: "Single-hand D handle.", order: 6 },
    { key: "doubleDHandle", label: "Double D Handle", description: "Two-hand D handle.", order: 7 },
    { key: "vHandle", label: "V Handle", description: "Close-grip V handle.", order: 8 },
  ],
};

/**
 * Granular resistance source.
 */
export const RESISTANCE_SOURCE_TEMPLATE: VariationTemplate = {
  id: "resistanceSource",
  label: "Resistance Source",
  description: "What equipment provides the resistance.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the resistance source.", order: 0 },
    { key: "bodyweight", label: "Bodyweight", description: "Your body is the load.", order: 1 },
    { key: "dumbbell", label: "Dumbbell", description: "Free-weight dumbbells.", order: 2 },
    { key: "barbell", label: "Barbell", description: "Free-weight barbell.", order: 3 },
    { key: "kettlebell", label: "Kettlebell", description: "Kettlebell load.", order: 4 },
    { key: "cable", label: "Cable", description: "Cable stack resistance.", order: 5 },
    { key: "band", label: "Band", description: "Elastic band resistance.", order: 6 },
    { key: "smithMachine", label: "Smith Machine", description: "Guided bar path.", order: 7 },
    { key: "machineSelectorized", label: "Machine (Selectorized)", description: "Pin/stack machine.", order: 8 },
    { key: "machinePlateLoaded", label: "Machine (Plate Loaded)", description: "Plate-loaded machine.", order: 9 },
  ],
};

/**
 * Body position / support used for the movement.
 */
export const BODY_POSITION_TEMPLATE: VariationTemplate = {
  id: "bodyPosition",
  label: "Body Position",
  description: "Your overall body position.",
  options: [
    { key: "standing", label: "Standing", description: "Standing upright.", order: 1 },
    { key: "seated", label: "Seated", description: "Seated on a bench or machine.", order: 2 },
    { key: "supine", label: "Supine (On Back)", description: "Lying on your back.", order: 3 },
    { key: "prone", label: "Prone (Face Down)", description: "Lying face down.", order: 4 },
    { key: "kneeling", label: "Kneeling", description: "Both knees down.", order: 5 },
    { key: "halfKneeling", label: "Half Kneeling", description: "One knee down, one foot planted.", order: 6 },
    { key: "hipHinged", label: "Hip-Hinged", description: "Bent over with a hinge.", order: 7 },
  ],
};

/**
 * External support used during the movement.
 */
export const SUPPORT_TEMPLATE: VariationTemplate = {
  id: "support",
  label: "Support",
  description: "What supports your body during the movement.",
  options: [
    { key: "none", label: "None", description: "No external support.", order: 1 },
    { key: "inclineBenchSupported", label: "Incline Bench Supported", description: "Supported by an incline bench.", order: 2 },
    { key: "chestSupported", label: "Chest Supported", description: "Chest supported against a pad.", order: 3 },
  ],
};

/**
 * Unilateral performance style (separate from whether an exercise is typically unilateral).
 */
export const UNILATERAL_MODE_TEMPLATE: VariationTemplate = {
  id: "unilateralMode",
  label: "Unilateral Mode",
  description: "How you perform sides (together vs one at a time).",
  options: [
    { key: "bilateral", label: "Bilateral", description: "Both sides together.", order: 1 },
    { key: "unilateral", label: "Unilateral", description: "One side at a time.", order: 2 },
    { key: "alternating", label: "Alternating", description: "Switch sides each rep.", order: 3 },
    { key: "offset", label: "Offset (Uneven Load)", description: "Uneven load between sides.", order: 4 },
    { key: "contralateral", label: "Contralateral", description: "Opposite arm/leg focus.", order: 5 },
  ],
};

/**
 * Range of motion (ROM) selection.
 */
export const RANGE_OF_MOTION_TEMPLATE: VariationTemplate = {
  id: "rangeOfMotion",
  label: "Range of Motion",
  description: "How much of the movement you perform.",
  options: [
    { key: "full", label: "Full", description: "Through your full ROM.", order: 1 },
    { key: "extended", label: "Extended", description: "Extra ROM beyond standard.", order: 2 },
    { key: "partialTop", label: "Partial (Top)", description: "Top half of the ROM.", order: 3 },
    { key: "partialBottom", label: "Partial (Bottom)", description: "Bottom half of the ROM.", order: 4 },
    { key: "partialMid", label: "Partial (Mid)", description: "Middle range only.", order: 5 },
  ],
};

/**
 * Knee angle selection (commonly used for bridges / hip thrusts).
 * This is a proxy for "foot placement closer/farther" in those movements.
 */
export const KNEE_ANGLE_TEMPLATE: VariationTemplate = {
  id: "kneeAngle",
  label: "Knee Angle",
  description: "How bent your knees are (proxy for foot placement).",
  options: [
    { key: "flexed", label: "Flexed", description: "More knee bend (feet closer).", order: 1 },
    { key: "neutral", label: "Neutral", description: "Your usual knee angle.", order: 2 },
    { key: "extended", label: "Extended", description: "Less knee bend (feet farther).", order: 3 },
  ],
};

/**
 * Tempo selection (common presets).
 */
export const CADENCE_TEMPLATE: VariationTemplate = {
  id: "cadence",
  label: "Cadence",
  description: "How you pace the different phases of the rep.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the cadence.", order: 0 },
    { key: "even", label: "Even", description: "Equally fast on the concentric and eccentric phases", order: 1 },
    { key: "fastConcentric", label: "Fast Concentric", description: "Fast lifting phase, normal eccentric.", order: 2 },
    { key: "slowEccentric", label: "Slow Eccentric", description: "Slow lowering phase, normal concentric.", order: 3 },
    { key: "fastConcentricSlowEccentric", label: "Fast Concentric, Slow Eccentric", description: "Fast lifting phase, slow lowering phase.", order: 4 },
    { key: "slowConcentricFastEccentric", label: "Slow Concentric, Fast Eccentric", description: "Slow lifting phase, fast lowering phase.", order: 5 },
    { key: "slowConcentric", label: "Slow Concentric", description: "Slow lifting phase, normal eccentric.", order: 6 },
    { key: "fastEccentric", label: "Fast Eccentric", description: "Fast lowering phase, normal concentric.", order: 7 },
  ],
};

/**
 * Pause location (duration can be tracked elsewhere if needed).
 */
export const PAUSE_TEMPLATE: VariationTemplate = {
  id: "pause",
  label: "Pause",
  description: "Where you pause during the rep.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the pause.", order: 0 },
    { key: "none", label: "None", description: "No intentional pause.", order: 1 },
    { key: "end", label: "End", description: "Pause at the end of the motion.", order: 2 },
    { key: "start", label: "Start", description: "Pause at the start of the motion.", order: 3 },
    { key: "both", label: "Both", description: "Pause at the start and end of the motion.", order: 4 },
  ],
};

/**
 * Bar type selection.
 */
export const BAR_TYPE_TEMPLATE: VariationTemplate = {
  id: "barType",
  label: "Bar Type",
  description: "Which bar you used for the lift.",
  options: [
    { key: "straightBar", label: "Straight Bar", description: "Standard straight barbell.", order: 1 },
    { key: "ezBar", label: "EZ Bar", description: "Curved bar for wrists.", order: 2 },
    { key: "trapBar", label: "Trap Bar", description: "Hex/trap bar deadlift style.", order: 3 },
    { key: "safetySquatBar", label: "Safety Squat Bar", description: "SSB with shoulder handles.", order: 4 },
    { key: "camberedBar", label: "Cambered Bar", description: "Bar with lowered sleeves.", order: 5 },
    { key: "swissBar", label: "Swiss / Football Bar", description: "Multi-grip neutral handles.", order: 6 },
    { key: "axleBar", label: "Axle Bar", description: "Thick-grip axle bar.", order: 7 },
  ],
};

/**
 * Extra grip technique beyond basic orientation.
 */
export const GRIP_TECHNIQUE_TEMPLATE: VariationTemplate = {
  id: "gripTechnique",
  label: "Grip Technique",
  description: "Specific grip technique used.",
  options: [
    { key: "standard", label: "Standard", description: "Normal grip.", order: 1 },
    { key: "mixed", label: "Mixed", description: "One overhand, one underhand.", order: 2 },
    { key: "hook", label: "Hook", description: "Thumb trapped under fingers.", order: 3 },
    { key: "thumbless", label: "Thumbless", description: "Thumb over the bar.", order: 4 },
  ],
};

/**
 * Grip assistance used for holding the load.
 */
export const GRIP_ASSISTANCE_TEMPLATE: VariationTemplate = {
  id: "gripAssistance",
  label: "Grip Assistance",
  description: "Any tools used to assist grip.",
  options: [
    { key: "none", label: "None", description: "No grip assistance.", order: 1 },
    { key: "straps", label: "Straps", description: "Using lifting straps.", order: 2 },
  ],
};

/**
 * Vertical foot position (commonly used for machines like leg press / hacksquat).
 */
export const FOOT_VERTICAL_POSITION_TEMPLATE: VariationTemplate = {
  id: "footVerticalPosition",
  label: "Foot Height",
  description: "Vertical foot position on the platform.",
  options: [
    { key: "standard", label: "Standard", description: "Default foot height.", order: 1 },
    { key: "low", label: "Low", description: "Feet placed lower on the platform.", order: 2 },
    { key: "mid", label: "Mid", description: "Feet centered on the platform.", order: 3 },
    { key: "high", label: "High", description: "Feet placed higher on the platform.", order: 4 },
  ],
};

/**
 * Foot angle (toe direction).
 */
export const FOOT_ANGLE_TEMPLATE: VariationTemplate = {
  id: "footAngle",
  label: "Foot Angle",
  description: "Direction your toes are pointed.",
  options: [
    { key: "toesForward", label: "Toes Forward", description: "Toes pointing forward.", order: 1 },
    { key: "toesOut", label: "Toes Out", description: "Toes angled outward.", order: 2 },
  ],
};

/**
 * Heel elevation used during the movement.
 */
export const HEEL_ELEVATION_TEMPLATE: VariationTemplate = {
  id: "heelElevation",
  label: "Heel Elevation",
  description: "Whether your heels are elevated.",
  options: [
    { key: "flat", label: "Flat", description: "Heels flat on the surface.", order: 1 },
    { key: "heelElevated", label: "Heels Elevated", description: "Heels raised/elevated.", order: 2 },
  ],
};

// =============================================================================
// TEMPLATE REGISTRY & UTILITIES
// =============================================================================

/**
 * Registry of all portable variation templates for lookup.
 */
export const VARIATION_TEMPLATES: VariationTemplate[] = [
  WIDTH_TEMPLATE,
  PLANE_ANGLE_TEMPLATE,
  GRIP_TEMPLATE,
  CABLE_ATTACHMENT_TEMPLATE,
  RESISTANCE_SOURCE_TEMPLATE,
  BODY_POSITION_TEMPLATE,
  SUPPORT_TEMPLATE,
  UNILATERAL_MODE_TEMPLATE,
  RANGE_OF_MOTION_TEMPLATE,
  KNEE_ANGLE_TEMPLATE,
  CADENCE_TEMPLATE,
  PAUSE_TEMPLATE,
  BAR_TYPE_TEMPLATE,
  GRIP_TECHNIQUE_TEMPLATE,
  GRIP_ASSISTANCE_TEMPLATE,
  FOOT_VERTICAL_POSITION_TEMPLATE,
  FOOT_ANGLE_TEMPLATE,
  HEEL_ELEVATION_TEMPLATE,
];

/**
 * Map of templates by ID for O(1) lookups.
 */
export const VARIATION_TEMPLATE_MAP: Map<string, VariationTemplate> = new Map(
  VARIATION_TEMPLATES.map((t) => [t.id, t])
);

/**
 * Get the display label for a variation template option.
 * Returns undefined if the template or option key cannot be found.
 */
export function getVariationOptionLabel(templateId: string, optionKey: string): string | undefined {
  const tpl = VARIATION_TEMPLATE_MAP.get(templateId);
  return tpl?.options.find((o) => o.key === optionKey)?.label;
}
