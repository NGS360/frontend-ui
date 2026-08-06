/** What the AI chat composer stages alongside a message. */

// The page the user is on, or an "@/#" reference they typed.
export type ContextEntity = {
  type: 'project' | 'run' | 'sample' | 'job' | 'user'
  id: string
  label: string
  /**
   * The project a sample belongs to. Sample ids are unique only within a
   * project, so a sample reference without this does not identify a row.
   * Unset for every other type.
   */
  projectId?: string
}

export const TYPE_LABELS: Record<ContextEntity['type'], string> = {
  project: 'Project',
  run: 'Run',
  sample: 'Sample',
  job: 'Job',
  user: 'User',
}

// A file attached via the paperclip or dropped on the sidebar.
export type Attachment = {
  id: string
  file: File
}
