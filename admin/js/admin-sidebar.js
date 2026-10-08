/* ============================================
   AVMS ADMIN — MOBILE SIDEBAR (HAMBURGER DRAWER)
   Injects a hamburger button + overlay and
   toggles the sidebar drawer on phones.
   Desktop behavior is untouched.
   ============================================ */
(function () {
    'use strict';

    // Only run on mobile widths — desktop sidebar stays as-is.
    var MOBILE_BREAKPOINT = 768;

    function isMobile() {
        return window.matchMedia('(max-width: ' + MOBILE_BREAKPOINT + 'px)').matches;
    }

    function buildHamburger() {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'admin-hamburger';
        btn.setAttribute('aria-label', 'Open admin menu');
        btn.setAttribute('aria-controls', 'admin-sidebar');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
        return btn;
    }

    function buildOverlay() {
        var ov = document.createElement('div');
        ov.className = 'admin-overlay';
        ov.setAttribute('aria-hidden', 'true');
        return ov;
    }

    function init() {
        var sidebar = document.querySelector('.admin-sidebar');
        if (!sidebar) return;

        // Give sidebar an id so aria-controls works
        if (!sidebar.id) sidebar.id = 'admin-sidebar';

        // Avoid double-injection if script is included twice
        if (document.querySelector('.admin-hamburger')) return;

        var hamburger = buildHamburger();
        var overlay = buildOverlay();

        document.body.appendChild(hamburger);
        document.body.appendChild(overlay);

        function openDrawer() {
            sidebar.classList.add('open');
            overlay.classList.add('open');
            document.body.classList.add('admin-sidebar-locked');
            hamburger.setAttribute('aria-expanded', 'true');
            hamburger.setAttribute('aria-label', 'Close admin menu');
        }

        function closeDrawer() {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
            document.body.classList.remove('admin-sidebar-locked');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.setAttribute('aria-label', 'Open admin menu');
        }

        function toggleDrawer() {
            if (sidebar.classList.contains('open')) {
                closeDrawer();
            } else {
                openDrawer();
            }
        }

        // Tap hamburger
        hamburger.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleDrawer();
        });

        // Tap overlay
        overlay.addEventListener('click', function (e) {
            e.preventDefault();
            closeDrawer();
        });

        // Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeDrawer();
            }
        });

        // Close when a nav link is tapped (so it doesn't stay open across page load)
        sidebar.addEventListener('click', function (e) {
            var link = e.target.closest('a');
            if (link && link.getAttribute('href') && link.getAttribute('href') !== '#') {
                closeDrawer();
            }
        });

        // If user resizes from mobile -> desktop while drawer is open, clean up
        window.addEventListener('resize', function () {
            if (!isMobile() && sidebar.classList.contains('open')) {
                closeDrawer();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
