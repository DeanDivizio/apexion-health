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
    { key: "magClose", label: "MAG Grip (Close)", description: "Maximum Advantage Grip (~5 in width).", order: 9 },
    { key: "magMedium", label: "MAG Grip (Medium)", description: "Maximum Advantage Grip (~22 in width).", order: 10 },
    { key: "magThreeQuarter", label: "MAG Grip (Three-Quarter)", description: "Maximum Advantage Grip (~30 in width).", order: 11 },
    { key: "magWide", label: "MAG Grip (Wide)", description: "Maximum Advantage Grip (~38 in width).", order: 12 },
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
    { key: "flatBenchSupported", label: "Flat Bench Supported", description: "Supported by a flat bench.", order: 2 },
    { key: "inclineBenchSupported", label: "Incline Bench Supported", description: "Supported by an incline bench.", order: 3 },
    { key: "chestSupported", label: "Chest Supported", description: "Chest supported against a pad.", order: 4 },
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
    { key: "hooks", label: "Hooks", description: "Using hooks to assist grip.", order: 3 },
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
    { key: "low", label: "Low", description: "Feet placed lower on the platform.", order: 1 },
    { key: "mid", label: "Mid", description: "Feet centered on the platform.", order: 2 },
    { key: "high", label: "High", description: "Feet placed higher on the platform.", order: 3 },
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

/**
 * Seat height for machines.
 */
export const SEAT_HEIGHT_TEMPLATE: VariationTemplate = {
  id: "seatHeight",
  label: "Seat Height",
  description: "Relative seat height setting on the machine.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the seat height.", order: 0 },
    { key: "low", label: "Low", description: "Lowest seat position.", order: 1 },
    { key: "mid", label: "Mid", description: "Middle/standard seat position.", order: 2 },
    { key: "high", label: "High", description: "Highest seat position.", order: 3 },
  ],
};

/**
 * Bar height (e.g., safety bar / rack / lever height).
 */
export const BAR_HEIGHT_TEMPLATE: VariationTemplate = {
  id: "barHeight",
  label: "Bar Height",
  description: "Relative bar or lever height setting.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the bar height.", order: 0 },
    { key: "low", label: "Low", description: "Low bar height.", order: 1 },
    { key: "mid", label: "Mid", description: "Mid bar height.", order: 2 },
    { key: "high", label: "High", description: "High bar height.", order: 3 },
  ],
};

/**
 * Cable attachment height on pulley machines.
 */
export const CABLE_HEIGHT_TEMPLATE: VariationTemplate = {
  id: "cableHeight",
  label: "Cable Height",
  description: "Relative cable/pulley attachment height.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the cable height.", order: 0 },
    { key: "low", label: "Low", description: "Low pulley position.", order: 1 },
    { key: "mid", label: "Mid", description: "Mid pulley position.", order: 2 },
    { key: "high", label: "High", description: "High pulley position.", order: 3 },
  ],
};

/**
 * Seat/backpad angle (degrees) for adjustable machines.
 */
export const SEAT_ANGLE_TEMPLATE: VariationTemplate = {
  id: "seatAngle",
  label: "Seat Angle",
  description: "Seat or backpad angle in degrees.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the seat angle.", order: 0 },
    { key: "0", label: "0°", description: "Neutral / flat.", order: 1 },
    { key: "15", label: "15°", description: "Slight incline.", order: 2 },
    { key: "30", label: "30°", description: "Moderate incline.", order: 3 },
    { key: "45", label: "45°", description: "Steeper incline.", order: 4 },
  ],
};

/**
 * ROM limiter / end-stop position for machines that support adjustable stops.
 * Useful for tracking lengthened or shortened partials.
 */
