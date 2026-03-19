## Default Macronutrient Ratio

Defaults location: `app/settings/nutrition/page.tsx`, `lib/settings/server/settingsService.ts`

### Default values

| Nutrient | % of Calories | Grams (2000 kcal) | kcal/g |
|----------|:------------:|:-----------------:|:------:|
| Protein  | 30%          | 150g              | 4      |
| Carbs    | 40%          | 200g              | 4      |
| Fat      | 30%          | 67g               | 9      |

Default calorie target: 2000 kcal (FDA Daily Reference Value).

### Rationale

The default ratio of **30% protein / 40% carbohydrate / 30% fat** is positioned at the
intersection of the USDA Acceptable Macronutrient Distribution Ranges (AMDRs) and
evidence-based recommendations for physically active adults.

- **Protein at 30%**: The AMDR for protein is 10–35% of total energy. A 30% target
  aligns with higher-protein recommendations for active individuals aiming to support
  muscle protein synthesis and satiety. The International Society of Sports Nutrition
  (ISSN) recommends 1.4–2.0 g/kg/day for exercising individuals, which for an 80 kg
  person at 2000 kcal is 112–160g (22–32% of calories).
- **Carbohydrate at 40%**: The AMDR for carbohydrate is 45–65%. Our 40% default is
  slightly below the lower bound to accommodate the higher protein allocation while
  still providing sufficient glycogen for training. For moderate exercisers, the ACSM
  recommends 3–5 g/kg/day, which for an 80 kg person is 240–400g (48–80% at 2000 kcal);
  our 200g default sits just below this for general health contexts.
- **Fat at 30%**: The AMDR for fat is 20–35%. A 30% target ensures adequate essential
  fatty acid intake and supports hormone production (particularly important for
  testosterone and other steroid hormones).

### Sources

- **USDA/HHS Dietary Guidelines for Americans, 2020–2025**
  - AMDRs: protein 10–35%, carbohydrate 45–65%, fat 20–35%
  - `https://www.dietaryguidelines.gov/`

- **Institute of Medicine (now National Academies) DRI Report**
  - Macronutrient AMDRs and Adequate Intakes
  - `https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids`

- **ISSN Position Stand: Protein and Exercise (Jäger et al., 2017)**
  - 1.4–2.0 g/kg/day protein for exercising individuals
  - `https://jissn.biomedcentral.com/articles/10.1186/s12970-017-0177-8`

- **ACSM Position Stand: Nutrition and Athletic Performance (Thomas et al., 2016)**
  - Carbohydrate: 3–12 g/kg/day depending on activity level
  - Fat: 20–35% of total energy
  - `https://pubmed.ncbi.nlm.nih.gov/26891166/`

- **FDA Daily Reference Values (2000 kcal basis)**
  - `https://www.fda.gov/food/nutrition-facts-label/daily-value-nutrition-and-supplement-facts-labels`

### Confidence

Medium-High. The AMDRs are well-established. The specific 30/40/30 split is a pragmatic
default for active adults; sedentary individuals may prefer closer to 20/50/30 or 25/50/25.
Users are encouraged to adjust based on their goals and professional guidance.

### Slider constraints

- **Minimum protein**: 10g (40 kcal) — below any reasonable recommendation
- **Minimum carbs**: 20g (80 kcal) — allows very low-carb but not zero
- **Minimum fat**: 15g (135 kcal) — essential fatty acid floor

These minimums prevent physiologically impossible or dangerous combinations while
allowing the user maximal flexibility.
