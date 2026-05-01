import type { BulkSampleItemResponse } from '@/client/types.gen'

export type SampleDiffStatus = 'created' | 'updated'

export interface SampleDiffResult {
  statusBySampleId: Map<string, SampleDiffStatus>
  counts: { created: number; modified: number; unchanged: number }
}

/** Classifies bulk upload response items by per-sample status. Priority when
 * multiple flags fire on a single item: created > updated. */
export function classifyBulkUploadItems(
  items: Array<BulkSampleItemResponse>
): SampleDiffResult {
  const statusBySampleId = new Map<string, SampleDiffStatus>()
  let created = 0
  let modified = 0

  for (const item of items) {
    if (item.created) {
      statusBySampleId.set(item.sample_id, 'created')
      created += 1
    } else if (item.updated) {
      statusBySampleId.set(item.sample_id, 'updated')
      modified += 1
    }
  }

  return {
    statusBySampleId,
    counts: {
      created,
      modified,
      unchanged: items.length - created - modified,
    },
  }
}
