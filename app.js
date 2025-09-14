/** * Thai Insurance Survey Application JavaScript 
 * แอปพลิเคชันแบบสอบถามประกันภัยภาษาไทย 
 */

// ==== เพิ่มส่วนเชื่อม Google Apps Script ====
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxHXr-EMUOo2AzUaYHJxzEQKz6YMvB_VwE72Q05FapQh17bi4xkCiK7Vy_jXpVGZB22lA/exec';

// แปลงข้อมูลสำหรับส่ง (Array -> comma-separated)
function buildPayload(data) {
  const normalized = {};
  Object.keys(data).forEach(k => {
    const v = data[k];
    normalized[k] = Array.isArray(v) ? v.join(', ') : v;
  });
  normalized._submittedAt = new Date().toISOString();
  normalized._userAgent = navigator.userAgent;
  return normalized;
}

// ฟังก์ชันส่งข้อมูลไป Apps Script
async function submitSurvey() {
  try {
    const payload = buildPayload(formData);
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    alert('บันทึกข้อมูลเรียบร้อย ขอบคุณที่ตอบแบบสอบถาม!');
    // สามารถ redirect หรือกดปิดหน้าต่างได้ตรงนี้
  } catch (err) {
    alert('ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่ หรือแจ้งผู้ดูแลระบบ');
  }
}

// Global variables
let currentSection = 0; 
let formData = {}; 
const totalSections = 7; // อัปเดตจาก 6 เป็น 7
console.log('Loading survey application...'); 

/** * เริ่มต้นการทำแบบสอบถาม */ 
function startSurvey() { 
  console.log('startSurvey function called'); 
  try { 
    // ซ่อนหน้าแนะนำ 
    const introduction = document.getElementById('introduction'); 
    if (introduction) { 
      introduction.style.display = 'none'; 
      console.log('Introduction hidden'); 
    } 
    // แสดงแบบฟอร์ม 
    const surveyForm = document.getElementById('surveyForm'); 
    if (surveyForm) { 
      surveyForm.classList.remove('d-none'); 
      console.log('Survey form shown'); 
    } 
    // แสดงปุ่มนำทาง 
    const navigation = document.getElementById('navigation'); 
    if (navigation) { 
      navigation.classList.remove('d-none'); 
      console.log('Navigation shown'); 
    } 
    // เริ่มที่ส่วนแรก 
    currentSection = 1; 
    showSection(1); 
    updateProgress(); 
    console.log('Survey started successfully'); 
  } catch (error) { 
    console.error('Error starting survey:', error); 
    alert('เกิดข้อผิดพลาดในการเริ่มแบบสอบถาม กรุณาลองใหม่'); 
  } 
} 