export const END_STOP_TEMPLATE: VariationTemplate = {
  id: "endStop",
  label: "End Stop / ROM Limiter",
  description: "Adjustable stop position on machines that support it.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the end-stop setting.", order: 0 },
    { key: "none", label: "None", description: "No stop set; full machine ROM.", order: 1 },
    { key: "lengthenedStop", label: "Lengthened Stop", description: "Stop set in the stretched position (lengthened partials).", order: 2 },
    { key: "shortenedStop", label: "Shortened Stop", description: "Stop set in the contracted position (shortened partials).", order: 3 },
    { key: "both", label: "Both", description: "Stops set at both ends.", order: 4 },
  ],
};

/**
 * How close the backrest / chest pad is to the handles or load.
 * Distinct from SEAT_HEIGHT — this is pad-to-handle distance (e.g., seated row, chest press).
 */
export const BACKREST_DEPTH_TEMPLATE: VariationTemplate = {
  id: "backrestDepth",
  label: "Backrest Depth",
  description: "How close the backrest/chest pad is to the handles or load.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the backrest depth.", order: 0 },
    { key: "shortest", label: "Shortest", description: "Pad closest to the handles.", order: 1 },
    { key: "short", label: "Short", description: "Shorter than neutral.", order: 2 },
    { key: "mid", label: "Mid", description: "Your usual/standard depth.", order: 3 },
    { key: "long", label: "Long", description: "Longer than neutral.", order: 4 },
    { key: "longest", label: "Longest", description: "Pad farthest from the handles.", order: 5 },
  ],
};

/**
 * Where the ankle/shin pad contacts the leg.
 * Common on leg extension, leg curl, glute kickback.
 */
export const ANKLE_PAD_POSITION_TEMPLATE: VariationTemplate = {
  id: "anklePadPosition",
  label: "Ankle Pad Position",
  description: "Where the ankle/shin pad contacts your leg.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the ankle pad position.", order: 0 },
    { key: "low", label: "Low (Near Ankle)", description: "Pad placed low on the shin.", order: 1 },
    { key: "mid", label: "Mid Shin", description: "Pad centered on the shin.", order: 2 },
    { key: "high", label: "High (Near Knee)", description: "Pad placed high on the shin.", order: 3 },
  ],
};

/**
 * Thigh / knee clamp pad height.
 * Common on lat pulldown, seated leg curl, hack squat shoulder pads.
 */
export const THIGH_PAD_HEIGHT_TEMPLATE: VariationTemplate = {
  id: "thighPadHeight",
  label: "Thigh Pad Height",
  description: "Thigh/knee clamp pad height on the machine.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the thigh pad height.", order: 0 },
    { key: "loose", label: "Loose / Not Clamped", description: "Pad not contacting the thighs.", order: 1 },
    { key: "low", label: "Low", description: "Low pad setting.", order: 2 },
    { key: "mid", label: "Mid", description: "Middle pad setting.", order: 3 },
    { key: "high", label: "High", description: "High pad setting (more clamp).", order: 4 },
  ],
};

/**
 * Forward/back foot position on a leg press / hack squat platform.
 * Distinct from FOOT_VERTICAL_POSITION which is low/mid/high on the plate.
 */
export const FOOTPLATE_DEPTH_TEMPLATE: VariationTemplate = {
  id: "footplateDepth",
  label: "Footplate Depth",
  description: "Forward/back foot position on the platform.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the footplate depth.", order: 0 },
    { key: "shallow", label: "Shallow", description: "Feet toward the front of the platform.", order: 1 },
    { key: "mid", label: "Mid", description: "Feet at standard depth.", order: 2 },
    { key: "deep", label: "Deep", description: "Feet toward the back of the platform.", order: 3 },
  ],
};

/**
 * Arm path on machines that allow convergent/divergent movement.
 * Relevant for chest press, shoulder press, row machines.
 */
