import { ListFilter, X } from "lucide-react"
import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"

interface DataTableColumnFilterToggleProps<TData> {
  table: Table<TData>
  showFilters: boolean
  onToggle: () => void
  onClear: () => void
}

export function DataTableColumnFilterToggle<TData>({
  table,
  showFilters,
  onToggle,
  onClear,
}: DataTableColumnFilterToggleProps<TData>) {
  
  // Check if any column filters are active
  const hasActiveFilters = table.getState().columnFilters.length > 0

  return (
    <>
      {showFilters || hasActiveFilters ? (
        <Button
          variant="outline"
          size="default"
          onClick={onClear}
        >
          <X />
          Clear Filters
        </Button>
      ) : (
        <Button
          variant="outline"
          size="default"
          onClick={onToggle}
        >
          <ListFilter />
          Show Filters
        </Button>
      )}
    </>
  )
}
