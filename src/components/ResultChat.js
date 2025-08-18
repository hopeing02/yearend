import React, { useEffect, useRef, useCallback } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateLaborIncomeDeduction, 
  calculatePersonalDeduction, 
  calculatePensionInsurance,
  calculateTaxBaseAndAmount,
  calculateLaborIncomeTaxDeduction,
  calculateFinalTax,
  applyHousingDeductionLimits, // 새로 추가된 함수
  formatNumber 
} from '../utils/calc';

/**
 * 실시간 채팅형 연말정산 결과 표시 컴포넌트
 * useEffect 무한렌더링 방지 및 주택 관련 2단계 종합한도 반영
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
  const specialTimerRef = useRef(null); // 특별소득공제용 타이머 추가
  const otherTimerRef = useRef(null); // 그밖의 소득공제용 타이머 추가
  const taxDeductionTimerRef = useRef(null);

  // 급여 입력시 디바운싱된 실시간 계산 (useCallback으로 최적화)
  const handleSalaryChange = useCallback(() => {
    if (formData.salary > 0) {
      // 기존 타이머 클리어
      if (salaryTimerRef.current) {
        clearTimeout(salaryTimerRef.current);
      }
      
      // 500ms 후에 메시지 교체 (디바운싱)
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
      }, 500);
    }
  }, [formData.salary, replaceChatMessage]);

  useEffect(() => {
    handleSalaryChange();
    
    // 정리 함수
    return () => {
      if (salaryTimerRef.current) {
        clearTimeout(salaryTimerRef.current);
      }
    };
  }, [handleSalaryChange]);

  // 인적공제 입력시 디바운싱된 실시간 계산 (useCallback으로 최적화)
  const handlePersonalDeductionChange = useCallback(() => {
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
          content: `기본공제: ${formatNumber(personalResult.basicDeduction || 0)}원\n추가공제: ${formatNumber(personalResult.additionalDeduction || 0)}원\n총 인적공제: ${formatNumber(personalResult.totalDeduction)}원`,
          timestamp: new Date()
        };
        
        // 기존 인적공제 메시지를 새 메시지로 교체
        replaceChatMessage('personal-', newMessage);
      }, 500);
    }
  }, [formData.personalDeduction, replaceChatMessage]);

  useEffect(() => {
    handlePersonalDeductionChange();
    
    // 정리 함수
    return () => {
      if (personalTimerRef.current) {
        clearTimeout(personalTimerRef.current);
      }
    };
  }, [handlePersonalDeductionChange]);

  // 연금보험료 입력시 디바운싱된 실시간 계산 (useCallback으로 최적화)
  const handlePensionChange = useCallback(() => {
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
          content: `국민연금: ${formatNumber(pensionResult.nationalPension || 0)}원\n건강보험료: ${formatNumber(pensionResult.healthInsurance || 0)}원\n총 연금보험료: ${formatNumber(pensionResult.totalPension)}원`,
          timestamp: new Date()
        };
        
        // 기존 연금보험료 메시지를 새 메시지로 교체
        replaceChatMessage('pension-', newMessage);
      }, 500);
    }
  }, [formData.pensionInsurance, formData.salary, replaceChatMessage]);

  useEffect(() => {
    handlePensionChange();
    
    // 정리 함수
    return () => {
      if (pensionTimerRef.current) {
        clearTimeout(pensionTimerRef.current);
      }
    };
  }, [handlePensionChange]);

  // 특별소득공제 입력시 디바운싱된 실시간 계산 (새로 추가 - 2단계 한도 반영)
  const handleSpecialDeductionChange = useCallback(() => {
    if (Object.keys(formData.specialDeduction).length > 0) {
      // 기존 타이머 클리어
      if (specialTimerRef.current) {
        clearTimeout(specialTimerRef.current);
      }
      
      // 500ms 후에 메시지 교체 (디바운싱)
      specialTimerRef.current = setTimeout(() => {
        // 주택 관련 2단계 한도 체계 적용
        const housingLimits = applyHousingDeductionLimits(
          formData.specialDeduction, 
          formData.otherDeduction || {}
        );

        let totalDeduction = 0;
        let contentLines = [];

        // 사회보험료 (한도 제한 없음)
        if (formData.specialDeduction.insurance?.checked) {
          const amount = formData.specialDeduction.insurance.amount || 0;
          totalDeduction += amount;
          contentLines.push(`사회보험료: ${amount.toLocaleString()}만원`);
        }

        // 주택임차차입금 (2단계 한도 적용)
        if (formData.specialDeduction['housing-rent']?.checked) {
          const originalAmount = formData.specialDeduction['housing-rent'].amount || 0;
          const adjustedAmount = housingLimits.finalAmounts.housingRent;
          totalDeduction += adjustedAmount;
          
          if (originalAmount !== adjustedAmount) {
            contentLines.push(`주택임차차입금: ${adjustedAmount.toLocaleString()}만원 (조정됨: 원래 ${originalAmount.toLocaleString()}만원)`);
          } else {
            contentLines.push(`주택임차차입금: ${adjustedAmount.toLocaleString()}만원`);
          }
        }

        // 장기주택저당차입금 (2단계 한도 적용)
        if (formData.specialDeduction['housing-loan']?.checked) {
          const originalAmount = formData.specialDeduction['housing-loan'].amount || 0;
          const adjustedAmount = housingLimits.finalAmounts.housingLoan;
          totalDeduction += adjustedAmount;
          
          if (originalAmount !== adjustedAmount) {
            contentLines.push(`장기주택저당차입금: ${adjustedAmount.toLocaleString()}만원 (조정됨: 원래 ${originalAmount.toLocaleString()}만원)`);
          } else {
            contentLines.push(`장기주택저당차입금: ${adjustedAmount.toLocaleString()}만원`);
          }
        }

        // 주택 관련 한도 초과 안내
        let limitInfo = '';
        if (housingLimits.firstStage.isExceeded) {
          limitInfo += `\n⚠️ 1단계 한도(400만원) 초과로 비례 배분 적용`;
        }
        if (housingLimits.secondStage.isExceeded) {
          limitInfo += `\n⚠️ 2단계 한도 초과로 장기주택저당차입금 조정`;
        }

        const newMessage = {
          id: `special-${Date.now()}`,
          type: 'calculation',
          title: '🏠 특별소득공제 계산',
          content: `${contentLines.join('\n')}\n\n총 특별소득공제: ${totalDeduction.toLocaleString()}만원${limitInfo}`,
          timestamp: new Date()
        };
        
        // 기존 특별소득공제 메시지를 새 메시지로 교체
        replaceChatMessage('special-', newMessage);
      }, 500);
    }
  }, [formData.specialDeduction, formData.otherDeduction, replaceChatMessage]);

  useEffect(() => {
    handleSpecialDeductionChange();
    
    // 정리 함수
    return () => {
      if (specialTimerRef.current) {
        clearTimeout(specialTimerRef.current);
      }
    };
  }, [handleSpecialDeductionChange]);

  // 그밖의 소득공제 입력시 디바운싱된 실시간 계산 (새로 추가 - 2단계 한도 반영)
  const handleOtherDeductionChange = useCallback(() => {
    if (Object.keys(formData.otherDeduction).length > 0) {
      // 기존 타이머 클리어
      if (otherTimerRef.current) {
        clearTimeout(otherTimerRef.current);
      }
      
      // 500ms 후에 메시지 교체 (디바운싱)
      otherTimerRef.current = setTimeout(() => {
        // 주택 관련 2단계 한도 체계 적용
        const housingLimits = applyHousingDeductionLimits(
          formData.specialDeduction || {},
          formData.otherDeduction
        );

        let totalDeduction = 0;
        let contentLines = [];

        // 주택청약종합저축 (2단계 한도 적용)
        if (formData.otherDeduction['housing-savings']?.checked) {
          const originalAmount = formData.otherDeduction['housing-savings'].amount || 0;
          const adjustedAmount = housingLimits.finalAmounts.housingSavings;
          totalDeduction += adjustedAmount;
          
          if (originalAmount !== adjustedAmount) {
            contentLines.push(`주택청약종합저축: ${adjustedAmount.toLocaleString()}만원 (조정됨: 원래 ${originalAmount.toLocaleString()}만원)`);
          } else {
            contentLines.push(`주택청약종합저축: ${adjustedAmount.toLocaleString()}만원`);
          }
        }

        // 신용카드 등 (기존 로직 유지)
        if (formData.otherDeduction['credit-card']?.checked) {
          const amount = formData.otherDeduction['credit-card'].amount || 0;
          totalDeduction += amount;
          contentLines.push(`신용카드 등: ${amount.toLocaleString()}만원`);
        }

        // 한도 초과 안내
        let limitInfo = '';
        if (housingLimits.firstStage.isExceeded && formData.otherDeduction['housing-savings']?.checked) {
          limitInfo += `\n⚠️ 주택청약종합저축이 1단계 한도(400만원) 적용으로 조정됨`;
        }

        const newMessage = {
          id: `other-${Date.now()}`,
          type: 'calculation',
          title: '💳 그밖의 소득공제 계산',
          content: `${contentLines.join('\n')}\n\n총 그밖의 소득공제: ${totalDeduction.toLocaleString()}만원${limitInfo}`,
          timestamp: new Date()
        };
        
        // 기존 그밖의 소득공제 메시지를 새 메시지로 교체
        replaceChatMessage('other-', newMessage);
      }, 500);
    }
  }, [formData.otherDeduction, formData.specialDeduction, replaceChatMessage]);

  useEffect(() => {
    handleOtherDeductionChange();
    
    // 정리 함수
    return () => {
      if (otherTimerRef.current) {
        clearTimeout(otherTimerRef.current);
      }
    };
  }, [handleOtherDeductionChange]);

  // 세액공제 입력시 디바운싱된 실시간 계산 (useCallback으로 최적화)
  const handleTaxDeductionChange = useCallback(() => {
    if (Object.keys(formData.taxDeduction).length > 0) {
      // 기존 타이머 클리어
      if (taxDeductionTimerRef.current) {
        clearTimeout(taxDeductionTimerRef.current);
      }
      
      // 500ms 후에 메시지 교체 (디바운싱)
      taxDeductionTimerRef.current = setTimeout(() => {
        const totalTaxDeductions = {
          child: Math.min((formData.taxDeduction.childCount || 0) * 150000, 300000),
          pensionAccount: Math.min((formData.taxDeduction.pensionAccount || 0) * 0.15, 300000),
          rent: Math.min((formData.taxDeduction.monthlyRent || 0) * (formData.taxDeduction.rentMonths || 0) * 0.1, 750000),
          isa: Math.min((formData.taxDeduction.isaAmount || 0) * 0.15, 300000),
          medical: Math.min((formData.taxDeduction.medicalExpenses || 0) * 0.15, 300000),
          education: Math.min((formData.taxDeduction.educationExpenses || 0) * 0.15, 300000),
          donation: Math.min((formData.taxDeduction.donationAmount || 0) * 0.15, 300000)
        };
        
        const totalAmount = Object.values(totalTaxDeductions).reduce((sum, amount) => sum + amount, 0);
        
        const newMessage = {
          id: `taxdeduction-${Date.now()}`,
          type: 'calculation',
          title: '💰 세액공제 계산',
          content: `자녀세액공제: ${formatNumber(totalTaxDeductions.child)}원\n연금계좌: ${formatNumber(totalTaxDeductions.pensionAccount)}원\n월세액공제: ${formatNumber(totalTaxDeductions.rent)}원\nISA: ${formatNumber(totalTaxDeductions.isa)}원\n의료비: ${formatNumber(totalTaxDeductions.medical)}원\n교육비: ${formatNumber(totalTaxDeductions.education)}원\n기부금: ${formatNumber(totalTaxDeductions.donation)}원\n\n총 세액공제: ${formatNumber(totalAmount)}원`,
          timestamp: new Date()
        };
        
        // 기존 세액공제 메시지를 새 메시지로 교체
        replaceChatMessage('taxdeduction-', newMessage);
      }, 500);
    }
  }, [formData.taxDeduction, replaceChatMessage]);

  useEffect(() => {
    handleTaxDeductionChange();
    
    // 정리 함수
    return () => {
      if (taxDeductionTimerRef.current) {
        clearTimeout(taxDeductionTimerRef.current);
      }
    };
  }, [handleTaxDeductionChange]);

  // 최종 계산 결과 (모든 데이터가 있을 때)
  const handleFinalCalculation = useCallback(() => {
    if (formData.salary > 0 && currentStep === 4) {
      const salaryInWon = formData.salary * 10000;
      const laborIncomeResult = calculateLaborIncomeDeduction(salaryInWon);
      const personalResult = calculatePersonalDeduction(formData.personalDeduction);
      const pensionResult = calculatePensionInsurance(formData.pensionInsurance, salaryInWon);
      
      // 주택 관련 2단계 한도 체계 적용
      const housingLimits = applyHousingDeductionLimits(
        formData.specialDeduction || {},
        formData.otherDeduction || {}
      );

      // 특별소득공제 (2단계 한도 적용)
      let specialDeductionTotal = 0;
      if (formData.specialDeduction?.insurance?.checked) {
        specialDeductionTotal += formData.specialDeduction.insurance.amount || 0;
      }
      specialDeductionTotal += housingLimits.finalAmounts.housingRent;
      specialDeductionTotal += housingLimits.finalAmounts.housingLoan;

      // 그밖의 소득공제 (2단계 한도 적용)
      let otherDeductionTotal = 0;
      otherDeductionTotal += housingLimits.finalAmounts.housingSavings;
      if (formData.otherDeduction?.['credit-card']?.checked) {
        otherDeductionTotal += formData.otherDeduction['credit-card'].amount || 0;
      }
      
      const taxBaseResult = calculateTaxBaseAndAmount({
        salary: salaryInWon,
        laborIncomeDeduction: laborIncomeResult.amount,
        personalDeduction: personalResult.totalDeduction,
        pensionDeduction: pensionResult.totalPension,
        specialDeduction: specialDeductionTotal * 10000, // 만원 → 원 변환
        otherDeduction: otherDeductionTotal * 10000 // 만원 → 원 변환
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

      // 주택 관련 한도 적용 안내 추가
      let housingLimitNotice = '';
      if (housingLimits.firstStage.isExceeded || housingLimits.secondStage.isExceeded) {
        housingLimitNotice = '\n\n🏠 주택 관련 종합한도 적용됨';
        if (housingLimits.firstStage.isExceeded) {
          housingLimitNotice += '\n• 1단계 한도(400만원) 초과로 비례 배분';
        }
        if (housingLimits.secondStage.isExceeded) {
          housingLimitNotice += '\n• 2단계 한도 초과로 장기주택저당차입금 조정';
        }
      }

      const finalMessage = {
        id: `final-${Date.now()}`,
        type: 'result',
        title: '🎉 최종 계산 완료!',
        content: `과세표준: ${formatNumber(taxBaseResult.taxBase)}원\n산출세액: ${formatNumber(taxBaseResult.calculatedTax)}원\n세액공제 총액: ${formatNumber(finalResult.totalTaxDeduction)}원\n\n🎊 최종 결정세액: ${formatNumber(finalResult.finalTax)}원${housingLimitNotice}`,
        timestamp: new Date()
      };
      
      // 기존 최종 결과 메시지를 새 메시지로 교체
      replaceChatMessage('final-', finalMessage);
    }
  }, [currentStep, formData, replaceChatMessage]);

  useEffect(() => {
    handleFinalCalculation();
  }, [handleFinalCalculation]);

  return (
    <div className="main-card results" style={{ display: 'block' }}>
      <h3 className="text-xl font-semibold mb-4">계산 결과</h3>
      <div className="space-y-2">
        {chatMessages.length > 0 ? (
          chatMessages.map((message) => (
            <div key={ message.id} className={`message ${message.type}`}>
              <div className="message-header">
                <span className="message-title">{message.title}</span>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {message.content.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>📊 총급여를 입력하면 실시간으로 계산 결과가 표시됩니다.</p>
            <p>주택 관련 소득공제는 2단계 종합한도 체계가 자동으로 적용됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultChat;
