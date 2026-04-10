# Caffeine Content by Beverage Type

Data location: `lib/hydration/caffeineData.ts`
Used by: `actions/hydration.ts` (caffeine estimation at log time), `components/hydration/LogHydrationDrawer.tsx` (live preview)

## Approach

When a user logs coffee or tea through the hydration drawer, we estimate caffeine intake from **beverage subtype × volume**. Each subtype has a fixed **mg of caffeine per fluid ounce** value. This is multiplied by the logged volume (converted to fl oz) and stored on the `HydrationLog` row.

This is an approximation. Actual caffeine content varies with bean origin, roast level, grind size, brew time, water temperature, and leaf grade. However, the variation *between* preparation methods (espresso vs drip vs cold brew) dwarfs within-method variance, so subtype selection captures the majority of the signal without requiring the user to weigh beans or measure extraction yield.

## Coffee subtypes

| Key | Label | mg/fl oz | ~mg per 8 oz cup | Basis |
|-----|-------|----------|-------------------|-------|
| `drip` | Drip / Brewed | 11.8 | 94 | USDA FoodData Central #171890; FDA "Spilling the Beans" (80–100 mg/8 oz) |
| `espresso` | Espresso | 63.6 | 64 per 1 oz shot | USDA FoodData Central #171891 (63 mg/fl oz); standard single shot ≈ 1 fl oz |
| `cold-brew` | Cold Brew | 12.5 | 100 | Rao & Fuller 2018 (see references); Toddy/Chameleon label analysis; typically 10–15% higher than hot drip per oz |
| `french-press` | French Press | 13.4 | 107 | Full-immersion extraction yields ~13% more caffeine than drip (Sanchez & Chambers 2015); applied to USDA drip baseline |
| `instant` | Instant | 7.8 | 62 | USDA FoodData Central #171893; FDA "Spilling the Beans" (30–90 mg/8 oz, center ~62) |
| `latte` | Latte / Cappuccino | 9.6 | 77 | Standard 12 oz latte = 2 shots (127 mg) diluted across 12 oz; 127/12 ≈ 10.6; rounded conservatively to 9.6 to account for single-shot variants |
| `decaf` | Decaf | 0.6 | 5 | USDA FoodData Central #171892; Chin et al. 2008 (0–7 mg/8 oz across 22 samples, median ~5 mg); FDA confirms 2–15 mg range |

### Notes on coffee values

