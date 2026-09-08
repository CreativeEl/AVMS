// ============================================
// ANNOUNCEMENTS PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Announcements page loaded');
    loadAllAnnouncements();
});

// ============================================
// LOAD ALL ANNOUNCEMENTS
// ============================================
async function loadAllAnnouncements() {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;
    
    try {
        debugLog('Loading all announcements...');
        
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="announcement-item">
                    <p style="color: #888;">No announcements found. Check back soon!</p>
                </div>
            `;
            return;
        }
        
        debugLog(`Found ${data.length} announcements`);
        renderAnnouncements(data, container);
        
    } catch (error) {
        console.error('Error loading announcements:', error);
        container.innerHTML = `
            <div class="announcement-item">
                <p style="color: #e8491d;">⚠️ Could not load announcements. Please try again later.</p>
            </div>
        `;
    }
}

// ============================================
// RENDER ANNOUNCEMENTS
// ============================================
function renderAnnouncements(announcements, container) {
    container.innerHTML = announcements.map(ann => `
        <div class="announcement-item ${ann.featured ? 'featured' : ''}">
            ${ann.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
            <h3>${ann.title || 'Untitled'}</h3>
            <p class="announcement-date">📅 ${formatDate(ann.published_at)}</p>
            ${ann.category ? `<p class="announcement-category">📂 ${ann.category}</p>` : ''}
            <p class="announcement-content">${ann.content || 'No content available.'}</p>
        </div>
    `).join('');
}
