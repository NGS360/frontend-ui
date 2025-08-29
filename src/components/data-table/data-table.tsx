import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from "@tanstack/react-table"
import React from "react"
import { DataTableColumnToggle } from "./column-toggle";
import type { Dispatch, JSX, SetStateAction } from "react";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { DataTablePagination } from "@/components/data-table/pagination";
import { Input } from "@/components/ui/input";

// Define data table props
interface DataTableProps<TData, TValue> {
  data: Array<TData>,
  columns: Array<ColumnDef<TData, TValue>>,
  notFoundComponent?: JSX.Element,

  // Search/filter
  globalFilter: string,
  setGlobalFilter: Dispatch<SetStateAction<string>>,
  
  // Pagination
  pagination: PaginationState,
  pageCount: number,
  setPagination: Dispatch<SetStateAction<PaginationState>>,
  totalItems: number,
  showPaginationControls?: boolean,

  // Sorting
  sorting: SortingState,
  setSorting: Dispatch<SetStateAction<SortingState>>
}

// Define the data table component
export function DataTable<TData, TValue>({
  data,
  columns,
  notFoundComponent = <span>No results.</span>,

  // Search/filter
  globalFilter,
  setGlobalFilter,

  // Pagination
  pagination,
  pageCount,
  totalItems,
  setPagination,

  // Sorting
  sorting,
  setSorting

}: DataTableProps<TData, TValue>) {

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),

    // Search/filter
    manualFiltering: true,
    onGlobalFilterChange: setGlobalFilter,

    // Pagination
    manualPagination: true,
    onPaginationChange: setPagination,
    pageCount: pageCount,

    // Sorting
    manualSorting: true,
    onSortingChange: setSorting,

    // Table state
    state: { 
      globalFilter: globalFilter,
      pagination: pagination,
      sorting: sorting
    },
    getPaginationRowModel: getPaginationRowModel()
  })

  // Extract table markup to a variable
  const tableMarkup = (
    <Table className="w-full">
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="align-top"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            </React.Fragment>
          ))
        ) : (
          <TableRow className="h-24">
            <TableCell colSpan={columns.length}>
              <div className="flex items-center justify-center h-full">
                {notFoundComponent}
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-center justify-end gap-2">
          <Input
            autoFocus
            value={table.getState().globalFilter ?? ""}
            onChange={ e => {
              setGlobalFilter(String(e.target.value))
              table.setPageIndex(0)
            }}
            placeholder="Type to filter..."
            className="w-full md:w-1/3"
          />
          <DataTableColumnToggle table={table} />
        </div>
        <div className="flex">
          <ScrollArea className="flex-1 w-full rounded-md border">
            {tableMarkup}
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <DataTablePagination table={table} totalItems={totalItems} />
      </div>
    </div>
  )
};