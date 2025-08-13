// 숫자 포맷 함수 - 만원 단위로 표시
export function formatNumber(num) {
  return Math.round(num / 10000).toLocaleString('ko-KR') + '만원';
}

// 원 단위로 변환하는 함수
export function convertToWon(manwon) {
  return manwon * 10000;
}

// 만원 단위로 변환하는 함수
export function convertToManwon(won) {
  return Math.round(won / 10000);
}

/**
 * 근로소득공제 계산
 * @param {number} salary - 총급여 (원 단위)
 * @returns {object} - { amount: 공제금액, formula: 계산식 }
 */
export function calculateLaborIncomeDeduction(salary) {
  let deduction = 0;
  let formula = '';
  
  if (salary <= 5000000) { 
    deduction = salary * 0.7;
    formula = `${formatNumber(salary)} × 70% = ${formatNumber(deduction)}`;
  } else if (salary <= 15000000) { 
    deduction = 3500000 + (salary - 5000000) * 0.4;
    formula = `350만원 + (${formatNumber(salary)} - 500만원) × 40% = ${formatNumber(deduction)}`;
  } else if (salary <= 45000000) { 
    deduction = 7500000 + (salary - 15000000) * 0.15;
    formula = `750만원 + (${formatNumber(salary)} - 1,500만원) × 15% = ${formatNumber(deduction)}`;
  } else if (salary <= 100000000) { 
    deduction = 12000000 + (salary - 45000000) * 0.05;
    formula = `1,200만원 + (${formatNumber(salary)} - 4,500만원) × 5% = ${formatNumber(deduction)}`;
  } else {
    deduction = 14750000 + (salary - 100000000) * 0.02;
    formula = `1,475만원 + (${formatNumber(salary)} - 10,000만원) × 2% = ${formatNumber(deduction)}`;
  }
  
  return {
    amount: deduction,
    formula: formula
  };
}

/**
 * 인적공제 계산
 * @param {object} answers - 인적공제 응답 데이터
 * @returns {object} - { basicDeduction: 기본공제, additionalDeduction: 추가공제, totalDeduction: 총공제 }
 */
export function calculatePersonalDeduction(answers) {
  // 기본공제 계산 (1인당 150만원)
  let basicDeductionCount = 0;
  
  // 본인 (기본값: true)
  if (answers.self?.checked !== false) basicDeductionCount++;
  
  // 배우자
  if (answers.spouse?.checked) basicDeductionCount++;
  
  // 부모/조부모 (숫자 입력)
  if (answers.parents?.count > 0) basicDeductionCount += answers.parents.count;
  
  // 자녀/손자녀 (숫자 입력)
  if (answers.children?.count > 0) basicDeductionCount += answers.children.count;
  
  // 형제자매 (숫자 입력)
  if (answers.siblings?.count > 0) basicDeductionCount += answers.siblings.count;
  
  const basicDeduction = basicDeductionCount * 1500000; // 150만원 × 인원수

  // 추가공제 계산
  let additionalDeduction = 0;
  let deductionDetails = [];
  
  // 경로우대 (70세 이상, 1인당 100만원)
  if (answers.senior?.count > 0) {
    const seniorDeduction = answers.senior.count * 1000000;
    additionalDeduction += seniorDeduction;
    deductionDetails.push({
      type: '경로우대',
      count: answers.senior.count,
      unitAmount: 1000000,
      totalAmount: seniorDeduction
    });
  }
  
  // 장애인 (1인당 200만원)
  if (answers.disabled?.count > 0) {
    const disabledDeduction = answers.disabled.count * 2000000;
    additionalDeduction += disabledDeduction;
    deductionDetails.push({
      type: '장애인',
      count: answers.disabled.count,
      unitAmount: 2000000,
      totalAmount: disabledDeduction
    });
  }
  
  // 한부모 가정과 부녀자 공제 중복 처리
  if (answers['single-parent']?.checked && answers.female?.checked) {
    // 한부모 공제가 우선 적용 (100만원)
    const singleParentDeduction = 1000000;
    additionalDeduction += singleParentDeduction;
    deductionDetails.push({
      type: '한부모 가정',
      count: 1,
      unitAmount: 1000000,
      totalAmount: singleParentDeduction,
      note: '한부모 공제와 부녀자 공제 중복시 한부모 공제 우선 적용'
    });
  } else {
    if (answers['single-parent']?.checked) {
      const singleParentDeduction = 1000000;
      additionalDeduction += singleParentDeduction;
      deductionDetails.push({
        type: '한부모 가정',
        count: 1,
        unitAmount: 1000000,
        totalAmount: singleParentDeduction
      });
    }
    if (answers.female?.checked) {
      const femaleDeduction = 500000;
      additionalDeduction += femaleDeduction;
      deductionDetails.push({
        type: '부녀자 공제',
        count: 1,
        unitAmount: 500000,
        totalAmount: femaleDeduction
      });
    }
  }

  return {
    basicDeduction,
    additionalDeduction,
    totalDeduction: basicDeduction + additionalDeduction,
    basicDeductionCount,
    deductionDetails
  };
}

/**
 * 연금보험료공제 계산 함수 (개선된 버전)
 * @param {object} pensionData - 연금보험료 데이터
 * @param {number} salary - 총급여 (원 단위)
 * @returns {object} - { totalPension: 총연금보험료, details: 상세내역 }
 */
