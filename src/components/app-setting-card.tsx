import { useForm } from 'react-hook-form'
import { Save, X } from 'lucide-react'
import type { Setting } from '@/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SettingCardProps {
  setting: Setting
  isPending: boolean
  onSave: (key: string, value: string) => void
  inputType?: 'text' | 'password'
}

export const SettingCard = ({ setting, isPending, onSave, inputType = 'text' }: SettingCardProps) => {
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      value: setting.value,
    },
  })

  const currentValue = watch('value')
  const hasChanged = currentValue !== setting.value

  const onSubmit = handleSubmit((data) => {
    onSave(setting.key, data.value)
  })

  return (
    <div className='border rounded-lg p-6'>
      <div className='flex flex-col gap-3'>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className='text-lg font-medium w-fit'>{setting.name}</p>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className='font-mono text-sm'>{setting.key}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {setting.description && (
          <p className='text-sm text-muted-foreground'>{setting.description}</p>
        )}
        
        <form onSubmit={onSubmit}>
          <div className='flex flex-col gap-2'>
            <div className='flex gap-2 items-start'>
              <Input
                {...register('value')}
                type={inputType}
                className='flex-1'
                disabled={isPending}
              />
              {hasChanged && (
                <>
                  <Button
                    type='submit'
                    variant='ghost'
                    size='icon'
                    disabled={isPending}
                  >
                    <Save className='h-4 w-4 text-blue-600' />
                    <span className="sr-only">Save</span>
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => reset()}
                    disabled={isPending}
                  >
                    <X className='h-4 w-4 text-red-600' />
                    <span className="sr-only">Cancel</span>
                  </Button>
                </>
              )}
            </div>
            
            {setting.updated_at && (
              <p className='text-xs text-muted-foreground text-right'>
                Updated: {new Date(setting.updated_at.replace(' ', 'T') + 'Z').toLocaleString(undefined, { timeZoneName: 'short' })}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
