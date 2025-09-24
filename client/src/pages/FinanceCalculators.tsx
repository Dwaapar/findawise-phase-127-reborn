import React from 'react';
import { useParams } from 'wouter';
import FinanceCalculators from '@/components/Finance/FinanceCalculators';

export default function FinanceCalculatorsPage() {
  const params = useParams();
  const calculatorId = params.calculatorId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-100 py-8">
      <FinanceCalculators calculatorId={calculatorId} />
    </div>
  );
}