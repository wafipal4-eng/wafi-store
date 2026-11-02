"use client";

import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Category } from "@/app/lib/interfaces";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

export default function MultiCategorySelect({
  categories = [],
  selectedCategories = [],
  setSelectedCategories,
  isRtl,
  t,
}: {
  categories: Category[];
  selectedCategories: string[];
  setSelectedCategories: (ids: string[]) => void;
  isRtl: boolean;
  t: (key: string | any) => string;
}) {
  const toggleCategory = (id: string) => {
    setSelectedCategories(
      selectedCategories.includes(id)
        ? selectedCategories.filter((catId) => catId !== id)
        : [...selectedCategories, id]
    );
  };

  const selectedNames = categories
    .filter((cat) => selectedCategories.includes(cat.id))
    .map((cat) => cat.name)
    .join(", ");

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <Label
        htmlFor="category"
        className={cn("block mb-1", isRtl ? "text-right" : "text-left")}
      >
        {t("category")}
      </Label>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className={cn(
              "w-full flex items-center",
              isRtl ? "flex-row-reverse justify-between text-right" : "justify-between text-left"
            )}
          >
            <span className="truncate">
              {selectedCategories.length > 0
                ? selectedNames
                : t("selectCategory")}
            </span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 opacity-50", isRtl ? "mr-2" : "ml-2")}
            />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-full max-h-60 p-0"
          align={isRtl ? "end" : "start"}
          sideOffset={8}
        >
          <Command>
            <CommandInput
              placeholder={t("search")}
              className={cn("h-9", isRtl && "text-right")}
            />
            <CommandEmpty>{t("noCategories")}</CommandEmpty>
            <CommandList className="max-h-48 overflow-auto">
              {categories.map((cat) => {
                const selected = selectedCategories.includes(cat.id);
                const parent = cat.parent_id ? categories.find(c => String(c.id) === String(cat.parent_id)) : null;
                return (
                  <CommandItem
                    key={cat.id}
                    onSelect={() => toggleCategory(cat.id)}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 cursor-pointer",
                      isRtl ? "flex-row-reverse text-right" : "text-left"
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{cat.name}</span>
                      {parent && (
                        <span className="text-[10px] text-muted-foreground">
                          {parent.name} › {cat.name}
                        </span>
                      )}
                    </div>
                    {selected && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
