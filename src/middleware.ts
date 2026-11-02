import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing'; // Keep your existing config if using routing.ts

// Use your existing next-intl routing config
const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Run next-intl middleware first
  let response = handleI18nRouting(request);
  if (!response) response = NextResponse.next();

  // Set up Supabase SSR client with cookie sync
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value); // SSR
            response.cookies.set(name, value); // browser
          });
        },
      },
    }
  );

  // Get the authenticated user (refreshes token if expired)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /[locale]/dashboard
  const { pathname } = request.nextUrl;
  const [_, locale, section] = pathname.split('/'); // ['', 'en', 'dashboard']

  if (!user && section === 'dashboard') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/login`;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

// Apply middleware to all localized pages, excluding static assets
export const config = {
  matcher: [
    '/', // redirect to default locale
    '/(ar)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)', // exclude static files
  ],
};
