import React, { createContext, useContext, useReducer } from 'react';
<<<<<<< HEAD
import { 
  calculateOtherDeduction, 
  validateOtherDeduction 
} from '../utils/calc';
=======
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44

// Context 생성
const TaxContext = createContext();

// 초기 상태
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
      'housing-rent': { checked: false, amount: 0 },
      'housing-loan': { checked: false, amount: 0, details: {} }
    },
    otherDeduction: {
      'housing-savings': { 
        checked: false, 
        amount: 0,
<<<<<<< HEAD
        inputAmount: 0,
        isHouseholdHead: false // 무주택 세대주 여부 추가
=======
        inputAmount: 0
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44
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
    },                                  // 특별소득공제 데이터
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
    finalResult: null
  },
<<<<<<< HEAD

  validation: {
    personalDeductionValidation: { isValid: true, errors: [], warnings: [] },
    pensionDeductionValidation: { isValid: true, errors: [], warnings: [] },
    specialDeductionValidation: { isValid: true, errors: [], warnings: [] },
    otherDeductionValidation: { isValid: true, errors: [], warnings: [] }
  },

  currentStep: 1,
  totalSteps: 6, 
=======
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44
  
  // 실시간 채팅 메시지
  chatMessages: [],
  
  // UI 상태
  isLoading: false,
  errors: {},
  
  // 연금보험료 관련 추가 상태
  pensionValidation: {
    isValid: true,
    errors: []
  },

  // 특별소득공제 관련 추가 상태
  specialDeductionValidation: {
    isValid: true,
    errors: []
  },

  // 그밖의 소득공제 관련 추가 상태
  otherDeductionValidation: {
    isValid: true,
    errors: []
  }  
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
  SET_SPECIAL_DEDUCTION: 'SET_SPECIAL_DEDUCTION',
  SET_OTHER_DEDUCTION: 'SET_OTHER_DEDUCTION',
  
  // 연금보험료 관련 액션 추가
  SET_PENSION_TYPE: 'SET_PENSION_TYPE',
  SET_PENSION_AMOUNT: 'SET_PENSION_AMOUNT',
  VALIDATE_PENSION: 'VALIDATE_PENSION',
  AUTO_CALCULATE_PENSION: 'AUTO_CALCULATE_PENSION',
  
  // 특별소득공제 관련 액션 추가
  SET_SPECIAL_DEDUCTION_ITEM: 'SET_SPECIAL_DEDUCTION_ITEM',
  VALIDATE_SPECIAL_DEDUCTION: 'VALIDATE_SPECIAL_DEDUCTION',  
  
  // 액션 타입 정의에 그밖의 소득공제 관련 액션 추가
  SET_OTHER_DEDUCTION_ITEM: 'SET_OTHER_DEDUCTION_ITEM',
  VALIDATE_OTHER_DEDUCTION: 'VALIDATE_OTHER_DEDUCTION',
<<<<<<< HEAD
  CALCULATE_OTHER_DEDUCTION: 'CALCULATE_OTHER_DEDUCTION',
    // 새로운 액션들
  SET_HOUSING_SAVINGS_HOUSEHOLD_HEAD: 'SET_HOUSING_SAVINGS_HOUSEHOLD_HEAD',
  UPDATE_CREDIT_CARD_DETAILS: 'UPDATE_CREDIT_CARD_DETAILS',
  RESET_OTHER_DEDUCTION: 'RESET_OTHER_DEDUCTION',
