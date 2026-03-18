/**
 * One-off migration: move all workout data from the custom "Tricep Rope Pushdown"
 * exercise to the new canonical `tricepRopePushdown` built-in exercise, then
 * delete the custom exercise record.
 *
 * Usage:
 *   npx tsx --require dotenv/config scripts/migrate-rope-pushdown-to-canonical.ts
 */

import { prisma } from "../lib/db/prisma";

const CUSTOM_EXERCISE_ID = "6e5c40db-9d68-40f7-b72d-caa520e154a7";
const CANONICAL_KEY = "tricepRopePushdown";

async function main() {
  const customExercise = await prisma.gymCustomExercise.findUnique({
    where: { id: CUSTOM_EXERCISE_ID },
  });

  if (!customExercise) {
    console.log("Custom exercise not found — nothing to migrate.");
    return;
  }

  const oldKey = customExercise.key;
  console.log(`Found custom exercise: "${customExercise.name}" (key="${oldKey}")`);

  await prisma.$transaction(async (tx) => {
    const workoutResult = await tx.gymWorkoutExercise.updateMany({
      where: { exerciseKey: oldKey },
      data: { exerciseKey: CANONICAL_KEY },
    });
    console.log(`  Updated ${workoutResult.count} workout exercise rows`);

    const statResult = await tx.gymUserExerciseStat.updateMany({
      where: { exerciseKey: oldKey },
      data: { exerciseKey: CANONICAL_KEY },
    });
    console.log(`  Updated ${statResult.count} exercise stat rows`);

    const defaultResult = await tx.gymUserExerciseDefault.updateMany({
      where: { exerciseKey: oldKey },
      data: { exerciseKey: CANONICAL_KEY },
    });
    console.log(`  Updated ${defaultResult.count} exercise default rows`);

    await tx.gymCustomExercise.delete({
      where: { id: CUSTOM_EXERCISE_ID },
    });
    console.log(`  Deleted custom exercise "${customExercise.name}"`);
  });

  console.log("Migration complete.");
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
