import React, { useState } from 'react';
import { useTax } from '../context/TaxContext';
import { calculateTax, formatNumber, convertToWon, calculateLaborIncomeDeduction } from '../utils/calc';
import PersonalDeductionInput from './PersonalDeductionInput';
import PensionInsuranceInput from './PensionInsuranceInput';
import SpecialDeductionInput from './SpecialDeductionInput';
import OtherDeductionInput from './OtherDeductionInput';
import ResultDisplay from './ResultDisplay';

/**
 * 세금 계산기 메인 컴포넌트
 * 아코디언 형태의 UI로 구성
 */
const TaxCalculator = () => {
  const { formData, setSalary, setPensionInsurance, setSpecialDeduction, setOtherDeduction } = useTax();
  const [activeAccordion, setActiveAccordion] = useState('salary');
  const [showResult, setShowResult] = useState(false);
  const [calculationResult, setCalculationResult] = useState(null);

  // 아코디언 토글 핸들러
  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  // 계산하기 버튼 핸들러
  const handleCalculate = () => {
    if (formData.salary > 0) {
      const result = calculateTax(formData);
      setCalculationResult(result);
      setShowResult(true);
    }
  };

  // 근로소득금액 계산
  const laborIncomeResult = formData.salary > 0 ? 
    calculateLaborIncomeDeduction(convertToWon(formData.salary)) : null;
  const laborIncomeAmount = laborIncomeResult ? 
    convertToWon(formData.salary) - laborIncomeResult.amount : 0;

  return (
    <div className="container">
      {/* 헤더 */}
      <div className="header">
        <h1>🧮 연말정산 계산기</h1>
        <p>2024년 연말정산을 간편하게 계산해보세요</p>
      </div>

      <div className="main-card">
        {/* 총급여 입력 섹션 */}
        <div className="day-card">
          <div
            className="day-header"
            onClick={() => toggleAccordion('salary')}
          >
            <span>1. 총급여</span>
            <span className={`chevron ${activeAccordion === 'salary' ? 'rotate' : ''}`}>▼</span>
          </div>
          <div className={`day-content ${activeAccordion === 'salary' ? 'show' : ''}`}>
            <div className="form-group">
              <label>총급여 입력 (만원 단위)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="총급여를 입력하세요 (예: 5000)"
                  value={formData.salary || ''}
                  onChange={(e) => setSalary(parseInt(e.target.value) || 0)}
                  style={{ flex: 1 }}
                />
                <button
                  onClick={handleCalculate}
                  disabled={!formData.salary || formData.salary <= 0}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: ' #3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: formData.salary && formData.salary > 0 ? 'pointer' : 'not-allowed',
                    opacity: formData.salary && formData.salary > 0 ? 1 : 0.6
                  }}
                >
                  계산하기
                </button>
              </div>
              {/* 총급여 정보 표시 */}
              {formData.salary > 0 && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: ' #f0f8ff', 
                  borderRadius: '5px',
                  fontSize: '14px'
                }}>
                  <p style={{ margin: 0, color: ' #2563eb' }}>
                    💰 총급여: {formData.salary}만원 ({formatNumber(convertToWon(formData.salary))}원)
                  </p>
                  {laborIncomeResult && (
                    <p style={{ margin: '5px 0 0 0', color: '#059669' }}>
                      📊 근로소득공제: {formatNumber(laborIncomeResult.amount)}원
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 소득공제 섹션 헤더 */}
        <div style={{ 
          textAlign: 'center', 
          margin: '2rem 0 1.5rem 0',
          padding: '1rem',
          backgroundColor: ' #f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ color: ' #1e293b', margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            📋 소득공제
          </h2>
          <p style={{ color: ' #7f8c8d', marginTop: '0.5rem' }}>각종 소득공제 항목을 입력해주세요</p>
        </div>

        {/* 소득공제 섹션 - 카드 그리드 형태 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {/* 인적공제 아코디언 */}
          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion('personal')}
            >
              <span>👨‍👩‍👧‍👦 인적공제</span>
              <span className={`chevron ${activeAccordion === 'personal' ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 'personal' ? 'show' : ''}`}>
              <PersonalDeductionInput />
            </div>
          </div>

          {/* 연금보험료공제 아코디언 */}
          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion('pension')}
            >
              <span>💳 연금보험료공제</span>
              <span className={`chevron ${activeAccordion === 'pension' ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 'pension' ? 'show' : ''}`}>
              <PensionInsuranceInput />
            </div>
          </div>

          {/* 특별소득공제 아코디언 */}
          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion('special')}
            >
              <span>🏥 특별소득공제</span>
              <span className={`chevron ${activeAccordion === 'special' ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 'special' ? 'show' : ''}`}>
              <SpecialDeductionInput />
            </div>
          </div>

          {/* 그밖의 소득공제 아코디언 - OtherDeductionInput 컴포넌트 사용 */}
          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion('other')}
            >
              <span>📝 그밖의 소득공제</span>
              <span className={`chevron ${activeAccordion === 'other' ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 'other' ? 'show' : ''}`}>
              <OtherDeductionInput />
            </div>
          </div>
        </div>

        {/* 계산 결과 화면 */}
        {showResult && calculationResult && (
          <div className="main-card" style={{ marginTop: '2rem' }}>
            <ResultDisplay calculationResult={calculationResult} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxCalculator;