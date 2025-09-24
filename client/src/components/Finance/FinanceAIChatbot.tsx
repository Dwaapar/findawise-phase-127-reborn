import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Bot, User, Loader2, TrendingUp, PiggyBank, CreditCard, Target } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  financial_data?: any;
}

interface FinanceAIChatbotProps {
  sessionId: string;
  userPersona?: string;
  compact?: boolean;
}

export default function FinanceAIChatbot({ sessionId, userPersona, compact = false }: FinanceAIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(compact);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Load chat history
    loadChatHistory();
    
    // Add welcome message
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'assistant',
        content: `Hi! I'm your AI Financial Advisor. I can help you with budgeting, investing, debt management, and personalized financial advice${userPersona ? ` tailored to your ${userPersona} profile` : ''}. What financial question can I help you with today?`,
        timestamp: new Date(),
        suggestions: [
          "Help me create a budget",
          "How should I start investing?", 
          "I want to pay off debt faster",
          "Plan for retirement",
          "Build an emergency fund"
        ]
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/finance/ai-chat/history/${sessionId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          setMessages(result.data.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        }
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    trackEvent({
      eventType: 'ai_chat_message',
      eventData: { 
        message_length: input.length,
        user_persona: userPersona 
      }
    });

    try {
      const response = await fetch('/api/finance/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input.trim(),
          userPersona,
          chatHistory: messages.slice(-10) // Last 10 messages for context
        })
      });

      if (response.ok) {
        const result = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: result.data.response,
          timestamp: new Date(),
          suggestions: result.data.suggestions,
          financial_data: result.data.financial_data
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant', 
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or feel free to explore our calculators and guides in the meantime.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (compact && isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 bg-emerald-600 hover:bg-emerald-700 shadow-lg z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`${compact ? 'fixed bottom-4 right-4 w-96 z-50 shadow-2xl' : 'w-full max-w-4xl mx-auto'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-600" />
          AI Financial Advisor
          {userPersona && (
            <Badge variant="outline" className="ml-2">
              {userPersona.replace('-', ' ')}
            </Badge>
          )}
        </CardTitle>
        {compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
          >
            ×
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className={`space-y-4 overflow-y-auto ${compact ? 'h-96' : 'h-[500px]'} pr-2`}>
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${message.type === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-3`}>
                <div className="flex items-start gap-2 mb-2">
                  {message.type === 'assistant' ? (
                    <Bot className="w-4 h-4 mt-0.5 text-emerald-600" />
                  ) : (
                    <User className="w-4 h-4 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>

                {/* Financial Data Visualization */}
                {message.financial_data && (
                  <div className="mt-3 p-3 bg-white rounded border grid grid-cols-2 gap-2 text-xs">
                    {message.financial_data.monthly_budget && (
                      <div className="flex items-center gap-1">
                        <PiggyBank className="w-3 h-3" />
                        <span>Budget: ${message.financial_data.monthly_budget}</span>
                      </div>
                    )}
                    {message.financial_data.investment_suggestion && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Invest: ${message.financial_data.investment_suggestion}</span>
                      </div>
                    )}
                    {message.financial_data.debt_payoff && (
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        <span>Debt: {message.financial_data.debt_payoff} months</span>
                      </div>
                    )}
                    {message.financial_data.savings_goal && (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>Goal: ${message.financial_data.savings_goal}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-xs bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
                
                <div className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600" />
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your finances..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center">
          AI advice is for educational purposes only. Consider consulting a certified financial planner for personalized advice.
        </div>
      </CardContent>
    </Card>
  );
}