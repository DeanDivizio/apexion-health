import "dotenv/config";
import { prisma } from "../lib/db/prisma";

// ─── Panel Definitions ──────────────────────────────────────────────────────

const PANELS = [
  { key: "cbc", displayName: "Complete Blood Count", sortOrder: 1 },
  { key: "cmp", displayName: "Comprehensive Metabolic Panel", sortOrder: 2 },
  { key: "lipid", displayName: "Lipid Panel", sortOrder: 3 },
  { key: "thyroid", displayName: "Thyroid Panel", sortOrder: 4 },
  { key: "hormones", displayName: "Hormones", sortOrder: 5 },
  { key: "iron", displayName: "Iron Studies", sortOrder: 6 },
  { key: "vitamins", displayName: "Vitamins", sortOrder: 7 },
  { key: "diabetes", displayName: "Diabetes / Glycemic", sortOrder: 8 },
  { key: "inflammation", displayName: "Inflammation Markers", sortOrder: 9 },
  { key: "liver", displayName: "Liver Function", sortOrder: 10 },
  { key: "kidney", displayName: "Kidney Function", sortOrder: 11 },
  { key: "other", displayName: "Other", sortOrder: 99 },
] as const;

// ─── Marker Definitions ─────────────────────────────────────────────────────

type MarkerDef = {
  key: string;
  canonicalName: string;
  unit: string;
  defaultRangeLow: number | null;
  defaultRangeHigh: number | null;
  aliases: string[];
  panels: string[];
};

