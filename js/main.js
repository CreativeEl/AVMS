// ============================================
// MAIN JAVASCRIPT - Runs on every page
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('AVMS Website initialized');
    
    // ======= HAMBURGER MENU (Mobile) =======
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking a link (on mobile)
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
            });
        });
    }
    
    // ======= ACTIVE NAV LINK =======
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
    
    // ======= YEAR IN FOOTER =======
    const yearSpan = document.querySelector('.current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // ======= NEWS TICKER =======
    injectNewsTicker();
    loadNewsTicker();
});


// ============================================
// NEWS TICKER
// ============================================

function injectNewsTicker() {
    // Guard against double-injection
    if (document.querySelector('.news-ticker')) {
        return;
    }

    // Path prefix for links (future-proof for admin/ or cbt/ pages)
    const prefix = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/cbt/') ? '../' : '';

    const ticker = document.createElement('div');
    ticker.className = 'news-ticker';
    ticker.setAttribute('role', 'region');
    ticker.setAttribute('aria-label', 'Latest news and events');
    ticker.innerHTML = `
        <div class="news-ticker-badge">LATEST</div>
        <div class="news-ticker-viewport">
            <div class="news-ticker-track" id="newsTickerTrack">
                <span class="news-ticker-loading">Loading latest updates…</span>
            </div>
        </div>
    `;

    // Insert as first child of body (above the utility bar)
    document.body.insertBefore(ticker, document.body.firstChild);

    // Store prefix for loadNewsTicker to use
    ticker.dataset.linkPrefix = prefix;
}


function loadNewsTicker() {
    const ticker = document.querySelector('.news-ticker');
    const track = document.getElementById('newsTickerTrack');
    if (!ticker || !track) {
        return;
    }

    // Guard: Supabase client must be available
    if (typeof supabase === 'undefined' || !supabase) {
        console.warn('[NewsTicker] Supabase client not available — hiding ticker.');
        ticker.style.display = 'none';
        return;
    }

    const prefix = ticker.dataset.linkPrefix || '';
    const today = new Date().toISOString().slice(0, 10);

    // Run both queries in parallel
    Promise.all([
        supabase
            .from('announcements')
            .select('id, title')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(5),
        supabase
            .from('events')
            .select('id, title, event_date')
            .eq('status', 'published')
            .gte('event_date', today)
            .order('event_date', { ascending: true })
            .limit(5)
    ])
    .then(function(results) {
        const announcementsRes = results[0];
        const eventsRes = results[1];

        if (announcementsRes.error) {
            console.warn('[NewsTicker] Announcements query failed:', announcementsRes.error.message);
        }
        if (eventsRes.error) {
            console.warn('[NewsTicker] Events query failed:', eventsRes.error.message);
        }

        const announcements = (!announcementsRes.error && announcementsRes.data) ? announcementsRes.data : [];
        const events = (!eventsRes.error && eventsRes.data) ? eventsRes.data : [];

        // Empty state: hide ticker if both sources return nothing
        if (announcements.length === 0 && events.length === 0) {
            ticker.style.display = 'none';
            return;
        }

        // Build item list
        const items = [];

        announcements.forEach(function(a) {
            items.push({
                type: 'news',
                label: 'NEWS',
                title: a.title || 'Untitled announcement',
                href: prefix + 'announcements.html'
            });
        });

        events.forEach(function(e) {
            items.push({
                type: 'event',
                label: 'EVENT',
                title: e.title || 'Untitled event',
                href: prefix + 'events.html'
            });
        });

        // Build ONE set of items as HTML
        const oneSetHtml = items.map(function(item) {
            const badgeClass = item.type === 'event' ? 'news-ticker-tag news-ticker-tag--event' : 'news-ticker-tag news-ticker-tag--news';
            const safeTitle = escapeTickerText(item.title);
            return `<a class="news-ticker-item" href="${item.href}">
                <span class="${badgeClass}">${item.label}</span>
                <span class="news-ticker-text">${safeTitle}</span>
            </a>`;
        }).join('');

        // Seed the track with one set so we can measure its width
        track.innerHTML = oneSetHtml;
        const oneSetWidth = track.scrollWidth;

        // How wide is the visible ticker bar?
        const viewport = track.parentElement;
        const viewportWidth = viewport ? viewport.clientWidth : window.innerWidth;

        // We need enough copies that HALF the track is at least as wide
        // as the viewport (so translateX(-50%) never reveals empty space).
        // Always an even number of sets → -50% lands exactly on a set boundary.
        const minSets = Math.max(2, Math.ceil(viewportWidth / Math.max(oneSetWidth, 1)) * 2);
        const setsNeeded = minSets % 2 === 0 ? minSets : minSets + 1;

        // Build the full track
        track.innerHTML = oneSetHtml.repeat(setsNeeded);

        // Speed: seconds per full loop. Lower = faster.
        // 10s is the pace you approved previously; tweak this one number only.
        const durationSeconds = 10;

        // Reset then apply the animation so the duration always takes effect
        track.style.animation = 'none';
        void track.offsetWidth;
        track.style.animation = 'news-ticker-scroll ' + durationSeconds + 's linear infinite';

        console.log('[NewsTicker] oneSet=' + oneSetWidth + 'px, viewport=' + viewportWidth + 'px, sets=' + setsNeeded + ', duration=' + durationSeconds + 's');
    })
    .catch(function(err) {
        console.warn('[NewsTicker] Failed to load ticker data:', err);
        ticker.style.display = 'none';
    });
}


function escapeTickerText(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
