import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import React from "react"
import clsx from "clsx";
import { DataTableColumnToggle } from "./column-toggle";
import type { JSX } from "react";
import type { ColumnDef, OnChangeFn, PaginationState, Table as ReactTable, Row, RowSelectionState, SortingState  } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { DataTablePagination } from "@/components/data-table/pagination";
import { Input } from "@/components/ui/input";

// Common props
interface BaseDataTableProps<TData, TValue> {
  data: Array<TData>
  columns: Array<ColumnDef<TData, TValue>>,
  totalItems?: number,
  notFoundComponent?: JSX.Element,
  columnVisibility?: Record<string, boolean>,
  rowClickCallback?: (row: Row<TData>) => void,
  customRowComponent?: () => React.ReactNode,
  renderCustomRowComponent?: boolean
}

// Data table component
interface DataTableProps<TData> {
  table: ReactTable<TData>,
  notFoundComponent?: JSX.Element,
  totalItems: number,
  rowClickCallback?: (row: Row<TData>) => void,
  customRowComponent?: () => React.ReactNode,
  renderCustomRowComponent?: boolean
}

export function DataTable<TData>({
  table,
  notFoundComponent = <span>No results.</span>,
  totalItems,
  rowClickCallback,
  customRowComponent,
  renderCustomRowComponent = false
}: DataTableProps<TData>) {

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
        {renderCustomRowComponent && customRowComponent && (
          <React.Fragment>
            <TableRow>
              <TableCell>
                {customRowComponent()}
              </TableCell>
            </TableRow>
          </React.Fragment>
        )}
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={clsx(
                  rowClickCallback && `cursor-pointer`,
                  `data-[state=selected]:bg-muted`
                )}
                onClick={() => {
                  if (rowClickCallback) {
                    table.setRowSelection({ [row.id]: true })
                    rowClickCallback(row)
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cell.column.columnDef.meta?.tdClassName}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            </React.Fragment>
          ))
        ) : (
          <TableRow className="h-24">
            <TableCell colSpan={table.getAllColumns().length}>
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
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end gap-2">
          <Input
            autoFocus
            value={table.getState().globalFilter ?? ""}
            onChange={e => {
              table.setGlobalFilter(String(e.target.value))
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
    </>
  )
}

// Server-side controller
interface ServerDataTableProps<TData, TValue> extends BaseDataTableProps<TData, TValue> {

  // Search/filter
  globalFilter: string,
  onFilterChange: OnChangeFn<string>,

  // Pagination
  pagination: PaginationState,
  pageCount: number,
  onPaginationChange: OnChangeFn<PaginationState>,
  totalItems: number,
  showPaginationControls?: boolean,

  // Sorting
  sorting: SortingState,
  onSortingChange: OnChangeFn<SortingState>
}

export function ServerDataTable<TData, TValue>({
  data,
  columns,
  notFoundComponent,
  columnVisibility = {},

  // Search/filter
  globalFilter,
  onFilterChange: setGlobalFilter,

  // Pagination
  pagination,
  pageCount,
  totalItems,
  onPaginationChange: setPagination,

  // Sorting
  sorting,
  onSortingChange: setSorting

}: ServerDataTableProps<TData, TValue>) {

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
    initialState: {
      columnVisibility
    },
    getPaginationRowModel: getPaginationRowModel()
  })

  return(
    <DataTable 
      table={table} 
      totalItems={totalItems}
      notFoundComponent={notFoundComponent}
    />
  )
}

// Client-side controller
interface ClientDataTableProps<TData, TValue> extends BaseDataTableProps<TData, TValue> {
  pageSize?: number,
  rowSelection?: RowSelectionState
}

export function ClientDataTable<TData, TValue>({
  data,
  columns,
  pageSize = 20,
  notFoundComponent,
  columnVisibility,
  rowClickCallback,
  customRowComponent,
  renderCustomRowComponent = false
}: ClientDataTableProps<TData, TValue>) {

  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: { pageSize }, columnVisibility},
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel()
  })

  return(
    <DataTable
      table={table}
      totalItems={data.length}
      notFoundComponent={notFoundComponent}
      rowClickCallback={rowClickCallback}
      customRowComponent={customRowComponent}
      renderCustomRowComponent={renderCustomRowComponent}
    />
  )
}
