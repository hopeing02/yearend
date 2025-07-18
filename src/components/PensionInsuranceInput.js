import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { calculatePensionInsurance, formatNumber } from '../utils/calc';

/**
 * 연금보험료공제 설문지 컴포넌트 (PersonalDeductionInput 스타일 적용)
 * index.css 스타일을 사용하여 PersonalDeductionInput과 동일한 UI 형태로 구현
 */
const PensionInsuranceInput = () => {
  const { formData, setPensionInsurance } = useTax();
  const pensionInsurance = formData.pensionInsurance || {};
  const salary = formData.salary; // 만원 단위

  // 로컬 상태로 입력값 관리
  const [localData, setLocalData] = useState({
    'national-pension': { checked: false, amount: 0 },
    'public-pension': { checked: false, amount: 0 }
  });

  // Context 데이터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (pensionInsurance && Object.keys(pensionInsurance).length > 0) {
      setLocalData(prev => ({
        ...prev,
        ...pensionInsurance
      }));
    }
  }, [pensionInsurance]);

  // 국민연금 자동계산 (만원 단위)
  const calculateNationalPension = () => {
    if (salary > 0) {
      const salaryInWon = salary * 10000;
      const monthlySalaryWon = salaryInWon / 12;
      const pensionRate = 0.045; // 4.5%
      const monthlyPensionWon = Math.round(monthlySalaryWon * pensionRate);
      const annualPensionWon = monthlyPensionWon * 12;
      
      return {
        monthly: Math.round(monthlyPensionWon / 10000),
        annual: Math.round(annualPensionWon / 10000)
      };
    }
    return { monthly: 0, annual: 0 };
  };

  // 공무원연금 자동계산 (만원 단위)
  const calculatePublicPension = () => {
    if (salary > 0) {
      const salaryInWon = salary * 10000;
      const monthlySalaryWon = salaryInWon / 12;
      const pensionRate = 0.09; // 9%
      const monthlyPensionWon = Math.round(monthlySalaryWon * pensionRate);
      const annualPensionWon = monthlyPensionWon * 12;
      
      return {
        monthly: Math.round(monthlyPensionWon / 10000),
        annual: Math.round(annualPensionWon / 10000)
      };
    }
    return { monthly: 0, annual: 0 };
  };

  // 설문지 옵션들
  const surveyOptions = [
    {
      id: 'none',
      label: '연금보험료를 납부하지 않았습니다',
      description: '연금에 가입되어 있지 않거나 본인이 납부하지 않는 경우',
      type: 'radio'
    },
    {
      id: 'national-pension',
      label: '국민연금 보험료를 납부하였습니다',
      description: '월급에서 자동으로 공제되는 국민연금 (급여의 4.5%)',
      type: 'radio',
      hasAmount: true
    },
    {
      id: 'public-pension',
      label: '공무원연금, 군인연금, 사립학교교직원연금, 별정우체국연금을 납부하셨나요?',
      description: '공무원, 군인, 사학, 우정직 등의 연금보험료 (급여의 9%)',
      type: 'radio',
      hasAmount: true
    }
  ];

  // 현재 선택된 연금 타입 확인
  const getSelectedPensionType = () => {
    if (localData['national-pension']?.checked) return 'national-pension';
    if (localData['public-pension']?.checked) return 'public-pension';
    return 'none';
  };

  // 라디오 버튼 상태 확인 함수
  const getRadioState = (option) => {
    return getSelectedPensionType() === option.id;
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field, value, type = 'radio') => {
    console.log('handleInputChange 호출:', { field, value, type });
    
    setLocalData(prev => {
      const updated = {
        'national-pension': { checked: false, amount: 0 },
        'public-pension': { checked: false, amount: 0 }
      };
      
      if (type === 'radio' && field !== 'none') {
        // 라디오 버튼 선택 시 자동 계산
        let autoAmount = 0;
        if (field === 'national-pension') {
          autoAmount = calculateNationalPension().annual;
        } else if (field === 'public-pension') {
          autoAmount = calculatePublicPension().annual;
        }
        
        updated[field] = {
          checked: true,
          amount: autoAmount
        };
      } else if (type === 'amount') {
        // 수동 금액 입력
        const numValue = parseInt(value) || 0;
        updated[field] = {
          checked: numValue > 0,
          amount: numValue
        };
      }
      
      console.log('로컬 상태 업데이트:', updated);
      
      // Context도 함께 업데이트
      setPensionInsurance(updated);
      
      return updated;
    });
  };

  // 숫자 입력값 확인 함수
  const getAmountValue = (optionId) => {
    const fieldData = localData[optionId];
    return fieldData?.amount || 0;
  };

  // 실시간 계산 결과
  const calculationResult = calculatePensionInsurance(localData, salary);
  const selectedType = getSelectedPensionType();

  return (
    <div className="container">
      {/* 헤더 */}
{/*       <div className="header">
        <h1>💳 연금보험료 설문</h1>
        <p>납부하고 계신 연금 종류를 선택해주세요</p>
      </div> */}

      {/* 메인 카드 */}
      <div className="main-card">
        {/* 설문지 제목 */}
{/*         <div className="form-section">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: ' #2c3e50' }}>
            연금보험료공제 대상 설문
          </h2>
          <p style={{ color: ' #7f8c8d', marginBottom: '2rem' }}>
            2024년도에 납부하신 연금보험료에 해당하는 항목을 선택해주세요
          </p>
        </div> */}

        {/* 급여 정보 표시 */}
{/*         {salary > 0 && (
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
        )} */}

        {/* 설문지 항목들 - PersonalDeductionInput과 동일한 스타일 */}
        <div className="form-section">
          {surveyOptions.map((option) => (
            <div key={ option.id} className="form-group" style={{ 
              border: '2px solid #e0e6ed', 
              borderRadius: '15px', 
              padding: '20px', 
              marginBottom: '15px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              transition: 'all 0.3s ease',
              borderColor: getRadioState(option) ? ' #667eea' : ' #e0e6ed'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                {/* 라디오 버튼 */}
                <div style={{ flexShrink: 0, marginTop: '5px' }}>
                  <input
                    type="radio"
                    id={`pension-${ option.id}`}
                    name="pension-type"
                    checked={getRadioState(option)}
                    onChange={() => handleInputChange( option.id, true, 'radio')}
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
                    htmlFor={`pension-${ option.id}`}
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
                  {option.hasAmount && salary > 0 && getRadioState(option) && (
                    <div style={{ 
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '15px'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: ' #667eea' }}>
                        📊 자동 계산된 연금보험료
                      </p>
                      { option.id === 'national-pension' && (
                        <>
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#555' }}>
                            월 납부액: {calculateNationalPension().monthly.toLocaleString()}만원
                          </p>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#555' }}>
                            연간 납부액: {calculateNationalPension().annual.toLocaleString()}만원
                          </p>
                        </>
                      )}
                      { option.id === 'public-pension' && (
                        <>
                          <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#555' }}>
                            월 납부액: {calculatePublicPension().monthly.toLocaleString()}만원
                          </p>
                          <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#555' }}>
                            연간 납부액: {calculatePublicPension().annual.toLocaleString()}만원
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* 수동 입력 필드 - 선택된 항목에만 표시 */}
                  {option.hasAmount && getRadioState(option) && (
                    <div>
                      <label style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 'bold', 
                        color: ' #2c3e50',
                        marginBottom: '8px',
                        display: 'block'
                      }}>
                        실제 납부액이 다르다면 직접 입력 (만원 단위)
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder={ option.id === 'national-pension' ? "예: 270" : "예: 540"}
                        value={getAmountValue( option.id) || ''}
                        onChange={(e) => handleInputChange( option.id, e.target.value, 'amount')}
                        style={{ fontSize: '1rem', padding: '12px' }}
                      />
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: ' #7f8c8d' }}>
                        만원 단위로 입력하세요 (예: 270만원 → 270)
                      </p>
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
                    color: getRadioState(option) ? ' #667eea' : ' #bbb'
                  }}>
                    {(() => {
                      if (!getRadioState(option)) return '0만원';
                      const amount = getAmountValue( option.id);
                      return `${amount.toLocaleString()}만원`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 계산 결과 요약 - PersonalDeductionInput과 동일한 스타일 */}
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            fontSize: '0.9rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}>
                <strong>선택한 연금:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {selectedType === 'none' ? '없음' :
                 selectedType === 'national-pension' ? '국민연금' : '공무원/특수직연금'}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}>
                <strong>총 연금보험료:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {calculationResult.totalPension.toLocaleString()}만원
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}>
                <strong>소득공제액:</strong>
              </p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {calculationResult.totalPension.toLocaleString()}만원 (100%)
              </p>
            </div>
          </div>
        </div>

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
            💡 <strong>연금보험료공제 안내:</strong><br />
            • 연금보험료: 납부한 금액의 100% 소득공제 (급여명세서 확인)<br />
            • 국민연금과 다른 연금은 중복 가입 불가<br />
            • 회사에서 대신 납부하는 경우에도 본인 부담분만 공제<br />
          </p>
        </div>
        {/* 안내사항 */}
{/*         <div className="form-section" style={{ 
          background: 'rgba(255, 193, 7, 0.1)',
          border: '2px solid #ffc107',
          borderRadius: '15px',
          padding: '20px'
        }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '15px', color: ' #e67e22' }}>
            📌 참고사항
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: ' #7f8c8d', lineHeight: '1.6' }}>
            <li>연금보험료는 납부한 금액의 100%를 소득공제받을 수 있습니다</li>
            <li>국민연금과 다른 연금은 중복 가입할 수 없습니다</li>
            <li>급여명세서의 '국민연금' 또는 해당 연금 항목을 확인하세요</li>
            <li>회사에서 대신 납부하는 경우에도 본인 부담분만 공제됩니다</li>
            <li>모든 금액은 만원 단위로 입력하시면 됩니다</li>
          </ul>
        </div> */}
      </div>
    </div>
  );
};

export default PensionInsuranceInput;