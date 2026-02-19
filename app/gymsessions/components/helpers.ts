import { calculateSetVolume, type ExerciseEntry, type RepCount, type WorkoutSession } from "@/lib/gym"

export function formatRepCount(reps: RepCount): string {
  if (reps.bilateral !== undefined) return `${reps.bilateral}`
  if (reps.left !== undefined && reps.right !== undefined) return `L${reps.left} / R${reps.right}`
  return "—"
}

export function parseSessionDateTime(session: WorkoutSession): number {
  const y = parseInt(session.date.slice(0, 4))
  const m = parseInt(session.date.slice(4, 6)) - 1
  const d = parseInt(session.date.slice(6, 8))

  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(session.startTime)
  if (!match) return new Date(y, m, d).getTime()

  let hour = parseInt(match[1])
  const min = parseInt(match[2])
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && hour !== 12) hour += 12
  if (ampm === "AM" && hour === 12) hour = 0

  return new Date(y, m, d, hour, min).getTime()
}

export function calcExerciseVolume(entry: ExerciseEntry): number {
  if (entry.type !== "strength") return 0
  return entry.sets.reduce((sum, s) => sum + calculateSetVolume(s), 0)
}

export function calcSessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce((sum, ex) => sum + calcExerciseVolume(ex), 0)
}

export function formatVolume(vol: number): string {
  if (vol === 0) return "—"
  return `${Math.round(vol).toLocaleString()} lbs`
}

export function spellOutDateShortYear(dateStr: string): string {
  const year = parseInt(dateStr.substring(0, 4), 10)
  const month = parseInt(dateStr.substring(4, 6), 10) - 1
  const day = parseInt(dateStr.substring(6, 8), 10)
  const date = new Date(year, month, day, 12, 0, 0)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthName = monthNames[date.getMonth()]
  const shortYear = String(year).slice(-2)
  return `${monthName}${monthName !== "May" ? "." : ""} ${day}, ${shortYear}`
}

export function dateStrToInputValue(dateStr: string): string {
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
}

export function inputValueToDateStr(value: string): string {
  return value.replace(/-/g, "")
}

export function timeStrToInputValue(timeStr: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr)
  if (!match) return "00:00"
  let hour = parseInt(match[1])
  const min = match[2]
  const ampm = match[3].toUpperCase()
  if (ampm === "PM" && hour !== 12) hour += 12
  if (ampm === "AM" && hour === 12) hour = 0
  return `${String(hour).padStart(2, "0")}:${min}`
}

export function inputValueToTimeStr(value: string): string {
  const [hourStr, min] = value.split(":")
  let hour = parseInt(hourStr)
  const ampm = hour >= 12 ? "PM" : "AM"
  if (hour === 0) hour = 12
  else if (hour > 12) hour -= 12
  return `${hour}:${min} ${ampm}`
}
