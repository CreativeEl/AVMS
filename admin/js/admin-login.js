// ============================================
// ADMIN LOGIN — Supabase Auth
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Admin login page loaded');
    initLogin();
});

function initLogin() {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');

    // If no login form, this page isn't the login page — do nothing.
    // (Guards against this script accidentally being loaded on other admin pages.)
    if (!form) {
        console.log('ℹ️ No login form on this page — skipping login logic');
        return;
    }

    // If already logged in via Supabase, restore flags then go to dashboard
    supabase.auth.getSession().then(({ data }) => {
        if (data && data.session && data.session.user) {
            console.log('✅ Existing Supabase session — restoring bridge flags');
            localStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminSession', JSON.stringify({
                email: data.session.user.email,
                loggedIn: true,
                timestamp: Date.now()
            }));
            localStorage.setItem('adminEmail', data.session.user.email);
            window.location.href = 'dashboard.html';
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorDiv.classList.remove('show');

        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Signing in...';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('❌ Login error:', error.message);
                errorDiv.textContent = '❌ ' + (error.message || 'Invalid email or password.');
                errorDiv.classList.add('show');
                document.getElementById('adminPassword').value = '';
                document.getElementById('adminPassword').focus();
                return;
            }

            console.log('✅ Login successful for:', data.user.email);

            // Remember email for next visit (pre-fill)
            localStorage.setItem('adminEmail', email);

            // Bridge: keep old flags so pages not yet updated still work
            localStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminSession', JSON.stringify({
                email: data.user.email,
                loggedIn: true,
                timestamp: Date.now()
            }));

            window.location.href = 'dashboard.html';

        } catch (err) {
            console.error('❌ Unexpected error:', err);
            errorDiv.textContent = '❌ Something went wrong. Please try again.';
            errorDiv.classList.add('show');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}
