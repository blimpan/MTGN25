import { NextResponse, NextRequest } from 'next/server'
import useAuth from './components/useAuth'


export function middleware(request: NextRequest) {

    const { user } = useAuth();
    if (!user) { // User not logged in
        return NextResponse.redirect(new URL('/', request.url))
    } else {
        return NextResponse.next()
    }
}