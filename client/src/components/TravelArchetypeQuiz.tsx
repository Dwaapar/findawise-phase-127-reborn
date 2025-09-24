import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Compass, CheckCircle, Star } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: {
    value: string;
    text: string;
    archetype: string;
  }[];
}

interface ArchetypeResult {
  id: string;
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  recommendations: string[];
  preferredDestinations: string[];
  budgetRange: string;
}

const questions: Question[] = [
  {
    id: "1",
    text: "What motivates you most when choosing a travel destination?",
    options: [
      { value: "adventure", text: "Adrenaline-pumping activities and extreme sports", archetype: "adventurer" },
      { value: "culture", text: "Rich history, museums, and authentic local experiences", archetype: "culture-seeker" },
      { value: "relaxation", text: "Peaceful beaches, spas, and stress-free environments", archetype: "relaxation-seeker" },
      { value: "budget", text: "Getting the most value and experiences for my money", archetype: "budget-traveler" },
      { value: "luxury", text: "Premium accommodations and exclusive experiences", archetype: "luxury-traveler" }
    ]
  },
  {
    id: "2", 
    text: "How do you prefer to plan your trips?",
    options: [
      { value: "spontaneous", text: "I like to be spontaneous and go with the flow", archetype: "adventurer" },
      { value: "detailed", text: "I research extensively and plan every detail", archetype: "culture-seeker" },
      { value: "guided", text: "I prefer guided tours and organized itineraries", archetype: "relaxation-seeker" },
      { value: "deals", text: "I focus on finding the best deals and discounts", archetype: "budget-traveler" },
      { value: "concierge", text: "I use a travel concierge or luxury travel agent", archetype: "luxury-traveler" }
    ]
  },
  {
    id: "3",
    text: "What's your ideal accommodation style?",
    options: [
      { value: "hostel", text: "Hostels or camping - meeting fellow travelers", archetype: "adventurer" },
      { value: "boutique", text: "Boutique hotels with local character", archetype: "culture-seeker" },
      { value: "resort", text: "All-inclusive resorts with full amenities", archetype: "relaxation-seeker" },
      { value: "budget", text: "Clean, affordable options like Airbnb or budget hotels", archetype: "budget-traveler" },
      { value: "luxury", text: "5-star hotels and premium suites", archetype: "luxury-traveler" }
    ]
  },
  {
    id: "4",
    text: "How do you approach trying local food?",
    options: [
      { value: "street", text: "I'll try anything - street food, local markets, the works!", archetype: "adventurer" },
      { value: "authentic", text: "I seek out authentic restaurants recommended by locals", archetype: "culture-seeker" },
      { value: "familiar", text: "I prefer familiar cuisines with some local touches", archetype: "relaxation-seeker" },
      { value: "cheap", text: "I look for delicious food at reasonable prices", archetype: "budget-traveler" },
      { value: "fine", text: "I enjoy fine dining and Michelin-starred experiences", archetype: "luxury-traveler" }
    ]
  },
  {
    id: "5",
    text: "What's your preferred trip duration?",
    options: [
      { value: "extended", text: "Long trips (1+ months) to really explore", archetype: "adventurer" },
      { value: "immersive", text: "2-3 weeks to deeply experience the culture", archetype: "culture-seeker" },
      { value: "week", text: "1-2 weeks of pure relaxation", archetype: "relaxation-seeker" },
      { value: "weekend", text: "Long weekends or short breaks to save money", archetype: "budget-traveler" },
      { value: "luxury-short", text: "Short but luxurious trips when time permits", archetype: "luxury-traveler" }
    ]
  }
];

