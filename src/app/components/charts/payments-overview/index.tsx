"use client";

import { useTranslations } from "next-intl";
// import { PeriodPicker } from "@/app/components/charts/PeriodPicker";
import { standardFormat } from "@/app/lib/format-number";
import { cn } from "@/app/lib/utils";
import { getPaymentsOverviewData } from "@/app/dummy-data/data";
import { PaymentsOverviewChart } from "./chart";
import { useEffect, useState } from "react";

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export function PaymentsOverview({
  timeFrame = "monthly",
  className,
}: PropsType) {
  const t = useTranslations("payments_overview");
  const [data, setData] = useState<{ received: any[]; due: any[] } | null>(null);

  useEffect(() => {
    getPaymentsOverviewData(timeFrame).then(setData);
  }, [timeFrame]);

  if (!data) return null; // Optional: Add a spinner/loading UI here

  const totalReceived = data.received.reduce((acc, { y }) => acc + y, 0);
  const totalDue = data.due.reduce((acc, { y }) => acc + y, 0);

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm p-6 md:p-8 space-y-6 border border-gray-100 dark:bg-gray-900 dark:border-gray-800",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("title")}
        </h2>
        {/* <PeriodPicker defaultValue={timeFrame} sectionKey="payments_overview" /> */}
      </div>

      {/* Chart */}
      <PaymentsOverviewChart data={data} />

      {/* Totals */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x text-center border-t pt-6 dark:divide-gray-700">
        <div className="space-y-1 pt-4 sm:pt-0">
          <dt className="text-2xl font-bold text-gray-900 dark:text-white">
            ${standardFormat(totalReceived)}
          </dt>
          <dd className="text-sm text-gray-600 dark:text-gray-400">{t("received")}</dd>
        </div>

        <div className="space-y-1 pt-4 sm:pt-0">
          <dt className="text-2xl font-bold text-gray-900 dark:text-white">
            ${standardFormat(totalDue)}
          </dt>
          <dd className="text-sm text-gray-600 dark:text-gray-400">{t("due")}</dd>
        </div>
      </dl>
    </div>
  );
}
