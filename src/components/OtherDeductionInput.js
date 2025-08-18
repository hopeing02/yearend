import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateOtherDeduction, 
  calculateCreditCardDeduction,
  calculateHousingSavingsDeduction,
  applyHousingDeductionLimits, // 새로 추가된 함수
  getCreditCardCalculationDetails // 기존 calc.js 함수 사용
} from '../utils/calc';

/**
 * 그밖의 소득공제 입력 컴포넌트 - 신용카드 변수명 수정
 * 기존 calc.js와 일치하는 변수명 사용
 * useEffect 무한렌더링 방지를 위한 최적화 적용
 */
const OtherDeductionInput = () => {
  const { formData, setOtherDeduction } = useTax();
  const otherDeduction = formData.otherDeduction || {};
  const specialDeduction = formData.specialDeduction || {}; // 주택 관련 한도 계산용
  const salary = formData.salary; // 만원 단위

  // 로컬 상태로 입력값 관리 (기존 calc.js 변수명과 일치)
  const [localData, setLocalData] = useState({
    'housing-savings': { 
      checked: false, 
      amount: 0, 
      inputAmount: 0,
      isHouseholdHead: false 
    },
    'credit-card': { 
      checked: false, 
      details: {
        credit: 0,        // 신용카드 (calc.js와 일치)
        check: 0,         // 체크카드/현금영수증 (calc.js와 일치)
        traditional: 0,   // 전통시장 (calc.js와 일치)
        transport: 0,     // 대중교통 (calc.js와 일치)
        culture: 0,       // 도서/공연/박물관/미술관 (calc.js와 일치)
        lastYear: 0       // 2023년 카드 사용금액 (calc.js와 일치)
      }
    }
  });

  // 계산 결과 상태
  const [calculationStatus, setCalculationStatus] = useState({
    housingSavings: { amount: 0, isValid: true, message: '', isExceeded: false },
    creditCard: { amount: 0, isValid: true, message: '', details: null }
  });
  
  const [totalDeduction, setTotalDeduction] = useState(0);

  // Context 데이터가 변경되면 로컬 상태 동기화 (useCallback으로 최적화)
  const syncLocalData = useCallback(() => {
    if (otherDeduction && Object.keys(otherDeduction).length > 0) {
      setLocalData(prev => ({
        ...prev,
        ...otherDeduction
      }));
    }
  }, [otherDeduction]);

  useEffect(() => {
    syncLocalData();
  }, [syncLocalData]);

  // 주택 관련 2단계 한도 체계를 적용한 계산 (useMemo로 최적화)
  const housingLimits = useMemo(() => {
    return applyHousingDeductionLimits(specialDeduction, localData);
  }, [specialDeduction, localData]);

  // 주택청약종합저축 계산 (useCallback으로 최적화)
  const calculateHousingSavings = useCallback(() => {
    if (!localData['housing-savings']?.checked) {
      return { amount: 0, isValid: true, message: '', isExceeded: false };
    }

    const inputAmount = localData['housing-savings'].inputAmount || 0;
    const isHouseholdHead = localData['housing-savings'].isHouseholdHead || false;
    
    const originalAmount = calculateHousingSavingsDeduction(inputAmount, isHouseholdHead);
    const adjustedAmount = housingLimits.finalAmounts.housingSavings;
    const isExceeded = originalAmount !== adjustedAmount;

    return {
      amount: adjustedAmount,
      originalAmount: originalAmount,
      isValid: isHouseholdHead,
      message: !isHouseholdHead ? '무주택 세대주만 공제받을 수 있습니다.' : 
               isExceeded ? `1단계 한도 적용으로 조정됨 (원래: ${originalAmount}만원)` : '',
      isExceeded: isExceeded
    };
  }, [localData, housingLimits]);

  // 신용카드 등 계산 (useCallback으로 최적화 - 기존 calc.js 함수 사용)
  const calculateCreditCard = useCallback(() => {
    if (!localData['credit-card']?.checked || !salary) {
      return { amount: 0, isValid: true, message: '', details: null };
    }

    // 기존 calc.js와 일치하는 변수명 사용
    const cardDetails = localData['credit-card'].details || {};
    const cardResult = calculateCreditCardDeduction(cardDetails, salary);
    
    return {
      amount: cardResult.amount || 0,
      isValid: cardResult.isValid,
      message: cardResult.message || '',
      details: cardResult.details || null
    };
  }, [localData, salary]);

  // 전체 계산 (useCallback으로 최적화)
  const calculateDeductions = useCallback(() => {
    const housingSavingsResult = calculateHousingSavings();
    const creditCardResult = calculateCreditCard();
    
    const newStatus = {
      housingSavings: housingSavingsResult,
      creditCard: creditCardResult
    };
    
    setCalculationStatus(newStatus);
    setTotalDeduction(housingSavingsResult.amount + creditCardResult.amount);
    
    // Context에 결과 저장 (디바운싱 적용)
    const timeoutId = setTimeout(() => {
      setOtherDeduction({
        ...localData,
        calculationResult: {
          totalDeduction: housingSavingsResult.amount + creditCardResult.amount,
          details: [
            ...(housingSavingsResult.amount > 0 ? [{
              type: 'housing-savings',
              name: '주택청약종합저축',
              amount: housingSavingsResult.amount,
              originalAmount: housingSavingsResult.originalAmount || housingSavingsResult.amount,
              limitApplied: housingSavingsResult.isExceeded
            }] : []),
            ...(creditCardResult.amount > 0 ? [{
              type: 'credit-card',
              name: '신용카드 등',
              amount: creditCardResult.amount,
              calculationDetails: creditCardResult.details
            }] : [])
          ],
          housingLimitDetails: housingLimits
        }
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [calculateHousingSavings, calculateCreditCard, localData, housingLimits, setOtherDeduction]);

  // 계산 실행 (useEffect로 디바운싱 적용하여 무한렌더링 방지)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateDeductions();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [calculateDeductions]);

  // 체크박스 변경 핸들러 (useCallback으로 최적화)
  const handleCheckboxChange = useCallback((deductionType, checked) => {
    setLocalData(prev => ({
      ...prev,
      [deductionType]: {
        ...prev[deductionType],
        checked
      }
    }));
  }, []);

  // 주택청약종합저축 입력 핸들러 (useCallback으로 최적화)
  const handleHousingSavingsChange = useCallback((field, value) => {
    setLocalData(prev => {
      const updated = {
        ...prev,
        'housing-savings': {
          ...prev['housing-savings'],
          [field]: field === 'inputAmount' ? (parseFloat(value) || 0) : value
        }
      };
      
      // 공제액 계산
      if (field === 'inputAmount' || field === 'isHouseholdHead') {
        const inputAmount = field === 'inputAmount' ? (parseFloat(value) || 0) : updated['housing-savings'].inputAmount;
        const isHouseholdHead = field === 'isHouseholdHead' ? value : updated['housing-savings'].isHouseholdHead;
        
        updated['housing-savings'].amount = calculateHousingSavingsDeduction(inputAmount, isHouseholdHead);
      }
      
      return updated;
    });
  }, []);

  // 신용카드 입력 핸들러 (useCallback으로 최적화 - 기존 calc.js 변수명 사용)
  const handleCreditCardChange = useCallback((field, value) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    
    setLocalData(prev => ({
      ...prev,
      'credit-card': {
        ...prev['credit-card'],
        details: {
          ...prev['credit-card'].details,
          [field]: numValue
        }
      }
    }));
  }, []);

  return (
    <div className="deduction-section">
      <div className="container">
        <h2 className="section-title">그밖의 소득공제</h2>
        
        {/* 주택 관련 종합한도 안내 (주택청약종합저축 체크시에만 표시) */}
        {localData['housing-savings']?.checked && (
          <div className="info-section" style={{ backgroundColor: ' #fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
            <h4>🏠 주택 관련 종합한도 체계 적용</h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              주택청약종합저축은 특별소득공제의 주택임차차입금과 함께 1단계 종합한도(400만원)가 적용됩니다.
              초과시 비례 배분으로 조정됩니다.
            </p>
            
            {calculationStatus.housingSavings.isExceeded && (
              <div style={{ color: ' #e74c3c', marginTop: '10px', fontSize: '14px' }}>
                <p><strong>⚠️ 한도 초과로 조정됨:</strong> {calculationStatus.housingSavings.message}</p>
              </div>
            )}
          </div>
        )}

        {/* 1. 주택청약종합저축 (2단계 한도 적용) */}
        <div className="form-section">
          <div className="form-row">
            <label className="form-label">
              <input
                type="checkbox"
                checked={localData['housing-savings']?.checked || false}
                onChange={(e) => handleCheckboxChange('housing-savings', e.target.checked)}
                className="form-checkbox"
              />
              주택청약종합저축을 납부하셨나요?
            </label>
          </div>
          
          <div className="form-description">
            <p>무주택 세대주가 청약저축에 납입한 금액은 연 300만원 한도 내에서 40%까지 공제받을 수 있습니다.</p>
            <p style={{ color: ' #e74c3c', fontSize: '14px' }}>
              ⚠️ 특별소득공제의 주택임차차입금과 합하여 400만원 한도가 적용됩니다.
            </p>
          </div>

          {localData['housing-savings']?.checked && (
            <div className="deduction-details">
              <div className="input-row">
                <label>
                  <input
                    type="checkbox"
                    checked={localData['housing-savings']?.isHouseholdHead || false}
                    onChange={(e) => handleHousingSavingsChange('isHouseholdHead', e.target.checked)}
                    className="form-checkbox"
                  />
                  무주택 세대주입니다
                </label>
              </div>
              
              {!localData['housing-savings']?.isHouseholdHead && (
                <div className="warning-message">
                  <p style={{ color: ' #e74c3c', fontSize: '14px' }}>
                    ⚠️ 주택청약종합저축은 무주택 세대주만 공제받을 수 있습니다.
                  </p>
                </div>
              )}

              <div className="input-row">
                <label>연간 납입액 (만원)</label>
                <input
                  type="number"
                  value={localData['housing-savings']?.inputAmount || 0}
                  onChange={(e) => handleHousingSavingsChange('inputAmount', e.target.value)}
                  placeholder="0"
                  className="form-input"
                  min="0"
                  max="3000"
                  step="1"
                />
              </div>
              
              <div className="calculation-preview">
                <p><strong>개별 공제액:</strong> {calculateHousingSavingsDeduction(localData['housing-savings']?.inputAmount || 0, localData['housing-savings']?.isHouseholdHead || false).toLocaleString()}만원</p>
                <p><strong>최종 공제액:</strong> {calculationStatus.housingSavings.amount.toLocaleString()}만원</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  (납입액 × 40%, 연 300만원 한도, 종합한도 400만원 적용)
                </p>
                
                {calculationStatus.housingSavings.message && (
                  <p style={{ color: ' #e74c3c', fontSize: '12px' }}>
                    {calculationStatus.housingSavings.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. 신용카드 등 소득공제 (기존 calc.js 변수명 사용) */}
        <div className="form-section">
          <div className="form-row">
            <label className="form-label">
              <input
                type="checkbox"
                checked={localData['credit-card']?.checked || false}
                onChange={(e) => handleCheckboxChange('credit-card', e.target.checked)}
                className="form-checkbox"
              />
              신용카드, 체크카드, 현금영수증을 사용하셨나요?
            </label>
          </div>
          
          <div className="form-description">
            <p>총급여의 25%를 초과하여 사용한 금액에 대해 구간별로 공제받을 수 있습니다.</p>
            <p><strong>공제율:</strong> 신용카드 15%, 체크카드·현금영수증 30%, 전통시장·대중교통 40%</p>
          </div>

          {localData['credit-card']?.checked && (
            <div className="deduction-details">
              <div className="card-usage-inputs">
                <h4>연간 사용액 입력 (만원)</h4>
                
                <div className="input-grid">
                  <div className="input-row">
                    <label>신용카드 사용액</label>
                    <input
                      type="number"
                      value={localData['credit-card']?.details?.credit || 0}
                      onChange={(e) => handleCreditCardChange('credit', e.target.value)}
                      placeholder="0"
                      className="form-input"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="input-row">
                    <label>체크카드/현금영수증 사용액</label>
                    <input
                      type="number"
                      value={localData['credit-card']?.details?.check || 0}
                      onChange={(e) => handleCreditCardChange('check', e.target.value)}
                      placeholder="0"
                      className="form-input"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="input-row">
                    <label>전통시장 사용액</label>
                    <input
                      type="number"
                      value={localData['credit-card']?.details?.traditional || 0}
                      onChange={(e) => handleCreditCardChange('traditional', e.target.value)}
                      placeholder="0"
                      className="form-input"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="input-row">
                    <label>대중교통 이용액</label>
                    <input
                      type="number"
                      value={localData['credit-card']?.details?.transport || 0}
                      onChange={(e) => handleCreditCardChange('transport', e.target.value)}
                      placeholder="0"
                      className="form-input"
                      min="0"
                      step="1"
                    />
                  </div>

                  <div className="input-row">
                    <label>도서·공연 사용액</label>
                    <input
                      type="number"
                      value={localData['credit-card']?.details?.culture || 0}
                      onChange={(e) => handleCreditCardChange('culture', e.target.value)}
                      placeholder="0"
                      className="form-input"
                      min="0"
                      step="1"
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      총급여 7천만원 이하만 30% 공제
                    </p>
                  </div>

                  <div className="input-row">
                    <label>2023년 총 사용액 (선택)</label>
                    <input
                      type="number"
                      value={localData['credit-card']?.details?.lastYear || 0}
                      onChange={(e) => handleCreditCardChange('lastYear', e.target.value)}
                      placeholder="0"
                      className="form-input"
                      min="0"
                      step="1"
                    />
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      증가분에 대한 추가 공제 (100만원 한도)
                    </p>
                  </div>
                </div>
              </div>

              {/* 신용카드 공제 계산 결과 */}
              {calculationStatus.creditCard.details && salary > 0 && (
                <div className="calculation-preview">
                  <h4>신용카드 등 공제 계산 과정</h4>
                  
                  {(() => {
                    const details = calculationStatus.creditCard.details;
                    const cardDetails = localData['credit-card']?.details || {};
                    
                    // 총급여의 25% 기본공제 기준선 계산
                    const basicThreshold = salary * 0.25;
                    
                    // 총 사용액 계산
                    const totalCardAmount = (cardDetails.credit || 0) + (cardDetails.check || 0) + (cardDetails.culture || 0);
                    const totalWithSpecial = totalCardAmount + (cardDetails.traditional || 0) + (cardDetails.transport || 0);
                    
                    if (totalWithSpecial <= basicThreshold) {
                      return (
                        <p style={{ color: ' #e74c3c' }}>
                          총 사용액 {totalWithSpecial.toLocaleString()}만원이 기본공제 기준선 {basicThreshold.toLocaleString()}만원(총급여의 25%)을 초과하지 않아 공제받을 수 없습니다.
                        </p>
                      );
                    }
                    
                    return (
                      <>
                        <p><strong>1. 기본공제 기준선:</strong> {basicThreshold.toLocaleString()}만원 (총급여의 25%)</p>
                        <p><strong>2. 총 사용액:</strong> {totalWithSpecial.toLocaleString()}만원</p>
                        <p><strong>3. 기준선 초과액:</strong> {(totalWithSpecial - basicThreshold).toLocaleString()}만원</p>
                        
                        <div style={{ marginLeft: '20px', fontSize: '14px' }}>
                          {cardDetails.credit > 0 && (
                            <p>• 신용카드 {cardDetails.credit.toLocaleString()}만원 × 15% = {(cardDetails.credit * 0.15).toLocaleString()}만원</p>
                          )}
                          {cardDetails.check > 0 && (
                            <p>• 체크카드/현금영수증 {cardDetails.check.toLocaleString()}만원 × 30% = {(cardDetails.check * 0.30).toLocaleString()}만원</p>
                          )}
                          {cardDetails.traditional > 0 && (
                            <p>• 전통시장 {cardDetails.traditional.toLocaleString()}만원 × 40% = {(cardDetails.traditional * 0.40).toLocaleString()}만원</p>
                          )}
                          {cardDetails.transport > 0 && (
                            <p>• 대중교통 {cardDetails.transport.toLocaleString()}만원 × 40% = {(cardDetails.transport * 0.40).toLocaleString()}만원</p>
                          )}
                          {cardDetails.culture > 0 && (
                            <p>• 도서·공연 {cardDetails.culture.toLocaleString()}만원 × {salary <= 7000 ? '30%' : '0% (7천만원 초과자)'} = {(cardDetails.culture * (salary <= 7000 ? 0.30 : 0)).toLocaleString()}만원</p>
                          )}
                          
                        </div>
                        
                        <div className="final-result">
                          <p><strong>최종 공제액: {calculationStatus.creditCard.amount.toLocaleString()}만원</strong></p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 총 공제액 요약 */}
        <div className="total-summary">
          <div className="summary-content">
            <h3>총 그밖의 소득공제</h3>
            <div className="amount-display">
              <span className="amount">{totalDeduction.toLocaleString()}</span>
              <span className="unit">만원</span>
            </div>
            
            {totalDeduction > 0 && (
              <div className="breakdown">
                {calculationStatus.housingSavings.amount > 0 && (
                  <p>• 주택청약종합저축: {calculationStatus.housingSavings.amount.toLocaleString()}만원
                    {calculationStatus.housingSavings.isExceeded && (
                      <span style={{ color: ' #e74c3c' }}> (조정됨)</span>
                    )}
                  </p>
                )}
                {calculationStatus.creditCard.amount > 0 && (
                  <p>• 신용카드 등: {calculationStatus.creditCard.amount.toLocaleString()}만원</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 안내사항 */}
        <div className="info-section">
          <h4>📌 중요 안내사항</h4>
          <ul>
            <li><strong>주택청약종합저축:</strong> 무주택 세대주만 공제 가능, 연 300만원 한도 내 40% 공제</li>
            <li><strong>종합한도 적용:</strong> 주택청약종합저축은 특별소득공제의 주택임차차입금과 합하여 400만원 한도</li>
            <li><strong>신용카드 등:</strong> 총급여의 25% 초과 금액부터 공제, 최대 300만원(7천만원 이하자)</li>
            <li><strong>공제율:</strong> 신용카드 15%, 체크카드/현금영수증 30%, 전통시장/대중교통 40%</li>
            <li><strong>도서/공연:</strong> 총급여 7천만원 이하자만 30% 공제 적용</li>
            <li><strong>입력 단위:</strong> 모든 금액은 만원 단위로 입력</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OtherDeductionInput;
