import { useParams } from '@tanstack/react-router'

/**
 * The entity the user is currently viewing, derived from the active route's
 * params. Surfaced in the AI chat composer and sent with each message so the
 * assistant knows what the user is looking at.
 */
export interface PageContext {
  /**
   * Only the kinds a route can actually produce. Narrower than the chat API's
   * entity union on purpose: that also accepts `sample`, which arrives as an
   * "@/#" reference rather than as a page — there is no sample detail route to
   * be on. Widen this when one exists.
   */
  type: 'project' | 'run' | 'job'
  id: string
  /** Human label for the entity type, e.g. "Project". */
  label: string
}

export function usePageContext(): PageContext | null {
  // strict: false → read params across all matched routes without binding to one.
  const params: Record<string, string | undefined> = useParams({ strict: false })

  if (params.project_id) return { type: 'project', id: params.project_id, label: 'Project' }
  if (params.run_id) return { type: 'run', id: params.run_id, label: 'Run' }
  if (params.job_id) return { type: 'job', id: params.job_id, label: 'Job' }
  return null
}
