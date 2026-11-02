import { supabase, name } from './constants';

/**
 * Track footer logo click
 * Inserts a record into my-info table
 */
export async function trackFooterLogoClick() {
    try {
        const { error } = await supabase
            .from('my-info')
            .insert({
                action: 'footer_logo_clicked',
                source: name,
            });

        if (error) {
            console.error('Error tracking footer logo click:', error);
        } else {
            console.log('✅ Footer logo click tracked');
        }
    } catch (err) {
        console.error('Exception tracking footer logo click:', err);
    }
}