=======
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44

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
          personalDeduction: {
            ...state.formData.personalDeduction,
            ...action.payload
          }
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
      
    case ACTION_TYPES.SET_PENSION_TYPE:
      // 연금 종류 선택 시 다른 연금들 초기화
      const newPensionData = {
        'national-pension': { checked: false, amount: 0 },
        'public-pension': { checked: false, amount: 0 },
        'military-pension': { checked: false, amount: 0 },
        'private-school-pension': { checked: false, amount: 0 },
        'post-office-pension': { checked: false, amount: 0 }
      };
      
      if (action.payload !== 'none') {
        newPensionData[action.payload] = { checked: true, amount: 0 };
      }
      
      return {
        ...state,
        formData: {
          ...state.formData,
          pensionInsurance: newPensionData
        },
        calculationResults: {
          ...state.calculationResults,
          pensionInsuranceResult: null
        }
      };
      
    case ACTION_TYPES.SET_PENSION_AMOUNT:
      return {
        ...state,
        formData: {
          ...state.formData,
          pensionInsurance: {
            ...state.formData.pensionInsurance,
            [action.payload.pensionType]: {
              checked: action.payload.amount > 0,
              amount: action.payload.amount
            }
          }
        },
        calculationResults: {
          ...state.calculationResults,
          pensionInsuranceResult: null
        }
      };
      
    case ACTION_TYPES.AUTO_CALCULATE_PENSION:
      const { pensionType, salary } = action.payload;
      let autoAmount = 0;
      
      if (salary > 0) {
        const monthlySalary = (salary * 10000) / 12;
        if (pensionType === 'national-pension') {
          autoAmount = Math.round(monthlySalary * 0.045) * 12; // 4.5%
        } else {
          autoAmount = Math.round(monthlySalary * 0.09) * 12; // 9%
        }
      }
      
      return {
        ...state,
        formData: {
          ...state.formData,
          pensionInsurance: {
            ...state.formData.pensionInsurance,
            [pensionType]: {
              checked: true,
              amount: autoAmount
            }
          }
        }
      };
      
    case ACTION_TYPES.VALIDATE_PENSION:
      const pensionData = state.formData.pensionInsurance;
      const checkedPensions = Object.keys(pensionData).filter(
        key => pensionData[key]?.checked
      );
      
<<<<<<< HEAD
      let validationErrors = [];
=======
      //let validationErrors = [];
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44
      
      // 중복 가입 검증
      if (checkedPensions.length > 1) {
        if (checkedPensions.includes('national-pension')) {
          validationErrors.push('국민연금과 다른 연금은 중복으로 가입할 수 없습니다.');
        } else {
          validationErrors.push('공무원연금, 군인연금, 사학연금, 우정연금은 중복으로 가입할 수 없습니다.');
        }
      }
      
      return {
        ...state,
        pensionValidation: {
          isValid: validationErrors.length === 0,
          errors: validationErrors
        }
      };

      case ACTION_TYPES.SET_SPECIAL_DEDUCTION:
        return {
          ...state,
          formData: {
            ...state.formData,
            specialDeduction: action.payload
          },
          calculationResults: {
            ...state.calculationResults,
            specialDeductionResult: null
          }
        };
        
      case ACTION_TYPES.SET_SPECIAL_DEDUCTION_ITEM:
        return {
          ...state,
          formData: {
            ...state.formData,
            specialDeduction: {
              ...state.formData.specialDeduction,
              [action.payload.itemType]: action.payload.itemData
            }
          },
          calculationResults: {
            ...state.calculationResults,
            specialDeductionResult: null
          }
        };
<<<<<<< HEAD
        
/*       case ACTION_TYPES.VALIDATE_OTHER_DEDUCTION:
        otherData = state.formData.otherDeduction; */
=======
      case ACTION_TYPES.VALIDATE_OTHER_DEDUCTION:
        const otherData = state.formData.otherDeduction;
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44
        //const validationErrors_OTHER = [];
        