export function calculatePensionInsurance(pensionData, salary) {
  let totalPension = 0;
  let details = [];
  
  // 국민연금 계산
  if (pensionData['national-pension']?.checked) {
    const amount = pensionData['national-pension'].amount;
    
    // 자동계산 또는 수동입력된 금액 사용
    const finalAmount = amount || calculateNationalPensionAmount(salary);
    
    totalPension += finalAmount;
    details.push({
      type: '국민연금',
      rate: '4.5%',
      amount: finalAmount,
      isAutoCalculated: !amount || amount === calculateNationalPensionAmount(salary)
    });
  }
  
  // 공무원연금 계산
  if (pensionData['public-pension']?.checked) {
    const amount = pensionData['public-pension'].amount;
    
    // 자동계산 또는 수동입력된 금액 사용
    const finalAmount = amount || calculatePublicPensionAmount(salary);
    
    totalPension += finalAmount;
    details.push({
      type: '공무원연금',
      rate: '9%',
      amount: finalAmount,
      isAutoCalculated: !amount || amount === calculatePublicPensionAmount(salary)
    });
  }
  
  // 군인연금 계산
  if (pensionData['military-pension']?.checked) {
    const amount = pensionData['military-pension'].amount;
    
    // 자동계산 또는 수동입력된 금액 사용
    const finalAmount = amount || calculatePublicPensionAmount(salary);
    
    totalPension += finalAmount;
    details.push({
      type: '군인연금',
      rate: '9%',
      amount: finalAmount,
      isAutoCalculated: !amount || amount === calculatePublicPensionAmount(salary)
    });
  }
  
  // 사립학교교직원연금 계산
  if (pensionData['private-school-pension']?.checked) {
    const amount = pensionData['private-school-pension'].amount;
    
    // 자동계산 또는 수동입력된 금액 사용
    const finalAmount = amount || calculatePublicPensionAmount(salary);
    
    totalPension += finalAmount;
    details.push({
      type: '사립학교교직원연금',
      rate: '9%',
      amount: finalAmount,
      isAutoCalculated: !amount || amount === calculatePublicPensionAmount(salary)
    });
  }
  
  // 별정우체국연금 계산
  if (pensionData['post-office-pension']?.checked) {
    const amount = pensionData['post-office-pension'].amount;
    
    // 자동계산 또는 수동입력된 금액 사용
    const finalAmount = amount || calculatePublicPensionAmount(salary);
    
    totalPension += finalAmount;
    details.push({
      type: '별정우체국연금',
      rate: '9%',
      amount: finalAmount,
      isAutoCalculated: !amount || amount === calculatePublicPensionAmount(salary)
    });
  }
  
  return {
    totalPension,
    details
  };
}

/**
 * 국민연금 자동 계산
 * @param {number} salary - 총급여 (원 단위)
 * @returns {number} - 연간 국민연금 납부액
 */
export function calculateNationalPensionAmount(salary) {
  if (salary <= 0) return 0;
  
  const monthlySalary = salary / 12;
  const pensionRate = 0.045; // 4.5%
  
  // 국민연금 기준소득월액 한도 적용 (2024년 기준: 590만원)
  const maxMonthlyBase = 5900000;
  const minMonthlyBase = 350000;
  
  const pensionBase = Math.max(minMonthlyBase, Math.min(monthlySalary, maxMonthlyBase));
  const monthlyPension = Math.round(pensionBase * pensionRate);
  
  return monthlyPension * 12;
}

/**
 * 공무원연금/군인연금/사학연금/우정연금 자동 계산
 * @param {number} salary - 총급여 (원 단위)
 * @returns {number} - 연간 연금 납부액
 */
export function calculatePublicPensionAmount(salary) {
  if (salary <= 0) return 0;
  
  const monthlySalary = salary / 12;
  const pensionRate = 0.09; // 9%
  
  const monthlyPension = Math.round(monthlySalary * pensionRate);
  
  return monthlyPension * 12;
}

/**
 * 연금 종류 검증
 * @param {object} pensionData - 연금보험료 데이터
 * @returns {object} - { isValid: boolean, errors: array }
 */
