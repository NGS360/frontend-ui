/**
 * Human-readable labels for the agent's tools, derived rather than looked up.
 *
 * No inventory of tool names lives in this codebase. The tools belong to a graph
 * in another repository and the set changes without us, so any lookup table
 * would drift silently. Deriving the label from the name means a tool nobody
 * here has heard of renders correctly the first time it runs.
 *
 * If the graph ever supplies its own label, prefer it and fall back to this.
 */

/**
 * For names whose derived label reads badly. Intentionally empty — filling it in
 * speculatively would recreate the drift this avoids.
 */
const LABEL_OVERRIDES: Record<string, string> = {}

/**
 * A display label for one tool name, or undefined if unusable — the caller keeps
 * the previous label rather than flicking to a placeholder.
 */
export function toolLabel(toolName: string | undefined): string | undefined {
  if (typeof toolName !== 'string') return undefined
  const name = toolName.trim()
  if (!name) return undefined

  const override = LABEL_OVERRIDES[name]
  if (override) return override

  // Deliberately dumb: no conjugation, nothing that needs to know English.
  // camelCase is split too, since the graph's naming is not ours to assume.
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()

  if (!words) return undefined
  return words.charAt(0).toUpperCase() + words.slice(1)
}
