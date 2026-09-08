// ============================================
// GALLERY PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Gallery page loaded');
    loadGalleryAlbums();
});

// ============================================
// LOAD GALLERY ALBUMS
// ============================================
async function loadGalleryAlbums() {
    const container = document.getElementById('galleryContainer');
    if (!container) return;
    
    try {
        debugLog('Loading gallery albums...');
        
        const { data, error } = await supabase
            .from('gallery_albums')
            .select('*')
            .eq('status', 'published')
            .order('event_date', { ascending: false });
            
        if (error) throw error;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="gallery-placeholder">
                    <i class="fas fa-images" style="font-size: 60px; color: #2a4a7a;"></i>
                    <h3>Gallery Coming Soon</h3>
                    <p>Photos from AVMS events and activities will be displayed here.</p>
                </div>
            `;
            return;
        }
        
        debugLog(`Found ${data.length} albums`);
        renderAlbums(data, container);
        
    } catch (error) {
        console.error('Error loading gallery:', error);
        container.innerHTML = `
            <div class="gallery-placeholder">
                <i class="fas fa-exclamation-circle" style="font-size: 60px; color: #e8491d;"></i>
                <h3>Could Not Load Gallery</h3>
                <p style="color: #e8491d;">Please try again later.</p>
            </div>
        `;
    }
}

// ============================================
// RENDER ALBUMS
// ============================================
function renderAlbums(albums, container) {
    container.innerHTML = albums.map(album => `
        <div class="gallery-album">
            <div class="album-cover">
                ${album.cover_image ? 
                    `<img src="${album.cover_image}" alt="${album.title}">` : 
                    `<i class="fas fa-images"></i>`
                }
            </div>
            <div class="album-info">
                <h3>${album.title || 'Untitled Album'}</h3>
                <p>${album.description || ''}</p>
                ${album.event_date ? `<p class="album-date">📅 ${formatDate(album.event_date)}</p>` : ''}
                ${album.category ? `<p class="album-category">📂 ${album.category}</p>` : ''}
            </div>
        </div>
    `).join('');
}
