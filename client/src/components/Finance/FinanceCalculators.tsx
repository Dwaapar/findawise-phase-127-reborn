import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, PiggyBank, CreditCard, Shield, Target, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { financeCalculators } from '@/config/financeConfig';
import { useAnalytics } from '@/hooks/useAnalytics';

interface CalculatorProps {
  calculatorId?: string;
  embedded?: boolean;
}

export default function FinanceCalculators({ calculatorId, embedded = false }: CalculatorProps) {
  const [activeCalculator, setActiveCalculator] = useState(calculatorId || 'budget-calculator');
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [results, setResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { trackEvent, sessionId } = useAnalytics();

  const calculator = financeCalculators.find(c => c.id === activeCalculator) || financeCalculators[0];

  useEffect(() => {
    setInputs({});
    setResults(null);
    setErrors({});
  }, [activeCalculator]);

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};
    
    calculator.inputs.forEach(input => {
      if (input.required && !inputs[input.id]) {
        newErrors[input.id] = `${input.label} is required`;
      }
      
      if (input.type === 'number' && inputs[input.id]) {
        const value = Number(inputs[input.id]);
        if (isNaN(value)) {
          newErrors[input.id] = 'Please enter a valid number';
        } else if (input.min !== undefined && value < input.min) {
          newErrors[input.id] = `Value must be at least ${input.min}`;
        } else if (input.max !== undefined && value > input.max) {
          newErrors[input.id] = `Value must be no more than ${input.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (inputId: string, value: any) => {
    setInputs(prev => ({
      ...prev,
      [inputId]: value
    }));
    
    // Clear error for this field
    if (errors[inputId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[inputId];
        return newErrors;
      });
    }
  };

  const handleCalculate = async () => {
    if (!validateInputs()) return;

    setIsCalculating(true);
    
    try {
      let endpoint = '';
      let payload = { ...inputs };

      switch (activeCalculator) {
        case 'budget-calculator':
          endpoint = '/api/finance/calculate-budget';
          break;
        case 'fire-calculator':
          endpoint = '/api/finance/calculate-fire';
          payload.expectedReturn = parseFloat(inputs.expectedReturn || '0.07');
          break;
        case 'compound-interest':
          endpoint = '/api/finance/calculate-compound-interest';
          payload.annualRate = parseFloat(inputs.annualRate || '0.07');
          break;
        default:
          throw new Error('Calculator not implemented yet');
      }

      // Convert string numbers to actual numbers
      Object.keys(payload).forEach(key => {
        if (typeof payload[key] === 'string' && !isNaN(Number(payload[key]))) {
          payload[key] = Number(payload[key]);
        }
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Calculation failed');
      }

      const result = await response.json();
      setResults(result.data);

      trackEvent({
        eventType: 'calculator_used',
        eventData: { 
          calculatorId: activeCalculator,
          inputs: payload,
          hasResults: !!result.data
        }
      });

      // Save calculator result
      await fetch('/api/finance/calculator-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          calculatorType: activeCalculator,
          inputs: payload,
          results: result.data
        }),
      });

    } catch (error) {
      console.error('Calculation error:', error);
      setErrors({ general: 'Calculation failed. Please check your inputs and try again.' });
    } finally {
      setIsCalculating(false);
    }
  };

  const renderInput = (input: any) => {
    const hasError = !!errors[input.id];

    switch (input.type) {
      case 'number':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.id} className="font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={input.id}
              type="number"
              placeholder={input.placeholder}
              min={input.min}
              max={input.max}
              step={input.step}
              value={inputs[input.id] || ''}
              onChange={(e) => handleInputChange(input.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {input.helpText && (
              <p className="text-sm text-gray-600">{input.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[input.id]}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={input.id} className="space-y-2">
            <Label htmlFor={input.id} className="font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={inputs[input.id] || ''} onValueChange={(value) => handleInputChange(input.id, value)}>
              <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${input.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {input.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {input.helpText && (
              <p className="text-sm text-gray-600">{input.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[input.id]}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={input.id} className="space-y-2">
            <Label className="font-medium">
              {input.label}
              {input.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-3">
              {input.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={(inputs[input.id] || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = inputs[input.id] || [];
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      handleInputChange(input.id, newValues);
                    }}
                  />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {input.helpText && (
              <p className="text-sm text-gray-600">{input.helpText}</p>
            )}
            {hasError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors[input.id]}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!results) return null;

    switch (activeCalculator) {
      case 'budget-calculator':
        return <BudgetResults results={results} />;
      case 'fire-calculator':
        return <FIREResults results={results} />;
      case 'compound-interest':
        return <CompoundInterestResults results={results} />;
      default:
        return <div>Results not available for this calculator yet.</div>;
    }
  };

  if (embedded) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-emerald-600" />
            {calculator.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {calculator.inputs.map(renderInput)}
          </div>
          
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.general}
              </p>
            </div>
          )}

          <Button 
            onClick={handleCalculate} 
            disabled={isCalculating}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isCalculating ? 'Calculating...' : `Calculate ${calculator.name.replace(' Calculator', '')}`}
          </Button>

          {renderResults()}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Calculators</h1>
        <p className="text-gray-600">Make informed financial decisions with our comprehensive calculators</p>
      </div>

      <Tabs value={activeCalculator} onValueChange={setActiveCalculator}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 mb-8">
          {financeCalculators.map((calc) => (
            <TabsTrigger key={calc.id} value={calc.id} className="text-sm">
              {calc.name.replace(' Calculator', '')}
            </TabsTrigger>
          ))}
        </TabsList>

        {financeCalculators.map((calc) => (
          <TabsContent key={calc.id} value={calc.id}>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {calc.icon === 'calculator' && <Calculator className="w-6 h-6 text-emerald-600" />}
                    {calc.icon === 'flame' && <Target className="w-6 h-6 text-emerald-600" />}
                    {calc.icon === 'trending-up' && <TrendingUp className="w-6 h-6 text-emerald-600" />}
                    {calc.icon === 'credit-card' && <CreditCard className="w-6 h-6 text-emerald-600" />}
                    {calc.icon === 'shield' && <Shield className="w-6 h-6 text-emerald-600" />}
                    <div>
                      <div className="text-xl font-semibold">{calc.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        {calc.estimatedTime}
                        <Badge variant="outline">{calc.difficulty}</Badge>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-600">{calc.description}</p>
                  
                  <div className="space-y-4">
                    {calc.inputs.map(renderInput)}
                  </div>
                  
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.general}
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleCalculate} 
                    disabled={isCalculating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-3"
                  >
                    {isCalculating ? 'Calculating...' : `Calculate ${calc.name.replace(' Calculator', '')}`}
                  </Button>
                </CardContent>
              </Card>

              {/* Results Section */}
              <div className="space-y-6">
                {renderResults()}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function BudgetResults({ results }: { results: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-emerald-600" />
          Your Personalized Budget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">${results.monthlyEmergency}</div>
            <div className="text-sm text-gray-600">Emergency Fund</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">${results.monthlyRetirement}</div>
            <div className="text-sm text-gray-600">Retirement</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">${results.monthlyInvestments}</div>
            <div className="text-sm text-gray-600">Investments</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">${results.monthlyDebtPayment}</div>
            <div className="text-sm text-gray-600">Debt Payment</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Emergency Fund Goal</h4>
          <div className="text-3xl font-bold text-emerald-600">${results.emergencyFundGoal.toLocaleString()}</div>
          <p className="text-sm text-gray-600">Based on {results.persona.type} profile</p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Action Items</h4>
          <div className="space-y-2">
            {results.actionItems.map((item: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FIREResults({ results }: { results: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-600" />
          Your FIRE Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
          <div className="text-4xl font-bold text-orange-600 mb-2">
            ${results.fireNumber.toLocaleString()}
          </div>
          <div className="text-lg font-semibold text-gray-700">Your FIRE Number</div>
          <div className="text-sm text-gray-600">Total needed for financial independence</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${results.monthlyWithdrawalCapacity.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Monthly Income</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{results.yearsToFI} years</div>
            <div className="text-sm text-gray-600">To Financial Independence</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Milestones</h4>
          <div className="space-y-3">
            {results.milestones.map((milestone: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Age {milestone.age}</span>
                <span className="text-emerald-600 font-semibold">${milestone.projected.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {results.recommendations.map((rec: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span className="text-sm text-gray-700">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompoundInterestResults({ results }: { results: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Compound Interest Projection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">${results.totalFutureValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">${results.totalContributions.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Invested</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${results.totalInterestEarned.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Interest Earned</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Year-by-Year Breakdown</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {results.yearlyBreakdown.slice(0, 10).map((year: any) => (
              <div key={year.year} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">Year {year.year}</span>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">${year.totalValue.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">+${year.interestEarned.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {results.recommendations.map((rec: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span className="text-sm text-gray-700">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}