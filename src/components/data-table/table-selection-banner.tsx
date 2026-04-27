import { X } from "lucide-react"
import { useState } from "react"
import type { ReactNode } from "react"
import type { ColumnFiltersState, Table as ReactTable } from "@tanstack/react-table"

import { SELECTION_COLUMN_ID } from "@/components/data-table/selection-column"
import { TableSelectionSwitch } from "@/components/data-table/table-selection-switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface TableSelectionBannerProps<TData> {
  table: ReactTable<TData>
  /** Bulk-action affordances (e.g. 'Download selection'). Rendered after the
   * count + 'Show selected' toggle on a single row at sm+, stacked at xs. */
  actions?: ReactNode
}

/** Banner that appears between the toolbar and the table body when any rows
 * are selected. Provides clear-selection, a 'Show selected' toggle that
 * stashes existing filters and restores them on toggle off, and a slot for
 * consumer-specific bulk actions. Returns null when the selection is empty. */
export function TableSelectionBanner<TData>({
  table,
  actions,
}: TableSelectionBannerProps<TData>) {
  // Filter state captured when the user enters 'show selected only' mode so
  // we can put it back when they leave. Selected-only mode wins over filters,
  // so existing filters are cleared while it's active.
  const [stashedFilters, setStashedFilters] = useState<{
    columnFilters: ColumnFiltersState
    globalFilter: string
  } | null>(null)

  const selectedRows = table.getSelectedRowModel().rows
  if (selectedRows.length === 0) return null

  const selectionColumn = table.getColumn(SELECTION_COLUMN_ID)
  const isShowingSelectedOnly = !!selectionColumn?.getFilterValue()

  const restoreStashedFilters = () => {
    if (!stashedFilters) return
    table.setColumnFilters(stashedFilters.columnFilters)
    table.setGlobalFilter(stashedFilters.globalFilter)
    setStashedFilters(null)
  }

  const toggleSelectedOnly = () => {
    if (isShowingSelectedOnly) {
      restoreStashedFilters()
      selectionColumn?.setFilterValue(undefined)
    } else {
      setStashedFilters({
        columnFilters: table.getState().columnFilters,
        globalFilter: (table.getState().globalFilter as string | undefined) ?? '',
      })
      table.setColumnFilters([])
      table.setGlobalFilter('')
      selectionColumn?.setFilterValue(true)
    }
  }

  const clearSelection = () => {
    if (isShowingSelectedOnly) {
      restoreStashedFilters()
      selectionColumn?.setFilterValue(undefined)
    }
    table.resetRowSelection()
  }

  const switchId = 'table-selection-banner-show-selected'
  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 rounded-md border border-primary-2/10 bg-primary-2/10 px-3 py-2'>
      <div className='flex flex-wrap items-center gap-3'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-7 hover:bg-primary-2/5'
              onClick={clearSelection}
              aria-label='Clear selection'
            >
              <X />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear selection</TooltipContent>
        </Tooltip>
        <span className='text-sm font-medium'>
          {selectedRows.length} {selectedRows.length === 1 ? 'row' : 'rows'} selected
        </span>
        <div className='flex items-center gap-2'>
          <TableSelectionSwitch
            id={switchId}
            checked={isShowingSelectedOnly}
            onCheckedChange={toggleSelectedOnly}
          />
          <Label htmlFor={switchId} className='text-sm'>
            Show selected
          </Label>
        </div>
      </div>
      {actions}
    </div>
  )
}
