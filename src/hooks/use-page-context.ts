import { useParams } from '@tanstack/react-router'

/**
 * The entity the user is currently viewing, derived from the active route's
 * params. Surfaced in the AI chat composer and sent with each message so the
 * assistant knows what the user is looking at.
 */
export interface PageContext {
  type: 'project' | 'run' | 'sample' | 'job'
  id: string
  /** Human label for the entity type, e.g. "Project". */
  label: string
}

export function usePageContext(): PageContext | null {
  // strict: false → read params across all matched routes without binding to one.
  const params: Record<string, string | undefined> = useParams({ strict: false })

  if (params.project_id) return { type: 'project', id: params.project_id, label: 'Project' }
  if (params.run_id) return { type: 'run', id: params.run_id, label: 'Run' }
  if (params.sample_id) return { type: 'sample', id: params.sample_id, label: 'Sample' }
  if (params.job_id) return { type: 'job', id: params.job_id, label: 'Job' }
  return null
}
