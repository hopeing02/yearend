import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateTaxBaseAndAmount,
  calculateLaborIncomeDeduction,
  calculatePersonalDeduction,
  calculatePensionInsurance,
  calculateSpecialDeduction,
  calculateOtherDeduction,
  applyHousingDeductionLimits, // 새로 추가된 함수
  formatNumber 
} from '../utils/calc';

/**
 * 과세표준 및 산출세액 계산 컴포넌트 - 2단계 한도 체계 반영
 * useEffect 무한렌더링 방지를 위한 최적화 적용
 */
const TaxBaseCalculation = () => {
  const { formData } = useTax();
  const [calculationResult, setCalculationResult] = useState(null);
  const [calculationStatus, setCalculationStatus] = useState({
    isValid: false,
    message: '',
    details: null
  });

  // 주택 관련 2단계 한도 체계 적용 (useMemo로 최적화)
  const housingLimits = useMemo(() => {
    return applyHousingDeductionLimits(
      formData.specialDeduction || {}, 
      formData.otherDeduction || {}
    );
  }, [formData.specialDeduction, formData.otherDeduction]);

  // 계산 함수 (useCallback으로 최적화)
  const calculateTaxBase = useCallback(() => {
    const { salary } = formData;

    if (!salary || salary <= 0) {
      setCalculationStatus({
        isValid: false,
        message: '총급여를 먼저 입력해주세요.',
        details: null
      });
      setCalculationResult(null);
      return;
    }

    try {
      // 원 단위로 변환
      const salaryInWon = salary * 10000;

      // 1. 근로소득공제 계산 (기존 로직 유지)
      const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);
      const laborIncome = salaryInWon - laborIncomeResult.amount;

      // 2. 인적공제 계산 (기존 로직 유지)
      const personalDeductionResult = calculatePersonalDeduction(formData.personalDeduction || {});

      // 3. 연금보험료공제 계산 (기존 로직 유지)
      const pensionResult = calculatePensionInsurance(formData.pensionInsurance || {}, salaryInWon);

      // 4. 특별소득공제 계산 (2단계 한도 적용된 금액 사용)
      let specialDeductionTotal = 0;
      let specialDeductionDetails = [];
      
      // 사회보험료 (한도 제한 없음)
      if (formData.specialDeduction?.insurance?.checked) {
        const insuranceAmount = formData.specialDeduction.insurance.amount || 0;
        specialDeductionTotal += insuranceAmount;
        specialDeductionDetails.push({
          name: '사회보험료',
          amount: insuranceAmount,
          limitApplied: false
        });
      }

      // 주택임차차입금 (2단계 한도 적용)
      if (formData.specialDeduction?.['housing-rent']?.checked) {
        const originalAmount = formData.specialDeduction['housing-rent'].amount || 0;
        const adjustedAmount = housingLimits.finalAmounts.housingRent;
        
        specialDeductionTotal += adjustedAmount;
        specialDeductionDetails.push({
          name: '주택임차차입금',
          amount: adjustedAmount,
          originalAmount: originalAmount,
          limitApplied: originalAmount !== adjustedAmount
        });
      }

      // 장기주택저당차입금 (2단계 한도 적용)
      if (formData.specialDeduction?.['housing-loan']?.checked) {
        const originalAmount = formData.specialDeduction['housing-loan'].amount || 0;
        const adjustedAmount = housingLimits.finalAmounts.housingLoan;
        
        specialDeductionTotal += adjustedAmount;
        specialDeductionDetails.push({
          name: '장기주택저당차입금',
          amount: adjustedAmount,
          originalAmount: originalAmount,
          limitApplied: originalAmount !== adjustedAmount
        });
      }

      // 5. 그밖의 소득공제 계산 (2단계 한도 적용된 금액 사용)
      let otherDeductionTotal = 0;
      let otherDeductionDetails = [];

      // 주택청약종합저축 (2단계 한도 적용)
      if (formData.otherDeduction?.['housing-savings']?.checked) {
        const originalAmount = formData.otherDeduction['housing-savings'].amount || 0;
        const adjustedAmount = housingLimits.finalAmounts.housingSavings;
        
        otherDeductionTotal += adjustedAmount;
        otherDeductionDetails.push({
          name: '주택청약종합저축',
          amount: adjustedAmount,
          originalAmount: originalAmount,
          limitApplied: originalAmount !== adjustedAmount
        });
      }

      // 신용카드 등 (기존 로직 유지)
      if (formData.otherDeduction?.['credit-card']?.checked) {
        const cardAmount = formData.otherDeduction['credit-card'].amount || 0;
        otherDeductionTotal += cardAmount;
        otherDeductionDetails.push({
          name: '신용카드 등',
          amount: cardAmount,
          limitApplied: false
        });
      }

      // 6. 과세표준 및 산출세액 계산
      const taxBaseResult = calculateTaxBaseAndAmount({
        salary: salaryInWon,
        laborIncomeDeduction: laborIncomeResult.amount,
        personalDeduction: personalDeductionResult.totalDeduction || 0,
        pensionDeduction: pensionResult.totalPension || 0,
        specialDeduction: specialDeductionTotal * 10000, // 만원 → 원 변환
        otherDeduction: otherDeductionTotal * 10000 // 만원 → 원 변환
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
        specialDeduction: specialDeductionTotal * 10000,
        otherDeduction: otherDeductionTotal * 10000,

        // 과세표준 및 산출세액
        taxBase: taxBaseResult.taxBase,
        calculatedTax: taxBaseResult.calculatedTax,
        taxFormula: taxBaseResult.taxFormula,
        taxRate: taxBaseResult.taxRate,

        // 상세 정보
        deductionDetails: {
          personal: personalDeductionResult,
          pension: pensionResult,
          special: { 
            totalDeduction: specialDeductionTotal, 
            details: specialDeductionDetails 
          },
          other: { 
            totalDeduction: otherDeductionTotal, 
            details: otherDeductionDetails 
          }
        },

        // 주택 관련 종합한도 정보
        housingLimits: housingLimits
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
      setCalculationResult(null);
    }
  }, [formData, housingLimits]);

  // 계산 실행 (useEffect로 디바운싱 적용하여 무한렌더링 방지)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateTaxBase();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [calculateTaxBase]);

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
                  {calculationStatus.isValid ? '✅ ' : '❌ '}
                  {calculationStatus.message}
                </strong>
              </p>
            </div>
          )}
        </div>

        {calculationResult && (
          <>
            {/* 주택 관련 종합한도 적용 결과 */}
            {(calculationResult.housingLimits.firstStage.isExceeded || calculationResult.housingLimits.secondStage.isExceeded) && (
              <div className="form-section">
                <div className="section-title" style={{ fontSize: '1.1rem', color: ' #e74c3c' }}>
                  🏠 주택 관련 종합한도 적용 결과
                </div>
                <div className="housing-limits-summary">
                  <div className="limit-stage">
                    <h4>1단계: 주택청약종합저축 + 주택임차차입금</h4>
                    <div className="limit-details">
                      <p><strong>한도:</strong> 400만원</p>
                      <p><strong>신청액:</strong> {calculationResult.housingLimits.firstStage.originalTotal.toLocaleString()}만원</p>
                      <p><strong>최종 공제액:</strong> {calculationResult.housingLimits.firstStage.total.toLocaleString()}만원</p>
                      {calculationResult.housingLimits.firstStage.isExceeded && (
                        <p style={{ color: ' #e74c3c' }}>
                          ⚠️ 한도 초과로 비례 배분 적용
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="limit-stage">
                    <h4>2단계: 1단계 결과 + 장기주택저당차입금</h4>
                    <div className="limit-details">
                      <p><strong>한도:</strong> {calculationResult.housingLimits.secondStage.limit.toLocaleString()}만원 (개별한도)</p>
                      <p><strong>신청액:</strong> {calculationResult.housingLimits.secondStage.originalAmount.toLocaleString()}만원</p>
                      <p><strong>최종 공제액:</strong> {calculationResult.housingLimits.secondStage.housingLoan.toLocaleString()}만원</p>
                      {calculationResult.housingLimits.secondStage.isExceeded && (
                        <p style={{ color: ' #e74c3c' }}>
                          ⚠️ 한도 초과로 장기주택저당차입금 우선 조정
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1단계: 근로소득금액 계산 */}
            <div className="form-section">
              <div className="section-title" style={{ fontSize: '1.1rem', color: ' #3498db' }}>
                1️⃣ 근로소득금액 계산
              </div>
              <div className="calculation-details">
                <div className="calculation-breakdown">
                  <div className="calculation-steps">
                    <p><strong>총급여:</strong> {Math.round(calculationResult.salary / 10000).toLocaleString()}만원</p>
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

            {/* 2단계: 소득공제 계산 */}
            <div className="form-section">
              <div className="section-title" style={{ fontSize: '1.1rem', color: ' #27ae60' }}>
                2️⃣ 소득공제 계산
              </div>
              <div className="calculation-details">
                <div className="calculation-breakdown">
                  <div className="calculation-steps">
                    <p><strong>인적공제:</strong> {Math.round(calculationResult.personalDeduction / 10000).toLocaleString()}만원</p>
                    
                    {/* 인적공제 상세 */}
                    {calculationResult.deductionDetails.personal?.details && (
                      <div className="sub-details">
                        {calculationResult.deductionDetails.personal.details.map((detail, index) => (
                          <p key={index}>• { detail.name}: {detail.amount.toLocaleString()}만원 ({detail.count}명)</p>
                        ))}
                      </div>
                    )}
                    
                    <p><strong>연금보험료공제:</strong> {Math.round(calculationResult.pensionDeduction / 10000).toLocaleString()}만원</p>
                    
                    {/* 연금보험료 상세 */}
                    {calculationResult.deductionDetails.pension?.details && (
                      <div className="sub-details">
                        {calculationResult.deductionDetails.pension.details.map((detail, index) => (
                          <p key={index}>• { detail.name}: {detail.amount.toLocaleString()}만원</p>
                        ))}
                      </div>
                    )}
                    
                    <p><strong>특별소득공제:</strong> {Math.round(calculationResult.specialDeduction / 10000).toLocaleString()}만원</p>
                    
                    {/* 특별소득공제 상세 */}
                    {calculationResult.deductionDetails.special?.details && (
                      <div className="sub-details">
                        {calculationResult.deductionDetails.special.details.map((detail, index) => (
                          <p key={index}>
                            • { detail.name}: {detail.amount.toLocaleString()}만원
                            {detail.limitApplied && (
                              <span style={{ color: ' #e74c3c' }}> (조정됨: 원래 {detail.originalAmount.toLocaleString()}만원)</span>
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    <p><strong>그밖의 소득공제:</strong> {Math.round(calculationResult.otherDeduction / 10000).toLocaleString()}만원</p>
                    
                    {/* 그밖의 소득공제 상세 */}
                    {calculationResult.deductionDetails.other?.details && (
                      <div className="sub-details">
                        {calculationResult.deductionDetails.other.details.map((detail, index) => (
                          <p key={index}>
                            • { detail.name}: {detail.amount.toLocaleString()}만원
                            {detail.limitApplied && (
                              <span style={{ color: ' #e74c3c' }}> (조정됨: 원래 {detail.originalAmount.toLocaleString()}만원)</span>
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                    
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
              <div className="section-title" style={{ fontSize: '1.1rem', color: ' #f39c12' }}>
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
              <div className="section-title" style={{ fontSize: '1.1rem', color: ' #e74c3c' }}>
                4️⃣ 산출세액 계산
              </div>
              <div className="calculation-details">
                <div className="calculation-breakdown">
                  <div className="calculation-steps">
                    <p><strong>과세표준:</strong> {Math.round(calculationResult.taxBase / 10000).toLocaleString()}만원</p>
                    <p><strong>적용 세율:</strong> {calculationResult.taxRate}</p>
                    <div className="calculation-formula">
                      <p><strong>계산식:</strong> {calculationResult.taxFormula}</p>
                      <div className="final-result">
                        <p><strong>산출세액: {Math.round(calculationResult.calculatedTax / 10000).toLocaleString()}만원</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 최종 요약 */}
            <div className="total-summary" style={{ backgroundColor: ' #f8f9fa', border: '2px solid #3498db' }}>
              <div className="summary-content">
                <h3>최종 계산 결과</h3>
                <div className="result-grid">
                  <div className="result-item">
                    <span className="label">총급여</span>
                    <span className="value">{Math.round(calculationResult.salary / 10000).toLocaleString()}만원</span>
                  </div>
                  <div className="result-item">
                    <span className="label">근로소득금액</span>
                    <span className="value">{Math.round(calculationResult.laborIncome / 10000).toLocaleString()}만원</span>
                  </div>
                  <div className="result-item">
                    <span className="label">총 소득공제</span>
                    <span className="value">{Math.round((calculationResult.personalDeduction + calculationResult.pensionDeduction + calculationResult.specialDeduction + calculationResult.otherDeduction) / 10000).toLocaleString()}만원</span>
                  </div>
                  <div className="result-item">
                    <span className="label">과세표준</span>
                    <span className="value">{Math.round(calculationResult.taxBase / 10000).toLocaleString()}만원</span>
                  </div>
                  <div className="result-item highlight">
                    <span className="label">산출세액</span>
                    <span className="value">{Math.round(calculationResult.calculatedTax / 10000).toLocaleString()}만원</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 안내사항 */}
        <div className="info-section">
          <h4>📌 중요 안내사항</h4>
          <ul>
            <li><strong>주택 관련 종합한도:</strong> 2단계 체계로 주택청약종합저축, 주택임차차입금, 장기주택저당차입금에 순차적 한도 적용</li>
            <li><strong>1단계 한도:</strong> 주택청약종합저축 + 주택임차차입금 ≤ 400만원 (초과시 비례 배분)</li>
            <li><strong>2단계 한도:</strong> (1단계 결과) + 장기주택저당차입금 ≤ 개별한도 (초과시 장기주택저당차입금 우선 조정)</li>
            <li><strong>소득세율:</strong> 2024년 기준 6%~45% 누진세율 적용</li>
            <li><strong>계산 결과:</strong> 실제 신고시 추가 세액공제나 감면이 적용될 수 있어 최종 결정세액과 차이가 있을 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TaxBaseCalculation;
