/**
 * Remove USDA foundation foods with missing or non-positive calorie values.
 *
 * Usage:
 *   npx tsx scripts/remove-foundation-without-calories.ts
 */

import { Prisma } from "@prisma/client";
import { prisma } from "../lib/db/prisma";

const INVALID_CALORIES_SQL = Prisma.sql`
  COALESCE(
    CASE
      WHEN jsonb_typeof("nutrients"->'calories') = 'number'
        THEN ("nutrients"->>'calories')::double precision
      WHEN jsonb_typeof("nutrients"->'calories') = 'string'
        AND ("nutrients"->>'calories') ~ '^-?[0-9]+(\\.[0-9]+)?$'
        THEN ("nutrients"->>'calories')::double precision
      ELSE NULL
    END,
    0
  ) <= 0
`;

async function getInvalidCount(): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count
    FROM "NutritionFoundationFood"
    WHERE ${INVALID_CALORIES_SQL}
  `);

  return Number(rows[0]?.count ?? 0n);
}

async function main() {
  const beforeCount = await getInvalidCount();

  const deleted = await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "NutritionFoundationFood"
    WHERE ${INVALID_CALORIES_SQL}
  `);

  const afterCount = await getInvalidCount();

  console.log(`Invalid calorie rows before delete: ${beforeCount}`);
  console.log(`Rows deleted: ${deleted}`);
  console.log(`Invalid calorie rows after delete: ${afterCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
