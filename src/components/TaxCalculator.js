import React, { useState } from 'react';
import { useTax } from '../context/TaxContext';
import { calculateTax, formatNumber, convertToWon, calculateLaborIncomeDeduction } from '../utils/calc';
import PersonalDeductionInput from './PersonalDeductionInput';
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
                    backgroundColor: '#3b82f6',
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
              <small style={{ color: '#6b7280', marginTop: '5px', display: 'block' }}>
                예: 5000 = 5,000만원 (50,000,000원)
              </small>
            </div>
          </div>
        </div>

        {/* 근로소득금액 표시 (그리드 형식) */}
        {formData.salary > 0 && (
          <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '1rem' }}>
              근로소득금액 계산
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem',
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '1rem', 
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>총급여</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {formatNumber(convertToWon(formData.salary))}
                </div>
              </div>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '1rem', 
                borderRadius: '6px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>근로소득공제</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
                  -{laborIncomeResult ? formatNumber(laborIncomeResult.amount) : '0만원'}
                </div>
              </div>
              <div style={{ 
                backgroundColor: 'white', 
                padding: '1rem', 
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                gridColumn: 'span 2'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>근로소득금액</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
                  {formatNumber(laborIncomeAmount)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 소득공제 섹션 제목 */}
        <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>2. 소득공제</h2>
          <p style={{ color: '#7f8c8d', marginTop: '0.5rem' }}>각종 소득공제 항목을 입력해주세요</p>
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
              <span>💰 연금보험료 공제</span>
              <span className={`chevron ${activeAccordion === 'pension' ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 'pension' ? 'show' : ''}`}>
              <div className="form-group">
                <label>연금보험료 입력 (원 단위)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="연금보험료를 입력하세요"
                  value={formData.pensionInsurance || ''}
                  onChange={(e) => setPensionInsurance(parseInt(e.target.value) || 0)}
                />
              </div>
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
              <div className="form-group">
                <label>특별소득공제 입력 (원 단위)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="특별소득공제를 입력하세요"
                  value={formData.specialDeduction || ''}
                  onChange={(e) => setSpecialDeduction(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* 그밖의 소득공제 아코디언 */}
          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion('other')}
            >
              <span>📝 그밖의 소득공제</span>
              <span className={`chevron ${activeAccordion === 'other' ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 'other' ? 'show' : ''}`}>
              <div className="form-group">
                <label>기타 공제액 입력 (원 단위)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="기타 공제액을 입력하세요"
                  value={formData.otherDeduction || ''}
                  onChange={(e) => setOtherDeduction(parseInt(e.target.value) || 0)}
                />
              </div>
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