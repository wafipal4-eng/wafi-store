'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export const RecentLogs = () => {
  const t = useTranslations("recentLogs");
  const locale = useLocale();
  const isRtl = locale === 'he' || locale === 'ar' || locale === 'fa' || locale === 'ur';

  const logs = [
    { time: t('log1Time'), message: t('log1Msg') },
    { time: t('log2Time'), message: t('log2Msg') },
    { time: t('log3Time'), message: t('log3Msg') }
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100 overflow-hidden"
    >
      {logs.map((log, index) => (
        <div
          key={index}
          className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition"
        >
          <div className="flex-shrink-0 mt-1 text-indigo-500">
            <Clock size={18} className="opacity-60" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-800">{log.message}</p>
            <span className="text-xs text-gray-400">{log.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
