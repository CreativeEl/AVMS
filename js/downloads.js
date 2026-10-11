// ============================================
// DOWNLOADS PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Downloads page loaded');
    loadDocuments();
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
        console.warn('Error loading documents:', error);
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
            <h2 class="category-title">📂 ${escapeHtml(category)}</h2>
            <div class="category-documents">
                ${docs.map(doc => {
                    const fileUrl = safeUrl(doc.file_url);
                    return `
                    <div class="download-item">
                        <div class="download-icon">
                            <i class="fas fa-file-${getFileIcon(doc.file_url)}"></i>
                        </div>
                        <div class="download-info">
                            <h4>${escapeHtml(doc.title) || 'Untitled'}</h4>
                            ${doc.description ? `<p>${escapeHtml(doc.description)}</p>` : ''}
                        </div>
                        ${fileUrl ? `<a href="${fileUrl}" target="_blank" rel="noopener" class="download-btn"><i class="fas fa-download"></i> Download</a>` : ''}
                    </div>
                `;
                }).join('')}
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
