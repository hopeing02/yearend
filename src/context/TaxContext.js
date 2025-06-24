import React, { createContext, useContext, useReducer } from 'react';

// Context 생성
const TaxContext = createContext();

// 초기 상태
const initialState = {
  // 현재 진행 단계 (0: 급여, 1: 인적공제, 2: 연금보험료, 3: 세액공제, 4: 결과)
  currentStep: 0,
  
  // 폼 데이터
  formData: {
    salary: 0,                    // 총급여 (만원 단위)
    personalDeduction: {
      target: 'personal'          // 공제 대상자 (기본값: 본인)
    },                           // 인적공제 데이터
    pensionInsurance: {
      target: 'personal'          // 공제 대상자 (기본값: 본인)
    },                           // 연금보험료 데이터  
    taxDeduction: {}              // 세액공제 데이터
  },
  
  // 계산 결과 캐시 (성능 최적화용)
  calculationResults: {
    laborIncomeDeduction: null,
    personalDeductionResult: null,
    pensionInsuranceResult: null,
    taxBaseResult: null,
    finalResult: null
  },
  
  // 실시간 채팅 메시지
  chatMessages: [],
  
  // UI 상태
  isLoading: false,
  errors: {}
};

// 액션 타입 정의
const ACTION_TYPES = {
  // 단계 관리
  SET_CURRENT_STEP: 'SET_CURRENT_STEP',
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  RESET_FORM: 'RESET_FORM',
  
  // 데이터 업데이트
  SET_SALARY: 'SET_SALARY',
  SET_PERSONAL_DEDUCTION: 'SET_PERSONAL_DEDUCTION',
  SET_PENSION_INSURANCE: 'SET_PENSION_INSURANCE', 
  SET_TAX_DEDUCTION: 'SET_TAX_DEDUCTION',
  
  // 계산 결과 캐시
  SET_CALCULATION_RESULTS: 'SET_CALCULATION_RESULTS',
  CLEAR_CALCULATION_CACHE: 'CLEAR_CALCULATION_CACHE',
  
  // 채팅 메시지 관리
  ADD_CHAT_MESSAGE: 'ADD_CHAT_MESSAGE',
  REPLACE_CHAT_MESSAGE: 'REPLACE_CHAT_MESSAGE',
  CLEAR_CHAT_MESSAGES: 'CLEAR_CHAT_MESSAGES',
  
  // UI 상태
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};

// Reducer 함수
const taxReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload
      };
      
    case ACTION_TYPES.NEXT_STEP:
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 4) // 최대 4단계
      };
      
    case ACTION_TYPES.PREV_STEP:
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0) // 최소 0단계
      };
      
    case ACTION_TYPES.RESET_FORM:
      return {
        ...initialState
      };
      
    case ACTION_TYPES.SET_SALARY:
      return {
        ...state,
        formData: {
          ...state.formData,
          salary: action.payload
        },
        calculationResults: {
          ...state.calculationResults,
          laborIncomeDeduction: null // 급여 변경시 계산 결과 초기화
        }
      };
      
    case ACTION_TYPES.SET_PERSONAL_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          personalDeduction: action.payload
        },
        calculationResults: {
          ...state.calculationResults,
          personalDeductionResult: null
        }
      };
      
    case ACTION_TYPES.SET_PENSION_INSURANCE:
      return {
        ...state,
        formData: {
          ...state.formData,
          pensionInsurance: action.payload
        },
        calculationResults: {
          ...state.calculationResults,
          pensionInsuranceResult: null
        }
      };
      
    case ACTION_TYPES.SET_TAX_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          taxDeduction: action.payload
        }
      };
      
    case ACTION_TYPES.SET_CALCULATION_RESULTS:
      return {
        ...state,
        calculationResults: {
          ...state.calculationResults,
          ...action.payload
        }
      };
      
    case ACTION_TYPES.CLEAR_CALCULATION_CACHE:
      return {
        ...state,
        calculationResults: {
          laborIncomeDeduction: null,
          personalDeductionResult: null,
          pensionInsuranceResult: null,
          taxBaseResult: null,
          finalResult: null
        }
      };
      
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.message
        }
      };
      
    case ACTION_TYPES.CLEAR_ERRORS:
      return {
        ...state,
        errors: {}
      };
      
    case ACTION_TYPES.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
      
    case ACTION_TYPES.REPLACE_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [
          ...state.chatMessages.filter(msg => !msg.id?.startsWith(action.payload.idPrefix)),
          action.payload.message
        ]
      };
      
    case ACTION_TYPES.CLEAR_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: []
      };
      
    default:
      return state;
  }
};

