"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"

interface TagInputProps {
  placeholder?: string
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
}

export function TagInput({
  placeholder,
  value = [],
  onChange,
  disabled = false,
  onKeyDown,
  className,
  ...props
}: TagInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = React.useState("")

  const handleUnselect = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (onKeyDown) {
      onKeyDown(e)
    }

    if (e.key === "Enter" && inputValue) {
      e.preventDefault()
      if (!value.includes(inputValue) && inputValue.trim() !== "") {
        onChange([...value, inputValue])
        setInputValue("")
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <Command onKeyDown={handleKeyDown} className={cn("overflow-visible bg-transparent", className)} {...props}>
      <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="h-fit">
              {tag}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => handleUnselect(tag)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => {
              if (inputValue && !value.includes(inputValue)) {
                onChange([...value, inputValue])
                setInputValue("")
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="ml-1 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
          />
        </div>
      </div>
    </Command>
  )
}
