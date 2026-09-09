// ============================================
// ADMIN LOGIN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Admin login page loaded');
    initLogin();
});

function initLogin() {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');

    // Check if already logged in
    const session = sessionStorage.getItem('adminSession');
    if (session) {
        window.location.href = 'dashboard.html';
        return;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        errorDiv.classList.remove('show');

        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;

        // Simple validation (you can add more admins here)
        const admins = [
            { email: 'admin@avmsabu.com', password: 'admin123' },
            { email: 'avms@abu.edu.ng', password: 'avms2024' }
        ];

        const admin = admins.find(a => a.email === email && a.password === password);

        if (admin) {
            sessionStorage.setItem('adminSession', JSON.stringify({
                email: admin.email,
                loggedIn: true,
                timestamp: Date.now()
            }));
            window.location.href = 'dashboard.html';
        } else {
            errorDiv.textContent = '❌ Invalid email or password. Please try again.';
            errorDiv.classList.add('show');
        }
    });
}
