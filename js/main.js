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

        // Build the item HTML (used twice for seamless loop)
        const itemHtml = items.map(function(item) {
            const badgeClass = item.type === 'event' ? 'news-ticker-tag news-ticker-tag--event' : 'news-ticker-tag news-ticker-tag--news';
            const safeTitle = escapeTickerText(item.title);
            return `<a class="news-ticker-item" href="${item.href}">
                <span class="${badgeClass}">${item.label}</span>
                <span class="news-ticker-text">${safeTitle}</span>
            </a>`;
        }).join('');

        // Duplicate the row for the seamless loop
        track.innerHTML = itemHtml + itemHtml;

        // Measure + apply speed
        applyTickerSpeed(track, items.length);
    })
    .catch(function(err) {
        console.warn('[NewsTicker] Failed to load ticker data:', err);
        ticker.style.display = 'none';
    });
}


function applyTickerSpeed(track, itemCount) {
    // Wait one frame so the browser has laid out the injected HTML.
    requestAnimationFrame(function() {
        // Total track scrollWidth = two copies of the item set.
        // One loop travels exactly half → translateX(-50%).
        const oneSetWidth = track.scrollWidth / 2;

        // If measurement failed (0), fall back to a per-item estimate.
        const width = oneSetWidth > 0 ? oneSetWidth : (itemCount * 400);

        // ~180px/sec = brisk news-bar pace. Bump this number to go faster.
        const speedPxPerSec = 180;
        // Floor of 5s only kicks in for very short tracks; otherwise real math wins.
        const durationSeconds = Math.max(5, width / speedPxPerSec);

        // Kill any running animation first so the new duration takes effect cleanly.
        track.style.animation = 'none';
        // Force reflow to flush the reset.
        void track.offsetWidth;
        // Apply new duration inline (overrides the CSS shorthand).
        track.style.animation = 'news-ticker-scroll ' + durationSeconds + 's linear infinite';

        // Diagnostic — safe to leave in, remove later if you want.
        console.log('[NewsTicker] width=' + width + 'px, duration=' + durationSeconds.toFixed(1) + 's, speed=' + speedPxPerSec + 'px/s');
    });
}


function escapeTickerText(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
