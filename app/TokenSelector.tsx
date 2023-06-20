"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { TokenData } from "./page"

export function TokenSelector({
  tokens,
  value,
  setValue,
}: {
  tokens: TokenData[]
  value: string
  setValue: (value: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 justify-between"
        >
          {value
            ? tokens.find((token) => token.value === value)?.label
            : "Select token..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex-1 p-0" side="bottom" align="center">
        <Command>
          <CommandInput placeholder="Search tokens..." />
          <CommandEmpty>No token found.</CommandEmpty>
          <CommandGroup>
            {tokens.map((token) => (
              <CommandItem
                key={token.value}
                onSelect={(currentValue) => {
                  setValue(token.mint === value ? "" : token.mint)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === token.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {token.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
