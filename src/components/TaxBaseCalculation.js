import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateTaxBaseAndAmount,
  calculateLaborIncomeDeduction,
  calculatePersonalDeduction,
  calculatePensionInsurance,
  calculateOtherDeduction,
  formatNumber 
} from '../utils/calc';

// calculateSpecialDeduction 함수가 없을 경우를 대비한 임시 함수
const calculateSpecialDeductionSafe = (specialData) => {
  if (!specialData || typeof specialData !== 'object') {
    return { totalDeduction: 0 };
  }
  
  let totalDeduction = 0;
  
  // 사회보험료
  if (specialData.insurance?.checked && specialData.insurance?.amount) {
    totalDeduction += specialData.insurance.amount;
  }
  
  // 주택임차차입금
  if (specialData['housing-rent']?.checked && specialData['housing-rent']?.amount) {
    totalDeduction += specialData['housing-rent'].amount;
  }
  
  // 장기주택저당차입금
  if (specialData['housing-loan']?.checked && specialData['housing-loan']?.amount) {
    totalDeduction += specialData['housing-loan'].amount;
  }
  
  return { totalDeduction: Math.round(totalDeduction) };
};

/**
 * 과세표준 및 산출세액 계산 컴포넌트
 * OtherDeductionInput과 동일한 UI 스타일 적용
 */
