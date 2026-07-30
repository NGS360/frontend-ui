import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Shown in the message pane before a conversation has any turns. */

const SUGGESTED_PROMPTS = [
  'Which runs failed QC recently?',
  'Summarize a project',
  'Find samples missing manifests',
]

// Brand hues cycled across the suggestion pills, passed through as --pill.
const SUGGESTION_ACCENTS = ['#298fff', '#45b14e', '#eb6341']

export function AiChatEmptyState({
  disabled,
  onSelect,
  className,
}: {
  disabled: boolean
  onSelect: (prompt: string) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-2 text-center',
        className,
      )}
    >
      <div className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary-2/15 ring-1 ring-border">
        <Sparkles className="size-6 text-primary" />
      </div>
      <p className="gradient-text text-xl font-semibold tracking-tight">
        How can I help?
      </p>
      <p className="max-w-56 text-sm text-muted-foreground">
        Ask a question about your projects, runs, or samples.
      </p>
      <div
        id="ai-chat-suggestions"
        className="mt-3 flex flex-wrap justify-center gap-2"
      >
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(prompt)}
            style={
              {
                '--pill': SUGGESTION_ACCENTS[i % SUGGESTION_ACCENTS.length],
              } as React.CSSProperties
            }
            className="suggestion-pill inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all hover:-translate-y-px hover:shadow disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
