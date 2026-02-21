import { prisma } from "../lib/db/prisma";
import {
  DEFAULT_DELIVERY_METHODS,
  DEFAULT_SUBSTANCES,
} from "../lib/medication/catalog";

async function main() {
  // ── 1. Upsert delivery methods ──────────────────────────────────────────────
  const methodIdByKey = new Map<string, string>();

  for (const method of DEFAULT_DELIVERY_METHODS) {
    const row = await prisma.substanceDeliveryMethod.upsert({
      where: { key: method.key },
      create: { key: method.key, label: method.label },
      update: { label: method.label },
    });
    methodIdByKey.set(method.key, row.id);
  }

  console.log(
    `Upserted ${DEFAULT_DELIVERY_METHODS.length} delivery methods.`,
  );

  // ── 2. Upsert substances ───────────────────────────────────────────────────
  let substanceCount = 0;
  let variantCount = 0;
  let ingredientCount = 0;
  let methodLinkCount = 0;

  for (const def of DEFAULT_SUBSTANCES) {
    const substance = await prisma.substance.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
        displayName: def.displayName,
        isCompound: def.isCompound,
        defaultDoseUnit: def.defaultDoseUnit,
        selfIngredientKey: def.selfIngredientKey ?? null,
      },
      update: {
        displayName: def.displayName,
        isCompound: def.isCompound,
        defaultDoseUnit: def.defaultDoseUnit,
        selfIngredientKey: def.selfIngredientKey ?? null,
      },
    });
    substanceCount++;

    // ── Method links ────────────────────────────────────────────────────────
    for (const methodKey of def.methods) {
      const methodId = methodIdByKey.get(methodKey);
      if (!methodId) {
        console.warn(
          `  ⚠ Unknown method key "${methodKey}" on substance "${def.key}" – skipped`,
        );
        continue;
      }

      await prisma.substanceMethodLink.upsert({
        where: {
          substanceId_deliveryMethodId: {
            substanceId: substance.id,
            deliveryMethodId: methodId,
          },
        },
        create: {
          substanceId: substance.id,
          deliveryMethodId: methodId,
        },
        update: {},
      });
      methodLinkCount++;
    }

    // ── Variants ────────────────────────────────────────────────────────────
    if (def.variants) {
      for (const v of def.variants) {
        const variantMethodId = v.deliveryMethodKey
          ? methodIdByKey.get(v.deliveryMethodKey) ?? null
          : null;

        await prisma.substanceVariant.upsert({
          where: {
            substanceId_key: {
              substanceId: substance.id,
              key: v.key,
            },
          },
          create: {
            substanceId: substance.id,
            key: v.key,
            label: v.label,
            deliveryMethodId: variantMethodId,
          },
          update: {
            label: v.label,
            deliveryMethodId: variantMethodId,
          },
        });
        variantCount++;
      }
    }

    // ── Ingredients (compounds) ─────────────────────────────────────────────
    if (def.ingredients) {
      for (const ing of def.ingredients) {
        await prisma.substanceIngredient.upsert({
          where: {
            substanceId_ingredientKey: {
              substanceId: substance.id,
              ingredientKey: ing.key,
            },
          },
          create: {
            substanceId: substance.id,
            ingredientKey: ing.key,
            ingredientName: ing.name,
            amountPerServing: ing.amountPerServing,
            unit: ing.unit,
          },
          update: {
            ingredientName: ing.name,
            amountPerServing: ing.amountPerServing,
            unit: ing.unit,
          },
        });
        ingredientCount++;
      }
    }
  }

  console.log(
    [
      `Seeded substance catalog:`,
      `  ${substanceCount} substances`,
      `  ${methodLinkCount} method links`,
      `  ${variantCount} variants`,
      `  ${ingredientCount} ingredients`,
    ].join("\n"),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
