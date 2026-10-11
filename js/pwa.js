// ============================================
// PWA INSTALL PROMPT — AVMS ABU Zaria
// Shows a centered modal on the homepage
// when the site is installable, and handles
// the install action.
// ============================================

(function () {
    // -------- Only run on the homepage --------
    // This file is only loaded on index.html,
    // so no path check needed here.

    // -------- Don't show if already installed --------
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    if (isStandalone) return;

    // -------- Don't show twice in the same session --------
    if (sessionStorage.getItem('pwa_prompt_dismissed') === '1') return;

    // -------- Capture the install prompt --------
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        // Delay a touch so the page has settled
        setTimeout(showInstallModal, 4000);
    });

    // -------- If already installed, hide any modal --------
    window.addEventListener('appinstalled', () => {
        hideInstallModal();
        sessionStorage.setItem('pwa_prompt_dismissed', '1');
    });

    // ============================================
    // MODAL
    // ============================================
    function buildModal() {
        if (document.getElementById('pwaModalOverlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'pwa-modal-overlay';
        overlay.id = 'pwaModalOverlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'pwaModalTitle');

        overlay.innerHTML = `
            <div class="pwa-modal">
                <button class="pwa-modal-close" aria-label="Close" onclick="window.__pwaClose()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="pwa-modal-icon">
                    <img src="https://tlkqzhudnpdnbxaltwbs.supabase.co/storage/v1/object/public/site-assets/logos/1791717381267_AVMS_logo-removebg-preview.png" alt="AVMS App">
                </div>
                <h3 id="pwaModalTitle" class="pwa-modal-title">Install AVMS App</h3>
                <p class="pwa-modal-text">
                    Add AVMS ABU Zaria to your home screen for faster access, offline support, and a native app experience.
                </p>
                <div class="pwa-modal-actions">
                    <button class="pwa-btn pwa-btn-primary" onclick="window.__pwaInstall()">
                        <i class="fas fa-download"></i> Install App
                    </button>
                    <button class="pwa-btn pwa-btn-ghost" onclick="window.__pwaClose()">
                        Not now
                    </button>
                </div>
                <p class="pwa-modal-hint">
                    <i class="fas fa-info-circle"></i> Takes less than a second
                </p>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    function showInstallModal() {
        buildModal();
        const overlay = document.getElementById('pwaModalOverlay');
        if (!overlay) return;
        // Small tick to let the element settle before transition
        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });
    }

    function hideInstallModal() {
        const overlay = document.getElementById('pwaModalOverlay');
        if (!overlay) return;
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }

    // ============================================
    // GLOBAL HANDLERS (called from inline onclick)
    // ============================================
    window.__pwaInstall = async function () {
        if (!deferredPrompt) {
            // No prompt available (already installed, or browser unsupported)
            hideInstallModal();
            return;
        }

        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;

        // The prompt can only be used once
        deferredPrompt = null;

        if (choice && choice.outcome === 'accepted') {
            sessionStorage.setItem('pwa_prompt_dismissed', '1');
        } else {
            sessionStorage.setItem('pwa_prompt_dismissed', '1');
        }

        hideInstallModal();
    };

    window.__pwaClose = function () {
        sessionStorage.setItem('pwa_prompt_dismissed', '1');
        hideInstallModal();
    };

    // ============================================
    // CLOSE ON BACKDROP CLICK / ESCAPE
    // ============================================
    document.addEventListener('click', (e) => {
        const overlay = document.getElementById('pwaModalOverlay');
        if (!overlay) return;
        if (e.target === overlay) {
            window.__pwaClose();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('pwaModalOverlay');
            if (overlay && overlay.classList.contains('show')) {
                window.__pwaClose();
            }
        }
    });
})();
