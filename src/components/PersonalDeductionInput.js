import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { calculatePersonalDeduction, formatNumber } from '../utils/calc';

/**
 * 인적공제 입력 컴포넌트 - 설문지 형태
 * index.css 스타일을 사용하여 구현
 */
const PersonalDeductionInput = () => {
  // Context에서 상태와 액션들을 가져옴
  const { formData, setPersonalDeduction } = useTax();
  const personalDeduction = formData.personalDeduction || {};

  // 로컬 상태로 입력값 관리 (더 안정적인 입력 처리를 위해)
  const [localData, setLocalData] = useState({
    self: { checked: true, count: 1 },
    spouse: { checked: false, count: 0 },
    parents: { checked: false, count: 0 },
    children: { checked: false, count: 0 },
    siblings: { checked: false, count: 0 },
    senior: { checked: false, count: 0 },
    disabled: { checked: false, count: 0 },
    'single-parent': { checked: false, count: 0 },
    female: { checked: false, count: 0 }
  });

  // Context 데이터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (personalDeduction && Object.keys(personalDeduction).length > 0) {
      setLocalData(prev => ({
        ...prev,
        ...personalDeduction
      }));
    }
  }, [personalDeduction]);


  // 설문지 옵션들
  const surveyOptions = [
    {
      id: 'self',
      label: '본인',
      description: '본인은 기본적으로 공제 대상입니다',
      type: 'checkbox',
      defaultChecked: true
    },
    {
      id: 'spouse',
      label: '배우자',
      description: '배우자의 연소득이 100만원 이하인 경우',
      type: 'checkbox'
    },
    {
      id: 'parents',
      label: '부모/조부모',
      description: '60세 이상이고 연소득 100만원 이하인 직계존속',
      type: 'number',
      placeholder: '부모/조부모 수'
    },
    {
      id: 'children',
      label: '자녀/손자녀',
      description: '20세 이하이거나 연소득 100만원 이하인 직계비속',
      type: 'number',
      placeholder: '자녀/손자녀 수'
    },
    {
      id: 'siblings',
      label: '형제자매',
      description: '60세 이상 또는 20세 이하이고 연소득 100만원 이하',
      type: 'number',
      placeholder: '형제자매 수'
    },
    {
      id: 'senior',
      label: '경로우대 (70세 이상)',
      description: '70세 이상 부양가족 1인당 100만원 추가공제',
      type: 'number',
      placeholder: '70세 이상 부양가족 수'
    },
    {
      id: 'disabled',
      label: '장애인',
      description: '장애인 부양가족 1인당 200만원 추가공제',
      type: 'number',
      placeholder: '장애인 부양가족 수'
    },
    {
      id: 'single-parent',
      label: '한부모 가정',
      description: '한부모 가정의 경우 100만원 추가공제 (부녀자 공제와 중복시 우선 적용)',
      type: 'checkbox'
    },
    {
      id: 'female',
      label: '부녀자',
      description: '부녀자의 경우 50만원 추가공제 (한부모 공제와 중복시 한부모 공제 우선)',
      type: 'checkbox'
    }
  ];

  // 입력값 변경 핸들러 - 로컬 상태 사용
  const handleInputChange = (field, value, type = 'count') => {
   // console.log('handleInputChange 호출:', { field, value, type });
    
    // 임시 테스트: 모든 입력을 콘솔에 출력
    //alert(`${field} 필드가 ${value}로 변경되었습니다. (타입: ${type})`);
    
    setLocalData(prev => {
      const updated = { ...prev };
      
      if (type === 'checkbox') {
        // 체크박스의 경우: checked와 count를 모두 업데이트
        updated[field] = {
          checked: value,
          count: value ? 1 : 0
        };
      } else {
        // 숫자 입력의 경우: count를 업데이트하고 checked는 count > 0으로 설정
        const numValue = parseInt(value) || 0;
        updated[field] = {
          checked: numValue > 0,
          count: numValue
        };
      }
      

      
      // Context도 함께 업데이트
      setPersonalDeduction(updated);
      
      return updated;
    });
  };

  // 체크박스 상태 확인 함수 - 로컬 상태 사용
  const getCheckboxState = (option) => {
    const fieldData = localData[option.id];
    
    if (option.defaultChecked) {
      // 기본값이 true인 경우 (본인)
      return fieldData?.checked !== false; // 명시적으로 false가 아니면 true
    }
    
    return fieldData?.checked || false;
  };

  // 숫자 입력값 확인 함수 - 로컬 상태 사용
  const getNumberValue = (option) => {
    const fieldData = localData[option.id];
    return fieldData?.count || 0;
  };

  // 실시간 계산 결과 - 로컬 상태 사용
  const calculationResult = calculatePersonalDeduction(localData);

  return (
    <div className="container">
      {/* 헤더 */}
{/*       <div className="header">
        <h1>👥 인적공제 설문</h1>
        <p>부양가족 정보를 입력해주세요</p>
      </div> */}

      {/* 메인 카드 */}
      <div className="main-card">
        {/* 설문지 제목 */}
{/*         <div className="form-section">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#2c3e50' }}>
            인적공제 대상자 설문
          </h2>
          <p style={{ color: '#7f8c8d', marginBottom: '2rem' }}>
            해당하는 항목을 모두 선택해주세요
          </p>
        </div> */}

        {/* 설문지 항목들 */}
        <div className="form-section">
          {surveyOptions.map((option) => (
            <div key={option.id} className="form-group" style={{ 
              border: '2px solid #e0e6ed', 
              borderRadius: '15px', 
              padding: '20px', 
              marginBottom: '15px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                {/* 체크박스 또는 숫자 입력 */}
                <div style={{ flexShrink: 0, marginTop: '5px' }}>
                  {option.type === 'checkbox' ? (
                    <input
                      type="checkbox"
                      id={option.id}
                      checked={getCheckboxState(option)}
                      onChange={(e) => handleInputChange(option.id, e.target.checked, 'checkbox')}
                      style={{
                        width: '20px',
                        height: '20px',
                        accentColor: '#667eea'
                      }}
                    />
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={getNumberValue(option)}
                      onChange={(e) => handleInputChange(option.id, parseInt(e.target.value) || 0)}
                      className="form-control"
                      style={{ width: '80px', textAlign: 'center' }}
                      placeholder="0"
                    />
                  )}
                </div>

                {/* 라벨과 설명 */}
                <div style={{ flex: 1 }}>
                  <label htmlFor={option.id} style={{ marginBottom: 0, cursor: 'pointer' }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#2c3e50', 
                      marginBottom: '5px',
                      fontSize: '1.1rem'
                    }}>
                      {option.label}
                    </div>
                    <div style={{ 
                      color: '#7f8c8d', 
                      fontSize: '0.9rem',
                      lineHeight: '1.4'
                    }}>
                      {option.description}
                    </div>
                  </label>
                </div>

                {/* 공제액 표시 */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    color: '#667eea',
                    minWidth: '80px'
                  }}>
                    {(() => {
                      let count = 0;
                      
                      if (option.type === 'checkbox') {
                        count = getCheckboxState(option) ? 1 : 0;
                      } else {
                        count = getNumberValue(option);
                      }
                      
                      if (count === 0) return '0원';
                      
                      let unitAmount = 1500000; // 기본공제
                      if (option.id === 'senior') unitAmount = 1000000; // 경로우대
                      else if (option.id === 'disabled') unitAmount = 2000000; // 장애인
                      else if (option.id === 'single-parent') unitAmount = 1000000; // 한부모
                      else if (option.id === 'female') unitAmount = 500000; // 부녀자
                      
                      return `${formatNumber(count * unitAmount)}원`;
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            fontSize: '0.9rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}><strong>기본공제:</strong> {calculationResult.basicDeductionCount}명</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatNumber(calculationResult.basicDeduction)}원</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}><strong>추가공제:</strong></p>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatNumber(calculationResult.additionalDeduction)}원</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '5px', opacity: 0.9 }}><strong>총 인적공제:</strong></p>
              <p style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>{formatNumber(calculationResult.totalDeduction)}원</p>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
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
            💡 <strong>인적공제 안내:</strong><br />
            • 기본공제: 1인당 150만원 (본인, 배우자, 부모, 자녀, 형제자매)<br />
            • 경로우대: 70세 이상 1인당 100만원 추가<br />
            • 장애인: 1인당 200만원 추가<br />
            • 한부모: 100만원 추가 (부녀자 공제와 중복시 우선)<br />
            • 부녀자: 50만원 추가
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalDeductionInput; 