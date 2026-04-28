import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { InfiniteData } from '@tanstack/react-query'
import type { SamplePublic } from '@/client/types.gen'
import type { PaginatedResponse } from '@/hooks/use-all-paginated'
import { CopyableText } from '@/components/copyable-text'
import { EditableCell } from '@/components/data-table/editable-cell'
import { highlightMatch } from '@/lib/utils'
import { toastApiError } from '@/lib/error-utils'
import { updateSampleInProjectMutation } from '@/client/@tanstack/react-query.gen'

type SamplesInfiniteData = InfiniteData<PaginatedResponse<SamplePublic>>

interface EditableMetadataCellProps {
  projectId: string
  sampleId: string
  attributeKey: string
  value: string | undefined
  globalFilter: string
}

export function EditableMetadataCell({
  projectId,
  sampleId,
  attributeKey,
  value,
  globalFilter,
}: EditableMetadataCellProps) {
  const queryClient = useQueryClient()

  const { mutateAsync } = useMutation({
    ...updateSampleInProjectMutation(),
    onSuccess: (updated) => {
      queryClient.setQueriesData<SamplesInfiniteData>(
        { queryKey: ['samples', 'all', projectId] },
        (old) => old && {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((s) => s.sample_id === updated.sample_id ? updated : s),
          })),
        },
      )
      toast.success(`Updated ${attributeKey} for sample ${sampleId} in project ${projectId}`)
    },
    onError: (error) => {
      toastApiError(error, `Failed to update ${attributeKey} for sample ${sampleId} in project ${projectId}`)
    },
  })

  return (
    <EditableCell
      value={value}
      onSave={(newValue) => mutateAsync({
        path: { project_id: projectId, sample_id: sampleId },
        // Backend column is NOT NULL — send empty string for cleared values.
        body: { key: attributeKey, value: newValue ?? '' },
      })}
      renderDisplay={({ enterEdit }) =>
        value ? (
          <CopyableText text={value} variant='hover' asChild>
            <span onClick={enterEdit} className='truncate min-w-0 cursor-text'>
              {highlightMatch(value, globalFilter)}
            </span>
          </CopyableText>
        ) : (
          <span onClick={enterEdit} className='text-muted-foreground italic cursor-text'>
            Not found
          </span>
        )
      }
    />
  )
}
