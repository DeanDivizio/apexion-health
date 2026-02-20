export interface DefaultSubstanceDefinition {
  key: string;
  displayName: string;
  isCompound: boolean;
  defaultDoseUnit: string | null;
  selfIngredientKey?: string;
  methods: string[];
  defaultVariantKey?: string;
  variants?: Array<{
    key: string;
    label: string;
    deliveryMethodKey?: string;
  }>;
  ingredients?: Array<{
    key: string;
    name: string;
    amountPerServing: number;
    unit: string;
  }>;
}

export const DEFAULT_DELIVERY_METHODS = [
  { key: "oral", label: "Oral" },
  { key: "injection", label: "Injection" },
  { key: "topical", label: "Topical" },
  { key: "sublingual", label: "Sublingual" },
  { key: "transdermal", label: "Transdermal" },
  { key: "nasal", label: "Nasal" },
  { key: "inhaled", label: "Inhaled" },
] as const;

export const INJECTION_DEPTHS = [
  { key: "subcutaneous", label: "Subcutaneous" },
  { key: "intramuscular", label: "Intramuscular" },
] as const;

export const DEFAULT_SUBSTANCES: DefaultSubstanceDefinition[] = [
  // ── Hormones ───────────────────────────────────────────────────────────────
  {
    key: "testosterone",
    displayName: "Testosterone",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "testosterone",
    methods: ["injection", "topical"],
    defaultVariantKey: "cypionate",
    variants: [
      { key: "cypionate", label: "Cypionate", deliveryMethodKey: "injection" },
      { key: "enanthate", label: "Enanthate", deliveryMethodKey: "injection" },
      { key: "propionate", label: "Propionate", deliveryMethodKey: "injection" },
      { key: "cream", label: "Cream", deliveryMethodKey: "topical" },
      { key: "gel", label: "Gel", deliveryMethodKey: "topical" },
    ],
  },
  {
    key: "hcg",
    displayName: "HCG",
    isCompound: false,
    defaultDoseUnit: "IU",
    selfIngredientKey: "hcg",
    methods: ["injection"],
  },
  {
    key: "anastrozole",
    displayName: "Anastrozole (Arimidex)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "anastrozole",
    methods: ["oral"],
  },
  {
    key: "estradiol",
    displayName: "Estradiol",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "estradiol",
    methods: ["oral", "topical", "injection"],
  },
  {
    key: "progesterone",
    displayName: "Progesterone",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "progesterone",
    methods: ["oral", "topical"],
  },
  {
    key: "dhea",
    displayName: "DHEA",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "dhea",
    methods: ["oral", "topical"],
  },

  // ── Common medications ─────────────────────────────────────────────────────
  {
    key: "allegra",
    displayName: "Allegra (Fexofenadine)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "fexofenadine",
    methods: ["oral"],
  },
  {
    key: "ibuprofen",
    displayName: "Ibuprofen",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "ibuprofen",
    methods: ["oral"],
  },
  {
    key: "acetaminophen",
    displayName: "Acetaminophen (Tylenol)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "acetaminophen",
    methods: ["oral"],
  },
  {
    key: "aspirin",
    displayName: "Aspirin",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "aspirin",
    methods: ["oral"],
  },
  {
    key: "finasteride",
    displayName: "Finasteride",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "finasteride",
    methods: ["oral"],
  },
  {
    key: "melatonin",
    displayName: "Melatonin",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "melatonin",
    methods: ["oral"],
  },
  {
    key: "omeprazole",
    displayName: "Omeprazole",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "omeprazole",
    methods: ["oral"],
  },
  {
    key: "cetirizine",
    displayName: "Cetirizine (Zyrtec)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "cetirizine",
    methods: ["oral"],
  },
  {
    key: "loratadine",
    displayName: "Loratadine (Claritin)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "loratadine",
    methods: ["oral"],
  },

  // ── Common supplements ─────────────────────────────────────────────────────
  {
    key: "vitamin-d3",
    displayName: "Vitamin D3",
    isCompound: false,
    defaultDoseUnit: "IU",
    selfIngredientKey: "vitamin-d3",
    methods: ["oral"],
  },
  {
    key: "vitamin-d3-k2",
    displayName: "Vitamin D3 + K2",
    isCompound: true,
    defaultDoseUnit: null,
    methods: ["oral"],
    ingredients: [
      { key: "vitamin-d3", name: "Vitamin D3", amountPerServing: 5000, unit: "IU" },
      { key: "vitamin-k2-mk7", name: "Vitamin K2 (MK-7)", amountPerServing: 100, unit: "mcg" },
    ],
  },
  {
    key: "vitamin-k2",
    displayName: "Vitamin K2 (MK-7)",
    isCompound: false,
    defaultDoseUnit: "mcg",
    selfIngredientKey: "vitamin-k2-mk7",
    methods: ["oral"],
  },
  {
    key: "vitamin-c",
    displayName: "Vitamin C",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "vitamin-c",
    methods: ["oral"],
  },
  {
    key: "vitamin-b12",
    displayName: "Vitamin B12",
    isCompound: false,
    defaultDoseUnit: "mcg",
    selfIngredientKey: "vitamin-b12",
    methods: ["oral", "sublingual", "injection"],
  },
  {
    key: "magnesium-citrate",
    displayName: "Magnesium Citrate",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "magnesium-citrate",
    methods: ["oral"],
  },
  {
    key: "magnesium-glycinate",
    displayName: "Magnesium Glycinate",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "magnesium-glycinate",
    methods: ["oral"],
  },
  {
    key: "magnesium-l-threonate",
    displayName: "Magnesium L-Threonate",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "magnesium-l-threonate",
    methods: ["oral"],
  },
  {
    key: "magnesium-malate",
    displayName: "Magnesium Malate",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "magnesium-malate",
    methods: ["oral"],
  },
  {
    key: "calcium",
    displayName: "Calcium",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "calcium",
    methods: ["oral"],
  },
  {
    key: "iron",
    displayName: "Iron",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "iron",
    methods: ["oral"],
  },
  {
    key: "zinc",
    displayName: "Zinc",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "zinc",
    methods: ["oral"],
  },
  {
    key: "fish-oil",
    displayName: "Fish Oil (Omega-3)",
    isCompound: true,
    defaultDoseUnit: null,
    methods: ["oral"],
    ingredients: [
      { key: "epa", name: "EPA", amountPerServing: 300, unit: "mg" },
      { key: "dha", name: "DHA", amountPerServing: 200, unit: "mg" },
    ],
  },
  {
    key: "coq10",
    displayName: "CoQ10 (Ubiquinol)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "coq10",
    methods: ["oral"],
  },
  {
    key: "nac",
    displayName: "NAC (N-Acetyl Cysteine)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "nac",
    methods: ["oral"],
  },
  {
    key: "creatine-mono",
    displayName: "Creatine Monohydrate",
    isCompound: false,
    defaultDoseUnit: "g",
    selfIngredientKey: "creatine-mono",
    methods: ["oral"],
  },
  {
    key: "collagen-peptides",
    displayName: "Collagen Peptides",
    isCompound: false,
    defaultDoseUnit: "g",
    selfIngredientKey: "collagen-peptides",
    methods: ["oral"],
  },
  {
    key: "caffeine",
    displayName: "Caffeine",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "caffeine",
    methods: ["oral"],
  },
  {
    key: "nmn",
    displayName: "NMN (Nicotinamide Mononucleotide)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "nmn",
    methods: ["oral", "sublingual"],
  },

  // ── Adaptogens & botanicals ────────────────────────────────────────────────
  {
    key: "ashwagandha",
    displayName: "Ashwagandha",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "ashwagandha",
    methods: ["oral"],
  },
  {
    key: "rhodiola-rosea",
    displayName: "Rhodiola Rosea",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "rhodiola-rosea",
    methods: ["oral"],
  },
  {
    key: "berberine",
    displayName: "Berberine",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "berberine",
    methods: ["oral"],
  },
  {
    key: "tongkat-ali",
    displayName: "Tongkat Ali",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "tongkat-ali",
    methods: ["oral"],
  },
  {
    key: "apigenin",
    displayName: "Apigenin",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "apigenin",
    methods: ["oral"],
  },
  {
    key: "turmeric",
    displayName: "Turmeric (Curcumin)",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "turmeric",
    methods: ["oral"],
  },
  {
    key: "resveratrol",
    displayName: "Resveratrol",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "resveratrol",
    methods: ["oral"],
  },

  // ── Amino acids & nootropics ───────────────────────────────────────────────
  {
    key: "l-theanine",
    displayName: "L-Theanine",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "l-theanine",
    methods: ["oral"],
  },
  {
    key: "alpha-gpc",
    displayName: "Alpha GPC",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "alpha-gpc",
    methods: ["oral"],
  },
  {
    key: "acetyl-l-carnitine",
    displayName: "Acetyl L-Carnitine",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "acetyl-l-carnitine",
    methods: ["oral"],
  },
  {
    key: "inositol",
    displayName: "Inositol",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "inositol",
    methods: ["oral"],
  },
  {
    key: "l-glutamine",
    displayName: "L-Glutamine",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "l-glutamine",
    methods: ["oral"],
  },
  {
    key: "tyrosine",
    displayName: "Tyrosine",
    isCompound: false,
    defaultDoseUnit: "mg",
    selfIngredientKey: "tyrosine",
    methods: ["oral"],
  },

  // ── Compounds ──────────────────────────────────────────────────────────────
  {
    key: "preworkout-generic",
    displayName: "Pre-Workout (Generic)",
    isCompound: true,
    defaultDoseUnit: null,
    methods: ["oral"],
    ingredients: [
      { key: "caffeine", name: "Caffeine", amountPerServing: 200, unit: "mg" },
      { key: "beta-alanine", name: "Beta-Alanine", amountPerServing: 3200, unit: "mg" },
      { key: "l-citrulline", name: "L-Citrulline", amountPerServing: 6000, unit: "mg" },
      { key: "creatine", name: "Creatine Monohydrate", amountPerServing: 3000, unit: "mg" },
    ],
  },
];
