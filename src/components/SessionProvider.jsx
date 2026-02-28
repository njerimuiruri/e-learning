'use client';

/**
 * SessionProvider - Simple wrapper that passes through children
 * Session management is now handled by middleware and explicit login/logout actions
 * No automatic redirects based on cookies
 */
export default function SessionProvider({ children }) {
    return children;
}
