/**
 * Fetches users from sessionStorage if available, otherwise fetches from API and caches them.
 * @param user The authenticated user object with getIdToken method
 * @returns Promise resolving to the users array
 */
export async function getOrFetchUsers(user: { getIdToken: () => Promise<string> }): Promise<any[]> {
    if (!user) throw new Error('User not authenticated');

    const CACHE_KEY = "users";
    const CACHE_EXPIRY_HOURS = 12;
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            // Check for timestamp and expiry
            if (parsed && parsed._cachedAt) {
                const now = Date.now();
                const cachedAt = parsed._cachedAt;
                const diffHours = (now - cachedAt) / (1000 * 60 * 60);
                if (diffHours < CACHE_EXPIRY_HOURS && parsed.data) {
                    return parsed.data;
                }
            }
        } catch {
            // If parsing fails, fall through to fetch
        }
    }

    const token = await user.getIdToken();
    const response = await fetch('/api/getUsers', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, _cachedAt: Date.now() }));
    return data;
}
