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
});
