import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    // Match only internationalized pathnames
    // Skip api routes, admin routes, _next, and static files
    matcher: [
        // Match all pathnames except for
        // - api routes
        // - admin routes (keep admin in English only for simplicity)
        // - _next
        // - static files
        '/((?!api|admin|_next|.*\\..*).*)'
    ]
};
