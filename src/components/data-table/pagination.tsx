import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import type { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"

interface DataTablePaginationProps<TData> {
  table: Table<TData>,
  totalItems?: number
}

export function DataTablePagination<TData>({
  table,
  totalItems
}: DataTablePaginationProps<TData>) {
  const isMobile = useIsMobile();
  if (totalItems == 0) return;

  // Compute the number of rows displayed
  const rowsOnPage = table.getPaginationRowModel().rows.length;
  const rowsFiltered = table.getFilteredRowModel().rows.length;
  const rowsDisplayed = rowsOnPage < rowsFiltered ? rowsOnPage : rowsFiltered
  const currentPageSize = table.getState().pagination.pageSize;
  
  // Detect if this is a server-side paginated table
  const isServerSide = table.options.manualPagination === true;
  
  // Only show "All" logic for client-side tables
  const isShowingAll = !isServerSide && currentPageSize >= rowsFiltered;
  
  // For server-side, totalItems already represents the filtered count from the server
  // For client-side, use filtered count if filtering is active, otherwise use totalItems
  const isFiltered = !isServerSide && rowsFiltered !== totalItems;
  const displayTotal = isServerSide ? totalItems : (isFiltered ? rowsFiltered : totalItems);

  return (
    <div className="flex items-center justify-end md:justify-between">
      {!isMobile && (
        <div className="text-muted-foreground flex-1 text-sm">
          Showing {" "}
          {rowsDisplayed} out of {" "}
          {displayTotal} row(s)
        </div>
      )}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          {!isMobile && <p className="text-sm font-medium">Rows per page</p>}
          <Select
            value={isShowingAll ? 'all' : `${currentPageSize}`}
            onValueChange={(value) => {
              if (value === 'all' && !isServerSide) {
                table.setPageSize(rowsFiltered || totalItems || 9999)
              } else {
                table.setPageSize(Number(value))
              }
              table.setPageIndex(0)
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={isShowingAll ? 'All' : currentPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
              {!isServerSide && <SelectItem value="all">All</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
