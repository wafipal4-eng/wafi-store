"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";

import {
  getVisitorsToday,
  getVisitorsThisMonth,
  getMostVisitedProducts,
  PopularProduct,
} from "@/app/lib/analyticsService";

import { Users, BarChart3, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsCard() {
  const t = useTranslations("Analytics");
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [todayVisitors, setTodayVisitors] = useState(0);
  const [monthVisitors, setMonthVisitors] = useState(0);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [today, month, products] = await Promise.all([
          getVisitorsToday(),
          getVisitorsThisMonth(),
          getMostVisitedProducts(5),
        ]);

        setTodayVisitors(today);
        setMonthVisitors(month);
        setPopularProducts(products);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  /* -------------------------------------- */
  /* LOADING STATE                          */
  /* -------------------------------------- */
  if (loading) {
    return (
      <Card dir={dir} className="p-6">
        <Skeleton className="h-6 w-1/3 mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>

        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </Card>
    );
  }

  /* -------------------------------------- */
  /* MAIN UI                                */
  /* -------------------------------------- */
  return (
    <Card dir={dir} className="p-6 shadow-sm border rounded-xl bg-card">
      <CardHeader className={dir === "rtl" ? "text-right p-0 mb-5" : "text-left p-0 mb-5"}>
        <CardTitle className="text-xl flex items-center gap-2 text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          {t("title") || "Visitor Analytics"}
        </CardTitle>
      </CardHeader>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatBox
          icon={<Users className="h-6 w-6 text-blue-600" />}
          value={todayVisitors}
          label={t("todayVisitors")}
          dir={dir}
        />

        <StatBox
          icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
          value={monthVisitors}
          label={t("monthlyVisitors")}
          dir={dir}
        />
      </div>

      {/* POPULAR PRODUCTS */}
      {popularProducts.length > 0 && (
        <div>
          <h3
            className={`text-sm font-semibold text-muted-foreground mb-3 ${
              dir === "rtl" ? "text-right" : "text-left"
            }`}
          >
            {t("popularProducts")}
          </h3>

          <ScrollArea className="pr-2">
            <div className="space-y-2">
              {popularProducts.map((item, index) => (
                <div
                  key={item.product_id}
                  className={`flex items-center justify-between rounded-md border bg-muted p-3 hover:bg-muted/80 transition ${
                    dir === "rtl" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* LEFT SIDE CONTENT */}
                  <div
                    className={`flex items-center gap-3 min-w-0 ${
                      dir === "rtl" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Badge className="rounded-full px-2 py-1 text-xs" dir="ltr">
                      {index + 1}
                    </Badge>

                    <p className="text-sm text-foreground truncate">
                      {item.product?.name ||
                        `${t("product")} #${item.product_id}`}
                    </p>
                  </div>

                  {/* VIEWS (ALWAYS LTR) */}
                  <span className="text-sm font-semibold text-foreground" dir="ltr">
                    {item.views} {t("views")}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------- */
/* REUSABLE STAT BOX                      */
/* -------------------------------------- */
function StatBox({
  icon,
  value,
  label,
  dir,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  dir: "rtl" | "ltr";
}) {
  return (
    <div className="rounded-xl border bg-muted p-4 hover:bg-muted/80 transition">
      <div
        className={`flex items-center justify-between ${
          dir === "rtl" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {icon}

        {/* NUMBERS ALWAYS LTR */}
        <span className="text-3xl font-bold text-foreground" dir="ltr">
          {value}
        </span>
      </div>

      <p
        className={`mt-2 text-xs font-medium text-muted-foreground ${
          dir === "rtl" ? "text-right" : "text-left"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
