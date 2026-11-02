import '@/app/globals.css';
import { ReactNode } from 'react';
import { favicon, main_color } from '@/app/lib/constants';
import { Toaster } from "sonner";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === 'ar';

  return (
    <html lang={isArabic ? 'ar' : 'en'} dir={isArabic ? 'rtl' : 'ltr'}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />

        <link rel="icon" href={favicon} sizes="64x32" />

        {/* PWA manifest and iOS meta tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={main_color} />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />


      </head>

      <body>
        <Toaster
          position="top-center"
          richColors
          expand={false}
          toastOptions={{
            style: {
              margin: '0 auto',
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '90vw',
            },
            className: 'toast-center',
          }}
        />
        <div>{children}</div>
      </body>
    </html>
  );
}