export function validatePensionData(pensionData) {
  const errors = [];
  const checkedPensions = [];
  
  // 체크된 연금 종류 확인
  Object.keys(pensionData).forEach(key => {
    if (pensionData[key]?.checked) {
      checkedPensions.push(key);
    }
  });
  
  // 중복 가입 검증 (국민연금과 다른 연금은 중복 불가)
  if (checkedPensions.length > 1) {
    if (checkedPensions.includes('national-pension')) {
      errors.push('국민연금과 다른 연금은 중복으로 가입할 수 없습니다.');
    } else if (checkedPensions.length > 1) {
      errors.push('공무원연금, 군인연금, 사학연금, 우정연금은 중복으로 가입할 수 없습니다.');
    }
  }
  
  // 금액 검증
  checkedPensions.forEach(pensionType => {
    const amount = pensionData[pensionType]?.amount || 0;
    if (amount < 0) {
      errors.push('연금보험료는 0원 이상이어야 합니다.');
    }
    if (amount > 10000000) {
      errors.push('연금보험료가 너무 큽니다. 금액을 확인해주세요.');
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 연금 종류별 설명 반환
 * @param {string} pensionType - 연금 종류
 * @returns {object} - 연금 정보
 */
export function getPensionInfo(pensionType) {
  const pensionInfoMap = {
    'national-pension': {
      name: '국민연금',
      description: '국민연금법에 따른 연금보험료',
      rate: '4.5%',
      target: '일반 근로자, 자영업자 등',
      maxAmount: 5900000 * 12 * 0.045 // 기준소득월액 상한 기준
    },
    'public-pension': {
      name: '공무원연금',
      description: '공무원연금법에 따른 연금보험료',
      rate: '9%',
      target: '국가공무원, 지방공무원',
      maxAmount: null
    },
    'military-pension': {
      name: '군인연금',
      description: '군인연금법에 따른 연금보험료',
      rate: '9%',
      target: '현역군인, 군무원',
      maxAmount: null
    },
    'private-school-pension': {
      name: '사립학교교직원연금',
      description: '사립학교교직원연금법에 따른 연금보험료',
      rate: '9%',
      target: '사립학교 교직원',
      maxAmount: null
    },
    'post-office-pension': {
      name: '별정우체국연금',
      description: '별정우체국법에 따른 연금보험료',
      rate: '9%',
      target: '별정우체국 직원',
      maxAmount: null
    }
  };
  
  return pensionInfoMap[pensionType] || null;
}

/**
 * 특별소득공제 계산 함수 (만원 단위)
 * @param {object} specialData - 특별소득공제 데이터
 * @param {number} salary - 총급여 (만원 단위)
 * @returns {object} - { totalDeduction: 총특별소득공제(만원), details: 상세내역 }
 */
export function calculateSpecialDeduction(specialData, salary = 0) {
  let totalDeduction = 0;
  let details = [];
  
  // 사회보험료 계산
  if (specialData.insurance?.checked) {
    const amount = specialData.insurance.amount || 0;
    
    // 자동계산 또는 수동입력된 금액 사용 (만원 단위)
    const finalAmount = amount || calculateInsuranceAmount(salary);
    
    totalDeduction += finalAmount;
    details.push({
      type: '사회보험료',
      description: '건강보험, 고용보험, 노인장기요양보험',
      amount: finalAmount,
      rate: '3.545%',
      isAutoCalculated: !amount || amount === calculateInsuranceAmount(salary)
    });
  }
  
  // 주택임차차입금 원리금상환액 계산
  if (specialData['housing-rent']?.checked) {
    const amount = specialData['housing-rent'].amount || 0;
    
    totalDeduction += amount;
    details.push({
      type: '주택임차차입금',
      description: '전세자금 대출 원리금 상환액',
      amount: amount,
      rate: '40% (최대 400만원)',
      inputAmount: specialData['housing-rent'].inputAmount || 0
    });
  }
  
  // 장기주택저당차입금 이자상환액 계산
  if (specialData['housing-loan']?.checked) {
    const amount = specialData['housing-loan'].amount || 0;
    
    totalDeduction += amount;
    details.push({
      type: '장기주택저당차입금',
      description: '주택구입 대출 이자상환액',
      amount: amount,
      rate: '대출조건별 차등',
      inputAmount: specialData['housing-loan'].inputAmount || 0,
      loanDetails: specialData['housing-loan'].details || {}
    });
  }
  
  return {
    totalDeduction: Math.round(totalDeduction),
    details
  };
}

/**
 * 사회보험료 자동 계산 (만원 단위)
 * @param {number} salary - 총급여 (만원 단위)
 * @returns {number} - 연간 사회보험료 (만원 단위)
 */
export function calculateInsuranceAmount(salary) {
  if (salary <= 0) return 0;
  
  const salaryInWon = salary * 10000; // 원 단위로 변환
  const monthlySalary = salaryInWon / 12;
  const insuranceRate = 0.03545; // 3.545% (건강보험 + 고용보험 + 노인장기요양보험)
  
  const monthlyInsurance = Math.round(monthlySalary * insuranceRate);
  const annualInsuranceWon = monthlyInsurance * 12;
  
  return Math.round(annualInsuranceWon / 10000); // 만원 단위로 반환
}

/**
 * 주택임차차입금 공제액 계산 (만원 단위)
 * @param {number} inputAmount - 원리금 상환액 (만원 단위)
 * @returns {number} - 공제액 (만원 단위)
 */
export function calculateHousingRentDeduction(inputAmount) {
  if (inputAmount <= 0) return 0;
  
  const amountInWon = inputAmount * 10000; // 만원을 원으로 변환
  const deduction = Math.min(amountInWon * 0.4, 4000000); // 40% 공제, 최대 40만원
  
  return Math.round(deduction / 10000); // 만원으로 다시 변환
}

/**
 * 장기주택저당차입금 이자상환액 공제 한도 계산 (만원 단위)
 * @param {number} inputAmount - 이자상환액 (만원 단위)
 * @param {object} details - 대출 상세정보
 * @returns {number} - 공제액 (만원 단위)
 */
export function calculateHousingLoanDeduction(inputAmount, details) {
  if (inputAmount <= 0) return 0;
  
  const amountInWon = inputAmount * 10000; // 만원을 원으로 변환
  const contractDate = new Date(details.contractDate || '2020-01-01');
  const { repaymentPeriod, interestType, repaymentType } = details;
  
  let maxDeduction = 0;
  
  // 2012년 이후 계약
  if (contractDate >= new Date('2012-01-01')) {
    if ((repaymentPeriod === '15' || repaymentPeriod === '30') && 
        (interestType === 'fixed' && repaymentType === 'installment')) {
      maxDeduction = 20000000; // 2000만원
    } else if ((repaymentPeriod === '15' || repaymentPeriod === '30') && 
               (interestType === 'fixed' || repaymentType === 'installment')) {
      maxDeduction = 18000000; // 1800만원
    } else if ((repaymentPeriod === '15' || repaymentPeriod === '30') && 
               repaymentType === 'other') {
      maxDeduction = 8000000; // 800만원
    } else if ((repaymentPeriod === '10') && 
              (interestType === 'fixed' || repaymentType === 'installment')) {
      maxDeduction = 6000000; // 600만원
    }
  } 
  // 2012년 이전 계약
  else {
    if (repaymentPeriod === '15' && 
        (interestType === 'fixed' && repaymentType === 'installment')) {
      maxDeduction = 20000000; // 2000만원
    } else if (repaymentPeriod === '15' && 
               (interestType === 'fixed' || repaymentType === 'installment')) {
      maxDeduction = 18000000; // 1800만원
    } else if (repaymentPeriod === '30') {
      maxDeduction = 15000000; // 1500만원
    } else if (repaymentPeriod === '15') {
      maxDeduction = 10000000; // 1000만원
    } else if (repaymentPeriod === 'less') {
      maxDeduction = 6000000; // 600만원
    }
  }
  
  const deduction = Math.min(amountInWon, maxDeduction);
  return Math.round(deduction / 10000); // 만원으로 변환
}

/**
 * 특별소득공제 유효성 검사
 * @param {object} specialData - 특별소득공제 데이터
 * @returns {object} - { isValid: boolean, errors: array }
 */
export function validateSpecialDeduction(specialData) {
  const errors = [];
  
  // 주택임차차입금과 주택저당차입금 중복 체크
/*   if (specialData['housing-rent']?.checked && specialData['housing-loan']?.checked) {
    errors.push('주택임차차입금과 주택저당차입금은 중복으로 공제받을 수 없습니다.');
  }
   */
  // 금액 검증
  Object.keys(specialData).forEach(key => {
    const item = specialData[key];
    if (item?.checked && item?.amount) {
      if (item.amount < 0) {
        errors.push(`${key} 공제액은 0만원 이상이어야 합니다.`);
      }
      if (item.amount > 10000) {
        errors.push(`${key} 공제액이 너무 큽니다. 금액을 확인해주세요.`);
      }
    }
  });
  
  // 주택저당차입금 상세정보 검증
  if (specialData['housing-loan']?.checked) {
    const details = specialData['housing-loan'].details || {};
    if (!details.contractDate) {
      errors.push('주택저당차입금의 대출 계약일을 입력해주세요.');
    }
    if (!details.repaymentPeriod) {
      errors.push('주택저당차입금의 상환기간을 선택해주세요.');
    }
    if (!details.interestType) {
      errors.push('주택저당차입금의 금리유형을 선택해주세요.');
    }
    if (!details.repaymentType) {
      errors.push('주택저당차입금의 상환방식을 선택해주세요.');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 특별소득공제 종류별 설명 반환
 * @param {string} deductionType - 공제 종류
 * @returns {object} - 공제 정보
 */
export function getSpecialDeductionInfo(deductionType) {
  const deductionInfoMap = {
    'insurance': {
      name: '사회보험료',
      description: '건강보험, 고용보험, 노인장기요양보험료',
      rate: '3.545%',
      maxAmount: null,
      note: '급여에서 자동공제되는 금액의 100% 공제'
    },
    'housing-rent': {
      name: '주택임차차입금',
      description: '전세자금 대출 원리금 상환액',
      rate: '40%',
      maxAmount: 400, // 400만원
      note: '무주택 세대주 대상, 원리금 상환액의 40% 공제'
    },
    'housing-loan': {
      name: '장기주택저당차입금',
      description: '주택구입 대출 이자상환액',
      rate: '대출조건별',
      maxAmount: 2000, // 최대 2000만원
      note: '대출계약일, 상환기간, 금리유형, 상환방식에 따라 한도 차등'
    }
  };
  
  return deductionInfoMap[deductionType] || null;
}


/**
 * 개선된 그밖의 소득공제 계산 유틸리티
 * - 주택청약종합저축 무주택 세대주 조건 추가
 * - 신용카드 공제 계산 로직 정확성 향상
 * - 상세한 오류 검증 및 메시지 제공
 * - 디버깅을 위한 계산 과정 추적
 */

/**
 * 그밖의 소득공제 계산 함수 (개선된 버전)
 * @param {object} otherData - 그밖의 소득공제 데이터
 * @param {number} salary - 총급여 (만원 단위)
 * @returns {object} - { totalDeduction: 총그밖의소득공제(만원), details: 상세내역, errors: 오류목록 }
 */
export function calculateOtherDeduction(otherData, salary = 0) {
  let totalDeduction = 0;
  let details = [];
  let errors = [];
  
  // 주택청약종합저축 계산
  if (otherData['housing-savings']?.checked) {
    const inputAmount = otherData['housing-savings'].inputAmount || 0;
    const isHouseholdHead = otherData['housing-savings'].isHouseholdHead || false;
    
    const housingSavingsResult = calculateHousingSavingsDeduction(inputAmount, isHouseholdHead);
    
    totalDeduction += housingSavingsResult.amount;
    details.push({
      type: '주택청약종합저축',
      description: '무주택 세대주 청약저축 납입액',
      inputAmount: inputAmount,
      amount: housingSavingsResult.amount,
      rate: '40%',
      maxLimit: 300,
      isValid: housingSavingsResult.isValid,
      message: housingSavingsResult.message
    });
    
    if (!housingSavingsResult.isValid) {
      errors.push(housingSavingsResult.message);
    }
  }
  
  // 신용카드 등 소득공제 계산
  if (otherData['credit-card']?.checked) {
    const cardDetails = otherData['credit-card'].details || {};
    const creditCardResult = calculateCreditCardDeduction(cardDetails, salary);
    
    totalDeduction += creditCardResult.amount;
    details.push({
      type: '신용카드 등 소득공제',
      description: '신용카드, 체크카드, 현금영수증 등 사용금액',
      amount: creditCardResult.amount,
      rate: '차등공제',
      cardDetails: cardDetails,
      calculationDetails: creditCardResult.details,
      isValid: creditCardResult.isValid,
      message: creditCardResult.message
    });
    
    if (!creditCardResult.isValid) {
      errors.push(creditCardResult.message);
    }
  }
  
  return {
    totalDeduction: Math.round(totalDeduction),
    details,
    errors,
    isValid: errors.length === 0
  };
}

/**
 * 주택청약종합저축 공제액 계산 (개선된 버전)
 * @param {number} inputAmount - 납입액 (만원 단위)
 * @param {boolean} isHouseholdHead - 무주택 세대주 여부
 * @returns {object} - { amount: 공제액, isValid: 유효성, message: 메시지 }
 */
export function calculateHousingSavingsDeduction(inputAmount, isHouseholdHead = false) {
  // 기본 검증
  if (inputAmount <= 0) {
    return {
      amount: 0,
      isValid: false,
      message: '납입액을 입력해주세요.'
    };
  }
  
  if (!isHouseholdHead) {
    return {
      amount: 0,
      isValid: false,
      message: '무주택 세대주만 공제 가능합니다.'
    };
  }
  
  if (inputAmount > 1000) {
    return {
      amount: 0,
      isValid: false,
      message: '납입액이 너무 큽니다. 금액을 확인해주세요.'
    };
  }
  
  // 공제 계산
  const maxInputLimit = 300; // 300만원 한도
  const deductionRate = 0.4; // 40% 공제율

  const eligibleAmount = inputAmount * deductionRate;  
  const deduction = Math.min(eligibleAmount, maxInputLimit);

  
  return {
    amount: Math.round(deduction),
    isValid: true,
    message: `납입액 ${inputAmount.toLocaleString()}만원 → 공제액 ${Math.round(deduction).toLocaleString()}만원 (40% 공제율 적용)`
  };
}

/**
 * 신용카드 등 소득공제 계산 (개선된 버전)
 * @param {object} details - 신용카드 사용 상세내역 (만원 단위)
 * @param {number} salary - 총급여 (만원 단위)
 * @returns {object} - { amount: 공제액, isValid: 유효성, message: 메시지, details: 계산상세 }
 */
export function calculateCreditCardDeduction(details, salary = 0) {
  // 기본 검증
  if (salary <= 0) {
    return {
      amount: 0,
      isValid: false,
      message: '총급여를 먼저 입력해주세요.',
      details: null
    };
  }
  
  const {
    credit = 0,      // 신용카드
    check = 0,       // 체크카드/현금영수증
    traditional = 0, // 전통시장
    transport = 0,   // 대중교통
    culture = 0,     // 도서/공연/박물관/미술관
    lastYear = 0     // 2023년 카드 사용금액
  } = details;
  
  // 사용금액 합계 계산
  const totalCardAmount = credit + check + culture;
  const totalWithSpecial = totalCardAmount + traditional + transport;
  
  if (totalWithSpecial <= 0) {
    return {
      amount: 0,
      isValid: false,
      message: '카드 사용금액을 입력해주세요.',
      details: null
    };
  }
  
  // 총급여 기준 확인 (7천만원)
  const isUnder70Million = salary <= 7000;
  
  // 최저사용금액 (총급여의 25%)
  const minimumAmount = salary * 0.25;
  
  // 최저사용금액 미달 검사
  if (totalWithSpecial <= minimumAmount) {
    return {
      amount: 0,
      isValid: false,
      message: `최저사용금액 ${minimumAmount.toLocaleString()}만원 미달 (현재: ${totalWithSpecial.toLocaleString()}만원)`,
      details: {
        minimumRequired: minimumAmount,
        totalUsed: totalWithSpecial,
        shortfall: minimumAmount - totalWithSpecial
      }
    };
  }
  
  // 각 항목별 공제액 계산
  const creditCardDeduction = credit * 0.15;        // 신용카드 15%
  const checkCardDeduction = check * 0.3;           // 체크카드/현금영수증 30%
  const traditionalDeduction = traditional * 0.4;   // 전통시장 40%
  const transportDeduction = transport * 0.4;       // 대중교통 40%
  const cultureDeduction = isUnder70Million ? culture * 0.3 : 0; // 도서/공연 30% (7천만원 이하자만)
  
  // 최저사용금액에 따른 기본공제액 차감 계산
  let minimumDeduction = 0;
  
  if (minimumAmount <= credit) {
    // 최저사용금액이 신용카드 사용액 이하인 경우
    minimumDeduction = minimumAmount * 0.15;
  } else if (credit < minimumAmount && minimumAmount <= totalCardAmount) {
    // 최저사용금액이 신용카드+체크카드+문화비 사용액 이하인 경우
    minimumDeduction = credit * 0.15 + (minimumAmount - credit) * 0.3;
  } else if (totalCardAmount < minimumAmount && minimumAmount <= totalWithSpecial) {
    // 최저사용금액이 전체 사용액 이하인 경우
    minimumDeduction = credit * 0.15 + 
                      (check + culture) * 0.3 + 
                      (minimumAmount - totalCardAmount) * 0.4;
  }
  
  // 전년 대비 증가분 계산 (5% 초과 증가분의 10%)
  let additionalDeduction1 = 0;
  const thisYearTotal = totalWithSpecial;
  const lastYearThreshold = lastYear * 1.05; // 전년 대비 5% 증가 기준
  
  if (thisYearTotal > lastYearThreshold && lastYear > 0) {
    const increaseAmount = thisYearTotal - lastYearThreshold;
    const lastYearFivePercent = lastYear * 0.05;
    
    if (increaseAmount > lastYearFivePercent) {
      additionalDeduction1 = Math.min(increaseAmount * 0.1, 100); // 10% 공제, 최대 100만원
    }
  }
  
  // 기본 공제액 계산
  const baseDeduction = creditCardDeduction + checkCardDeduction + cultureDeduction + 
                       traditionalDeduction + transportDeduction - minimumDeduction + additionalDeduction1;
  
  // 공제한도 적용
  const deductionLimit = isUnder70Million ? 300 : 250; // 만원 단위 (300만원 또는 250만원)
  const specialDeductionLimit = isUnder70Million ? 300 : 200; // 만원 단위 (300만원 또는 200만원)
  
  let totalDeduction = Math.min(baseDeduction, deductionLimit);
  
  // 공제한도 초과 시 특별공제 적용
  let specialDeduction = 0;
  let additionalDeduction2 = 0;
  
  if (baseDeduction > deductionLimit) {
    const excessAmount = baseDeduction - deductionLimit;
    
    // 특별공제 대상 (전통시장, 대중교통, 도서/공연) 공제액 합계
    const specialTargetsDeduction = traditionalDeduction + transportDeduction + cultureDeduction;
    
    // 9번: 공제한도 초과금액과 특별공제대상 합계액 중 작은 금액 (특별공제한도 적용)
    specialDeduction = Math.min(excessAmount, specialTargetsDeduction, specialDeductionLimit);
    
    // 10번: 공제한도 초과금액에서 특별공제대상 합계액을 차감한 금액과 전년대비 증가분 중 작은 금액
    const remainingExcess = Math.max(0, excessAmount - specialTargetsDeduction);
    additionalDeduction2 = Math.min(remainingExcess, additionalDeduction1, 100);
    
    totalDeduction = deductionLimit + specialDeduction + additionalDeduction2;
  }
  
  const finalAmount = Math.round(Math.max(0, totalDeduction));
  
  // 계산 상세 정보
  const calculationDetails = {
    salary: salary,
    minimumRequired: minimumAmount,
    isUnder70Million: isUnder70Million,
    
    // 각 항목별 사용액 및 공제액
    cardAmounts: {
      credit: { used: credit, deduction: creditCardDeduction },
      check: { used: check, deduction: checkCardDeduction },
      traditional: { used: traditional, deduction: traditionalDeduction },
      transport: { used: transport, deduction: transportDeduction },
      culture: { used: culture, deduction: cultureDeduction }
    },
    
    // 사용금액 합계
    totalCardAmount: totalCardAmount,
    totalWithSpecial: totalWithSpecial,
    
    // 공제 계산 과정
    minimumDeduction: minimumDeduction,
    baseDeduction: baseDeduction,
    additionalDeduction1: additionalDeduction1,
    specialDeduction: specialDeduction,
    additionalDeduction2: additionalDeduction2,
    
    // 특별공제 관련 상세 정보
    specialTargetsDeduction: traditionalDeduction + transportDeduction + cultureDeduction,
    excessAmount: Math.max(0, baseDeduction - deductionLimit),
    remainingExcess: Math.max(0, Math.max(0, baseDeduction - deductionLimit) - (traditionalDeduction + transportDeduction + cultureDeduction)),
    
    // 한도 및 최종 공제액
    deductionLimit: deductionLimit,
    specialDeductionLimit: specialDeductionLimit,
    finalAmount: finalAmount,
    
    // 전년 대비 증가분 정보
    lastYearInfo: {
      lastYear: lastYear,
      thisYear: thisYearTotal,
      threshold: lastYearThreshold,
      increase: Math.max(0, thisYearTotal - lastYearThreshold),
      additionalDeduction: additionalDeduction1 // 이 값이 중요합니다!
    }
  };
  
  return {
    amount: finalAmount,
    isValid: true,
    message: `총 사용액 ${totalWithSpecial.toLocaleString()}만원 → 공제액 ${finalAmount.toLocaleString()}만원`,
    details: calculationDetails
  };
}

/**
 * 신용카드 등 공제 계산 상세내역 반환 (개선된 버전)
 * @param {object} details - 신용카드 사용 상세내역
 * @param {number} salary - 총급여 (만원 단위)
 * @returns {object} - 상세 계산 내역
 */
export function getCreditCardCalculationDetails(details, salary = 0) {
  const result = calculateCreditCardDeduction(details, salary);
  return result.details;
}

/**
 * 그밖의 소득공제 유효성 검사 (개선된 버전)
 * @param {object} otherData - 그밖의 소득공제 데이터
 * @param {number} salary - 총급여 (만원 단위)
 * @returns {object} - { isValid: boolean, errors: array, warnings: array }
 */
export function validateOtherDeduction(otherData, salary = 0) {
  const errors = [];
  const warnings = [];
  
  // 주택청약종합저축 검증
  if (otherData['housing-savings']?.checked) {
    const inputAmount = otherData['housing-savings'].inputAmount || 0;
    const isHouseholdHead = otherData['housing-savings'].isHouseholdHead || false;
    
    if (!isHouseholdHead) {
      errors.push('주택청약종합저축: 무주택 세대주만 공제 가능합니다.');
    }
    
    if (inputAmount <= 0) {
      errors.push('주택청약종합저축: 납입액을 입력해주세요.');
    } else if (inputAmount > 1000) {
      errors.push('주택청약종합저축: 납입액이 너무 큽니다. 금액을 확인해주세요.');
    } else if (inputAmount > 300) {
      warnings.push('주택청약종합저축: 300만원 초과 납입액은 공제 대상이 아닙니다.');
    }
  }
  
  // 신용카드 등 검증
  if (otherData['credit-card']?.checked) {
    const details = otherData['credit-card'].details || {};
    const totalCardAmount = Object.values(details).reduce((sum, val) => sum + (val || 0), 0) - (details.lastYear || 0);
    
    if (totalCardAmount <= 0) {
      errors.push('신용카드 등: 최소 한 항목의 사용금액을 입력해주세요.');
    }
    
    if (salary > 0) {
      const minimumRequired = salary * 0.25;
      if (totalCardAmount <= minimumRequired) {
        warnings.push(`신용카드 등: 최저사용금액 ${minimumRequired.toLocaleString()}만원 미달로 공제 불가능합니다.`);
      }
    }
    
    // 각 항목별 금액 검증
    Object.entries(details).forEach(([key, value]) => {
      if (value < 0) {
        errors.push(`신용카드 등: ${getCardTypeName(key)} 사용금액은 0원 이상이어야 합니다.`);
      }
      if (value > 50000) {
        warnings.push(`신용카드 등: ${getCardTypeName(key)} 사용금액이 매우 큽니다. 금액을 확인해주세요.`);
      }
    });
    
    // 7천만원 초과자 문화비 사용 경고
    if (salary > 7000 && details.culture > 0) {
      warnings.push('신용카드 등: 총급여 7천만원 초과자는 도서/공연비 공제 불가능합니다.');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 카드 유형명 반환
 * @param {string} key - 카드 유형 키
 * @returns {string} - 카드 유형명
 */
function getCardTypeName(key) {
  const nameMap = {
    credit: '신용카드',
    check: '체크카드/현금영수증',
    traditional: '전통시장',
    transport: '대중교통',
    culture: '도서/공연/박물관/미술관',
    lastYear: '2023년 카드 사용액'
  };
  return nameMap[key] || key;
}

/**
 * 그밖의 소득공제 종류별 설명 반환 (개선된 버전)
 * @param {string} deductionType - 공제 종류
 * @returns {object} - 공제 정보
 */
export function getOtherDeductionInfo(deductionType) {
  const deductionInfoMap = {
    'housing-savings': {
      name: '주택청약종합저축',
      description: '무주택 세대주의 청약저축 납입액',
      rate: '40%',
      maxAmount: 300, // 300만원
      note: '연 300만원 한도 내에서 40% 공제 (무주택 세대주만)',
      conditions: ['무주택 세대주', '청약저축 납입 실적']
    },
    'credit-card': {
      name: '신용카드 등 소득공제',
      description: '신용카드, 체크카드, 현금영수증 등 사용금액',
      rate: '차등공제',
      maxAmount: 300, // 최대 300만원 (7천만원 이하자)
      note: '총급여의 25%를 초과하는 금액에 대해 차등 공제율 적용',
      conditions: ['총급여의 25% 초과 사용', '각 카드별 차등 공제율 적용']
    }
  };
  
  return deductionInfoMap[deductionType] || null;
}

/**
 * 신용카드 등 공제 요약 정보 반환 (개선된 버전)
 * @param {object} details - 신용카드 사용 상세내역
 * @param {number} salary - 총급여 (만원 단위)
 * @returns {string} - 요약 정보 텍스트
 */
export function getCreditCardDeductionSummary(details, salary) {
  const result = calculateCreditCardDeduction(details, salary);
  
  if (!result.isValid) {
    return result.message;
  }
  
  const calculationDetails = result.details;
  if (!calculationDetails) return '';
  
  const totalUsed = calculationDetails.totalWithSpecial;
  const finalAmount = result.amount;
  
  return `총 사용액 ${totalUsed.toLocaleString()}만원 → 최종공제액 ${finalAmount.toLocaleString()}만원`;
}

/**
 * 숫자 포맷팅 함수
 * @param {number} number - 숫자
 * @returns {string} - 포맷된 문자열
 */
/* export function formatNumber(number) {
  if (typeof number !== 'number') return '0';
  return number.toLocaleString();
} */



/**
 * 과세표준 및 산출세액 계산
 * @param {object} taxData - 세금 계산을 위한 모든 데이터
 * @returns {object} - 계산 결과
 */
export function calculateTaxBaseAndAmount(taxData) {
  const {
    salary,
    laborIncomeDeduction,
    personalDeduction,
    pensionDeduction,
    specialDeduction,
    otherDeduction
  } = taxData;

  // 근로소득금액 계산
  const laborIncome = salary - laborIncomeDeduction;

  // 소득공제 종합한도초과액 계산 (특별소득공제 + 그 밖의 소득공제가 2,500만원 초과시)
  const totalDeduction = (specialDeduction || 0) + (otherDeduction || 0);
  const deductionExcess = Math.max(0, totalDeduction - 25000000);

  // 과세표준 계산
  const taxBase = Math.max(0, laborIncome - personalDeduction - pensionDeduction - specialDeduction - otherDeduction + deductionExcess);

  // 산출세액 계산 (2024년 기준 소득세율)
  let calculatedTax = 0;
  let taxFormula = '';

  if (taxBase <= 14000000) {
    calculatedTax = taxBase * 0.06;
    taxFormula = `과세표준 ${formatNumber(taxBase)} × 6% = ${formatNumber(calculatedTax)}`;
  } else if (taxBase <= 50000000) {
    calculatedTax = 840000 + (taxBase - 14000000) * 0.15;
    taxFormula = `84만원 + (${formatNumber(taxBase - 14000000)} × 15%) = ${formatNumber(calculatedTax)}`;
  } else if (taxBase <= 88000000) {
    calculatedTax = 6240000 + (taxBase - 50000000) * 0.24;
    taxFormula = `624만원 + (${formatNumber(taxBase - 50000000)} × 24%) = ${formatNumber(calculatedTax)}`;
  } else if (taxBase <= 150000000) {
    calculatedTax = 15360000 + (taxBase - 88000000) * 0.35;
    taxFormula = `1,536만원 + (${formatNumber(taxBase - 88000000)} × 35%) = ${formatNumber(calculatedTax)}`;
  } else if (taxBase <= 300000000) {
    calculatedTax = 37060000 + (taxBase - 150000000) * 0.38;
    taxFormula = `3,706만원 + (${formatNumber(taxBase - 150000000)} × 38%) = ${formatNumber(calculatedTax)}`;
  } else if (taxBase <= 500000000) {
    calculatedTax = 94060000 + (taxBase - 300000000) * 0.40;
    taxFormula = `9,406만원 + (${formatNumber(taxBase - 300000000)} × 40%) = ${formatNumber(calculatedTax)}`;
  } else if (taxBase <= 1000000000) {
    calculatedTax = 174060000 + (taxBase - 500000000) * 0.42;
    taxFormula = `17,406만원 + (${formatNumber(taxBase - 500000000)} × 42%) = ${formatNumber(calculatedTax)}`;
  } else {
    calculatedTax = 384060000 + (taxBase - 1000000000) * 0.45;
    taxFormula = `38,406만원 + (${formatNumber(taxBase - 1000000000)} × 45%) = ${formatNumber(calculatedTax)}`;
  }

  return {
    laborIncome,
    taxBase,
    calculatedTax,
    taxFormula,
    deductionExcess,
    deductionBreakdown: {
      personalDeduction,
      pensionDeduction,
      specialDeduction,
      otherDeduction
    }
  };
}

/**
 * 근로소득세액공제 계산
 * @param {number} taxAmount - 산출세액
 * @returns {object} - { deduction: 공제액, formula: 계산식 }
 */
export function calculateLaborIncomeTaxDeduction(taxAmount) {
  let deduction = 0;
  let formula = '';
  
  if (taxAmount <= 1300000) {
    deduction = taxAmount * 0.55;
    formula = `${formatNumber(taxAmount)} × 55% = ${formatNumber(deduction)}`;
  } else {
    deduction = 1300000 * 0.55 + (taxAmount - 1300000) * 0.3;
    formula = `130만원 × 55% + (${formatNumber(taxAmount - 1300000)} × 30%) = ${formatNumber(deduction)}`;
  }
  
  return {
    deduction,
    formula
  };
}

/**
 * 자녀세액공제 계산
 * @param {number} childCount - 자녀 수
 * @returns {object} - { deduction: 공제액, details: 상세내역 }
 */
export function calculateChildDeduction(childCount) {
  const deductionPerChild = 150000; // 자녀 1인당 15만원
  let deduction = childCount * deductionPerChild;
  const maxDeduction = 300000; // 최대 30만원
  
  if (deduction > maxDeduction) {
    deduction = maxDeduction;
  }
  
  return {
    deduction,
    childCount,
    deductionPerChild,
    maxDeduction,
    isMaxed: deduction === maxDeduction
  };
}

/**
 * 연금계좌세액공제 계산
 * @param {number} pensionAmount - 연금계좌 납입액
 * @returns {object} - { deduction: 공제액, details: 상세내역 }
 */
export function calculatePensionAccountDeduction(pensionAmount) {
  const deductionRate = 0.15; // 15%
  const maxDeduction = 300000; // 최대 30만원
  let deduction = 0;
  
  if (pensionAmount > 0) {
    deduction = Math.min(pensionAmount * deductionRate, maxDeduction);
  }
  
  return {
    deduction,
    pensionAmount,
    deductionRate,
    maxDeduction,
    isMaxed: deduction === maxDeduction
  };
}

/**
 * 월세액 세액공제 계산
 * @param {number} monthlyRent - 월세액
 * @param {number} rentMonths - 임차기간 (개월)
 * @returns {object} - { deduction: 공제액, details: 상세내역 }
 */
export function calculateRentDeduction(monthlyRent, rentMonths) {
  const deductionRate = 0.1; // 10%
  const maxDeduction = 750000; // 최대 75만원
  let deduction = 0;
  
  if (monthlyRent > 0 && rentMonths > 0) {
    const annualRent = monthlyRent * rentMonths;
    deduction = Math.min(annualRent * deductionRate, maxDeduction);
  }
  
  return {
    deduction,
    monthlyRent,
    rentMonths,
    annualRent: monthlyRent * rentMonths,
    deductionRate,
    maxDeduction,
    isMaxed: deduction === maxDeduction
  };
}

/**
 * ISA 세액공제 계산
 * @param {number} isaAmount - ISA 납입액
 * @returns {object} - { deduction: 공제액, details: 상세내역 }
 */
export function calculateISADeduction(isaAmount) {
  const deductionRate = 0.15; // 15%
  const maxDeduction = 300000; // 최대 30만원
  let deduction = 0;
  
  if (isaAmount > 0) {
    deduction = Math.min(isaAmount * deductionRate, maxDeduction);
  }
  
  return {
    deduction,
    isaAmount,
    deductionRate,
    maxDeduction,
    isMaxed: deduction === maxDeduction
  };
}

/**
 * 특별세액공제 계산
 * @param {object} expenses - { medicalExpenses, educationExpenses, donationAmount }
 * @returns {object} - { totalDeduction: 총공제액, details: 상세내역 }
 */
export function calculateSpecialTaxDeduction(expenses) {
  const { medicalExpenses = 0, educationExpenses = 0, donationAmount = 0 } = expenses;
  const deductionRate = 0.15; // 15%
  const maxDeductionPerItem = 300000; // 항목별 최대 30만원
  
  let totalDeduction = 0;
  let details = [];
  
  // 의료비 공제
  if (medicalExpenses > 0) {
    const deduction = Math.min(medicalExpenses * deductionRate, maxDeductionPerItem);
    totalDeduction += deduction;
    details.push({
      type: '의료비',
      expense: medicalExpenses,
      deduction,
      isMaxed: deduction === maxDeductionPerItem
    });
  }
  
  // 교육비 공제
  if (educationExpenses > 0) {
    const deduction = Math.min(educationExpenses * deductionRate, maxDeductionPerItem);
    totalDeduction += deduction;
    details.push({
      type: '교육비',
      expense: educationExpenses,
      deduction,
      isMaxed: deduction === maxDeductionPerItem
    });
  }
  
  // 기부금 공제
  if (donationAmount > 0) {
    const deduction = Math.min(donationAmount * deductionRate, maxDeductionPerItem);
    totalDeduction += deduction;
    details.push({
      type: '기부금',
      expense: donationAmount,
      deduction,
      isMaxed: deduction === maxDeductionPerItem
    });
  }
  
  return {
    totalDeduction,
    details,
    deductionRate,
    maxDeductionPerItem
  };
}

/**
 * 중소기업 취업자 소득세 감면 계산
 * @param {object} employmentInfo - { employeeType, employmentDate, calculatedTax }
 * @returns {object} - { deduction: 감면액, details: 상세내역 }
 */
export function calculateSmallBusinessDeduction(employmentInfo) {
  const { employeeType, employmentDate, calculatedTax } = employmentInfo;
  
  const currentDate = new Date();
  const empDate = new Date(employmentDate);
  const yearsDiff = (currentDate - empDate) / (1000 * 60 * 60 * 24 * 365);
  
  let deductionRate = 0;
  const maxDeduction = 2000000; // 최대 200만원
  
  if (employeeType === 'youth') {
    // 청년 (만 15~34세)
    if (yearsDiff <= 5) {
      deductionRate = 0.9; // 90% 감면
    }
  } else {
    // 기타
    if (yearsDiff <= 3) {
      deductionRate = 0.7; // 70% 감면
    }
  }
  
  const deduction = deductionRate > 0 ? Math.min(calculatedTax * deductionRate, maxDeduction) : 0;
  
  return {
    deduction,
    employeeType,
    yearsDiff: Math.round(yearsDiff * 10) / 10,
    deductionRate,
    maxDeduction,
    isMaxed: deduction === maxDeduction
  };
}

/**
 * 최종 세액 계산 (결정세액 및 차감징수세액)
 * @param {object} finalTaxData - 최종 계산을 위한 모든 데이터
 * @returns {object} - 최종 계산 결과
 */
export function calculateFinalTax(finalTaxData) {
  const {
    calculatedTax = 0,
    taxReduction = 0,
    taxDeductions = {},
    currentPaidTax = 0,
    previousTax = 0
  } = finalTaxData;
  
  // 세액공제 합계 계산
  const totalTaxDeduction = Object.values(taxDeductions).reduce((sum, deduction) => sum + (deduction || 0), 0);
  
  // 결정세액 계산 (산출세액 - 세액감면 - 세액공제)
  const finalTax = Math.max(0, calculatedTax - taxReduction - totalTaxDeduction);
  
  // 기납부세액 합계
  const totalPaidTax = currentPaidTax + previousTax;
  
  // 차감징수세액 계산 (결정세액 - 기납부세액)
  const taxDifference = finalTax - totalPaidTax;
  
  return {
    calculatedTax,      // 산출세액
    taxReduction,       // 세액감면
    totalTaxDeduction,  // 총 세액공제
    finalTax,          // 결정세액
    totalPaidTax,      // 총 기납부세액
    taxDifference,     // 차감징수세액 (양수: 추가납부, 음수: 환급)
    taxDeductions      // 세액공제 상세내역
  };
}

/**
 * 전체 연말정산 계산을 수행하는 메인 함수
 * @param {object} allData - 모든 입력 데이터
 * @returns {object} - 전체 계산 결과
 */
export function calculateYearEndTax(allData) {
  const {
    salary,
    personalDeductionAnswers,
    pensionInsuranceAnswers,
    specialDeductionData,
    otherDeductionData,
    taxDeductionData,
    finalTaxData
  } = allData;
  
  // 1. 근로소득공제 계산
  const laborIncomeResult = calculateLaborIncomeDeduction(salary);
  
  // 2. 인적공제 계산
  const personalDeductionResult = calculatePersonalDeduction(personalDeductionAnswers);
  
  // 3. 연금보험료공제 계산
  const pensionInsuranceResult = calculatePensionInsurance(pensionInsuranceAnswers, salary);
  
  // 4. 과세표준 및 산출세액 계산
  const taxBaseResult = calculateTaxBaseAndAmount({
    salary,
    laborIncomeDeduction: laborIncomeResult.amount,
    personalDeduction: personalDeductionResult.totalDeduction,
    pensionDeduction: pensionInsuranceResult.totalPension,
    specialDeduction: specialDeductionData?.totalDeduction || 0,
    otherDeduction: otherDeductionData?.totalDeduction || 0
  });
  
  // 5. 세액공제 계산
  const laborIncomeTaxDeduction = calculateLaborIncomeTaxDeduction(taxBaseResult.calculatedTax);
  
  // 6. 최종 세액 계산
  const finalResult = calculateFinalTax({
    calculatedTax: taxBaseResult.calculatedTax,
    taxReduction: 0, // 세액감면 (필요시 추가)
    taxDeductions: {
      laborIncome: laborIncomeTaxDeduction.deduction,
      ...taxDeductionData
    },
    currentPaidTax: finalTaxData?.currentPaidTax || 0,
    previousTax: finalTaxData?.previousTax || 0
  });
  
  return {
    laborIncome: laborIncomeResult,
    personalDeduction: personalDeductionResult,
    pensionInsurance: pensionInsuranceResult,
    taxBase: taxBaseResult,
    laborIncomeTaxDeduction,
    finalTax: finalResult
  };
}

/**
 * 전체 세금 계산 함수
 * @param {object} formData - 폼 데이터
 * @returns {object} - 전체 계산 결과
 */
export function calculateTax(formData) {
  const {
    salary = 0,
    personalDeduction = {},
    pensionInsurance = 0,
    specialDeduction = 0,
    otherDeduction = 0
  } = formData;

  // salary를 만원 단위에서 원 단위로 변환
  const salaryInWon = convertToWon(salary);

  // 1. 근로소득공제 계산
  const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);

  // 2. 인적공제 계산
  const personalDeductionResult = calculatePersonalDeduction(personalDeduction);

  // 3. 과세표준 및 산출세액 계산
  const taxBaseResult = calculateTaxBaseAndAmount({
    salary: salaryInWon,
    laborIncomeDeduction: laborIncomeResult.amount,
    personalDeduction: personalDeductionResult.totalDeduction,
    pensionDeduction: pensionInsurance,
    specialDeduction: specialDeduction,
    otherDeduction: otherDeduction
  });

  // 4. 근로소득세액공제 계산
  const laborTaxDeduction = calculateLaborIncomeTaxDeduction(taxBaseResult.calculatedTax);

  // 5. 최종 세액 계산
  const finalResult = calculateFinalTax({
    calculatedTax: taxBaseResult.calculatedTax,
    taxReduction: 0,
    taxDeductions: { laborIncome: laborTaxDeduction.deduction },
    currentPaidTax: 0,
    previousTax: 0
  });

  return {
    // 입력 데이터
    salary: salaryInWon,
    personalDeduction: personalDeductionResult.totalDeduction,
    pensionInsurance,
    specialDeduction,
    otherDeduction,
    
    // 계산 결과
    laborIncomeDeduction: laborIncomeResult.amount,
    taxBase: taxBaseResult.taxBase,
    calculatedTax: taxBaseResult.calculatedTax,
    laborTaxDeduction: laborTaxDeduction.deduction,
    finalTax: finalResult.finalTax,
    
    // 상세 내역
    personalDeductionDetails: personalDeductionResult,
    laborIncomeDetails: laborIncomeResult,
    taxBaseDetails: taxBaseResult,
    finalDetails: finalResult
  };
} 