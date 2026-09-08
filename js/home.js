// ============================================
// HOMEPAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Homepage loaded');
    
    // Load all dynamic content
    loadAnnouncements();
    loadEvents();
    loadLeaders();
});

// ============================================
// 1. LOAD ANNOUNCEMENTS
// ============================================
async function loadAnnouncements() {
    const container = document.getElementById('announcementsContainer');
    if (!container) return;
    
    try {
        debugLog('Loading announcements...');
        
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(3);
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="announcement-card">
                    <h3>No Announcements</h3>
                    <p style="color: #888;">Check back soon for updates!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.map(ann => `
            <div class="announcement-card">
                <h3>${ann.title || 'Untitled'}</h3>
                <p class="date">📅 ${formatDate(ann.published_at)}</p>
                <p>${truncateText(ann.content || 'No content available', 120)}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading announcements:', error);
        container.innerHTML = `
            <div class="announcement-card">
                <h3>⚠️ Connection Error</h3>
                <p style="color: #e8491d;">Could not load announcements.</p>
            </div>
        `;
    }
}

// ============================================
// 2. LOAD EVENTS
// ============================================
async function loadEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    
    try {
        debugLog('Loading events...');
        
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('status', 'published')
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(3);
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="event-card">
                    <div class="event-image">📅</div>
                    <div class="event-details">
                        <h3>No Upcoming Events</h3>
                        <p style="color: #888;">Check back soon!</p>
                    </div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.map(event => `
            <div class="event-card">
                <div class="event-image">🎉</div>
                <div class="event-details">
                    <h3>${event.title || 'Untitled Event'}</h3>
                    <p class="event-info"><i class="fas fa-calendar"></i> ${formatDate(event.event_date)}</p>
                    <p class="event-info"><i class="fas fa-map-marker-alt"></i> ${event.venue || 'Venue TBD'}</p>
                    <p>${truncateText(event.description || 'No description', 80)}</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = `
            <div class="event-card">
                <div class="event-image">⚠️</div>
                <div class="event-details">
                    <h3>Connection Error</h3>
                    <p style="color: #e8491d;">Could not load events.</p>
                </div>
            </div>
        `;
    }
}

// ============================================
// 3. LOAD LEADERS
// ============================================
async function loadLeaders() {
    const container = document.getElementById('leadersContainer');
    if (!container) return;
    
    try {
        debugLog('Loading leaders...');
        
        const { data, error } = await supabase
            .from('leaders')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .limit(4);
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="leader-card">
                    <div class="leader-photo">👤</div>
                    <h4>Leadership Coming Soon</h4>
                    <p>Check back for updates</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.map(leader => `
            <div class="leader-card">
                <div class="leader-photo">👤</div>
                <h4>${leader.name || 'Demo Leader'}</h4>
                <p>${leader.position || 'Position'}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading leaders:', error);
        container.innerHTML = `
            <div class="leader-card">
                <div class="leader-photo">⚠️</div>
                <h4>Connection Error</h4>
                <p style="color: #e8491d;">Could not load leaders</p>
            </div>
        `;
    }
}
