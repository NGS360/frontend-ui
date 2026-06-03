import { Database, Folder, User } from "lucide-react"

export const entityMeta = {
  project: { icon: Folder, colorClass: "text-accent2" },
  run: { icon: Database, colorClass: "text-accent3" },
  user: { icon: User, colorClass: "text-accent4" },
} as const

export const entityIcons = {
  project: Folder,
  run: Database,
  user: User,
} as const
