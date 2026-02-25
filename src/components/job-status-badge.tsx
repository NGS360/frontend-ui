import { cva } from "class-variance-authority"
import {
  CheckCircle,
  Clock,
  Loader2,
  PlayCircle,
  Send,
  XCircle,
  Zap,
} from "lucide-react"
import type { JobStatus } from "@/client"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const jobStatusVariants = cva(
  "inline-flex items-center font-semibold transition-colors",
  {
    variants: {
      status: {
        SUBMITTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800",
        PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800",
        RUNNABLE: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
        STARTING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800",
        RUNNING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border-purple-200 dark:border-purple-800",
        SUCCEEDED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
        FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
      },
      size: {
        default: "gap-1.5 px-2.5 py-0.5 text-xs",
        compact: "gap-1 px-1.5 py-0 text-[10px] leading-4",
      },
    },
    defaultVariants: {
      status: "PENDING",
      size: "default",
    },
  }
)

const getStatusIcon = (status: JobStatus, size: "default" | "compact") => {
  const iconClass = size === "compact" ? "w-3 h-3" : "w-3.5 h-3.5"
  
  switch (status) {
    case "SUBMITTED":
      return <Send className={iconClass} />
    case "PENDING":
      return <Clock className={iconClass} />
    case "RUNNABLE":
      return <Zap className={iconClass} />
    case "STARTING":
      return <PlayCircle className={iconClass} />
    case "RUNNING":
      return <Loader2 className={cn(iconClass, "animate-spin")} />
    case "SUCCEEDED":
      return <CheckCircle className={iconClass} />
    case "FAILED":
      return <XCircle className={iconClass} />
    default:
      return null
  }
}

interface JobStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: JobStatus
  size?: "default" | "compact"
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ 
  status, 
  size = "default",
  className,
  ...props 
}) => {
  return (
    <Badge
      className={cn(jobStatusVariants({ status, size }), className)}
      {...props}
    >
      {getStatusIcon(status, size)}
      <span>{status}</span>
    </Badge>
  )
}
