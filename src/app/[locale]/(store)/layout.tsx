import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Sidebar from '@/app/components/shared-components/Sidebar';
import Navbar from '@/app/components/shared-components/Navbar';
import Footer from '@/app/components/shared-components/Footer';
import { CartProvider } from "@/app/context/CartContext";
import WhatsAppFloatingButton from "@/app/components/shared-components/FloatingWhatsApp";
import { SubscriptionGuard } from '@/app/components/guards/SubscriptionGuard';
import StoreVisitorTracker from "@/app/components/shared-components/StoreVisitorTracker";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;


  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <>
      <div className="luxury-stars"></div>
      <NextIntlClientProvider locale={locale}>
      <SubscriptionGuard>
        <CartProvider>
          <StoreVisitorTracker />
          
          <Navbar />
          <Sidebar>
            {children}
            <WhatsAppFloatingButton />

          </Sidebar>
          <Footer />
        </CartProvider>
      </SubscriptionGuard>
      </NextIntlClientProvider>
    </>
  );
}
