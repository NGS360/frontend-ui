import type { ColumnDef } from "@tanstack/react-table"

import { TableSelectionCheckbox } from "@/components/data-table/table-selection-checkbox"

/** Stable id of the optional row-selection column, used to address it from
 * outside the table component (e.g. to apply a programmatic 'show selected
 * rows only' filter via setFilterValue). */
export const SELECTION_COLUMN_ID = '__select__'

/** Builds the leading checkbox column rendered when a data table opts in via
 * `enableRowSelectionColumn`. Filtering is enabled (with no UI) so consumers
 * can drive a 'show only selected rows' mode by calling setFilterValue(true)
 * on this column. */
export function buildSelectionColumn<TData>(): ColumnDef<TData> {
  // Fixed-width wrapper so the column reserves a consistent footprint a bit
  // wider than the checkbox itself, which the browser propagates to all rows.
  const cellWrapperClass = 'w-8 flex items-center justify-center'
  return {
    id: SELECTION_COLUMN_ID,
    header: ({ table }) => (
      <div className={cellWrapperClass}>
        <TableSelectionCheckbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows on page"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className={cellWrapperClass}>
        <TableSelectionCheckbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    // Filter UI is suppressed at the data table render layer (it skips the
    // popover for this column id); this stays true so consumers can call
    // setFilterValue() to drive a 'show selected only' mode.
    enableColumnFilter: true,
    // Any truthy filter value narrows the table to currently-selected rows.
    filterFn: (row) => row.getIsSelected(),
  }
}
