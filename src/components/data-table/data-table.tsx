import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import React from "react"
import { DataTableColumnToggle } from "./column-toggle";
import type { Dispatch, JSX, SetStateAction } from "react";
import type { ColumnDef, PaginationState, Row } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { DataTablePagination } from "@/components/data-table/pagination";
import { Input } from "@/components/ui/input";

// Define the data table component
interface DataTableProps<TData, TValue> {
  data: Array<TData>,
  columns: Array<ColumnDef<TData, TValue>>,
  notFoundComponent?: JSX.Element,
  pagination: PaginationState,
  pageCount: number,
  onPaginationChange: Dispatch<SetStateAction<{ pageIndex: number; pageSize: number; }>>,
  totalItems: number,
  rowClickCallback?: (row: Row<TData>) => void,
  showPaginationControls?: boolean,
}

export function DataTable<TData, TValue>({
  data,
  columns,
  notFoundComponent = <span>No results.</span>,
  pagination,
  pageCount,
  onPaginationChange: onPaginationChangeCallback,
  totalItems,
  rowClickCallback,
}: DataTableProps<TData, TValue>) {

  const table = useReactTable({
    data,
    columns,
    state: { pagination: pagination },
    manualPagination: true,
    pageCount: pageCount,
    onPaginationChange: updater => {
      // Handle pagination changes (like resetting index on pageSize change)
      onPaginationChangeCallback(old => {
        const newState = typeof updater === 'function' ? updater(old) : updater;
        if (newState.pageSize !== old.pageSize) {
          return { pageIndex: 0, pageSize: newState.pageSize }
        }
        return newState
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
                onClick={() => {
                  if (rowClickCallback) {
                    rowClickCallback(row)
                  }
                }}
                className={`${rowClickCallback ? 'cursor-pointer' : ''}`}
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
            onChange={e => table.setGlobalFilter(String(e.target.value))}
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