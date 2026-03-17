/**
 * One-off migration: move all workout data from the custom "Preacher Curl"
 * exercise to the new canonical `preacherCurl` built-in exercise, then
 * delete the custom exercise record.
 *
 * Usage:
 *   npx tsx scripts/migrate-preacher-curl-to-canonical.ts
 */

import { prisma } from "../lib/db/prisma";

const CUSTOM_EXERCISE_ID = "8de364e4-7721-417a-bfce-2f4a28f7538a";
const CANONICAL_KEY = "preacherCurl";

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
    // 1. Re-key all workout exercise rows
    const workoutResult = await tx.gymWorkoutExercise.updateMany({
      where: { exerciseKey: oldKey },
      data: { exerciseKey: CANONICAL_KEY },
    });
    console.log(`  Updated ${workoutResult.count} workout exercise rows`);

    // 2. Re-key user exercise stats
    const statResult = await tx.gymUserExerciseStat.updateMany({
      where: { exerciseKey: oldKey },
      data: { exerciseKey: CANONICAL_KEY },
    });
    console.log(`  Updated ${statResult.count} exercise stat rows`);

    // 3. Re-key user exercise defaults
    const defaultResult = await tx.gymUserExerciseDefault.updateMany({
      where: { exerciseKey: oldKey },
      data: { exerciseKey: CANONICAL_KEY },
    });
    console.log(`  Updated ${defaultResult.count} exercise default rows`);

    // 4. Delete the custom exercise (cascades targets, variation supports, overrides, effects)
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