/*       case ACTION_TYPES.VALIDATE_SPECIAL_DEDUCTION:
        const specialData = state.formData.specialDeduction;
        const validationErrors1 = [];
        
        // 주택임차차입금과 주택저당차입금 중복 체크
        if (specialData['housing-rent']?.checked && specialData['housing-loan']?.checked) {
          validationErrors.push('주택임차차입금과 주택저당차입금은 중복으로 공제받을 수 없습니다.');
        }
        
        return {
          ...state,
          specialDeductionValidation: {
            isValid: validationErrors.length === 0,
            errors: validationErrors
          }
        }; */
        // Reducer 함수에 그밖의 소득공제 관련 케이스 추가
      case ACTION_TYPES.SET_OTHER_DEDUCTION:
        return {
          ...state,
          formData: {
            ...state.formData,
<<<<<<< HEAD
            otherDeduction: {
              ...state.formData.otherDeduction,
              ...action.payload
            }  
=======
            otherDeduction: action.payload
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44
          },
          calculationResults: {
            ...state.calculationResults,
            otherDeductionResult: null
          }
        };
        
      case ACTION_TYPES.SET_OTHER_DEDUCTION_ITEM:
        return {
          ...state,
          formData: {
            ...state.formData,
<<<<<<< HEAD
            [action.payload.itemType]: {
              ...state.formData.otherDeduction[action.payload.itemType],
              ...action.payload.itemData
=======
            otherDeduction: {
              ...state.formData.otherDeduction,
              [action.payload.itemType]: action.payload.itemData
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44
            }
          },
          calculationResults: {
            ...state.calculationResults,
            otherDeductionResult: null
          }
        };
<<<<<<< HEAD

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

    case ACTION_TYPES.VALIDATE_OTHER_DEDUCTION:
      const otherData = state.formData.otherDeduction;
      salary = state.formData.salary;
      const validationResult = validateOtherDeduction(otherData, salary);
      
      return {
        ...state,
        validation: {
          ...state.validation,
          otherDeductionValidation: validationResult
        }
      };

    case ACTION_TYPES.CALCULATE_OTHER_DEDUCTION:
      const calculationResult = calculateOtherDeduction(
        state.formData.otherDeduction, 
        state.formData.salary
      );
      
      return {
        ...state,
        calculationResults: {
          ...state.calculationResults,
          otherDeductionResult: calculationResult
        }
      };

    case ACTION_TYPES.RESET_OTHER_DEDUCTION:
      return {
        ...state,
        formData: {
          ...state.formData,
          otherDeduction: initialState.formData.otherDeduction
        },
        calculationResults: {
          ...state.calculationResults,
          otherDeductionResult: null
        },
        validation: {
          ...state.validation,
          otherDeductionValidation: { isValid: true, errors: [], warnings: [] }
        }
      };
        
=======
      
      case ACTION_TYPES.VALIDATE_OTHER_DEDUCTION:
        otherData = state.formData.otherDeduction;
        const validationErrors = [];
        
        // 신용카드 상세정보 검증
        if (otherData['credit-card']?.checked) {
          const details = otherData['credit-card'].details || {};
          const totalCardAmount = Object.values(details).reduce((sum, val) => sum + (val || 0), 0);
          
          if (totalCardAmount === 0) {
            validationErrors.push('신용카드 등을 선택하셨다면 최소 한 항목은 입력해주세요.');
          }
        }
        
        return {
          ...state,
          otherDeductionValidation: {
            isValid: validationErrors.length === 0,
            errors: validationErrors
          }
        };        
        
>>>>>>> 49dd35abc0da264140b00e585d9ede58b104ea44
      case ACTION_TYPES.SET_TAX_DEDUCTION:
        return {
          ...state,
          formData: {
            ...state.formData,
            taxDeduction: action.payload
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
            ...state.chatMessages.filter(msg => ! msg.id?.startsWith(action.payload.idPrefix)),
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
    setSpecialDeduction: (amount) => dispatch({ type: ACTION_TYPES.SET_SPECIAL_DEDUCTION, payload: amount }),
    setOtherDeduction: (amount) => dispatch({ type: ACTION_TYPES.SET_OTHER_DEDUCTION, payload: amount }),
    
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
      const { currentStep, formData, pensionValidation } = state;
      
      switch (currentStep) {
        case 0: // 급여
          return formData.salary > 0;
        case 1: // 인적공제
          return Object.keys(formData.personalDeduction).length > 0;
        case 2: // 연금보험료
          return pensionValidation.isValid; // 연금보험료 유효성 검사
        case 3: // 세액공제
          return true; // 선택사항이므로 항상 valid
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
      return Object.values(specialData).reduce(
        (total, item) => total + (item?.amount || 0), 0
      );
    },
    
    getSelectedSpecialDeductions: () => {
      const specialData = state.formData.specialDeduction;
      return Object.keys(specialData).filter(key => specialData[key]?.checked);
    },

    // 그밖의 소득공제 관련 헬퍼 함수들
    getOtherDeductionTotal: () => {
      const otherData = state.formData.otherDeduction;
      return Object.values(otherData).reduce(
        (total, item) => total + (item?.amount || 0), 0
      );
    },
    
    getSelectedOtherDeductions: () => {
      const otherData = state.formData.otherDeduction;
      return Object.keys(otherData).filter(key => otherData[key]?.checked);
    },
    
    getCreditCardUsageTotal: () => {
      const creditCardData = state.formData.otherDeduction['credit-card'];
      if (!creditCardData?.details) return 0;
      
      const { credit, check, traditional, transport, culture } = creditCardData.details;
      return (credit || 0) + (check || 0) + (traditional || 0) + (transport || 0) + (culture || 0);
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