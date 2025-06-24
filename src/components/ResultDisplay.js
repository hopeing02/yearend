import React from 'react';
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
 * 연말정산 결과 표시 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {number} props.salary - 총급여 (만원 단위)
 * @param {Object} props.personalDeduction - 인적공제 데이터
 * @param {Object} props.pensionInsurance - 연금보험료 데이터
 * @param {Object} props.taxDeduction - 세액공제 데이터
 * @param {Function} props.onReset - 처음부터 다시 시작하는 함수
 * @param {Function} props.onPrev - 이전 단계로 이동하는 함수
 */
const ResultDisplay = ({ 
  salary, 
  personalDeduction, 
  pensionInsurance, 
  taxDeduction,
  onReset,
  onPrev 
}) => {
  // 모든 계산 수행
  const salaryInWon = salary * 10000; // 만원을 원으로 변환
  
  // 1. 근로소득공제 계산
  const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);
  
  // 2. 인적공제 계산
  const personalDeductionResult = calculatePersonalDeduction(personalDeduction);
  
  // 3. 연금보험료공제 계산
  const pensionResult = calculatePensionInsurance(pensionInsurance, salaryInWon);
  
  // 4. 과세표준 및 산출세액 계산
  const taxBaseResult = calculateTaxBaseAndAmount({
    salary: salaryInWon,
    laborIncomeDeduction: laborIncomeResult.amount,
    personalDeduction: personalDeductionResult.totalDeduction,
    pensionDeduction: pensionResult.totalPension,
    specialDeduction: 0, // 간단 버전에서는 생략
    otherDeduction: 0    // 간단 버전에서는 생략
  });
  
  // 5. 근로소득세액공제 계산
  const laborTaxDeduction = calculateLaborIncomeTaxDeduction(taxBaseResult.calculatedTax);
  
  // 6. 세액공제 총합 계산
  const totalTaxDeductions = {
    laborIncome: laborTaxDeduction.deduction,
    child: Math.min((taxDeduction.childCount || 0) * 150000, 300000),
    pensionAccount: Math.min((taxDeduction.pensionAccount || 0) * 0.15, 300000),
    rent: Math.min((taxDeduction.monthlyRent || 0) * (taxDeduction.rentMonths || 0) * 0.1, 750000),
    isa: Math.min((taxDeduction.isaAmount || 0) * 0.15, 300000),
    medical: Math.min((taxDeduction.medicalExpenses || 0) * 0.15, 300000),
    education: Math.min((taxDeduction.educationExpenses || 0) * 0.15, 300000),
    donation: Math.min((taxDeduction.donationAmount || 0) * 0.15, 300000)
  };
  
  // 7. 최종 세액 계산
  const finalResult = calculateFinalTax({
    calculatedTax: taxBaseResult.calculatedTax,
    taxReduction: 0,
    taxDeductions: totalTaxDeductions,
    currentPaidTax: 0, // 기납부세액은 별도 입력 필요
    previousTax: 0
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🎉 연말정산 계산 결과
        </h2>
        <p className="text-gray-600">
          2024년 연말정산 계산이 완료되었습니다
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium text-blue-800 mb-2">총급여</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(salaryInWon)}
          </p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium text-green-800 mb-2">과세표준</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(taxBaseResult.taxBase)}
          </p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium text-purple-800 mb-2">결정세액</h3>
          <p className="text-2xl font-bold text-purple-600">
            {formatNumber(finalResult.finalTax)}
          </p>
        </div>
      </div>

      {/* 상세 계산 과정 */}
      <div className="space-y-6">
        {/* 1. 소득금액 계산 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">1️⃣ 소득금액 계산</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>총급여</span>
              <span className="font-medium">{formatNumber(salaryInWon)}</span>
            </div>
            <div className="flex justify-between">
              <span>근로소득공제</span>
              <span className="font-medium text-red-600">-{formatNumber(laborIncomeResult.amount)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>근로소득금액</span>
              <span>{formatNumber(taxBaseResult.laborIncome)}</span>
            </div>
          </div>
        </div>

        {/* 2. 소득공제 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">2️⃣ 소득공제</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>인적공제</span>
              <span className="font-medium text-red-600">-{formatNumber(personalDeductionResult.totalDeduction)}</span>
            </div>
            {personalDeductionResult.target && (
              <div className="text-xs text-gray-500 ml-4">
                공제 대상자: {personalDeductionResult.target}
              </div>
            )}
            {personalDeductionResult.deductionDetails && personalDeductionResult.deductionDetails.length > 0 && (
              <div className="ml-4 space-y-1">
                {personalDeductionResult.deductionDetails.map((detail, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    • {detail.type}: {formatNumber(detail.totalAmount)} 
                    {detail.target && ` (${detail.target})`}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <span>연금보험료공제</span>
              <span className="font-medium text-red-600">-{formatNumber(pensionResult.totalPension)}</span>
            </div>
            {pensionResult.target && (
              <div className="text-xs text-gray-500 ml-4">
                공제 대상자: {pensionResult.target}
              </div>
            )}
            {pensionResult.details && pensionResult.details.length > 0 && (
              <div className="ml-4 space-y-1">
                {pensionResult.details.map((detail, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    • {detail.type}: {formatNumber(detail.adjustedAmount)} 
                    {detail.target && ` (${detail.target})`}
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>과세표준</span>
              <span>{formatNumber(taxBaseResult.taxBase)}</span>
            </div>
          </div>
        </div>

        {/* 3. 산출세액 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">3️⃣ 산출세액</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>과세표준</span>
              <span className="font-medium">{formatNumber(taxBaseResult.taxBase)}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {taxBaseResult.taxFormula}
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>산출세액</span>
              <span>{formatNumber(taxBaseResult.calculatedTax)}</span>
            </div>
          </div>
        </div>

        {/* 4. 세액공제 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">4️⃣ 세액공제</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>근로소득세액공제</span>
              <span className="font-medium text-red-600">-{formatNumber(totalTaxDeductions.laborIncome)}</span>
            </div>
            {totalTaxDeductions.child > 0 && (
              <div className="flex justify-between">
                <span>자녀세액공제</span>
                <span className="font-medium text-red-600">-{formatNumber(totalTaxDeductions.child)}</span>
              </div>
            )}
            {totalTaxDeductions.pensionAccount > 0 && (
              <div className="flex justify-between">
                <span>연금계좌세액공제</span>
                <span className="font-medium text-red-600">-{formatNumber(totalTaxDeductions.pensionAccount)}</span>
              </div>
            )}
            {totalTaxDeductions.rent > 0 && (
              <div className="flex justify-between">
                <span>월세액세액공제</span>
                <span className="font-medium text-red-600">-{formatNumber(totalTaxDeductions.rent)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>총 세액공제</span>
              <span className="text-red-600">-{formatNumber(finalResult.totalTaxDeduction)}</span>
            </div>
          </div>
        </div>

        {/* 5. 최종 결과 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">5️⃣ 최종 결과</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>산출세액</span>
              <span className="font-medium">{formatNumber(taxBaseResult.calculatedTax)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>총 세액공제</span>
              <span className="font-medium text-red-600">-{formatNumber(finalResult.totalTaxDeduction)}</span>
            </div>
            <div className="border-t-2 border-blue-300 pt-3 flex justify-between text-2xl font-bold">
              <span>결정세액</span>
              <span className="text-blue-600">{formatNumber(finalResult.finalTax)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-800 mb-2">📌 참고사항</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 이 계산은 기본적인 연말정산 항목만을 포함합니다</li>
          <li>• 실제 연말정산시에는 추가 소득공제 및 세액공제 항목이 있을 수 있습니다</li>
          <li>• 정확한 계산을 위해서는 세무 전문가와 상담하시기 바랍니다</li>
          <li>• 기납부세액 정보가 포함되지 않아 최종 납부/환급액은 별도 계산이 필요합니다</li>
        </ul>
      </div>

      {/* 액션 버튼 */}
      <div className="flex space-x-3 pt-6">
        <button
          onClick={onPrev}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← 이전 단계
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          🔄 처음부터 다시
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay; 