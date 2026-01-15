import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { prisma } from "../lib/db/prisma";

type LegacySet = {
  weight: number;
  reps: number;
  repsRight?: number | null;
  repRight?: number | null;
  effort?: number;
  duration?: number;
};

type LegacyExercise = {
  type?: "strength" | "cardio";
  exerciseType: string;
  sets?: LegacySet[];
  duration?: number;
  distance?: number;
  unit?: string;
  modifications?: {
    grip?: string;
    movementPlane?: string;
  };
};

type LegacySession = {
  startTime: string;
  endTime: string;
  exercises: LegacyExercise[];
};

type LegacyGymItem = {
  userID: string;
  date: string;
  data: LegacySession[];
};

type LegacyGymMeta = {
  userID: string;
  customExercises?: Array<{ group: string; items: string[] }>;
  exerciseData?: Record<
    string,
    {
      recordSet?: {
        date: string;
        weight: number;
        reps: number;
        repsRight?: number;
        totalVolume: number;
      };
      notes?: string;
    }
  >;
};

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;

if (!accessKeyId || !secretAccessKey || !region) {
  throw new Error("AWS credentials and region must be set in environment variables.");
}

const client = new DynamoDBClient({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

async function scanAll<T>(tableName: string): Promise<T[]> {
  const items: T[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const data = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey,
      }),
    );
    if (data.Items) {
      items.push(...(data.Items as T[]));
    }
    ExclusiveStartKey = data.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

function normalizeRepsRight(set: LegacySet): number | undefined {
  if (typeof set.repsRight === "number") return set.repsRight;
  if (typeof set.repRight === "number") return set.repRight;
  return undefined;
}

function mapLegacyVariation(modifications?: LegacyExercise["modifications"]) {
  if (!modifications) return [];
  const rows: Array<{ templateId: string; optionKey: string }> = [];

  if (modifications.grip) {
    const grip = modifications.grip === "rotatedNeutral" ? "neutral" : modifications.grip;
    if (grip) {
      rows.push({ templateId: "grip", optionKey: grip });
    }
  }

  if (modifications.movementPlane) {
    const planeMap: Record<string, string> = {
      normal: "flat",
      inclined: "incline",
      declined: "decline",
    };
    const mappedPlane = planeMap[modifications.movementPlane];
    if (mappedPlane) {
      rows.push({ templateId: "plane", optionKey: mappedPlane });
    }
  }

  return rows;
}

async function main() {
  const gymItems = await scanAll<LegacyGymItem>("Apexion-Gym");
  const metaItems = await scanAll<LegacyGymMeta>("Apexion-Gym_UserMeta");

  const repModeByExercise = new Map<string, "bilateral" | "dualUnilateral">();
  for (const item of gymItems) {
    for (const session of item.data ?? []) {
      for (const exercise of session.exercises ?? []) {
        if (exercise.type === "cardio") continue;
        const sets = exercise.sets ?? [];
        const hasRight = sets.some((set) => normalizeRepsRight(set) !== undefined);
        if (hasRight) {
          repModeByExercise.set(exercise.exerciseType, "dualUnilateral");
        } else if (!repModeByExercise.has(exercise.exerciseType)) {
          repModeByExercise.set(exercise.exerciseType, "bilateral");
        }
      }
    }
  }

  for (const meta of metaItems) {
    for (const group of meta.customExercises ?? []) {
      for (const item of group.items ?? []) {
        const repMode = repModeByExercise.get(item) ?? "bilateral";
        await prisma.gymCustomExercise.upsert({
          where: {
            userId_key: {
              userId: meta.userID,
              key: item,
            },
          },
          create: {
            userId: meta.userID,
            key: item,
            name: item,
            category: group.group,
            repMode,
          },
          update: {
            name: item,
            category: group.group,
            repMode,
          },
        });
      }
    }

    for (const [exerciseKey, stats] of Object.entries(meta.exerciseData ?? {})) {
      const recordSet = stats.recordSet;
      await prisma.gymUserExerciseStat.upsert({
        where: {
          userId_exerciseKey: {
            userId: meta.userID,
            exerciseKey,
          },
        },
        create: {
          userId: meta.userID,
          exerciseKey,
          prDateStr: recordSet?.date ?? null,
          prWeight: recordSet?.weight ?? null,
          prRepsBilateral: recordSet?.repsRight ? null : recordSet?.reps ?? null,
          prRepsLeft: recordSet?.repsRight ? recordSet?.reps ?? null : null,
          prRepsRight: recordSet?.repsRight ?? null,
          prTotalVolume: recordSet?.totalVolume ?? null,
          notes: stats.notes ?? null,
        },
        update: {
          prDateStr: recordSet?.date ?? null,
          prWeight: recordSet?.weight ?? null,
          prRepsBilateral: recordSet?.repsRight ? null : recordSet?.reps ?? null,
          prRepsLeft: recordSet?.repsRight ? recordSet?.reps ?? null : null,
          prRepsRight: recordSet?.repsRight ?? null,
          prTotalVolume: recordSet?.totalVolume ?? null,
          notes: stats.notes ?? null,
        },
      });
    }
  }

  for (const item of gymItems) {
    for (const session of item.data ?? []) {
      const createdSession = await prisma.gymWorkoutSession.create({
        data: {
          userId: item.userID,
          dateStr: item.date,
          startTimeStr: session.startTime,
          endTimeStr: session.endTime,
        },
      });

      for (const [exerciseIndex, exercise] of session.exercises.entries()) {
        const isCardio =
          exercise.type === "cardio" || (exercise.duration !== undefined && !exercise.sets);

        const createdExercise = await prisma.gymWorkoutExercise.create({
          data: {
            sessionId: createdSession.id,
            order: exerciseIndex,
            type: isCardio ? "cardio" : "strength",
            exerciseKey: exercise.exerciseType,
            durationMinutes: isCardio ? exercise.duration ?? null : null,
            distance: isCardio ? exercise.distance ?? null : null,
            distanceUnit: isCardio ? exercise.unit ?? null : null,
          },
        });

        if (!isCardio) {
          const repMode = repModeByExercise.get(exercise.exerciseType) ?? "bilateral";
          for (const [setIndex, set] of (exercise.sets ?? []).entries()) {
            const repsRight = normalizeRepsRight(set);
            await prisma.gymStrengthSet.create({
              data: {
                exerciseId: createdExercise.id,
                order: setIndex,
                weight: set.weight,
                effort: set.effort ?? null,
                durationSeconds: set.duration ?? null,
                repsBilateral: repMode === "bilateral" ? set.reps : null,
                repsLeft: repMode === "dualUnilateral" ? set.reps : null,
                repsRight: repMode === "dualUnilateral" ? repsRight ?? set.reps : null,
              },
            });
          }
        }

        const variationRows = mapLegacyVariation(exercise.modifications);
        if (variationRows.length > 0) {
          await prisma.gymWorkoutExerciseVariation.createMany({
            data: variationRows.map((row) => ({
              exerciseId: createdExercise.id,
              templateId: row.templateId,
              optionKey: row.optionKey,
            })),
          });
        }
      }
    }
  }
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
