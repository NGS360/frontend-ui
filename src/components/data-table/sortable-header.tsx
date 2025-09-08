import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
// import { useState } from "react";
import type { Column } from "@tanstack/react-table";

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  name: string;
}

export const SortableHeader = <TData, TValue>({ column, name }: SortableHeaderProps<TData, TValue>) => {
  return (
    <div
      className='group flex items-center cursor-pointer w-full h-full'
      onClick={() => column.toggleSorting()}
    >
      {name}
      {!column.getIsSorted() && (<ArrowUpDown className='ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity' />)}
      {column.getIsSorted() === 'asc' ? (<ArrowDown className='ml-2 h-4 w-4' />) : (null)}
      {column.getIsSorted() === 'desc' ? (<ArrowUp className='ml-2 h-4 w-4 ' />) : (null)}
    </div>
  )
}