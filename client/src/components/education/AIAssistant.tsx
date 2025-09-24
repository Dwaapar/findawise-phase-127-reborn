import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bot, 
  User, 
  Send, 
  Minimize2, 
  Maximize2, 
  X, 
  MessageSquare,
  BookOpen,
  Lightbulb,
  Target,
  ArrowRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/lib/AnalyticsClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  messageType?: 'text' | 'suggestion' | 'recommendation' | 'quiz' | 'action';
  metadata?: {
    suggestions?: string[];
    recommendations?: Array<{
      title: string;
      description: string;
      action: string;
      url?: string;
    }>;
    quizSuggestion?: {
      title: string;
      category: string;
      difficulty: string;
    };
    relatedContent?: Array<{
      title: string;
      type: string;
      url: string;
    }>;
  };
}

interface AIAssistantProps {
  initialSubject?: string;
  userArchetype?: string;
  context?: {
    currentPage?: string;
    currentContent?: string;
    recentQuizzes?: string[];
    learningGoals?: string[];
  };
  embedded?: boolean;
  minimized?: boolean;
  onToggle?: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  initialSubject = 'general',
  userArchetype = 'curious-learner',
  context = {},
  embedded = false,
  minimized = false,
  onToggle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(!minimized);
  const [currentSubject, setCurrentSubject] = useState(initialSubject);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { trackEvent } = useAnalytics();
  const queryClient = useQueryClient();

  // Initialize chat session
  const { data: chatSession } = useQuery({
    queryKey: ['/api/education/ai-chat/init'],
    queryFn: () => apiRequest('/api/education/ai-chat/init', {
      method: 'POST',
      body: {
        subject: currentSubject,
        archetype: userArchetype,
        context
      }
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('/api/education/ai-chat/message', {
        method: 'POST',
        body: {
          chatId: chatSession?.data?.chatId,
          message,
          subject: currentSubject,
          archetype: userArchetype,
          context: {
            ...context,
            previousMessages: messages.slice(-5), // Include last 5 messages for context
          }
        }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }
      
      return response.data;
    },
    onSuccess: (response) => {
      // Add AI response to messages
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        messageType: response.messageType || 'text',
        metadata: response.metadata,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      
      // Track AI interaction
      trackEvent({
        eventType: 'ai_assistant_interaction',
        eventData: {
          subject: currentSubject,
          messageType: response.messageType,
          hasRecommendations: !!response.metadata?.recommendations,
          archetype: userArchetype,
        }
      });
    },
    onError: (error) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize with welcome message
  useEffect(() => {
    if (chatSession?.data && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date().toISOString(),
        messageType: 'suggestion',
        metadata: {
          suggestions: getInitialSuggestions(),
        },
      };
      setMessages([welcomeMessage]);
    }
  }, [chatSession, messages.length, userArchetype, currentSubject]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || sendMessageMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      await sendMessageMutation.mutateAsync(inputValue.trim());
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleRecommendationClick = (recommendation: any) => {
    if (recommendation.url) {
      window.open(recommendation.url, '_blank');
    }
    
    trackEvent({
      eventType: 'ai_recommendation_clicked',
      eventData: {
        title: recommendation.title,
        action: recommendation.action,
        subject: currentSubject,
      }
    });
  };

  const getWelcomeMessage = () => {
    const archetypeMessages = {
      'career-switcher': "Hi! I'm your AI learning assistant. I specialize in helping career switchers like you achieve your professional goals. What would you like to learn about today?",
      'curious-learner': "Hello! I'm here to help you explore and discover new knowledge. What sparks your curiosity today?",
      'academic-student': "Hi there! I'm your study companion, ready to help you excel in your academic journey. What subject can I help you master?",
      'skill-builder': "Hello! I'm here to help you build practical skills quickly and effectively. What skill would you like to develop?",
      'absolute-beginner': "Hi! I'm your friendly learning guide. Don't worry if you're just starting out - I'm here to help you learn at your own pace. What would you like to begin with?",
    };
    
    return archetypeMessages[userArchetype as keyof typeof archetypeMessages] || 
           "Hi! I'm your AI learning assistant. How can I help you learn something new today?";
  };

  const getInitialSuggestions = () => {
    const archetypeSuggestions = {
      'career-switcher': [
        "What skills are in demand for my target career?",
        "How can I build a portfolio to showcase my abilities?",
        "What certifications should I pursue?",
      ],
      'curious-learner': [
        "What's an interesting topic I should explore?",
        "Show me something I've never heard of before",
        "What are the latest trends in learning?",
      ],
      'academic-student': [
        "Help me create a study schedule",
        "How can I improve my exam performance?",
        "What are effective memorization techniques?",
      ],
      'skill-builder': [
        "What's the fastest way to learn this skill?",
        "Show me practical exercises I can do",
        "How can I practice what I'm learning?",
      ],
      'absolute-beginner': [
        "Where should I start learning?",
        "What are the basic concepts I need to know?",
        "Can you explain this in simple terms?",
      ],
    };

    return archetypeSuggestions[userArchetype as keyof typeof archetypeSuggestions] || [
      "What can you help me learn?",
      "Show me available courses",
      "Give me a learning recommendation",
    ];
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <Avatar className="w-8 h-8 bg-blue-100 dark:bg-blue-900">
            <AvatarFallback>
              <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </AvatarFallback>
          </Avatar>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-blue-600 text-white ml-auto' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {/* Render message metadata */}
          {message.metadata && (
            <div className="mt-2 space-y-2">
              {/* Suggestions */}
              {message.metadata.suggestions && (
                <div className="flex flex-wrap gap-1">
                  {message.metadata.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs h-7"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Recommendations */}
              {message.metadata.recommendations && (
                <div className="space-y-2">
                  {message.metadata.recommendations.map((rec, index) => (
                    <Card key={index} className="p-3 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100">{rec.title}</h4>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{rec.description}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRecommendationClick(rec)}
                            className="mt-2 h-6 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {rec.action}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Related Content */}
              {message.metadata.relatedContent && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Related Content:</p>
                  {message.metadata.relatedContent.map((content, index) => (
                    <a
                      key={index}
                      href={content.url}
                      className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <BookOpen className="w-3 h-3" />
                      {content.title}
                      <Badge variant="secondary" className="text-xs">
                        {content.type}
                      </Badge>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        {isUser && (
          <Avatar className="w-8 h-8 bg-gray-100 dark:bg-gray-800">
            <AvatarFallback>
              <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  if (embedded && !isExpanded) {
    return (
      <Button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg z-50"
        size="sm"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`${embedded ? 'fixed bottom-4 right-4 w-96 h-[600px] shadow-xl z-50' : 'w-full h-full'} flex flex-col`}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">AI Learning Assistant</CardTitle>
          {currentSubject !== 'general' && (
            <Badge variant="secondary" className="text-xs">
              {currentSubject}
            </Badge>
          )}
        </div>
        
        <div className="flex gap-1">
          {embedded && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-8 h-8 p-0"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4 py-4">
            {messages.map(renderMessage)}
            
            {isTyping && (
              <div className="flex gap-3 justify-start mb-4">
                <Avatar className="w-8 h-8 bg-blue-100 dark:bg-blue-900">
                  <AvatarFallback>
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about learning..."
              className="flex-1"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <Target className="w-3 h-3" />
            <span>
              Specialized for {userArchetype.replace('-', ' ')} • Subject: {currentSubject}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};