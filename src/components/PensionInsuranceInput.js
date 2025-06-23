import React from 'react';
import { useTax } from '../context/TaxContext';

/**
 * 연금보험료공제 입력 컴포넌트
 * Context API를 사용하여 상태를 관리합니다
 */
const PensionInsuranceInput = () => {
  // Context에서 상태와 액션들을 가져옴
  const { formData, setPensionInsurance, nextStep, prevStep } = useTax();
  const pensionInsurance = formData.pensionInsurance;
  const salary = formData.salary;
  // 국민연금 자동계산
  const calculateNationalPension = () => {
    if (salary > 0) {
      const monthlySalary = (salary * 10000) / 12; // 월급여
      const pensionRate = 0.045; // 4.5%
      const monthlyPension = Math.round(monthlySalary * pensionRate);
      const annualPension = monthlyPension * 12;
      return {
        monthly: monthlyPension,
        annual: annualPension
      };
    }
    return { monthly: 0, annual: 0 };
  };

  // 공무원연금 자동계산
  const calculatePublicPension = () => {
    if (salary > 0) {
      const monthlySalary = (salary * 10000) / 12; // 월급여
      const pensionRate = 0.09; // 9%
      const monthlyPension = Math.round(monthlySalary * pensionRate);
      const annualPension = monthlyPension * 12;
      return {
        monthly: monthlyPension,
        annual: annualPension
      };
    }
    return { monthly: 0, annual: 0 };
  };

  // 체크박스 변경 핸들러
  const handleCheckboxChange = (pensionType, checked) => {
    setPensionInsurance(prev => ({
      ...prev,
      [pensionType]: {
        checked,
        amount: checked ? (
          pensionType === 'national-pension' ? 
          calculateNationalPension().annual : 
          calculatePublicPension().annual
        ) : 0
      }
    }));
  };

  // 수동 입력 핸들러
  const handleManualInput = (pensionType, amount) => {
    setPensionInsurance(prev => ({
      ...prev,
      [pensionType]: {
        checked: amount > 0,
        amount: amount
      }
    }));
  };

  // 다음 단계로 이동
  const handleNext = () => {
    nextStep();
  };

  const nationalPension = calculateNationalPension();
  const publicPension = calculatePublicPension();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          💳 연금보험료공제
        </h2>
        <p className="text-gray-600">
          납부한 연금보험료 정보를 선택해주세요
        </p>
      </div>

      <div className="space-y-6">
        {/* 국민연금 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="national-pension"
              checked={pensionInsurance['national-pension']?.checked || false}
              onChange={(e) => handleCheckboxChange('national-pension', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
            />
            <div className="flex-1">
              <label htmlFor="national-pension" className="block">
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  국민연금 보험료
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  월급에서 자동으로 공제되는 국민연금 보험료 (급여의 4.5%)
                </p>
              </label>

              {/* 자동계산 결과 */}
              {salary > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="text-sm font-medium text-blue-800">
                    📊 자동 계산 결과
                  </p>
                  <p className="text-sm text-blue-700">
                    월 납부액: {nationalPension.monthly.toLocaleString()}원
                  </p>
                  <p className="text-sm text-blue-700">
                    연간 납부액: {nationalPension.annual.toLocaleString()}원
                  </p>
                </div>
              )}

              {/* 수동 입력 옵션 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  또는 직접 입력 (연간 총액, 원)
                </label>
                <input
                  type="number"
                  placeholder="예: 2700000"
                  value={pensionInsurance['national-pension']?.amount || ''}
                  onChange={(e) => handleManualInput('national-pension', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 공무원연금/사학연금 등 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="public-pension"
              checked={pensionInsurance['public-pension']?.checked || false}
              onChange={(e) => handleCheckboxChange('public-pension', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-1"
            />
            <div className="flex-1">
              <label htmlFor="public-pension" className="block">
                <h3 className="text-lg font-medium text-gray-800 mb-1">
                  공무원연금, 군인연금, 사학연금 등
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  공무원, 군인, 사립학교교직원, 별정우체국 연금 보험료 (급여의 9%)
                </p>
              </label>

              {/* 자동계산 결과 */}
              {salary > 0 && (
                <div className="bg-green-50 p-3 rounded-lg mb-3">
                  <p className="text-sm font-medium text-green-800">
                    📊 자동 계산 결과
                  </p>
                  <p className="text-sm text-green-700">
                    월 납부액: {publicPension.monthly.toLocaleString()}원
                  </p>
                  <p className="text-sm text-green-700">
                    연간 납부액: {publicPension.annual.toLocaleString()}원
                  </p>
                </div>
              )}

              {/* 수동 입력 옵션 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  또는 직접 입력 (연간 총액, 원)
                </label>
                <input
                  type="number"
                  placeholder="예: 5400000"
                  value={pensionInsurance['public-pension']?.amount || ''}
                  onChange={(e) => handleManualInput('public-pension', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 공제액 요약 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">💰 총 연금보험료공제</h4>
          <p className="text-lg font-medium text-blue-600">
            {(
              (pensionInsurance['national-pension']?.amount || 0) +
              (pensionInsurance['public-pension']?.amount || 0)
            ).toLocaleString()}원
          </p>
          <p className="text-sm text-gray-600 mt-1">
            연금보험료는 납부한 금액의 100%가 소득공제됩니다
          </p>
        </div>

        {/* 안내사항 */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">📌 참고사항</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 연금보험료는 납부한 금액의 100%를 소득공제받을 수 있습니다</li>
            <li>• 국민연금과 다른 연금은 중복 가입할 수 없습니다</li>
            <li>• 급여명세서나 연금 납부확인서에서 정확한 금액을 확인하세요</li>
          </ul>
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex space-x-3 pt-4">
          <button
            onClick={prevStep}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← 이전
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default PensionInsuranceInput; 