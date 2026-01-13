import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { SubmitHandler } from "react-hook-form";
import type { DemuxWorkflowConfig } from "@/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Component props
interface ExecuteToolFormProps {
  /** The workflow configuration to render as a form */
  toolConfig: DemuxWorkflowConfig;
  /** The run barcode to execute the workflow against */
  runBarcode: string;
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

export const ExecuteToolForm: React.FC<ExecuteToolFormProps> = ({
  toolConfig,
  runBarcode,
  isOpen,
  onOpenChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically build the Zod schema based on workflow config
  const buildSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    toolConfig.inputs.forEach((input) => {
      let fieldSchema: z.ZodTypeAny;

      switch (input.type) {
        case "String":
          fieldSchema = z.string();
          if (input.required) {
            fieldSchema = (fieldSchema as z.ZodString).min(1, `${input.name} is required`);
          }
          break;
        case "Integer":
          fieldSchema = z.coerce.number().int(`${input.name} must be an integer`);
          if (input.required) {
            fieldSchema = fieldSchema.refine((val) => val !== null && val !== undefined, {
              message: `${input.name} is required`,
            });
          }
          break;
        case "Boolean":
          fieldSchema = z.boolean();
          break;
        case "Enum":
          if (input.options && input.options.length > 0) {
            const [first, ...rest] = input.options;
            fieldSchema = z.enum([first, ...rest] as [string, ...Array<string>]);
            if (input.required) {
              fieldSchema = fieldSchema.refine(
                (val) => val !== "",
                `${input.name} is required`
              );
            }
          } else {
            fieldSchema = z.string();
          }
          break;
        default:
          fieldSchema = z.string();
      }

      // Make field optional if not required
      if (!input.required) {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[input.name] = fieldSchema;
    });

    return z.object(schemaFields);
  };

  const FormSchema = buildSchema();
  type FormFields = z.infer<typeof FormSchema>;

  // Build default values from tool config
  const getDefaultValues = (): Record<string, any> => {
    const defaults: Record<string, any> = {};
    toolConfig.inputs.forEach((input) => {
      if (input.default !== null && input.default !== undefined) {
        defaults[input.name] = input.default;
      } else {
        // Set appropriate defaults based on type
        switch (input.type) {
          case "Boolean":
            defaults[input.name] = false;
            break;
          case "String":
            defaults[input.name] = "";
            break;
          case "Enum":
            break;
          case "Integer":
            defaults[input.name] = undefined;
            break;
        }
      }
    });
    return defaults;
  };

  // Configure form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormFields>({
    defaultValues: getDefaultValues(),
    resolver: zodResolver(FormSchema),
  });

  // Handle dialog close
  const handleOnOpenChange = (willOpen: boolean) => {
    if (!willOpen) {
      reset(getDefaultValues());
    }
    onOpenChange(willOpen);
  };

  // Form submission
  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace this with actual API call when endpoint is available
      const payload = {
        workflow_id: toolConfig.workflow_id,
        run_barcode: runBarcode,
        inputs: data,
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Show success toast with submitted data
      toast.success("Workflow execution submitted successfully", {
        description: (
          <pre className="mt-2 w-full rounded-md p-4 max-h-[200px] overflow-auto whitespace-pre-wrap break-words">
            <code className="text-foreground text-xs">
              {JSON.stringify(payload, null, 2)}
            </code>
          </pre>
        ),
      });

      // Close dialog and reset form
      handleOnOpenChange(false);
      reset(getDefaultValues());
    } catch (error) {
      console.error("Error submitting workflow execution:", error);
      toast.error("Failed to execute workflow");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{toolConfig.workflow_name}</DialogTitle>
          <DialogDescription>{toolConfig.workflow_description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 py-4">
            {toolConfig.inputs.map((input) => (
              <div key={input.name} className="grid gap-2">
                {input.type !== "Boolean" && (
                  <Label htmlFor={input.desc}>
                    {input.desc}
                    {input.required && <span className="text-red-500">*</span>}
                  </Label>
                )}

                {/* Render input based on type */}
                {input.type === "String" && (
                  <Input
                    {...register(input.name)}
                    id={input.name}
                    type="text"
                    placeholder={input.default?.toString() || ""}
                  />
                )}

                {input.type === "Integer" && (
                  <Input
                    {...register(input.name)}
                    id={input.name}
                    type="number"
                    step="1"
                    placeholder={input.default?.toString() || ""}
                  />
                )}

                {input.type === "Boolean" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={input.name}
                      checked={watch(input.name) as boolean}
                      onCheckedChange={(checked) => {
                        setValue(input.name, checked as any);
                      }}
                    />
                    <Label htmlFor={input.name} className="!mt-0">
                      {input.desc}
                      {input.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  </div>
                )}

                {input.type === "Enum" && input.options && (
                  <Select
                    value={watch(input.name) as string}
                    onValueChange={(value) => setValue(input.name, value as any)}
                  >
                    <SelectTrigger id={input.name}>
                      <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {input.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {errors[input.name] && (
                  <div className="text-xs text-red-500 text-left break-all">
                    {errors[input.name]?.message as string}
                  </div>
                )}
              </div>
            ))}

            {toolConfig.help && (
              <div className="rounded-md bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  {toolConfig.help}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset(getDefaultValues());
              }}
            >
              Reset
            </Button>
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset(getDefaultValues());
                }}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4 mr-2" />
                  Executing...
                </>
              ) : (
                "Execute Workflow"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
