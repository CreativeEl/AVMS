// ============================================
// LEADERSHIP PAGE JAVASCRIPT
// Renders two sections: Senate/Parliament + Executive Council
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Leadership page loaded');
    loadAllLeaders();
});

// ============================================
// LOAD ALL LEADERS
// ============================================
async function loadAllLeaders() {
    try {
        debugLog('Loading all leaders...');

        const { data, error } = await supabase
            .from('leaders')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            renderEmptyStates();
            return;
        }

        debugLog(`Found ${data.length} leaders`);

        const executives = data.filter(l => l.tier !== 'senate');
        const senators = data.filter(l => l.tier === 'senate');

        renderExecutiveCouncil(executives);
        renderSenate(senators);

    } catch (error) {
        console.error('Error loading leaders:', error);
        renderErrorStates();
    }
}

// ============================================
// RENDER EXECUTIVE COUNCIL
// ============================================
function renderExecutiveCouncil(executives) {
    const container = document.getElementById('leadersContainer');
    if (!container) return;

    if (executives.length === 0) {
        container.innerHTML = `
            <div class="leader-card-full">
                <p style="color: #888;">No executives found. Please check back later.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = executives.map(leader => `
        <div class="leader-card-full">
            <div class="leader-photo-full">
                ${leader.photo_url ? `<img src="${leader.photo_url}" alt="${leader.name || 'Leader'}">` : '👤'}
            </div>
            <div class="leader-info-full">
                <h3>${leader.name || 'Unnamed Leader'}</h3>
                <p class="leader-position">${leader.position || 'Position'}</p>
                <p class="leader-bio">${leader.biography || 'No biography available yet.'}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// RENDER SENATE / PARLIAMENT
// ============================================
function renderSenate(senators) {
    const container = document.getElementById('senateContainer');
    if (!container) return;

    if (senators.length === 0) {
        container.innerHTML = `
            <div class="senator-card">
                <p style="color: #888;">No senators found. Please check back later.</p>
            </div>
        `;
        return;
    }

    // Separate Senate President (no class level) from senators
    const president = senators.find(s => !s.class_level);
    const senatorsByClass = senators.filter(s => s.class_level);

    // Group by class level
    const classGroups = {};
    senatorsByClass.forEach(s => {
        if (!classGroups[s.class_level]) classGroups[s.class_level] = [];
        classGroups[s.class_level].push(s);
    });

    const classOrder = [100, 200, 300, 400, 500, 600];

    let html = '';

    // Senate President block
    if (president) {
        html += `
            <div class="senate-president-block">
                <h3 class="senate-tier-heading">
                    <i class="fas fa-crown"></i> Senate President
                </h3>
                <div class="senate-grid senate-grid--president">
                    <div class="senator-card senator-card--president">
                        <div class="senator-photo">
                            ${president.photo_url
                                ? `<img src="${president.photo_url}" alt="${president.name || 'Senator'}">`
                                : '<i class="fas fa-user-tie"></i>'}
                        </div>
                        <h4>${president.name || 'Unnamed'}</h4>
                        <p class="senator-class">Senate President</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Senators by class
    const classGroupsHtml = classOrder
        .filter(level => classGroups[level] && classGroups[level].length > 0)
        .map(level => {
            const group = classGroups[level];
            return `
                <div class="senate-class-group">
                    <h4 class="senate-class-heading">${level} Level</h4>
                    <div class="senate-grid">
                        ${group.map(s => `
                            <div class="senator-card">
                                <div class="senator-photo">
                                    ${s.photo_url
                                        ? `<img src="${s.photo_url}" alt="${s.name || 'Senator'}">`
                                        : '<i class="fas fa-user"></i>'}
                                </div>
                                <h4>${s.name || 'Unnamed'}</h4>
                                <p class="senator-class">${level} Level</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

    if (classGroupsHtml) {
        html += `
            <div class="senate-president-block">
                <h3 class="senate-tier-heading">
                    <i class="fas fa-landmark"></i> Senators by Class
                </h3>
                ${classGroupsHtml}
            </div>
        `;
    }

    container.innerHTML = html;
}

// ============================================
// EMPTY / ERROR STATES
// ============================================
function renderEmptyStates() {
    const execContainer = document.getElementById('leadersContainer');
    const senateContainer = document.getElementById('senateContainer');

    if (execContainer) {
        execContainer.innerHTML = `<div class="leader-card-full"><p style="color: #888;">No leaders found. Please check back later.</p></div>`;
    }
    if (senateContainer) {
        senateContainer.innerHTML = `<div class="senator-card"><p style="color: #888;">No senators found. Please check back later.</p></div>`;
    }
}

function renderErrorStates() {
    const execContainer = document.getElementById('leadersContainer');
    const senateContainer = document.getElementById('senateContainer');

    if (execContainer) {
        execContainer.innerHTML = `<div class="leader-card-full"><p style="color: #e8491d;">⚠️ Could not load leaders. Please check your connection.</p></div>`;
    }
    if (senateContainer) {
        senateContainer.innerHTML = `<div class="senator-card"><p style="color: #e8491d;">⚠️ Could not load senators. Please check your connection.</p></div>`;
    }
}
