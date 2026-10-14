// ============================================
// JOIN US PAGE - Verify + Multi-Step Form
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initVerify();
    initForm();
});

const uploadedFiles = {};
let verifiedStudent = null;

// ============================================
// CONSTANTS
// ============================================
const MAX_UPLOAD_BYTES = 200 * 1024; // 200 KB bucket limit

// ============================================
// HELPERS
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function sanitizeFileName(name) {
    if (!name) return 'file';
    return String(name)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(-120);
}

function formatKB(bytes) {
    return (bytes / 1024).toFixed(0) + ' KB';
}
function formatMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
function prettySize(bytes) {
    if (bytes < 1024 * 1024) return formatKB(bytes);
    return formatMB(bytes);
}

// ============================================
// IMAGE COMPRESSOR
// ============================================
async function compressImage(file, fieldLabel) {
    if (!file.type.startsWith('image/')) return file;

    const targetBytes = MAX_UPLOAD_BYTES - 8 * 1024;

    if (file.size <= targetBytes) return file;

    const bitmap = await loadImage(file);
    const origW = bitmap.width || bitmap.naturalWidth;
    const origH = bitmap.height || bitmap.naturalHeight;

    const widths = [1600, 1200, 900, 700, 500];
    const qualities = [0.85, 0.7, 0.55, 0.4, 0.3];

    for (const maxW of widths) {
        const scale = Math.min(1, maxW / origW);
        const w = Math.round(origW * scale);
        const h = Math.round(origH * scale);

        for (const q of qualities) {
            const blob = await drawToBlob(bitmap, w, h, q, file.type);
            if (blob && blob.size <= targetBytes) {
                const ext = pickExt(file.type);
                const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '');
                return new File([blob], `${baseName}.${ext}`, { type: blob.type });
            }
        }
    }

    const lastBlob = await drawToBlob(bitmap, Math.min(500, origW), Math.min(500, origH), 0.3, 'image/jpeg');
    if (lastBlob && lastBlob.size <= targetBytes) {
        const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '');
        return new File([lastBlob], `${baseName}.jpg`, { type: 'image/jpeg' });
    }

    throw new Error(
        `${fieldLabel} couldn't be compressed below ${formatKB(MAX_UPLOAD_BYTES)}. Please pick a smaller image.`
    );
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            if (typeof createImageBitmap === 'function') {
                createImageBitmap(file).then(resolve).catch(reject);
            } else {
                reject(new Error('Could not read image file.'));
            }
        };
        img.src = url;
    });
}

function drawToBlob(bitmap, w, h, quality, mime) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(bitmap, 0, 0, w, h);

        const outMime = (mime === 'image/png') ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
            (blob) => resolve(blob),
            outMime,
            outMime === 'image/jpeg' ? quality : undefined
        );
    });
}

function pickExt(mime) {
    if (!mime) return 'jpg';
    if (mime.includes('png')) return 'png';
    if (mime.includes('webp')) return 'webp';
    return 'jpg';
}

// ============================================
// STEP 0 — VERIFY STUDENT RECORD
// ============================================
function initVerify() {
    const verifyBtn = document.getElementById('verifyBtn');
    if (!verifyBtn) return;

    verifyBtn.addEventListener('click', async function() {
        const regInput = document.getElementById('verifyRegNo');
        const stateInput = document.getElementById('verifyState');
        const msgDiv = document.getElementById('verifyMessage');

        const regNo = (regInput?.value || '').trim();
        const state = (stateInput?.value || '').trim().toLowerCase();

        msgDiv.innerHTML = '';

        if (!regNo || !state) {
            msgDiv.innerHTML = `
                <div class="verify-alert verify-alert-warn">
                    ⚠️ Please enter both your Registration Number and State of Origin.
                </div>
            `;
            return;
        }

        if (typeof supabase === 'undefined' || !supabase) {
            msgDiv.innerHTML = `
                <div class="verify-alert verify-alert-error">
                    ⚠️ Database connection error. Please try again later.
                </div>
            `;
            return;
        }

        verifyBtn.disabled = true;
        const originalText = verifyBtn.innerHTML;
        verifyBtn.innerHTML = `<span class="spinner"></span> Verifying...`;

        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .ilike('reg_no', regNo)
                .eq('state_of_origin', state)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                msgDiv.innerHTML = `
                    <div class="verify-alert verify-alert-error">
                        ❌ <strong>Details not found.</strong><br>
                        We couldn't find a student record matching that Registration Number and State of Origin. Please check your details, or contact AVMS if you believe this is an error.
                    </div>
                `;
                verifyBtn.innerHTML = originalText;
                verifyBtn.disabled = false;
                return;
            }

            if (data.is_registered === true) {
                msgDiv.innerHTML = `
                    <div class="verify-alert verify-alert-warn">
                        ⚠️ <strong>You have an account.</strong><br>
                        This record has already been registered. Please log in instead.<br><br>
                        <a href="student/login.html" class="btn-verify" style="display:inline-block; margin-top:6px;">
                            <i class="fas fa-sign-in-alt"></i> Go to Student Login
                        </a>
                    </div>
                `;
                verifyBtn.innerHTML = originalText;
                verifyBtn.disabled = false;
                return;
            }

            verifiedStudent = data;
            msgDiv.innerHTML = `
                <div class="verify-alert verify-alert-success">
                    ✅ <strong>Record found!</strong> Welcome, ${escapeHtml(data.full_name || 'student')}.<br>
                    Please complete the form below to finish your registration.
                </div>
            `;

            prefillForm(data);
            unlockForm();

        } catch (err) {
            console.warn('Verify error:', err);
            msgDiv.innerHTML = `
                <div class="verify-alert verify-alert-error">
                    ⚠️ Something went wrong while verifying. Please try again.
                </div>
            `;
            verifyBtn.innerHTML = originalText;
            verifyBtn.disabled = false;
        }
    });
}

