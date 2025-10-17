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
import { addVendorMutation, getVendorsQueryKey } from "@/client/@tanstack/react-query.gen";
import { Textarea } from "@/components/ui/textarea";

// Define Schema w/Validation
const AddVendorSchema = z.object({
  vendor_id: z.string().nonempty("Vendor ID is required"),
  name: z.string().nonempty("Name is required"),
  description: z.string().nonempty("Description is required"),
  bucket: z.union([
    z.string().startsWith("s3://", { message: "Bucket must start with s3://" }),
    z.literal(""),
    z.undefined()
  ]),
});

type FormFields = z.infer<typeof AddVendorSchema>

interface AddVendorFormProps {
  /** Trigger for the Sheet component */
  trigger: JSX.Element
}

export const AddVendorForm: React.FC<AddVendorFormProps> = ({
  trigger
}) => {
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
      vendor_id: "",
      name: "",
      description: "",
      bucket: "",
    },
    resolver: zodResolver(AddVendorSchema)
  });

  // Mutation
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    ...addVendorMutation(),
    onError: (error: AxiosError<HttpValidationError>) => {
      const message = error.response?.data.detail?.toString()
        || "An unknown error occurred.";
      setError("root", { message });
    },
    onSuccess: (data: VendorPublic) => {
      reset();
      queryClient.invalidateQueries({ queryKey: getVendorsQueryKey() });
      toast.success(`Successfully added vendor ${data.name}`);
      setIsOpen(false);
    }
  });

  // Form submission
  const onSubmit: SubmitHandler<FormFields> = (data) => {
    mutate({
      body: {
        vendor_id: data.vendor_id,
        name: data.name,
        description: data.description,
        bucket: data.bucket || null,
      }
    });
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Vendor</SheetTitle>
            <SheetDescription>
              Link an s3 vendor bucket to NGS360 for data ingestion.
            </SheetDescription>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="vendor-id">Vendor ID</Label>
                    <Input
                      {...register("vendor_id")}
                      id="vendor-id"
                      type="text"
                      placeholder="vendor-123"
                      required
                    />
                    {errors.vendor_id && (
                      <div className="text-xs text-red-500 text-left">
                        {errors.vendor_id.message}
                      </div>
                    )}
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
              {isSubmitting || isPending ? "Adding Vendor..." : "Add Vendor"}
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