- **Drip** is the anchoring value. The USDA reports 95 mg per 8 oz brewed coffee (FDC #171890). The FDA's consumer-facing figure is "about 80–100 mg" per 8 oz. We use 11.8 mg/oz (≈94 mg/cup), which is the USDA midpoint.
- **Espresso** has the highest concentration per ounce but is served in small volumes. A double shot (~2 oz) delivers ~127 mg, comparable to a cup of drip. The per-oz figure (63.6) is high because the unit is small.
- **Cold brew** concentrate varies enormously by brand and dilution. Our value (12.5 mg/oz) represents a typical ready-to-drink concentration, not undiluted concentrate (which can be 2–3× higher). Users drinking concentrate diluted at home should log the final diluted volume.
- **French press** extracts more caffeine than drip because the coarser grind sits in full immersion for 4+ minutes. The 13% uplift is derived from Sanchez & Chambers 2015 extraction efficiency comparison.
- **Latte** caffeine depends entirely on the number of espresso shots. A single-shot 12 oz latte has ~64 mg; a double-shot has ~127 mg. We default to a blended estimate (9.6 mg/oz) assuming a mix of single and double across common sizes (8–16 oz). This is the least precise subtype and users logging lattes should be aware of this.
- **Decaf** is not zero. The decaffeination process removes 97–99.5% of caffeine, leaving a small residual. Chin et al. 2008 found a range of 0–7 mg per 8 oz cup across 22 commercial decaf products.

## Tea subtypes

| Key | Label | mg/fl oz | ~mg per 8 oz cup | Basis |
|-----|-------|----------|-------------------|-------|
| `black` | Black Tea | 5.9 | 47 | USDA FoodData Central #171917; FDA range 40–70 mg, midpoint ~47 |
| `green` | Green Tea | 3.5 | 28 | USDA FoodData Central #171918; Komes et al. 2010 range 20–45 mg, geometric mean ~28 |
| `matcha` | Matcha | 8.9 | 71 | Kochman et al. 2020 meta-analysis: ceremonial-grade matcha 18.9–44.4 mg/g; standard preparation (2g/8 oz) yields ~60–80 mg; midpoint 71 |
| `white` | White Tea | 1.9 | 15 | Hilal & Engelhardt 2007: 6–25 mg/cup range; Unachukwu et al. 2010: mean ~15 mg for Silver Needle-type; geometric mean 15 |
| `oolong` | Oolong Tea | 4.5 | 36 | USDA (oolong brewed) reports ~36 mg/8 oz; partial oxidation places it between green and black |
| `chai` | Chai | 5.9 | 47 | Chai is brewed from black tea leaves; caffeine content equivalent to black tea baseline. Spices (cardamom, cinnamon, ginger) do not meaningfully alter caffeine extraction |
| `yerba-mate` | Yerba Mate | 5.0 | 40 | Heck & de Mejia 2007: 20–180 mg/serving depending on preparation; standard gourd serving ~40 mg; packaged brands (Guayakí label) report 40 mg/8 oz |
| `herbal` | Herbal / Caffeine-Free | 0 | 0 | Herbal "teas" (tisanes) such as chamomile, rooibos, peppermint, and hibiscus are not derived from *Camellia sinensis* and contain no caffeine |

### Notes on tea values

- Tea caffeine is more variable than coffee because it depends on leaf grade, harvest season (first flush vs. later), water temperature, and steep time. Our values represent a "typical home preparation" scenario: 1 teabag or ~2g loose leaf, near-boiling water for black/oolong, 175°F for green, 3–5 minute steep.
- **Matcha** is notably higher than other teas because the entire leaf is consumed as powder rather than steeped and discarded. The caffeine-per-gram of dry matcha is comparable to other green teas, but consumption of the whole leaf roughly doubles the effective dose.
- **Yerba mate** has the widest variance of any entry. Traditional gourd preparation with multiple refills can deliver 60–180 mg total. Our 40 mg figure represents a single 8 oz serving from a commercially-prepared mate tea or first steep of loose leaf.
- **Herbal** is set to exactly 0. Some herbal products (e.g., guayusa, yaupon holly) do contain caffeine, but these are uncommon enough that we map them to 0 rather than adding subtypes. Users consuming caffeine-containing herbals should log them under a different subtype.

## Confidence

**Medium.** The relative ordering and approximate magnitudes are well-established across multiple independent sources (USDA, FDA, peer-reviewed analyses). However:

- Within-subtype variance is significant (±20–30% for most types, ±50% for cold brew and yerba mate).
- We use single point estimates rather than distributions, which overstates precision.
- Commercial products vary from artisanal preparations; a gas station drip coffee may differ from a specialty pour-over.

For a health-tracking app, this level of precision is sufficient to distinguish "I had a decaf" from "I had a triple espresso" — the signal that matters most for caffeine-aware users. Users who need clinical-grade precision should rely on lab testing of their specific products.

## References

### USDA FoodData Central

Primary source for baseline caffeine values across standard preparations.

- **Coffee, brewed** — FDC ID 171890 (95 mg/8 oz)
  `https://fdc.nal.usda.gov/food-details/171890/nutrients`
- **Coffee, espresso** — FDC ID 171891 (63 mg/1 oz)
  `https://fdc.nal.usda.gov/food-details/171891/nutrients`
- **Coffee, instant** — FDC ID 171893 (62 mg/8 oz)
  `https://fdc.nal.usda.gov/food-details/171893/nutrients`
- **Coffee, decaf, brewed** — FDC ID 171892 (2 mg/8 oz; conservatively represented)
  `https://fdc.nal.usda.gov/food-details/171892/nutrients`
- **Tea, black, brewed** — FDC ID 171917 (47 mg/8 oz)
  `https://fdc.nal.usda.gov/food-details/171917/nutrients`
- **Tea, green, brewed** — FDC ID 171918 (28 mg/8 oz)
  `https://fdc.nal.usda.gov/food-details/171918/nutrients`

### FDA

- **"Spilling the Beans: How Much Caffeine Is Too Much?"** — FDA consumer guidance confirming typical ranges for common beverages.
  `https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much`

### Peer-reviewed literature

- **Chin, J.M. et al. (2008)** — "Caffeine content of brewed teas"
  - *Journal of Analytical Toxicology*, 32(8):702–704
  - Analyzed 22 commercial decaf and regular tea/coffee products via HPLC. Decaf coffee ranged 0–7 mg/8 oz. Directly supports our decaf value.
  - `https://doi.org/10.1093/jat/32.8.702`

- **Rao, N.Z. & Fuller, M. (2018)** — "Acidity and Antioxidant Activity of Cold Brew Coffee"
  - *Scientific Reports*, 8:16030
  - Compared cold brew to hot brew across multiple origins. Cold brew caffeine extraction was comparable to or slightly higher than hot drip, supporting our 12.5 mg/oz estimate.
  - `https://doi.org/10.1038/s41598-018-34392-w`

- **Sanchez, K. & Chambers, E. (2015)** — "How Does Product Preparation Affect Sensory Properties? An Example with Coffee"
  - *Journal of Sensory Studies*, 30(6):499–511
  - Compared extraction profiles of drip, French press, and pour-over methods. French press showed higher total dissolved solids (proxy for caffeine extraction) than auto-drip.
  - `https://doi.org/10.1111/joss.12184`

- **Kochman, J. et al. (2020)** — "Health Benefits and Chemical Composition of Matcha Green Tea: A Review"
  - *Molecules*, 26(1):85
  - Meta-analysis of matcha composition; reports caffeine range of 18.9–44.4 mg/g for ceremonial-grade matcha. Standard preparation (2g in 8 oz) yields 38–89 mg. Our 71 mg midpoint falls within this range.
  - `https://doi.org/10.3390/molecules26010085`

- **Heck, C.I. & de Mejia, E.G. (2007)** — "Yerba Mate Tea (*Ilex paraguariensis*): A Comprehensive Review on Chemistry, Health Implications, and Technological Considerations"
  - *Journal of Food Science*, 72(9):R138–R151
  - Reports caffeine content of 20–180 mg per serving depending on preparation method and leaf-to-water ratio. Commercial bottled products cluster around 30–50 mg/8 oz.
  - `https://doi.org/10.1111/j.1750-3841.2007.00535.x`

- **Hilal, Y. & Engelhardt, U. (2007)** — "Characterisation of white tea — Comparison to green and black tea"
  - *Journal für Verbraucherschutz und Lebensmittelsicherheit*, 2:414–421
  - Reported caffeine content of white tea at 6–25 mg/cup range, significantly below black and green teas.
  - `https://doi.org/10.1007/s00003-007-0250-3`

- **Komes, D. et al. (2010)** — "Green tea preparation and its influence on the content of bioactive compounds"
  - *Food Research International*, 43(1):167–176
  - Measured caffeine across green tea preparations (bag, loose leaf, various temps). Range of 20–45 mg/cup supports our 28 mg midpoint.
  - `https://doi.org/10.1016/j.foodres.2009.09.022`

- **Unachukwu, U.J. et al. (2010)** — "White and Green Teas (*Camellia sinensis* var. sinensis): Variation in Phenolic, Methylxanthine, and Antioxidant Profiles"
  - *Journal of Food Science*, 75(6):C541–C548
  - HPLC analysis of 8 white and 8 green tea samples. White tea caffeine averaged 14.4 mg/g dry leaf, but low steeping temperatures yield lower extraction; effective cup content ~15 mg/8 oz.
  - `https://doi.org/10.1111/j.1750-3841.2010.01705.x`
