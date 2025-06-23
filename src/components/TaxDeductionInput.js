import React from 'react';
import { useTax } from '../context/TaxContext';

/**
 * 세액공제 입력 컴포넌트
 * Context API를 사용하여 상태를 관리합니다
 */
const TaxDeductionInput = () => {
  // Context에서 상태와 액션들을 가져옴
  const { formData, setTaxDeduction, nextStep, prevStep } = useTax();
  const taxDeduction = formData.taxDeduction;
  
  // 입력값 변경 핸들러
  const handleInputChange = (field, value) => {
    setTaxDeduction(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 자녀세액공제 계산
  const calculateChildDeduction = () => {
    const childCount = taxDeduction.childCount || 0;
    const deductionPerChild = 150000; // 15만원
    const maxDeduction = 300000; // 최대 30만원
    return Math.min(childCount * deductionPerChild, maxDeduction);
  };

  // 연금계좌세액공제 계산
  const calculatePensionAccountDeduction = () => {
    const amount = taxDeduction.pensionAccount || 0;
    return Math.min(amount * 0.15, 300000); // 15%, 최대 30만원
  };

  // 월세액 세액공제 계산
  const calculateRentDeduction = () => {
    const monthlyRent = taxDeduction.monthlyRent || 0;
    const rentMonths = taxDeduction.rentMonths || 0;
    const annualRent = monthlyRent * rentMonths;
    return Math.min(annualRent * 0.1, 750000); // 10%, 최대 75만원
  };

  // ISA 세액공제 계산
  const calculateISADeduction = () => {
    const amount = taxDeduction.isaAmount || 0;
    return Math.min(amount * 0.15, 300000); // 15%, 최대 30만원
  };

  // 특별세액공제 계산
  const calculateSpecialDeduction = () => {
    const medical = taxDeduction.medicalExpenses || 0;
    const education = taxDeduction.educationExpenses || 0;
    const donation = taxDeduction.donationAmount || 0;
    
    const medicalDeduction = Math.min(medical * 0.15, 300000);
    const educationDeduction = Math.min(education * 0.15, 300000);
    const donationDeduction = Math.min(donation * 0.15, 300000);
    
    return medicalDeduction + educationDeduction + donationDeduction;
  };

  // 총 세액공제 계산
  const getTotalDeduction = () => {
    return calculateChildDeduction() +
           calculatePensionAccountDeduction() +
           calculateRentDeduction() +
           calculateISADeduction() +
           calculateSpecialDeduction();
  };

  return (
    <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow-md">
      {/* 헤더 */}
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          💎 세액공제
        </h2>
        <p className="text-gray-600">
          세액공제 항목별로 금액을 입력해주세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 자녀세액공제 */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
            👶 자녀세액공제
          </h3>
          <p className="mb-3 text-sm text-gray-600">
            8세 이상 20세 이하 자녀 (1인당 15만원, 최대 2명 30만원)
          </p>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                자녀 수
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={taxDeduction.childCount || 0}
                onChange={(e) => handleInputChange('childCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="자녀 수를 입력하세요"
              />
            </div>
            <div className="text-sm font-medium text-blue-600">
              공제액: {calculateChildDeduction().toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 연금계좌세액공제 */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
            🏦 연금계좌세액공제
          </h3>
          <p className="mb-3 text-sm text-gray-600">
            연금저축, IRP 납입액 (15%, 최대 30만원)
          </p>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                연간 납입액 (원)
              </label>
              <input
                type="number"
                min="0"
                value={taxDeduction.pensionAccount || 0}
                onChange={(e) => handleInputChange('pensionAccount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="연금계좌 납입액을 입력하세요"
              />
            </div>
            <div className="text-sm font-medium text-blue-600">
              공제액: {calculatePensionAccountDeduction().toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 월세액세액공제 */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
            🏠 월세액세액공제
          </h3>
          <p className="mb-3 text-sm text-gray-600">
            월세 납부액 (10%, 최대 75만원)
          </p>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                월 임대료 (원)
              </label>
              <input
                type="number"
                min="0"
                value={taxDeduction.monthlyRent || 0}
                onChange={(e) => handleInputChange('monthlyRent', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="월 임대료를 입력하세요"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                납부 개월 수
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={taxDeduction.rentMonths || 0}
                onChange={(e) => handleInputChange('rentMonths', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="납부 개월 수를 입력하세요"
              />
            </div>
            <div className="text-sm font-medium text-blue-600">
              공제액: {calculateRentDeduction().toLocaleString()}원
            </div>
          </div>
        </div>

        {/* ISA 세액공제 */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
            📈 ISA 세액공제
          </h3>
          <p className="mb-3 text-sm text-gray-600">
            ISA 만기시 재가입 납입액 (15%, 최대 30만원)
          </p>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                납입액 (원)
              </label>
              <input
                type="number"
                min="0"
                value={taxDeduction.isaAmount || 0}
                onChange={(e) => handleInputChange('isaAmount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="ISA 납입액을 입력하세요"
              />
            </div>
            <div className="text-sm font-medium text-blue-600">
              공제액: {calculateISADeduction().toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 의료비세액공제 */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
            🏥 의료비세액공제
          </h3>
          <p className="mb-3 text-sm text-gray-600">
            의료비 지출액 (15%, 최대 30만원)
          </p>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                의료비 지출액 (원)
              </label>
              <input
                type="number"
                min="0"
                value={taxDeduction.medicalExpenses || 0}
                onChange={(e) => handleInputChange('medicalExpenses', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="의료비 지출액을 입력하세요"
              />
            </div>
            <div className="text-sm font-medium text-blue-600">
              공제액: {Math.min((taxDeduction.medicalExpenses || 0) * 0.15, 300000).toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 교육비세액공제 */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
            🎓 교육비세액공제
          </h3>
          <p className="mb-3 text-sm text-gray-600">
            교육비 지출액 (15%, 최대 30만원)
          </p>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                교육비 지출액 (원)
              </label>
              <input
                type="number"
                min="0"
                value={taxDeduction.educationExpenses || 0}
                onChange={(e) => handleInputChange('educationExpenses', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="교육비 지출액을 입력하세요"
              />
            </div>
            <div className="text-sm font-medium text-blue-600">
              공제액: {Math.min((taxDeduction.educationExpenses || 0) * 0.15, 300000).toLocaleString()}원
            </div>
          </div>
        </div>

        {/* 기부금세액공제 */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="flex items-center mb-3 text-lg font-medium text-gray-800">
            ❤️ 기부금세액공제
          </h3>
          <p className="mb-3 text-sm text-gray-600">
            기부금액 (15%, 최대 30만원)
          </p>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                기부금액 (원)
              </label>
              <input
                type="number"
                min="0"
                value={taxDeduction.donationAmount || 0}
                onChange={(e) => handleInputChange('donationAmount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="기부금액을 입력하세요"
              />
            </div>
            <div className="text-sm font-medium text-blue-600">
              공제액: {Math.min((taxDeduction.donationAmount || 0) * 0.15, 300000).toLocaleString()}원
            </div>
          </div>
        </div>
      </div>

      {/* 총 세액공제 요약 */}
      <div className="p-4 mt-6 rounded-lg bg-blue-50">
        <h4 className="mb-2 font-medium text-gray-800">💰 총 세액공제</h4>
        <p className="text-2xl font-bold text-blue-600">
          {getTotalDeduction().toLocaleString()}원
        </p>
        <p className="mt-1 text-sm text-gray-600">
          위 금액이 계산세액에서 차감됩니다
        </p>
      </div>

      {/* 안내사항 */}
      <div className="p-4 mt-6 rounded-lg bg-yellow-50">
        <h4 className="mb-2 font-medium text-yellow-800">📌 참고사항</h4>
        <ul className="space-y-1 text-sm text-yellow-700">
          <li>• 세액공제는 계산된 세액에서 직접 차감됩니다</li>
          <li>• 각 항목별로 한도가 적용됩니다</li>
          <li>• 소득공제와 달리 세액에서 직접 빠지므로 절세효과가 큽니다</li>
        </ul>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={prevStep}
          className="flex-1 px-4 py-3 font-medium text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← 이전
        </button>
        <button
          onClick={nextStep}
          className="flex-1 px-4 py-3 font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          결과 보기 →
        </button>
      </div>
    </div>
  );
};

export default TaxDeductionInput;
