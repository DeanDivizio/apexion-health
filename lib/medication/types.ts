export interface SubstanceVariantView {
  id: string;
  key: string;
  label: string;
  deliveryMethodId: string | null;
}

export interface SubstanceIngredientView {
  id: string;
  ingredientKey: string;
  ingredientName: string;
  amountPerServing: number;
  unit: string;
}

export interface SubstanceDeliveryMethodView {
  id: string;
  key: string;
  label: string;
}

export interface SubstanceCatalogItemView {
  id: string;
  displayName: string;
  isCompound: boolean;
  defaultDoseUnit: string | null;
  selfIngredientKey: string | null;
  brand: string | null;
  notes: string | null;
  methods: SubstanceDeliveryMethodView[];
  variants: SubstanceVariantView[];
  ingredients: SubstanceIngredientView[];
}

export interface MedicationDraftItem {
  substanceId: string;
  snapshotName: string;
  doseValue: number | null;
  doseUnit: string | null;
  compoundServings: number | null;
  deliveryMethodId: string | null;
  variantId: string | null;
  injectionDepth: string | null;
}

export interface SubstanceLogValues {
  doseValue: number | null;
  doseUnit: string;
  compoundServings: number | null;
  deliveryMethodId: string | null;
  variantId: string | null;
  injectionDepth: string | null;
}

export interface MedicationPresetView {
  id: string;
  name: string;
  items: MedicationDraftItem[];
}

export interface MedicationBootstrap {
  substances: SubstanceCatalogItemView[];
  deliveryMethods: SubstanceDeliveryMethodView[];
  presets: MedicationPresetView[];
}