const MARKERS: MarkerDef[] = [
  // ── Complete Blood Count ────────────────────────────────────────────────
  {
    key: "wbc",
    canonicalName: "White Blood Cell Count",
    unit: "x10^3/uL",
    defaultRangeLow: 3.4,
    defaultRangeHigh: 10.8,
    aliases: ["wbc", "white blood cells", "white blood cell", "white blood cell count", "leukocytes", "leukocyte count"],
    panels: ["cbc"],
  },
  {
    key: "rbc",
    canonicalName: "Red Blood Cell Count",
    unit: "x10^6/uL",
    defaultRangeLow: 4.14,
    defaultRangeHigh: 5.80,
    aliases: ["rbc", "red blood cells", "red blood cell", "red blood cell count", "erythrocytes", "erythrocyte count"],
    panels: ["cbc"],
  },
  {
    key: "hemoglobin",
    canonicalName: "Hemoglobin",
    unit: "g/dL",
    defaultRangeLow: 13.0,
    defaultRangeHigh: 17.7,
    aliases: ["hemoglobin", "hgb", "hb"],
    panels: ["cbc"],
  },
  {
    key: "hematocrit",
    canonicalName: "Hematocrit",
    unit: "%",
    defaultRangeLow: 37.5,
    defaultRangeHigh: 51.0,
    aliases: ["hematocrit", "hct"],
    panels: ["cbc"],
  },
  {
    key: "mcv",
    canonicalName: "MCV",
    unit: "fL",
    defaultRangeLow: 79,
    defaultRangeHigh: 97,
    aliases: ["mcv", "mean corpuscular volume", "mean cell volume"],
    panels: ["cbc"],
  },
  {
    key: "mch",
    canonicalName: "MCH",
    unit: "pg",
    defaultRangeLow: 26.6,
    defaultRangeHigh: 33.0,
    aliases: ["mch", "mean corpuscular hemoglobin", "mean cell hemoglobin", "mean cell haemoglobin"],
    panels: ["cbc"],
  },
  {
    key: "mchc",
    canonicalName: "MCHC",
    unit: "g/dL",
    defaultRangeLow: 31.5,
    defaultRangeHigh: 35.7,
    aliases: ["mchc", "mean corpuscular hemoglobin concentration", "mean cell hemoglobin concentration", "mean cell haemoglobin concentration"],
    panels: ["cbc"],
  },
  {
    key: "rdw",
    canonicalName: "RDW",
    unit: "%",
    defaultRangeLow: 11.6,
    defaultRangeHigh: 15.4,
    aliases: ["rdw", "red cell distribution width", "rdw-cv"],
    panels: ["cbc"],
  },
  {
    key: "platelet-count",
    canonicalName: "Platelet Count",
    unit: "x10^3/uL",
    defaultRangeLow: 150,
    defaultRangeHigh: 400,
    aliases: ["platelet count", "platelet", "platelets", "plt", "thrombocytes", "thrombocyte count"],
    panels: ["cbc"],
  },
  {
    key: "mpv",
    canonicalName: "MPV",
    unit: "fL",
    defaultRangeLow: 7.4,
    defaultRangeHigh: 10.4,
    aliases: ["mpv", "mean platelet volume"],
    panels: ["cbc"],
  },
  {
    key: "neutrophils-pct",
    canonicalName: "Neutrophils %",
    unit: "%",
    defaultRangeLow: 40,
    defaultRangeHigh: 74,
    aliases: ["neutrophils %", "neutrophils percent", "neut %", "segs %"],
    panels: ["cbc"],
  },
  {
    key: "neutrophils-abs",
    canonicalName: "Neutrophils Absolute",
    unit: "x10^3/uL",
    defaultRangeLow: 1.4,
    defaultRangeHigh: 7.0,
    aliases: ["neutrophils absolute", "neutrophils abs", "absolute neutrophils", "anc", "absolute neutrophil count"],
    panels: ["cbc"],
  },
  {
    key: "lymphocytes-pct",
    canonicalName: "Lymphocytes %",
    unit: "%",
    defaultRangeLow: 14,
    defaultRangeHigh: 46,
    aliases: ["lymphocytes %", "lymphocytes percent", "lymph %"],
    panels: ["cbc"],
  },
  {
    key: "lymphocytes-abs",
    canonicalName: "Lymphocytes Absolute",
    unit: "x10^3/uL",
    defaultRangeLow: 0.7,
    defaultRangeHigh: 3.1,
    aliases: ["lymphocytes absolute", "lymphocytes abs", "absolute lymphocytes"],
    panels: ["cbc"],
  },
  {
    key: "monocytes-pct",
    canonicalName: "Monocytes %",
    unit: "%",
    defaultRangeLow: 4,
    defaultRangeHigh: 12,
    aliases: ["monocytes %", "monocytes percent", "mono %"],
    panels: ["cbc"],
  },
  {
    key: "monocytes-abs",
    canonicalName: "Monocytes Absolute",
    unit: "x10^3/uL",
    defaultRangeLow: 0.1,
    defaultRangeHigh: 0.9,
    aliases: ["monocytes absolute", "monocytes abs", "absolute monocytes"],
    panels: ["cbc"],
  },
  {
    key: "eosinophils-pct",
    canonicalName: "Eosinophils %",
    unit: "%",
    defaultRangeLow: 0,
    defaultRangeHigh: 7,
    aliases: ["eosinophils %", "eosinophils percent", "eos %"],
    panels: ["cbc"],
  },
  {
    key: "eosinophils-abs",
    canonicalName: "Eosinophils Absolute",
    unit: "x10^3/uL",
    defaultRangeLow: 0.0,
    defaultRangeHigh: 0.4,
    aliases: ["eosinophils absolute", "eosinophils abs", "absolute eosinophils"],
    panels: ["cbc"],
  },
  {
    key: "basophils-pct",
    canonicalName: "Basophils %",
    unit: "%",
    defaultRangeLow: 0,
    defaultRangeHigh: 3,
    aliases: ["basophils %", "basophils percent", "baso %"],
    panels: ["cbc"],
  },
  {
    key: "basophils-abs",
    canonicalName: "Basophils Absolute",
    unit: "x10^3/uL",
    defaultRangeLow: 0.0,
    defaultRangeHigh: 0.2,
    aliases: ["basophils absolute", "basophils abs", "absolute basophils"],
    panels: ["cbc"],
  },
  {
    key: "nrbc",
    canonicalName: "Nucleated Red Blood Cells",
    unit: "%",
    defaultRangeLow: 0,
    defaultRangeHigh: 0,
    aliases: ["nrbc", "nucleated red blood cells", "nucleated red blood cells automated", "nucleated rbc", "nrbc automated", "nrbc %"],
    panels: ["cbc"],
  },

  // ── Comprehensive Metabolic Panel ───────────────────────────────────────
  {
    key: "glucose",
    canonicalName: "Glucose",
    unit: "mg/dL",
    defaultRangeLow: 65,
    defaultRangeHigh: 99,
    aliases: ["glucose", "fasting glucose", "blood glucose", "blood sugar"],
    panels: ["cmp", "diabetes"],
  },
  {
    key: "bun",
    canonicalName: "Blood Urea Nitrogen",
    unit: "mg/dL",
    defaultRangeLow: 6,
    defaultRangeHigh: 20,
    aliases: ["blood urea nitrogen", "bun", "urea nitrogen"],
    panels: ["cmp", "kidney"],
  },
  {
    key: "creatinine",
    canonicalName: "Creatinine",
    unit: "mg/dL",
    defaultRangeLow: 0.76,
    defaultRangeHigh: 1.27,
    aliases: ["creatinine", "creat", "serum creatinine"],
    panels: ["cmp", "kidney"],
  },
  {
    key: "egfr",
    canonicalName: "eGFR",
    unit: "mL/min/1.73m2",
    defaultRangeLow: 60,
    defaultRangeHigh: null,
    aliases: ["egfr", "estimated gfr", "estimated glomerular filtration rate", "glomerular filtration rate"],
    panels: ["cmp", "kidney"],
  },
  {
    key: "sodium",
    canonicalName: "Sodium",
    unit: "mmol/L",
    defaultRangeLow: 134,
    defaultRangeHigh: 144,
    aliases: ["sodium", "na", "serum sodium"],
    panels: ["cmp"],
  },
  {
    key: "potassium",
    canonicalName: "Potassium",
    unit: "mmol/L",
    defaultRangeLow: 3.5,
    defaultRangeHigh: 5.2,
    aliases: ["potassium", "k", "serum potassium"],
    panels: ["cmp"],
  },
  {
    key: "chloride",
    canonicalName: "Chloride",
    unit: "mmol/L",
    defaultRangeLow: 96,
    defaultRangeHigh: 106,
    aliases: ["chloride", "cl", "serum chloride"],
    panels: ["cmp"],
  },
  {
    key: "co2",
    canonicalName: "CO2 (Bicarbonate)",
    unit: "mmol/L",
    defaultRangeLow: 18,
    defaultRangeHigh: 29,
    aliases: ["co2", "bicarbonate", "carbon dioxide", "total co2", "hco3"],
    panels: ["cmp"],
  },
  {
    key: "calcium",
    canonicalName: "Calcium",
    unit: "mg/dL",
    defaultRangeLow: 8.7,
    defaultRangeHigh: 10.2,
    aliases: ["calcium", "ca", "serum calcium", "total calcium"],
    panels: ["cmp", "other"],
  },
  {
    key: "total-protein",
    canonicalName: "Total Protein",
    unit: "g/dL",
    defaultRangeLow: 6.0,
    defaultRangeHigh: 8.5,
    aliases: ["total protein", "protein total", "serum protein"],
    panels: ["cmp"],
  },
  {
    key: "albumin",
    canonicalName: "Albumin",
    unit: "g/dL",
    defaultRangeLow: 3.8,
    defaultRangeHigh: 4.9,
    aliases: ["albumin", "alb", "serum albumin"],
    panels: ["cmp"],
  },
  {
    key: "globulin",
    canonicalName: "Globulin",
    unit: "g/dL",
    defaultRangeLow: 1.5,
    defaultRangeHigh: 4.5,
    aliases: ["globulin", "total globulin"],
    panels: ["cmp"],
  },
  {
    key: "ag-ratio",
    canonicalName: "A/G Ratio",
    unit: "ratio",
    defaultRangeLow: 1.2,
    defaultRangeHigh: 2.2,
    aliases: ["a/g ratio", "albumin/globulin ratio", "ag ratio"],
    panels: ["cmp"],
  },
  {
    key: "total-bilirubin",
    canonicalName: "Total Bilirubin",
    unit: "mg/dL",
    defaultRangeLow: 0.0,
    defaultRangeHigh: 1.2,
    aliases: ["total bilirubin", "bilirubin total", "tbili", "t. bilirubin"],
    panels: ["cmp", "liver"],
  },
  {
    key: "direct-bilirubin",
    canonicalName: "Direct Bilirubin",
    unit: "mg/dL",
    defaultRangeLow: 0.0,
    defaultRangeHigh: 0.4,
    aliases: ["direct bilirubin", "bilirubin direct", "conjugated bilirubin", "dbili"],
    panels: ["liver"],
  },
  {
    key: "alp",
    canonicalName: "Alkaline Phosphatase",
    unit: "IU/L",
    defaultRangeLow: 44,
    defaultRangeHigh: 121,
    aliases: ["alkaline phosphatase", "alp", "alk phos", "alkaline phos"],
    panels: ["cmp", "liver"],
  },
  {
    key: "ast",
    canonicalName: "AST",
    unit: "IU/L",
    defaultRangeLow: 0,
    defaultRangeHigh: 40,
    aliases: ["ast", "aspartate aminotransferase", "sgot", "ast (sgot)"],
    panels: ["cmp", "liver"],
  },
  {
    key: "alt",
    canonicalName: "ALT",
    unit: "IU/L",
    defaultRangeLow: 0,
    defaultRangeHigh: 44,
    aliases: ["alt", "alanine aminotransferase", "sgpt", "alt (sgpt)"],
    panels: ["cmp", "liver"],
  },
  {
    key: "ggt",
    canonicalName: "GGT",
    unit: "IU/L",
    defaultRangeLow: 0,
    defaultRangeHigh: 65,
    aliases: ["ggt", "gamma-glutamyl transferase", "gamma gt", "gamma-glutamyltransferase"],
    panels: ["liver", "other"],
  },

  // ── Lipid Panel ─────────────────────────────────────────────────────────
  {
    key: "total-cholesterol",
    canonicalName: "Total Cholesterol",
    unit: "mg/dL",
    defaultRangeLow: 100,
    defaultRangeHigh: 199,
    aliases: ["total cholesterol", "cholesterol total", "cholesterol, total"],
    panels: ["lipid"],
  },
  {
    key: "ldl-cholesterol",
    canonicalName: "LDL Cholesterol",
    unit: "mg/dL",
    defaultRangeLow: 0,
    defaultRangeHigh: 99,
    aliases: ["ldl cholesterol", "ldl", "ldl-c", "ldl direct", "low density lipoprotein", "ldl cholesterol calc"],
    panels: ["lipid"],
  },
  {
    key: "hdl-cholesterol",
    canonicalName: "HDL Cholesterol",
    unit: "mg/dL",
    defaultRangeLow: 39,
    defaultRangeHigh: null,
    aliases: ["hdl cholesterol", "hdl", "hdl-c", "high density lipoprotein"],
    panels: ["lipid"],
  },
  {
    key: "triglycerides",
    canonicalName: "Triglycerides",
    unit: "mg/dL",
    defaultRangeLow: 0,
    defaultRangeHigh: 149,
    aliases: ["triglycerides", "trigs", "trig", "triglyceride"],
    panels: ["lipid"],
  },
  {
    key: "vldl-cholesterol",
    canonicalName: "VLDL Cholesterol",
    unit: "mg/dL",
    defaultRangeLow: 5,
    defaultRangeHigh: 40,
    aliases: ["vldl cholesterol", "vldl", "vldl calc", "very low density lipoprotein"],
    panels: ["lipid"],
  },

  // ── Thyroid Panel ───────────────────────────────────────────────────────
  {
    key: "tsh",
    canonicalName: "TSH",
    unit: "uIU/mL",
    defaultRangeLow: 0.45,
    defaultRangeHigh: 4.5,
    aliases: ["tsh", "thyroid stimulating hormone", "thyrotropin"],
    panels: ["thyroid"],
  },
  {
    key: "free-t4",
    canonicalName: "Free T4",
    unit: "ng/dL",
    defaultRangeLow: 0.82,
    defaultRangeHigh: 1.77,
    aliases: ["free t4", "free thyroxine", "ft4"],
    panels: ["thyroid"],
  },
  {
    key: "free-t3",
    canonicalName: "Free T3",
    unit: "pg/mL",
    defaultRangeLow: 2.0,
    defaultRangeHigh: 4.4,
    aliases: ["free t3", "free triiodothyronine", "ft3"],
    panels: ["thyroid"],
  },
  {
    key: "total-t4",
    canonicalName: "Total T4",
    unit: "ug/dL",
    defaultRangeLow: 4.5,
    defaultRangeHigh: 12.0,
    aliases: ["total t4", "thyroxine total", "t4 total"],
    panels: ["thyroid"],
  },
  {
    key: "total-t3",
    canonicalName: "Total T3",
    unit: "ng/dL",
    defaultRangeLow: 71,
    defaultRangeHigh: 180,
    aliases: ["total t3", "triiodothyronine total", "t3 total"],
    panels: ["thyroid"],
  },
  {
    key: "reverse-t3",
    canonicalName: "Reverse T3",
    unit: "ng/dL",
    defaultRangeLow: 9.2,
    defaultRangeHigh: 24.1,
    aliases: ["reverse t3", "rt3", "reverse triiodothyronine"],
    panels: ["thyroid"],
  },
  {
    key: "tpo-antibodies",
    canonicalName: "TPO Antibodies",
    unit: "IU/mL",
    defaultRangeLow: 0,
    defaultRangeHigh: 34,
    aliases: ["tpo antibodies", "thyroid peroxidase antibodies", "anti-tpo", "tpo ab"],
    panels: ["thyroid"],
  },
  {
    key: "thyroglobulin-antibodies",
    canonicalName: "Thyroglobulin Antibodies",
    unit: "IU/mL",
    defaultRangeLow: 0.0,
    defaultRangeHigh: 0.9,
    aliases: ["thyroglobulin antibodies", "anti-thyroglobulin", "tg antibodies", "tgab"],
    panels: ["thyroid"],
  },

  // ── Hormones ────────────────────────────────────────────────────────────
  {
    key: "total-testosterone",
    canonicalName: "Total Testosterone",
    unit: "ng/dL",
    defaultRangeLow: 264,
    defaultRangeHigh: 916,
    aliases: ["total testosterone", "testosterone total", "testosterone, total"],
    panels: ["hormones"],
  },
  {
    key: "free-testosterone",
    canonicalName: "Free Testosterone",
    unit: "pg/mL",
    defaultRangeLow: 6.8,
    defaultRangeHigh: 21.5,
    aliases: ["free testosterone", "testosterone free", "testosterone, free", "free test"],
    panels: ["hormones"],
  },
  {
    key: "shbg",
    canonicalName: "SHBG",
    unit: "nmol/L",
    defaultRangeLow: 16.5,
    defaultRangeHigh: 55.9,
    aliases: ["shbg", "sex hormone binding globulin", "sex hormone-binding globulin"],
    panels: ["hormones"],
  },
  {
    key: "estradiol",
    canonicalName: "Estradiol",
    unit: "pg/mL",
    defaultRangeLow: 7.6,
    defaultRangeHigh: 42.6,
    aliases: ["estradiol", "e2", "estradiol (e2)", "17-beta estradiol"],
    panels: ["hormones"],
  },
  {
    key: "lh",
    canonicalName: "Luteinizing Hormone",
    unit: "mIU/mL",
    defaultRangeLow: 1.7,
    defaultRangeHigh: 8.6,
    aliases: ["luteinizing hormone", "lh"],
    panels: ["hormones"],
  },
  {
    key: "fsh",
    canonicalName: "Follicle Stimulating Hormone",
    unit: "mIU/mL",
    defaultRangeLow: 1.5,
    defaultRangeHigh: 12.4,
    aliases: ["follicle stimulating hormone", "fsh"],
    panels: ["hormones"],
  },
  {
    key: "dhea-s",
    canonicalName: "DHEA-Sulfate",
    unit: "ug/dL",
    defaultRangeLow: 71,
    defaultRangeHigh: 375,
    aliases: ["dhea-sulfate", "dhea-s", "dehydroepiandrosterone sulfate", "dhea sulfate"],
    panels: ["hormones"],
  },
  {
    key: "igf-1",
    canonicalName: "IGF-1",
    unit: "ng/mL",
    defaultRangeLow: 115,
    defaultRangeHigh: 355,
    aliases: ["igf-1", "insulin-like growth factor 1", "igf1", "somatomedin c"],
    panels: ["hormones"],
  },
  {
    key: "cortisol",
    canonicalName: "Cortisol",
    unit: "ug/dL",
    defaultRangeLow: 6.2,
    defaultRangeHigh: 19.4,
    aliases: ["cortisol", "serum cortisol", "cortisol am", "cortisol morning"],
    panels: ["hormones"],
  },
  {
    key: "prolactin",
    canonicalName: "Prolactin",
    unit: "ng/mL",
    defaultRangeLow: 4.0,
    defaultRangeHigh: 15.2,
    aliases: ["prolactin", "prl"],
    panels: ["hormones"],
  },

  // ── Iron Studies ────────────────────────────────────────────────────────
  {
    key: "iron",
    canonicalName: "Iron",
    unit: "ug/dL",
    defaultRangeLow: 38,
    defaultRangeHigh: 169,
    aliases: ["iron", "serum iron", "iron, serum"],
    panels: ["iron"],
  },
  {
    key: "tibc",
    canonicalName: "TIBC",
    unit: "ug/dL",
    defaultRangeLow: 250,
    defaultRangeHigh: 370,
    aliases: ["tibc", "total iron binding capacity", "total iron-binding capacity"],
    panels: ["iron"],
  },
  {
    key: "ferritin",
    canonicalName: "Ferritin",
    unit: "ng/mL",
    defaultRangeLow: 30,
    defaultRangeHigh: 400,
    aliases: ["ferritin", "serum ferritin"],
    panels: ["iron"],
  },
  {
    key: "transferrin-saturation",
    canonicalName: "Transferrin Saturation",
    unit: "%",
    defaultRangeLow: 15,
    defaultRangeHigh: 55,
    aliases: ["transferrin saturation", "iron saturation", "tsat", "% saturation"],
    panels: ["iron"],
  },

  // ── Vitamins ────────────────────────────────────────────────────────────
  {
    key: "vitamin-d-25oh",
    canonicalName: "Vitamin D, 25-Hydroxy",
    unit: "ng/mL",
    defaultRangeLow: 30,
    defaultRangeHigh: 100,
    aliases: ["vitamin d, 25-hydroxy", "vitamin d", "25-oh vitamin d", "25-hydroxyvitamin d", "25(oh)d", "vitamin d 25-oh"],
    panels: ["vitamins"],
  },
  {
    key: "vitamin-b12",
    canonicalName: "Vitamin B12",
    unit: "pg/mL",
    defaultRangeLow: 232,
    defaultRangeHigh: 1245,
    aliases: ["vitamin b12", "b12", "cobalamin", "cyanocobalamin"],
    panels: ["vitamins"],
  },
  {
    key: "folate",
    canonicalName: "Folate",
    unit: "ng/mL",
    defaultRangeLow: 2.7,
    defaultRangeHigh: 17.0,
    aliases: ["folate", "folic acid", "serum folate", "folate, serum"],
    panels: ["vitamins"],
  },

  // ── Diabetes / Glycemic ─────────────────────────────────────────────────
  {
    key: "hemoglobin-a1c",
    canonicalName: "Hemoglobin A1c",
    unit: "%",
    defaultRangeLow: 4.0,
    defaultRangeHigh: 5.6,
    aliases: ["hemoglobin a1c", "hba1c", "a1c", "glycated hemoglobin", "glycosylated hemoglobin", "hgb a1c"],
    panels: ["diabetes"],
  },
  {
    key: "fasting-insulin",
    canonicalName: "Fasting Insulin",
    unit: "uIU/mL",
    defaultRangeLow: 2.6,
    defaultRangeHigh: 24.9,
    aliases: ["fasting insulin", "insulin fasting", "insulin, fasting", "serum insulin"],
    panels: ["diabetes"],
  },
  {
    key: "homa-ir",
    canonicalName: "HOMA-IR",
    unit: "index",
    defaultRangeLow: null,
    defaultRangeHigh: 2.0,
    aliases: ["homa-ir", "homa ir", "homeostatic model assessment"],
    panels: ["diabetes"],
  },

  // ── Inflammation Markers ────────────────────────────────────────────────
  {
    key: "crp",
    canonicalName: "C-Reactive Protein",
    unit: "mg/L",
    defaultRangeLow: 0.0,
    defaultRangeHigh: 3.0,
    aliases: ["c-reactive protein", "crp", "c reactive protein"],
    panels: ["inflammation"],
  },
  {
    key: "hs-crp",
    canonicalName: "High-Sensitivity CRP",
    unit: "mg/L",
    defaultRangeLow: 0.0,
    defaultRangeHigh: 1.0,
    aliases: ["high-sensitivity crp", "hs-crp", "hs crp", "cardio crp", "high sensitivity c-reactive protein"],
    panels: ["inflammation"],
  },
  {
    key: "esr",
    canonicalName: "Erythrocyte Sedimentation Rate",
    unit: "mm/hr",
    defaultRangeLow: 0,
    defaultRangeHigh: 15,
    aliases: ["erythrocyte sedimentation rate", "esr", "sed rate", "sedimentation rate"],
    panels: ["inflammation"],
  },
  {
    key: "homocysteine",
    canonicalName: "Homocysteine",
    unit: "umol/L",
    defaultRangeLow: 0,
    defaultRangeHigh: 10.4,
    aliases: ["homocysteine", "homocysteine, plasma", "total homocysteine"],
    panels: ["inflammation"],
  },

  // ── Other ───────────────────────────────────────────────────────────────
  {
    key: "uric-acid",
    canonicalName: "Uric Acid",
    unit: "mg/dL",
    defaultRangeLow: 3.7,
    defaultRangeHigh: 8.6,
    aliases: ["uric acid", "urate", "serum uric acid"],
    panels: ["other"],
  },
  {
    key: "magnesium",
    canonicalName: "Magnesium",
    unit: "mg/dL",
    defaultRangeLow: 1.6,
    defaultRangeHigh: 2.6,
    aliases: ["magnesium", "mg", "serum magnesium", "magnesium, serum"],
    panels: ["other"],
  },
  {
    key: "phosphorus",
    canonicalName: "Phosphorus",
    unit: "mg/dL",
    defaultRangeLow: 2.5,
    defaultRangeHigh: 4.5,
    aliases: ["phosphorus", "phosphate", "serum phosphorus", "inorganic phosphorus"],
    panels: ["other"],
  },
  {
    key: "psa",
    canonicalName: "PSA",
    unit: "ng/mL",
    defaultRangeLow: 0,
    defaultRangeHigh: 4.0,
    aliases: ["psa", "prostate specific antigen", "prostate-specific antigen", "psa total"],
    panels: ["other"],
  },
  {
    key: "bun-creatinine-ratio",
    canonicalName: "BUN/Creatinine Ratio",
    unit: "ratio",
    defaultRangeLow: 8,
    defaultRangeHigh: 27,
    aliases: ["bun/creatinine ratio", "bun creatinine ratio", "bun/creat ratio"],
    panels: ["kidney"],
  },
];

// ─── Unit Conversions ───────────────────────────────────────────────────────

type ConversionDef = {
  markerKeys: string[];
  fromUnit: string;
  toUnit: string;
  factor: number;
};

const CONVERSIONS: ConversionDef[] = [
  { markerKeys: ["glucose"], fromUnit: "mg/dL", toUnit: "mmol/L", factor: 0.0555 },
  { markerKeys: ["total-cholesterol", "ldl-cholesterol", "hdl-cholesterol"], fromUnit: "mg/dL", toUnit: "mmol/L", factor: 0.02586 },
  { markerKeys: ["triglycerides"], fromUnit: "mg/dL", toUnit: "mmol/L", factor: 0.01129 },
  { markerKeys: ["total-testosterone"], fromUnit: "ng/dL", toUnit: "nmol/L", factor: 0.0347 },
  { markerKeys: ["free-testosterone"], fromUnit: "pg/mL", toUnit: "pmol/L", factor: 3.467 },
  { markerKeys: ["creatinine"], fromUnit: "mg/dL", toUnit: "umol/L", factor: 88.42 },
  { markerKeys: ["hemoglobin"], fromUnit: "g/dL", toUnit: "g/L", factor: 10 },
  { markerKeys: ["vitamin-d-25oh"], fromUnit: "ng/mL", toUnit: "nmol/L", factor: 2.496 },
  { markerKeys: ["vitamin-b12"], fromUnit: "pg/mL", toUnit: "pmol/L", factor: 0.7378 },
  { markerKeys: ["iron"], fromUnit: "ug/dL", toUnit: "umol/L", factor: 0.1791 },
  { markerKeys: ["calcium"], fromUnit: "mg/dL", toUnit: "mmol/L", factor: 0.2495 },
  { markerKeys: ["uric-acid"], fromUnit: "mg/dL", toUnit: "umol/L", factor: 59.48 },
];

