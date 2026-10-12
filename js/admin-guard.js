// ============================================
// ADMIN GUARD — Role verification for all admin pages
// Include at the TOP of every admin HTML file (before other scripts)
// Runs immediately to block non-admin users before page loads
// ============================================

(function() {
    console.log('🛡️ Admin guard active');

    async function guard() {
        try {
            const { data } = await supabase.auth.getSession();

            // No session → redirect to login
            if (!data || !data.session || !data.session.user) {
                console.warn('🚫 No session — redirecting to login');
                window.location.href = 'index.html';
                return;
            }

            // Session exists but no admin role → sign out + redirect
            const role = data.session.user.user_metadata?.role;
            if (role !== 'admin') {
                console.warn('🚫 Non-admin user — signing out');
                try { await supabase.auth.signOut(); } catch(e) {}
                sessionStorage.clear();
                localStorage.removeItem('adminLoggedIn');
                localStorage.removeItem('adminEmail');
                window.location.href = 'index.html';
                return;
            }

            console.log('✅ Admin guard passed');
        } catch (err) {
            console.error('❌ Guard error:', err);
            window.location.href = 'index.html';
        }
    }

    guard();
})();
