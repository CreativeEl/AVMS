// ============================================
// GIVE / SUPPORT PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Give page loaded');
    initDonationForm();
    loadProjects();
});

// ============================================
// 1. DONATION FORM (unchanged)
// ============================================
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

// ============================================
// 2. LOAD PROJECTS (new)
// Reads give_proj{1,2,3}_* values from site_settings
// ============================================
async function loadProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    try {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .in('setting_key', [
                'give_proj1_icon', 'give_proj1_title', 'give_proj1_desc', 'give_proj1_progress', 'give_proj1_target',
                'give_proj2_icon', 'give_proj2_title', 'give_proj2_desc', 'give_proj2_progress', 'give_proj2_target',
                'give_proj3_icon', 'give_proj3_title', 'give_proj3_desc', 'give_proj3_progress', 'give_proj3_target'
            ]);

        if (error) throw error;

        const settings = {};
        (data || []).forEach(s => { settings[s.setting_key] = s.setting_value; });

        // Build project list — only include those with a title
        const projects = [1, 2, 3]
            .map(i => ({
                icon:     settings[`give_proj${i}_icon`]     || 'fa-book',
                title:    settings[`give_proj${i}_title`]    || '',
                desc:     settings[`give_proj${i}_desc`]     || '',
                progress: parseInt(settings[`give_proj${i}_progress`]) || 0,
                target:   settings[`give_proj${i}_target`]   || ''
            }))
            .filter(p => p.title);

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="project-card" style="grid-column: 1 / -1; text-align: center;">
                    <p style="color: #888;">No active campaigns at the moment. Check back soon.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = projects.map(p => {
            // Cap the visual bar at 100% but keep the real % in the text
            const barWidth = Math.min(Math.max(p.progress, 0), 100);
            const iconClass = p.icon.startsWith('fa-') ? p.icon : 'fa-book';

            return `
                <div class="project-card">
                    <div class="project-icon"><i class="fas ${iconClass}"></i></div>
                    <h3>${p.title}</h3>
                    <p>${p.desc}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${barWidth}%;"></div>
                    </div>
                    <p class="progress-text">${p.progress}% funded${p.target ? ' • Target: ' + p.target : ''}</p>
                </div>
            `;
        }).join('');

        console.log('✅ Projects loaded:', projects.length);

    } catch (error) {
        console.error('❌ Error loading projects:', error);
        container.innerHTML = `
            <div class="project-card" style="grid-column: 1 / -1; text-align: center;">
                <p style="color: #e8491d;">⚠️ Could not load projects. Please try again later.</p>
            </div>
        `;
    }
}
