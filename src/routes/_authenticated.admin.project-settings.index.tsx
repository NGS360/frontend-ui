import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import type { HttpValidationError, Setting } from '@/client'
import { getSettingsByTagOptions, getSettingsByTagQueryKey, updateSettingMutation } from '@/client/@tanstack/react-query.gen'
import { SettingCard } from '@/components/app-setting-card'

export const Route = createFileRoute('/_authenticated/admin/project-settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: settings, error } = useQuery(
    getSettingsByTagOptions({
      query: {
        tag_key: 'category',
        tag_value: 'project settings',
      },
    })
  )

  const queryClient = useQueryClient()
  const { mutate: updateSetting, isPending } = useMutation({
    ...updateSettingMutation(),
    onError: (mutationError: AxiosError<HttpValidationError>) => {
      const message = mutationError.response?.data.detail?.toString()
        || "An unknown error occurred."
      toast.error(`Failed to update setting: ${message}`)
    },
    onSuccess: (data: Setting) => {
      queryClient.invalidateQueries({ 
        queryKey: getSettingsByTagQueryKey({
          query: {
            tag_key: 'category',
            tag_value: 'project settings',
          },
        })
      })
      toast.success(`Successfully updated ${data.name}`)
    }
  })

  const handleSave = (key: string, value: string) => {
    updateSetting({
      path: {
        key,
      },
      body: {
        value,
      },
    })
  }

  
  if (error) return <div className='text-destructive'>Error loading settings: {error.message}</div>
  if (!settings || settings.length === 0) {
    return (
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-2'>
          <h1 className="text-3xl">Project Settings</h1>
          <p className="text-muted-foreground">
            Manage and configure global project settings for NGS360.
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <p className="text-muted-foreground">No project settings found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <h1 className="text-3xl">Project Settings</h1>
        <p className="text-muted-foreground">
          Manage and configure global project settings for NGS360.
        </p>
      </div>
      
      <div className='grid gap-4'>
        {settings.map((setting) => (
          <SettingCard 
            key={setting.key} 
            setting={setting} 
            isPending={isPending}
            onSave={handleSave}
          />
        ))}
      </div>
    </div>
  )
}
