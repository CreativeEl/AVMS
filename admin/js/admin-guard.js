// ============================================
// ADMIN GUARD — runs on every admin page
// Verifies Supabase session + admin role.
// Adds body.authed to reveal the page.
// Redirects to admin/index.html if invalid.
// ============================================
(function () {
    'use strict';

    var LOGIN_URL = 'index.html';

    function redirectToLogin() {
        try {
            sessionStorage.removeItem('adminSession');
            sessionStorage.removeItem('adminLoggedIn');
            sessionStorage.removeItem('adminEmail');
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');
        } catch (e) {}
        window.location.href = LOGIN_URL;
    }

    function setAdminName(email) {
        var nameEl = document.getElementById('adminName');
        if (nameEl && email) {
            nameEl.textContent = String(email).split('@')[0];
        }
    }

    function revealPage() {
        document.body.classList.add('authed');
    }

    async function runGuard() {
        // Wait for Supabase client to be ready
        if (typeof supabase === 'undefined' || !supabase) {
            // Retry once after a short delay in case config.js is still loading
            await new Promise(function (r) { setTimeout(r, 120); });
        }

        if (typeof supabase === 'undefined' || !supabase) {
            console.warn('[admin-guard] Supabase client not available');
            redirectToLogin();
            return;
        }

        try {
            // 1) Real Supabase session
            var sessRes = await supabase.auth.getSession();
            var session = sessRes && sessRes.data && sessRes.data.session;

            if (session && session.user) {
                var role = session.user.user_metadata && session.user.user_metadata.role;
                if (role !== 'admin') {
                    try { await supabase.auth.signOut(); } catch (e) {}
                    redirectToLogin();
                    return;
                }

                // Refresh bridge flags (harmless — legacy pages may rely on them)
                try {
                    var email = session.user.email || '';
                    sessionStorage.setItem('adminSession', JSON.stringify({
                        email: email,
                        loggedIn: true,
                        timestamp: Date.now()
                    }));
                    localStorage.setItem('adminLoggedIn', 'true');
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    localStorage.setItem('adminEmail', email);
                } catch (e) {}

                setAdminName(session.user.email);
                revealPage();
                return;
            }

            // 2) Legacy bridge fallback (only if a valid Supabase user still resolves)
            var legacy = sessionStorage.getItem('adminSession');
            if (legacy) {
                try {
                    var parsed = JSON.parse(legacy);
                    if (parsed && parsed.loggedIn) {
                        var userRes = await supabase.auth.getUser();
                        var uRole = userRes && userRes.data && userRes.data.user
                            && userRes.data.user.user_metadata
                            && userRes.data.user.user_metadata.role;
                        if (uRole === 'admin') {
                            setAdminName(parsed.email);
                            revealPage();
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('[admin-guard] legacy parse failed:', e);
                }
            }

            // 3) Nothing valid
            redirectToLogin();
        } catch (err) {
            console.warn('[admin-guard] error:', err);
            redirectToLogin();
        }
    }

    // Run after DOM is ready so body exists
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runGuard);
    } else {
        runGuard();
    }
})();
