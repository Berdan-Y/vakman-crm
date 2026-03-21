import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import './bootstrap';
import { initializeTheme } from './hooks/use-appearance';
import i18n from './i18n';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Update CSRF token in meta tag and axios headers from Inertia props
const updateCsrfToken = (token: string) => {
    // Update meta tag
    const metaTag = document.head.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        (metaTag as HTMLMetaElement).content = token;
    }
    
    // Update axios default header (imported in bootstrap.ts)
    if (window.axios) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
};

// Listen for Inertia page loads to update CSRF token and locale
document.addEventListener('inertia:success', (event: any) => {
    const page = event.detail.page;
    if (page.props) {
        if (page.props.csrf_token) {
            updateCsrfToken(page.props.csrf_token);
        }
        if (page.props.locale) {
            i18n.changeLanguage(page.props.locale);
        }
    }
});

// Track if we're on an auth page
const isAuthPage = () => {
    const authPages = [
        '/login',
        '/register',
        '/password/reset',
        '/password/email',
        '/two-factor-challenge',
    ];
    return authPages.some((page) => window.location.pathname.startsWith(page));
};

// Handle 419 responses globally for Inertia requests
document.addEventListener('inertia:error', (event: any) => {
    const response = event.detail?.response;
    if (response && response.status === 419) {
        event.preventDefault();

        // Don't show error on auth pages or immediately after logout
        if (isAuthPage() || window.location.pathname === '/') {
            window.location.href = '/login';
            return;
        }

        // Check if user was recently active
        const lastActivity = sessionStorage.getItem('last_activity');
        const now = Date.now();
        const wasRecentlyActive =
            lastActivity && now - parseInt(lastActivity) < 5 * 60 * 1000;

        if (wasRecentlyActive) {
            if (
                confirm(
                    'Your session has expired. Would you like to reload the page?',
                )
            ) {
                window.location.reload();
            }
        } else {
            // Silently redirect to login if inactive
            window.location.href = '/login';
        }
    }
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        // Update CSRF token on initial load
        if (props.initialPage.props && (props.initialPage.props as any).csrf_token) {
            updateCsrfToken((props.initialPage.props as any).csrf_token);
        }

        // Set initial locale
        if (props.initialPage.props && (props.initialPage.props as any).locale) {
            i18n.changeLanguage((props.initialPage.props as any).locale);
        }

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
