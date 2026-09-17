// ============================================
// GALLERY PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Gallery page loaded');
    loadGalleryAlbums();
});

// ============================================
// STATE
// ============================================
let currentAlbum = null;
let currentAlbumPhotos = [];
let currentPhotoIndex = 0;

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

        // Get photo counts for each album
        for (const album of data) {
            const { count } = await supabase
                .from('gallery_images')
                .select('*', { count: 'exact', head: true })
                .eq('album_id', album.id);
            album.photo_count = count || 0;
        }

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
        <div class="gallery-album" onclick="openAlbumModal(${album.id})" data-album-id="${album.id}">
            <div class="album-cover">
                ${album.cover_image ? 
                    `<img src="${album.cover_image}" alt="${escapeHtml(album.title)}" onerror="handleBrokenCover(this)">` : 
                    `<i class="fas fa-images"></i>`
                }
                <span class="album-photo-count-badge">
                    <i class="fas fa-camera"></i> ${album.photo_count || 0}
                </span>
                <span class="album-view-hint">
                    <i class="fas fa-eye"></i> View Photos
                </span>
            </div>
            <div class="album-info">
                <h3>${escapeHtml(album.title) || 'Untitled Album'}</h3>
                <p>${escapeHtml(album.description) || ''}</p>
                ${album.event_date ? `<p class="album-date">📅 ${formatDate(album.event_date)}</p>` : ''}
                ${album.category ? `<p class="album-category">📂 ${escapeHtml(album.category)}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// ============================================
// HANDLE BROKEN ALBUM COVERS (ghost thumbnails)
// ============================================
function handleBrokenCover(img) {
    const cover = img.closest('.album-cover');
    if (!cover) return;

    // Hide the broken image
    img.style.display = 'none';

    // Add the fallback icon if not already there
    if (!cover.querySelector('.cover-fallback')) {
        const fallback = document.createElement('div');
        fallback.className = 'cover-fallback';
        fallback.innerHTML = '<i class="fas fa-images"></i>';
        // Insert before the badge/hint so they stay on top
        cover.insertBefore(fallback, cover.firstChild);
    }
}

// ============================================
// OPEN ALBUM MODAL — Fetch photos and display
// ============================================
async function openAlbumModal(albumId) {
    const overlay = document.getElementById('albumModalOverlay');
    const titleEl = document.getElementById('albumModalTitle');
    const metaEl = document.getElementById('albumModalMeta');
    const bodyEl = document.getElementById('albumModalBody');

    try {
        const { data: album, error: albumErr } = await supabase
            .from('gallery_albums')
            .select('*')
            .eq('id', albumId)
            .single();

        if (albumErr) throw albumErr;

        currentAlbum = album;

        titleEl.textContent = album.title || 'Album';
        metaEl.textContent = album.description || `${album.category || 'Gallery'} · ${formatDate(album.event_date)}`;

        // Show modal with loading state
        bodyEl.innerHTML = `
            <div class="album-modal-loading">
                <div class="album-spinner"></div>
                <p>Loading photos...</p>
            </div>
        `;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';

        // Load photos
        const { data: photos, error: photosErr } = await supabase
            .from('gallery_images')
            .select('*')
            .eq('album_id', albumId)
            .order('display_order', { ascending: true });

        if (photosErr) throw photosErr;

        currentAlbumPhotos = photos || [];

        // Update meta with actual count
        metaEl.textContent = `${currentAlbumPhotos.length} photo${currentAlbumPhotos.length !== 1 ? 's' : ''}${album.description ? ' · ' + album.description : ''}`;

        // Render photos
        if (currentAlbumPhotos.length === 0) {
            bodyEl.innerHTML = `
                <div class="album-no-photos">
                    <i class="fas fa-images"></i>
                    <h3 style="color: #1a2a4a; margin-bottom: 8px;">No Photos Yet</h3>
                    <p>This album is empty. Check back soon!</p>
                </div>
            `;
            return;
        }

        bodyEl.innerHTML = `
            <div class="album-photos-public">
                ${currentAlbumPhotos.map((photo, idx) => `
                    <div class="album-photo-public" onclick="openPhotoViewer(${idx})">
                        <img src="${photo.image_url}" 
                             alt="${escapeHtml(photo.caption || 'Photo')}" 
                             loading="lazy"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e0e7ef%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2240%22 text-anchor=%22middle%22 dy=%22.3em%22%3E🖼️%3C/text%3E%3C/svg%3E'">
                        ${photo.caption ? `<div class="photo-caption-overlay">${escapeHtml(photo.caption)}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error opening album:', error);
        bodyEl.innerHTML = `
            <div class="album-no-photos">
                <i class="fas fa-exclamation-circle" style="color: #e8491d;"></i>
                <h3 style="color: #e8491d;">Could not load album</h3>
                <p style="color: #888;">${error.message}</p>
            </div>
        `;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeAlbumModal() {
    document.getElementById('albumModalOverlay').classList.remove('show');
    document.body.style.overflow = '';
    currentAlbum = null;
    currentAlbumPhotos = [];
}

// ============================================
// PHOTO VIEWER (full size)
// ============================================
function openPhotoViewer(index) {
    if (!currentAlbumPhotos[index]) return;
    currentPhotoIndex = index;
    updatePhotoViewer();
    document.getElementById('photoViewerOverlay').classList.add('show');
}

function updatePhotoViewer() {
    const photo = currentAlbumPhotos[currentPhotoIndex];
    if (!photo) return;
    document.getElementById('photoViewerImg').src = photo.image_url;
    document.getElementById('photoViewerCaption').textContent = photo.caption || '';
}

function photoViewerNav(direction) {
    if (!currentAlbumPhotos.length) return;
    currentPhotoIndex = (currentPhotoIndex + direction + currentAlbumPhotos.length) % currentAlbumPhotos.length;
    updatePhotoViewer();
}

function closePhotoViewer() {
    document.getElementById('photoViewerOverlay').classList.remove('show');
}

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

// ============================================
// GLOBAL EVENT LISTENERS
// ============================================
document.addEventListener('click', function(e) {
    const overlay = document.getElementById('albumModalOverlay');
    if (e.target === overlay) closeAlbumModal();

    const viewer = document.getElementById('photoViewerOverlay');
    if (e.target === viewer) closePhotoViewer();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const viewer = document.getElementById('photoViewerOverlay');
        if (viewer.classList.contains('show')) {
            closePhotoViewer();
            return;
        }
        const overlay = document.getElementById('albumModalOverlay');
        if (overlay.classList.contains('show')) {
            closeAlbumModal();
        }
    }

    const viewer = document.getElementById('photoViewerOverlay');
    if (viewer.classList.contains('show')) {
        if (e.key === 'ArrowLeft') photoViewerNav(-1);
        if (e.key === 'ArrowRight') photoViewerNav(1);
    }
});
