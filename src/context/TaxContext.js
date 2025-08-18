import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { 
  calculateOtherDeduction, 
  validateOtherDeduction 
} from '../utils/calc';

// Context 생성
const TaxContext = createContext();

// 초기 상태 (기존 프로젝트의 데이터 구조에 맞게 수정)
const initialState = {
  // 현재 진행 단계 (0: 급여, 1: 인적공제, 2: 연금보험료, 3: 특별소득공제, 4: 그밖의소득공제, 5: 세액공제, 6: 결과)
  currentStep: 0,
  
  // 폼 데이터
  formData: {
    salary: 0,                    // 총급여 (만원 단위)
    personalDeduction: {
      target: 'personal',         // 공제 대상자 (기본값: 본인)
      self: { checked: true, count: 1 }  // 본인 기본값 설정
    },                           // 인적공제 데이터
    pensionInsurance: {
      // 연금보험료 데이터 구조 개선
      'national-pension': { checked: false, amount: 0 },
      'public-pension': { checked: false, amount: 0 },
    },                           // 연금보험료 데이터  
    specialDeduction: {
      insurance: { checked: false, amount: 0 },
      'housing-rent': { 
        checked: false, 
        amount: 0, 
        inputAmount: 0 // 입력 금액 추가
      },
      'housing-loan': { 
        checked: false, 
        amount: 0, 
        inputAmount: 0, // 입력 금액 추가
        details: {
          contractDate: '',
          repaymentPeriod: '',
          interestType: '',
          repaymentType: ''
        }
      }
    },
    otherDeduction: {
      'housing-savings': { 
        checked: false, 
        amount: 0,
        inputAmount: 0,
        isHouseholdHead: false // 무주택 세대주 여부 추가
      },
      'credit-card': { 
        checked: false, 
        amount: 0,
        details: {           // 기존 프로젝트 구조에 맞게 details 객체 안에
          credit: 0,         // 신용카드 사용액
          check: 0,          // 체크카드/현금영수증 사용액
          traditional: 0,    // 전통시장 사용액
          transport: 0,      // 대중교통 이용액
          culture: 0,        // 도서·공연·박물관·미술관 사용액
          lastYear: 0        // 전년도 총 사용액
        }
      }
    },                                  // 그밖의 소득공제 데이터
    taxDeduction: {}              // 세액공제 데이터
  },
  
  // 계산 결과 캐시 (성능 최적화용)
  calculationResults: {
    laborIncomeDeduction: null,
    personalDeductionResult: null,
    pensionInsuranceResult: null,
    specialDeductionResult: null,
    otherDeductionResult: null,
    taxBaseResult: null,
    finalResult: null,
    housingLimitDetails: null // 주택 관련 한도 정보 추가
  },

  validation: {
    personalDeductionValidation: { isValid: true, errors: [], warnings: [] },
    pensionDeductionValidation: { isValid: true, errors: [], warnings: [] },
    specialDeductionValidation: { isValid: true, errors: [], warnings: [] },
    otherDeductionValidation: { isValid: true, errors: [], warnings: [] },
    taxDeductionValidation: { isValid: true, errors: [], warnings: [] }
  },

  // 채팅 메시지 관리
  chatMessages: [],
  
  // 이전 단계 추적 (useEffect 최적화용)
  prevStep: 0
};

// 액션 타입 정의
const actionTypes = {
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  SET_SALARY: 'SET_SALARY',
  SET_PERSONAL_DEDUCTION: 'SET_PERSONAL_DEDUCTION',
  SET_PENSION_INSURANCE: 'SET_PENSION_INSURANCE',
  SET_SPECIAL_DEDUCTION: 'SET_SPECIAL_DEDUCTION',
  SET_OTHER_DEDUCTION: 'SET_OTHER_DEDUCTION',
  SET_TAX_DEDUCTION: 'SET_TAX_DEDUCTION',
  SET_CALCULATION_RESULT: 'SET_CALCULATION_RESULT',
  SET_VALIDATION: 'SET_VALIDATION',
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  REPLACE_CHAT_MESSAGE: 'REPLACE_CHAT_MESSAGE',
  CLEAR_CHAT_MESSAGES: 'CLEAR_CHAT_MESSAGES',
  RESET_FORM: 'RESET_FORM'
};

