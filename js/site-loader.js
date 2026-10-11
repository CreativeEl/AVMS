// ============================================
// SITE LOADER - Loads settings from Supabase
// Add to every public page with: <script src="js/site-loader.js"></script>
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Fetch all settings from Supabase
        const { data, error } = await supabase
            .from('site_settings')
            .select('*');

        if (error) throw error;

        // Convert to key-value object
        const settings = {};
        (data || []).forEach(s => {
            settings[s.setting_key] = s.setting_value;
        });

        // ============================================
        // APPLY SETTINGS
        // ============================================

        applyLogo(settings);
        applyFavicon(settings);
        applyContactInfo(settings);
        applySocialLinks(settings);
        applyFooterContent(settings);
        applyHomepageContent(settings);
        applyAboutContent(settings);
        applyJoinContent(settings);

    } catch (error) {
        console.warn('Error loading site settings:', error);
    }
});

// ============================================
// HELPERS
// ============================================
function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Safe icon class: only "fa-xxx" or "fas"/"far" style tokens
function sanitizeIcon(icon) {
    if (!icon) return '';
    const str = String(icon).trim();
    return /^[a-z0-9-]+$/i.test(str) ? str : '';
}

// Escape text, then convert \n\n → <br><br>, \n → <br>
function textToHtml(text) {
    if (text == null) return '';
    return escapeHtml(text)
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

// ============================================
// APPLY LOGO
// - Updates existing .logo-img only
// - Also updates .logo-text from site_short_name
// ============================================
function applyLogo(settings) {
    if (settings.site_logo) {
        document.querySelectorAll('.logo-img').forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = settings.site_logo;
            }
        });
    }

    if (settings.site_short_name) {
        document.querySelectorAll('[data-footer="site-short-name"], .logo-text').forEach(el => {
            el.textContent = settings.site_short_name;
        });
    }
}

// ============================================
// APPLY FAVICON
// ============================================
function applyFavicon(settings) {
    if (!settings.site_favicon) return;

    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    favicon.href = settings.site_favicon;
}

// ============================================
// APPLY CONTACT INFO
// ============================================
function applyContactInfo(settings) {
    if (settings.contact_email) {
        document.querySelectorAll('[data-contact="email"], .contact-email').forEach(el => {
            if (el.tagName === 'A') el.href = `mailto:${settings.contact_email}`;
            el.textContent = settings.contact_email;
        });
    }

    if (settings.contact_email_2) {
        document.querySelectorAll('[data-contact="email-2"]').forEach(el => {
            if (el.tagName === 'A') el.href = `mailto:${settings.contact_email_2}`;
            el.textContent = settings.contact_email_2;
        });
    }

    if (settings.contact_phone) {
        document.querySelectorAll('[data-contact="phone"], .contact-phone').forEach(el => {
            if (el.tagName === 'A') el.href = `tel:${settings.contact_phone.replace(/\s/g, '')}`;
            el.textContent = settings.contact_phone;
        });
    }

    if (settings.contact_phone_2) {
        document.querySelectorAll('[data-contact="phone-2"]').forEach(el => {
            if (el.tagName === 'A') el.href = `tel:${settings.contact_phone_2.replace(/\s/g, '')}`;
            el.textContent = settings.contact_phone_2;
        });
    }

    if (settings.contact_address) {
        document.querySelectorAll('[data-contact="address"], .contact-address').forEach(el => {
            el.innerHTML = textToHtml(settings.contact_address);
        });
    }

    if (settings.office_hours) {
        document.querySelectorAll('[data-contact="hours"], .office-hours').forEach(el => {
            el.textContent = settings.office_hours;
        });
    }

    if (settings.office_hours_weekend) {
        document.querySelectorAll('[data-contact="hours-weekend"]').forEach(el => {
            el.textContent = settings.office_hours_weekend;
        });
    }
}

// ============================================
// APPLY SOCIAL LINKS
// ============================================
function applySocialLinks(settings) {
    const socialMap = {
        'facebook_url': 'facebook',
        'twitter_url': 'twitter',
        'instagram_url': 'instagram',
        'youtube_url': 'youtube',
        'linkedin_url': 'linkedin',
        'whatsapp_url': 'whatsapp'
    };

    document.querySelectorAll('.social-links a').forEach(link => {
        const icon = link.querySelector('i');
        if (!icon) return;

        const iconClass = icon.className;
        for (const [key, platform] of Object.entries(socialMap)) {
            if (iconClass.includes(platform)) {
                if (settings[key]) {
                    link.href = settings[key];
                }
                break;
            }
        }
    });
}

