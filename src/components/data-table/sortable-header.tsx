import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import type { Column } from "@tanstack/react-table";

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  name: string;
}

export const SortableHeader = <TData, TValue>({ column, name }: SortableHeaderProps<TData, TValue>) => {
  const [nClicks, setNClicks] = useState(0);
  const handleClick = () => {
    const newClicks = nClicks + 1;
    setNClicks(newClicks);

    if (newClicks % 3 === 0) {
      column.clearSorting();
    } else {
      column.toggleSorting(column.getIsSorted() === 'asc');
    }
  }
  return (
    <div
      className='flex items-center cursor-pointer w-full h-full'
      onClick={handleClick}
    >
      {name}
      {!column.getIsSorted() && (<ArrowUpDown className='ml-2 h-4 w-4' />)}
      {column.getIsSorted() === 'asc' ? (<ArrowDown className='ml-2 h-4 w-4' />) : (null)}
      {column.getIsSorted() === 'desc' ? (<ArrowUp className='ml-2 h-4 w-4' />) : (null)}
    </div>
  )
}