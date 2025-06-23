import React from 'react';

/**
 * 아코디언 섹션 컴포넌트
 * 세금 계산기의 각 단계를 아코디언 형식으로 표시합니다
 */
const AccordionSection = ({ 
  title, 
  stepNumber, 
  isCompleted = false, 
  isExpanded = false, 
  onToggle, 
  children,
  badge = null,
  description = null
}) => {
  return (
    <div className="mb-4 card">
      {/* 헤더 영역 - 클릭 가능 */}
      <div 
        className={`p-3 ${
          isExpanded ? 'border-bottom bg-light' : ''
        }`}
        onClick={onToggle}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = isExpanded ? '#f8f9fa' : '#f8f9fa'}
        onMouseLeave={(e) => e.target.style.backgroundColor = isExpanded ? '#f8f9fa' : 'transparent'}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center"
               style={{gap: '12px'}}>
            {/* 단계 번호 */}
            <div className={`
              d-flex align-items-center justify-content-center rounded-circle fw-medium small
              ${isCompleted 
                ? 'bg-success text-white' 
                : isExpanded 
                  ? 'bg-primary text-white' 
                  : 'bg-light text-muted'
              }
            `}
            style={{
              width: '28px',
              height: '28px',
              fontSize: '12px'
            }}>
              {isCompleted ? '✓' : stepNumber + 1}
            </div>
            
            {/* 제목과 설명 */}
            <div>
              <h3 className="mb-0 h6 fw-semibold text-dark">
                {title}
              </h3>
              {description && (
                <p className="mb-0 small text-muted" style={{fontSize: '11px', marginTop: '2px'}}>
                  {description}
                </p>
              )}
            </div>
            
            {/* 배지 (완료 상태 등) */}
            {badge && (
              <span className="badge bg-success-subtle text-success rounded-pill ms-2">
                {badge}
              </span>
            )}
          </div>
          
          {/* 펼침/접힘 아이콘 */}
          <div className={`
            d-flex align-items-center justify-content-center
            rounded-circle transition-all
            ${isExpanded ? 'text-primary' : 'text-muted'}
          `}
          style={{
            width: '24px',
            height: '24px',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease-in-out',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* 콘텐츠 영역 */}
      {isExpanded && (
        <div className="border-top">
          <div className="p-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccordionSection; 