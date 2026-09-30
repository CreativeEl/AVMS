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

    if (!form) {
        console.error('❌ Login form not found');
        return;
    }

    // Check if already logged in via Supabase
    supabase.auth.getSession().then(({ data }) => {
        if (data && data.session) {
            console.log('✅ Existing Supabase session — redirecting');
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
