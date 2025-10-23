import { Users, Activity, MapPin, Package } from "lucide-react"
import { PawPrintIcon as Paw } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  people: Users,
  animals: Paw,
  places: MapPin,
  actions: Activity,
  objects: Package,
} as const

export const CATEGORY_COLORS: Record<string, string> = {
  people: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
  animals: "from-green-500/20 to-green-600/20 border-green-500/30",
  places: "from-amber-500/20 to-amber-600/20 border-amber-500/30",
  actions: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
  objects: "from-pink-500/20 to-pink-600/20 border-pink-500/30",
} as const
