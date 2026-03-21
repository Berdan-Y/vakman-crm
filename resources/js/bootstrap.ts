import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = (
        token as HTMLMetaElement
    ).content;
} else {
    console.error(
        'CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token',
    );
}

// Make axios available globally for CSRF token updates
window.axios = axios;

// Function to update CSRF token from meta tag
const updateCsrfToken = () => {
    const tokenMeta = document.head.querySelector('meta[name="csrf-token"]');
    if (tokenMeta) {
        const newToken = (tokenMeta as HTMLMetaElement).content;
        axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
    }
};

// Track if we're currently on an auth page
const isAuthPage = () => {
    const authPages = ['/login', '/register', '/password/reset', '/password/email', '/two-factor-challenge'];
    return authPages.some(page => window.location.pathname.startsWith(page));
};

// Add response interceptor to handle 419 CSRF errors
axios.interceptors.response.use(
    (response) => {
        // Update CSRF token after successful requests that might regenerate session
        updateCsrfToken();
        return response;
    },
    (error) => {
        if (error.response?.status === 419) {
            // Don't show error on auth pages or if we just logged out
            if (isAuthPage() || window.location.pathname === '/') {
                return Promise.reject(error);
            }
            
            // CSRF token expired - reload to get a fresh token
            const message = 'Your session has expired. The page will reload to refresh your session.';
            
            // Only show confirmation if user was actively using the app
            const lastActivity = sessionStorage.getItem('last_activity');
            const now = Date.now();
            const wasRecentlyActive = lastActivity && (now - parseInt(lastActivity)) < 5 * 60 * 1000; // 5 minutes
            
            if (wasRecentlyActive) {
                if (window.confirm(message)) {
                    window.location.reload();
                } else {
                    setTimeout(() => window.location.reload(), 3000);
                }
            } else {
                // Just reload silently if they haven't been active
                window.location.reload();
            }
        }
        return Promise.reject(error);
    }
);

// Track user activity
const trackActivity = () => {
    sessionStorage.setItem('last_activity', Date.now().toString());
};

// Track on various events
if (typeof window !== 'undefined') {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        window.addEventListener(event, trackActivity, { passive: true, once: false });
    });
}

export default axios;
