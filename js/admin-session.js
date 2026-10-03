// ============================================
// ADMIN SESSION WATCHDOG
// Auto-logout after inactivity
// ============================================

(function() {
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
    const CHECK_INTERVAL_MS = 60 * 1000;         // check every 1 minute
    const WARN_BEFORE_MS = 5 * 60 * 1000;        // warn 5 min before logout

    let lastActivity = Date.now();
    let warned = false;

    // Reset timer on any user interaction
    ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evt => {
        document.addEventListener(evt, () => {
            lastActivity = Date.now();
            warned = false;
        }, { passive: true });
    });

    async function checkActivity() {
        const idleMs = Date.now() - lastActivity;

        // Warn 5 minutes before logout
        if (!warned && idleMs > (INACTIVITY_LIMIT_MS - WARN_BEFORE_MS)) {
            warned = true;
            alert('⚠️ You will be logged out in 5 minutes due to inactivity. Click anywhere to stay logged in.');
        }

        // Force logout
        if (idleMs >= INACTIVITY_LIMIT_MS) {
            console.log('🚪 Auto-logout: inactivity limit reached');
            try {
                await supabase.auth.signOut();
            } catch (e) {
                console.warn('signOut failed:', e);
            }
            sessionStorage.clear();
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');
            window.location.href = 'index.html?reason=timeout';
        }
    }

    setInterval(checkActivity, CHECK_INTERVAL_MS);

    // Also check on tab focus (user came back after being away)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) checkActivity();
    });

    console.log('🔒 Session watchdog active — auto-logout after 30 min of inactivity');
})();
