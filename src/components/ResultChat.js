import React, { useEffect, useRef } from 'react';
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
 * 실시간 채팅형 연말정산 결과 표시 컴포넌트
 * 입력값이 변경될 때마다 실시간으로 계산 과정을 채팅에 추가합니다
 */
const ResultChat = () => {
  const { 
    chatMessages, 
    addChatMessage, 
    replaceChatMessage,
    clearChatMessages, 
    formData, 
    currentStep,
    prevStep,
    resetForm 
  } = useTax();

  // 디바운싱을 위한 타이머 참조들
  const salaryTimerRef = useRef(null);
  const personalTimerRef = useRef(null);
  const pensionTimerRef = useRef(null);
  const taxDeductionTimerRef = useRef(null);

  // 초기 환영 메시지 제거 (중복 문제로 인해 삭제)

  // 급여 입력시 디바운싱된 실시간 계산
  useEffect(() => {
    if (formData.salary > 0) {
      // 기존 타이머 클리어
      if (salaryTimerRef.current) {
        clearTimeout(salaryTimerRef.current);
      }
      
      // 300ms 후에 메시지 교체 (디바운싱 - 더 빠른 반응)
      salaryTimerRef.current = setTimeout(() => {
        const salaryInWon = formData.salary * 10000;
        const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);
        
        const newMessage = {
          id: `salary-${Date.now()}`,
          type: 'calculation',
          title: '💰 총급여 입력 완료',
          content: `📈 총급여: ${formatNumber(salaryInWon)}원\n\n📊 근로소득공제 계산:\n${laborIncomeResult.formula}\n\n💡 근로소득금액: ${formatNumber(salaryInWon - laborIncomeResult.amount)}원\n\n✅ 계산이 완료되었습니다!`,
          timestamp: new Date()
        };
        
        // 기존 급여 메시지를 새 메시지로 교체
        replaceChatMessage('salary-', newMessage);
      }, 300);
    }
    
    // 컴포넌트 언마운트시 타이머 정리
    return () => {
      if (salaryTimerRef.current) {
        clearTimeout(salaryTimerRef.current);
      }
    };
  }, [formData.salary]);

  // 인적공제 입력시 디바운싱된 실시간 계산
  useEffect(() => {
    if (Object.keys(formData.personalDeduction).length > 0) {
      // 기존 타이머 클리어
      if (personalTimerRef.current) {
        clearTimeout(personalTimerRef.current);
      }
      
      // 500ms 후에 메시지 교체 (디바운싱)
      personalTimerRef.current = setTimeout(() => {
        const personalResult = calculatePersonalDeduction(formData.personalDeduction);
        
        const newMessage = {
          id: `personal-${Date.now()}`,
          type: 'calculation', 
          title: '👥 인적공제 계산',
          content: `기본공제: ${formatNumber(personalResult.basicDeduction)}원\n추가공제: ${formatNumber(personalResult.additionalDeduction)}원\n총 인적공제: ${formatNumber(personalResult.totalDeduction)}원`,
          timestamp: new Date()
        };
        
        // 기존 인적공제 메시지를 새 메시지로 교체
        replaceChatMessage('personal-', newMessage);
      }, 500);
    }
    
    // 컴포넌트 언마운트시 타이머 정리
    return () => {
      if (personalTimerRef.current) {
        clearTimeout(personalTimerRef.current);
      }
    };
  }, [formData.personalDeduction]);

  // 연금보험료 입력시 디바운싱된 실시간 계산
  useEffect(() => {
    if (Object.keys(formData.pensionInsurance).length > 0 && formData.salary > 0) {
      // 기존 타이머 클리어
      if (pensionTimerRef.current) {
        clearTimeout(pensionTimerRef.current);
      }
      
      // 500ms 후에 메시지 추가 (디바운싱)
      pensionTimerRef.current = setTimeout(() => {
        const salaryInWon = formData.salary * 10000;
        const pensionResult = calculatePensionInsurance(formData.pensionInsurance, salaryInWon);
        
        const newMessage = {
          id: `pension-${Date.now()}`,
          type: 'calculation',
          title: '💳 연금보험료 계산',
          content: `국민연금: ${formatNumber(pensionResult.nationalPension)}원\n건강보험료: ${formatNumber(pensionResult.healthInsurance)}원\n총 연금보험료: ${formatNumber(pensionResult.totalPension)}원`,
          timestamp: new Date()
        };
        
        // 기존 연금보험료 메시지를 새 메시지로 교체
        replaceChatMessage('pension-', newMessage);
      }, 500);
    }
    
    // 컴포넌트 언마운트시 타이머 정리
    return () => {
      if (pensionTimerRef.current) {
        clearTimeout(pensionTimerRef.current);
      }
    };
  }, [formData.pensionInsurance, formData.salary]);

  // 세액공제 입력시 디바운싱된 실시간 계산
  useEffect(() => {
    if (Object.keys(formData.taxDeduction).length > 0) {
      // 기존 타이머 클리어
      if (taxDeductionTimerRef.current) {
        clearTimeout(taxDeductionTimerRef.current);
      }
      
      // 500ms 후에 메시지 추가 (디바운싱)
      taxDeductionTimerRef.current = setTimeout(() => {
        const taxDeductions = {
          child: Math.min((formData.taxDeduction.childCount || 0) * 150000, 300000),
          pensionAccount: Math.min((formData.taxDeduction.pensionAccount || 0) * 0.15, 300000),
          rent: Math.min((formData.taxDeduction.monthlyRent || 0) * (formData.taxDeduction.rentMonths || 0) * 0.1, 750000),
          isa: Math.min((formData.taxDeduction.isaAmount || 0) * 0.15, 300000),
          medical: Math.min((formData.taxDeduction.medicalExpenses || 0) * 0.15, 300000),
          education: Math.min((formData.taxDeduction.educationExpenses || 0) * 0.15, 300000),
          donation: Math.min((formData.taxDeduction.donationAmount || 0) * 0.15, 300000)
        };

        const totalTaxDeduction = Object.values(taxDeductions).reduce((sum, val) => sum + val, 0);
        
        let deductionDetails = '';
        if (taxDeductions.child > 0) deductionDetails += `자녀세액공제: ${formatNumber(taxDeductions.child)}원\n`;
        if (taxDeductions.pensionAccount > 0) deductionDetails += `연금계좌공제: ${formatNumber(taxDeductions.pensionAccount)}원\n`;
        if (taxDeductions.rent > 0) deductionDetails += `월세액공제: ${formatNumber(taxDeductions.rent)}원\n`;
        if (taxDeductions.isa > 0) deductionDetails += `ISA공제: ${formatNumber(taxDeductions.isa)}원\n`;
        if (taxDeductions.medical > 0) deductionDetails += `의료비공제: ${formatNumber(taxDeductions.medical)}원\n`;
        if (taxDeductions.education > 0) deductionDetails += `교육비공제: ${formatNumber(taxDeductions.education)}원\n`;
        if (taxDeductions.donation > 0) deductionDetails += `기부금공제: ${formatNumber(taxDeductions.donation)}원\n`;
        
        const newMessage = {
          id: `tax-deduction-${Date.now()}`,
          type: 'calculation',
          title: '💎 세액공제 계산',
          content: `${deductionDetails}총 세액공제: ${formatNumber(totalTaxDeduction)}원`,
          timestamp: new Date()
        };
        
        // 기존 세액공제 메시지를 새 메시지로 교체
        replaceChatMessage('tax-deduction-', newMessage);
      }, 500);
    }
    
    // 컴포넌트 언마운트시 타이머 정리
    return () => {
      if (taxDeductionTimerRef.current) {
        clearTimeout(taxDeductionTimerRef.current);
      }
    };
  }, [formData.taxDeduction]);

  // 최종 계산 결과 (모든 데이터가 있을 때)
  useEffect(() => {
    if (formData.salary > 0 && currentStep === 4) {
      const salaryInWon = formData.salary * 10000;
      const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);
      const personalResult = calculatePersonalDeduction(formData.personalDeduction);
      const pensionResult = calculatePensionInsurance(formData.pensionInsurance, salaryInWon);
      
      const taxBaseResult = calculateTaxBaseAndAmount({
        salary: salaryInWon,
        laborIncomeDeduction: laborIncomeResult.amount,
        personalDeduction: personalResult.totalDeduction,
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

      const finalMessage = {
        id: `final-${Date.now()}`,
        type: 'result',
        title: '🎉 최종 계산 완료!',
        content: `과세표준: ${formatNumber(taxBaseResult.taxBase)}원\n산출세액: ${formatNumber(taxBaseResult.calculatedTax)}원\n세액공제 총액: ${formatNumber(finalResult.totalTaxDeduction)}원\n\n🎊 최종 결정세액: ${formatNumber(finalResult.finalTax)}원`,
        timestamp: new Date()
      };
      
      // 기존 최종 결과 메시지를 새 메시지로 교체
      replaceChatMessage('final-', finalMessage);
    }
  }, [currentStep, formData]);

  return (
    <div className="main-card results" style={{ display: 'block' }}>
      <h3 className="text-xl font-semibold mb-4">계산 결과</h3>
      <div className="space-y-2">
        {chatMessages.length > 0 ? (
          chatMessages.map((message, index) => (
            <div key={message.id || index} className="p-3 bg-gray-100 rounded-lg">
              {message.title && (
                <h4 className="mb-2 text-sm font-bold text-gray-800">{message.title}</h4>
              )}
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {message.content}
              </div>
              {message.timestamp && (
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-3 bg-gray-100 rounded-lg text-center text-gray-500">
            <div className="space-y-2">
              <div className="text-2xl">📊</div>
              <p className="text-sm">입력하시는 정보에 따라</p>
              <p className="text-sm">실시간으로 계산 결과가 표시됩니다</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultChat; 