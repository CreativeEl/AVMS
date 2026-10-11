// ============================================
// SCHOLARSHIPS PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Scholarships page loaded');
    loadScholarships();
});

// ============================================
// HELPERS
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function safeUrl(url) {
    if (!url) return '';
    const str = String(url).trim();
    if (/^https?:\/\//i.test(str)) return str;
    return '';
}

// ============================================
// LOAD SCHOLARSHIPS
// ============================================
async function loadScholarships() {
    const container = document.getElementById('scholarshipsContainer');
    if (!container) return;
    
    try {
        debugLog('Loading scholarships...');
        
        const { data, error } = await supabase
            .from('scholarships')
            .select('*')
            .eq('status', 'active')
            .order('deadline', { ascending: true });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="scholarship-item">
                    <p style="color: #888;">No scholarships available at this time. Check back later!</p>
                </div>
            `;
            return;
        }
        
        debugLog(`Found ${data.length} scholarships`);
        renderScholarships(data, container);
        
    } catch (error) {
        console.warn('Error loading scholarships:', error);
        container.innerHTML = `
            <div class="scholarship-item">
                <p style="color: #e8491d;">⚠️ Could not load scholarships. Please try again later.</p>
            </div>
        `;
    }
}

// ============================================
// RENDER SCHOLARSHIPS
// ============================================
function renderScholarships(scholarships, container) {
    container.innerHTML = scholarships.map(scholar => {
        const applyUrl = safeUrl(scholar.application_link);
        return `
        <div class="scholarship-item">
            <h3>${escapeHtml(scholar.title) || 'Untitled Scholarship'}</h3>
            <p class="scholarship-provider"><i class="fas fa-building"></i> ${escapeHtml(scholar.provider) || 'Provider TBD'}</p>
            <div class="scholarship-meta">
                <span><i class="fas fa-calendar-alt"></i> Opens: ${formatDate(scholar.opening_date)}</span>
                <span><i class="fas fa-calendar-times"></i> Deadline: ${formatDate(scholar.deadline)}</span>
            </div>
            <p class="scholarship-description">${escapeHtml(scholar.description) || 'No description available.'}</p>
            <p class="scholarship-eligibility"><strong>Eligibility:</strong> ${escapeHtml(scholar.eligibility) || 'Contact for details.'}</p>
            ${scholar.requirements ? `<p class="scholarship-requirements"><strong>Requirements:</strong> ${escapeHtml(scholar.requirements)}</p>` : ''}
            ${applyUrl ? `<a href="${applyUrl}" target="_blank" rel="noopener" class="btn btn-primary">Apply Now</a>` : ''}
        </div>
    `;
    }).join('');
}
