'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getOrderStatusBreakdown } from '@/app/lib/productService';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    Pending: '#f59e0b',
    Shipped: '#3b82f6',
    Delivered: '#10b981',
    Cancelled: '#ef4444',
};

export default function OrderStatusChart() {
    const t = useTranslations('dashboard');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const breakdown = await getOrderStatusBreakdown();

                // Transform to chart data
                const chartData = Object.entries(breakdown).map(([status, count]) => ({
                    name: t(status),
                    value: count as number,
                    status,
                }));

                setData(chartData);
            } catch (error) {
                console.error('Failed to fetch order status breakdown:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [t]);

    if (loading) {
        return (
            <div className="rounded-xl p-6 bg-white shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orderStatus')}</h2>
                <div className="h-64 rounded-lg bg-gray-100 animate-pulse" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="rounded-xl p-6 bg-white shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('orderStatus')}</h2>
                <div className="text-center py-12 text-gray-500">
                    <p>{t('noRecentOrders')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl p-6 bg-white shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">{t('orderStatus')}</h2>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
