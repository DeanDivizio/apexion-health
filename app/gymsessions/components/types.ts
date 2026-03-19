import type { WorkoutSession } from "@/lib/gym"

export type SessionWithId = WorkoutSession & {
  id: string
  linkedBiometricProviders?: string[]
}
