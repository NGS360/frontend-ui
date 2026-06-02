import { Database, Folder } from "lucide-react"

export const entityMeta = {
  project: { icon: Folder, colorClass: "text-accent2" },
  run: { icon: Database, colorClass: "text-accent3" },
} as const

export const entityIcons = {
  project: Folder,
  run: Database,
} as const
