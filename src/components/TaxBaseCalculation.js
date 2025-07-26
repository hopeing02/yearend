import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateTaxBaseAndAmount,
  calculateLaborIncomeDeduction,
  calculatePersonalDeduction,
  calculatePensionInsurance,
  calculateSpecialDeduction,
  calculateOtherDeduction,
  formatNumber 
} from '../utils/calc';

/**
 * 과세표준 및 산출세액 계산 컴포넌트
 * OtherDeductionInput과 동일한 UI 스타일 적용
 */
const TaxBaseCalculation = () => {
  const { formData } = useTax();
  const [calculationResult, setCalculationResult] = useState(null);
  const [calculationStatus, setCalculationStatus] = useState({
    isValid: false,
    message: '',
    details: null
  });

  // 계산 및 검증
  useEffect(() => {
    calculateTaxBase();
  }, [formData]);

  const calculateTaxBase = () => {
    const { salary } = formData;

    if (!salary || salary <= 0) {
      setCalculationStatus({
        isValid: false,
        message: '총급여를 먼저 입력해주세요.',
        details: null
      });
      return;
    }

    try {
      // 원 단위로 변환
      const salaryInWon = salary * 10000;

      // 1. 근로소득공제 계산
      const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);
      const laborIncome = salaryInWon - laborIncomeResult.amount;

      // 2. 인적공제 계산
      const personalDeductionResult = calculatePersonalDeduction(formData.personalDeduction || {});

      // 3. 연금보험료공제 계산
      const pensionResult = calculatePensionInsurance(formData.pensionInsurance || {}, salaryInWon);

      // 4. 특별소득공제 계산
      const specialResult = calculateSpecialDeduction(formData.specialDeduction || {});

      // 5. 그밖의 소득공제 계산
      const otherResult = calculateOtherDeduction(formData.otherDeduction || {}, salary);

      // 6. 과세표준 및 산출세액 계산
      const taxBaseResult = calculateTaxBaseAndAmount({
        salary: salaryInWon,
        laborIncomeDeduction: laborIncomeResult.amount,
        personalDeduction: personalDeductionResult.totalDeduction || 0,
        pensionDeduction: pensionResult.totalPension || 0,
        specialDeduction: specialResult.totalDeduction || 0,
        otherDeduction: (otherResult.totalDeduction || 0) * 10000 // 만원 단위를 원 단위로 변환
      });

      const result = {
        // 기본 정보
        salary: salaryInWon,
        salaryInManWon: salary,

        // 각 단계별 계산 결과
        laborIncomeDeduction: laborIncomeResult.amount,
        laborIncome: laborIncome,
        
        personalDeduction: personalDeductionResult.totalDeduction || 0,
        pensionDeduction: pensionResult.totalPension || 0,
        specialDeduction: specialResult.totalDeduction || 0,
        otherDeduction: (otherResult.totalDeduction || 0) * 10000,

        // 과세표준 및 산출세액
        taxBase: taxBaseResult.taxBase,
        calculatedTax: taxBaseResult.calculatedTax,
        taxFormula: taxBaseResult.taxFormula,
        taxRate: taxBaseResult.taxRate,

        // 상세 정보
        deductionDetails: {
          personal: personalDeductionResult,
          pension: pensionResult,
          special: specialResult,
          other: otherResult
        }
      };

      setCalculationResult(result);
      setCalculationStatus({
        isValid: true,
        message: `과세표준 ${Math.round(taxBaseResult.taxBase / 10000).toLocaleString()}만원 → 산출세액 ${Math.round(taxBaseResult.calculatedTax / 10000).toLocaleString()}만원`,
        details: result
      });

    } catch (error) {
      console.error('Tax calculation error:', error);
      setCalculationStatus({
        isValid: false,
        message: '계산 중 오류가 발생했습니다.',
        details: null
      });
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
          
          {calculationStatus.message && (
            <div className={`result-message ${calculationStatus.isValid ? 'success' : 'error'}`}>
              <p>
                <strong>
                  {calculationStatus.isValid ? '✅' : '❌'} 
                  {calculationStatus.message}
                </strong>
              </p>
            </div>
          )}
        </div>

        {/* 상세 계산 과정 */}
        {calculationResult && (
          <>
            {/* 1단계: 근로소득금액 계산 */}
            <div className="form-section">
              <div className="section-title" style={{ fontSize: '1.1rem', color: '#2980b9' }}>
                1️⃣ 근로소득금액 계산
              </div>
              <div className="calculation-details">
                <div className="calculation-breakdown">
                  <div className="calculation-steps">
                    <p><strong>총급여:</strong> {calculationResult.salaryInManWon.toLocaleString()}만원</p>
                    <p><strong>근로소득공제:</strong> {Math.round(calculationResult.laborIncomeDeduction / 10000).toLocaleString()}만원</p>
                    <div className="calculation-formula">
                      <p><strong>근로소득금액 = 총급여 - 근로소득공제</strong></p>
                      <div className="final-result">
                        <p><strong>{Math.round(calculationResult.laborIncome / 10000).toLocaleString()}만원</strong></p>
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
                    <p><strong>인적공제:</strong> {Math.round(calculationResult.personalDeduction / 10000).toLocaleString()}만원</p>
                    <p><strong>연금보험료공제:</strong> {Math.round(calculationResult.pensionDeduction / 10000).toLocaleString()}만원</p>
                    <p><strong>특별소득공제:</strong> {Math.round(calculationResult.specialDeduction / 10000).toLocaleString()}만원</p>
                    <p><strong>그밖의 소득공제:</strong> {Math.round(calculationResult.otherDeduction / 10000).toLocaleString()}만원</p>
                    <div className="calculation-formula">
                      <p><strong>총 소득공제:</strong></p>
                      <div className="final-result">
                        <p><strong>{Math.round((calculationResult.personalDeduction + calculationResult.pensionDeduction + calculationResult.specialDeduction + calculationResult.otherDeduction) / 10000).toLocaleString()}만원</strong></p>
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
                    <p><strong>근로소득금액:</strong> {Math.round(calculationResult.laborIncome / 10000).toLocaleString()}만원</p>
                    <p><strong>총 소득공제:</strong> {Math.round((calculationResult.personalDeduction + calculationResult.pensionDeduction + calculationResult.specialDeduction + calculationResult.otherDeduction) / 10000).toLocaleString()}만원</p>
                    <div className="calculation-formula">
                      <p><strong>과세표준 = 근로소득금액 - 총 소득공제</strong></p>
                      <div className="final-result">
                        <p><strong>{Math.round(calculationResult.taxBase / 10000).toLocaleString()}만원</strong></p>
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
                    <p><strong>과세표준:</strong> {Math.round(calculationResult.taxBase / 10000).toLocaleString()}만원</p>
                    
                    {/* 세율 구간 표시 */}
                    <div className="info-box">
                      <p><strong>📈 적용 세율:</strong> {calculationResult.taxRate}%</p>
                      <small>2024년 소득세율표 적용</small>
                    </div>
                    
                    {/* 계산 공식 */}
                    {calculationResult.taxFormula && (
                      <div className="calculation-formula">
                        <p><strong>계산 공식:</strong></p>
                        <p>{calculationResult.taxFormula}</p>
                        <div className="final-result">
                          <p><strong>산출세액: {Math.round(calculationResult.calculatedTax / 10000).toLocaleString()}만원</strong></p>
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
        {calculationResult && (
          <div className="total-summary">
            <div className="summary-content">
              <h3>최종 계산 결과</h3>
              <div className="amount-display" style={{ flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', color: '#666' }}>과세표준:</span>
                  <span className="amount" style={{ fontSize: '1.8rem' }}>{Math.round(calculationResult.taxBase / 10000).toLocaleString()}</span>
                  <span className="unit">만원</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem', color: '#666' }}>산출세액:</span>
                  <span className="amount" style={{ color: '#e74c3c' }}>{Math.round(calculationResult.calculatedTax / 10000).toLocaleString()}</span>
                  <span className="unit">만원</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxBaseCalculation;