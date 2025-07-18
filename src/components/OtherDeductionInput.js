import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateOtherDeduction, 
  calculateHousingSavingsDeduction, 
  calculateCreditCardDeduction,
  formatNumber 
} from '../utils/calc';

/**
 * 그밖의 소득공제 입력 컴포넌트 (PersonalDeductionInput 스타일 적용)
 * index.css 스타일을 사용하여 PersonalDeductionInput과 동일한 UI 형태로 구현
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
      inputAmount: 0
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

  // Context 데이터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (otherDeduction && Object.keys(otherDeduction).length > 0) {
      setLocalData(prev => ({
        ...prev,
        ...otherDeduction
      }));
    }
  }, [otherDeduction]);

  // 주택청약종합저축 공제 계산 - calc.js 함수 사용
  const calculateHousingSavings = (inputAmount) => {
    return calculateHousingSavingsDeduction(inputAmount);
  };

  // 신용카드 공제 계산 - calc.js 함수 사용
  const calculateCreditCard = (details) => {
    return calculateCreditCardDeduction(details, salary);
  };

  // 설문지 옵션들
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
  const calculationResult = calculateOtherDeduction(localData, salary);

  return (
    <div className="container">
      {/* 헤더 */}
      <div className="header">
        <h1>📝 그밖의 소득공제 설문</h1>
        <p>그밖의 소득공제 항목을 선택해주세요</p>
      </div>

      {/* 메인 카드 */}
      <div className="main-card">
        {/* 설문지 제목 */}
        <div className="form-section">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: ' #2c3e50' }}>
            그밖의 소득공제 대상 설문
          </h2>
          <p style={{ color: ' #7f8c8d', marginBottom: '2rem' }}>
            해당하는 그밖의 소득공제 항목을 모두 선택해주세요
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
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              📊 신용카드 등 소득공제 기준금액 (총급여의 25%): {Math.round(salary * 0.25).toLocaleString()}만원
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
                    id={`other-${ option.id}`}
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
                    htmlFor={`other-${ option.id}`}
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

                  {/* 금액 입력 필드 - 주택청약종합저축 */}
                  {option.hasAmount && getCheckboxState(option) && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 'bold', 
                        color: ' #2c3e50',
                        marginBottom: '8px',
                        display: 'block'
                      }}>
                        연간 납입액 (만원 단위)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="예: 300"
                        value={getAmountValue( option.id) || ''}
                        onChange={(e) => handleInputChange( option.id, e.target.value, 'amount')}
                        style={{ fontSize: '1rem', padding: '12px' }}
                      />
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: ' #7f8c8d' }}>
                        40% 공제, 최대 300만원 한도
                      </p>
                    </div>
                  )}

                  {/* 신용카드 상세정보 */}
                  {option.hasDetails && getCheckboxState(option) && (
                    <div style={{ 
                      background: 'rgba(255, 193, 7, 0.1)',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      padding: '15px',
                      marginTop: '15px'
                    }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px', color: ' #e67e22' }}>
                        📋 카드 사용금액 상세정보 (만원 단위)
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            신용카드 사용금액 (15%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="예: 1000"
                            value={getDetailsValue('credit-card', 'credit') || ''}
                            onChange={(e) => handleInputChange('credit-card-credit', e.target.value, 'details')}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            체크카드/현금영수증 (30%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="예: 500"
                            value={getDetailsValue('credit-card', 'check') || ''}
                            onChange={(e) => handleInputChange('credit-card-check', e.target.value, 'details')}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            전통시장 사용금액 (40%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="예: 200"
                            value={getDetailsValue('credit-card', 'traditional') || ''}
                            onChange={(e) => handleInputChange('credit-card-traditional', e.target.value, 'details')}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            대중교통 사용금액 (40%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="예: 100"
                            value={getDetailsValue('credit-card', 'transport') || ''}
                            onChange={(e) => handleInputChange('credit-card-transport', e.target.value, 'details')}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            도서/공연/박물관/미술관 (30%)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="예: 50"
                            value={getDetailsValue('credit-card', 'culture') || ''}
                            onChange={(e) => handleInputChange('credit-card-culture', e.target.value, 'details')}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          />
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.7rem', color: ' #e67e22' }}>
                            ※ 총급여 7천만원 이하자만 적용
                          </p>
                        </div>
                        
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                            2023년 카드 사용금액
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="예: 1500"
                            value={getDetailsValue('credit-card', 'lastYear') || ''}
                            onChange={(e) => handleInputChange('credit-card-lastYear', e.target.value, 'details')}
                            style={{ fontSize: '0.9rem', padding: '8px' }}
                          />
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.7rem', color: ' #e67e22' }}>
                            ※ 전년 대비 증가분 계산용
                          </p>
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
                      console.log('공제액 표시 계산:', { 
                        optionId: option.id, 
                        checked: getCheckboxState(option),
                        localData: localData[ option.id]
                      });
                      
                      if (!getCheckboxState(option)) return '0만원';
                      const fieldData = localData[ option.id];
                      const amount = fieldData?.amount || 0;
                      return `${amount.toLocaleString()}만원`;
                    })()}
                  </div>
                  
                  {/* 디버깅 정보 표시 */}
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '5px' }}>
                      { option.id === 'housing-savings' && (
                        <div>
                          입력: {localData[ option.id]?.inputAmount || 0}<br/>
                          공제: {localData[ option.id]?.amount || 0}
                        </div>
                      )}
                      { option.id === 'credit-card' && (
                        <div>
                          총사용: {(() => {
                            const details = localData[ option.id]?.details || {};
                            return (details.credit || 0) + (details.check || 0) + 
                                   (details.traditional || 0) + (details.transport || 0) + 
                                   (details.culture || 0);
                          })()}<br/>
                          공제: {localData[ option.id]?.amount || 0}
                        </div>
                      )}
                    </div>
                  )}
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
                <strong>주택청약저축:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {(localData['housing-savings']?.amount || 0).toLocaleString()}만원
              </p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                (입력: {(localData['housing-savings']?.inputAmount || 0).toLocaleString()}만원)
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}>
                <strong>신용카드등:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {(localData['credit-card']?.amount || 0).toLocaleString()}만원
              </p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                (총사용: {(() => {
                  const details = localData['credit-card']?.details || {};
                  return ((details.credit || 0) + (details.check || 0) + 
                         (details.traditional || 0) + (details.transport || 0) + 
                         (details.culture || 0)).toLocaleString();
                })()}만원)
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}>
                <strong>총 그밖의소득공제:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {calculationResult.totalDeduction.toLocaleString()}만원
              </p>
            </div>
          </div>
          
          {/* 개발 모드에서 상세 디버깅 정보 */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '10px' }}>🔧 디버깅 정보</h4>
              <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
                {JSON.stringify({
                  localData,
                  calculationResult,
                  salary
                }, null, 2)}
              </pre>
            </div>
          )}
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
            <li>주택청약종합저축은 무주택 세대주만 공제 가능 (연 300만원 한도, 40% 공제)</li>
            <li>신용카드 등은 총급여의 25%를 초과하는 금액부터 공제 가능</li>
            <li>도서/공연/박물관/미술관은 총급여 7천만원 이하자만 30% 공제</li>
            <li>전통시장, 대중교통은 40% 공제율 적용</li>
            <li>모든 금액은 만원 단위로 입력하시면 됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OtherDeductionInput;

