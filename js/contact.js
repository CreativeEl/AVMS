// ============================================
// CONTACT PAGE JAVASCRIPT
// AVMS ABU Zaria — Public Contact Form
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('🔍 Contact page loaded');
    initContactForm();
});

// ============================================
// MESSAGE HELPERS — on-brand success/error boxes
// ============================================
function showContactMessage(msgDiv, type, html) {
    if (!msgDiv) return;
    msgDiv.innerHTML = html;
}

function successHtml() {
    return `
        <div class="contact-msg contact-msg-success">
            <i class="fas fa-check-circle"></i>
            <div>
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us. We will get back to you soon.</p>
            </div>
        </div>
    `;
}

function errorHtml(text = 'Could not send message. Please try again later.') {
    return `
        <div class="contact-msg contact-msg-error">
            <i class="fas fa-exclamation-circle"></i>
            <div>
                <p>${text}</p>
            </div>
        </div>
    `;
}

// ============================================
// INJECT ON-BRAND MESSAGE STYLES (once)
// ============================================
(function injectContactStyles() {
    if (document.getElementById('contact-js-styles')) return;
    const style = document.createElement('style');
    style.id = 'contact-js-styles';
    style.textContent = `
        .contact-msg {
            margin-top: 20px;
            padding: 20px 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 14px;
            line-height: 1.5;
            animation: contactFadeIn 0.35s ease;
        }
        .contact-msg i {
            font-size: 28px;
            flex-shrink: 0;
        }
        .contact-msg h3 {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 17px;
            margin-bottom: 4px;
            font-weight: 700;
        }
        .contact-msg p { margin: 0; }
        .contact-msg-success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #2D6B54;
        }
        .contact-msg-success i { color: #2D6B54; }
        .contact-msg-success h3 { color: #1F4E3D; }
        .contact-msg-error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #8B1A1A;
        }
        .contact-msg-error i { color: #8B1A1A; }
        @keyframes contactFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        /* Spinner used during submit */
        .contact-form .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.35);
            border-top-color: #fff;
            border-radius: 50%;
            animation: contactSpin 0.7s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
        @keyframes contactSpin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
})();

// ============================================
// INIT FORM
// ============================================
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) {
        console.error('❌ Contact form not found!');
        return;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('✅ Contact form submitted');

        const submitBtn = form.querySelector('button[type="submit"]');
        const msgDiv = document.getElementById('contactMessageDiv');

        if (!submitBtn) {
            console.error('❌ Submit button not found inside form!');
            return;
        }

        const originalText = submitBtn.innerHTML;

        // ---- Gather values (null-safe) ----
        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const formData = {
            name: getVal('contactName'),
            email: getVal('contactEmail'),
            phone: getVal('contactPhone'),
            subject: getVal('contactSubject'),
            message: getVal('contactMessage'),
            status: 'pending'
        };

        // ---- Light client-side validation ----
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            showContactMessage(msgDiv, 'error', errorHtml('Please fill in all required fields.'));
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(formData.email)) {
            showContactMessage(msgDiv, 'error', errorHtml('Please enter a valid email address.'));
            return;
        }

        console.log('📋 Contact form data:', formData);

        // ---- Show loading ----
        submitBtn.innerHTML = `<span class="spinner"></span> Sending...`;
        submitBtn.disabled = true;
        if (msgDiv) msgDiv.innerHTML = '';

        // ---- Check Supabase ----
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase not initialized!');
            showContactMessage(msgDiv, 'error', errorHtml('Database connection error. Please try again later.'));
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        // ---- Insert into Supabase ----
        supabase
            .from('contact_messages')
            .insert([formData])
            .then(({ data, error }) => {
                if (error) {
                    console.error('❌ Supabase error:', error);
                    throw error;
                }

                showContactMessage(msgDiv, 'success', successHtml());
                form.reset();
                console.log('✅ Contact message saved successfully');
            })
            .catch((error) => {
                console.error('❌ Error:', error);
                showContactMessage(msgDiv, 'error', errorHtml());
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
    });
}