// 리듀서 함수 (불변성 유지 및 성능 최적화)
function taxReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_CURRENT_STEP:
      return {
        ...state,
        prevStep: state.currentStep, // 이전 단계 저장
        currentStep: action.payload
      };

    case actionTypes.SET_SALARY:
      return {
        ...state,
        formData: {
          ...state.formData,
          salary: action.payload
        }
      };

    case actionTypes.SET_PERSONAL_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          personalDeduction: action.payload
        }
      };

    case actionTypes.SET_PENSION_INSURANCE:
      return {
        ...state,
        formData: {
          ...state.formData,
          pensionInsurance: action.payload
        }
      };

    case actionTypes.SET_SPECIAL_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          specialDeduction: action.payload
        }
      };

    case actionTypes.SET_OTHER_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          otherDeduction: action.payload
        }
      };

    case actionTypes.SET_TAX_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          taxDeduction: action.payload
        }
      };

    case actionTypes.SET_CALCULATION_RESULT:
      return {
        ...state,
        calculationResults: {
          ...state.calculationResults,
          [action.resultType]: action.payload
        }
      };

    case actionTypes.SET_VALIDATION:
      return {
        ...state,
        validation: {
          ...state.validation,
          [action.validationType]: action.payload
        }
      };

    case actionTypes.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };

    case actionTypes.REPLACE_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: state.chatMessages.map(msg => 
          msg.id.startsWith(action.prefix) ? action.payload : msg
        ).filter((msg, index, arr) => 
          // 같은 prefix를 가진 메시지 중 마지막 것만 유지
          arr.findLastIndex(m => m.id.startsWith(action.prefix)) === index ||
          !msg.id.startsWith(action.prefix)
        )
      };

    case actionTypes.CLEAR_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: []
      };

    case actionTypes.RESET_FORM:
      return initialState;

    default:
      return state;
  }
}

// Context Provider 컴포넌트
export const TaxProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taxReducer, initialState);

  // 액션 생성자들 (useCallback으로 최적화하여 무한렌더링 방지)
  const setCurrentStep = useCallback((step) => {
    dispatch({ type: actionTypes.SET_CURRENT_STEP, payload: step });
  }, []);

  const setSalary = useCallback((salary) => {
    dispatch({ type: actionTypes.SET_SALARY, payload: salary });
  }, []);

  const setPersonalDeduction = useCallback((data) => {
    dispatch({ type: actionTypes.SET_PERSONAL_DEDUCTION, payload: data });
  }, []);

  const setPensionInsurance = useCallback((data) => {
    dispatch({ type: actionTypes.SET_PENSION_INSURANCE, payload: data });
  }, []);

  const setSpecialDeduction = useCallback((data) => {
    dispatch({ type: actionTypes.SET_SPECIAL_DEDUCTION, payload: data });
  }, []);

  const setOtherDeduction = useCallback((data) => {
    dispatch({ type: actionTypes.SET_OTHER_DEDUCTION, payload: data });
  }, []);

  const setTaxDeduction = useCallback((data) => {
    dispatch({ type: actionTypes.SET_TAX_DEDUCTION, payload: data });
  }, []);

  const setCalculationResult = useCallback((resultType, data) => {
    dispatch({ 
      type: actionTypes.SET_CALCULATION_RESULT, 
      resultType, 
      payload: data 
    });
  }, []);

  const setValidation = useCallback((validationType, data) => {
    dispatch({ 
      type: actionTypes.SET_VALIDATION, 
      validationType, 
      payload: data 
    });
  }, []);

  const addChatMessage = useCallback((message) => {
    dispatch({ type: actionTypes.ADD_CHAT_MESSAGE, payload: message });
  }, []);

  const replaceChatMessage = useCallback((prefix, message) => {
    dispatch({ 
      type: actionTypes.REPLACE_CHAT_MESSAGE, 
      prefix, 
      payload: message 
    });
  }, []);

  const clearChatMessages = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_CHAT_MESSAGES });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: actionTypes.RESET_FORM });
  }, []);

  // 유효성 검사 함수들 (useCallback으로 최적화)
  const validateOtherDeductionData = useCallback((otherData, salary) => {
    const validationResult = validateOtherDeduction(otherData, salary);
    setValidation('otherDeductionValidation', validationResult);
    return validationResult;
  }, [setValidation]);

  // Context 값 (useMemo 대신 직접 객체 생성하여 안정성 확보)
  const contextValue = {
    // 상태
    ...state,

    // 액션들
    setCurrentStep,
    setSalary,
    setPersonalDeduction,
    setPensionInsurance,
    setSpecialDeduction,
    setOtherDeduction,
    setTaxDeduction,
    setCalculationResult,
    setValidation,

    // 채팅 관련
    addChatMessage,
    replaceChatMessage,
    clearChatMessages,

    // 기타
    resetForm,
    validateOtherDeductionData
  };

  return (
    <TaxContext.Provider value={contextValue}>
      {children}
    </TaxContext.Provider>
  );
};

// Custom Hook
export const useTax = () => {
  const context = useContext(TaxContext);
  if (!context) {
    throw new Error('useTax must be used within a TaxProvider');
  }
  return context;
};
