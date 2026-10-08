// ============================================
// ADMIN DASHBOARD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Admin dashboard loaded');
    checkAuth();

    // Logout — attach once DOM is ready so the button definitely exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                await supabase.auth.signOut();
            } catch (err) {
                console.warn('signOut failed (continuing with local clear):', err);
            }
            sessionStorage.removeItem('adminSession');
            sessionStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');
            window.location.href = 'index.html';
        });
    }
});

// ============================================
// AUTH CHECK
// ============================================
async function checkAuth() {
    try {
        // 1. Try real Supabase session first
        const { data, error } = await supabase.auth.getSession();

        if (data && data.session && data.session.user) {
            console.log('✅ Supabase session found:', data.session.user.email);
            const email = data.session.user.email || '';
            const nameEl = document.getElementById('adminName');
            if (nameEl) nameEl.textContent = email.split('@')[0];

            // Bridge: keep old flags fresh so un-updated pages still work
            sessionStorage.setItem('adminSession', JSON.stringify({
                email: email,
                loggedIn: true,
                timestamp: Date.now()
            }));
            localStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminEmail', email);

            // Reveal the page
            document.body.classList.add('authed');

            loadStats();
            loadRecentActivity();
            return;
        }

        // 2. Fallback: accept old bridge flag (only for pages mid-migration)
        const legacy = sessionStorage.getItem('adminSession');
        if (legacy) {
            try {
                const parsed = JSON.parse(legacy);
                if (parsed && parsed.loggedIn) {
                    console.log('⚠️ Using legacy session bridge');
                    const nameEl = document.getElementById('adminName');
                    if (nameEl) nameEl.textContent = (parsed.email || '').split('@')[0];

                    // Reveal the page
                    document.body.classList.add('authed');

                    loadStats();
                    loadRecentActivity();
                    return;
                }
            } catch (e) {
                console.warn('Bad legacy session payload:', e);
            }
        }

        // 3. Neither worked — send to login
        console.log('🚫 Not authenticated — redirecting to login');
        window.location.href = 'index.html';

    } catch (err) {
        console.error('❌ Auth check failed:', err);
        window.location.href = 'index.html';
    }
}

// ============================================
// LOAD STATS
// ============================================
async function loadStats() {
    try {
        const { count: leaders } = await supabase.from('leaders').select('*', { count: 'exact', head: true });
        document.getElementById('statLeaders').textContent = leaders || 0;

        const { count: announcements } = await supabase.from('announcements').select('*', { count: 'exact', head: true });
        document.getElementById('statAnnouncements').textContent = announcements || 0;

        const { count: events } = await supabase.from('events').select('*', { count: 'exact', head: true });
        document.getElementById('statEvents').textContent = events || 0;

        const { count: applications } = await supabase
            .from('membership_applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        document.getElementById('statApplications').textContent = applications || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ============================================
// LOAD RECENT ACTIVITY
// ============================================
async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    try {
        const { data: applications } = await supabase
            .from('membership_applications')
            .select('*')
            .order('applied_at', { ascending: false })
            .limit(5);

        if (applications && applications.length > 0) {
            let html = '';
            applications.forEach(app => {
                html += `
                    <div class="activity-item">
                        <span class="activity-icon"><i class="fas fa-user-plus"></i></span>
                        <div>
                            <strong>${app.first_name} ${app.surname}</strong> applied for membership
                            <span class="activity-status ${app.status}">${app.status}</span>
                        </div>
                        <span class="activity-time">${new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No recent activity</p>';
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Could not load activity</p>';
    }
}
