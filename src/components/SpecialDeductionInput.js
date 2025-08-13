import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateSpecialDeduction, 
  calculateInsuranceAmount, 
  calculateHousingRentDeduction, 
  calculateHousingLoanDeduction,
  formatNumber 
} from '../utils/calc';

/**
 * 특별소득공제 입력 컴포넌트 (최적화된 버전)
 * 콘솔 스팸 제거 및 성능 최적화
 */
const SpecialDeductionInput = React.memo(() => {
  const { formData, setSpecialDeduction } = useTax();
  
  // ✅ 안전한 초기값 설정
  const initialSpecialDeduction = useMemo(() => 
    formData.specialDeduction || {}, 
    [formData.specialDeduction]
  );
  
  const salary = formData.salary; // 만원 단위

  // 로컬 상태로 입력값 관리
  const [localData, setLocalData] = useState({
    insurance: { checked: false, amount: 0 },
    'housing-rent': { checked: false, amount: 0 },
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

  // ✅ Context 데이터 초기화 (순환 참조 방지)
  useEffect(() => {
    if (initialSpecialDeduction && Object.keys(initialSpecialDeduction).length > 0) {
      const isChanged = JSON.stringify(localData) !== JSON.stringify(initialSpecialDeduction);
      if (isChanged) {
        setLocalData(prev => ({
          ...prev,
          ...initialSpecialDeduction
        }));
      }
    }
  }, [initialSpecialDeduction]); // localData 제거로 순환 참조 방지

  // ✅ 계산 함수들 메모이제이션
  const calculateInsurance = useCallback(() => {
    const annualAmount = calculateInsuranceAmount(salary);
    const monthlyAmount = Math.round(annualAmount / 12);
    
    return {
      monthly: monthlyAmount,
      annual: annualAmount
    };
  }, [salary]);

  const calculateHousingRent = useCallback((inputAmount) => {
    return calculateHousingRentDeduction(inputAmount);
  }, []);

  const calculateHousingLoan = useCallback((inputAmount, details) => {
    return calculateHousingLoanDeduction(inputAmount, details);
  }, []);

  // ✅ 설문지 옵션들 메모이제이션
  const surveyOptions = useMemo(() => [
    {
      id: 'insurance',
      label: '사회보험료(건강보험, 고용보험, 노인장기요양보험)를 납부하셨나요?',
      description: '사회보험료는 매월 급여에서 자동으로 공제되며, 납부한 금액의 100%를 공제받을 수 있습니다.',
      type: 'checkbox',
      hasAutoCalc: true
    },
    {
      id: 'housing-rent',
      label: '주택임차차입금 원리금을 상환하셨나요?',
      description: '무주택 세대주가 전세나 월세 살면서 대출받은 돈의 원금과 이자를 갚을 때 일정 부분 공제받을 수 있습니다.',
      type: 'checkbox',
      hasAmount: true
    },
    {
      id: 'housing-loan',
      label: '장기주택저당차입금 이자를 상환하셨나요?',
      description: '무주택 또는 1주택 세대주가 주택을 구입할 때 대출받은 돈의 이자를 갚을 때 일정 부분 공제받을 수 있습니다.',
      type: 'checkbox',
      hasAmount: true,
      hasDetails: true
    }
  ], []);

  // ✅ 체크박스 상태 확인 함수 최적화
  const getCheckboxState = useCallback((option) => {
    const fieldData = localData[ option.id];
    return fieldData?.checked || false;
  }, [localData]);

  // ✅ 숫자 입력값 확인 함수 최적화
  const getAmountValue = useCallback((optionId) => {
    const fieldData = localData[optionId];
    return fieldData?.amount || 0;
  }, [localData]);

  // ✅ 상세정보 확인 함수 최적화 (콘솔 로그 제거)
  const getDetailsValue = useCallback((field) => {
    const value = localData['housing-loan']?.details?.[field] || '';
    
    // ❌ 제거: 매 호출마다 콘솔 출력하던 코드
    // console.log('getDetailsValue:', { field, value, details: localData['housing-loan']?.details });
    
    // ✅ 개발 환경에서만 필요시 출력
    if (process.env.NODE_ENV === 'development' && value !== '') {
      console.log(`getDetailsValue - ${field}:`, value);
    }
    
    return value;
  }, [localData]);

  // ✅ 계약일에 따른 상환기간 옵션 메모이제이션
  const getRepaymentPeriodOptions = useMemo(() => {
    const contractDate = getDetailsValue('contractDate');
    const isAfter2012 = contractDate && new Date(contractDate) >= new Date('2012-01-01');
    
    if (isAfter2012) {
      return [
        { value: "", label: "선택하세요" },
        { value: "30", label: "30년 이상" },
        { value: "15", label: "15년 이상" },
        { value: "10", label: "10~15년" }
      ];
    } else {
      return [
        { value: "", label: "선택하세요" },
        { value: "30", label: "30년 이상" },
        { value: "15", label: "15년 이상" },
        { value: "less", label: "15년 미만" }
      ];
    }
  }, [getDetailsValue]);

  // ✅ 상세정보 업데이트 핸들러 최적화
  const handleDetailsChange = useCallback((detailKey, value) => {
    console.log('handleDetailsChange 호출:', { detailKey, value });
    
    setLocalData(prev => {
      const updated = {
        ...prev,
        'housing-loan': {
          ...prev['housing-loan'],
          details: {
            ...prev['housing-loan'].details,
            [detailKey]: value
          }
        }
      };
      
      // 상세정보 변경 시 금액 재계산
      if (updated['housing-loan'].inputAmount > 0) {
        const inputAmount = updated['housing-loan'].inputAmount;
        const newDetails = updated['housing-loan'].details;
        const recalculatedAmount = calculateHousingLoan(inputAmount, newDetails);
        updated['housing-loan'].amount = recalculatedAmount;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('재계산된 금액:', recalculatedAmount);
        }
      }
      
      return updated;
    });

    // ✅ 디바운싱된 Context 업데이트 (별도 useEffect에서 처리)
  }, [calculateHousingLoan]);

  // ✅ 입력값 변경 핸들러 최적화
  const handleInputChange = useCallback((field, value, type = 'checkbox') => {
    console.log('handleInputChange 호출:', { field, value, type });
    
    setLocalData(prev => {
      const updated = { ...prev };
      
      if (type === 'checkbox') {
        let autoAmount = 0;
        
        if (value && field === 'insurance') {
          autoAmount = calculateInsurance().annual;
        }
        
        if (field === 'housing-loan' && value) {
          updated[field] = {
            checked: true,
            amount: 0,
            inputAmount: 0,
            details: {
              contractDate: '',
              repaymentPeriod: '',
              interestType: '',
              repaymentType: ''
            }
          };
        } else {
          updated[field] = {
            ...updated[field],
            checked: value,
            amount: value ? autoAmount : 0
          };
        }
      } else if (type === 'amount') {
        const numValue = parseInt(value) || 0;
        let calculatedAmount = numValue;
        
        if (field === 'housing-rent') {
          calculatedAmount = calculateHousingRent(numValue);
        } else if (field === 'housing-loan') {
          const details = updated[field]?.details || {};
          calculatedAmount = calculateHousingLoan(numValue, details);
        }
        
        updated[field] = {
          ...updated[field],
          checked: numValue > 0,
          amount: calculatedAmount,
          inputAmount: numValue
        };
      }
      
      return updated;
    });
  }, [calculateInsurance, calculateHousingRent, calculateHousingLoan]);

  // ✅ 디바운싱된 Context 업데이트
  useEffect(() => {
    const hasValidData = Object.values(localData).some(item => 
      item.checked && (item.amount > 0 || item.inputAmount > 0)
    );
    
    if (hasValidData) {
      const timeoutId = setTimeout(() => {
        console.log('SpecialDeduction Context 업데이트:', localData);
        setSpecialDeduction(localData);
      }, 500); // 500ms 디바운싱

      return () => clearTimeout(timeoutId);
    }
  }, [
    // ✅ 필요한 primitive 값들만 의존성으로 설정
    localData.insurance?.checked,
    localData.insurance?.amount,
    localData['housing-rent']?.checked,
    localData['housing-rent']?.amount,
    localData['housing-loan']?.checked,
    localData['housing-loan']?.amount,
    localData['housing-loan']?.inputAmount,
    localData['housing-loan']?.details?.contractDate,
    localData['housing-loan']?.details?.repaymentPeriod,
    localData['housing-loan']?.details?.interestType,
    localData['housing-loan']?.details?.repaymentType,
    setSpecialDeduction
  ]);

  // ✅ 실시간 계산 결과 메모이제이션
  const calculationResult = useMemo(() => {
    return calculateSpecialDeduction(localData, salary);
  }, [localData, salary]);

  return (
    <div className="container">
      {/* 메인 카드 */}
      <div className="main-card">
        {/* 급여 정보 표시 */}
        {salary > 0 && (
          <div className="form-section" style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white',
            marginBottom: '30px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
              💰 입력하신 급여 정보
            </h3>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              총급여: {salary.toLocaleString()}만원
            </p>
          </div>
        )}

        {/* 설문지 항목들 */}
        <div className="form-section">
          {surveyOptions.map((option) => (
            <div key={ option.id} className="form-group" style={{ 
              border: '2px solid #e0e6ed', 
              borderRadius: '15px', 
              padding: '20px', 
              marginBottom: '15px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              transition: 'all 0.3s ease',
              borderColor: getCheckboxState(option) ? ' #667eea' : ' #e0e6ed'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  id={`special-${ option.id}`}
                  checked={getCheckboxState(option)}
                  onChange={(e) => handleInputChange( option.id, e.target.checked, 'checkbox')}
                  style={{
                    width: '20px',
                    height: '20px',
                    accentColor: ' #667eea'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <label 
                    htmlFor={`special-${ option.id}`}
                    style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      color: ' #2c3e50',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      display: 'block'
                    }}
                  >
                    {option.label}
                  </label>
                  <p style={{ 
                    color: ' #7f8c8d', 
                    fontSize: '0.9rem', 
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {option.description}
                  </p>
                </div>
              </div>

              {/* 자동계산 결과 표시 */}
              {option.hasAutoCalc && salary > 0 && getCheckboxState(option) && (
                <div style={{ 
                  background: 'rgba(102, 126, 234, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '15px'
                }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: ' #667eea' }}>
                    📊 자동 계산된 사회보험료
                  </p>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#555' }}>
                    월 납부액: {calculateInsurance().monthly.toLocaleString()}만원
                  </p>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#555' }}>
                    연간 납부액: {calculateInsurance().annual.toLocaleString()}만원
                  </p>
                </div>
              )}

              {/* 금액 입력 필드 */}
              {option.hasAmount && getCheckboxState(option) && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold', 
                    color: ' #2c3e50',
                    marginBottom: '8px',
                    display: 'block'
                  }}>
                    { option.id === 'housing-rent' ? '상환한 원리금 총액' : '이자 상환액'} (만원 단위)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={getAmountValue( option.id) || ''}
                      onChange={(e) => handleInputChange( option.id, e.target.value, 'amount')}
                      style={{
                        width: '200px',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #e0e6ed',
                        fontSize: '1rem'
                      }}
                    />
                    <span style={{ color: ' #7f8c8d' }}>만원</span>
                  </div>
                </div>
              )}

              {/* 상세정보 입력 (주택저당차입금만) */}
              {option.hasDetails && getCheckboxState(option) && (
                <div style={{ 
                  background: 'rgba(241, 196, 15, 0.1)',
                  borderRadius: '8px',
                  padding: '15px',
                  marginTop: '15px'
                }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', color: ' #f39c12' }}>
                    📋 대출 상세정보 (공제한도 계산용)
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {/* 계약일 */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: ' #2c3e50', marginBottom: '5px', display: 'block' }}>
                        대출 계약일
                      </label>
                      <input
                        type="date"
                        value={getDetailsValue('contractDate')}
                        onChange={(e) => handleDetailsChange('contractDate', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    {/* 상환기간 */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: ' #2c3e50', marginBottom: '5px', display: 'block' }}>
                        상환기간
                      </label>
                      <select
                        value={getDetailsValue('repaymentPeriod')}
                        onChange={(e) => handleDetailsChange('repaymentPeriod', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '0.9rem'
                        }}
                      >
                        {getRepaymentPeriodOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* 금리유형 */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: ' #2c3e50', marginBottom: '5px', display: 'block' }}>
                        금리유형
                      </label>
                      <select
                        value={getDetailsValue('interestType')}
                        onChange={(e) => handleDetailsChange('interestType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">선택하세요</option>
                        <option value="fixed">고정금리</option>
                        <option value="variable">변동금리</option>
                        <option value="mixed">혼합금리</option>
                      </select>
                    </div>

                    {/* 상환방식 */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: ' #2c3e50', marginBottom: '5px', display: 'block' }}>
                        상환방식
                      </label>
                      <select
                        value={getDetailsValue('repaymentType')}
                        onChange={(e) => handleDetailsChange('repaymentType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">선택하세요</option>
                        <option value="equal-payment">원리금균등상환</option>
                        <option value="equal-principal">원금균등상환</option>
                        <option value="interest-only">거치식상환</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 계산 결과 표시 */}
        {calculationResult.totalDeduction > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            borderRadius: '15px',
            padding: '20px',
            color: 'white',
            marginTop: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '20px',
            fontSize: '0.9rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}>
                <strong>사회보험료:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {(localData.insurance?.amount || 0).toLocaleString()}만원
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}>
                <strong>주택관련:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {((localData['housing-rent']?.amount || 0) + (localData['housing-loan']?.amount || 0)).toLocaleString()}만원
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}>
                <strong>총 특별소득공제:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {calculationResult.totalDeduction.toLocaleString()}만원
              </p>
            </div>
          </div>
        )}

        {/* 안내사항 */}
        <div style={{
          background: 'rgba(255, 193, 7, 0.1)',
          border: '2px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '10px',
          padding: '15px',
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '0.85rem', 
            color: '#856404',
            lineHeight: '1.5'
          }}>
            💡 <strong>특별소득공제 안내:</strong><br />
            • 사회보험료: 급여에서 자동공제되는 건강보험, 고용보험, 노인장기요양보험 100% 공제<br />
            • 주택임차차입금: 무주택 세대주 전세자금 대출 원리금 상환시 40% 공제 (최대 40만원)<br />
            • 주택저당차입금: 대출조건에 따라 공제한도가 달라집니다<br />
          </p>
        </div>
      </div>
    </div>
  );
});

// ✅ displayName 설정
SpecialDeductionInput.displayName = 'SpecialDeductionInput';

export default SpecialDeductionInput;
