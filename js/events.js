// ============================================
// EVENTS PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Events page loaded');
    loadAllEvents();
});

// ============================================
// LOAD ALL EVENTS
// ============================================
async function loadAllEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    
    try {
        debugLog('Loading all events...');
        
        // Get today's date
        const today = new Date().toISOString().split('T')[0];
        
        // Get upcoming events (today and future)
        const { data: upcoming, error: upcomingError } = await supabase
            .from('events')
            .select('*')
            .eq('status', 'published')
            .gte('event_date', today)
            .order('event_date', { ascending: true });
            
        if (upcomingError) throw upcomingError;
        
        // Get past events
        const { data: past, error: pastError } = await supabase
            .from('events')
            .select('*')
            .eq('status', 'published')
            .lt('event_date', today)
            .order('event_date', { ascending: false });
            
        if (pastError) throw pastError;
        
        const upcomingEvents = upcoming || [];
        const pastEvents = past || [];
        
        debugLog(`Found ${upcomingEvents.length} upcoming, ${pastEvents.length} past events`);
        
        let html = '';
        
        // Upcoming Events Section
        if (upcomingEvents.length > 0) {
            html += `
                <h2 class="events-section-title">🟢 Upcoming Events</h2>
                <div class="events-grid-full">
                    ${renderEvents(upcomingEvents)}
                </div>
            `;
        } else {
            html += `
                <h2 class="events-section-title">🟢 Upcoming Events</h2>
                <p class="no-events">No upcoming events. Check back soon!</p>
            `;
        }
        
        // Past Events Section
        if (pastEvents.length > 0) {
            html += `
                <h2 class="events-section-title">🔵 Past Events</h2>
                <div class="events-grid-full">
                    ${renderEvents(pastEvents)}
                </div>
            `;
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = `
            <div class="event-card-full">
                <p style="color: #e8491d;">⚠️ Could not load events. Please try again later.</p>
            </div>
        `;
    }
}

// ============================================
// RENDER EVENTS
// ============================================
function renderEvents(events) {
    return events.map(event => `
        <div class="event-card-full ${event.featured ? 'featured' : ''}">
            ${event.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
            <div class="event-details-full">
                <h3>${event.title || 'Untitled Event'}</h3>
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(event.event_date)}</span>
                    ${event.start_time ? `<span><i class="fas fa-clock"></i> ${event.start_time}</span>` : ''}
                    ${event.venue ? `<span><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>` : ''}
                </div>
                <p class="event-description">${event.description || 'No description available.'}</p>
                ${event.registration_link ? `<a href="${event.registration_link}" class="btn btn-primary btn-sm">Register Now</a>` : ''}
            </div>
        </div>
    `).join('');
}