const archetypeResults: Record<string, ArchetypeResult> = {
  "adventurer": {
    id: "adventurer",
    name: "The Adventure Seeker",
    emoji: "🏔️",
    description: "You crave excitement and unique experiences. You're drawn to destinations that offer adventure sports, outdoor activities, and off-the-beaten-path discoveries.",
    traits: ["Spontaneous", "Risk-taking", "Active", "Flexible", "Independent"],
    recommendations: [
      "Book adventure tours and extreme sports activities",
      "Consider travel insurance for high-risk activities", 
      "Pack versatile, durable gear for various climates",
      "Join adventure travel communities for tips and companions"
    ],
    preferredDestinations: ["New Zealand", "Nepal", "Costa Rica", "Iceland", "Patagonia"],
    budgetRange: "mid-range"
  },
  "culture-seeker": {
    id: "culture-seeker", 
    name: "The Culture Enthusiast",
    emoji: "🏛️",
    description: "You're passionate about history, art, and authentic cultural experiences. You love learning about different societies and connecting with local traditions.",
    traits: ["Curious", "Educational", "Respectful", "Patient", "Observant"],
    recommendations: [
      "Research cultural etiquette before visiting",
      "Book museum passes and cultural site tickets in advance",
      "Learn basic phrases in the local language",
      "Stay in locally-owned accommodations"
    ],
    preferredDestinations: ["Italy", "Japan", "Greece", "Egypt", "Peru"],
    budgetRange: "mid-range"
  },
  "relaxation-seeker": {
    id: "relaxation-seeker",
    name: "The Relaxation Expert", 
    emoji: "🏖️",
    description: "You travel to unwind and recharge. You prefer stress-free experiences with beautiful scenery, comfortable accommodations, and peaceful environments.",
    traits: ["Peaceful", "Comfort-focused", "Stress-averse", "Wellness-oriented", "Easy-going"],
    recommendations: [
      "Book spa treatments and wellness activities in advance",
      "Choose destinations with reliable weather",
      "Consider all-inclusive packages for convenience",
      "Pack comfortable clothing and relaxation essentials"
    ],
    preferredDestinations: ["Maldives", "Bali", "Santorini", "Hawaii", "Tuscany"],
    budgetRange: "mid-to-high"
  },
  "budget-traveler": {
    id: "budget-traveler",
    name: "The Smart Saver",
    emoji: "💰", 
    description: "You're savvy about travel costs and love finding great deals. You maximize your travel experiences while being mindful of your budget.",
    traits: ["Resourceful", "Deal-savvy", "Flexible", "Research-oriented", "Value-conscious"],
    recommendations: [
      "Use travel deal websites and apps",
      "Consider off-season travel for better prices",
      "Book flights and accommodations well in advance",
      "Look for free activities and local experiences"
    ],
    preferredDestinations: ["Thailand", "Vietnam", "Eastern Europe", "Mexico", "India"],
    budgetRange: "budget"
  },
  "luxury-traveler": {
    id: "luxury-traveler",
    name: "The Luxury Connoisseur", 
    emoji: "✨",
    description: "You appreciate the finer things in life and travel for exclusive, high-end experiences. Comfort, service, and quality are your top priorities.",
    traits: ["Quality-focused", "Service-oriented", "Exclusive", "Comfort-loving", "Time-conscious"],
    recommendations: [
      "Book premium accommodations and experiences early",
      "Consider private tours and concierge services",
      "Research fine dining and exclusive venues",
      "Pack premium luggage and travel accessories"
    ],
    preferredDestinations: ["Monaco", "Dubai", "Switzerland", "French Riviera", "Singapore"],
    budgetRange: "luxury"
  }
};

interface TravelArchetypeQuizProps {
  onComplete?: (archetype: ArchetypeResult) => void;
}

export function TravelArchetypeQuiz({ onComplete }: TravelArchetypeQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<ArchetypeResult | null>(null);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canProceed = answers[questions[currentQuestion].id];

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResult = () => {
    // Count archetype scores
    const scores: Record<string, number> = {};
    
    Object.values(answers).forEach(answerId => {
      const question = questions.find(q => 
        q.options.some(opt => opt.value === answerId)
      );
      const option = question?.options.find(opt => opt.value === answerId);
      
      if (option) {
        scores[option.archetype] = (scores[option.archetype] || 0) + 1;
      }
    });

    // Find the archetype with highest score
    const topArchetype = Object.entries(scores).reduce((a, b) => 
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    const archetypeResult = archetypeResults[topArchetype];
    setResult(archetypeResult);
    setIsComplete(true);
    onComplete?.(archetypeResult);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setIsComplete(false);
    setResult(null);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (isComplete && result) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <span className="text-3xl">{result.emoji}</span>
            You are {result.name}!
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            {result.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traits */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Your Travel Traits
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.traits.map((trait, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personalized Tips</h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Preferred Destinations */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Destinations Perfect for You</h3>
            <div className="flex flex-wrap gap-2">
              {result.preferredDestinations.map((destination, index) => (
                <Badge key={index} variant="outline" className="px-3 py-2 text-sm">
                  📍 {destination}
                </Badge>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Your Budget Style</h4>
            <Badge className="capitalize">
              {result.budgetRange.replace('-', ' to ')} Range
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button className="flex-1" size="lg">
              View Personalized Destinations
            </Button>
            <Button variant="outline" size="lg" onClick={resetQuiz}>
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="h-6 w-6 text-blue-600" />
            <CardTitle>Travel Archetype Discovery</CardTitle>
          </div>
          <Badge variant="secondary">
            {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="p-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">
            {questions[currentQuestion].text}
          </h2>
          
          <RadioGroup
            value={answers[questions[currentQuestion].id] || ""}
            onValueChange={(value) => handleAnswer(questions[currentQuestion].id, value)}
            className="space-y-4"
          >
            {questions[currentQuestion].options.map((option) => (
              <div key={option.value} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-2"
          >
            {currentQuestion === questions.length - 1 ? "Get Results" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}