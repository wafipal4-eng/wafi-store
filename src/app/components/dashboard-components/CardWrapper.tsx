'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { getDashboardStats } from '@/app/lib/productService';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import Image from 'next/image';
import { cdn } from '@/lib/cdn';
type StatusCounts = Record<string, number>;

const PALETTE = [
  '#d41655', // brand pink
  '#6C63FF', // lavender/indigo
  '#2EC4B6', // mint
  '#4DABF7', // sky
  '#B197FC', // soft purple
  '#94D2BD', // seafoam
];

/* ---------- Donut component ---------- */
function StatusDonut({
  data,
  palette,
  t,
}: {
  data: { name: string; value: number }[];
  palette: string[];
  t: any;
}) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () => data.filter((d) => !hidden[d.name]),
    [data, hidden]
  );

  const total = filtered.reduce((s, d) => s + (d.value || 0), 0);
  const percentage = (v: number) => (total ? `${Math.round((v / total) * 100)}%` : '0%');

  return (
    <div className="relative">
      <div className="h-60">
        <ResponsiveContainer>
          <PieChart>
            <defs>
              <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Pie
              data={filtered}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={95}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              isAnimationActive
            >
              {filtered.map((entry, i) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={palette[i % palette.length]}
                  stroke="url(#ring)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, _name: string, entry: any) => [
                `${v} • ${percentage(v)}`,
                entry?.payload?.name,
              ]}
              contentStyle={{ borderRadius: 12, border: '1px solid #eee' }}
              labelStyle={{ color: '#3e3f5b' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center total */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-xs text-gray-500">{t('total')}</div>
        <div className="text-xl font-bold text-gray-900 tabular-nums">{total}</div>
      </div>

      {/* Toggle legend */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {data.map((d, i) => {
          const color = palette[i % palette.length];
          const isHidden = hidden[d.name];
          return (
            <button
              key={d.name}
              onClick={() => setHidden((h) => ({ ...h, [d.name]: !h[d.name] }))}
              className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs border transition
                ${isHidden ? 'opacity-50' : 'opacity-100'} bg-white/80 hover:bg-white`}
              style={{ borderColor: `${color}55` }}
              type="button"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate">{d.name}</span>
              <span className="ml-auto text-gray-500 tabular-nums">{d.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Main dashboard ---------- */
export default function CardWrapper() {
  const t = useTranslations('dashboard');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalSold: 0,
    totalSoldLastMonth: 0,
    totalSoldLastWeek: 0,
    totalProducts: 0,
    totalRevenue: 0,
    revenueLast30Days: 0,
    revenueLast7Days: 0,
    avgOrderValue: 0,
    ordersToday: 0,
    outOfStock: 0,
    lowStock: 0,
    newProducts30d: 0,
    activeCategories: 0,
    statusCounts: {} as StatusCounts,
    ordersByDay: [] as { date: string; orders: number; revenue: number }[],
    topProducts: [] as { id: number; name: string; main_image: string | null; totalSold: number }[],
  });

  useEffect(() => {
    (async () => {
      const data = await getDashboardStats();
      setStats(data);
      setLoading(false);
    })();
  }, []);

  const statusData = useMemo(
    () => Object.entries(stats.statusCounts).map(([name, value]) => ({ name, value })),
    [stats.statusCounts]
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="rounded-3xl p-6 border border-transparent bg-gradient-to-br from-white to-rose-50/50 shadow-sm">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <Card title={t('totalSold')} value={n(stats.totalSold)} loading={loading} />
          <Card title={t('totalProducts')} value={n(stats.totalProducts)} loading={loading} />
          <Card title={t('totalRevenue')} value={`₪${n(stats.totalRevenue, true)}`} loading={loading} accent />
          <Card title={t('avgOrderValue')} value={`₪${n(stats.avgOrderValue, true)}`} loading={loading} />
          <Card title={t('ordersToday')} value={n(stats.ordersToday)} loading={loading} />
          <Card title={t('activeCategories')} value={n(stats.activeCategories)} loading={loading} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mt-6">
          <Card title={t('soldLastMonth')} value={n(stats.totalSoldLastMonth)} loading={loading} />
          <Card title={t('soldLast7Days')} value={n(stats.totalSoldLastWeek)} loading={loading} />
          <Card title={t('revenueLast30Days')} value={`₪${n(stats.revenueLast30Days, true)}`} loading={loading} />
          <Card title={t('revenueLast7Days')} value={`₪${n(stats.revenueLast7Days, true)}`} loading={loading} />
          <Card title={t('outOfStock')} value={n(stats.outOfStock)} tone="danger" loading={loading} />
          <Card title={t('lowStock')} value={n(stats.lowStock)} loading={loading} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Orders last 30 days (Bar) */}
        <div className="rounded-3xl p-6 border border-transparent bg-gradient-to-br from-white to-indigo-50/50 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('ordersLast30Days')}</h3>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={stats.ordersByDay}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6C63FF" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#3e3f5b' }} />
                <YAxis tick={{ fill: '#3e3f5b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #eee' }}
                  labelStyle={{ color: '#3e3f5b' }}
                />
                <Bar dataKey="orders" fill="url(#ordersGradient)" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue last 30 days (Line) */}
        <div className="rounded-3xl p-6 border border-transparent bg-gradient-to-br from-white to-sky-50/60 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('revenueLast30DaysChart')}</h3>
          <div className="h-60">
            <ResponsiveContainer>
              <LineChart data={stats.ordersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#3e3f5b' }} />
                <YAxis tick={{ fill: '#3e3f5b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #eee' }}
                  labelStyle={{ color: '#3e3f5b' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  dot={false}
                  stroke="#2EC4B6"
                  strokeWidth={3}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order status breakdown (Donut) */}
        <div className="rounded-3xl p-6 border border-transparent bg-gradient-to-br from-white to-fuchsia-50/50 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('orderStatusBreakdown')}</h3>
          {statusData.length ? (
            <StatusDonut data={statusData} palette={PALETTE} t={t} />
          ) : (
            <div className="text-sm text-gray-500">—</div>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="rounded-3xl p-6 border border-transparent bg-gradient-to-br from-white to-rose-50/50 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('topProducts')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.topProducts.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl p-3 border border-gray-100 bg-white/70 backdrop-blur-[2px] hover:shadow-sm transition"
              style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.04)' }}
            >
              <div
                className="relative h-12 w-12 rounded-xl overflow-hidden"
                style={{ backgroundColor: `${PALETTE[idx % PALETTE.length]}20` }}
              >
                {p.main_image ? (
                  <Image
                    src={cdn(p.main_image)}
                    alt={p.name}
                    width={48}
                    height={48}
                    className="object-cover h-12 w-12"
                    sizes="48px"
                    quality={70}
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-500">{t('unitsSold', { n: p.totalSold })}</div>
              </div>
            </div>
          ))}
          {!stats.topProducts.length && (
            <div className="text-sm text-gray-500">{t('noTopProducts')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- UI bits ---------- */
function Card({
  title,
  value,
  tone,
  loading,
  accent,
}: {
  title: string;
  value: number | string;
  tone?: 'danger' | 'default';
  loading?: boolean;
  accent?: boolean;
}) {
  const base =
    'py-5 px-4 rounded-2xl text-center border transition will-change-transform hover:-translate-y-0.5';
  const styles =
    tone === 'danger'
      ? 'bg-red-50/70 border-red-100'
      : accent
        ? 'bg-gradient-to-br from-fuchsia-50 to-rose-50 border-transparent'
        : 'bg-white/80 border-gray-200';

  return (
    <div className={`${base} ${styles}`}>
      <h3 className="text-xs font-semibold text-gray-500 mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{loading ? '—' : value}</div>
    </div>
  );
}

function n(x: number, fixed = false) {
  return fixed ? Number(x || 0).toFixed(2) : (x ?? 0).toLocaleString();
}