// ============================================
// APPLY FOOTER CONTENT
// ============================================
function applyFooterContent(settings) {
    if (settings.copyright_text) {
        document.querySelectorAll('[data-footer="copyright"]').forEach(el => {
            el.textContent = settings.copyright_text;
        });
    }

    if (settings.copyright_year) {
        document.querySelectorAll('.current-year').forEach(el => {
            el.textContent = settings.copyright_year;
        });
    }

    if (settings.site_name) {
        document.querySelectorAll('[data-footer="site-name"]').forEach(el => {
            el.textContent = settings.site_name;
        });
    }

    if (settings.site_tagline) {
        document.querySelectorAll('[data-footer="tagline"]').forEach(el => {
            el.textContent = settings.site_tagline;
        });
    }
}

// ============================================
// APPLY HOMEPAGE CONTENT
// ============================================
function applyHomepageContent(settings) {
    if (settings.hero_title) {
        // Only replace if the h1 has no inner span structure (avoid wiping cursive styling)
        document.querySelectorAll('[data-home="hero-title"]').forEach(el => {
            if (!el.querySelector('span')) {
                el.textContent = settings.hero_title;
            }
        });
    }

    if (settings.hero_subtitle) {
        document.querySelectorAll('[data-home="hero-subtitle"]').forEach(el => {
            el.textContent = settings.hero_subtitle;
        });
    }

    if (settings.hero_description) {
        document.querySelectorAll('[data-home="hero-description"]').forEach(el => {
            el.textContent = settings.hero_description;
        });
    }

    if (settings.hero_button1_text) {
        document.querySelectorAll('[data-home="hero-btn1-text"]').forEach(el => {
            el.textContent = settings.hero_button1_text;
        });
    }
    if (settings.hero_button1_link) {
        document.querySelectorAll('[data-home="hero-btn1"]').forEach(el => {
            el.href = settings.hero_button1_link;
        });
    }
    if (settings.hero_button2_text) {
        document.querySelectorAll('[data-home="hero-btn2-text"]').forEach(el => {
            el.textContent = settings.hero_button2_text;
        });
    }
    if (settings.hero_button2_link) {
        document.querySelectorAll('[data-home="hero-btn2"]').forEach(el => {
            el.href = settings.hero_button2_link;
        });
    }

    if (settings.hero_image) {
        document.querySelectorAll('[data-home="hero-image"]').forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = settings.hero_image;
            } else {
                el.style.backgroundImage = `url('${settings.hero_image}')`;
            }
        });
    }

    if (settings.welcome_title) {
        document.querySelectorAll('[data-home="welcome-title"]').forEach(el => {
            el.textContent = settings.welcome_title;
        });
    }
    if (settings.welcome_message) {
        document.querySelectorAll('[data-home="welcome-message"]').forEach(el => {
            el.innerHTML = textToHtml(settings.welcome_message);
        });
    }

    if (settings.join_preview_title) {
        document.querySelectorAll('[data-home="join-title"]').forEach(el => {
            el.textContent = settings.join_preview_title;
        });
    }
    if (settings.join_preview_text) {
        document.querySelectorAll('[data-home="join-text"]').forEach(el => {
            el.textContent = settings.join_preview_text;
        });
    }
}