export const ARM_PATH_TEMPLATE: VariationTemplate = {
  id: "armPath",
  label: "Arm Path",
  description: "Path the arms travel on machines that allow it.",
  options: [
    { key: "untracked", label: "Untracked", description: "Don't record the arm path.", order: 0 },
    { key: "converging", label: "Converging", description: "Arms converge toward center at lockout.", order: 1 },
    { key: "parallel", label: "Parallel", description: "Arms travel straight and parallel.", order: 2 },
    { key: "diverging", label: "Diverging", description: "Arms flare outward at lockout.", order: 3 },
  ],
};

/**
 * How the feet are arranged. Distinct from Width (which is distance apart
 * when feet are parallel). Relevant for lunges, RDL, split squats, deadlifts.
 */
export const STANCE_TYPE_TEMPLATE: VariationTemplate = {
  id: "stanceType",
  label: "Stance Type",
  description: "How your feet are arranged.",
  options: [
    { key: "parallel", label: "Parallel", description: "Both feet side by side.", order: 1 },
    { key: "staggered", label: "Staggered", description: "One foot slightly ahead of the other.", order: 2 },
    { key: "split", label: "Split", description: "Front foot planted, rear foot back.", order: 3 },
    { key: "splitReverse", label: "Reverse Split", description: "Rear foot elevated; standard split reversed.", order: 4 },
    { key: "singleLeg", label: "Single Leg", description: "Only one foot on the ground.", order: 5 },
  ],
};

/**
 * How the torso is angled during the movement.
 * Relevant for cable rows, pulldowns, RDL, hack squat.
 */
export const TORSO_LEAN_TEMPLATE: VariationTemplate = {
  id: "torsoLean",
  label: "Torso Lean",
  description: "How your torso is angled during the movement.",
  options: [
    { key: "upright", label: "Upright", description: "Torso vertical.", order: 1 },
    { key: "slightForward", label: "Slightly Forward", description: "Minor forward lean.", order: 2 },
    { key: "forward", label: "Forward", description: "Significant forward lean.", order: 3 },
    { key: "reclined", label: "Reclined", description: "Leaning back past vertical.", order: 4 },
  ],
};

/**
 * Whether you stand elevated or in a deficit.
 * Relevant for deadlifts, push-ups, split squats, RDL.
 */
export const ELEVATION_TEMPLATE: VariationTemplate = {
  id: "elevation",
  label: "Elevation / Deficit",
  description: "Whether you stand elevated or in a deficit.",
  options: [
    { key: "neutral", label: "Neutral", description: "Standard ground level.", order: 1 },
    { key: "deficitSmall", label: "Small Deficit", description: "Slightly below the bar/floor level.", order: 2 },
    { key: "deficitLarge", label: "Large Deficit", description: "Well below the bar/floor level.", order: 3 },
    { key: "elevatedSmall", label: "Small Elevation", description: "Slightly elevated surface.", order: 4 },
    { key: "elevatedLarge", label: "Large Elevation", description: "Significantly elevated surface.", order: 5 },
  ],
};

/**
 * Accommodating resistance added to the bar (chains or bands).
 * Orthogonal to resistanceSource.
 */
export const ACCOMMODATING_RESISTANCE_TEMPLATE: VariationTemplate = {
  id: "accommodatingResistance",
  label: "Accommodating Resistance",
  description: "Chains or bands added that change resistance through the ROM.",
  options: [
    { key: "none", label: "None", description: "No accommodating resistance.", order: 1 },
    { key: "chains", label: "Chains", description: "Chains added to the bar.", order: 2 },
    { key: "bandsLight", label: "Bands (Light)", description: "Light bands added.", order: 3 },
    { key: "bandsHeavy", label: "Bands (Heavy)", description: "Heavy bands added.", order: 4 },
    { key: "reverseBands", label: "Reverse Bands", description: "Bands assist rather than add resistance.", order: 5 },
  ],
};

/**
 * Assistance used during bodyweight movements.
 * Relevant for pull-ups, dips, pistol squats.
 */
