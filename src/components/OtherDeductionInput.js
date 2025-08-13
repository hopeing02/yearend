import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateOtherDeduction, 
  calculateHousingSavingsDeduction, 
  calculateCreditCardDeduction,
  getCreditCardCalculationDetails,
  formatNumber 
} from '../utils/calc';

/**
 * 개선된 그밖의 소득공제 입력 컴포넌트
 * - 무주택 세대주 체크 기능 추가
 * - 신용카드 공제 최저사용금액 안내 강화
 * - 실시간 계산 결과 및 오류 메시지 표시
 * - 사용자 친화적인 입력 검증 및 피드백
 */
const OtherDeductionInput = () => {
  const { formData, setOtherDeduction } = useTax();
  const otherDeduction = formData.otherDeduction || {};
  const salary = formData.salary; // 만원 단위

  // 로컬 상태로 입력값 관리
  const [localData, setLocalData] = useState({
    'housing-savings': { 
      checked: false, 
      amount: 0,
      inputAmount: 0,
      isHouseholdHead: false // 무주택 세대주 여부 추가
    },
    'credit-card': { 
      checked: false, 
      amount: 0,
      details: {
        credit: 0,        // 신용카드
        check: 0,         // 체크카드/현금영수증
        traditional: 0,   // 전통시장
        transport: 0,     // 대중교통
        culture: 0,       // 도서/공연/박물관/미술관
        lastYear: 0       // 2023년 카드 사용금액
      }
    }
  });

    // 계산 결과 및 오류 메시지 상태
  const [calculationStatus, setCalculationStatus] = useState({
    housingSavings: { isValid: true, message: '', amount: 0 },
    creditCard: { isValid: true, message: '', amount: 0, details: null }
  });

  // Context 데이터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (otherDeduction && Object.keys(otherDeduction).length > 0) {
      setLocalData(prev => ({
        ...prev,
        ...otherDeduction
      }));
    }
  }, [otherDeduction]);

    // 실시간 계산 및 검증
  useEffect(() => {
    calculateAndValidate();
  }, [localData, salary]);

  // 계산 및 검증 함수
  const calculateAndValidate = () => {
    const newStatus = { ...calculationStatus };

    // 주택청약종합저축 계산 및 검증
    if (localData['housing-savings']?.checked) {
      const inputAmount = localData['housing-savings'].inputAmount || 0;
      const isHouseholdHead = localData['housing-savings'].isHouseholdHead || false;
      
      if (!isHouseholdHead) {
        newStatus.housingSavings = {
          isValid: false,
          message: '무주택 세대주만 공제 가능합니다.',
          amount: 0
        };
      } else if (inputAmount <= 0) {
        newStatus.housingSavings = {
          isValid: false,
          message: '납입액을 입력해주세요.',
          amount: 0
        };
      } else if (inputAmount > 1000) {
        newStatus.housingSavings = {
          isValid: false,
          message: '납입액이 너무 큽니다. (최대 1,000만원)',
          amount: 0
        };
      } else {
        const deductionResult = calculateHousingSavingsDeduction(inputAmount, isHouseholdHead);
        // 결과가 객체인 경우 amount 속성 사용, 숫자인 경우 그대로 사용
        const amount = typeof deductionResult === 'object' ? deductionResult.amount : deductionResult;
        //const maxPossibleDeduction = Math.min(inputAmount, 300) * 0.4;
        
        newStatus.housingSavings = {
          isValid: true,
          message: `납입액 ${inputAmount.toLocaleString()}만원 → 공제액 ${amount.toLocaleString()}만원 (40% 공제, 최대 300만원)`,
          amount: amount
        };
      }
    } else {
      newStatus.housingSavings = { isValid: true, message: '', amount: 0 };
    }

    // 신용카드 등 계산 및 검증
    if (localData['credit-card']?.checked) {
      const details = localData['credit-card'].details || {};
      const totalUsed = Object.values(details).reduce((sum, val) => sum + (val || 0), 0) - (details.lastYear || 0);
      
      if (salary <= 0) {
        newStatus.creditCard = {
          isValid: false,
          message: '총급여를 먼저 입력해주세요.',
          amount: 0,
          details: null
        };
      } else if (totalUsed <= 0) {
        newStatus.creditCard = {
          isValid: false,
          message: '카드 사용금액을 입력해주세요.',
          amount: 0,
          details: null
        };
      } else {
        const minimumRequired = salary * 0.25;
        const creditCardResult = calculateCreditCardDeduction(details, salary);
        const calculationDetails = getCreditCardCalculationDetails(details, salary);
        // 결과가 객체인 경우 amount 속성 사용, 숫자인 경우 그대로 사용
        const amount = typeof creditCardResult === 'object' ? creditCardResult.amount : creditCardResult;        
        
        if (totalUsed <= minimumRequired) {
          newStatus.creditCard = {
            isValid: false,
            message: `최저사용금액 ${minimumRequired.toLocaleString()}만원 미달 (현재: ${totalUsed.toLocaleString()}만원)`,
            amount: 0,
            details: calculationDetails
          };
        } else {
          newStatus.creditCard = {
            isValid: true,
            message: `총 사용액 ${totalUsed.toLocaleString()}만원 → 공제액 ${amount.toLocaleString()}만원`,
            amount: amount,
            details: calculationDetails
          };
        }
      }
    } else {
      newStatus.creditCard = { isValid: true, message: '', amount: 0, details: null };
    }

    setCalculationStatus(newStatus);
  };

    // Context에 계산 결과 반영
    const updatedData = {
      ...localData,
      'housing-savings': {
        ...localData['housing-savings'],
        amount: newStatus.housingSavings.amount
      },
      'credit-card': {
        ...localData['credit-card'],
        amount: newStatus.creditCard.amount
      }
      
  };
  setOtherDeduction(updatedData);
  // 체크박스 변경 핸들러
  const handleCheckboxChange = (optionId, checked) => {
    setLocalData(prev => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        checked: checked
      }
    }));
  };

  // 입력값 변경 핸들러
  const handleInputChange = (optionId, field, value) => {
    setLocalData(prev => ({
      ...prev,
      [optionId]: {
        ...prev[optionId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  // 신용카드 상세 입력값 변경 핸들러
  const handleCreditCardDetailChange = (field, value) => {
    setLocalData(prev => ({
      ...prev,
      'credit-card': {
        ...prev['credit-card'],
        details: {
          ...prev['credit-card'].details,
          [field]: parseFloat(value) || 0
        }
      }
    }));
  };

  // 무주택 세대주 체크박스 변경 핸들러
  const handleHouseholdHeadChange = (checked) => {
    setLocalData(prev => ({
      ...prev,
      'housing-savings': {
        ...prev['housing-savings'],
        isHouseholdHead: checked
      }
    }));
  };
  // 총 공제액 계산 - 안전한 숫자 변환
  const totalDeduction = (calculationStatus.housingSavings.amount || 0) + (calculationStatus.creditCard.amount || 0);


  return (
    <div className="deduction-section">
      <div className="container">
        <h2 className="section-title">그밖의 소득공제</h2>
        
        {/* 주택청약종합저축 섹션 */}
        <div className="form-section">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="housing-savings-check"
              checked={localData['housing-savings']?.checked || false}
              onChange={(e) => handleCheckboxChange('housing-savings', e.target.checked)}
            />
            <label htmlFor="housing-savings-check" className="checkbox-label">
              주택청약종합저축을 납부하셨나요?
            </label>
          </div>

          {localData['housing-savings']?.checked && (
            <div className="input-details">
              {/* 무주택 세대주 체크 */}
              <div className="checkbox-group" style={{ marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  id="household-head-check"
                  checked={localData['housing-savings']?.isHouseholdHead || false}
                  onChange={(e) => handleHouseholdHeadChange(e.target.checked)}
                />
                <label htmlFor="household-head-check" className="checkbox-label">
                  무주택 세대주입니다
                </label>
              </div>

              {/* 납입액 입력 */}
              <div className="input-group">
                <label htmlFor="housing-savings-amount">납입액 (만원)</label>
                <input
                  type="number"
                  id="housing-savings-amount"
                  placeholder="예: 240"
                  value={localData['housing-savings']?.inputAmount || 0}
                  onChange={(e) => handleInputChange('housing-savings', 'inputAmount', e.target.value)}
                  className="amount-input"
                />
              </div>

              {/* 계산 결과 표시 */}
              <div className={`result-message ${calculationStatus.housingSavings.isValid ? 'success' : 'error'}`}>
                {calculationStatus.housingSavings.message && (
                  <p>
                    <strong>
                      {calculationStatus.housingSavings.isValid ? '✅' : '❌'} 
                      {calculationStatus.housingSavings.message}
                    </strong>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 신용카드 등 소득공제 섹션 */}
        <div className="form-section">
          <div className="checkbox-group">
            <input
              type="checkbox"
              id="credit-card-check"
              checked={localData['credit-card']?.checked || false}
              onChange={(e) => handleCheckboxChange('credit-card', e.target.checked)}
            />
            <label htmlFor="credit-card-check" className="checkbox-label">
              신용카드, 체크카드, 현금영수증을 사용하셨나요?
            </label>
          </div>

          {localData['credit-card']?.checked && (
            <div className="input-details">
              {/* 최저사용금액 안내 */}
              {salary > 0 && (
                <div className="info-box">
                  <p><strong>📊 최저사용금액:</strong> {(salary * 0.25).toLocaleString()}만원 (총급여의 25%)</p>
                  <p><small>이 금액을 초과하는 부분부터 공제가 적용됩니다.</small></p>
                </div>
              )}

              {/* 카드 사용액 입력 */}
              <div className="card-input-grid">
                <div className="input-group">
                  <label htmlFor="credit-card">신용카드 (15% 공제)</label>
                  <input
                    type="number"
                    id="credit-card"
                    placeholder="만원"
                    value={localData['credit-card']?.details?.credit || 0}
                    onChange={(e) => handleCreditCardDetailChange('credit', e.target.value)}
                    className="amount-input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="check-card">체크카드/현금영수증 (30% 공제)</label>
                  <input
                    type="number"
                    id="check-card"
                    placeholder="만원"
                    value={localData['credit-card']?.details?.check || 0}
                    onChange={(e) => handleCreditCardDetailChange('check', e.target.value)}
                    className="amount-input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="traditional">전통시장 (40% 공제)</label>
                  <input
                    type="number"
                    id="traditional"
                    placeholder="만원"
                    value={localData['credit-card']?.details?.traditional || 0}
                    onChange={(e) => handleCreditCardDetailChange('traditional', e.target.value)}
                    className="amount-input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="transport">대중교통 (40% 공제)</label>
                  <input
                    type="number"
                    id="transport"
                    placeholder="만원"
                    value={localData['credit-card']?.details?.transport || 0}
                    onChange={(e) => handleCreditCardDetailChange('transport', e.target.value)}
                    className="amount-input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="culture">도서/공연/박물관 (30% 공제)</label>
                  <input
                    type="number"
                    id="culture"
                    placeholder="만원"
                    value={localData['credit-card']?.details?.culture || 0}
                    onChange={(e) => handleCreditCardDetailChange('culture', e.target.value)}
                    className="amount-input"
                  />
                  <small style={{ color: '#7f8c8d' }}>총급여 7천만원 이하자만</small>
                </div>

                <div className="input-group">
                  <label htmlFor="last-year">2023년 카드 사용액</label>
                  <input
                    type="number"
                    id="last-year"
                    placeholder="만원"
                    value={localData['credit-card']?.details?.lastYear || 0}
                    onChange={(e) => handleCreditCardDetailChange('lastYear', e.target.value)}
                    className="amount-input"
                  />
                  <small style={{ color: '#7f8c8d' }}>전년 대비 증가분 추가공제용</small>
                </div>
              </div>

              {/* 계산 결과 표시 */}
              <div className={`result-message ${calculationStatus.creditCard.isValid ? 'success' : 'error'}`}>
                {calculationStatus.creditCard.message && (
                  <p>
                    <strong>
                      {calculationStatus.creditCard.isValid ? '✅' : '❌'} 
                      {calculationStatus.creditCard.message}
                    </strong>
                  </p>
                )}
              </div>

              {/* 상세 계산 내역 */}
              {calculationStatus.creditCard.details && calculationStatus.creditCard.isValid && (
                <div className="calculation-details">
                  <h4>📊 계산 상세</h4>
                  <div className="calculation-breakdown">
                    {(() => {
                      const details = calculationStatus.creditCard.details;
                      const minimumAmount = details.minimumRequired;
                      const cards = details.cardAmounts;
                      const isUnder70M = details.isUnder70Million;
                      
                      return (
                        <div className="calculation-steps">
                          <p><strong>총급여의 25%:</strong> {minimumAmount.toLocaleString()}만원</p>
                          
                          {cards.credit.used > 0 && (
                            <p><strong>1. 신용카드 사용금액:</strong> {cards.credit.used.toLocaleString()}만원 × 15% = {cards.credit.deduction.toLocaleString()}만원</p>
                          )}
                          
                          {cards.check.used > 0 && (
                            <p><strong>2. 체크카드/현금영수증 사용금액:</strong> {cards.check.used.toLocaleString()}만원 × 30% = {cards.check.deduction.toLocaleString()}만원</p>
                          )}
                          
                          {cards.traditional.used > 0 && (
                            <p><strong>3. 전통시장 사용금액:</strong> {cards.traditional.used.toLocaleString()}만원 × 40% = {cards.traditional.deduction.toLocaleString()}만원</p>
                          )}
                          
                          {cards.transport.used > 0 && (
                            <p><strong>4. 대중교통 사용금액:</strong> {cards.transport.used.toLocaleString()}만원 × 40% = {cards.transport.deduction.toLocaleString()}만원</p>
                          )}
                          
                          {cards.culture.used > 0 && (
                            <p><strong>5. 도서/공연/박물관/미술관{!isUnder70M ? '(총급여 7천만원 초과로 공제불가)' : '(총급여 7천만원 이하자)'} 사용금액:</strong> {cards.culture.used.toLocaleString()}만원 × {isUnder70M ? '30%' : '0%'} = {cards.culture.deduction.toLocaleString()}만원</p>
                          )}
                          
                          <p><strong>6. 총급여의 25% 사용금액 공제액 = {details.minimumDeduction.toLocaleString()}만원</strong></p>
                          
                          {details.lastYearInfo.increase > 0 && details.lastYearInfo.lastYear > 0 && (
                            <p><strong>7. 전년대비 5%를 초과하여 증가한 금액 × 10% = {Math.min(details.lastYearInfo.increase * 0.1, 100).toLocaleString()}만원</strong></p>
                          )}
                          
                          <div className="calculation-formula">
                            <p><strong>계산식:</strong></p>
                            <p><strong>1~5와 7를 더하고 6을 차감한 총공제액 = {details.baseDeduction.toLocaleString()}만원({details.deductionLimit.toLocaleString()}만원 한도)</strong></p>
                            
                            {details.baseDeduction > details.deductionLimit && (
                              <>
                            <p><strong>8. 공제한도 초과금액 = {(details.baseDeduction - details.deductionLimit).toLocaleString()}만원</strong></p>
                            
                            {(() => {
                              const excessAmount = details.baseDeduction - details.deductionLimit;
                              const specialTargetsDeduction = cards.traditional.deduction + cards.transport.deduction + cards.culture.deduction; // 공제액 합계
                              const specialDeduction = Math.min(excessAmount, specialTargetsDeduction, details.specialDeductionLimit);
                              const remainingExcess = Math.max(0, excessAmount - specialTargetsDeduction);
                              const additionalDeductionFromLastYear = details.lastYearInfo.additionalDeduction || 0;
                              const additionalDeduction = Math.min(remainingExcess, additionalDeductionFromLastYear, 100);
                              
                              return (
                                <>
                                  <p><strong>9. 8.공제한도 초과금액({excessAmount.toLocaleString()}만원)과 (전통시장, 대중교통, 도서 등 합계액) {specialTargetsDeduction.toLocaleString()}만원 중 작거나 같은 금액 = {specialDeduction.toLocaleString()}만원 ({details.specialDeductionLimit.toLocaleString()}만원 한도)</strong></p>
                                  
                                  {remainingExcess > 0 && additionalDeductionFromLastYear > 0 && (
                                    <p><strong>10. 8.공제한도 초과금액에서 9.전통시장, 대중교통, 도서 등 합계액를 차감한 금액({remainingExcess.toLocaleString()}만원), 전년대비 증가분({additionalDeductionFromLastYear.toLocaleString()}만원) 중 작거나 같은 금액 = {additionalDeduction.toLocaleString()}만원 (100만원 한도)</strong></p>
                                  )}
                                </>
                              );
                            })()}
                              </>
                            )}
                            
                            <div className="final-result">
                              <p><strong>최종 공제액: {details.finalAmount.toLocaleString()}만원</strong></p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
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
                  <p>• 주택청약종합저축: {calculationStatus.housingSavings.amount.toLocaleString()}만원</p>
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




/*   // 설문지 옵션들
  const surveyOptions = [
    {
      id: 'housing-savings',
      label: '주택청약종합저축을 납부하셨나요?',
      description: '무주택 세대주가 청약저축에 납입한 금액은 연 300만원 한도 내에서 40%까지 공제받을 수 있습니다.',
      type: 'checkbox',
      hasAmount: true
    },
    {
      id: 'credit-card',
      label: '신용카드, 체크카드, 현금영수증을 사용하셨나요?',
      description: '총급여의 25%를 초과하는 금액에 대해 공제받을 수 있습니다.',
      type: 'checkbox',
      hasDetails: true
    }
  ];

  // 체크박스 상태 확인 함수
  const getCheckboxState = (option) => {
    const fieldData = localData[ option.id];
    return fieldData?.checked || false;
  };

  // 숫자 입력값 확인 함수
  const getAmountValue = (optionId) => {
    const fieldData = localData[optionId];
    return fieldData?.inputAmount || 0;
  };

  // 상세정보 확인 함수
  const getDetailsValue = (optionId, field) => {
    const fieldData = localData[optionId];
    return fieldData?.details?.[field] || 0;
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field, value, type = 'checkbox') => {
    console.log('handleInputChange 호출:', { field, value, type });
    
    setLocalData(prev => {
      const updated = { ...prev };
      
      if (type === 'checkbox') {
        // 체크박스 선택 시 초기화
        if (field === 'housing-savings') {
          updated[field] = {
            checked: value,
            amount: 0,
            inputAmount: 0
          };
        } else if (field === 'credit-card') {
          updated[field] = {
            checked: value,
            amount: 0,
            details: {
              credit: 0,
              check: 0,
              traditional: 0,
              transport: 0,
              culture: 0,
              lastYear: 0
            }
          };
        }
      } else if (type === 'amount') {
        const numValue = parseInt(value) || 0;
        let calculatedAmount = 0;
        
        if (field === 'housing-savings') {
          calculatedAmount = calculateHousingSavings(numValue);
        }
        
        updated[field] = {
          ...updated[field],
          checked: numValue > 0,
          amount: calculatedAmount,
          inputAmount: numValue
        };
        
        console.log('amount 계산 결과:', { field, numValue, calculatedAmount });
      } else if (type === 'details') {
        const [fieldName, detailKey] = field.split('-');
        const numValue = parseInt(value) || 0;
        
        // 기존 details 보존하면서 새 값 업데이트
        const currentDetails = updated[fieldName]?.details || {};
        updated[fieldName] = {
          ...updated[fieldName],
          details: {
            ...currentDetails,
            [detailKey]: numValue
          }
        };
        
        // 신용카드 상세정보 변경 시 금액 재계산
        if (fieldName === 'credit-card') {
          const newDetails = updated[fieldName].details;
          const calculatedAmount = calculateCreditCard(newDetails);
          updated[fieldName].amount = calculatedAmount;
          
          // 하나라도 입력되면 체크박스 활성화
          const hasAnyInput = Object.values(newDetails).some(val => val > 0);
          updated[fieldName].checked = hasAnyInput;
          
          console.log('credit-card 계산 결과:', { 
            detailKey, 
            numValue, 
            newDetails, 
            calculatedAmount, 
            hasAnyInput 
          });
        }
      }
      
      console.log('로컬 상태 업데이트:', updated);
      
      // Context도 함께 업데이트
      setOtherDeduction(updated);
      
      return updated;
    });
  };

  // 실시간 계산 결과
  const calculationResult = calculateOtherDeduction(localData, salary); */

  export default OtherDeductionInput;
