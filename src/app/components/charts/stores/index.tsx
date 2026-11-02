'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from '@/components/ui/chart';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { fetchOrders } from '@/app/lib/productService';

interface Order {
  created_at: string;
  total_price: number;
}

interface ChartData {
  date: string;
  total: number;
  formattedDate: string;
}

export function OrdersOverTime({
  className,
  storeId,
}: {
  className?: string;
  storeId: number;
}) {
  const t = useTranslations('orders_over_time');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchOrders(storeId);
        const filtered = data.filter((order) => order.created_at);
        setOrders(filtered);
      } catch (err) {
        setError(t('errorMessage'));
        console.error('Error fetching orders:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [storeId, t]);

  const groupedData = orders.reduce<Record<string, { total: number; fullDate: Date }>>((acc, order) => {
    const fullDate = new Date(order.created_at);
    const dateKey = fullDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    if (!acc[dateKey]) {
      acc[dateKey] = { total: 0, fullDate };
    }
    acc[dateKey].total += order.total_price ?? 0;
    return acc;
  }, {});

  const chartData: ChartData[] = Object.entries(groupedData)
    .sort(([, a], [, b]) => a.fullDate.getTime() - b.fullDate.getTime())
    .map(([date, { total, fullDate }]) => ({
      date,
      total,
      formattedDate: fullDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    }));

  const totalRevenue = chartData.reduce((sum, item) => sum + item.total, 0);
  const averageDaily = chartData.length > 0 ? totalRevenue / chartData.length : 0;

  const chartConfig = {
    total: {
      label: t('tooltipRevenue'),
      color: 'hsl(var(--chart-1))',
    },
  };

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-[280px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="text-destructive">{t('errorTitle')}</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
            <Calendar className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noDataTitle')}</p>
            <p className="text-sm">{t('noDataDescription')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t('totalRevenue')}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
              ₪{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                {t('dailyAverage')}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
              ₪{averageDaily.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs fill-muted-foreground"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs fill-muted-foreground"
                  tickFormatter={(value) => `₪${value.toLocaleString()}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        `₪${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                        t('tooltipRevenue')
                      ]}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.formattedDate || label
                      }
                    />
                  }
                />

                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-total)"
                  strokeWidth={3}
                  connectNulls={true}
                  dot={{
                    r: 4,
                    strokeWidth: 2,
                    stroke: "var(--color-total)",
                    fill: "hsl(var(--background))",
                  }}
                  activeDot={{
                    r: 6,
                    strokeWidth: 2,
                    stroke: "var(--color-total)",
                    fill: "var(--color-total)",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
