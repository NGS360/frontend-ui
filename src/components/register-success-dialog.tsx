import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import type { Dispatch, SetStateAction } from 'react'
import type { BodyLogin } from '@/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { loginMutation } from '@/client/@tanstack/react-query.gen'

interface RegisterSuccessDialogProps {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
  data: BodyLogin
}

export function RegisterSuccessDialog({
  open,
  onOpenChange,
  data,
}: RegisterSuccessDialogProps) {
  const navigate = useNavigate()
  
  const { mutate } = useMutation({
    ...loginMutation(),
    onError: (error) => {
      const message =
        error.response?.data.detail?.toString() || 'An unknown error occurred.'
      toast.error(message)
    },
    onSuccess: () => {
      toast.success('Login successful')
      navigate({ to: '/' })
    },
  })

  const onClickHandler = (): void => {
    const updatedData = { ...data, grant_type: 'password' }
    mutate({ body: updatedData })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Success!</DialogTitle>
          <DialogDescription>
            Your account has been created successfully! <br />
            Click continue to login to the NGS360 portal.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onClickHandler()}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