/** * แสดงส่วนที่กำหนด */ 
function showSection(sectionNumber) { 
  console.log(`Showing section ${sectionNumber}`); 
  // ซ่อนทุกส่วน 
  for (let i = 1; i <= totalSections; i++) { 
    const section = document.getElementById(`section-${i}`); 
    if (section) { 
      section.classList.add('d-none'); 
    }
  }
  // แสดงส่วนที่ต้องการ
  const targetSection = document.getElementById(`section-${sectionNumber}`);
  if (targetSection) {
    targetSection.classList.remove('d-none');
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  updateNavigationButtons();

  // จัดการ conditional inputs ที่ควรอยู่ในส่วน JS
  const selectedStatus = formData.status;
  const childrenInfo = document.getElementById('children-info');
  const singleQuestions = document.getElementById('single-questions');
  const parentQuestions = document.getElementById('parent-questions');

  if (childrenInfo) {
    if (selectedStatus && (selectedStatus.includes('มีลูก') || selectedStatus.includes('หย่าร้าง/แยกทาง (มีลูก)'))) {
        childrenInfo.classList.remove('d-none');
    } else {
        childrenInfo.classList.add('d-none');
    }
  }
  
  if (singleQuestions) {
    if (selectedStatus === 'โสด') {
        singleQuestions.classList.remove('d-none');
    } else {
        singleQuestions.classList.add('d-none');
    }
  }
  
  if (parentQuestions) {
    if (selectedStatus && (selectedStatus.includes('มีลูก') || selectedStatus.includes('หย่าร้าง/แยกทาง (มีลูก)'))) {
        parentQuestions.classList.remove('d-none');
    } else {
        parentQuestions.classList.add('d-none');
    }
  }
} 

/** * ไปส่วนถัดไป */ 
function nextSection() { 
  console.log(`Next section from ${currentSection}`); 
  if (validateSection(currentSection)) { 
    saveData(currentSection); 
    if (currentSection < totalSections) { 
      currentSection++; 
      showSection(currentSection); 
      updateProgress(); 
    } else { 
      showSummary(); 
    } 
  } 
} 

/** * กลับส่วนก่อนหน้า */ 
function previousSection() { 
  console.log(`Previous section from ${currentSection}`); 
  if (currentSection > 1) { 
    currentSection--; 
    showSection(currentSection); 
    updateProgress(); 
  } 
} 

/** * ตรวจสอบความถูกต้องของส่วนปัจจุบัน */ 
function validateSection(sectionNumber) { 
  const section = document.getElementById(`section-${sectionNumber}`); 
  if (!section) return true; 
  // ล้าง error messages เก่า 
  section.querySelectorAll('.invalid-feedback').forEach(el => el.remove()); 
  section.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid')); 
  const requiredInputs = section.querySelectorAll('input[required], textarea[required]'); 
  let isValid = true; 
  // ตรวจสอบ radio groups 
  const radioGroups = {}; 
  requiredInputs.forEach(input => { 
    if (input.type === 'radio') { 
      if (!radioGroups[input.name]) { 
        radioGroups[input.name] = section.querySelectorAll(`input[name="${input.name}"]`); 
      } 
    } 
  }); 
  // ตรวจสอบแต่ละ radio group 
  Object.keys(radioGroups).forEach(groupName => { 
    const radios = radioGroups[groupName]; 
    const isChecked = Array.from(radios).some(radio => radio.checked); 
    if (!isChecked) { 
      isValid = false; 
      const firstRadio = radios[0]; 
      const container = firstRadio.closest('.question-group'); 
      if (container) { 
        const feedback = document.createElement('div'); 
        feedback.className = 'invalid-feedback d-block'; 
        feedback.textContent = 'กรุณาเลือกคำตอบ'; 
        container.appendChild(feedback); 
      } 
    } 
  }); 
  // ตรวจสอบ checkbox groups ที่ required 
  const checkboxGroups = {}; 
  section.querySelectorAll('input[type="checkbox"]').forEach(checkbox => { 
    const container = checkbox.closest('.question-group'); 
    if (container && container.querySelector('.form-label.required')) { 
      if (!checkboxGroups[checkbox.name]) { 
        checkboxGroups[checkbox.name] = section.querySelectorAll(`input[name="${checkbox.name}"]`); 
      } 
    } 
  }); 
  Object.keys(checkboxGroups).forEach(groupName => { 
    const checkboxes = checkboxGroups[groupName]; 
    const isChecked = Array.from(checkboxes).some(cb => cb.checked); 
    if (!isChecked) { 
      isValid = false; 
      const firstCheckbox = checkboxes[0]; 
      const container = firstCheckbox.closest('.question-group'); 
      if (container) { 
        const feedback = document.createElement('div'); 
        feedback.className = 'invalid-feedback d-block'; 
        feedback.textContent = 'กรุณาเลือกอย่างน้อย 1 ข้อ'; 
        container.appendChild(feedback); 
      } 
    } 
  }); 
  // ตรวจสอบ textarea และ input อื่นๆ requiredInputs.forEach(input => { 
    if (input.type !== 'radio' && input.type !== 'checkbox') { 
      if (!input.value.trim()) { 
        isValid = false; 
        input.classList.add('is-invalid'); 
        const feedback = document.createElement('div'); 
        feedback.className = 'invalid-feedback'; 
        feedback.textContent = 'กรุณากรอกข้อมูล'; 
        input.parentNode.appendChild(feedback); 
      } 
    } 
  }); 
  return isValid; 
} 

/** * บันทึกข้อมูลของส่วนปัจจุบัน */ 
function saveData(sectionNumber) { 
  const section = document.getElementById(`section-${sectionNumber}`); 
  if (!section) return; 
  const inputs = section.querySelectorAll('input, textarea, select'); 
  inputs.forEach(input => { 
    if (input.type === 'radio' && input.checked) { 
      formData[input.name] = input.value; 
    } else if (input.type === 'checkbox' && input.checked) { 
      if (!formData[input.name]) formData[input.name] = []; 
      if (!formData[input.name].includes(input.value)) { 
        formData[input.name].push(input.value); 
      } 
    } else if (input.type !== 'radio' && input.type !== 'checkbox' && input.value.trim()) { 
      formData[input.name] = input.value; 
    } 
  }); 
  console.log('Data saved:', formData); 
} 

