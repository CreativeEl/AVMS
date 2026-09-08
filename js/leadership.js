// ============================================
// LEADERSHIP PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Leadership page loaded');
    loadAllLeaders();
});

// ============================================
// LOAD ALL LEADERS
// ============================================
async function loadAllLeaders() {
    const container = document.getElementById('leadersContainer');
    if (!container) return;
    
    try {
        debugLog('Loading all leaders...');
        
        const { data, error } = await supabase
            .from('leaders')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="leader-card-full">
                    <p style="color: #888;">No leaders found. Please check back later.</p>
                </div>
            `;
            return;
        }
        
        debugLog(`Found ${data.length} leaders`);
        renderAllLeaders(data, container);
        
    } catch (error) {
        console.error('Error loading leaders:', error);
        container.innerHTML = `
            <div class="leader-card-full">
                <p style="color: #e8491d;">⚠️ Could not load leaders. Please check your connection.</p>
            </div>
        `;
    }
}

// ============================================
// RENDER ALL LEADERS
// ============================================
function renderAllLeaders(leaders, container) {
    container.innerHTML = leaders.map(leader => `
        <div class="leader-card-full">
            <div class="leader-photo-full">
                ${leader.photo_url ? `<img src="${leader.photo_url}" alt="${leader.name}">` : '👤'}
            </div>
            <div class="leader-info-full">
                <h3>${leader.name || 'Unnamed Leader'}</h3>
                <p class="leader-position">${leader.position || 'Position'}</p>
                <p class="leader-bio">${leader.biography || 'No biography available yet.'}</p>
            </div>
        </div>
    `).join('');
}
