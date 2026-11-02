"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

export default function QuantityInput({
  value,
  onChange,
  label = "Quantity",
  min = 0,
  max = 999,
}: QuantityInputProps) {
  const handleChange = (newValue: number) => {
    const clamped = Math.max(min, Math.min(max, newValue));
    onChange(clamped);
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor="quantity-input" className="block text-sm font-medium">
          {label}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleChange(value - 1)}
          disabled={value <= min}
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          id="quantity-input"
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) =>
            handleChange(Number.parseInt(e.target.value) || min)
          }
          className="w-16 h-8 text-center"
          aria-label="Quantity"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleChange(value + 1)}
          disabled={value >= max}
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