/** * อัปเดตความคืบหน้า */ 
function updateProgress() { 
  const progressBar = document.querySelector('.progress-bar'); 
  const progressText = document.querySelector('.progress-text'); 
  if (progressBar && progressText) { 
    const percentage = (currentSection / totalSections) * 100; 
    progressBar.style.width = `${percentage}%`; 
    progressText.textContent = `ขั้นตอนที่ ${currentSection} จาก ${totalSections}`; 
  } 
} 

/** * อัปเดตปุ่มนำทาง */ 
function updateNavigationButtons() { 
  const prevBtn = document.getElementById('prevBtn'); 
  const nextBtn = document.getElementById('nextBtn'); 
  if (prevBtn) { 
    prevBtn.disabled = currentSection <= 1; 
  } 
  if (nextBtn) { 
    if (currentSection >= totalSections) { 
      nextBtn.innerHTML = 'ตรวจสอบข้อมูล'; 
    } else { 
      nextBtn.innerHTML = 'ถัดไป'; 
    } 
  } 
} 

/** * แสดงหน้าสรุป */ 
function showSummary() { 
  console.log('Showing summary'); 
  document.getElementById('surveyForm').classList.add('d-none'); 
  document.getElementById('navigation').classList.add('d-none'); 
  const summarySection = document.getElementById('summary-section'); 
  summarySection.classList.remove('d-none'); 
  generateSummary(); 
  const progressBar = document.querySelector('.progress-bar'); 
  const progressText = document.querySelector('.progress-text'); 
  if (progressBar) progressBar.style.width = '100%'; 
  if (progressText) progressText.textContent = 'สรุปข้อมูล'; 

  // === เพิ่มการผูกปุ่ม "ส่งข้อมูล" ===
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) submitBtn.onclick = submitSurvey;
}

