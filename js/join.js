// ============================================
// JOIN US PAGE - Multi-Step Form with Upload
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    debugLog('Join Us page loaded');
    initForm();
});

// Store uploaded file data
const uploadedFiles = {};

function initForm() {
    const form = document.getElementById('membershipForm');
    if (!form) {
        console.error('Form not found!');
        return;
    }

    const pages = document.querySelectorAll('.form-page');
    const steps = document.querySelectorAll('.step-item');
    let currentStep = 0;
    const totalSteps = pages.length;

    // Show first step
    showStep(0);

    // STEP INDICATORS - CLICK TO NAVIGATE
    steps.forEach((step, index) => {
        step.addEventListener('click', function() {
            // Allow navigation to any completed or current step
            const isCompleted = this.classList.contains('completed');
            const isActive = this.classList.contains('active');
            
            if (isCompleted || isActive) {
                currentStep = index;
                showStep(currentStep);
            } else {
                // Show message that they need to complete previous steps
                const msgDiv = document.getElementById('formMessage');
                if (msgDiv) {
                    msgDiv.innerHTML = `
                        <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px;">
                            ⚠️ Please complete previous steps first.
                        </div>
                    `;
                    setTimeout(() => {
                        msgDiv.innerHTML = '';
                    }, 3000);
                }
            }
        });
    });

    // Next buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', function() {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps - 1) {
                    currentStep++;
                    showStep(currentStep);
                    // Update summary on step 5
                    if (currentStep === 4) {
                        updateSummary();
                    }
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

    // File inputs - show preview
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'No file chosen';
            const fileSize = this.files[0]?.size || 0;
            const fileSizeKB = (fileSize / 1024).toFixed(1);
            
            const previewDiv = document.getElementById('filePreview');
            const fileType = this.id;
            uploadedFiles[fileType] = this.files[0];
            
            let previewHtml = `<div class="file-item"><i class="fas fa-file"></i> <strong>${this.id}:</strong> ${fileName} (${fileSizeKB} KB)`;
            
            if (this.files[0] && this.files[0].type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewHtml += ` <img src="${e.target.result}" class="file-thumbnail">`;
                    previewHtml += `</div>`;
                    const existing = previewDiv.querySelector(`[data-file="${input.id}"]`);
                    if (existing) {
                        existing.remove();
                    }
                    const wrapper = document.createElement('div');
                    wrapper.dataset.file = input.id;
                    wrapper.innerHTML = previewHtml;
                    previewDiv.appendChild(wrapper);
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                previewHtml += `</div>`;
                const existing = previewDiv.querySelector(`[data-file="${input.id}"]`);
                if (existing) {
                    existing.remove();
                }
                const wrapper = document.createElement('div');
                wrapper.dataset.file = input.id;
                wrapper.innerHTML = previewHtml;
                previewDiv.appendChild(wrapper);
            }
            
            // Remove "no files" message
            const infoMsg = previewDiv.querySelector('p');
            if (infoMsg) {
                infoMsg.remove();
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
            if (input.offsetParent === null) {
                return;
            }
            
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

        if (index === 4) {
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
            if (msgDiv) {
                msgDiv.innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px;">
                        ⚠️ Please fill in all required fields before proceeding.
                    </div>
                `;
                setTimeout(() => {
                    msgDiv.innerHTML = '';
                }, 4000);
            }
        }

        return valid;
    }

    function updateSummary() {
        const container = document.getElementById('summaryContent');
        if (!container) return;

        const fields = {
            'Full Name': document.getElementById('firstName')?.value + ' ' + document.getElementById('surname')?.value || 'Not provided',
            'Registration Number': document.getElementById('regNumber')?.value || 'Not provided',
            'Level': document.getElementById('level')?.value || 'Not provided',
            'Phone': document.getElementById('phone')?.value || 'Not provided',
            'Email': document.getElementById('email')?.value || 'Not provided',
            'Department': document.getElementById('department')?.value || 'Not provided',
            'Faculty': document.getElementById('faculty')?.value || 'Not provided',
            'Gender': document.getElementById('gender')?.value || 'Not provided',
            'Nationality': document.getElementById('nationality')?.value || 'Not provided',
            'State of Origin': document.getElementById('stateOfOrigin')?.value || 'Not provided',
            'Home Address': document.getElementById('homeAddress')?.value || 'Not provided',
        };

        let html = '<div class="summary-grid">';
        for (const [label, value] of Object.entries(fields)) {
            html += `
                <div class="summary-item">
                    <strong>${label}:</strong> ${value}
                </div>
            `;
        }
        html += '</div>';

        // Check if files were uploaded
        const fileFields = ['passportPhoto', 'admissionLetter', 'studentId', 'paymentReceipt'];
        let filesHtml = '<div class="summary-item" style="grid-column: 1 / -1;"><strong>Uploaded Files:</strong><ul>';
        let hasFiles = false;
        fileFields.forEach(field => {
            if (uploadedFiles[field]) {
                filesHtml += `<li>${field.replace(/([A-Z])/g, ' $1').trim()}: ${uploadedFiles[field].name}</li>`;
                hasFiles = true;
            }
        });
        if (!hasFiles) {
            filesHtml += '<li>No files uploaded</li>';
        }
        filesHtml += '</ul></div>';
        html += filesHtml;

        container.innerHTML = html;
    }

    // FORM SUBMISSION
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted!');

        if (!validateStep(4)) {
            console.log('Validation failed');
            return;
        }

        // Get form values
        const formData = {
            title: document.getElementById('title')?.value || '',
            surname: document.getElementById('surname')?.value || '',
            first_name: document.getElementById('firstName')?.value || '',
            middle_name: document.getElementById('middleName')?.value || '',
            dob: document.getElementById('dob')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            nationality: document.getElementById('nationality')?.value || '',
            state_of_origin: document.getElementById('stateOfOrigin')?.value || '',
            lga: document.getElementById('lga')?.value || '',
            tribe: document.getElementById('tribe')?.value || '',
            place_of_birth: document.getElementById('placeOfBirth')?.value || '',
            languages: document.getElementById('languages')?.value || '',
            faculty: document.getElementById('faculty')?.value || '',
            department: document.getElementById('department')?.value || '',
            course_of_study: document.getElementById('courseOfStudy')?.value || '',
            reg_number: document.getElementById('regNumber')?.value || '',
            level: document.getElementById('level')?.value || '',
            year_of_graduation: document.getElementById('yearOfGraduation')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email')?.value || '',
            home_address: document.getElementById('homeAddress')?.value || '',
            status: 'pending'
        };

        console.log('Form data:', formData);

        if (typeof supabase === 'undefined') {
            console.error('Supabase not initialized!');
            const msgDiv = document.getElementById('formMessage');
            msgDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                    <p>⚠️ Database connection error. Please try again later.</p>
                </div>
            `;
            return;
        }

        try {
            console.log('Sending to Supabase...');
            
            const { data, error } = await supabase
                .from('membership_applications')
                .insert([formData]);

            console.log('Supabase response:', { data, error });

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // SHOW CONFIRMATION MESSAGE
            showConfirmation(formData);
            
            console.log('Application submitted successfully');

        } catch (error) {
            console.error('Submission error:', error);
            const msgDiv = document.getElementById('formMessage');
            msgDiv.innerHTML = `
                <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                    <i class="fas fa-exclamation-circle" style="font-size: 30px;"></i>
                    <p>⚠️ Could not submit application. Error: ${error.message}</p>
                </div>
            `;
        }
    });

    function showConfirmation(data) {
        // Hide the form
        document.getElementById('membershipForm').style.display = 'none';
        document.querySelector('.steps-indicator').style.display = 'none';
        document.querySelector('.membership-container h2').style.display = 'none';
        document.querySelector('.form-intro').style.display = 'none';
        
        // Show confirmation
        const confirmDiv = document.getElementById('confirmationMessage');
        confirmDiv.style.display = 'block';
        
        // Fill in confirmation details
        document.getElementById('confirmName').textContent = data.first_name + ' ' + data.surname;
        document.getElementById('confirmReg').textContent = data.reg_number;
        document.getElementById('confirmLevel').textContent = data.level;
        document.getElementById('confirmEmail').textContent = data.email;
        document.getElementById('confirmPhone').textContent = data.phone;
        
        // Scroll to top
        confirmDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