// Provider 컴포넌트
export const TaxProvider = ({ children }) => {
  const [state, dispatch] = useReducer(taxReducer, initialState);
  
  // 액션 크리에이터들
  const actions = {
    // 단계 관리
    setCurrentStep: (step) => dispatch({ type: ACTION_TYPES.SET_CURRENT_STEP, payload: step }),
    nextStep: () => dispatch({ type: ACTION_TYPES.NEXT_STEP }),
    prevStep: () => dispatch({ type: ACTION_TYPES.PREV_STEP }),
    resetForm: () => dispatch({ type: ACTION_TYPES.RESET_FORM }),
    
    // 데이터 업데이트
    setSalary: (salary) => dispatch({ type: ACTION_TYPES.SET_SALARY, payload: salary }),
    setPersonalDeduction: (data) => dispatch({ type: ACTION_TYPES.SET_PERSONAL_DEDUCTION, payload: data }),
    setPensionInsurance: (data) => dispatch({ type: ACTION_TYPES.SET_PENSION_INSURANCE, payload: data }),
    setTaxDeduction: (data) => dispatch({ type: ACTION_TYPES.SET_TAX_DEDUCTION, payload: data }),
    
    // 계산 결과 관리
    setCalculationResults: (results) => dispatch({ type: ACTION_TYPES.SET_CALCULATION_RESULTS, payload: results }),
    clearCalculationCache: () => dispatch({ type: ACTION_TYPES.CLEAR_CALCULATION_CACHE }),
    
    // 채팅 메시지 관리
    addChatMessage: (message) => dispatch({ type: ACTION_TYPES.ADD_CHAT_MESSAGE, payload: message }),
    replaceChatMessage: (idPrefix, message) => dispatch({ type: ACTION_TYPES.REPLACE_CHAT_MESSAGE, payload: { idPrefix, message } }),
    clearChatMessages: () => dispatch({ type: ACTION_TYPES.CLEAR_CHAT_MESSAGES }),
    
    // UI 상태
    setLoading: (loading) => dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading }),
    setError: (field, message) => dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { field, message } }),
    clearErrors: () => dispatch({ type: ACTION_TYPES.CLEAR_ERRORS })
  };
  
  // Context value
  const value = {
    // 상태
    ...state,
    
    // 액션들
    ...actions,
    
    // 편의 함수들
    getAllSteps: () => {
      return [
        { title: '총급여', icon: '💰', description: '총급여액을 입력하세요' },
        { title: '인적공제', icon: '👥', description: '부양가족 정보를 입력하세요' },
        { title: '연금보험료', icon: '💳', description: '연금보험료 정보를 입력하세요' },
        { title: '세액공제', icon: '💎', description: '세액공제 항목을 입력하세요' },
        { title: '계산결과', icon: '📊', description: '연말정산 계산 결과입니다' }
      ];
    },
    
    getCurrentStepData: () => {
      const { currentStep } = state;
      const steps = value.getAllSteps();
      return steps[currentStep];
    },
    
    // 유효성 검사
    validateCurrentStep: () => {
      const { currentStep, formData } = state;
      
      switch (currentStep) {
        case 0: // 급여
          return formData.salary > 0;
        case 1: // 인적공제
          return Object.keys(formData.personalDeduction).length > 0;
        case 2: // 연금보험료
          return true; // 선택사항이므로 항상 valid
        case 3: // 세액공제
          return true; // 선택사항이므로 항상 valid
        default:
          return true;
      }
    },
    
    // 진행률 계산
    getProgress: () => {
      return ((state.currentStep + 1) / 5) * 100;
    }
  };
  
  return (
    <TaxContext.Provider value={value}>
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

// 액션 타입들을 export (테스트나 다른 곳에서 사용 가능)
export { ACTION_TYPES }; 