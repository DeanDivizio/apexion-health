/**
 * Caffeine content reference data for coffee and tea beverages.
 *
 * Values sourced from USDA FoodData Central, FDA published averages, and
 * Journal of Food Science peer-reviewed analyses. All values represent
 * milligrams of caffeine per fluid ounce of brewed/prepared beverage.
 *
 * This lets us compute approximate caffeine from (subtype × volume) without
 * asking the user to weigh beans or read lab reports.
 */

// ─── Coffee subtypes ──────────────────────────────────────────────────────────

export interface BeverageSubtypeOption {
  key: string;
  label: string;
  caffeineMgPerOz: number;
  description?: string;
}

export const COFFEE_SUBTYPES: BeverageSubtypeOption[] = [
  {
    key: "drip",
    label: "Drip / Brewed",
    caffeineMgPerOz: 11.8,
    description: "Standard auto-drip or pour-over",
  },
  {
    key: "espresso",
    label: "Espresso",
    caffeineMgPerOz: 63.6,
    description: "~63 mg per 1 oz shot",
  },
  {
    key: "cold-brew",
    label: "Cold Brew",
    caffeineMgPerOz: 12.5,
    description: "Concentrate-style, undiluted",
  },
  {
    key: "french-press",
    label: "French Press",
    caffeineMgPerOz: 13.4,
    description: "Full immersion, coarser grind",
  },
  {
    key: "instant",
    label: "Instant",
    caffeineMgPerOz: 7.8,
    description: "Reconstituted instant granules",
  },
  {
    key: "latte",
    label: "Latte / Cappuccino",
    caffeineMgPerOz: 9.6,
    description: "Espresso + steamed milk (diluted)",
  },
  {
    key: "decaf",
    label: "Decaf",
    caffeineMgPerOz: 0.6,
    description: "~2–7 mg per 8 oz cup",
  },
];

// ─── Tea subtypes ─────────────────────────────────────────────────────────────

export const TEA_SUBTYPES: BeverageSubtypeOption[] = [
  {
    key: "black",
    label: "Black Tea",
    caffeineMgPerOz: 5.9,
    description: "English Breakfast, Earl Grey, etc.",
  },
  {
    key: "green",
    label: "Green Tea",
    caffeineMgPerOz: 3.5,
    description: "Sencha, Dragonwell, etc.",
  },
  {
    key: "matcha",
    label: "Matcha",
    caffeineMgPerOz: 8.9,
    description: "Whisked powder, ~70 mg per 8 oz",
  },
  {
    key: "white",
    label: "White Tea",
    caffeineMgPerOz: 1.9,
    description: "Silver Needle, Bai Mudan",
  },
  {
    key: "oolong",
    label: "Oolong Tea",
    caffeineMgPerOz: 4.5,
    description: "Partially oxidized, varies widely",
  },
  {
    key: "chai",
    label: "Chai",
    caffeineMgPerOz: 5.9,
    description: "Spiced black tea base",
  },
  {
    key: "yerba-mate",
    label: "Yerba Mate",
    caffeineMgPerOz: 5.0,
    description: "~40 mg per 8 oz serving",
  },
  {
    key: "herbal",
    label: "Herbal / Caffeine-Free",
    caffeineMgPerOz: 0,
    description: "Chamomile, rooibos, peppermint, etc.",
  },
];

export const SUBTYPE_MAP: Record<string, BeverageSubtypeOption[]> = {
  coffee: COFFEE_SUBTYPES,
  tea: TEA_SUBTYPES,
};

export const DEFAULT_SUBTYPE: Record<string, string> = {
  coffee: "drip",
  tea: "black",
};

/**
 * Look up the caffeine-per-oz for a given beverage + subtype pair.
 * Returns 0 for water or unknown combinations.
 */
export function getCaffeineMgPerOz(
  beverageType: string,
  subtype: string | null | undefined,
): number {
  if (beverageType === "water") return 0;

  const subtypes = SUBTYPE_MAP[beverageType];
  if (!subtypes) return 0;

  const match = subtypes.find((s) => s.key === subtype);
  if (match) return match.caffeineMgPerOz;

  const defaultKey = DEFAULT_SUBTYPE[beverageType];
  const defaultMatch = subtypes.find((s) => s.key === defaultKey);
  return defaultMatch?.caffeineMgPerOz ?? 0;
}

/**
 * Compute total estimated caffeine in mg from volume in fluid ounces and subtype.
 */
export function estimateCaffeineMg(
  beverageType: string,
  subtype: string | null | undefined,
  amountOz: number,
): number {
  return Math.round(getCaffeineMgPerOz(beverageType, subtype) * amountOz);
}
