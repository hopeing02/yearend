import React from 'react';
import { TaxProvider } from './context/TaxContext';
import TaxCalculator from './components/TaxCalculator';
import './index.css';

function App() {
  return (
    <TaxProvider>
      <div className="bg-slate-50 min-h-screen p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                연말정산 계산기
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              복잡한 연말정산을 쉽고 빠르게 계산해보세요.
            </p>
          </header>
          
          <main>
            <TaxCalculator />
          </main>
          
          <footer className="mt-12 text-center text-sm text-gray-500">
            <p>💡 이 계산 결과는 참고용이며, 실제 신고 내용과 다를 수 있습니다.</p>
            <p className="mt-2">
              © 2024 Year-End Tax Calculator. All Rights Reserved.
            </p>
          </footer>
        </div>
      </div>
    </TaxProvider>
  );
}

export default App;