// ============================================
// JOIN US PAGE - Multi-Step Form with Upload
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Join Us page loaded');
    initForm();
});

// Store uploaded file data
const uploadedFiles = {};

function initForm() {
    const form = document.getElementById('membershipForm');
    if (!form) {
        console.error('❌ Form not found!');
        return;
    }
    console.log('✅ Form found!');

    const pages = document.querySelectorAll('.form-page');
    const steps = document.querySelectorAll('.step-item');
    let currentStep = 0;
    const totalSteps = pages.length;

    // Show first step
    showStep(0);

    // STEP INDICATORS - CLICK TO NAVIGATE
    steps.forEach((step, index) => {
        step.addEventListener('click', function() {
            const isCompleted = this.classList.contains('completed');
            const isActive = this.classList.contains('active');
            
            if (isCompleted || isActive) {
                currentStep = index;
                showStep(currentStep);
                if (currentStep === 4) {
                    updateSummary();
                }
            } else {
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
            console.log('➡️ Next button clicked');
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps - 1) {
                    currentStep++;
                    showStep(currentStep);
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
            console.log('⬅️ Back button clicked');
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    // FILE INPUTS - Show preview with status
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            const fileName = this.files[0]?.name || 'No file chosen';
            const fileSize = this.files[0]?.size || 0;
            const fileSizeKB = (fileSize / 1024).toFixed(1);
            
            const previewDiv = document.getElementById('filePreview');
            const fileType = this.id;
            uploadedFiles[fileType] = this.files[0];
            
            const isUploaded = this.files && this.files.length > 0;
            const statusColor = isUploaded ? '#28a745' : '#e8491d';
            
            let previewHtml = `
                <div class="file-item" data-file="${input.id}">
                    <i class="fas fa-file" style="color: ${statusColor};"></i>
                    <span><strong>${input.id.replace(/([A-Z])/g, ' $1').trim()}:</strong> ${fileName} (${fileSizeKB} KB)</span>
                    <span style="margin-left: auto; color: ${statusColor}; font-weight: bold;">${isUploaded ? '✅ Uploaded' : '❌ Required'}</span>
            `;
            
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
                    updateFileStatus();
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
                updateFileStatus();
            }
            
            // Remove "no files" message
            const infoMsg = previewDiv.querySelector('p');
            if (infoMsg) {
                infoMsg.remove();
            }
        });
    });

    // Update file status function
    function updateFileStatus() {
        const previewDiv = document.getElementById('filePreview');
        const fileInputs = document.querySelectorAll('input[type="file"][required]');
        let uploadedCount = 0;
        const totalFiles = fileInputs.length;
        
        fileInputs.forEach(input => {
            if (input.files && input.files.length > 0) {
                uploadedCount++;
            }
        });
        
        let statusMsg = previewDiv.querySelector('.file-status-message');
        if (!statusMsg) {
            statusMsg = document.createElement('div');
            statusMsg.className = 'file-status-message';
            previewDiv.prepend(statusMsg);
        }
        
        if (uploadedCount === totalFiles) {
            statusMsg.innerHTML = `
                <div style="background: #d4edda; color: #155724; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                    ✅ All ${totalFiles} documents uploaded successfully!
                </div>
            `;
        } else {
            statusMsg.innerHTML = `
                <div style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                    ⚠️ ${uploadedCount} of ${totalFiles} documents uploaded. Please upload all required documents.
                </div>
            `;
        }
    }

    function showStep(index) {
        pages.forEach(p => p.classList.remove('active'));
        pages[index].classList.add('active');

        steps.forEach((step, i) => {
            step.classList.remove('active', 'completed');
            if (i === index) {
                step.classList.add('active');
            } else if (i < index) {
                step.classList.add('completed');
            }
        });

        document.querySelector('.membership-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    function validateStep(index) {
        const currentPage = pages[index];
        const inputs = currentPage.querySelectorAll('input[required], select[required]');
        let valid = true;

        // Check regular required fields
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

        // CHECK FILE UPLOADS ON STEP 4 (index 3)
        if (index === 3) {
            const fileInputs = currentPage.querySelectorAll('input[type="file"][required]');
            let allFilesUploaded = true;
            
            fileInputs.forEach(input => {
                if (!input.files || input.files.length === 0) {
                    allFilesUploaded = false;
                    input.style.borderColor = '#e8491d';
                    input.style.borderWidth = '3px';
                    setTimeout(() => {
                        input.style.borderColor = '';
                        input.style.borderWidth = '2px';
                    }, 3000);
                } else {
                    input.style.borderColor = '#28a745';
                    input.style.borderWidth = '2px';
                }
            });

            if (!allFilesUploaded) {
                valid = false;
                const msgDiv = document.getElementById('formMessage');
                if (msgDiv) {
                    msgDiv.innerHTML = `
                        <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px;">
                            ⚠️ Please upload ALL 4 required documents before proceeding.
                        </div>
                    `;
                    setTimeout(() => {
                        msgDiv.innerHTML = '';
                    }, 5000);
                }
            }
        }

        // Check checkbox on final step (index 4)
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
            if (msgDiv && !msgDiv.innerHTML) {
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

    // ============================================
    // FORM SUBMISSION WITH LOADING SPINNER
    // ============================================
    const submitBtn = document.querySelector('.btn-submit');
    console.log('🔍 Submit button found:', submitBtn);
    
    if (submitBtn) {
        submitBtn.addEventListener('click', function(e) {
            console.log('✅ Submit button CLICKED!');
            form.dispatchEvent(new Event('submit'));
        });
    } else {
        console.error('❌ Submit button NOT found!');
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('✅ Form SUBMIT event fired!');
        handleFormSubmit(e);
    });

    async function handleFormSubmit(e) {
        const submitBtn = document.querySelector('.btn-submit');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Application';
        
        console.log('📤 Processing form submission...');
        
        if (submitBtn) {
            submitBtn.innerHTML = `<span class="spinner"></span> Submitting...`;
            submitBtn.disabled = true;
        }

        const msgDiv = document.getElementById('formMessage');
        if (msgDiv) msgDiv.innerHTML = '';

        if (!validateStep(4)) {
            console.log('❌ Validation failed');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            return;
        }

        // ============================================
        // STEP 1: UPLOAD FILES TO PRIVATE STORAGE
        // ============================================
        const fileFields = ['passportPhoto', 'admissionLetter', 'studentId', 'paymentReceipt'];
        const fileUrls = {
            passportPhoto: '',
            admissionLetter: '',
            studentId: '',
            paymentReceipt: ''
        };
        let uploadSuccess = true;

        for (const field of fileFields) {
            const fileInput = document.getElementById(field);
            const file = fileInput?.files[0];
            
            if (file) {
                try {
                    console.log(`📤 Uploading ${field}...`);
                    
                    const timestamp = Date.now();
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${timestamp}_${file.name}`;
                    
                    let folderPath = '';
                    switch(field) {
                        case 'passportPhoto': folderPath = 'passports/'; break;
                        case 'admissionLetter': folderPath = 'admissions/'; break;
                        case 'studentId': folderPath = 'student-ids/'; break;
                        case 'paymentReceipt': folderPath = 'receipts/'; break;
                    }
                    
                    const filePath = `${folderPath}${fileName}`;
                    console.log(`📁 Uploading to: ${filePath}`);
                    
                    const { data, error } = await supabase.storage
                        .from('membership-documents')
                        .upload(filePath, file);

                    if (error) {
                        console.error(`❌ Error uploading ${field}:`, error);
                        uploadSuccess = false;
                        throw error;
                    }

                    console.log(`✅ ${field} uploaded successfully!`, data);

                    const { data: urlData } = supabase.storage
                        .from('membership-documents')
                        .getPublicUrl(filePath);
                    
                    const publicUrl = urlData?.publicUrl;
                    fileUrls[field] = publicUrl;
                    console.log(`🔗 ${field} URL:`, publicUrl);
                    
                } catch (error) {
                    console.error(`❌ Failed to upload ${field}:`, error);
                    uploadSuccess = false;
                    if (msgDiv) {
                        msgDiv.innerHTML = `
                            <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                                <p>⚠️ Failed to upload ${field.replace(/([A-Z])/g, ' $1').trim()}. Please try again.</p>
                            </div>
                        `;
                    }
                    if (submitBtn) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                    return;
                }
            }
        }

        if (!uploadSuccess) {
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            return;
        }

        console.log('✅ All files uploaded successfully!');
        console.log('📁 File URLs:', fileUrls);

        // ============================================
        // STEP 2: SAVE APPLICATION TO DATABASE
        // ============================================
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
            passport_photo_url: fileUrls.passportPhoto || '',
            admission_letter_url: fileUrls.admissionLetter || '',
            student_id_url: fileUrls.studentId || '',
            payment_receipt_url: fileUrls.paymentReceipt || '',
            status: 'pending'
        };

        console.log('📋 Form data with file URLs:', formData);

        if (typeof supabase === 'undefined') {
            console.error('❌ Supabase not initialized!');
            if (msgDiv) {
                msgDiv.innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                        <p>⚠️ Database connection error. Please try again later.</p>
                    </div>
                `;
            }
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            return;
        }

        try {
            console.log('📤 Sending to Supabase...');
            
            const { data, error } = await supabase
                .from('membership_applications')
                .insert([formData]);

            console.log('📥 Supabase response:', { data, error });

            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }

            showConfirmation(formData);
            console.log('✅ Application submitted successfully');

        } catch (error) {
            console.error('❌ Submission error:', error);
            if (msgDiv) {
                msgDiv.innerHTML = `
                    <div style="background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 30px;"></i>
                        <p>⚠️ Could not submit application. Error: ${error.message}</p>
                    </div>
                `;
            }
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    function showConfirmation(data) {
        const form = document.getElementById('membershipForm');
        if (form) form.style.display = 'none';
        
        const indicator = document.querySelector('.steps-indicator');
        if (indicator) indicator.style.display = 'none';
        
        const heading = document.querySelector('.membership-container h2');
        if (heading) heading.style.display = 'none';
        
        const intro = document.querySelector('.form-intro');
        if (intro) intro.style.display = 'none';
        
        const confirmDiv = document.getElementById('confirmationMessage');
        if (confirmDiv) {
            confirmDiv.style.display = 'block';
            confirmDiv.classList.add('show');
        }
        
        const confirmName = document.getElementById('confirmName');
        if (confirmName) confirmName.textContent = data.first_name + ' ' + data.surname;
        
        const confirmReg = document.getElementById('confirmReg');
        if (confirmReg) confirmReg.textContent = data.reg_number;
        
        const confirmLevel = document.getElementById('confirmLevel');
        if (confirmLevel) confirmLevel.textContent = data.level;
        
        const confirmEmail = document.getElementById('confirmEmail');
        if (confirmEmail) confirmEmail.textContent = data.email;
        
        const confirmPhone = document.getElementById('confirmPhone');
        if (confirmPhone) confirmPhone.textContent = data.phone;
        
        if (confirmDiv) {
            confirmDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
