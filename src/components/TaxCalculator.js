import React, { useState } from 'react';
import { useTax } from '../context/TaxContext';
import SalaryInput from './SalaryInput';
import PersonalDeductionInput from './PersonalDeductionInput';
import PensionInsuranceInput from './PensionInsuranceInput';
import TaxDeductionInput from './TaxDeductionInput';
import ResultChat from './ResultChat';

/**
 * 메인 세금 계산기 컴포넌트
 * 사용자가 요청한 이미지와 유사한 UI로 재구성
 */
const TaxCalculator = () => {
  const [activeAccordion, setActiveAccordion] = useState(0); // 0: 인적공제, 1: 연금, 2: 세액공제

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const steps = [
    { title: '👨‍👩‍👧‍👦 인적공제', component: <PersonalDeductionInput /> },
    { title: '💰 연금·보험료 공제', component: <PensionInsuranceInput /> },
    { title: '📋 특별·세액공제', component: <TaxDeductionInput /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      {/* 왼쪽 입력 영역 */}
      <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 space-y-8">
        {/* 1. 총급여 섹션 */}
        <SalaryInput isInlineLayout={true} />

        {/* 2. 소득공제 섹션 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">2. 소득공제</h2>
          <p className="text-gray-600 mt-1 mb-6">각종 소득공제 항목을 입력해주세요</p>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <div 
                  className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleAccordion(index)}
                >
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <span className={`transform transition-transform duration-300 ${activeAccordion === index ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
                {activeAccordion === index && (
                  <div className="bg-gray-50 p-4">
                    {step.component}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 결과 영역 */}
      <div className="lg:col-span-2 lg:sticky lg:top-8 lg:self-start">
        <ResultChat />
      </div>
    </div>
  );
};

export default TaxCalculator; 