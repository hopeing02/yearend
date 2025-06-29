/**
 * 연말정산 계산 유틸리티 함수들
 * 기존 js/tax-calculator.js에서 계산 로직을 추출하여 순수 함수로 변환
 */

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
 * 연금보험료공제 계산
 * @param {object} answers - 연금보험료 응답 데이터
 * @param {number} salary - 총급여 (자동계산용)
 * @returns {object} - { totalPension: 총공제액, details: 상세내역 }
 */
export function calculatePensionInsurance(answers, salary = 0) {
  let totalPension = 0;
  let details = [];
  
  // 국민연금 (급여의 4.5%)
  if (answers['national-pension']?.checked) {
    const monthlySalary = salary / 12;
    const pensionRate = 0.045; // 4.5%
    const monthlyPension = Math.round(monthlySalary * pensionRate);
    const annualPension = monthlyPension * 12;
    
    totalPension += annualPension;
    details.push({
      type: '국민연금',
      rate: '4.5%',
      monthlyAmount: monthlyPension,
      annualAmount: annualPension
    });
  }
  
  // 공무원연금 등 (급여의 9%)
  if (answers['public-pension']?.checked) {
    const monthlySalary = salary / 12;
    const pensionRate = 0.09; // 9%
    const monthlyPension = Math.round(monthlySalary * pensionRate);
    const annualPension = monthlyPension * 12;
    
    totalPension += annualPension;
    details.push({
      type: '공무원연금',
      rate: '9%',
      monthlyAmount: monthlyPension,
      annualAmount: annualPension
    });
  }
  
  return {
    totalPension,
    details
  };
}

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