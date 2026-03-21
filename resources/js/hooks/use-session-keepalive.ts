import { useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

/**
 * Keep the session alive by sending periodic requests while the user is active.
 * This prevents session expiration for users who keep the app open and interact with it.
 */
export function useSessionKeepAlive() {
    const lastActivityRef = useRef<number>(Date.now());
    const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Track user activity
        const updateActivity = () => {
            lastActivityRef.current = Date.now();
        };

        // Listen for various user activity events
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        // Send keep-alive request every 5 minutes if user has been active
        const startKeepAlive = () => {
            keepAliveIntervalRef.current = setInterval(() => {
                const now = Date.now();
                const timeSinceActivity = now - lastActivityRef.current;
                
                // Only send keep-alive if user was active in the last 10 minutes
                if (timeSinceActivity < 10 * 60 * 1000) {
                    // Make a lightweight request to keep session alive
                    fetch('/api/keep-alive', {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json',
                        },
                        credentials: 'same-origin',
                    }).catch(() => {
                        // Silently fail - session might have expired
                        // The next user action will trigger the 419 handler
                    });
                }
            }, 5 * 60 * 1000); // Every 5 minutes
        };

        startKeepAlive();

        // Cleanup
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
            
            if (keepAliveIntervalRef.current) {
                clearInterval(keepAliveIntervalRef.current);
            }
        };
    }, []);
}
