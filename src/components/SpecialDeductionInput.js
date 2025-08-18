import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateSpecialDeduction, 
  calculateInsuranceAmount, 
  calculateHousingRentDeduction, 
  calculateHousingLoanDeduction,
  calculateHousingLoanMaxDeduction,
  applyHousingDeductionLimits, // 새로 추가된 함수
  formatNumber 
} from '../utils/calc';

/**
 * 특별소득공제 입력 컴포넌트 - 주택 관련 2단계 종합한도 적용
 * useEffect 무한렌더링 방지를 위한 최적화 적용
 */
const SpecialDeductionInput = () => {
  const { formData, setSpecialDeduction } = useTax();
  const specialDeduction = formData.specialDeduction || {};
  const otherDeduction = formData.otherDeduction || {}; // 주택청약종합저축 포함
  const salary = formData.salary; // 만원 단위

  // 로컬 상태로 입력값 관리
  const [localData, setLocalData] = useState({
    insurance: { checked: false, amount: 0 },
    'housing-rent': { checked: false, amount: 0, inputAmount: 0 },
    'housing-loan': { 
      checked: false, 
      amount: 0, 
      inputAmount: 0,
      details: {
        contractDate: '',
        repaymentPeriod: '',
        interestType: '',
        repaymentType: ''
      }
    }
  });

  // 계산 결과 상태
  const [calculationResult, setCalculationResult] = useState({
    totalDeduction: 0,
    details: [],
    housingLimitDetails: null,
    errors: []
  });

  // Context 데이터가 변경되면 로컬 상태 동기화 (useCallback으로 최적화)
  const syncLocalData = useCallback(() => {
    if (specialDeduction && Object.keys(specialDeduction).length > 0) {
      setLocalData(prev => ({
        ...prev,
        ...specialDeduction
      }));
    }
  }, [specialDeduction]);

  useEffect(() => {
    syncLocalData();
  }, [syncLocalData]);

  // 주택 관련 2단계 한도 체계를 적용한 계산 (useMemo로 최적화)
  const housingLimits = useMemo(() => {
    return applyHousingDeductionLimits(localData, otherDeduction);
  }, [localData, otherDeduction]);

  // 특별소득공제 계산 (useCallback으로 최적화)
  const calculateDeductions = useCallback(() => {
    try {
      let totalDeduction = 0;
      let details = [];
      let errors = [];
      
      // 1. 사회보험료 계산 (기존 로직 유지)
      if (localData?.insurance?.checked) {
        const insuranceAmount = localData.insurance.amount || 0;
        totalDeduction += insuranceAmount;
        details.push({
          type: 'insurance',
          name: '사회보험료',
          amount: insuranceAmount,
          rate: '100%',
          maxLimit: null,
          description: '건강보험, 고용보험, 노인장기요양보험료'
        });
      }
      
      // 2. 주택임차차입금 (2단계 한도 적용)
      if (localData?.['housing-rent']?.checked) {
        const originalAmount = localData['housing-rent'].amount || 0;
        const adjustedAmount = housingLimits.finalAmounts.housingRent;
        
        totalDeduction += adjustedAmount;
        details.push({
          type: 'housing-rent',
          name: '주택임차차입금',
          amount: adjustedAmount,
          originalAmount: originalAmount,
          rate: '40%',
          maxLimit: '2단계 한도 적용',
          description: '전세자금 대출 원리금 상환액',
          limitApplied: originalAmount !== adjustedAmount,
          limitDetails: housingLimits.firstStage
        });
      }
      
      // 3. 장기주택저당차입금 (2단계 한도 적용)
      if (localData?.['housing-loan']?.checked) {
        const originalAmount = localData['housing-loan'].amount || 0;
        const adjustedAmount = housingLimits.finalAmounts.housingLoan;
        
        totalDeduction += adjustedAmount;
        details.push({
          type: 'housing-loan',
          name: '장기주택저당차입금',
          amount: adjustedAmount,
          originalAmount: originalAmount,
          rate: '대출조건별',
          maxLimit: housingLimits.secondStage.limit,
          description: '주택구입 대출 이자상환액',
          limitApplied: originalAmount !== adjustedAmount,
          limitDetails: housingLimits.secondStage
        });
      }
      
      const result = {
        totalDeduction: Math.round(totalDeduction),
        details,
        errors,
        housingLimitDetails: housingLimits,
        isValid: errors.length === 0
      };

      setCalculationResult(result);
      
      // Context에 결과 저장 (디바운싱 적용)
      const timeoutId = setTimeout(() => {
        setSpecialDeduction({
          ...localData,
          calculationResult: result
        });
      }, 300);

      return () => clearTimeout(timeoutId);
      
    } catch (error) {
      console.error('특별소득공제 계산 오류:', error);
      setCalculationResult({
        totalDeduction: 0,
        details: [],
        errors: ['계산 중 오류가 발생했습니다.'],
        housingLimitDetails: null,
        isValid: false
      });
    }
  }, [localData, housingLimits, setSpecialDeduction]);

  // 계산 실행 (useEffect로 디바운싱 적용하여 무한렌더링 방지)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateDeductions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [calculateDeductions]);

  // 체크박스 변경 핸들러 (useCallback으로 최적화)
  const handleCheckboxChange = useCallback((deductionType, checked) => {
    setLocalData(prev => {
      const updated = {
        ...prev,
        [deductionType]: {
          ...prev[deductionType],
          checked,
          amount: checked ? prev[deductionType]?.amount || 0 : 0
        }
      };

      // 사회보험료 자동계산 (기존 로직 유지)
      if (deductionType === 'insurance' && checked && salary > 0) {
        const autoAmount = calculateInsuranceAmount(salary);
        updated.insurance.amount = autoAmount;
      }

      return updated;
    });
  }, [salary]);

  // 금액 입력 핸들러 (useCallback으로 최적화)
  const handleAmountChange = useCallback((deductionType, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    
    setLocalData(prev => ({
      ...prev,
      [deductionType]: {
        ...prev[deductionType],
        inputAmount: numValue,
        amount: deductionType === 'housing-rent' 
          ? calculateHousingRentDeduction(numValue)
          : deductionType === 'housing-loan'
          ? calculateHousingLoanDeduction(numValue, prev[deductionType].details)
          : numValue
      }
    }));
  }, []);

  // 대출 상세정보 변경 핸들러 (useCallback으로 최적화)
  const handleLoanDetailsChange = useCallback((field, value) => {
    setLocalData(prev => {
      const updatedDetails = {
        ...prev['housing-loan'].details,
        [field]: value
      };
      
      const maxDeduction = calculateHousingLoanMaxDeduction(updatedDetails);
      const inputAmount = prev['housing-loan'].inputAmount || 0;
      
      return {
        ...prev,
        'housing-loan': {
          ...prev['housing-loan'],
          details: updatedDetails,
          amount: Math.min(inputAmount, maxDeduction)
        }
      };
    });
  }, []);

  // 사회보험료 자동계산 (useCallback으로 최적화)
  const handleAutoCalculateInsurance = useCallback(() => {
    if (!salary || salary <= 0) {
      alert('총급여를 먼저 입력해주세요.');
      return;
    }
    
    const autoAmount = calculateInsuranceAmount(salary);
    setLocalData(prev => ({
      ...prev,
      insurance: {
        ...prev.insurance,
        checked: true,
        amount: autoAmount
      }
    }));
  }, [salary]);

  return (
    <div className="deduction-section">
      <div className="container">
        <h2 className="section-title">특별소득공제</h2>
        
        {/* 주택 관련 종합한도 안내 (2단계 한도 적용시에만 표시) */}
        {calculationResult?.housingLimitDetails && 
         (calculationResult.housingLimitDetails.firstStage.isExceeded || 
          calculationResult.housingLimitDetails.secondStage.isExceeded) && (
          <div className="info-section" style={{ backgroundColor: ' #fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <h4>🏠 주택 관련 2단계 종합한도 체계 적용</h4>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
              <p><strong>1단계:</strong> 주택청약종합저축 + 주택임차차입금 ≤ 400만원</p>
              <p><strong>2단계:</strong> (1단계 결과) + 장기주택저당차입금 ≤ 개별한도</p>
              
              {calculationResult.housingLimitDetails.firstStage.isExceeded && (
                <div style={{ color: ' #e74c3c', marginTop: '10px' }}>
                  <p><strong>⚠️ 1단계 한도 초과:</strong> 비례 배분으로 조정되었습니다.</p>
                  <p>• 원래 합계: {calculationResult.housingLimitDetails.firstStage.originalTotal}만원</p>
                  <p>• 조정 후: {calculationResult.housingLimitDetails.firstStage.total}만원</p>
                </div>
              )}
              
              {calculationResult.housingLimitDetails.secondStage.isExceeded && (
                <div style={{ color: ' #e74c3c', marginTop: '10px' }}>
                  <p><strong>⚠️ 2단계 한도 초과:</strong> 장기주택저당차입금이 우선 조정되었습니다.</p>
                  <p>• 원래 금액: {calculationResult.housingLimitDetails.secondStage.originalAmount}만원</p>
                  <p>• 조정 후: {calculationResult.housingLimitDetails.secondStage.housingLoan}만원</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 1. 사회보험료 (기존 로직 유지) */}
        <div className="form-section">
          <div className="form-row">
            <label className="form-label">
              <input
                type="checkbox"
                checked={localData.insurance?.checked || false}
                onChange={(e) => handleCheckboxChange('insurance', e.target.checked)}
                className="form-checkbox"
              />
              사회보험료(건강보험, 고용보험, 노인장기요양보험)를 납부하셨나요?
            </label>
          </div>
          
          <div className="form-description">
            <p>사회보험료는 매월 급여에서 자동으로 공제되며, 납부한 금액의 100%를 공제받을 수 있습니다.</p>
          </div>

          {localData.insurance?.checked && (
            <div className="deduction-details">
              <div className="input-row">
                <label>연간 납부액 (만원)</label>
                <div className="input-group">
                  <input
                    type="number"
                    value={localData.insurance?.amount || 0}
                    onChange={(e) => setLocalData(prev => ({
                      ...prev,
                      insurance: { ...prev.insurance, amount: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="0"
                    className="form-input"
                    min="0"
                    step="1"
                  />
                  <button 
                    type="button" 
                    onClick={handleAutoCalculateInsurance}
                    className="btn-secondary"
                    style={{ marginLeft: '10px', whiteSpace: 'nowrap' }}
                  >
                    자동계산
                  </button>
                </div>
              </div>
              
              {salary > 0 && (
                <div className="calculation-preview">
                  <p><strong>예상 연간 사회보험료:</strong> {calculateInsuranceAmount(salary).toLocaleString()}만원</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    (총급여 {salary.toLocaleString()}만원 × 3.545% = 건강보험+고용보험+노인장기요양보험)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. 주택임차차입금 (2단계 한도 적용) */}
        <div className="form-section">
          <div className="form-row">
            <label className="form-label">
              <input
                type="checkbox"
                checked={localData['housing-rent']?.checked || false}
                onChange={(e) => handleCheckboxChange('housing-rent', e.target.checked)}
                className="form-checkbox"
              />
              주택임차차입금 원리금을 상환하셨나요?
            </label>
          </div>
          
          <div className="form-description">
            <p>무주택 세대주가 전세나 월세를 위해 대출받은 돈의 원금과 이자를 갚을 때 40% 공제받을 수 있습니다.</p>
            <p style={{ color: ' #e74c3c', fontSize: '14px' }}>
              ⚠️ 주택청약종합저축과 합하여 1단계 한도(400만원)가 적용됩니다.
            </p>
          </div>

          {localData['housing-rent']?.checked && (
            <div className="deduction-details">
              <div className="input-row">
                <label>연간 원리금 상환액 (만원)</label>
                <input
                  type="number"
                  value={localData['housing-rent']?.inputAmount || 0}
                  onChange={(e) => handleAmountChange('housing-rent', e.target.value)}
                  placeholder="0"
                  className="form-input"
                  min="0"
                  step="1"
                />
              </div>
              
              <div className="calculation-preview">
                <p><strong>개별 공제액:</strong> {calculateHousingRentDeduction(localData['housing-rent']?.inputAmount || 0).toLocaleString()}만원</p>
                <p><strong>최종 공제액:</strong> {(housingLimits.finalAmounts.housingRent || 0).toLocaleString()}만원</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  (상환액 × 40%, 2단계 한도 체계 적용)
                </p>
                
                {housingLimits.firstStage.isExceeded && (
                  <p style={{ color: ' #e74c3c', fontSize: '12px' }}>
                    ⚠️ 1단계 한도 초과로 조정됨
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. 장기주택저당차입금 (2단계 한도 적용) */}
        <div className="form-section">
          <div className="form-row">
            <label className="form-label">
              <input
                type="checkbox"
                checked={localData['housing-loan']?.checked || false}
                onChange={(e) => handleCheckboxChange('housing-loan', e.target.checked)}
                className="form-checkbox"
              />
              장기주택저당차입금 이자를 상환하셨나요?
            </label>
          </div>
          
          <div className="form-description">
            <p>무주택 또는 1주택 세대주가 주택을 구입할 때 대출받은 돈의 이자를 갚을 때 일정 부분 공제받을 수 있습니다.</p>
            <p style={{ color: ' #e74c3c', fontSize: '14px' }}>
              ⚠️ 2단계 한도(개별한도) 내에서 1단계 공제 후 잔여한도만큼 공제됩니다.
            </p>
          </div>

          {localData['housing-loan']?.checked && (
            <div className="deduction-details">
              {/* 대출 상세 정보 입력 (기존 로직 유지) */}
              <div className="loan-details">
                <h4>대출 상세정보</h4>
                
                <div className="input-row">
                  <label>대출 계약일</label>
                  <input
                    type="date"
                    value={localData['housing-loan']?.details?.contractDate || ''}
                    onChange={(e) => handleLoanDetailsChange('contractDate', e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="input-row">
                  <label>상환기간</label>
                  <select
                    value={localData['housing-loan']?.details?.repaymentPeriod || ''}
                    onChange={(e) => handleLoanDetailsChange('repaymentPeriod', e.target.value)}
                    className="form-input"
                  >
                    <option value="">선택하세요</option>
                    <option value="less">10년 미만</option>
                    <option value="10">10년 이상 15년 미만</option>
                    <option value="15">15년 이상 30년 미만</option>
                    <option value="30">30년 이상</option>
                  </select>
                </div>

                <div className="input-row">
                  <label>금리유형</label>
                  <select
                    value={localData['housing-loan']?.details?.interestType || ''}
                    onChange={(e) => handleLoanDetailsChange('interestType', e.target.value)}
                    className="form-input"
                  >
                    <option value="">선택하세요</option>
                    <option value="fixed">고정금리</option>
                    <option value="variable">변동금리</option>
                  </select>
                </div>

                <div className="input-row">
                  <label>상환방식</label>
                  <select
                    value={localData['housing-loan']?.details?.repaymentType || ''}
                    onChange={(e) => handleLoanDetailsChange('repaymentType', e.target.value)}
                    className="form-input"
                  >
                    <option value="">선택하세요</option>
                    <option value="installment">원리금균등분할상환</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>

              <div className="input-row">
                <label>연간 이자상환액 (만원)</label>
                <input
                  type="number"
                  value={localData['housing-loan']?.inputAmount || 0}
                  onChange={(e) => handleAmountChange('housing-loan', e.target.value)}
                  placeholder="0"
                  className="form-input"
                  min="0"
                  step="1"
                />
              </div>
              
              <div className="calculation-preview">
                <p><strong>개별 한도:</strong> {calculateHousingLoanMaxDeduction(localData['housing-loan']?.details || {}).toLocaleString()}만원</p>
                <p><strong>개별 공제액:</strong> {calculateHousingLoanDeduction(localData['housing-loan']?.inputAmount || 0, localData['housing-loan']?.details || {}).toLocaleString()}만원</p>
                <p><strong>최종 공제액:</strong> {(housingLimits.finalAmounts.housingLoan || 0).toLocaleString()}만원</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  (이자상환액, 개별한도 및 2단계 종합한도 적용)
                </p>
                
                {housingLimits.secondStage.isExceeded && (
                  <p style={{ color: ' #e74c3c', fontSize: '12px' }}>
                    ⚠️ 2단계 한도 초과로 조정됨
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 총 공제액 요약 */}
        <div className="total-summary">
          <div className="summary-content">
            <h3>총 특별소득공제</h3>
            <div className="amount-display">
              <span className="amount">{calculationResult.totalDeduction.toLocaleString()}</span>
              <span className="unit">만원</span>
            </div>
            
            {calculationResult.totalDeduction > 0 && (
              <div className="breakdown">
                {calculationResult.details.map((detail, index) => (
                  <p key={index}>
                    • { detail.name}: {detail.amount.toLocaleString()}만원
                    {detail.limitApplied && (
                      <span style={{ color: ' #e74c3c' }}> (조정됨)</span>
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 안내사항 */}
        <div className="info-section">
          <h4>📌 중요 안내사항</h4>
          <ul>
            <li><strong>주택 관련 종합한도:</strong> 2단계 체계로 주택청약종합저축, 주택임차차입금, 장기주택저당차입금에 순차적 한도 적용</li>
            <li><strong>1단계 한도:</strong> 주택청약종합저축 + 주택임차차입금 ≤ 400만원 (초과시 비례 배분)</li>
            <li><strong>2단계 한도:</strong> (1단계 결과) + 장기주택저당차입금 ≤ 개별한도 (초과시 장기주택저당차입금 우선 조정)</li>
            <li><strong>사회보험료:</strong> 급여에서 공제되는 건강보험, 고용보험, 노인장기요양보험료</li>
            <li><strong>입력 단위:</strong> 모든 금액은 만원 단위로 입력</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpecialDeductionInput;
