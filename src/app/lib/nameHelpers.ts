/**
 * Helper functions for getting localized names based on current locale
 * 
 * Logic:
 * - Primary language (defined in constants): Always uses the 'name' column
 * - Secondary languages: Use 'secondary_name' when available, falls back to 'name'
 * 
 * To change supported languages, edit SUPPORTED_LANGUAGES/**
 * Get localized name based on current locale
 * Falls back to primary name if secondary is not available or locale is Arabic
 */
import { isPrimaryLocale } from './constants';

export function getLocalizedName(
    primaryName: string,
    secondaryName?: string,
    locale?: string
): string {
    const effectiveLocale = locale || (typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'ar');

    // If Arabic locale or no secondary name, use primary
    if (!secondaryName || isPrimaryLocale(effectiveLocale)) {
        return primaryName;
    }

    // For other locales, use secondary name
    return secondaryName;
}

/**
 * Get product name based on current locale
 */
export function getProductName(
    product: { name: string; secondary_name?: string },
    locale?: string
): string {
    return getLocalizedName(product.name, product.secondary_name, locale);
}

/**
 * Get category name based on current locale
 */
export function getCategoryName(
    category: { name: string; secondary_name?: string },
    locale?: string
): string {
    return getLocalizedName(category.name, category.secondary_name, locale);
}

/**
 * Get product description based on current locale
 */
export function getProductDescription(
    product: { description: string; secondary_description?: string },
    locale?: string
): string {
    return getLocalizedName(product.description, product.secondary_description, locale);
}

/**
 * Get category description based on current locale
 */
export function getCategoryDescription(
    category: { description?: string; secondary_description?: string },
    locale?: string
): string {
    if (!category.description) return '';
    return getLocalizedName(category.description, category.secondary_description, locale);
}
