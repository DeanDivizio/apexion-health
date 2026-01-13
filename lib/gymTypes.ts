export type StregnthExercise = {
    id: number;
    name: {
        camelCase: string;
        snakeCase: string;
    }
    category: "Upper" | "Lower" | "Core";
    primaryMuscleGroup: string;
    secondaryMuscleGroups?: string[];
}