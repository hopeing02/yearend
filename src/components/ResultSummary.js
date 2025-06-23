import React, { useState } from 'react';
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
 * 카드형 연말정산 결과 요약 컴포넌트
 * Context API를 사용하여 상태를 관리하고 
 * 깔끔한 카드 스타일로 결과를 표시합니다
 */
const ResultSummary = () => {
  const { formData, prevStep, resetForm } = useTax();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'detail', 'input'

  // 모든 계산 수행
  const salaryInWon = formData.salary * 10000;
  const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);
  const personalDeductionResult = calculatePersonalDeduction(formData.personalDeduction);
  const pensionResult = calculatePensionInsurance(formData.pensionInsurance, salaryInWon);
  
  const taxBaseResult = calculateTaxBaseAndAmount({
    salary: salaryInWon,
    laborIncomeDeduction: laborIncomeResult.amount,
    personalDeduction: personalDeductionResult.totalDeduction,
    pensionDeduction: pensionResult.totalPension,
    specialDeduction: 0,
    otherDeduction: 0
  });
  
  const laborTaxDeduction = calculateLaborIncomeTaxDeduction(taxBaseResult.calculatedTax);
  
  const totalTaxDeductions = {
    laborIncome: laborTaxDeduction.deduction,
    child: Math.min((formData.taxDeduction.childCount || 0) * 150000, 300000),
    pensionAccount: Math.min((formData.taxDeduction.pensionAccount || 0) * 0.15, 300000),
    rent: Math.min((formData.taxDeduction.monthlyRent || 0) * (formData.taxDeduction.rentMonths || 0) * 0.1, 750000),
    isa: Math.min((formData.taxDeduction.isaAmount || 0) * 0.15, 300000),
    medical: Math.min((formData.taxDeduction.medicalExpenses || 0) * 0.15, 300000),
    education: Math.min((formData.taxDeduction.educationExpenses || 0) * 0.15, 300000),
    donation: Math.min((formData.taxDeduction.donationAmount || 0) * 0.15, 300000)
  };
  
  const finalResult = calculateFinalTax({
    calculatedTax: taxBaseResult.calculatedTax,
    taxReduction: 0,
    taxDeductions: totalTaxDeductions,
    currentPaidTax: 0,
    previousTax: 0
  });

  // 절약된 세액 계산 (기본 세율로 가정한 경우와의 차이)
  const savedAmount = taxBaseResult.calculatedTax - finalResult.finalTax;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🎉 연말정산 완료!</h1>
          <p className="text-blue-100">2024년 연말정산 계산 결과입니다</p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'summary' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 요약
          </button>
          <button
            onClick={() => setActiveTab('detail')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'detail' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 상세 계산
          </button>
          <button
            onClick={() => setActiveTab('input')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'input' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 입력 정보
          </button>
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-6">
        {/* 요약 탭 */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* 최종 결과 하이라이트 */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">최종 결정세액</h2>
                <p className="text-4xl font-bold text-green-600 mb-2">
                  {formatNumber(finalResult.finalTax)}원
                </p>
                <p className="text-sm text-gray-600">
                  세액공제로 {formatNumber(savedAmount)}원 절약했어요! 🎊
                </p>
              </div>
            </div>

            {/* 주요 지표 카드 */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">💰</div>
                <h3 className="font-medium text-blue-800 mb-1">총급여</h3>
                <p className="text-lg font-bold text-blue-600">
                  {formatNumber(salaryInWon)}원
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-medium text-green-800 mb-1">과세표준</h3>
                <p className="text-lg font-bold text-green-600">
                  {formatNumber(taxBaseResult.taxBase)}원
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium text-yellow-800 mb-1">산출세액</h3>
                <p className="text-lg font-bold text-yellow-600">
                  {formatNumber(taxBaseResult.calculatedTax)}원
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl mb-2">✨</div>
                <h3 className="font-medium text-purple-800 mb-1">세액공제</h3>
                <p className="text-lg font-bold text-purple-600">
                  {formatNumber(finalResult.totalTaxDeduction)}원
                </p>
              </div>
            </div>

            {/* 계산 플로우 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-4">💡 계산 흐름</h3>
              <div className="flex items-center justify-center space-x-2 text-sm overflow-x-auto">
                <div className="bg-blue-100 px-3 py-2 rounded whitespace-nowrap">
                  총급여<br/>{formatNumber(salaryInWon)}원
                </div>
                <div className="text-gray-400">→</div>
                <div className="bg-green-100 px-3 py-2 rounded whitespace-nowrap">
                  과세표준<br/>{formatNumber(taxBaseResult.taxBase)}원
                </div>
                <div className="text-gray-400">→</div>
                <div className="bg-yellow-100 px-3 py-2 rounded whitespace-nowrap">
                  산출세액<br/>{formatNumber(taxBaseResult.calculatedTax)}원
                </div>
                <div className="text-gray-400">→</div>
                <div className="bg-purple-100 px-3 py-2 rounded whitespace-nowrap">
                  결정세액<br/>{formatNumber(finalResult.finalTax)}원
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 상세 계산 탭 */}
        {activeTab === 'detail' && (
          <div className="space-y-4">
            {/* 1단계: 근로소득금액 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center mr-2">1</span>
                근로소득금액 계산
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">총급여</p>
                  <p className="font-bold text-blue-600">{formatNumber(salaryInWon)}원</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">근로소득공제</p>
                  <p className="font-bold text-red-600">-{formatNumber(laborIncomeResult.amount)}원</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">근로소득금액</p>
                  <p className="font-bold text-green-600">{formatNumber(taxBaseResult.laborIncome)}원</p>
                </div>
              </div>
            </div>

            {/* 2단계: 과세표준 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center mr-2">2</span>
                과세표준 계산
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>근로소득금액</span>
                  <span className="font-medium">{formatNumber(taxBaseResult.laborIncome)}원</span>
                </div>
                <div className="flex justify-between">
                  <span>인적공제</span>
                  <span className="font-medium text-red-600">-{formatNumber(personalDeductionResult.totalDeduction)}원</span>
                </div>
                <div className="flex justify-between">
                  <span>연금보험료공제</span>
                  <span className="font-medium text-red-600">-{formatNumber(pensionResult.totalPension)}원</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>과세표준</span>
                  <span className="text-green-600">{formatNumber(taxBaseResult.taxBase)}원</span>
                </div>
              </div>
            </div>

            {/* 3단계: 산출세액 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <span className="bg-yellow-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center mr-2">3</span>
                산출세액 계산
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>과세표준</span>
                  <span className="font-medium">{formatNumber(taxBaseResult.taxBase)}원</span>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  적용 세율: {taxBaseResult.taxFormula}
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>산출세액</span>
                  <span className="text-yellow-600">{formatNumber(taxBaseResult.calculatedTax)}원</span>
                </div>
              </div>
            </div>

            {/* 4단계: 세액공제 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                <span className="bg-purple-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center mr-2">4</span>
                세액공제 적용
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>산출세액</span>
                  <span className="font-medium">{formatNumber(taxBaseResult.calculatedTax)}원</span>
                </div>
                <div className="flex justify-between">
                  <span>근로소득세액공제</span>
                  <span className="font-medium text-red-600">-{formatNumber(totalTaxDeductions.laborIncome)}원</span>
                </div>
                {totalTaxDeductions.child > 0 && (
                  <div className="flex justify-between">
                    <span>자녀세액공제</span>
                    <span className="font-medium text-red-600">-{formatNumber(totalTaxDeductions.child)}원</span>
                  </div>
                )}
                {totalTaxDeductions.pensionAccount > 0 && (
                  <div className="flex justify-between">
                    <span>연금계좌세액공제</span>
                    <span className="font-medium text-red-600">-{formatNumber(totalTaxDeductions.pensionAccount)}원</span>
                  </div>
                )}
                {totalTaxDeductions.rent > 0 && (
                  <div className="flex justify-between">
                    <span>월세액세액공제</span>
                    <span className="font-medium text-red-600">-{formatNumber(totalTaxDeductions.rent)}원</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>결정세액</span>
                  <span className="text-purple-600">{formatNumber(finalResult.finalTax)}원</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 입력 정보 탭 */}
        {activeTab === 'input' && (
          <div className="space-y-4">
            {/* 급여 정보 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">💰 급여 정보</h3>
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-gray-600">총급여</p>
                <p className="text-lg font-bold text-blue-600">{formatNumber(salaryInWon)}원</p>
              </div>
            </div>

            {/* 인적공제 정보 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">👥 인적공제 정보</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                {Object.entries(formData.personalDeduction).map(([key, value]) => (
                  value?.checked && (
                    <div key={key} className="bg-green-50 p-3 rounded">
                      <p className="font-medium text-green-800">
                        {key === 'self' ? '본인' :
                         key === 'spouse' ? '배우자' :
                         key === 'parents' ? '부모/조부모' :
                         key === 'children' ? '자녀/손자녀' :
                         key === 'siblings' ? '형제자매' :
                         key === 'senior' ? '경로우대자' :
                         key === 'disabled' ? '장애인' :
                         key === 'single-parent' ? '한부모 가정' :
                         key === 'female' ? '부녀자' : key}
                      </p>
                      <p className="text-green-600">{value.count || 1}명</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* 연금보험료 정보 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">💳 연금보험료 정보</h3>
              <div className="space-y-2">
                {Object.entries(formData.pensionInsurance).map(([key, value]) => (
                  value?.checked && (
                    <div key={key} className="bg-yellow-50 p-3 rounded">
                      <p className="font-medium text-yellow-800">
                        {key === 'national-pension' ? '국민연금' : '공무원연금 등'}
                      </p>
                      <p className="text-yellow-600">{formatNumber(value.amount)}원</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* 세액공제 정보 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3">💎 세액공제 정보</h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                {formData.taxDeduction.childCount > 0 && (
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="font-medium text-purple-800">자녀세액공제</p>
                    <p className="text-purple-600">{formData.taxDeduction.childCount}명</p>
                  </div>
                )}
                {formData.taxDeduction.pensionAccount > 0 && (
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="font-medium text-purple-800">연금계좌세액공제</p>
                    <p className="text-purple-600">{formatNumber(formData.taxDeduction.pensionAccount)}원</p>
                  </div>
                )}
                {formData.taxDeduction.monthlyRent > 0 && (
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="font-medium text-purple-800">월세액세액공제</p>
                    <p className="text-purple-600">월 {formatNumber(formData.taxDeduction.monthlyRent)}원</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="p-6 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-3">
          <button
            onClick={prevStep}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            ← 이전 단계
          </button>
          <button
            onClick={resetForm}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 새로 계산하기
          </button>
        </div>
        
        {/* 추가 정보 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">
            💡 이 계산은 참고용이며, 정확한 연말정산은 국세청 홈택스를 이용해주세요
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-400">
            <span>• 2024년 세법 기준</span>
            <span>• 단순 계산 모드</span>
            <span>• 기타 특별공제 제외</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultSummary;
