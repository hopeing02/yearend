import React, { useState, useEffect } from 'react';
import { useTax } from '../context/TaxContext';
import { 
  calculateOtherDeduction, 
  calculateHousingSavingsDeduction, 
  calculateCreditCardDeduction,
  getCreditCardCalculationDetails,
  getCreditCardCalculationDetails,
  formatNumber 
} from '../utils/calc';

/**
 * 개선된 그밖의 소득공제 입력 컴포넌트
 * - 무주택 세대주 체크 기능 추가
 * - 신용카드 공제 최저사용금액 안내 강화
 * - 실시간 계산 결과 및 오류 메시지 표시
 * - 사용자 친화적인 입력 검증 및 피드백
 */
const OtherDeductionInput = () => {
  const { formData, setOtherDeduction } = useTax();
  const otherDeduction = formData.otherDeduction || {};
  const salary = formData.salary; // 만원 단위

  // 로컬 상태로 입력값 관리
  const [localData, setLocalData] = useState({
    'housing-savings': { 
      checked: false, 
      amount: 0,
      inputAmount: 0,
      isHouseholdHead: false // 무주택 세대주 여부 추가
    },
    'credit-card': { 
      checked: false, 
      amount: 0,
      details: {
        credit: 0,        // 신용카드
        check: 0,         // 체크카드/현금영수증
        traditional: 0,   // 전통시장
        transport: 0,     // 대중교통
        culture: 0,       // 도서/공연/박물관/미술관
        lastYear: 0       // 2023년 카드 사용금액
      }
    }
  });

    // 계산 결과 및 오류 메시지 상태
  const [calculationStatus, setCalculationStatus] = useState({
    housingSavings: { isValid: true, message: '', amount: 0 },
    creditCard: { isValid: true, message: '', amount: 0, details: null }
  });

  // Context 데이터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (otherDeduction && Object.keys(otherDeduction).length > 0) {
      setLocalData(prev => ({
        ...prev,
        ...otherDeduction
      }));
    }
  }, [otherDeduction]);

  // 주택청약종합저축 공제 계산 - calc.js 함수 사용
  const calculateHousingSavings = (inputAmount) => {
    return calculateHousingSavingsDeduction(inputAmount);
  };

  // 신용카드 공제 계산 - calc.js 함수 사용
  const calculateCreditCard = (details) => {
    return calculateCreditCardDeduction(details, salary);
  };

  // 설문지 옵션들
  const surveyOptions = [
    {
      id: 'housing-savings',
      label: '주택청약종합저축을 납부하셨나요?',
      description: '무주택 세대주가 청약저축에 납입한 금액은 연 300만원 한도 내에서 40%까지 공제받을 수 있습니다.',
      type: 'checkbox',
      hasAmount: true
    },
    {
      id: 'credit-card',
      label: '신용카드, 체크카드, 현금영수증을 사용하셨나요?',
      description: '총급여의 25%를 초과하는 금액에 대해 공제받을 수 있습니다.',
      type: 'checkbox',
      hasDetails: true
    }
  ];

  // 체크박스 상태 확인 함수
  const getCheckboxState = (option) => {
    const fieldData = localData[ option.id];
    return fieldData?.checked || false;
  };

  // 숫자 입력값 확인 함수
  const getAmountValue = (optionId) => {
    const fieldData = localData[optionId];
    return fieldData?.inputAmount || 0;
  };

  // 상세정보 확인 함수
  const getDetailsValue = (optionId, field) => {
    const fieldData = localData[optionId];
    return fieldData?.details?.[field] || 0;
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field, value, type = 'checkbox') => {
    console.log('handleInputChange 호출:', { field, value, type });
    
    setLocalData(prev => {
      const updated = { ...prev };
      
      if (type === 'checkbox') {
        // 체크박스 선택 시 초기화
        if (field === 'housing-savings') {
          updated[field] = {
            checked: value,
            amount: 0,
            inputAmount: 0
          };
        } else if (field === 'credit-card') {
          updated[field] = {
            checked: value,
            amount: 0,
            details: {
              credit: 0,
              check: 0,
              traditional: 0,
              transport: 0,
              culture: 0,
              lastYear: 0
            }
          };
        }
      } else if (type === 'amount') {
        const numValue = parseInt(value) || 0;
        let calculatedAmount = 0;
        
        if (field === 'housing-savings') {
          calculatedAmount = calculateHousingSavings(numValue);
        }
        
        updated[field] = {
          ...updated[field],
          checked: numValue > 0,
          amount: calculatedAmount,
          inputAmount: numValue
        };
        
        console.log('amount 계산 결과:', { field, numValue, calculatedAmount });
      } else if (type === 'details') {
        const [fieldName, detailKey] = field.split('-');
        const numValue = parseInt(value) || 0;
        
        // 기존 details 보존하면서 새 값 업데이트
        const currentDetails = updated[fieldName]?.details || {};
        updated[fieldName] = {
          ...updated[fieldName],
          details: {
            ...currentDetails,
            [detailKey]: numValue
          }
        };
        
        // 신용카드 상세정보 변경 시 금액 재계산
        if (fieldName === 'credit-card') {
          const newDetails = updated[fieldName].details;
          const calculatedAmount = calculateCreditCard(newDetails);
          updated[fieldName].amount = calculatedAmount;
          
          // 하나라도 입력되면 체크박스 활성화
          const hasAnyInput = Object.values(newDetails).some(val => val > 0);
          updated[fieldName].checked = hasAnyInput;
          
          console.log('credit-card 계산 결과:', { 
            detailKey, 
            numValue, 
            newDetails, 
            calculatedAmount, 
            hasAnyInput 
          });
        }
      }
      
      console.log('로컬 상태 업데이트:', updated);
      
      // Context도 함께 업데이트
      setOtherDeduction(updated);
      
      return updated;
    });
  };

  // 실시간 계산 결과
  const calculationResult = calculateOtherDeduction(localData, salary); */

  export default OtherDeductionInput;
