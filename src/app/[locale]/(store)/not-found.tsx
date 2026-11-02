import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from "next/image";
export default function NotFoundPage() {
    const t = useTranslations('NotFoundPage');
    const locale = useLocale();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-6">
            <div className={`text-center ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
                <Image
                    src="/images/not-found.svg"
                    alt={t('imageAlt')}
                    width={300}  // Adjust as needed
                    height={300} // Adjust as needed
                    className="w-72 md:w-96 mx-auto mb-6 dark:invert"
                />

                <h1
                    className="mb-4 text-7xl lg:text-9xl font-extrabold tracking-tight text-primary"
                >
                    404
                </h1>

                <p className="mb-4 text-3xl font-bold tracking-tight md:text-4xl text-primary">
                    {t('title')}
                </p>

                <p className="mb-4 text-lg font-light text-secondary-700">
                    {t('description')}
                </p>
            </div>
        </div>
    );
}