// ─── Seed Logic ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding lab panels...");
  const panelMap = new Map<string, string>();
  for (const p of PANELS) {
    const panel = await prisma.labPanel.upsert({
      where: { key: p.key },
      update: { displayName: p.displayName, sortOrder: p.sortOrder },
      create: { key: p.key, displayName: p.displayName, sortOrder: p.sortOrder },
    });
    panelMap.set(p.key, panel.id);
  }
  console.log(`  ${PANELS.length} panels upserted.`);

  console.log("Seeding lab markers, aliases, and panel memberships...");
  let markerCount = 0;
  let aliasCount = 0;
  let panelLinkCount = 0;

  for (const m of MARKERS) {
    const marker = await prisma.labMarker.upsert({
      where: { key: m.key },
      update: {
        canonicalName: m.canonicalName,
        unit: m.unit,
        defaultRangeLow: m.defaultRangeLow,
        defaultRangeHigh: m.defaultRangeHigh,
      },
      create: {
        key: m.key,
        canonicalName: m.canonicalName,
        unit: m.unit,
        defaultRangeLow: m.defaultRangeLow,
        defaultRangeHigh: m.defaultRangeHigh,
      },
    });
    markerCount++;

    const allAliases = [
      m.canonicalName.toLowerCase(),
      ...m.aliases.map((a) => a.toLowerCase()),
    ];
    const uniqueAliases = [...new Set(allAliases)];

    for (const alias of uniqueAliases) {
      try {
        await prisma.labMarkerAlias.upsert({
          where: { alias },
          update: { markerId: marker.id },
          create: { markerId: marker.id, alias, source: "seed" },
        });
        aliasCount++;
      } catch {
        console.warn(`  Alias "${alias}" already mapped to a different marker, skipping.`);
      }
    }

    for (const panelKey of m.panels) {
      const panelId = panelMap.get(panelKey);
      if (!panelId) {
        console.warn(`  Panel key "${panelKey}" not found, skipping link for ${m.key}.`);
        continue;
      }
      await prisma.labPanelMarker.upsert({
        where: { panelId_markerId: { panelId, markerId: marker.id } },
        update: {},
        create: { panelId, markerId: marker.id },
      });
      panelLinkCount++;
    }
  }
  console.log(`  ${markerCount} markers, ${aliasCount} aliases, ${panelLinkCount} panel links upserted.`);

  console.log("Seeding unit conversions (bidirectional)...");
  let conversionCount = 0;
  for (const conv of CONVERSIONS) {
    for (const markerKey of conv.markerKeys) {
      const marker = await prisma.labMarker.findUnique({ where: { key: markerKey } });
      if (!marker) {
        console.warn(`  Marker "${markerKey}" not found for conversion, skipping.`);
        continue;
      }

      await prisma.labUnitConversion.upsert({
        where: {
          markerId_fromUnit_toUnit: {
            markerId: marker.id,
            fromUnit: conv.fromUnit,
            toUnit: conv.toUnit,
          },
        },
        update: { factor: conv.factor },
        create: {
          markerId: marker.id,
          fromUnit: conv.fromUnit,
          toUnit: conv.toUnit,
          factor: conv.factor,
        },
      });
      conversionCount++;

      const reverseFactor = 1 / conv.factor;
      await prisma.labUnitConversion.upsert({
        where: {
          markerId_fromUnit_toUnit: {
            markerId: marker.id,
            fromUnit: conv.toUnit,
            toUnit: conv.fromUnit,
          },
        },
        update: { factor: reverseFactor },
        create: {
          markerId: marker.id,
          fromUnit: conv.toUnit,
          toUnit: conv.fromUnit,
          factor: reverseFactor,
        },
      });
      conversionCount++;
    }
  }
  console.log(`  ${conversionCount} conversions upserted.`);

  console.log("Lab seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
