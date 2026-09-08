// ============================================
// NEWS PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('News page loaded');
    loadAllNews();
});

// ============================================
// LOAD ALL NEWS
// ============================================
async function loadAllNews() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    
    try {
        debugLog('Loading all news...');
        
        const { data, error } = await supabase
            .from('news')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="news-item">
                    <p style="color: #888;">No news articles found. Check back soon!</p>
                </div>
            `;
            return;
        }
        
        debugLog(`Found ${data.length} news articles`);
        renderNews(data, container);
        
    } catch (error) {
        console.error('Error loading news:', error);
        container.innerHTML = `
            <div class="news-item">
                <p style="color: #e8491d;">⚠️ Could not load news. Please try again later.</p>
            </div>
        `;
    }
}

// ============================================
// RENDER NEWS
// ============================================
function renderNews(newsItems, container) {
    container.innerHTML = newsItems.map(item => `
        <div class="news-item ${item.featured ? 'featured' : ''}">
            ${item.featured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
            <h3>${item.title || 'Untitled'}</h3>
            <div class="news-meta">
                <span><i class="fas fa-calendar"></i> ${formatDate(item.published_at)}</span>
                ${item.author ? `<span><i class="fas fa-user"></i> ${item.author}</span>` : ''}
                ${item.category ? `<span><i class="fas fa-tag"></i> ${item.category}</span>` : ''}
            </div>
            <p class="news-content">${item.content || 'No content available.'}</p>
        </div>
    `).join('');
}
