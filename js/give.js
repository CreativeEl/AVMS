// ============================================
// GIVE / SUPPORT PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Give page loaded');
    initDonationForm();
});

function initDonationForm() {
    const form = document.getElementById('donationForm');
    if (!form) {
        console.error('❌ Donation form not found!');
        return;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('✅ Donation form submitted');

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        const msgDiv = document.getElementById('donationMessageDiv');

        // Show loading spinner
        submitBtn.innerHTML = `<span class="spinner"></span> Processing...`;
        submitBtn.disabled = true;
        msgDiv.innerHTML = '';

        // Get form values
        const formData = {
            donor_name: document.getElementById('donorName').value,
            donor_email: document.getElementById('donorEmail').value,
            donor_phone: document.getElementById('donorPhone').value || '',
            amount: document.getElementById('donationAmount').value,
            message: document.getElementById('donationMessage').value || '',
            status: 'pending'
        };

        console.log('📋 Donation data:', formData);

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
            supabase.from('donations').insert([formData]).then(({ data, error }) => {
                if (error) {
                    console.error('❌ Supabase error:', error);
                    throw error;
                }

                msgDiv.innerHTML = `
                    <div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 10px; text-align: center;">
                        <i class="fas fa-check-circle" style="font-size: 40px; color: #28a745;"></i>
                        <h3 style="color: #155724; margin-top: 10px;">✅ Thank You for Your Support!</h3>
                        <p>Your donation of ₦${formData.amount} has been recorded.</p>
                        <p style="margin-top: 10px; font-size: 14px;">We will contact you shortly with payment details.</p>
                    </div>
                `;

                form.reset();
                console.log('✅ Donation recorded successfully');

            }).catch((error) => {
                console.error('❌ Error:', error);
                msgDiv.innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 30px;"></i>
                        <p>⚠️ Could not process donation. Please try again later.</p>
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
                    <p>⚠️ Could not process donation. Please try again later.</p>
                </div>
            `;
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}
