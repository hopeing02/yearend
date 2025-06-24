import React from 'react';
import { useTax } from '../context/TaxContext';
import { calculatePersonalDeduction, formatNumber } from '../utils/calc';

/**
 * 인적공제 입력 컴포넌트
 * calc.js의 calculatePersonalDeduction 함수에 맞는 인터페이스 제공
 */
const PersonalDeductionInput = () => {
  // Context에서 상태와 액션들을 가져옴
  const { formData, setPersonalDeduction, nextStep, prevStep } = useTax();
  const personalDeduction = formData.personalDeduction || {};

  // 공제 대상자 옵션들
  const deductionTargets = [
    { id: 'personal', label: '본인', value: 'personal' },
    { id: 'spouse', label: '배우자', value: 'spouse' },
    { id: 'parent', label: '부모', value: 'parent' },
    { id: 'child', label: '자녀', value: 'child' },
    { id: 'sibling', label: '형제자매', value: 'sibling' },
    { id: 'elderly', label: '경로우대', value: 'elderly' },
    { id: 'disabled', label: '장애인', value: 'disabled' },
    { id: 'single-parent', label: '한부모', value: 'single-parent' },
    { id: 'female', label: '부녀자', value: 'female' }
  ];

  // 공제 대상자 변경 핸들러
  const handleTargetChange = (targetValue) => {
    setPersonalDeduction(prev => ({
      ...prev,
      target: targetValue
    }));
  };

  // 입력값 변경 핸들러
  const handleInputChange = (field, value, type = 'count') => {
    setPersonalDeduction(prev => ({
      ...prev,
      [field]: type === 'checkbox' 
        ? { checked: value, count: value ? 1 : 0 }
        : { checked: value > 0, count: value }
    }));
  };

  // 실시간 계산 결과
  const calculationResult = calculatePersonalDeduction(personalDeduction);

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* 메인 헤더 */}
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
          <div className="relative text-6xl md:text-7xl">👥</div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
          인적공제 입력
        </h1>
        <p className="text-xl md:text-2xl font-bold text-gray-700 mb-3">
          부양가족 정보를 입력해주세요
        </p>
        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          기본공제는 1인당 150만원, 추가공제는 경로우대, 장애인, 한부모, 부녀자 등에 적용됩니다
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 backdrop-blur-sm">
        {/* 단계 표시 */}
        <div className="flex items-center justify-center mb-10">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg">
            <span className="text-sm opacity-90">STEP</span> 2 / 5
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 입력 영역 */}
          <div className="space-y-8">
            {/* 공제 대상자 선택 */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="text-3xl mr-3">🎯</span>
                공제 대상자 선택
              </h3>
              <div className="form-section">
                <div className="form-group">
                  <div className="radio-group">
                    {deductionTargets.map((target) => (
                      <div key={target.id} className="radio-item">
                        <input
                          type="radio"
                          name="deductionTarget"
                          id={target.id}
                          value={target.value}
                          checked={personalDeduction.target === target.value}
                          onChange={(e) => handleTargetChange(e.target.value)}
                        />
                        <label htmlFor={target.id}>{target.label}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 선택된 대상자별 공제 정보 */}
            {personalDeduction.target && (
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <span className="text-3xl mr-3">📋</span>
                  {deductionTargets.find(t => t.value === personalDeduction.target)?.label} 공제 정보
                </h3>
                
                {/* 기본공제 섹션 */}
                <div className="space-y-6">
                  {/* 본인 */}
                  {personalDeduction.target === 'personal' && (
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">👤</span>
                        본인
                      </h4>
                      <p className="text-gray-600 mb-4">본인은 기본적으로 공제 대상입니다</p>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={personalDeduction.self?.checked !== false}
                          onChange={(e) => handleInputChange('self', e.target.checked, 'checkbox')}
                          className="w-6 h-6 text-blue-600 rounded-lg focus:ring-blue-500"
                        />
                        <span className="font-medium text-gray-700">본인 공제 적용</span>
                      </label>
                      <div className="mt-3 text-lg font-bold text-blue-600">
                        공제액: {formatNumber((personalDeduction.self?.checked !== false ? 1500000 : 0))}원
                      </div>
                    </div>
                  )}

                  {/* 배우자 */}
                  {personalDeduction.target === 'spouse' && (
                    <div className="bg-pink-50 p-6 rounded-2xl border border-pink-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">💑</span>
                        배우자
                      </h4>
                      <p className="text-gray-600 mb-4">배우자의 연소득이 100만원 이하인 경우</p>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={personalDeduction.spouse?.checked || false}
                          onChange={(e) => handleInputChange('spouse', e.target.checked, 'checkbox')}
                          className="w-6 h-6 text-pink-600 rounded-lg focus:ring-pink-500"
                        />
                        <span className="font-medium text-gray-700">배우자 공제 적용</span>
                      </label>
                      <div className="mt-3 text-lg font-bold text-pink-600">
                        공제액: {formatNumber((personalDeduction.spouse?.count || 0) * 1500000)}원
                      </div>
                    </div>
                  )}

                  {/* 부모/조부모 */}
                  {personalDeduction.target === 'parent' && (
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">👴</span>
                        부모/조부모
                      </h4>
                      <p className="text-gray-600 mb-4">60세 이상이고 연소득 100만원 이하인 직계존속</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            부모/조부모 수
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={personalDeduction.parents?.count || 0}
                            onChange={(e) => handleInputChange('parents', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                            placeholder="부모/조부모 수"
                          />
                        </div>
                        <div className="text-lg font-bold text-orange-600">
                          공제액: {formatNumber((personalDeduction.parents?.count || 0) * 1500000)}원
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 자녀/손자녀 */}
                  {personalDeduction.target === 'child' && (
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">👶</span>
                        자녀/손자녀
                      </h4>
                      <p className="text-gray-600 mb-4">20세 이하이거나 연소득 100만원 이하인 직계비속</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            자녀/손자녀 수
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={personalDeduction.children?.count || 0}
                            onChange={(e) => handleInputChange('children', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                            placeholder="자녀/손자녀 수"
                          />
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          공제액: {formatNumber((personalDeduction.children?.count || 0) * 1500000)}원
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 형제자매 */}
                  {personalDeduction.target === 'sibling' && (
                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">👫</span>
                        형제자매
                      </h4>
                      <p className="text-gray-600 mb-4">60세 이상 또는 20세 이하이고 연소득 100만원 이하</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            형제자매 수
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={personalDeduction.siblings?.count || 0}
                            onChange={(e) => handleInputChange('siblings', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                            placeholder="형제자매 수"
                          />
                        </div>
                        <div className="text-lg font-bold text-purple-600">
                          공제액: {formatNumber((personalDeduction.siblings?.count || 0) * 1500000)}원
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 경로우대 */}
                  {personalDeduction.target === 'elderly' && (
                    <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">👵</span>
                        경로우대 (70세 이상)
                      </h4>
                      <p className="text-gray-600 mb-4">70세 이상 부양가족 1인당 100만원 추가공제</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            70세 이상 부양가족 수
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={personalDeduction.senior?.count || 0}
                            onChange={(e) => handleInputChange('senior', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-lg"
                            placeholder="70세 이상 부양가족 수"
                          />
                        </div>
                        <div className="text-lg font-bold text-yellow-600">
                          공제액: {formatNumber((personalDeduction.senior?.count || 0) * 1000000)}원
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 장애인 */}
                  {personalDeduction.target === 'disabled' && (
                    <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">♿</span>
                        장애인
                      </h4>
                      <p className="text-gray-600 mb-4">장애인 부양가족 1인당 200만원 추가공제</p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            장애인 부양가족 수
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            value={personalDeduction.disabled?.count || 0}
                            onChange={(e) => handleInputChange('disabled', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg"
                            placeholder="장애인 부양가족 수"
                          />
                        </div>
                        <div className="text-lg font-bold text-red-600">
                          공제액: {formatNumber((personalDeduction.disabled?.count || 0) * 2000000)}원
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 한부모 가정 */}
                  {personalDeduction.target === 'single-parent' && (
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
                        한부모 가정
                      </h4>
                      <p className="text-gray-600 mb-4">한부모 가정의 경우 100만원 추가공제 (부녀자 공제와 중복시 우선 적용)</p>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={personalDeduction['single-parent']?.checked || false}
                          onChange={(e) => handleInputChange('single-parent', e.target.checked, 'checkbox')}
                          className="w-6 h-6 text-indigo-600 rounded-lg focus:ring-indigo-500"
                        />
                        <span className="font-medium text-gray-700">한부모 가정 공제 적용</span>
                      </label>
                      <div className="mt-3 text-lg font-bold text-indigo-600">
                        공제액: {formatNumber((personalDeduction['single-parent']?.count || 0) * 1000000)}원
                      </div>
                    </div>
                  )}

                  {/* 부녀자 */}
                  {personalDeduction.target === 'female' && (
                    <div className="bg-teal-50 p-6 rounded-2xl border border-teal-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="text-2xl mr-3">👩</span>
                        부녀자
                      </h4>
                      <p className="text-gray-600 mb-4">부녀자의 경우 50만원 추가공제 (한부모 공제와 중복시 한부모 공제 우선)</p>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={personalDeduction.female?.checked || false}
                          onChange={(e) => handleInputChange('female', e.target.checked, 'checkbox')}
                          className="w-6 h-6 text-teal-600 rounded-lg focus:ring-teal-500"
                        />
                        <span className="font-medium text-gray-700">부녀자 공제 적용</span>
                      </label>
                      <div className="mt-3 text-lg font-bold text-teal-600">
                        공제액: {formatNumber((personalDeduction.female?.count || 0) * 500000)}원
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 공제 대상자 미선택 시 안내 */}
            {!personalDeduction.target && (
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 text-center">
                <div className="text-4xl mb-4">👆</div>
                <h4 className="text-lg font-bold text-gray-800 mb-2">공제 대상자를 선택해주세요</h4>
                <p className="text-gray-600">위의 라디오 버튼에서 공제 대상자를 선택하면 해당하는 공제 정보를 입력할 수 있습니다.</p>
              </div>
            )}
          </div>

          {/* 실시간 계산 결과 */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="text-3xl mr-3">📊</span>
                실시간 계산 결과
              </h3>
              
              <div className="space-y-4">
                {/* 기본공제 */}
                <div className="bg-white p-4 rounded-xl border border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-2">기본공제</h4>
                  <div className="text-sm text-gray-600 mb-2">
                    공제 대상: {calculationResult.basicDeductionCount}명
                  </div>
                  <div className="text-xl font-bold text-blue-600">
                    {formatNumber(calculationResult.basicDeduction)}원
                  </div>
                </div>

                {/* 추가공제 */}
                <div className="bg-white p-4 rounded-xl border border-green-200">
                  <h4 className="font-bold text-green-800 mb-2">추가공제</h4>
                  <div className="text-sm text-gray-600 mb-2">
                    {calculationResult.deductionDetails.length > 0 ? (
                      calculationResult.deductionDetails.map((detail, index) => (
                        <div key={index} className="mb-1">
                          {detail.type}: {detail.count}명 × {formatNumber(detail.unitAmount)}원
                          {detail.note && <div className="text-xs text-orange-600">{detail.note}</div>}
                        </div>
                      ))
                    ) : (
                      "적용된 추가공제 없음"
                    )}
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {formatNumber(calculationResult.additionalDeduction)}원
                  </div>
                </div>

                {/* 총 인적공제 */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl text-white">
                  <h4 className="font-bold mb-2">총 인적공제</h4>
                  <div className="text-2xl font-bold">
                    {formatNumber(calculationResult.totalDeduction)}원
                  </div>
                </div>
              </div>
            </div>

            {/* 도움말 */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center">
                <span className="text-xl mr-2">💡</span>
                인적공제 안내
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• <strong>기본공제:</strong> 1인당 150만원 (본인, 배우자, 부모, 자녀, 형제자매)</li>
                <li>• <strong>경로우대:</strong> 70세 이상 1인당 100만원 추가</li>
                <li>• <strong>장애인:</strong> 1인당 200만원 추가</li>
                <li>• <strong>한부모:</strong> 100만원 추가 (부녀자 공제와 중복시 우선)</li>
                <li>• <strong>부녀자:</strong> 50만원 추가</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-200">
          <button
            onClick={prevStep}
            className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors duration-300 flex items-center"
          >
            <span className="mr-2">←</span>
            이전 단계
          </button>
          
          <button
            onClick={nextStep}
            disabled={calculationResult.totalDeduction === 0}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음 단계
            <span className="ml-2">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalDeductionInput; 