import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Skip middleware for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    // For now, let all routes pass through since useAuth can't be used in middleware
    // Authentication should be handled client-side in the components
    return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}