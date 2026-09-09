// ============================================
// ADMIN DASHBOARD
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Admin dashboard loaded');
    checkAuth();
    loadStats();
    loadRecentActivity();
});

function checkAuth() {
    const session = sessionStorage.getItem('adminSession');
    if (!session) {
        window.location.href = 'index.html';
        return;
    }
    try {
        const data = JSON.parse(session);
        if (!data.loggedIn) {
            window.location.href = 'index.html';
        }
        document.getElementById('adminName').textContent = data.email.split('@')[0];
    } catch (e) {
        window.location.href = 'index.html';
    }
}

async function loadStats() {
    try {
        // Count leaders
        const { count: leaders } = await supabase.from('leaders').select('*', { count: 'exact', head: true });
        document.getElementById('statLeaders').textContent = leaders || 0;

        // Count announcements
        const { count: announcements } = await supabase.from('announcements').select('*', { count: 'exact', head: true });
        document.getElementById('statAnnouncements').textContent = announcements || 0;

        // Count events
        const { count: events } = await supabase.from('events').select('*', { count: 'exact', head: true });
        document.getElementById('statEvents').textContent = events || 0;

        // Count pending applications
        const { count: applications } = await supabase
            .from('membership_applications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        document.getElementById('statApplications').textContent = applications || 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    
    try {
        // Get recent applications
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

// Logout
document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    sessionStorage.removeItem('adminSession');
    window.location.href = 'index.html';
});
