import React, { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export interface ComboBoxOption {
  label: string;
  value: string;
  description?: string;
}


// Single-select combobox
interface ComboBoxProps {
  id: string;
  options: Array<ComboBoxOption>;
  placeholder: string;
  label?: string;
  value?: string; // Controlled value from react-hook-form
  onChange: (value: string, label?: string) => void; // Controlled onChange handler from react-hook-form
  disabled?: boolean;
}


export const ComboBox: React.FC<ComboBoxProps> = ({
  id,
  options,
  placeholder,
  value,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const selected = value ?? "";

  const handleSelect = (option: ComboBoxOption) => {
    if (disabled) return;
    if (selected === option.value) {
      onChange(""); // Deselect the option if it's already selected
    } else {
      onChange(option.value, option.label); // Update the value via react-hook-form
    }
    setOpen(false); // Close the dropdown after selection/deselection
  };

  // Sort options so selected is at the top
  const sortedOptions = [...options];
  if (selected) {
    sortedOptions.sort((a, b) => {
      if (a.value === selected) return -1;
      if (b.value === selected) return 1;
      return 0;
    });
  }

  return (
    <>
      <Popover open={open} onOpenChange={v => !disabled && setOpen(v)} modal={true} >
        <PopoverTrigger asChild>
          <div
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-disabled={disabled}
            className={cn(
              "border rounded-md flex items-center justify-between",
              "py-2 px-2 text-left whitespace-pre-wrap break-words",
              selected ? "" : "text-muted-foreground",
              disabled ? "bg-muted cursor-not-allowed opacity-60" : "cursor-pointer"
            )}
            onClick={() => { if (!disabled) setOpen(!open); }}
            tabIndex={disabled ? -1 : 0}
          >
            <span className="flex-1 text-sm">
              {selected
                ? options.find((option) => option.value === selected)?.label || placeholder
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          side="bottom"
          align="start"
          sideOffset={4}
          avoidCollisions={true}
          style={{ width: "var(--radix-popper-anchor-width)" }} // Match the trigger width
        >
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandList>
              <CommandEmpty>Not found.</CommandEmpty>
              <CommandGroup>
                {sortedOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option)}
                    keywords={[option.label, option.description || ""]}
                  >
                    <Checkbox
                      checked={selected === option.value}
                      onCheckedChange={() => handleSelect(option)}
                      className="mr-2"
                    />
                    <div className="flex flex-col">
                      {option.label}
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
};