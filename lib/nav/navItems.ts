import {
  Apple,
  Dumbbell,
  Pill,
  CheckSquare,
  Activity,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";

export interface NavOption {
  key: string;
  href: string;
  icon: LucideIcon;
  label: string;
}

export const ALL_NAV_OPTIONS: NavOption[] = [
  { key: "meals", href: "/meals", icon: Apple, label: "Food" },
  { key: "gymsessions", href: "/gymsessions", icon: Dumbbell, label: "Gym" },
  { key: "meds", href: "/meds", icon: Pill, label: "Meds" },
  { key: "activities", href: "/activities", icon: CheckSquare, label: "Activities" },
  // { key: "biometrics", href: "/biometrics", icon: Activity, label: "Biometrics" },
  // { key: "labs", href: "/labs", icon: FlaskConical, label: "Labs" },
];

export const DEFAULT_NAV_KEYS = ["meals", "gymsessions", "meds"];

export const NAV_OPTIONS_BY_KEY = new Map(
  ALL_NAV_OPTIONS.map((o) => [o.key, o]),
);

export const STORAGE_KEY = "apexion:mobileNavItems";
