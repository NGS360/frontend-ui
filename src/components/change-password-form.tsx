import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";
import { toast } from 'sonner';
import { useId, useState } from "react";
import type React from "react";
import type { JSX } from "react";
import type { SubmitHandler } from "react-hook-form";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getFormApiErrorMessage } from "@/lib/error-utils";
import { Input } from "@/components/ui/input";
import { changePasswordMutation } from "@/client/@tanstack/react-query.gen";

// Define Schema w/Validation
const ChangePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type FormFields = z.infer<typeof ChangePasswordSchema>

interface ChangePasswordFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
  /** Optional DOM id prefix for this form instance */
  idPrefix?: string
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  trigger,
  idPrefix,
}) => {
  const generatedId = useId();
  const baseId = (idPrefix || `change-password-${generatedId.replace(/:/g, '')}`).replace(/[^a-zA-Z0-9_-]+/g, '-');
  // Control sheet open/close state
  const [isOpen, setIsOpen] = useState(false);
  const handleOnOpenChange = (willOpen: boolean) => {
    if (!willOpen) reset();
    setIsOpen(willOpen);
  }

  // Configure form
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
    resolver: zodResolver(ChangePasswordSchema)
  });

  // Mutation
  const { mutate, isPending } = useMutation({
    ...changePasswordMutation(),
    onError: (error) => {
      setError("root", { message: getFormApiErrorMessage(error, "An unknown error occurred.") });
    },
    onSuccess: () => {
      reset();
      toast.success("Password updated successfully");
      setIsOpen(false);
    }
  });

  // Form submission
  const onSubmit: SubmitHandler<FormFields> = (data) => {
    mutate({
      body: {
        current_password: data.current_password,
        new_password: data.new_password,
      }
    });
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent id={`${baseId}-sheet`} srTitle="Change Password">
          <SheetHeader>
            <SheetTitle id={`${baseId}-title`}>Change Password</SheetTitle>
            <SheetDescription>
              Update your account password. Make sure it's strong and secure.
            </SheetDescription>
            <form id={`${baseId}-form`} onSubmit={handleSubmit(onSubmit)}>
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`${baseId}-current-password`}>Current Password</Label>
                    <Input
                      {...register("current_password")}
                      id={`${baseId}-current-password`}
                      type="password"
                      placeholder="Enter your current password"
                      required
                    />
                    {errors.current_password && (
                      <div className="text-xs text-red-500 text-left">
                        {errors.current_password.message}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${baseId}-new-password`}>New Password</Label>
                    <Input
                      {...register("new_password")}
                      id={`${baseId}-new-password`}
                      type="password"
                      placeholder="Enter your new password"
                      required
                    />
                    {errors.new_password && (
                      <div className="text-xs text-red-500 text-left">
                        {errors.new_password.message}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`${baseId}-confirm-password`}>Confirm New Password</Label>
                    <Input
                      {...register("confirm_password")}
                      id={`${baseId}-confirm-password`}
                      type="password"
                      placeholder="Confirm your new password"
                      required
                    />
                    {errors.confirm_password && (
                      <div className="text-xs text-red-500 text-left">
                        {errors.confirm_password.message}
                      </div>
                    )}
                  </div>
                  {errors.root && (
                    <div className="text-red-500 text-sm text-center">
                      {errors.root.message}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </SheetHeader>
          <SheetFooter className="mt-auto">
            <Button
              id={`${baseId}-submit`}
              disabled={isSubmitting || isPending}
              type="submit"
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting || isPending ? (
                <LoaderCircle className="animate-spin h-4 w-4 text-white" />
              ) : null}
              {isSubmitting || isPending ? 'Updating...' : 'Update Password'}
            </Button>
            <SheetClose asChild>
              <Button
                id={`${baseId}-cancel`}
                type="button"
                variant='secondary'
                onClick={() => { reset() }}
              >
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
