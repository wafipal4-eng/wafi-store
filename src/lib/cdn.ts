export function cdn(url?: string) {
  if (!url) return '';

  const BUCKET = 'products-images';
  const SUPABASE_DOMAIN = 'dzjbvfixeezykmzotrdi.supabase.co';

  let finalUrl = url.replace(/^\//, '');

  if (!finalUrl.startsWith('http')) {
    const prefix = `${BUCKET}/`;
    const cleanPath = finalUrl.startsWith(prefix) ? finalUrl.slice(prefix.length) : finalUrl;
    finalUrl = `https://${SUPABASE_DOMAIN}/storage/v1/object/public/${BUCKET}/${cleanPath}`;
  }

  return finalUrl;
}
