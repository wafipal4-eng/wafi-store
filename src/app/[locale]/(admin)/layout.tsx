import '@/app/globals.css';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import SideBar from '@/app/components/dashboard-components/SideBar';
import { getMessages } from 'next-intl/server';
import Head from 'next/head';
import { ReactNode } from 'react';
import { Toaster } from "sonner";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await the params to resolve the Promise
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <body className="bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Toaster
            position="top-center"
            richColors
            expand={false}
            duration={4000}
            toastOptions={{
              style: {
                margin: '0 auto',
                left: '50%',
                transform: 'translateX(-50%)',
                maxWidth: '90vw',
                zIndex: 9999,
              },
              className: 'toast-center',
            }}
          />
          <div className="flex  flex-col">
            <div className="flex  overflow-hidden">
              {/* Sidebar */}
              <SideBar />

              {/* Content */}
              <main className="flex-1 overflow-y-auto px-2 py-6 md:p-10 bg-gray-50">
                {children}
              </main>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}