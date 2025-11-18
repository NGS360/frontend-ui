import React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOperator = "AND" | "OR";

export interface MultiConditionFilterValue {
  operator: FilterOperator;
  conditions: Array<string>;
}

interface MultiConditionFilterProps {
  value: MultiConditionFilterValue | string | undefined;
  onChange: (value: MultiConditionFilterValue | string | undefined) => void;
}

export function MultiConditionFilter({ value, onChange }: MultiConditionFilterProps) {
  // Parse the incoming value
  const filterValue = typeof value === "string" 
    ? { operator: "AND" as FilterOperator, conditions: value ? [value] : [""] }
    : value || { operator: "AND" as FilterOperator, conditions: [""] };

  const { operator, conditions } = filterValue;

  // Check if first input has text
  const showOperatorSelect = conditions.length > 0 && conditions[0].trim() !== "";

  const updateCondition = (index: number, newValue: string) => {
    const newConditions = [...conditions];
    newConditions[index] = newValue;
    
    // If all conditions are empty, reset to empty string
    const allEmpty = newConditions.every((c) => c.trim() === "");
    if (allEmpty) {
      onChange(undefined);
    } else {
      onChange({ operator, conditions: newConditions });
    }
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    
    // If no conditions left or all empty, reset
    if (newConditions.length === 0 || newConditions.every((c) => c.trim() === "")) {
      onChange(undefined);
    } else if (newConditions.length === 1 && !showOperatorSelect) {
      // If only one condition and it's the first one without operator shown, keep as simple string
      onChange(newConditions[0] || undefined);
    } else {
      onChange({ operator, conditions: newConditions });
    }
  };

  const addCondition = () => {
    onChange({ operator, conditions: [...conditions, ""] });
  };

  const changeOperator = (newOperator: FilterOperator) => {
    onChange({ operator: newOperator, conditions });
  };

  return (
    <div className="space-y-2">
      {conditions.map((condition, index) => (
        <React.Fragment key={index}>
          <div className="relative">
            <Input
              value={condition}
              onChange={(e) => updateCondition(index, e.target.value)}
              placeholder={index === 0 ? "Filter column..." : "Add another value..."}
              className="pr-8"
              autoFocus={index === 0}
            />
            {condition.trim() !== "" && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full w-8 p-0 hover:bg-transparent"
                onClick={() => {
                  if (index === 0 && conditions.length === 1) {
                    // Clear first and only input
                    onChange(undefined);
                  } else {
                    // Remove this condition
                    removeCondition(index);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Show operator select after each input except the last one, if first input has text */}
          {showOperatorSelect && index < conditions.length - 1 && (
            <Select value={operator} onValueChange={changeOperator}>
              <SelectTrigger className="w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          )}
        </React.Fragment>
      ))}
      
      {/* Show add and clear buttons at the bottom if first input has text */}
      {showOperatorSelect && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onChange(undefined)}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addCondition}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add condition
          </Button>
        </div>
      )}
    </div>
  );
}
