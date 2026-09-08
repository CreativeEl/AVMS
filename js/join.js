// ============================================
// JOIN US PAGE - Multi-Step Form
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Join Us page loaded');
    initForm();
});

function initForm() {
    const form = document.getElementById('membershipForm');
    const pages = document.querySelectorAll('.form-page');
    const steps = document.querySelectorAll('.step-item');
    let currentStep = 0;
    const totalSteps = pages.length;

    // Show first step
    showStep(0);

    // Next buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', function() {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps - 1) {
                    currentStep++;
                    showStep(currentStep);
                }
            }
        });
    });

    // Previous buttons
    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', function() {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    function showStep(index) {
        // Hide all pages
        pages.forEach(p => p.classList.remove('active'));
        // Show current page
        pages[index].classList.add('active');

        // Update step indicators
        steps.forEach((step, i) => {
            step.classList.remove('active', 'completed');
            if (i === index) {
                step.classList.add('active');
            } else if (i < index) {
                step.classList.add('completed');
            }
        });

        // Scroll to top of form
        document.querySelector('.membership-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    function validateStep(index) {
        const currentPage = pages[index];
        const inputs = currentPage.querySelectorAll('input[required], select[required]');
        let valid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                valid = false;
                input.style.borderColor = '#e8491d';
                setTimeout(() => {
                    input.style.borderColor = '';
                }, 3000);
            } else {
                input.style.borderColor = '';
            }
        });

        // Check checkbox on final step
        if (index === 3) {
            const checkbox = document.getElementById('declaration');
            if (checkbox && !checkbox.checked) {
                valid = false;
                checkbox.style.outline = '2px solid #e8491d';
                setTimeout(() => {
                    checkbox.style.outline = '';
                }, 3000);
            }
        }

        if (!valid) {
            const msgDiv = document.getElementById('formMessage');
            msgDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px;">
                    ⚠️ Please fill in all required fields before proceeding.
                </div>
            `;
            setTimeout(() => {
                msgDiv.innerHTML = '';
            }, 4000);
        }

        return valid;
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateStep(3)) {
            return;
        }

        // Collect form data
        const formData = {
            title: document.getElementById('title').value,
            surname: document.getElementById('surname').value,
            first_name: document.getElementById('firstName').value,
            middle_name: document.getElementById('middleName').value || null,
            dob: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            nationality: document.getElementById('nationality').value,
            state_of_origin: document.getElementById('stateOfOrigin').value,
            lga: document.getElementById('lga').value || null,
            tribe: document.getElementById('tribe').value || null,
            place_of_birth: document.getElementById('placeOfBirth').value || null,
            languages: document.getElementById('languages').value || null,
            faculty: document.getElementById('faculty').value,
            department: document.getElementById('department').value,
            course_of_study: document.getElementById('courseOfStudy').value,
            reg_number: document.getElementById('regNumber').value,
            level: document.getElementById('level').value,
            year_of_graduation: document.getElementById('yearOfGraduation').value || null,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            home_address: document.getElementById('homeAddress').value,
            status: 'pending'
        };

        try {
            debugLog('Submitting membership application...');

            const { data, error } = await supabase
                .from('membership_applications')
                .insert([formData]);

            if (error) throw error;

            const msgDiv = document.getElementById('formMessage');
            msgDiv.innerHTML = `
                <div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 10px; text-align: center;">
                    <i class="fas fa-check-circle" style="font-size: 40px; color: #28a745;"></i>
                    <h3 style="color: #155724; margin-top: 10px;">✅ Application Submitted!</h3>
                    <p>Thank you for joining AVMS! We will contact you soon.</p>
                </div>
            `;
            form.reset();
            currentStep = 0;
            showStep(0);
            debugLog('Application submitted successfully');

        } catch (error) {
            console.error('Error submitting application:', error);
            const msgDiv = document.getElementById('formMessage');
            msgDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 30px;"></i>
                    <p>⚠️ Could not submit application. Please try again later.</p>
                </div>
            `;
        }
    });
}
