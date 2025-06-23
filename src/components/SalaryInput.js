import React, { useState } from 'react';
import { useTax } from '../context/TaxContext';
import { formatNumber } from '../utils/calc';

/**
 * 총급여 입력 컴포넌트
 */
const SalaryInput = () => {
  // Context에서 상태와 액션들을 가져옴
  const { formData, setSalary, nextStep } = useTax();
  
  // 로컬 상태
  const [inputValue, setInputValue] = useState(formData.salary > 0 ? formData.salary.toString() : '');

  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
    setInputValue(value);
    
    if (value) {
      const numValue = parseInt(value, 10);
      setSalary(numValue); // 만원 단위로 저장
    } else {
      setSalary(0);
    }
  };

  // Enter 키 처리 및 다음 단계 이동
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && formData.salary > 0) {
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">1. 총급여</h2>
      <div className="flex items-center gap-4 mt-4">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="예: 5000"
          className="w-full max-w-xs px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-lg font-medium text-gray-600">만원</span>
      </div>
      {formData.salary > 0 && (
        <div className="mt-3 text-gray-700">
          입력된 금액: <span className="font-bold">{formatNumber(formData.salary * 10000)}원</span>
        </div>
      )}
    </div>
  );
};

export default SalaryInput; 