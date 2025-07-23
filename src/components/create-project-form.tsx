import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LoaderCircle, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from 'sonner';
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { JSX } from "react";
import type { SubmitHandler } from "react-hook-form";
import type { HttpValidationError, ProjectPublic } from "@/client"
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createProjectMutation, readProjectsQueryKey } from "@/client/@tanstack/react-query.gen";

// Define Schema w/Validation
const AttributeSchema = z.object({
  key: z.string(),
  value: z.string(),
})
  .refine(
    (attr) => !(attr.key.trim() === "" && attr.value.trim() !== ""),
    {
      message: "Key is required if value is filled.",
      path: ["key"],
    }
  )
  .refine(
    (attr) => !(attr.key.trim() !== "" && attr.value.trim() === ""),
    {
      message: "Value is required if key is filled.",
      path: ["value"],
    }
  );

const CreateProjectSchema = z.object({
  name: z.string().nonempty(),
  attributes: z.array(AttributeSchema)
})

type FormFields = z.infer<typeof CreateProjectSchema>

// Component props
interface CreateProjectFormProps {
  trigger: JSX.Element // Trigger for Dialog component
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ trigger }) => {

  const navigate = useNavigate();

  // Control dialog open/close state
  const [isOpen, setIsOpen] = useState(false);
  const handleOnOpenChange = (willOpen: boolean) => {
    if (!willOpen) reset();
    setIsOpen(willOpen);
  }

  // Configure form
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    defaultValues: {
      name: "",
      attributes: [
        {
          key: "",
          value: ""
        }
      ]
    },
    resolver: zodResolver(CreateProjectSchema)
  })

  const { fields, append, remove } = useFieldArray({
    name: "attributes",
    control,
  })

  const watchAttributes = watch("attributes");

  // Mutation
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    ...createProjectMutation(),
    onError: (error: AxiosError<HttpValidationError>) => {
      const message = error.response?.data.detail?.toString()
        || "An unknown error occurred.";
      setError("root", { message });
    },
    onSuccess: (data: ProjectPublic) => {
      reset();
      queryClient.invalidateQueries({ queryKey: readProjectsQueryKey() });
      toast.success(`Successfully created project ${data.project_id}`);
      setIsOpen(false);
      navigate({
        to: '/projects/$project_id',
        params: {
          project_id: data.project_id
        }
      })
    }
  })

  // Form submission
  const onSubmit: SubmitHandler<FormFields> = (data) => {
    // Remove any pairs where both key and value are empty
    const filteredAttributes = data.attributes.filter(
      (attr) => !(attr.key.trim() === "" && attr.value.trim() === "")
    );
    mutate({ body: { ...data, attributes: filteredAttributes } });
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add an NGS360 project with the desired attributes.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Name</Label>
                <Input
                  {...register("name")}
                  id="project-name"
                  type="text"
                  placeholder="My Project"
                  required
                />
                {errors.name && (
                  <div className="text-xs text-red-500 text-left">
                    {errors.name.message}
                  </div>
                )}
              </div>
              <div className="grid gap-2 mb-6">
                <Label>Attributes</Label>
                {fields.map((field, index) => (
                  <div className="grid gap-2" key={field.id}>
                    <div className="flex gap-2">
                      <div className="flex flex-col flex-1">
                        <Input
                          {...register(`attributes.${index}.key` as const)}
                          placeholder="Key"
                        />
                        {errors.attributes?.[index]?.key?.message && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.attributes[index].key.message}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <Input
                          {...register(`attributes.${index}.value` as const)}
                          placeholder="Value"
                        />
                        {errors.attributes?.[index]?.value?.message && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.attributes[index].value.message}
                          </span>
                        )}
                      </div>
                      <Button
                        variant='ghost'
                        className='hover:bg-destructive/10 group'
                        disabled={watchAttributes.length < 2}
                        onClick={() => remove(index)}
                      >
                        <Trash2Icon className='size-4 text-destructive' />
                      </Button>
                    </div>
                  </div>
                ))}
                <div>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={
                      !watchAttributes[watchAttributes.length - 1]?.key?.trim() ||
                      !watchAttributes[watchAttributes.length - 1]?.value?.trim()
                    }
                    onClick={() => append({ key: "", value: "" })}
                  >
                    <PlusIcon /> Add Attribute
                  </Button>

                </div>
              </div>
              {errors.root && (
                <div className="text-red-500 text-sm text-center">
                  {errors.root.message}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { reset() }}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={isSubmitting || isPending} type="submit">
                {isSubmitting || isPending ? (
                  <LoaderCircle className="animate-spin h-4 w-4 text-white" />
                ) : null}
                {isSubmitting || isPending ? "Creatinging Project..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}