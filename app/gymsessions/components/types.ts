import type { WorkoutSession } from "@/lib/gym"

export type SessionWithId = WorkoutSession & {
  id: string
  notes?: string
  linkedBiometricProviders?: string[]
}
