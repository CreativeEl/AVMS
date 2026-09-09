// ============================================
// CONTACT PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Contact page loaded');
    initContactForm();
});

function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) {
        console.error('❌ Contact form not found!');
        return;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('✅ Contact form submitted');

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const msgDiv = document.getElementById('contactMessageDiv');

        // Show loading spinner
        submitBtn.innerHTML = `<span class="spinner"></span> Sending...`;
        submitBtn.disabled = true;
        msgDiv.innerHTML = '';

        // Get form values
        const formData = {
            name: document.getElementById('contactName').value,
            email: document.getElementById('contactEmail').value,
            phone: document.getElementById('contactPhone').value || '',
            subject: document.getElementById('contactSubject').value,
            message: document.getElementById('contactMessage').value,
            status: 'pending'
        };

        console.log('📋 Contact form data:', formData);

        // Check if Supabase is available
        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase not initialized!');
            msgDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                    <p>⚠️ Database connection error. Please try again later.</p>
                </div>
            `;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }

        try {
            // Save to Supabase
            supabase.from('contact_messages').insert([formData]).then(({ data, error }) => {
                if (error) {
                    console.error('❌ Supabase error:', error);
                    throw error;
                }

                msgDiv.innerHTML = `
                    <div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 10px; text-align: center;">
                        <i class="fas fa-check-circle" style="font-size: 40px; color: #28a745;"></i>
                        <h3 style="color: #155724; margin-top: 10px;">✅ Message Sent!</h3>
                        <p>Thank you for contacting us. We will get back to you soon.</p>
                    </div>
                `;

                form.reset();
                console.log('✅ Contact message saved successfully');

            }).catch((error) => {
                console.error('❌ Error:', error);
                msgDiv.innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 30px;"></i>
                        <p>⚠️ Could not send message. Please try again later.</p>
                    </div>
                `;
            }).finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });

        } catch (error) {
            console.error('❌ Error:', error);
            msgDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 30px;"></i>
                    <p>⚠️ Could not send message. Please try again later.</p>
                </div>
            `;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}
