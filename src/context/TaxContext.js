/* import React, { createContext, useContext, useReducer } from 'react';
import { 
  calculateOtherDeduction, 
  validateOtherDeduction 
} from '../utils/calc'; */

import React, { createContext, useContext, useReducer } from 'react';

// Context 생성
const TaxContext = createContext();

// 액션 타입 정의
export const ACTION_TYPES = {
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
  SET_SPECIAL_DEDUCTION: 'SET_SPECIAL_DEDUCTION',
  SET_OTHER_DEDUCTION: 'SET_OTHER_DEDUCTION',
  
  // 연금보험료 관련 액션
  SET_PENSION_TYPE: 'SET_PENSION_TYPE',
  SET_PENSION_AMOUNT: 'SET_PENSION_AMOUNT',
  VALIDATE_PENSION: 'VALIDATE_PENSION',
  AUTO_CALCULATE_PENSION: 'AUTO_CALCULATE_PENSION',
  
  // 특별소득공제 관련 액션
  SET_SPECIAL_DEDUCTION_ITEM: 'SET_SPECIAL_DEDUCTION_ITEM',
  VALIDATE_SPECIAL_DEDUCTION: 'VALIDATE_SPECIAL_DEDUCTION',  
  
  // 그밖의 소득공제 관련 액션
  SET_OTHER_DEDUCTION_ITEM: 'SET_OTHER_DEDUCTION_ITEM',
  VALIDATE_OTHER_DEDUCTION: 'VALIDATE_OTHER_DEDUCTION',
  SET_HOUSING_SAVINGS_HOUSEHOLD_HEAD: 'SET_HOUSING_SAVINGS_HOUSEHOLD_HEAD',
  UPDATE_CREDIT_CARD_DETAILS: 'UPDATE_CREDIT_CARD_DETAILS',
  RESET_OTHER_DEDUCTION: 'RESET_OTHER_DEDUCTION',

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

// 초기 상태
const initialState = {
  // 현재 진행 단계
  currentStep: 0,
  
  // 폼 데이터
  formData: {
    salary: 0,
    personalDeduction: {
      target: 'personal',
      self: { checked: true, count: 1 }
    },
    pensionInsurance: {
      'national-pension': { checked: false, amount: 0 },
      'public-pension': { checked: false, amount: 0 }
    },
    specialDeduction: {
      insurance: { checked: false, amount: 0 },
      'housing-rent': { checked: false, amount: 0 },
      'housing-loan': { checked: false, amount: 0, details: {} }
    },
    otherDeduction: {
      'housing-savings': { 
        checked: false, 
        amount: 0,
        inputAmount: 0,
        isHouseholdHead: false
      },
      'credit-card': { 
        checked: false, 
        amount: 0,
        details: {
          credit: 0,
          check: 0,
          traditional: 0,
          transport: 0,
          culture: 0,
          lastYear: 0
        }
      }
    },
    taxDeduction: {}
  },
  
  // 계산 결과 캐시
  calculationResults: {
    laborIncomeDeduction: null,
    personalDeductionResult: null,
    pensionInsuranceResult: null,
    specialDeductionResult: null,
    otherDeductionResult: null,
    taxBaseResult: null,
    finalResult: null
  },
  
  // 실시간 채팅 메시지
  chatMessages: [],
  
  // UI 상태
  isLoading: false,
  errors: {},
  
  // 유효성 검사 상태
  validation: {
    pensionValidation: { isValid: true, errors: [] },
    specialDeductionValidation: { isValid: true, errors: [] },
    otherDeductionValidation: { isValid: true, errors: [] }
  }
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
        currentStep: Math.min(state.currentStep + 1, 7)
      };
      
    case ACTION_TYPES.PREV_STEP:
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0)
      };
      
    case ACTION_TYPES.RESET_FORM:
      return initialState;
      
    case ACTION_TYPES.SET_SALARY:
      return {
        ...state,
        formData: {
          ...state.formData,
          salary: action.payload
        }
      };
      
    case ACTION_TYPES.SET_PERSONAL_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          personalDeduction: action.payload
        }
      };
      
    case ACTION_TYPES.SET_PENSION_INSURANCE:
      return {
        ...state,
        formData: {
          ...state.formData,
          pensionInsurance: action.payload
        }
      };
      
    case ACTION_TYPES.SET_SPECIAL_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          specialDeduction: action.payload
        }
      };
      
    case ACTION_TYPES.SET_OTHER_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          otherDeduction: action.payload
        }
      };
      
    case ACTION_TYPES.SET_OTHER_DEDUCTION_ITEM:
      return {
        ...state,
        formData: {
          ...state.formData,
          otherDeduction: {
            ...state.formData.otherDeduction,
            [action.payload.itemType]: {
              ...state.formData.otherDeduction[action.payload.itemType],
              ...action.payload.itemData
            }
          }
        }
      };
      
    case ACTION_TYPES.SET_HOUSING_SAVINGS_HOUSEHOLD_HEAD:
      return {
        ...state,
        formData: {
          ...state.formData,
          otherDeduction: {
            ...state.formData.otherDeduction,
            'housing-savings': {
              ...state.formData.otherDeduction['housing-savings'],
              isHouseholdHead: action.payload
            }
          }
        }
      };
      
    case ACTION_TYPES.UPDATE_CREDIT_CARD_DETAILS:
      return {
        ...state,
        formData: {
          ...state.formData,
          otherDeduction: {
            ...state.formData.otherDeduction,
            'credit-card': {
              ...state.formData.otherDeduction['credit-card'],
              details: {
                ...state.formData.otherDeduction['credit-card'].details,
                ...action.payload
              }
            }
          }
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
      
    case ACTION_TYPES.ADD_CHAT_MESSAGE:
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload]
      };
      
    case ACTION_TYPES.CLEAR_CHAT_MESSAGES:
      return {
        ...state,
        chatMessages: []
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
   
    // 연금보험료 관련 액션
    setPensionType: (pensionType) => dispatch({ type: ACTION_TYPES.SET_PENSION_TYPE, payload: pensionType }),
    setPensionAmount: (pensionType, amount) => dispatch({
      type: ACTION_TYPES.SET_PENSION_AMOUNT,
      payload: { pensionType, amount }
    }),
    validatePension: () => dispatch({ type: ACTION_TYPES.VALIDATE_PENSION }),
    autoCalculatePension: (pensionType, salary) => dispatch({
      type: ACTION_TYPES.AUTO_CALCULATE_PENSION,
      payload: { pensionType, salary }
    }),

    // 특별소득공제 관련 액션
    setSpecialDeduction: (data) => dispatch({ type: ACTION_TYPES.SET_SPECIAL_DEDUCTION, payload: data }),
    setSpecialDeductionItem: (itemType, itemData) => dispatch({
      type: ACTION_TYPES.SET_SPECIAL_DEDUCTION_ITEM,
      payload: { itemType, itemData }
    }),
    validateSpecialDeduction: () => dispatch({ type: ACTION_TYPES.VALIDATE_SPECIAL_DEDUCTION }),
   
    // 그밖의 소득공제 관련 액션
    setOtherDeduction: (data) => dispatch({ type: ACTION_TYPES.SET_OTHER_DEDUCTION, payload: data }),
    setOtherDeductionItem: (itemType, itemData) => dispatch({
      type: ACTION_TYPES.SET_OTHER_DEDUCTION_ITEM,
      payload: { itemType, itemData }
    }),
    validateOtherDeduction: () => dispatch({ type: ACTION_TYPES.VALIDATE_OTHER_DEDUCTION }),
    
    // 그밖의 소득공제 개별 액션들
    setHousingSavingsHouseholdHead: (isHouseholdHead) => dispatch({ 
      type: ACTION_TYPES.SET_HOUSING_SAVINGS_HOUSEHOLD_HEAD, 
      payload: isHouseholdHead 
    }),
    updateCreditCardDetails: (details) => dispatch({ 
      type: ACTION_TYPES.UPDATE_CREDIT_CARD_DETAILS, 
      payload: details 
    }),
    resetOtherDeduction: () => dispatch({ type: ACTION_TYPES.RESET_OTHER_DEDUCTION }),
   
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
        { title: '특별소득공제', icon: '🏥', description: '특별소득공제 항목을 입력하세요' },
        { title: '그밖의 소득공제', icon: '📝', description: '그밖의 소득공제 항목을 입력하세요' },
        { title: '과세표준 및 산출세액', icon: '🧮', description: '과세표준과 산출세액을 계산합니다' },
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
      const { currentStep, formData, validation } = state;
     
      switch (currentStep) {
        case 0: // 급여
          return formData.salary > 0;
        case 1: // 인적공제
          return Object.keys(formData.personalDeduction).length > 0;
        case 2: // 연금보험료
          return validation.pensionValidation?.isValid !== false;
        case 3: // 특별소득공제
          return validation.specialDeductionValidation?.isValid !== false;
        case 4: // 그밖의 소득공제
          return validation.otherDeductionValidation?.isValid !== false;
        case 5: // 과세표준 및 산출세액
          return true;
        case 6: // 세액공제
          return true;
        default:
          return true;
      }
    },
   
    // 연금보험료 관련 헬퍼 함수들
    getSelectedPensionType: () => {
      const pensionData = state.formData.pensionInsurance;
      const selectedTypes = Object.keys(pensionData).filter(
        key => pensionData[key]?.checked
      );
      return selectedTypes.length > 0 ? selectedTypes[0] : 'none';
    },
   
    getTotalPensionAmount: () => {
      const pensionData = state.formData.pensionInsurance;
      return Object.values(pensionData).reduce(
        (total, pension) => total + (pension?.amount || 0), 0
      );
    },
 
    // 특별소득공제 관련 헬퍼 함수들
    getSpecialDeductionTotal: () => {
      const specialData = state.formData.specialDeduction;
      if (!specialData || typeof specialData !== 'object') return 0;
      return Object.values(specialData).reduce(
        (total, item) => total + (item?.amount || 0), 0
      );
    },
   
    getSelectedSpecialDeductions: () => {
      const specialData = state.formData.specialDeduction;
      if (!specialData || typeof specialData !== 'object') return [];
      return Object.keys(specialData).filter(key => specialData[key]?.checked);
    },

    // 그밖의 소득공제 관련 헬퍼 함수들
    getOtherDeductionTotal: () => {
      const otherData = state.formData.otherDeduction;
      if (!otherData || typeof otherData !== 'object') return 0;
      return Object.values(otherData).reduce(
        (total, item) => total + (item?.amount || 0), 0
      );
    },
   
    getSelectedOtherDeductions: () => {
      const otherData = state.formData.otherDeduction;
      if (!otherData || typeof otherData !== 'object') return [];
      return Object.keys(otherData).filter(key => otherData[key]?.checked);
    },
   
    getCreditCardUsageTotal: () => {
      const creditCardData = state.formData.otherDeduction?.['credit-card'];
      if (!creditCardData?.details) return 0;
     
      const { credit, check, traditional, transport, culture } = creditCardData.details;
      return (credit || 0) + (check || 0) + (traditional || 0) + (transport || 0) + (culture || 0);
    },

    // 그밖의 소득공제 상세 정보 함수들
    getHousingSavingsData: () => {
      return state.formData.otherDeduction?.['housing-savings'] || { 
        checked: false, 
        amount: 0, 
        inputAmount: 0, 
        isHouseholdHead: false 
      };
    },

    getCreditCardData: () => {
      return state.formData.otherDeduction?.['credit-card'] || { 
        checked: false, 
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
    },

    // 유효성 검사 결과 getter 함수들
    getOtherDeductionValidation: () => state.validation?.otherDeductionValidation || { 
      isValid: true, 
      errors: [], 
      warnings: [] 
    },
    
    // 총 공제액 계산
    getTotalDeduction: () => {
      const results = state.calculationResults;
      let total = 0;
      
      if (results.personalDeductionResult?.totalDeduction) {
        total += results.personalDeductionResult.totalDeduction;
      }
      if (results.pensionInsuranceResult?.totalPension) {
        total += results.pensionInsuranceResult.totalPension;
      }
      if (results.specialDeductionResult?.totalDeduction) {
        total += results.specialDeductionResult.totalDeduction;
      }
      if (results.otherDeductionResult?.totalDeduction) {
        total += results.otherDeductionResult.totalDeduction;
      }
      
      return total;
    },

    // 전체 유효성 검사
    isAllValid: () => {
      const validation = state.validation || {};
      return (validation.pensionValidation?.isValid !== false) &&
             (validation.specialDeductionValidation?.isValid !== false) &&
             (validation.otherDeductionValidation?.isValid !== false);
    },
     
    // 진행률 계산
    getProgress: () => {
      return ((state.currentStep + 1) / 8) * 100;
    },

    // 디버깅용 함수들 (개발 모드에서만)
    ...(process.env.NODE_ENV === 'development' && {
      getFullState: () => state,
      dispatch: dispatch
    })
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

export default TaxContext;