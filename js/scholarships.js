// ============================================
// SCHOLARSHIPS PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Scholarships page loaded');
    loadScholarships();
});

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
        console.error('Error loading scholarships:', error);
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
    container.innerHTML = scholarships.map(scholar => `
        <div class="scholarship-item">
            <h3>${scholar.title || 'Untitled Scholarship'}</h3>
            <p class="scholarship-provider"><i class="fas fa-building"></i> ${scholar.provider || 'Provider TBD'}</p>
            <div class="scholarship-meta">
                <span><i class="fas fa-calendar-alt"></i> Opens: ${formatDate(scholar.opening_date)}</span>
                <span><i class="fas fa-calendar-times"></i> Deadline: ${formatDate(scholar.deadline)}</span>
            </div>
            <p class="scholarship-description">${scholar.description || 'No description available.'}</p>
            <p class="scholarship-eligibility"><strong>Eligibility:</strong> ${scholar.eligibility || 'Contact for details.'}</p>
            ${scholar.requirements ? `<p class="scholarship-requirements"><strong>Requirements:</strong> ${scholar.requirements}</p>` : ''}
            ${scholar.application_link ? `<a href="${scholar.application_link}" target="_blank" class="btn btn-primary">Apply Now</a>` : ''}
        </div>
    `).join('');
}