/** * สร้างเนื้อหาสรุป */ 
function generateSummary() { 
  const summaryContent = document.getElementById('summary-content'); 
  let html = '<ul class="list-group list-group-flush">';
  const fieldMapping = {
    // Basic Info
    'age': 'อายุ',
    'gender': 'เพศ',
    'status': 'สถานภาพ',
    'children_count': 'จำนวนลูก',
    'youngest_age': 'อายุลูกคนเล็กสุด',
    // MANHA
    'income': 'รายได้หลักต่อเดือน',
    'additional_income': 'แหล่งรายได้เสริม',
    'additional_income_source': 'แหล่งรายได้เสริม (ระบุ)',
    'financial_plan': 'การวางแผนการเงิน',
    'savings_duration': 'เงินออมสำหรับกรณีรายได้หยุด',
    'assets': 'ทรัพย์สินที่มี',
    'other_assets_source': 'ทรัพย์สินอื่นๆ (ระบุ)',
    'total_assets': 'มูลค่าทรัพย์สินทั้งหมด',
    'life_goals': 'เป้าหมายสำคัญในชีวิต',
    'other_goals_text': 'เป้าหมายอื่นๆ (ระบุ)',
    'retirement_age': 'อายุที่ต้องการเกษียณ',
    'retirement_cost': 'ค่าใช้จ่ายหลังเกษียณต่อเดือน',
    'general_health': 'สุขภาพโดยรวม',
    'medical_history': 'ประวัติการรักษาปีที่ผ่านมา',
    'family_diseases': 'ประวัติโรคในครอบครัว',
    'other_diseases_text': 'ประวัติโรคอื่นๆ (ระบุ)',
    'planning_age': 'อายุที่เริ่มวางแผนอนาคต',
    'future_concern': 'สิ่งที่กังวลที่สุดในอนาคต',
    'other_concern_text': 'ความกังวลอื่นๆ (ระบุ)',
    // Life Gaps & Lifestyle
    'concern_finance': 'ความกังวล (การเงิน)',
    'concern_health': 'ความกังวล (สุขภาพ)',
    'concern_children': 'ความกังวล (ลูก)',
    'concern_parents': 'ความกังวล (พ่อแม่)',
    'concern_job': 'ความกังวล (งาน)',
    'concern_other': 'ความกังวลอื่นๆ (ระบุ)',
    'sick_impact': 'ผลกระทบหากเจ็บป่วย',
    'lifestyle': 'สไตล์การใช้ชีวิต',
    'regular_activities': 'กิจกรรมประจำ',
    'other_activities_text': 'กิจกรรมอื่นๆ (ระบุ)',
    'risky_activities': 'กิจกรรมที่มีความเสี่ยงสูง',
    'risky_activities_text': 'กิจกรรมเสี่ยงสูง (ระบุ)',
    'life_security': 'ความมั่นคงในชีวิต',
    'other_security_text': 'ความมั่นคงอื่นๆ (ระบุ)',
    'peace_of_mind': 'สิ่งที่ทำให้สบายใจขึ้น',
    'other_peace_of_mind_text': 'สิ่งที่ทำให้สบายใจอื่นๆ (ระบุ)',
    // Special Focus
    'single_concern': 'ความกังวลในฐานะคนโสด',
    'other_single_concern_text': 'ความกังวลอื่นๆ (โสด)',
    'single_prep': 'การเตรียมเงินที่จำเป็น (โสด)',
    'other_single_prep_text': 'การเตรียมเงินอื่นๆ (โสด)',
    'child_concern': 'ความกังวลเกี่ยวกับลูก',
    'other_child_concern_text': 'ความกังวลอื่นๆ (ลูก)',
    'education_cost': 'ประมาณการค่าใช้จ่ายการศึกษาลูก',
    'monthly_income_protection': 'รายได้ที่ต้องการให้ครอบครัวได้รับหากเกิดเหตุ',
    // Risk Assessment
    'invest_or_insure': 'การเลือกระหว่างลงทุน/ประกัน',
    'money_allocation': 'การจัดสรรเงิน 100,000 บาท',
    'other_money_allocation_text': 'การจัดสรรเงินอื่นๆ (ระบุ)',
    // Insurance Experience
    'current_insurance': 'ประกันที่มีในปัจจุบัน',
    'other_insurance_text': 'ประกันอื่นๆ (ระบุ)',
    'claim_experience': 'ประสบการณ์การเคลมประกัน',
    'insurance_factor': 'ปัจจัยสำคัญในการเลือกประกัน',
    // Open-ended
    'life_gaps_description': 'ช่องโหว่ในชีวิต',
    'priority_1': 'ลำดับความสำคัญประกันอันดับ 1',
    'priority_2': 'ลำดับความสำคัญประกันอันดับ 2',
    'priority_3': 'ลำดับความสำคัญประกันอันดับ 3',
    'other_concerns': 'คำถาม/ข้อกังวลอื่นๆ',
  };

  for (const key in formData) {
    if (formData.hasOwnProperty(key) && formData[key] && fieldMapping[key]) {
      const label = fieldMapping[key];
      const value = Array.isArray(formData[key]) ? formData[key].join(', ') : formData[key];
      html += `<li class="list-group-item"><strong>${label}:</strong> ${value}</li>`;
    }
  }

  html += '</ul>';
  summaryContent.innerHTML = html;
}

/** * แก้ไขข้อมูล */ 
function editSurvey() { 
  document.getElementById('summary-section').classList.add('d-none'); 
  document.getElementById('surveyForm').classList.remove('d-none'); 
  document.getElementById('navigation').classList.remove('d-none'); 
  currentSection = totalSections; 
  showSection(currentSection); 
  updateProgress(); 
} 

// เพิ่ม listener สำหรับ conditional fields
document.addEventListener('DOMContentLoaded', () => {
    const setupConditionalInput = (radioName, inputId) => {
        const container = document.getElementById(inputId);
        if (!container) return;
        
        const inputs = document.querySelectorAll(`input[name="${radioName}"]`);
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const selectedValues = Array.from(inputs).filter(i => i.checked).map(i => i.value);
                if (selectedValues.includes('อื่นๆ') || selectedValues.includes('มี')) {
                    container.classList.remove('d-none');
                } else {
                    container.classList.add('d-none');
                }
            });
        });
    };

    setupConditionalInput('additional_income', 'additional_income_details');
    setupConditionalInput('assets', 'other_assets');
    setupConditionalInput('life_goals', 'other_goals');
    setupConditionalInput('family_diseases', 'other_diseases');
    setupConditionalInput('future_concern', 'other_concern');
    setupConditionalInput('regular_activities', 'other_activities');
    setupConditionalInput('risky_activities', 'risky_activities_details');
    setupConditionalInput('life_security', 'other_security');
    setupConditionalInput('peace_of_mind', 'other_peace_of_mind');
    setupConditionalInput('single_concern', 'other_single_concern');
    setupConditionalInput('single_prep', 'other_single_prep');
    setupConditionalInput('child_concern', 'other_child_concern');
    setupConditionalInput('current_insurance', 'other_insurance');
});