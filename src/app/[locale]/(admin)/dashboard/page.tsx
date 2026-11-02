'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import CardWrapper from '@/app/components/dashboard-components/CardWrapper';
import AnalyticsCard from '@/app/components/dashboard-components/AnalyticsCard';
import QuickActions from '@/app/components/dashboard-components/QuickActions';
import LowStockAlerts from '@/app/components/dashboard-components/LowStockAlerts';
import { store_id } from '@/app/lib/constants';
import VisitorTracker from '@/app/components/shared-components/VisitorTracker';

/* Lazy-load heavy widgets for faster first paint */
const OrdersOverTime = dynamic(
  () => import('@/app/components/charts/stores').then((m) => m.OrdersOverTime),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const TopSoldProducts = dynamic(
  () => import('@/app/components/charts/stores/topSoldProducts'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);
const RecentOrders = dynamic(
  () => import('@/app/components/charts/stores/latestOrders'),
  { ssr: false, loading: () => <ListSkeleton /> }
);
const OrderStatusChart = dynamic(
  () => import('@/app/components/charts/OrderStatusChart'),
  { ssr: false, loading: () => <ChartSkeleton /> }
);

export default function Page() {
  const t = useTranslations('dashboard');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('title')}</h1>
        </div>
        
      </header>

      {/* KPIs */}
      <section aria-label="Summary">
        <CardWrapper />
      </section>


      {/* Analytics */}
      <section aria-label="Analytics">
        <AnalyticsCard />
      </section>

      {/* Visitor Tracker */}
      <section aria-label="Visitor Tracker">
        <VisitorTracker />
      </section>

      {/* Charts */}
      {/* <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title={t('ordersLast30Days')} gradient="to-indigo-50/50">
          <OrdersOverTime storeId={store_id} />
        </SectionCard>

        <SectionCard title={t('topProducts')} gradient="to-rose-50/50">
          <TopSoldProducts storeId={store_id} />
        </SectionCard>
      </section> */}

      {/* Recent Orders */}
      <SectionCard title={t('latestOrders')} noHeaderLink>
        <RecentOrders />
      </SectionCard>
    </main>
  );
}

/* ---------- Reusable card wrapper for sections ---------- */
function SectionCard({
  title,
  children,
  gradient = 'to-gray-50',
  noHeaderLink = false,
}: {
  title: string;
  children: React.ReactNode;
  gradient?: string;
  noHeaderLink?: boolean;
}) {
  return (
    <section
      className={`rounded-3xl p-6 border border-transparent bg-gradient-to-br from-white ${gradient} shadow-sm`}
      aria-label={title}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
        {!noHeaderLink && (
          <span className="text-xs text-gray-400 select-none"> </span>
        )}
      </div>
      {children}
    </section>
  );
}

/* ---------- Lightweight skeletons (subtle shimmer) ---------- */
function ChartSkeleton() {
  return (
    <div className="h-60 rounded-2xl bg-gray-200/50 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.6s_infinite]" />
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-gray-200/50 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.6s_infinite]" />
        </div>
      ))}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}



