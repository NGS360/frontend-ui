import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle } from "lucide-react";
import { toast } from 'sonner';
import { useState } from "react";
import type React from "react";
import type { JSX } from "react";
import type { SubmitHandler } from "react-hook-form";
import type { HttpValidationError, VendorPublic } from "@/client";
import type { AxiosError } from "axios";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getVendorsQueryKey, updateVendorMutation } from "@/client/@tanstack/react-query.gen";
import { Textarea } from "@/components/ui/textarea";

// Define Schema w/Validation
const UpdateVendorSchema = z.object({
  name: z.string().nonempty("Name is required"),
  description: z.string().nonempty("Description is required"),
  bucket: z.union([
    z.string().startsWith("s3://", { message: "Bucket must start with s3://" }),
    z.literal(""),
    z.undefined()
  ]),
});

type FormFields = z.infer<typeof UpdateVendorSchema>

interface UpdateVendorFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
  /** The vendor to update */
  vendor: VendorPublic
}

export const UpdateVendorForm: React.FC<UpdateVendorFormProps> = ({
  trigger,
  vendor
}) => {
  // Control sheet open/close state
  const [isOpen, setIsOpen] = useState(false);
  const handleOnOpenChange = (willOpen: boolean) => {
    if (!willOpen) reset();
    setIsOpen(willOpen);
  }

  // Configure form with initial values from vendor
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    defaultValues: {
      name: vendor.name,
      description: vendor.description,
      bucket: vendor.bucket || "",
    },
    resolver: zodResolver(UpdateVendorSchema)
  });

  // Mutation
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    ...updateVendorMutation(),
    onError: (error: AxiosError<HttpValidationError>) => {
      const message = error.response?.data.detail?.toString()
        || "An unknown error occurred.";
      setError("root", { message });
    },
    onSuccess: (data: VendorPublic) => {
      reset();
      queryClient.invalidateQueries({ queryKey: getVendorsQueryKey() });
      toast.success(`Successfully updated vendor ${data.name}`);
      setIsOpen(false);
    }
  });

  // Form submission
  const onSubmit: SubmitHandler<FormFields> = (data) => {
    mutate({
      body: {
        name: data.name,
        description: data.description,
        bucket: data.bucket || null,
      },
      path: {
        vendor_id: vendor.vendor_id
      }
    });
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Update Vendor</SheetTitle>
            <SheetDescription>
              Update vendor information and settings.
            </SheetDescription>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="vendor-id">Vendor ID</Label>
                    <Input
                      id="vendor-id"
                      type="text"
                      value={vendor.vendor_id}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Vendor ID cannot be changed
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      {...register("name")}
                      id="name"
                      type="text"
                      placeholder="Vendor Name"
                      required
                    />
                    {errors.name && (
                      <div className="text-xs text-red-500 text-left">
                        {errors.name.message}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      {...register("description")}
                      id="description"
                      placeholder="Description about the vendor"
                      required
                    />
                    {errors.description && (
                      <div className="text-xs text-red-500 text-left">
                        {errors.description.message}
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bucket">Bucket (Optional)</Label>
                    <Input
                      {...register("bucket")}
                      id="bucket"
                      type="text"
                      placeholder="s3://bucket-name"
                    />
                    {errors.bucket && (
                      <div className="text-xs text-red-500 text-left">
                        {errors.bucket.message}
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
              disabled={isSubmitting || isPending} 
              type="submit"
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting || isPending ? (
                <LoaderCircle className="animate-spin h-4 w-4 text-white" />
              ) : null}
              {isSubmitting || isPending ? "Updating Vendor..." : "Update Vendor"}
            </Button>
            <SheetClose asChild>
              <Button
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