export const ASSISTANCE_TEMPLATE: VariationTemplate = {
  id: "assistance",
  label: "Assistance",
  description: "Assistance used during bodyweight movements.",
  options: [
    { key: "none", label: "None", description: "No assistance.", order: 1 },
    { key: "bandLight", label: "Band (Light)", description: "Light band assistance.", order: 2 },
    { key: "bandHeavy", label: "Band (Heavy)", description: "Heavy band assistance.", order: 3 },
    { key: "machine", label: "Machine Assist", description: "Assisted pull-up/dip machine.", order: 4 },
    { key: "partner", label: "Partner / Spotter", description: "Manual assistance from a partner.", order: 5 },
  ],
};

/**
 * External load attachment for bodyweight movements.
 */
export const LOADED_BODYWEIGHT_TEMPLATE: VariationTemplate = {
  id: "loadedBodyweight",
  label: "External Load",
  description: "How external load is attached for bodyweight movements.",
  options: [
    { key: "none", label: "None", description: "Bodyweight only.", order: 1 },
    { key: "dipBelt", label: "Dip Belt", description: "Weight hung from a dip belt.", order: 2 },
    { key: "weightVest", label: "Weight Vest", description: "Weight worn in a vest.", order: 3 },
    { key: "plateHeld", label: "Plate / Dumbbell Held", description: "Plate or dumbbell held during the rep.", order: 4 },
    { key: "ankleWeights", label: "Ankle Weights", description: "Weights attached to the ankles.", order: 5 },
  ],
};

/**
 * Isometric hold position (and implicit duration).
 * Distinct from PAUSE which is a binary at a position.
 */
export const ISO_HOLD_TEMPLATE: VariationTemplate = {
  id: "isoHold",
  label: "Isometric Hold",
  description: "Where you hold an isometric contraction during the rep.",
  options: [
    { key: "none", label: "None", description: "No iso hold.", order: 1 },
    { key: "holdAtStretch", label: "Hold at Stretch", description: "Hold in the lengthened position.", order: 2 },
    { key: "holdAtPeak", label: "Hold at Peak", description: "Hold in the contracted position.", order: 3 },
    { key: "holdMid", label: "Hold Mid", description: "Hold in the middle of the ROM.", order: 4 },
    { key: "holdBoth", label: "Hold Both Ends", description: "Hold at both stretch and peak.", order: 5 },
  ],
};

/**
 * How unilateral reps are sequenced between sides.
 * Only meaningful for dualUnilateral exercises.
 */
export const EXECUTION_PATTERN_TEMPLATE: VariationTemplate = {
  id: "executionPattern",
  label: "Execution Pattern",
  description: "How unilateral reps are sequenced between sides.",
  options: [
    { key: "simultaneous", label: "Simultaneous", description: "Both sides move at the same time.", order: 1 },
    { key: "alternating", label: "Alternating", description: "Alternate sides rep-by-rep.", order: 2 },
    { key: "sequential", label: "Sequential", description: "All reps one side, then the other.", order: 3 },
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
  SEAT_HEIGHT_TEMPLATE,
  BAR_HEIGHT_TEMPLATE,
  CABLE_HEIGHT_TEMPLATE,
  SEAT_ANGLE_TEMPLATE,
  END_STOP_TEMPLATE,
  BACKREST_DEPTH_TEMPLATE,
  ANKLE_PAD_POSITION_TEMPLATE,
  THIGH_PAD_HEIGHT_TEMPLATE,
  FOOTPLATE_DEPTH_TEMPLATE,
  ARM_PATH_TEMPLATE,
  STANCE_TYPE_TEMPLATE,
  TORSO_LEAN_TEMPLATE,
  ELEVATION_TEMPLATE,
  ACCOMMODATING_RESISTANCE_TEMPLATE,
  ASSISTANCE_TEMPLATE,
  LOADED_BODYWEIGHT_TEMPLATE,
  ISO_HOLD_TEMPLATE,
  EXECUTION_PATTERN_TEMPLATE,
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
