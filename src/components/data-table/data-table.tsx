import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import React from "react"
import { DataTableColumnToggle } from "./column-toggle";
import type { Dispatch, JSX, SetStateAction } from "react";
import type { ColumnDef, ColumnResizeDirection, ColumnResizeMode, PaginationState, Row } from "@tanstack/react-table";
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
  enableColumnResizing?: boolean,
  showPaginationControls?: boolean,
  columnResizeMode?: ColumnResizeMode,
  columnResizeDirection?: ColumnResizeDirection,
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
  enableColumnResizing = true,
  columnResizeMode = 'onChange',
  columnResizeDirection = 'ltr',
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
    columnResizeMode,
    columnResizeDirection,
    enableColumnResizing,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })



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
          <ScrollArea type='hover' className="flex-1 w-full rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className='hover:bg-accent relative'
                          style={{ width: header.getSize() }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {/* Resizer */}
                          {/* {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              onDoubleClick={() => header.column.resetSize()}
                              className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none bg-transparent z-10 ${header.column.getIsResizing() ? 'bg-blue-400' : ''}`}
                              style={{
                                userSelect: 'none',
                                touchAction: 'none',
                              }}
                            />
                          )} */}
                        </TableHead>
                      )
                    })}
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
                          <TableCell key={cell.id} className="align-top">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow className="h-24">
                    <TableCell
                      colSpan={columns.length}
                    >
                      <div className="flex items-center justify-center h-full">
                        {notFoundComponent}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" className="w-full" />
          </ScrollArea>
        </div>
        <DataTablePagination
          table={table}
          totalItems={totalItems}
        />
      </div>
    </div>
  )
};