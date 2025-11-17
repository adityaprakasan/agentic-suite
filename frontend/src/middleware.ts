import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/', // Homepage should be public!
  '/auth',
  '/auth/callback',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/legal',
  '/api/auth',
  '/share', // Shared content should be public
  '/templates', // Template pages should be public
  '/enterprise', // Enterprise page should be public
];

// Routes that require authentication but are related to billing/trials
const BILLING_ROUTES = [
  '/activate-trial',
  '/subscription',
];

// Routes that require authentication and active subscription
const PROTECTED_ROUTES = [
  '/dashboard',
  '/agents',
  '/projects',
  '/settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // Allow all public routes without any checks
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Everything else requires authentication
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Redirect to auth if not authenticated
    if (authError || !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      url.searchParams.set('redirect', pathname);
      
      // If there's an auth error (invalid/expired tokens), clear cookies
      if (authError) {
        console.log('[MIDDLEWARE] Auth error, clearing cookies:', authError.message);
        const response = NextResponse.redirect(url);
        
        // Clear all Supabase auth cookies
        const cookiesToClear = [
          'sb-access-token',
          'sb-refresh-token',
          'sb-auth-token',
          'supabase-auth-token'
        ];
        
        cookiesToClear.forEach(cookieName => {
          response.cookies.delete(cookieName);
        });
        
        return response;
      }
      
      return NextResponse.redirect(url);
    }

    // Skip billing checks in local mode
    const isLocalMode = process.env.NEXT_PUBLIC_ENV_MODE?.toLowerCase() === 'local'
    if (isLocalMode) {
      return supabaseResponse;
    }

    // Skip billing checks for billing-related routes
    if (BILLING_ROUTES.some(route => pathname.startsWith(route))) {
      return supabaseResponse;
    }

    // Only check billing for protected routes that require active subscription
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      // Check if user has pending purchase intent (from pricing page)
      const hasPendingPurchase = request.cookies.get('pendingPurchase')?.value === 'true';
      
      const { data: accounts } = await supabase
        .schema('basejump')
        .from('accounts')
        .select('id')
        .eq('personal_account', true)
        .eq('primary_owner_user_id', user.id)
        .single();

      if (!accounts) {
        // If they have pending purchase, skip trial redirect and go to homepage/pricing
        if (hasPendingPurchase) {
          const url = request.nextUrl.clone();
          url.pathname = '/';
          url.hash = '#pricing';
          return NextResponse.redirect(url);
        }
        const url = request.nextUrl.clone();
        url.pathname = '/activate-trial';
        return NextResponse.redirect(url);
      }

      const accountId = accounts.id;
      const { data: creditAccount } = await supabase
        .from('credit_accounts')
        .select('tier, trial_status, trial_ends_at')
        .eq('account_id', accountId)
        .single();

      const { data: trialHistory } = await supabase
        .from('trial_history')
        .select('id')
        .eq('account_id', accountId)
        .single();

      const hasUsedTrial = !!trialHistory;

      if (!creditAccount) {
        // If they have pending purchase, skip trial redirect and go to homepage/pricing
        if (hasPendingPurchase) {
          const url = request.nextUrl.clone();
          url.pathname = '/';
          url.hash = '#pricing';
          return NextResponse.redirect(url);
        }
        
        if (hasUsedTrial) {
          const url = request.nextUrl.clone();
          url.pathname = '/subscription';
          return NextResponse.redirect(url);
        } else {
          const url = request.nextUrl.clone();
          url.pathname = '/activate-trial';
          return NextResponse.redirect(url);
        }
      }

      const hasTier = creditAccount.tier && creditAccount.tier !== 'none' && creditAccount.tier !== 'free';
      const hasActiveTrial = creditAccount.trial_status === 'active';
      const trialExpired = creditAccount.trial_status === 'expired' || creditAccount.trial_status === 'cancelled';
      const trialConverted = creditAccount.trial_status === 'converted';
      
      if (hasTier && (trialConverted || !trialExpired)) {
        return supabaseResponse;
      }

      if (!hasTier && !hasActiveTrial && !trialConverted) {
        if (hasUsedTrial || trialExpired || creditAccount.trial_status === 'cancelled') {
          const url = request.nextUrl.clone();
          url.pathname = '/subscription';
          return NextResponse.redirect(url);
        } else {
          const url = request.nextUrl.clone();
          url.pathname = '/activate-trial';
          return NextResponse.redirect(url);
        }
      } else if ((trialExpired || trialConverted) && !hasTier) {
        const url = request.nextUrl.clone();
        url.pathname = '/subscription';
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  } catch (error: any) {
    console.error('[MIDDLEWARE] Unexpected error:', error?.message || error);
    
    // If it's an auth-related error, clear cookies and redirect to auth
    if (error?.__isAuthError || error?.status === 400 || error?.code?.includes('token')) {
      console.log('[MIDDLEWARE] Auth error in catch block, clearing cookies');
      const url = request.nextUrl.clone();
      url.pathname = '/auth';
      const response = NextResponse.redirect(url);
      
      // Clear all Supabase auth cookies
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'sb-auth-token',
        'supabase-auth-token'
      ];
      
      cookiesToClear.forEach(cookieName => {
        response.cookies.delete(cookieName);
      });
      
      return response;
    }
    
    // For non-auth errors, fail open (let the request through)
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - root path (/)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 