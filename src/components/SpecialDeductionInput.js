import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateSpecialDeduction, 
  calculateInsuranceAmount, 
  calculateHousingRentDeduction, 
  calculateHousingLoanDeduction,
  formatNumber 
} from '../utils/calc';

/**
 * 특별소득공제 입력 컴포넌트 (PersonalDeductionInput 스타일 적용)
 * index.css 스타일을 사용하여 PersonalDeductionInput과 동일한 UI 형태로 구현
 */
const SpecialDeductionInput = () => {
  const { formData, setSpecialDeduction } = useTax();
  const specialDeduction = formData.specialDeduction || {};
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

  // Context 데이터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (specialDeduction && Object.keys(specialDeduction).length > 0) {
      setLocalData(prev => ({
        ...prev,
        ...specialDeduction
      }));
    }
  }, [specialDeduction]);

  // 사회보험료 자동계산 - calc.js 함수 사용
  const calculateInsurance = () => {
    const annualAmount = calculateInsuranceAmount(salary);
    const monthlyAmount = Math.round(annualAmount / 12);
    
    return {
      monthly: monthlyAmount,
      annual: annualAmount
    };
  };

  // 주택임차차입금 공제액 계산 - calc.js 함수 사용
  const calculateHousingRent = (inputAmount) => {
    return calculateHousingRentDeduction(inputAmount);
  };

  // 주택저당차입금 이자상환액 공제 한도 계산 - calc.js 함수 사용
  const calculateHousingLoan = (inputAmount, details) => {
    return calculateHousingLoanDeduction(inputAmount, details);
  };

  // 설문지 옵션들
  const surveyOptions = [
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
  ];

  // 체크박스 상태 확인 함수
  const getCheckboxState = (option) => {
    const fieldData = localData[ option.id];
    return fieldData?.checked || false;
  };

  // 숫자 입력값 확인 함수
  const getAmountValue = (optionId) => {
    const fieldData = localData[optionId];
    return fieldData?.amount || 0;
  };

  // 상세정보 업데이트 핸들러 (별도 함수로 분리)
  const handleDetailsChange = (detailKey, value) => {
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
      
      console.log('상세정보 업데이트 후:', updated['housing-loan'].details);
      
      // 상세정보 변경 시 금액 재계산
      if (updated['housing-loan'].inputAmount > 0) {
        const inputAmount = updated['housing-loan'].inputAmount;
        const newDetails = updated['housing-loan'].details;
        const recalculatedAmount = calculateHousingLoan(inputAmount, newDetails);
        updated['housing-loan'].amount = recalculatedAmount;
        console.log('재계산된 금액:', recalculatedAmount);
      }
      
      // Context도 함께 업데이트
      setSpecialDeduction(updated);
      
      return updated;
    });
  };

  // 상세정보 확인 함수
  const getDetailsValue = (field) => {
    const value = localData['housing-loan']?.details?.[field] || '';
    console.log('getDetailsValue:', { field, value, details: localData['housing-loan']?.details });
    return value;
  };

    // 계약일에 따른 상환기간 옵션 반환
    const getRepaymentPeriodOptions = () => {
      const contractDate = getDetailsValue('contractDate');
      const isAfter2012 = contractDate && new Date(contractDate) >= new Date('2012-01-01');
      
      if (isAfter2012) {
        // 2012년 이후 계약
        return [
          { value: "", label: "선택하세요" },
          { value: "30", label: "30년 이상" },
          { value: "15", label: "15년 이상" },
          { value: "10", label: "10~15년" }
        ];
      } else {
        // 2012년 이전 계약 (또는 날짜 미입력)
        return [
          { value: "", label: "선택하세요" },
          { value: "30", label: "30년 이상" },
          { value: "15", label: "15년 이상" },
          { value: "less", label: "15년 미만" }
        ];
      }
    };

  // 입력값 변경 핸들러
  const handleInputChange = (field, value, type = 'checkbox') => {
    console.log('handleInputChange 호출:', { field, value, type });
    
    setLocalData(prev => {
      const updated = { ...prev };
      
      if (type === 'checkbox') {
        let autoAmount = 0;
        
        if (value && field === 'insurance') {
          // 사회보험료 자동 계산
          autoAmount = calculateInsurance().annual;
        }
        
        // housing-loan 체크박스 선택 시 details 초기화 확인
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
          inputAmount: numValue // 원래 입력값도 저장
        };
      }
      
      console.log('로컬 상태 업데이트:', updated);
      
      // Context도 함께 업데이트
      setSpecialDeduction(updated);
      
      return updated;
    });
  };

  // 실시간 계산 결과
  const calculationResult = calculateSpecialDeduction(localData, salary);

  return (
    <div className="container">
      {/* 헤더 */}
      <div className="header">
        <h1>🏥 특별소득공제 설문</h1>
        <p>특별소득공제 항목을 선택해주세요</p>
      </div>

      {/* 메인 카드 */}
      <div className="main-card">
        {/* 설문지 제목 */}
        <div className="form-section">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: ' #2c3e50' }}>
            특별소득공제 대상 설문
          </h2>
          <p style={{ color: ' #7f8c8d', marginBottom: '2rem' }}>
            해당하는 특별소득공제 항목을 모두 선택해주세요
          </p>
        </div>

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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                {/* 체크박스 */}
                <div style={{ flexShrink: 0, marginTop: '5px' }}>
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
                </div>

                {/* 라벨과 설명 */}
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
                    marginBottom: '12px',
                    lineHeight: '1.5'
                  }}>
                    {option.description}
                  </p>

                  {/* 자동계산 결과 표시 */}
                  {option.hasAutoCalc && salary > 0 && getCheckboxState(option) && option.id === 'insurance' && (
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

                  {/* 금액 입력 필드 - 선택된 항목에만 표시 */}
                  {option.hasAmount && getCheckboxState(option) && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 'bold', 
                        color: ' #2c3e50',
                        marginBottom: '8px',
                        display: 'block'
                      }}>
                        { option.id === 'housing-rent' ? '연간 원리금 상환액 (만원 단위)' : '연간 이자상환액 (만원 단위)'}
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder={ option.id === 'housing-rent' ? "예: 1000" : "예: 800"}
                        value={localData[ option.id]?.inputAmount || ''}
                        onChange={(e) => handleInputChange( option.id, e.target.value, 'amount')}
                        style={{ fontSize: '1rem', padding: '12px' }}
                      />
                      { option.id === 'housing-rent' && (
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: ' #7f8c8d' }}>
                          40% 공제, 최대 400만원
                        </p>
                      )}
                    </div>
                  )}

                  {/* 주택저당차입금 상세정보 */}
                  {option.hasDetails && getCheckboxState(option) && (
                    <div style={{ 
                      background: 'rgba(255, 193, 7, 0.1)',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      padding: '15px',
                      marginTop: '15px'
                    }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px', color: ' #e67e22' }}>
                        📋 대출 상세정보
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            대출 계약일
                          </label>
                          <input
                            type="date"
                            className="form-control"
                            value={getDetailsValue('contractDate')}
                            onChange={(e) => {
                              console.log('날짜 변경:', e.target.value);
                              handleDetailsChange('contractDate', e.target.value);
                            }}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          />
                          {getDetailsValue('contractDate') && (
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.7rem', color: ' #667eea' }}>
                              {new Date(getDetailsValue('contractDate')) >= new Date('2012-01-01') ? 
                                '📅 2012년 이후 계약' : '📅 2012년 이전 계약'}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            상환기간
                          </label>
                          <select
                            className="form-control"
                            value={getDetailsValue('repaymentPeriod')}
                            onChange={(e) => {
                              console.log('상환기간 변경:', e.target.value);
                              handleDetailsChange('repaymentPeriod', e.target.value);
                            }}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                            disabled={!getDetailsValue('contractDate')}
                          >
                            {getRepaymentPeriodOptions().map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {!getDetailsValue('contractDate') && (
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.7rem', color: ' #e67e22' }}>
                              먼저 계약일을 선택하세요
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            금리유형
                          </label>
                          <select
                            className="form-control"
                            value={getDetailsValue('interestType')}
                            onChange={(e) => {
                              console.log('금리유형 변경:', e.target.value);
                              handleDetailsChange('interestType', e.target.value);
                            }}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          >
                            <option value="">선택하세요</option>
                            <option value="fixed">고정금리</option>
                            <option value="variable">변동금리</option>
                          </select>
                        </div>
                        
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            상환방식
                          </label>
                          <select
                            className="form-control"
                            value={getDetailsValue('repaymentType')}
                            onChange={(e) => {
                              console.log('상환방식 변경:', e.target.value);
                              handleDetailsChange('repaymentType', e.target.value);
                            }}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          >
                            <option value="">선택하세요</option>
                            <option value="installment">비거치식분할상환</option>
                            <option value="other">기타</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 계산된 공제액 표시 */}
                <div style={{ 
                  textAlign: 'right', 
                  minWidth: '120px',
                  flexShrink: 0
                }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: ' #7f8c8d',
                    marginBottom: '5px'
                  }}>
                    연간 공제액
                  </div>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold',
                    color: getCheckboxState(option) ? ' #667eea' : ' #bbb'
                  }}>
                    {(() => {
                      if (!getCheckboxState(option)) return '0만원';
                      const amount = getAmountValue( option.id);
                      return `${amount.toLocaleString()}만원`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 계산 결과 요약 */}
        <div className="form-section" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '15px',
          padding: '25px',
          color: 'white',
          marginTop: '30px'
        }}>
          <h3 style={{ 
            fontSize: '1.3rem', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            📊 계산 결과
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
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
        </div>

        {/* 안내사항 */}
        <div className="form-section" style={{ 
          background: 'rgba(255, 193, 7, 0.1)',
          border: '2px solid #ffc107',
          borderRadius: '15px',
          padding: '20px'
        }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '15px', color: ' #e67e22' }}>
            📌 참고사항
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: ' #7f8c8d', lineHeight: '1.6' }}>
            <li>사회보험료는 급여에서 자동공제되는 건강보험, 고용보험, 노인장기요양보험입니다</li>
            <li>주택임차차입금은 무주택 세대주가 전세자금 대출 원리금 상환시 40% 공제 (최대 40만원)</li>
            <li>주택저당차입금은 대출조건에 따라 공제한도가 달라집니다</li>
            <li>모든 금액은 만원 단위로 입력하시면 됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpecialDeductionInput;
