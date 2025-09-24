import React from 'react';
import FinanceQuiz from '@/components/Finance/FinanceQuiz';

export default function FinanceQuizPage() {
  const handleQuizComplete = (result: any) => {
    // Handle quiz completion, maybe redirect to results page or dashboard
    console.log('Quiz completed:', result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100 py-8">
      <FinanceQuiz onComplete={handleQuizComplete} />
    </div>
  );
}