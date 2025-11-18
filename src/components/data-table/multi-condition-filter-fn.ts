import type { Row } from "@tanstack/react-table";
import type { MultiConditionFilterValue } from "./multi-condition-filter";

/**
 * Custom filter function for multi-condition filtering with AND/OR logic
 * - AND: all conditions must match (all strings present in the cell value)
 * - OR: any condition can match (any string present in the cell value)
 */
export function multiConditionFilter<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: MultiConditionFilterValue | string | undefined
): boolean {
  // If no filter value, show the row
  if (!filterValue) return true;

  const cellValue = row.getValue(columnId);
  
  // Convert cell value to string for comparison
  const cellString = cellValue != null ? String(cellValue).toLowerCase() : "";

  // Handle simple string filter (backward compatibility)
  if (typeof filterValue === "string") {
    return cellString.includes(filterValue.toLowerCase());
  }

  // Handle multi-condition filter
  const { operator, conditions } = filterValue;
  
  // Filter out empty conditions
  const validConditions = conditions
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c !== "");

  // If no valid conditions, show the row
  if (validConditions.length === 0) return true;

  if (operator === "AND") {
    // All conditions must match
    return validConditions.every((condition) => cellString.includes(condition));
  } else {
    // OR: any condition can match
    return validConditions.some((condition) => cellString.includes(condition));
  }
}
