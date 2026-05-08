import type * as React from "react"
import type * as CheckboxPrimitive from "@radix-ui/react-checkbox"

import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

// Checkbox variant for the data table's row-selection column. Applies the
// primary-2 (green) accent so checked/indeterminate states match the
// selection-aware download CTA.
function TableSelectionCheckbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <Checkbox
      className={cn(
        "data-[state=checked]:bg-primary-2 data-[state=checked]:border-primary-2 data-[state=checked]:text-primary-2-foreground dark:data-[state=checked]:bg-primary-2",
        "data-[state=indeterminate]:bg-primary-2 data-[state=indeterminate]:border-primary-2 data-[state=indeterminate]:text-primary-2-foreground dark:data-[state=indeterminate]:bg-primary-2",
        className,
      )}
      {...props}
    />
  )
}

export { TableSelectionCheckbox }
