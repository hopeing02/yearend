import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateLaborIncomeDeduction, 
  calculatePersonalDeduction, 
  calculatePensionInsurance,
  calculateTaxBaseAndAmount,
  calculateLaborIncomeTaxDeduction,
  calculateFinalTax,
  formatNumber 
} from '../utils/calc';

/**
 * 메인 세금 계산기 컴포넌트
 * 사용자가 요청한 이미지와 유사한 UI로 재구성
 */
const TaxCalculator = () => {
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedPersonalTarget, setSelectedPersonalTarget] = useState('');
  const [salary, setSalary] = useState('');
  const [pensionAmount, setPensionAmount] = useState('');
  const [specialDeduction, setSpecialDeduction] = useState('');
  const [otherDeduction, setOtherDeduction] = useState('');
  const [personalCount, setPersonalCount] = useState(1);
  const [calculationResult, setCalculationResult] = useState(null);

  // 아코디언 토글 함수
  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  // 계산 수행 함수
  const performCalculation = () => {
    if (!salary || !selectedPersonalTarget) return;

    const salaryInWon = Number(salary) * 10000; // 만원을 원으로 변환
    
    // 1. 근로소득공제 계산
    const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);
    
    // 2. 인적공제 데이터 구성
    const personalDeductionData = {
      target: selectedPersonalTarget,
      self: { checked: selectedPersonalTarget === '본인', count: selectedPersonalTarget === '본인' ? 1 : 0 },
      spouse: { checked: selectedPersonalTarget === '배우자', count: selectedPersonalTarget === '배우자' ? 1 : 0 },
      parents: { checked: selectedPersonalTarget === '부모', count: selectedPersonalTarget === '부모' ? personalCount : 0 },
      children: { checked: selectedPersonalTarget === '자녀', count: selectedPersonalTarget === '자녀' ? personalCount : 0 },
      siblings: { checked: selectedPersonalTarget === '형제자매', count: selectedPersonalTarget === '형제자매' ? personalCount : 0 },
      senior: { checked: selectedPersonalTarget === '경로우대', count: selectedPersonalTarget === '경로우대' ? personalCount : 0 },
      disabled: { checked: selectedPersonalTarget === '장애인', count: selectedPersonalTarget === '장애인' ? personalCount : 0 },
      'single-parent': { checked: selectedPersonalTarget === '한부모', count: selectedPersonalTarget === '한부모' ? 1 : 0 },
      female: { checked: selectedPersonalTarget === '부녀자', count: selectedPersonalTarget === '부녀자' ? 1 : 0 }
    };
    
    // 3. 인적공제 계산
    const personalDeductionResult = calculatePersonalDeduction(personalDeductionData);
    
    // 4. 연금보험료공제 계산
    const pensionData = {
      target: selectedPersonalTarget,
      'national-pension': { checked: !!pensionAmount, amount: Number(pensionAmount) || 0 },
      'public-pension': { checked: false, amount: 0 }
    };
    const pensionResult = calculatePensionInsurance(pensionData, salaryInWon);
    
    // 5. 과세표준 및 산출세액 계산
    const taxBaseResult = calculateTaxBaseAndAmount({
      salary: salaryInWon,
      laborIncomeDeduction: laborIncomeResult.amount,
      personalDeduction: personalDeductionResult.totalDeduction,
      pensionDeduction: pensionResult.totalPension,
      specialDeduction: Number(specialDeduction) || 0,
      otherDeduction: Number(otherDeduction) || 0
    });
    
    // 6. 근로소득세액공제 계산
    const laborTaxDeduction = calculateLaborIncomeTaxDeduction(taxBaseResult.calculatedTax);
    
    // 7. 최종 세액 계산
    const finalResult = calculateFinalTax({
      calculatedTax: taxBaseResult.calculatedTax,
      taxReduction: 0,
      taxDeductions: { laborIncome: laborTaxDeduction.deduction },
      currentPaidTax: 0,
      previousTax: 0
    });

    // 계산 결과 저장
    setCalculationResult({
      salary: salaryInWon,
      laborIncomeResult,
      personalDeductionResult,
      pensionResult,
      taxBaseResult,
      finalResult
    });

    // 채팅 메시지 업데이트
    const newMessages = [
      { type: 'user', content: `총급여: ${formatNumber(salaryInWon)}` },
      { type: 'user', content: `인적공제 대상자: ${selectedPersonalTarget}` },
      { type: 'system', content: `근로소득공제: ${formatNumber(laborIncomeResult.amount)}` },
      { type: 'system', content: `인적공제: ${formatNumber(personalDeductionResult.totalDeduction)}` },
      { type: 'system', content: `연금보험료공제: ${formatNumber(pensionResult.totalPension)}` },
      { type: 'system', content: `과세표준: ${formatNumber(taxBaseResult.taxBase)}` },
      { type: 'system', content: `산출세액: ${formatNumber(taxBaseResult.calculatedTax)}` },
      { type: 'system', content: `결정세액: ${formatNumber(finalResult.finalTax)}` }
    ];
    setChatMessages(newMessages);
  };

  // 입력값 변경 시 계산 수행
  useEffect(() => {
    if (salary && selectedPersonalTarget) {
      performCalculation();
    }
  }, [salary, selectedPersonalTarget, pensionAmount, personalCount, specialDeduction, otherDeduction]);

  // 총급여 입력 완료 시 채팅 메시지 추가
  const handleSalarySubmit = (salaryValue) => {
    setSalary(salaryValue);
  };

  // 공제 대상자 선택 핸들러
  const handlePersonalTargetChange = (target) => {
    setSelectedPersonalTarget(target);
  };

  // 연금보험료 입력 핸들러
  const handlePensionChange = (value) => {
    setPensionAmount(value);
  };

  // 특별소득공제 선택 핸들러
  const handleSpecialDeductionChange = (type) => {
    setSpecialDeduction(type);
  };

  // 그밖의 소득공제 입력 핸들러
  const handleOtherDeductionChange = (value) => {
    setOtherDeduction(value);
  };

  // 인원 수 변경 핸들러
  const handlePersonalCountChange = (value) => {
    setPersonalCount(Number(value) || 1);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🧮 연말정산 계산기</h1>
        <p>2024년 연말정산을 간편하게 계산해보세요</p>
      </div>

      <div className="main-card">
        {/* 총급여 입력 섹션 */}
        <div className="day-card">
          <div
            className="day-header"
            onClick={() => toggleAccordion(0)}
          >
            <span>1. 총급여</span>
            <span className={`chevron ${activeAccordion === 0 ? 'rotate' : ''}`}>▼</span>
          </div>
          <div className={`day-content ${activeAccordion === 0 ? 'show' : ''}`}>
            <div className="form-group">
              <label>총급여 입력 (만원 단위)</label>
              <input
                type="number"
                className="form-control"
                placeholder="총급여를 입력하세요 (예: 5000)"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSalarySubmit(e.target.value);
                    setActiveAccordion(null);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* 소득공제 섹션 제목 */}
        <div className="mt-8 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">2. 소득공제</h2>
          <p className="text-gray-600 mt-1">각종 소득공제 항목을 입력해주세요</p>
        </div>

        {/* 소득공제 섹션 - 카드 그리드 형태 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion(1)}
            >
              <span>👨‍👩‍👧‍👦 인적공제</span>
              <span className={`chevron ${activeAccordion === 1 ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 1 ? 'show' : ''}`}>
              <div className="form-group">
                <label>공제 대상자 선택</label>
                <div className="radio-group">
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal1" 
                      checked={selectedPersonalTarget === '본인'}
                      onChange={() => handlePersonalTargetChange('본인')}
                    />
                    <label htmlFor="personal1">본인</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal2" 
                      checked={selectedPersonalTarget === '배우자'}
                      onChange={() => handlePersonalTargetChange('배우자')}
                    />
                    <label htmlFor="personal2">배우자</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal3" 
                      checked={selectedPersonalTarget === '부모'}
                      onChange={() => handlePersonalTargetChange('부모')}
                    />
                    <label htmlFor="personal3">부모</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal4" 
                      checked={selectedPersonalTarget === '자녀'}
                      onChange={() => handlePersonalTargetChange('자녀')}
                    />
                    <label htmlFor="personal4">자녀</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal5" 
                      checked={selectedPersonalTarget === '형제자매'}
                      onChange={() => handlePersonalTargetChange('형제자매')}
                    />
                    <label htmlFor="personal5">형제자매</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal6" 
                      checked={selectedPersonalTarget === '경로우대'}
                      onChange={() => handlePersonalTargetChange('경로우대')}
                    />
                    <label htmlFor="personal6">경로우대</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal7" 
                      checked={selectedPersonalTarget === '장애인'}
                      onChange={() => handlePersonalTargetChange('장애인')}
                    />
                    <label htmlFor="personal7">장애인</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal8" 
                      checked={selectedPersonalTarget === '한부모'}
                      onChange={() => handlePersonalTargetChange('한부모')}
                    />
                    <label htmlFor="personal8">한부모</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="personal" 
                      id="personal9" 
                      checked={selectedPersonalTarget === '부녀자'}
                      onChange={() => handlePersonalTargetChange('부녀자')}
                    />
                    <label htmlFor="personal9">부녀자</label>
                  </div>
                </div>
                
                {/* 선택된 대상자에 따른 추가 입력 필드 */}
                {selectedPersonalTarget && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">
                      {selectedPersonalTarget} 공제 정보
                    </h4>
                    {['부모', '자녀', '형제자매', '경로우대', '장애인'].includes(selectedPersonalTarget) && (
                      <div className="form-group">
                        <label>인원 수</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="인원 수를 입력하세요"
                          min="1"
                          max="10"
                          value={personalCount}
                          onChange={(e) => handlePersonalCountChange(e.target.value)}
                        />
                      </div>
                    )}
                    {['본인', '배우자', '한부모', '부녀자'].includes(selectedPersonalTarget) && (
                      <div className="text-sm text-blue-600">
                        {selectedPersonalTarget === '본인' && '본인은 기본적으로 공제 대상입니다.'}
                        {selectedPersonalTarget === '배우자' && '배우자의 연소득이 100만원 이하인 경우 적용됩니다.'}
                        {selectedPersonalTarget === '한부모' && '한부모 가정의 경우 100만원 추가공제가 적용됩니다.'}
                        {selectedPersonalTarget === '부녀자' && '부녀자의 경우 50만원 추가공제가 적용됩니다.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion(2)}
            >
              <span>💰 연금보험료 공제</span>
              <span className={`chevron ${activeAccordion === 2 ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 2 ? 'show' : ''}`}>
              <div className="form-group">
                <label>연금보험료 입력 (원 단위)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="연금보험료를 입력하세요"
                  value={pensionAmount}
                  onChange={(e) => handlePensionChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion(3)}
            >
              <span>🏥 특별소득공제</span>
              <span className={`chevron ${activeAccordion === 3 ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 3 ? 'show' : ''}`}>
              <div className="form-group">
                <label>특별소득공제 선택</label>
                <div className="radio-group">
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="special" 
                      id="special1" 
                      checked={specialDeduction === '보험료'}
                      onChange={() => handleSpecialDeductionChange('보험료')}
                    />
                    <label htmlFor="special1">보험료</label>
                  </div>
                  <div className="radio-item">
                    <input 
                      type="radio" 
                      name="special" 
                      id="special2" 
                      checked={specialDeduction === '의료비'}
                      onChange={() => handleSpecialDeductionChange('의료비')}
                    />
                    <label htmlFor="special2">의료비</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="day-card">
            <div
              className="day-header"
              onClick={() => toggleAccordion(4)}
            >
              <span>📝 그밖의 소득공제</span>
              <span className={`chevron ${activeAccordion === 4 ? 'rotate' : ''}`}>▼</span>
            </div>
            <div className={`day-content ${activeAccordion === 4 ? 'show' : ''}`}>
              <div className="form-group">
                <label>기타 공제액 입력 (원 단위)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="기타 공제액을 입력하세요"
                  value={otherDeduction}
                  onChange={(e) => handleOtherDeductionChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 계산 결과 화면 */}
      <div className="main-card results" style={{ display: chatMessages.length > 0 ? 'block' : 'none' }}>
        <h3 className="text-xl font-semibold mb-4">계산 결과</h3>
        <div className="space-y-2">
          {chatMessages.map((message, index) => (
            <div key={index} className={`p-3 rounded-lg ${
              message.type === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {message.content}
            </div>
          ))}
        </div>
        
        {/* 상세 계산 결과 */}
        {calculationResult && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h4 className="font-bold text-lg mb-3">📊 상세 계산 내역</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>총급여:</strong> {formatNumber(calculationResult.salary)}</p>
                <p><strong>근로소득공제:</strong> {formatNumber(calculationResult.laborIncomeResult.amount)}</p>
                <p><strong>인적공제:</strong> {formatNumber(calculationResult.personalDeductionResult.totalDeduction)}</p>
                <p><strong>연금보험료공제:</strong> {formatNumber(calculationResult.pensionResult.totalPension)}</p>
              </div>
              <div>
                <p><strong>과세표준:</strong> {formatNumber(calculationResult.taxBaseResult.taxBase)}</p>
                <p><strong>산출세액:</strong> {formatNumber(calculationResult.taxBaseResult.calculatedTax)}</p>
                <p><strong>세액공제:</strong> {formatNumber(calculationResult.finalResult.totalTaxDeduction)}</p>
                <p><strong>결정세액:</strong> {formatNumber(calculationResult.finalResult.finalTax)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <p>💡 이 계산기는 기본적인 연말정산 항목만 포함합니다. 정확한 계산을 위해서는 세무 전문가와 상담하세요.</p>
      </div>
    </div>
  );
};

export default TaxCalculator; 