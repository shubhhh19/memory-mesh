import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // provider name
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
        );
    }

    if (!code || !state) {
        return NextResponse.redirect(
            new URL('/login?error=missing_code', request.url)
        );
    }

    try {
        // Call backend OAuth callback endpoint
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${apiBaseUrl}/v1/auth/oauth/callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                provider: state,
                code: code,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.redirect(
                new URL(`/login?error=${encodeURIComponent(errorData.detail || 'oauth_failed')}`, request.url)
            );
        }

        const data = await response.json();

        // Create response that redirects to dashboard
        const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));

        // Set tokens in cookies (encrypted in production)
        redirectResponse.cookies.set('auth_tokens', JSON.stringify(data), {
            httpOnly: false, // Need to be accessible by client
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: data.expires_in,
            path: '/',
        });

        return redirectResponse;
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(
            new URL('/login?error=oauth_error', request.url)
        );
    }
}
