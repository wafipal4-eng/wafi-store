'use client';

import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
  placeholder?: string;
}

export default function StockStatusSelect({
  value,
  onChange,
  placeholder,
}: Props) {
  const t = useTranslations("StockStatus");

  return (
    <Select
      value={value ? "true" : "false"}
      onValueChange={(val) => onChange(val === "true")}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? t("placeholder")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">{t("in")}</SelectItem>
        <SelectItem value="false">{t("out")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
