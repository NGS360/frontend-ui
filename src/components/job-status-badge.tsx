import {  cva } from "class-variance-authority"
import {
  CheckCircle,
  Clock,
  ListChecks,
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
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      status: {
        Queued: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700",
        Submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-800",
        Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border-amber-200 dark:border-amber-800",
        Runnable: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200 border-cyan-200 dark:border-cyan-800",
        Starting: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800",
        Running: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border-purple-200 dark:border-purple-800",
        Succeeded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-800",
        Failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-800",
      },
    },
    defaultVariants: {
      status: "Pending",
    },
  }
)

const getStatusIcon = (status: JobStatus) => {
  const iconClass = "w-3.5 h-3.5"
  
  switch (status) {
    case "Queued":
      return <ListChecks className={iconClass} />
    case "Submitted":
      return <Send className={iconClass} />
    case "Pending":
      return <Clock className={iconClass} />
    case "Runnable":
      return <Zap className={iconClass} />
    case "Starting":
      return <PlayCircle className={iconClass} />
    case "Running":
      return <Loader2 className={cn(iconClass, "animate-spin")} />
    case "Succeeded":
      return <CheckCircle className={iconClass} />
    case "Failed":
      return <XCircle className={iconClass} />
    default:
      return null
  }
}

interface JobStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: JobStatus
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ 
  status, 
  className,
  ...props 
}) => {
  return (
    <Badge
      className={cn(jobStatusVariants({ status }), className)}
      {...props}
    >
      {getStatusIcon(status)}
      <span>{status}</span>
    </Badge>
  )
}