const TaxBaseCalculation = () => {
  const { formData } = useTax();
  
  // 간단한 상태 관리
  const [isCalculated, setIsCalculated] = useState(false);
  const [calculationMessage, setCalculationMessage] = useState('');
  const [amounts, setAmounts] = useState({
    personalDeduction: 0,
    pensionDeduction: 0,
    specialDeduction: 0,
    otherDeduction: 0,
    laborIncome: 0,
    taxBase: 0,
    calculatedTax: 0,
    taxRate: 0,
    taxFormula: ''
  });

  // 계산 및 검증
  useEffect(() => {
    calculateTaxBase();
  }, [formData]);

  const calculateTaxBase = () => {
    try {
      const { salary } = formData;

      if (!salary || salary <= 0) {
        setCalculationMessage('총급여를 먼저 입력해주세요.');
        setIsCalculated(false);
        return;
      }

      console.log('🧮 과세표준 계산 시작:', { salary, formData });

      // 원 단위로 변환
      const salaryInWon = salary * 10000;

      // 1. 근로소득공제 계산
      let laborIncomeResult = { amount: 0 };
      try {
        laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon) || { amount: 0 };
      } catch (error) {
        console.error('근로소득공제 계산 오류:', error);
      }
      const laborIncome = salaryInWon - (laborIncomeResult.amount || 0);

      // 2. 인적공제 계산
      let personalDeductionAmount = 0;
      try {
        const personalResult = calculatePersonalDeduction(formData.personalDeduction || {});
        personalDeductionAmount = personalResult?.totalDeduction || 0;
        console.log('🧑‍👨‍👩‍👧 인적공제 결과:', personalResult);
      } catch (error) {
        console.error('인적공제 계산 오류:', error);
      }

      // 3. 연금보험료공제 계산
      let pensionDeductionAmount = 0;
      try {
        if (formData.pensionInsurance && Object.keys(formData.pensionInsurance).length > 0) {
          const pensionResult = calculatePensionInsurance(formData.pensionInsurance, salaryInWon);
          // pensionResult.totalPension이 만원 단위라면 원 단위로 변환
          pensionDeductionAmount = (pensionResult?.totalPension || 0) * 10000;
          console.log('💳 연금보험료공제 결과:', pensionResult, '→', pensionDeductionAmount);
        }
      } catch (error) {
        console.error('연금보험료공제 계산 오류:', error);
      }

      // 4. 특별소득공제 계산
      let specialDeductionAmount = 0;
      try {
        if (formData.specialDeduction && Object.keys(formData.specialDeduction).length > 0) {
          const hasChecked = Object.values(formData.specialDeduction).some(item => item?.checked);
          if (hasChecked) {
            const specialResult = calculateSpecialDeductionSafe(formData.specialDeduction);
            // specialResult.totalDeduction이 만원 단위라면 원 단위로 변환
            specialDeductionAmount = (specialResult?.totalDeduction || 0) * 10000;
            console.log('🏥 특별소득공제 결과:', specialResult, '→', specialDeductionAmount);
          }
        }
      } catch (error) {
        console.error('특별소득공제 계산 오류:', error);
      }

      // 5. 그밖의 소득공제 계산
      let otherDeductionAmount = 0;
      try {
        if (formData.otherDeduction && Object.keys(formData.otherDeduction).length > 0) {
          const hasChecked = Object.values(formData.otherDeduction).some(item => item?.checked);
          if (hasChecked) {
            const otherResult = calculateOtherDeduction(formData.otherDeduction, salary);
            // otherResult.totalDeduction이 만원 단위라면 원 단위로 변환
            otherDeductionAmount = (otherResult?.totalDeduction || 0) * 10000;
            console.log('📝 그밖의 소득공제 결과:', otherResult, '→', otherDeductionAmount);
          }
        }
      } catch (error) {
        console.error('그밖의 소득공제 계산 오류:', error);
      }

      // 6. 과세표준 및 산출세액 계산
      let taxBase = 0;
      let calculatedTax = 0;
      let taxFormula = '';
      let taxRate = 0;
      
      try {
        const taxBaseResult = calculateTaxBaseAndAmount({
          salary: salaryInWon,
          laborIncomeDeduction: laborIncomeResult.amount || 0,
          personalDeduction: personalDeductionAmount,
          pensionDeduction: pensionDeductionAmount,
          specialDeduction: specialDeductionAmount,
          otherDeduction: otherDeductionAmount
        });

        taxBase = taxBaseResult?.taxBase || 0;
        calculatedTax = taxBaseResult?.calculatedTax || 0;
        taxFormula = taxBaseResult?.taxFormula || '';
        taxRate = taxBaseResult?.taxRate || 0;

        console.log('🧮 과세표준 및 산출세액 결과:', taxBaseResult);
      } catch (error) {
        console.error('과세표준 및 산출세액 계산 오류:', error);
      }

      // 상태 업데이트
      setAmounts({
        personalDeduction: personalDeductionAmount,
        pensionDeduction: pensionDeductionAmount,
        specialDeduction: specialDeductionAmount,
        otherDeduction: otherDeductionAmount,
        laborIncome: laborIncome,
        taxBase: taxBase,
        calculatedTax: calculatedTax,
        taxRate: taxRate,
        taxFormula: taxFormula
      });

      setCalculationMessage(`과세표준 ${Math.round(taxBase / 10000).toLocaleString()}만원 → 산출세액 ${Math.round(calculatedTax / 10000).toLocaleString()}만원`);
      setIsCalculated(true);

    } catch (error) {
      console.error('전체 계산 오류:', error);
      setCalculationMessage('계산 중 오류가 발생했습니다.');
      setIsCalculated(false);
    }
  };

  return (
    <div className="deduction-section">
      <div className="container">
        <h2 className="section-title">과세표준 및 산출세액</h2>
        
        {/* 계산 요약 */}
        <div className="form-section">
          <div className="section-title" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
            📊 계산 요약
          </div>
          
          {calculationMessage && (
            <div className={`result-message ${isCalculated ? 'success' : 'error'}`}>
              <p>
                <strong>
                  {isCalculated ? '✅' : '❌'} 
                  {calculationMessage}
                </strong>
              </p>
            </div>
          )}
        </div>

        {/* 상세 계산 과정 */}
        {isCalculated && formData.salary > 0 && (
          <>
            {/* 1단계: 근로소득금액 계산 */}
            <div className="form-section">
              <div className="section-title" style={{ fontSize: '1.1rem', color: '#2980b9' }}>
                1️⃣ 근로소득금액 계산
              </div>
              <div className="calculation-details">
                <div className="calculation-breakdown">
                  <div className="calculation-steps">
                    <p><strong>총급여:</strong> {formData.salary.toLocaleString()}만원</p>
                    <p><strong>근로소득공제:</strong> {Math.round((formData.salary * 10000 - amounts.laborIncome) / 10000).toLocaleString()}만원</p>
                    <div className="calculation-formula">
                      <p><strong>근로소득금액 = 총급여 - 근로소득공제</strong></p>
                      <div className="final-result">
                        <p><strong>{Math.round(amounts.laborIncome / 10000).toLocaleString()}만원</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2단계: 소득공제 요약 */}
            <div className="form-section">
              <div className="section-title" style={{ fontSize: '1.1rem', color: '#27ae60' }}>
                2️⃣ 소득공제 요약
              </div>
              <div className="calculation-details">
                <div className="calculation-breakdown">
                  <div className="calculation-steps">
                    <p><strong>인적공제:</strong> {Math.round(amounts.personalDeduction / 10000).toLocaleString()}만원</p>
                    <p><strong>연금보험료공제:</strong> {Math.round(amounts.pensionDeduction / 10000).toLocaleString()}만원</p>
                    <p><strong>특별소득공제:</strong> {Math.round(amounts.specialDeduction / 10000).toLocaleString()}만원</p>
                    <p><strong>그밖의 소득공제:</strong> {Math.round(amounts.otherDeduction / 10000).toLocaleString()}만원</p>
                    <div className="calculation-formula">
                      <p><strong>총 소득공제:</strong></p>
                      <div className="final-result">
                        <p><strong>{Math.round((amounts.personalDeduction + amounts.pensionDeduction + amounts.specialDeduction + amounts.otherDeduction) / 10000).toLocaleString()}만원</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3단계: 과세표준 계산 */}
            <div className="form-section">
              <div className="section-title" style={{ fontSize: '1.1rem', color: '#f39c12' }}>
                3️⃣ 과세표준 계산
              </div>
              <div className="calculation-details">
                <div className="calculation-breakdown">
                  <div className="calculation-steps">
                    <p><strong>근로소득금액:</strong> {Math.round(amounts.laborIncome / 10000).toLocaleString()}만원</p>
                    <p><strong>총 소득공제:</strong> {Math.round((amounts.personalDeduction + amounts.pensionDeduction + amounts.specialDeduction + amounts.otherDeduction) / 10000).toLocaleString()}만원</p>
                    <div className="calculation-formula">
                      <p><strong>과세표준 = 근로소득금액 - 총 소득공제</strong></p>
                      <div className="final-result">
                        <p><strong>{Math.round(amounts.taxBase / 10000).toLocaleString()}만원</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4단계: 산출세액 계산 */}
            <div className="form-section">
              <div className="section-title" style={{ fontSize: '1.1rem', color: '#e74c3c' }}>
                4️⃣ 산출세액 계산
              </div>
              <div className="calculation-details">
                <div className="calculation-breakdown">
                  <div className="calculation-steps">
                    <p><strong>과세표준:</strong> {Math.round(amounts.taxBase / 10000).toLocaleString()}만원</p>
                    
                    {/* 세율 구간 표시 */}
                    <div className="info-box">
                      <p><strong>📈 적용 세율:</strong> {amounts.taxRate}%</p>
                      <small>2024년 소득세율표 적용</small>
                    </div>
                    
                    {/* 계산 공식 */}
                    {amounts.taxFormula && (
                      <div className="calculation-formula">
                        <p><strong>계산 공식:</strong></p>
                        <p>{amounts.taxFormula}</p>
                        <div className="final-result">
                          <p><strong>산출세액: {Math.round(amounts.calculatedTax / 10000).toLocaleString()}만원</strong></p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 세율 구간 안내 */}
            <div className="info-section">
              <h4>📊 2024년 소득세율표</h4>
              <div className="tax-rate-table">
                <div className="tax-rate-row">
                  <span>1,400만원 이하</span>
                  <span>6%</span>
                </div>
                <div className="tax-rate-row">
                  <span>1,400만원 초과 ~ 5,000만원 이하</span>
                  <span>15%</span>
                </div>
                <div className="tax-rate-row">
                  <span>5,000만원 초과 ~ 8,800만원 이하</span>
                  <span>24%</span>
                </div>
                <div className="tax-rate-row">
                  <span>8,800만원 초과 ~ 1억 5,000만원 이하</span>
                  <span>35%</span>
                </div>
                <div className="tax-rate-row">
                  <span>1억 5,000만원 초과 ~ 3억원 이하</span>
                  <span>38%</span>
                </div>
                <div className="tax-rate-row">
                  <span>3억원 초과 ~ 5억원 이하</span>
                  <span>40%</span>
                </div>
                <div className="tax-rate-row">
                  <span>5억원 초과 ~ 10억원 이하</span>
                  <span>42%</span>
                </div>
                <div className="tax-rate-row">
                  <span>10억원 초과</span>
                  <span>45%</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 총 결과 요약 */}
        {isCalculated && (
          <div className="total-summary">
            <div className="summary-content">
              <h3>최종 계산 결과</h3>
              <div className="amount-display" style={{ flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', color: '#666' }}>과세표준:</span>
                  <span className="amount" style={{ fontSize: '1.8rem' }}>{Math.round(amounts.taxBase / 10000).toLocaleString()}</span>
                  <span className="unit">만원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', color: '#666' }}>산출세액:</span>
                  <span className="amount" style={{ color: '#e74c3c' }}>{Math.round(amounts.calculatedTax / 10000).toLocaleString()}</span>
                  <span className="unit">만원</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 실시간 데이터 확인 */}
        <div className="info-section" style={{ background: 'rgba(52, 152, 219, 0.1)', border: '2px solid #3498db' }}>
          <h4>🔍 실시간 데이터 확인</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ background: 'white', padding: '10px', borderRadius: '5px' }}>
              <strong>인적공제 데이터:</strong>
              <pre style={{ fontSize: '0.7rem', margin: '5px 0' }}>
                {JSON.stringify(formData?.personalDeduction || {}, null, 1)}
              </pre>
            </div>
            <div style={{ background: 'white', padding: '10px', borderRadius: '5px' }}>
              <strong>연금보험료 데이터:</strong>
              <pre style={{ fontSize: '0.7rem', margin: '5px 0' }}>
                {JSON.stringify(formData?.pensionInsurance || {}, null, 1)}
              </pre>
            </div>
            <div style={{ background: 'white', padding: '10px', borderRadius: '5px' }}>
              <strong>특별소득공제 데이터:</strong>
              <pre style={{ fontSize: '0.7rem', margin: '5px 0' }}>
                {JSON.stringify(formData?.specialDeduction || {}, null, 1)}
              </pre>
            </div>
            <div style={{ background: 'white', padding: '10px', borderRadius: '5px' }}>
              <strong>그밖의 소득공제 데이터:</strong>
              <pre style={{ fontSize: '0.7rem', margin: '5px 0' }}>
                {JSON.stringify(formData?.otherDeduction || {}, null, 1)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxBaseCalculation;