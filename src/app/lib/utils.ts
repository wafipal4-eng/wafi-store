import type { RevenueChartInterface } from './interfaces';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export const generateYAxis = ({ steps, data }: RevenueChartInterface) => {
  steps = steps || 5000;
  const yAxisLabels: string[] = [];
  const highestRecord = Math.max(...data.map((month) => month.revenue));
  const topLabel = Math.ceil(highestRecord / 5000) * 5000;

  for (let i = topLabel; i >= 0; i -= steps) {
    yAxisLabels.push(`$${i / 1000}K`);
  }

  return { yAxisLabels, topLabel };
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// app/lib/utils.ts

export function cartesianProduct(attrGroups: Record<string, string[]>) {
  const keys = Object.keys(attrGroups);
  if (!keys.length) return [];

  const combine = (index: number, acc: Record<string, string>[]): Record<string, string>[] => {
    if (index === keys.length) return acc;

    const key = keys[index];
    const result: Record<string, string>[] = [];

    for (const val of attrGroups[key]) {
      for (const combo of acc) {
        result.push({ ...combo, [key]: val });
      }
    }

    return combine(index + 1, result);
  };

  return combine(0, [{}]);
}
