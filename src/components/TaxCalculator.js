import React, { useState } from 'react';
import { useTax } from '../context/TaxContext';
import { calculateTax, formatNumber } from '../utils/calc';
import PersonalDeductionInput from './PersonalDeductionInput';
import ResultDisplay from './ResultDisplay';

/**
 * 세금 계산기 메인 컴포넌트
 * 아코디언 형태의 UI로 구성
 */
const TaxCalculator = () => {
  const { formData, setSalary, setPensionInsurance, setSpecialDeduction, setOtherDeduction } = useTax();
  const [activeAccordion, setActiveAccordion] = useState('salary');

  // 아코디언 토글 핸들러
  const toggleAccordion = (section) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  // 실시간 계산
  const calculationResult = calculateTax(formData);

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
              <label>총급여 입력 (원 단위)</label>
              <input
                type="number"
                className="form-control"
                placeholder="총급여를 입력하세요 (예: 50000000)"
                value={formData.salary || ''}
                onChange={(e) => setSalary(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

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
        {calculationResult && calculationResult.salary > 0 && (
          <div className="main-card" style={{ marginTop: '2rem' }}>
            <ResultDisplay calculationResult={calculationResult} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxCalculator; 