// ============================================
// DOWNLOADS PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Downloads page loaded');
    loadDocuments();
});

// ============================================
// LOAD DOCUMENTS
// ============================================
async function loadDocuments() {
    const container = document.getElementById('downloadsContainer');
    if (!container) return;
    
    try {
        debugLog('Loading documents...');
        
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('status', 'published')
            .order('category', { ascending: true });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="download-item">
                    <p style="color: #888;">No documents available. Check back later!</p>
                </div>
            `;
            return;
        }
        
        debugLog(`Found ${data.length} documents`);
        renderDocuments(data, container);
        
    } catch (error) {
        console.error('Error loading documents:', error);
        container.innerHTML = `
            <div class="download-item">
                <p style="color: #e8491d;">⚠️ Could not load documents. Please try again later.</p>
            </div>
        `;
    }
}

// ============================================
// RENDER DOCUMENTS
// ============================================
function renderDocuments(documents, container) {
    // Group by category
    const categories = {};
    documents.forEach(doc => {
        const category = doc.category || 'Other';
        if (!categories[category]) categories[category] = [];
        categories[category].push(doc);
    });
    
    let html = '';
    for (const [category, docs] of Object.entries(categories)) {
        html += `
            <h2 class="category-title">📂 ${category}</h2>
            <div class="category-documents">
                ${docs.map(doc => `
                    <div class="download-item">
                        <div class="download-icon">
                            <i class="fas fa-file-${getFileIcon(doc.file_url)}"></i>
                        </div>
                        <div class="download-info">
                            <h4>${doc.title || 'Untitled'}</h4>
                            ${doc.description ? `<p>${doc.description}</p>` : ''}
                        </div>
                        ${doc.file_url ? `<a href="${doc.file_url}" target="_blank" class="download-btn"><i class="fas fa-download"></i> Download</a>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// ============================================
// GET FILE ICON
// ============================================
function getFileIcon(url) {
    if (!url) return 'file';
    const ext = url.split('.').pop().toLowerCase();
    const icons = {
        'pdf': 'pdf',
        'doc': 'word',
        'docx': 'word',
        'xls': 'excel',
        'xlsx': 'excel',
        'ppt': 'powerpoint',
        'pptx': 'powerpoint',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image',
        'zip': 'archive',
        'rar': 'archive'
    };
    return icons[ext] || 'file';
}
