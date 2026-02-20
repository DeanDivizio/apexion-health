# Compound Supplement Defaults

Compounds are substances whose dose-relevant information lives at the ingredient level rather than at a single unit. Each entry below documents why a particular ingredient breakdown was chosen as the catalog default.

It is important to note that while we believe these are sensible defaults, if you as a user need something different, Apexion provides the ability to customize *your* defaults as well as add custom suppplements to accomodate variations (or missing products). We highly encourage you to make use of this feature where needed to preserve the integrity and accuracy of your health data.

---

## Fish Oil (Omega-3)

**Catalog key:** `fish-oil`  
**Ingredients:** EPA 300 mg · DHA 200 mg

### Category Justification

Fish oil supplements are labeled and clinically discussed in terms of EPA and DHA content, not raw oil mass. Modeling it as a compound lets users track the actual active constituents rather than the less meaningful total oil weight.

### Default Ingredient and Dose Justification

This is the per-softgel content of the widely available concentrated 1,000 mg fish oil softgel — the most common formulation sold under major supplement brands. The non-concentrated standard softgel delivers only ~180/120 mg, but concentrated formulations are more likely to be preferred by Apexion's target audience therefore, they're the default.

| Formulation | EPA | DHA | Combined |
|---|---|---|---|
| Standard 1,000 mg softgel | 180 mg | 120 mg | 300 mg |
| **Concentrated 1,000 mg softgel (catalog default)** | **300 mg** | **200 mg** | **500 mg** |

The 3:2 EPA:DHA ratio is consistent across most standard formulations and is preserved here.

### References

**Product labels (300mg EPA / 200mg DHA per softgel)**

- [NLM DailyMed — A2A Omega-3 Fish Oil 1000mg](https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=12fc7c65-4c95-4681-9a16-3e3226a601e1&type=display) — FDA-registered label
- [NLM DailyMed — Ultra Omega 3 (Liberty Bioscience)](https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=35d197e8-47c3-4fe7-98b6-e462b8cfb7e4) — FDA-registered label
- [Swanson Super EPA](https://www.swansonvitamins.com/p/swanson-efas-super-epa-100-sgels) — retail product; explicitly labeled as "300/200"

**Why EPA+DHA content matters more than total oil weight**

- [Assadourian et al., *JAMA Cardiology* 2023 (PMC10448371)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10448371/) — cross-sectional study of 2,819 fish oil supplements finding "significant heterogeneity exists in the daily dose of EPA and DHA in available supplements, leading to potential variability in safety and efficacy"; directly supports tracking EPA+DHA rather than total oil mass

---

## Vitamin D3 + K2

**Catalog key:** `vitamin-d3-k2`  
**Ingredients:** Vitamin D3 5,000 IU · Vitamin K2 (MK-7) 100 mcg

### Category Justification

D3+K2 is cataloged as a compound — distinct from the standalone `vitamin-d3` entry — because it is a meaningfully different product both biochemically and commercially. Vitamin D3 (cholecalciferol) substantially increases intestinal calcium absorption. Vitamin K2 (menaquinone-7, MK-7) activates the proteins osteocalcin and matrix Gla protein (MGP), which direct absorbed calcium into bone mineral and inhibit its deposition in arterial walls. The two vitamins therefore work synergistically: D3 provides the calcium signal, K2 determines where it goes. A user logging a D3+K2 capsule is taking a fundamentally different intervention than a user logging D3 alone, and both the D3 dose and the K2 dose are independently meaningful for health tracking.

The standalone `vitamin-d3` entry is preserved for users who supplement D3 without K2.

### Default Ingredient and Dose Justification

**D3 — 5,000 IU**

The most common capsule strength in dedicated D3+K2 combination products sold by major supplement brands is 5,000 IU. Lower-dose combo products (1,000 IU / 45 mcg) exist but are more common in mainstream multivitamins rather than targeted D3+K2 supplements. Apexion's target audience is more likely to purchase a dedicated D3+K2 product, making 5,000 IU the more representative default.

**K2 — 100 mcg as MK-7**

MK-7 (menaquinone-7) is the dominant K2 form in dedicated supplements due to its long half-life (~3 days vs. ~1–2 hours for MK-4), which produces more stable serum levels from a once-daily dose. 100 mcg is the near-universal amount paired with 5,000 IU D3 across the major brands surveyed below.

| Formulation | D3 | K2 (MK-7) | Source |
|---|---|---|---|
| Sports Research D3+K2 | 5,000 IU | 100 mcg | Retail label |
| Doctor's Best D3+K2 | 5,000 IU | 100 mcg | Retail label |
| Life Extension D3+K2 | 5,000 IU | 100 mcg | Retail label |
| **Catalog default** | **5,000 IU** | **100 mcg** | — |

### References

**Synergy and mechanistic rationale**

- [Maresz, *Integrative Medicine* 2015 (PMC4566462)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4566462/) — "Proper calcium metabolism requires both vitamins D and K"; reviews how K2 activates MGP and osteocalcin to direct calcium away from arteries and into bone
- [Schurgers et al., *Thrombosis and Haemostasis* 2007](https://pubmed.ncbi.nlm.nih.gov/17938798/) — demonstrates MK-7's superior bioavailability and prolonged half-life compared to MK-4, supporting once-daily dosing

**K2 form (MK-7 vs. MK-4)**

- [Sato et al., *Nutrition Journal* 2012 (PMC3502319)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3502319/) — pharmacokinetic comparison confirming MK-7 produces significantly higher and more sustained serum K2 levels than MK-4 at equivalent doses