// ============================================
// APPLY ABOUT PAGE CONTENT
// ============================================
function applyAboutContent(settings) {
    if (settings.about_who_title) {
        document.querySelectorAll('[data-about="who-title"]').forEach(el => {
            el.textContent = settings.about_who_title;
        });
    }
    if (settings.about_who_content) {
        document.querySelectorAll('[data-about="who-content"]').forEach(el => {
            el.innerHTML = textToHtml(settings.about_who_content);
        });
    }

    if (settings.about_mission_title) {
        document.querySelectorAll('[data-about="mission-title"]').forEach(el => {
            el.textContent = settings.about_mission_title;
        });
    }
    if (settings.about_mission_content) {
        document.querySelectorAll('[data-about="mission-content"]').forEach(el => {
            el.textContent = settings.about_mission_content;
        });
    }

    if (settings.about_vision_title) {
        document.querySelectorAll('[data-about="vision-title"]').forEach(el => {
            el.textContent = settings.about_vision_title;
        });
    }
    if (settings.about_vision_content) {
        document.querySelectorAll('[data-about="vision-content"]').forEach(el => {
            el.textContent = settings.about_vision_content;
        });
    }

    if (settings.about_history_title) {
        document.querySelectorAll('[data-about="history-title"]').forEach(el => {
            el.textContent = settings.about_history_title;
        });
    }
    if (settings.about_history_content) {
        document.querySelectorAll('[data-about="history-content"]').forEach(el => {
            el.innerHTML = textToHtml(settings.about_history_content);
        });
    }

    if (settings.about_image) {
        document.querySelectorAll('[data-about="image"]').forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = settings.about_image;
            } else {
                el.style.backgroundImage = `url('${settings.about_image}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.backgroundRepeat = 'no-repeat';
                el.style.border = 'none';
                el.style.padding = '0';
                el.style.minHeight = '0';
                el.classList.remove('placeholder-image');
                el.querySelectorAll('i, p').forEach(child => child.remove());
            }
        });
    }

    for (let i = 1; i <= 6; i++) {
        if (settings[`about_value${i}_icon`]) {
            const safeIcon = sanitizeIcon(settings[`about_value${i}_icon`]);
            if (safeIcon) {
                document.querySelectorAll(`[data-about="value${i}-icon"]`).forEach(el => {
                    el.className = `fas ${safeIcon}`;
                });
            }
        }
        if (settings[`about_value${i}_title`]) {
            document.querySelectorAll(`[data-about="value${i}-title"]`).forEach(el => {
                el.textContent = settings[`about_value${i}_title`];
            });
        }
        if (settings[`about_value${i}_desc`]) {
            document.querySelectorAll(`[data-about="value${i}-desc"]`).forEach(el => {
                el.textContent = settings[`about_value${i}_desc`];
            });
        }
    }
}

// ============================================
// APPLY JOIN PAGE CONTENT
// ============================================
function applyJoinContent(settings) {
    if (settings.join_page_title) {
        document.querySelectorAll('[data-join="page-title"]').forEach(el => {
            el.textContent = settings.join_page_title;
        });
    }
    if (settings.join_page_subtitle) {
        document.querySelectorAll('[data-join="page-subtitle"]').forEach(el => {
            el.textContent = settings.join_page_subtitle;
        });
    }
    if (settings.join_form_intro) {
        document.querySelectorAll('[data-join="form-intro"]').forEach(el => {
            el.textContent = settings.join_form_intro;
        });
    }

    if (settings.join_why_title) {
        document.querySelectorAll('[data-join="why-title"]').forEach(el => {
            el.textContent = settings.join_why_title;
        });
    }
    if (settings.join_why_content) {
        document.querySelectorAll('[data-join="why-content"]').forEach(el => {
            el.textContent = settings.join_why_content;
        });
    }

    for (let i = 1; i <= 6; i++) {
        if (settings[`join_benefit${i}_icon`]) {
            const safeIcon = sanitizeIcon(settings[`join_benefit${i}_icon`]);
            if (safeIcon) {
                document.querySelectorAll(`[data-join="benefit${i}-icon"]`).forEach(el => {
                    el.className = `fas ${safeIcon}`;
                });
            }
        }
        if (settings[`join_benefit${i}_title`]) {
            document.querySelectorAll(`[data-join="benefit${i}-title"]`).forEach(el => {
                el.textContent = settings[`join_benefit${i}_title`];
            });
        }
        if (settings[`join_benefit${i}_desc`]) {
            document.querySelectorAll(`[data-join="benefit${i}-desc"]`).forEach(el => {
                el.textContent = settings[`join_benefit${i}_desc`];
            });
        }
    }

    if (settings.join_eligibility_title) {
        document.querySelectorAll('[data-join="eligibility-title"]').forEach(el => {
            el.textContent = settings.join_eligibility_title;
        });
    }
    if (settings.join_eligibility_content) {
        document.querySelectorAll('[data-join="eligibility-content"]').forEach(el => {
            const items = settings.join_eligibility_content.split(/\r?\n/).filter(s => s.trim());
            el.innerHTML = items.map(item => `<li>✅ ${escapeHtml(item)}</li>`).join('');
        });
    }

    if (settings.join_requirements_title) {
        document.querySelectorAll('[data-join="requirements-title"]').forEach(el => {
            el.textContent = settings.join_requirements_title;
        });
    }
    if (settings.join_requirements_content) {
        document.querySelectorAll('[data-join="requirements-content"]').forEach(el => {
            const items = settings.join_requirements_content.split(/\r?\n/).filter(s => s.trim());
            el.innerHTML = items.map(item => `<li>✅ ${escapeHtml(item)}</li>`).join('');
        });
    }

    if (settings.join_faq_title) {
        document.querySelectorAll('[data-join="faq-title"]').forEach(el => {
            el.textContent = settings.join_faq_title;
        });
    }
    for (let i = 1; i <= 5; i++) {
        if (settings[`join_faq${i}_question`]) {
            document.querySelectorAll(`[data-join="faq${i}-question"]`).forEach(el => {
                el.textContent = settings[`join_faq${i}_question`];
            });
        }
        if (settings[`join_faq${i}_answer`]) {
            document.querySelectorAll(`[data-join="faq${i}-answer"]`).forEach(el => {
                el.textContent = settings[`join_faq${i}_answer`];
            });
        }
    }
}
