"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import {
  trackVisit,
  getVisitorsToday,
  getVisitorsThisWeek,
  getVisitorsThisMonth,
  getAllTimeVisitors,
  getDailyVisitors,
  getWeeklyVisitorsTrend,
  getMonthlyVisitorsTrend,
  getMostVisitedProducts,
} from "@/app/lib/analyticsService";

/* SHADCN COMPONENTS */
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

/* -------------------------------------------------------------
   MAIN COMPONENT
------------------------------------------------------------- */
export default function VisitorTracker() {
  const pathname = usePathname();
  const locale = useLocale(); // ⭐ for RTL/LTR
  const dir = locale === "ar" ? "rtl" : "ltr";

  const lastTracked = useRef<string>("");
  const t = useTranslations("VisitorTracker");

  const [loading, setLoading] = useState(true);

  // SUMMARY
  const [today, setToday] = useState(0);
  const [week, setWeek] = useState(0);
  const [month, setMonth] = useState(0);
  const [allTime, setAllTime] = useState(0);

  // POPULAR
  const [popularProducts, setPopularProducts] = useState<any[]>([]);

  /* TRACK VISITS */
  useEffect(() => {
    if (!pathname) return;
    if (pathname === lastTracked.current) return;

    const id = setTimeout(() => {
      trackVisit(pathname);
      lastTracked.current = pathname;
    }, 500);

    return () => clearTimeout(id);
  }, [pathname]);

  /* LOAD ANALYTICS */
  useEffect(() => {
    async function load() {
      setLoading(true);

      const [t1, w, m, all] = await Promise.all([
        getVisitorsToday(),
        getVisitorsThisWeek(),
        getVisitorsThisMonth(),
        getAllTimeVisitors(),
      ]);

      setToday(t1);
      setWeek(w);
      setMonth(m);
      setAllTime(all);

      const popular = await getMostVisitedProducts(5);
      setPopularProducts(popular);

      setLoading(false);
    }

    load();
  }, []);

  /* LOADING STATE */
  if (loading)
    return (
      <div dir={dir} className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );

  return (
    <div dir={dir} className="space-y-10 p-6">

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnalyticsCard title={t("today")} value={today} />
        <AnalyticsCard title={t("thisWeek")} value={week} />
        <AnalyticsCard title={t("thisMonth")} value={month} />
        <AnalyticsCard title={t("allTime")} value={allTime} />
      </div>



    </div>
  );
}

/* SUMMARY CARD */
function AnalyticsCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="transition-all hover:shadow-sm">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Numbers should stay LTR */}
        <div className="text-3xl font-bold" dir="ltr">{value}</div>
      </CardContent>
    </Card>
  );
}
