import '@tanstack/react-table'
import type { RowData } from '@tanstack/react-table';

// Define custom metadata values for tanstack table
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Column alias name - used for column toggle display */
    alias?: string
  }
}