function prefillForm(student) {
    const fullName = (student.full_name || '').trim();
    let firstName = '';
    let surname = '';
    if (fullName) {
        const parts = fullName.split(/\s+/);
        if (parts.length === 1) {
            firstName = parts[0];
        } else {
            surname = parts[parts.length - 1];
            firstName = parts.slice(0, -1).join(' ');
        }
    }

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal('firstName', firstName);
    setVal('surname', surname);
    setVal('stateOfOrigin', student.state_of_origin || '');
    setVal('regNumber', student.reg_no || '');
    setVal('level', student.class_level ? String(student.class_level) : '');
    setVal('department', student.department || 'Veterinary Medicine');
}

function unlockForm() {
    const verifySection = document.getElementById('verifySection');
    const stepsIndicator = document.getElementById('stepIndicator');
    const form = document.getElementById('membershipForm');

    if (verifySection) {
        verifySection.classList.add('verify-locked');
        const inputs = verifySection.querySelectorAll('input, button');
        inputs.forEach(i => i.disabled = true);
        const successMsg = verifySection.querySelector('.verify-alert-success');
        if (successMsg) {
            const box = verifySection.querySelector('.verify-box');
            box.innerHTML = '';
            box.appendChild(successMsg);
        }
    }

    if (stepsIndicator) stepsIndicator.style.display = '';
    if (form) form.style.display = '';

    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================
// MULTI-STEP FORM
// ============================================
function initForm() {
    const form = document.getElementById('membershipForm');
    if (!form) {
        console.warn('Join form not found.');
        return;
    }

    const pages = document.querySelectorAll('.form-page');
    const steps = document.querySelectorAll('.step-item');
    let currentStep = 0;
    const totalSteps = pages.length;

    showStep(0);

    steps.forEach((step, index) => {
        step.addEventListener('click', function() {
            const isCompleted = this.classList.contains('completed');
            const isActive = this.classList.contains('active');
            
            if (isCompleted || isActive) {
                currentStep = index;
                showStep(currentStep);
                if (currentStep === 4) updateSummary();
            } else {
                const msgDiv = document.getElementById('formMessage');
                if (msgDiv) {
                    msgDiv.innerHTML = `
                        <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px;">
                            ⚠️ Please complete previous steps first.
                        </div>
                    `;
                    setTimeout(() => { msgDiv.innerHTML = ''; }, 3000);
                }
            }
        });
    });

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', function() {
            if (validateStep(currentStep)) {
                if (currentStep < totalSteps - 1) {
                    currentStep++;
                    showStep(currentStep);
                    if (currentStep === 4) updateSummary();
                }
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', function() {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

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
                    <span><strong>${escapeHtml(input.id.replace(/([A-Z])/g, ' $1').trim())}:</strong> ${escapeHtml(fileName)} (${fileSizeKB} KB)</span>
                    <span style="margin-left: auto; color: ${statusColor}; font-weight: bold;">${isUploaded ? '✅ Uploaded' : '❌ Required'}</span>
            `;
            
            if (this.files[0] && this.files[0].type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewHtml += ` <img src="${e.target.result}" class="file-thumbnail">`;
                    previewHtml += `</div>`;
                    const existing = previewDiv.querySelector(`[data-file="${input.id}"]`);
                    if (existing) existing.remove();
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
                if (existing) existing.remove();
                const wrapper = document.createElement('div');
                wrapper.dataset.file = input.id;
                wrapper.innerHTML = previewHtml;
                previewDiv.appendChild(wrapper);
                updateFileStatus();
            }
            
            const infoMsg = previewDiv.querySelector('p');
            if (infoMsg) infoMsg.remove();
        });
    });

    function updateFileStatus() {
        const previewDiv = document.getElementById('filePreview');
        const fileInputs = document.querySelectorAll('input[type="file"][required]');
        let uploadedCount = 0;
        const totalFiles = fileInputs.length;
        
        fileInputs.forEach(input => {
            if (input.files && input.files.length > 0) uploadedCount++;
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
            if (i === index) step.classList.add('active');
            else if (i < index) step.classList.add('completed');
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

        inputs.forEach(input => {
            if (input.offsetParent === null) return;
            if (input.readOnly) return;
            
            if (!input.value.trim()) {
                valid = false;
                input.style.borderColor = '#e8491d';
                setTimeout(() => { input.style.borderColor = ''; }, 3000);
            } else {
                input.style.borderColor = '';
            }
        });

        if (index === 2) {
            const pw = document.getElementById('password');
            const cpw = document.getElementById('confirmPassword');
            if (pw && cpw && pw.value && cpw.value) {
                if (pw.value.length < 6) {
                    valid = false;
                    pw.style.borderColor = '#e8491d';
                    showFormMessage('⚠️ Password must be at least 6 characters.', 'error');
                } else if (pw.value !== cpw.value) {
                    valid = false;
                    cpw.style.borderColor = '#e8491d';
                    showFormMessage('⚠️ Passwords do not match.', 'error');
                }
            }
        }

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
                showFormMessage('⚠️ Please upload ALL 4 required documents before proceeding.', 'error');
            }
        }

        if (index === 4) {
            const checkbox = document.getElementById('declaration');
            if (checkbox && !checkbox.checked) {
                valid = false;
                checkbox.style.outline = '2px solid #e8491d';
                setTimeout(() => { checkbox.style.outline = ''; }, 3000);
            }
        }

        if (!valid) {
            showFormMessage('⚠️ Please fill in all required fields before proceeding.', 'error');
        }

        return valid;
    }

    function showFormMessage(text, type) {
        const msgDiv = document.getElementById('formMessage');
        if (!msgDiv) return;
        const bg = type === 'error' ? '#f8d7da' : '#fff3cd';
        const color = type === 'error' ? '#721c24' : '#856404';
        msgDiv.innerHTML = `
            <div style="background: ${bg}; color: ${color}; padding: 15px; border-radius: 8px; margin-top: 12px;">
                ${text}
            </div>
        `;
        setTimeout(() => { msgDiv.innerHTML = ''; }, 7000);
    }

    function updateSummary() {
        const container = document.getElementById('summaryContent');
        if (!container) return;

        const fields = {
            'Full Name': (document.getElementById('firstName')?.value || '') + ' ' + (document.getElementById('surname')?.value || ''),
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
            const displayValue = value && value.trim() ? escapeHtml(value) : 'Not provided';
            html += `
                <div class="summary-item">
                    <strong>${escapeHtml(label)}:</strong> ${displayValue}
                </div>
            `;
        }
        html += '</div>';

        const fileFields = ['passportPhoto', 'admissionLetter', 'studentId', 'paymentReceipt'];
        let filesHtml = '<div class="summary-item" style="grid-column: 1 / -1;"><strong>Uploaded Files:</strong><ul>';
        let hasFiles = false;
        fileFields.forEach(field => {
            if (uploadedFiles[field]) {
                filesHtml += `<li>${escapeHtml(field.replace(/([A-Z])/g, ' $1').trim())}: ${escapeHtml(uploadedFiles[field].name)}</li>`;
                hasFiles = true;
            }
        });
        if (!hasFiles) filesHtml += '<li>No files uploaded</li>';
        filesHtml += '</ul></div>';
        html += filesHtml;

        container.innerHTML = html;
    }

    // ============================================
    // FORM SUBMISSION
    // ============================================
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit(e);
    });

    async function handleFormSubmit(e) {
        const submitBtn = document.querySelector('.btn-submit');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Application';

        if (!verifiedStudent) {
            showFormMessage('⚠️ Please verify your student record first.', 'error');
            return;
        }

        if (typeof supabase === 'undefined' || !supabase) {
            showFormMessage('⚠️ Database connection error. Please try again later.', 'error');
            return;
        }
        
        if (submitBtn) {
            submitBtn.innerHTML = `<span class="spinner"></span> Submitting...`;
            submitBtn.disabled = true;
        }

        const msgDiv = document.getElementById('formMessage');
        if (msgDiv) msgDiv.innerHTML = '';

        if (!validateStep(4)) {
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            return;
        }

        // ============================================
        // STEP 1: COMPRESS + UPLOAD FILES
        // Saves the STORAGE PATH (not public URL) so admins can
        // generate signed URLs on demand.
        // ============================================
        const fileFields = ['passportPhoto', 'admissionLetter', 'studentId', 'paymentReceipt'];
        const filePaths = {
            passportPhoto: '',
            admissionLetter: '',
            studentId: '',
            paymentReceipt: ''
        };

        const regSafe = (verifiedStudent.reg_no || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '_');

        for (const field of fileFields) {
            const fileInput = document.getElementById(field);
            let file = fileInput?.files[0];
            const fieldLabel = field.replace(/([A-Z])/g, ' $1').trim();

            if (!file) continue;

            try {
                if (file.type.startsWith('image/')) {
                    showFormMessage(`⏳ Compressing ${fieldLabel}...`, 'warn');
                    file = await compressImage(file, fieldLabel);
                }

                if (file.size > MAX_UPLOAD_BYTES) {
                    throw new Error(
                        `${fieldLabel} is ${prettySize(file.size)}. Maximum allowed is ${formatKB(MAX_UPLOAD_BYTES)}. Please upload a smaller file.`
                    );
                }

                const timestamp = Date.now();
                const safeName = sanitizeFileName(file.name);
                const fileName = `${timestamp}_${safeName}`;

                let folderPath = '';
                switch (field) {
                    case 'passportPhoto': folderPath = 'passports/'; break;
                    case 'admissionLetter': folderPath = 'admissions/'; break;
                    case 'studentId': folderPath = 'student-ids/'; break;
                    case 'paymentReceipt': folderPath = 'receipts/'; break;
                }

                const filePath = `${folderPath}${regSafe}_${fileName}`;

                const ok = await uploadWithRetry('membership-documents', filePath, file, 2);
                if (!ok.success) {
                    throw new Error(`${fieldLabel} upload failed: ${ok.error || 'network error'}. Please try again.`);
                }

                filePaths[field] = filePath;

            } catch (error) {
                console.warn('Upload error:', error);
                showFormMessage(`⚠️ ${error.message}`, 'error');
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                return;
            }
        }

        // ============================================
        // STEP 2: CONFLICT PRE-CHECK — email already used?
        // ============================================
        const email = (document.getElementById('email')?.value || '').trim();
        const password = document.getElementById('password')?.value || '';

        try {
            const { data: existingByEmail } = await supabase
                .from('students')
                .select('id, is_registered')
                .ilike('email', email)
                .maybeSingle();

            if (existingByEmail && existingByEmail.id !== verifiedStudent.id) {
                // Email belongs to a DIFFERENT roster row
                if (existingByEmail.is_registered === true) {
                    showFormMessage(
                        '⚠️ This email is already linked to another student record. Please use a different email or <a href="student/login.html" style="color: #8B1A1A; font-weight: 700;">log in instead</a>.',
                        'error'
                    );
                    if (submitBtn) {
                        submitBtn.innerHTML = originalText;
                        submitBtn.disabled = false;
                    }
                    return;
                } else {
                    // Stale link — clear it so we can proceed
                    await supabase
                        .from('students')
                        .update({ email: null, auth_user_id: null })
                        .eq('id', existingByEmail.id);
                }
            }
        } catch (e) {
            console.warn('Email pre-check error (continuing):', e);
        }

        // ============================================
        // STEP 3: CREATE AUTH ACCOUNT
        // ============================================
        let authUserId = null;
        try {
            const { data: authData, error: authErr } = await supabase.auth.signUp({
                email: email,
                password: password
            });

            if (authErr) throw authErr;
            authUserId = authData?.user?.id || null;

        } catch (error) {
            console.warn('SignUp error:', error);
            let friendly = '⚠️ Could not create your account. ';
            const lower = (error.message || '').toLowerCase();
            if (lower.includes('already') || lower.includes('registered') || lower.includes('exists')) {
                friendly += 'This email is already registered. <a href="student/login.html" style="color: #8B1A1A; font-weight: 700;">Log in instead</a>, or use a different email.';
            } else {
                friendly += 'Please try again, or contact AVMS if the problem persists.';
            }
            showFormMessage(friendly, 'error');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            return;
        }

        // ============================================
        // STEP 4: CLEAN STALE auth_user_id ON OTHER ROWS
        // (safety net — if an old attempt left this auth_user_id
        //  on a different roster row, null it out first)
        // ============================================
        if (authUserId) {
            try {
                const { data: orphan } = await supabase
                    .from('students')
                    .select('id')
                    .eq('auth_user_id', authUserId)
                    .maybeSingle();

                if (orphan && orphan.id !== verifiedStudent.id) {
                    await supabase
                        .from('students')
                        .update({ auth_user_id: null })
                        .eq('id', orphan.id);
                }
            } catch (e) {
                console.warn('auth_user_id pre-clean error (continuing):', e);
            }
        }

        // ============================================
        // STEP 5: UPDATE students ROW
        // ============================================
        try {
            const { error: stuErr } = await supabase
                .from('students')
                .update({
                    email: email,
                    auth_user_id: authUserId,
                    is_registered: true,
                    applied_at: new Date().toISOString()
                })
                .eq('id', verifiedStudent.id);

            if (stuErr) {
                const code = stuErr.code || '';
                const msg = (stuErr.message || '').toLowerCase();
                if (code === '23505' || msg.includes('duplicate') || msg.includes('conflict')) {
                    showFormMessage('⚠️ This email or account is already linked to another student record. Please contact AVMS with your Registration Number.', 'error');
                } else {
                    throw stuErr;
                }
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
                return;
            }

        } catch (error) {
            console.warn('students update error:', error);
            showFormMessage('⚠️ Your account was created but we could not save your application. Please contact AVMS with your Registration Number so we can complete it manually.', 'error');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
            return;
        }

        // ============================================
        // STEP 6: INSERT membership_applications
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
            reg_no: document.getElementById('regNumber')?.value || '',
            level: document.getElementById('level')?.value || '',
            year_of_graduation: document.getElementById('yearOfGraduation')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: email,
            home_address: document.getElementById('homeAddress')?.value || '',
            passport_photo_url: filePaths.passportPhoto || '',
            admission_letter_url: filePaths.admissionLetter || '',
            student_id_url: filePaths.studentId || '',
            payment_receipt_url: filePaths.paymentReceipt || '',
            auth_user_id: authUserId,
            is_active: false,
            status: 'pending',
            applied_at: new Date().toISOString()
        };

        try {
            const { error: appErr } = await supabase
                .from('membership_applications')
                .insert([formData]);

            if (appErr) throw appErr;

            showConfirmation(formData);

        } catch (error) {
            console.warn('Application insert error:', error);
            showFormMessage('⚠️ Your account was created but we could not save your application. Please contact AVMS with your Registration Number so we can complete it manually.', 'error');
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    async function uploadWithRetry(bucket, path, file, attemptsLeft) {
        try {
            const { error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    contentType: file.type || 'application/octet-stream',
                    upsert: false
                });
            if (error) return { success: false, error: error.message };
            return { success: true };
        } catch (err) {
            const msg = (err && err.message) ? err.message : String(err);
            const isNetwork = /fetch|network|timeout/i.test(msg);
            if (isNetwork && attemptsLeft > 0) {
                await new Promise(r => setTimeout(r, 800));
                return uploadWithRetry(bucket, path, file, attemptsLeft - 1);
            }
            return { success: false, error: msg };
        }
    }

    function showConfirmation(data) {
        const form = document.getElementById('membershipForm');
        if (form) form.style.display = 'none';
        
        const indicator = document.querySelector('.steps-indicator');
        if (indicator) indicator.style.display = 'none';
        
        const verifySection = document.getElementById('verifySection');
        if (verifySection) verifySection.style.display = 'none';
        
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
        if (confirmName) confirmName.textContent = (data.first_name || '') + ' ' + (data.surname || '');
        
        const confirmReg = document.getElementById('confirmReg');
        if (confirmReg) confirmReg.textContent = data.reg_no || data.reg_number || '';
        
        const confirmLevel = document.getElementById('confirmLevel');
        if (confirmLevel) confirmLevel.textContent = data.level || '';
        
        const confirmEmail = document.getElementById('confirmEmail');
        if (confirmEmail) confirmEmail.textContent = data.email || '';
        
        const confirmPhone = document.getElementById('confirmPhone');
        if (confirmPhone) confirmPhone.textContent = data.phone || '';
        
        if (confirmDiv) {
            confirmDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
