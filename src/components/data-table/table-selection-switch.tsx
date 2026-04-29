import type * as SwitchPrimitive from "@radix-ui/react-switch"
import type * as React from "react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// Switch variant for the data table's selection-related toggles. Applies the
// primary-2 accent so it matches the selection column's checkbox and
// the selection-aware download CTA.
function TableSelectionSwitch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <Switch
      className={cn(
        "data-[state=checked]:bg-primary-2",
        className,
      )}
      {...props}
    />
  )
}

export { TableSelectionSwitch }
