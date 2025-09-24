import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Plane, 
  Clock, 
  Thermometer,
  Shield,
  CreditCard,
  Users,
  Luggage
} from "lucide-react";

interface BudgetCalculatorState {
  destination: string;
  duration: number;
  accommodationType: string;
  activities: string;
  result: number | null;
}

interface FlightTrackerState {
  from: string;
  to: string;
  date: string;
  result: any | null;
}

interface WeatherState {
  destination: string;
  result: any | null;
}

export function TravelTools() {
  const [activeTab, setActiveTab] = useState("budget");
  
  // Budget Calculator State
  const [budget, setBudget] = useState<BudgetCalculatorState>({
    destination: "",
    duration: 7,
    accommodationType: "mid-range",
    activities: "moderate",
    result: null
  });

  // Flight Tracker State
  const [flight, setFlight] = useState<FlightTrackerState>({
    from: "",
    to: "",
    date: "",
    result: null
  });

  // Weather Checker State
  const [weather, setWeather] = useState<WeatherState>({
    destination: "",
    result: null
  });

  const calculateBudget = () => {
    // Simplified budget calculation logic
    let dailyCost = 0;
    
    // Base costs by accommodation type
    switch (budget.accommodationType) {
      case "budget":
        dailyCost += 30;
        break;
      case "mid-range":
        dailyCost += 80;
        break;
      case "luxury":
        dailyCost += 200;
        break;
    }

    // Activity costs
    switch (budget.activities) {
      case "minimal":
        dailyCost += 20;
        break;
      case "moderate":
        dailyCost += 50;
        break;
      case "extensive":
        dailyCost += 120;
        break;
    }

    // Destination multiplier (simplified)
    const destinationMultipliers: Record<string, number> = {
      "thailand": 0.7,
      "vietnam": 0.6,
      "india": 0.5,
      "mexico": 0.8,
      "italy": 1.2,
      "japan": 1.5,
      "switzerland": 2.0,
      "norway": 1.8,
      "usa": 1.3,
      "uk": 1.4
    };

    const multiplier = destinationMultipliers[budget.destination.toLowerCase()] || 1.0;
    const totalBudget = dailyCost * budget.duration * multiplier;
    
    setBudget(prev => ({ ...prev, result: Math.round(totalBudget) }));
  };

  const checkWeather = () => {
    // Mock weather data
    const mockWeather = {
      temperature: Math.floor(Math.random() * 30) + 10,
      condition: ["Sunny", "Partly Cloudy", "Rainy", "Overcast"][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5
    };
    
    setWeather(prev => ({ ...prev, result: mockWeather }));
  };

  const trackFlight = () => {
    // Mock flight data
    const mockFlight = {
      price: Math.floor(Math.random() * 800) + 200,
      duration: `${Math.floor(Math.random() * 12) + 6}h ${Math.floor(Math.random() * 60)}m`,
      airline: ["Delta", "United", "Emirates", "Lufthansa", "Air France"][Math.floor(Math.random() * 5)],
      stops: Math.floor(Math.random() * 3)
    };
    
    setFlight(prev => ({ ...prev, result: mockFlight }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Travel Planning Tools</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Smart tools to help you plan your perfect trip
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budget">Budget Calculator</TabsTrigger>
          <TabsTrigger value="weather">Weather Checker</TabsTrigger>
          <TabsTrigger value="flights">Flight Tracker</TabsTrigger>
        </TabsList>

        {/* Budget Calculator */}
        <TabsContent value="budget" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-6 w-6 text-green-600" />
                Travel Budget Calculator
              </CardTitle>
              <CardDescription>
                Get an estimated budget for your trip based on destination, duration, and travel style
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      placeholder="e.g., Thailand, Italy, Japan"
                      value={budget.destination}
                      onChange={(e) => setBudget(prev => ({ ...prev, destination: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">Trip Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="365"
                      value={budget.duration}
                      onChange={(e) => setBudget(prev => ({ ...prev, duration: parseInt(e.target.value) || 7 }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="accommodation">Accommodation Type</Label>
                    <Select 
                      value={budget.accommodationType} 
                      onValueChange={(value) => setBudget(prev => ({ ...prev, accommodationType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select accommodation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Budget (Hostels, shared rooms)</SelectItem>
                        <SelectItem value="mid-range">Mid-range (Hotels, Airbnb)</SelectItem>
                        <SelectItem value="luxury">Luxury (5-star hotels, resorts)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="activities">Activity Level</Label>
                    <Select 
                      value={budget.activities} 
                      onValueChange={(value) => setBudget(prev => ({ ...prev, activities: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal (Free activities, local transport)</SelectItem>
                        <SelectItem value="moderate">Moderate (Some tours, mix of transport)</SelectItem>
                        <SelectItem value="extensive">Extensive (Many tours, premium experiences)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={calculateBudget} className="w-full" size="lg">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Calculate Budget
                  </Button>
                </div>

                {budget.result && (
                  <div className="space-y-4">
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            ${budget.result}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Estimated total budget for {budget.duration} days
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            ~${Math.round(budget.result / budget.duration)} per day
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Accommodation ({budget.accommodationType})</span>
                        <Badge variant="outline">~40-50% of budget</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Food & Dining</span>
                        <Badge variant="outline">~25-30% of budget</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Activities & Tours</span>
                        <Badge variant="outline">~15-20% of budget</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Local Transport</span>
                        <Badge variant="outline">~5-10% of budget</Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Checker */}
        <TabsContent value="weather" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-6 w-6 text-blue-600" />
                Destination Weather
              </CardTitle>
              <CardDescription>
                Check current weather conditions and travel recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weather-destination">Destination</Label>
                    <Input
                      id="weather-destination"
                      placeholder="Enter city or country"
                      value={weather.destination}
                      onChange={(e) => setWeather(prev => ({ ...prev, destination: e.target.value }))}
                    />
                  </div>

                  <Button onClick={checkWeather} className="w-full" size="lg">
                    <Thermometer className="h-4 w-4 mr-2" />
                    Check Weather
                  </Button>
                </div>

                {weather.result && (
                  <div className="space-y-4">
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {weather.result.temperature}°C
                          </div>
                          <div className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                            {weather.result.condition}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            in {weather.destination}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Humidity</span>
                        <Badge variant="outline">{weather.result.humidity}%</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Wind Speed</span>
                        <Badge variant="outline">{weather.result.windSpeed} km/h</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="font-medium mb-2">Travel Recommendations</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Pack {weather.result.temperature > 25 ? 'light clothing' : 'warm layers'}</li>
                        <li>• {weather.result.condition.includes('Rain') ? 'Bring rain gear' : 'Perfect for outdoor activities'}</li>
                        <li>• {weather.result.humidity > 70 ? 'High humidity - stay hydrated' : 'Comfortable humidity levels'}</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flight Tracker */}
        <TabsContent value="flights" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-6 w-6 text-purple-600" />
                Flight Price Tracker
              </CardTitle>
              <CardDescription>
                Find and track flight prices for your destination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="from">From</Label>
                    <Input
                      id="from"
                      placeholder="Departure city"
                      value={flight.from}
                      onChange={(e) => setFlight(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="to">To</Label>
                    <Input
                      id="to"
                      placeholder="Destination city"
                      value={flight.to}
                      onChange={(e) => setFlight(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Departure Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={flight.date}
                      onChange={(e) => setFlight(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>

                  <Button onClick={trackFlight} className="w-full" size="lg">
                    <Plane className="h-4 w-4 mr-2" />
                    Search Flights
                  </Button>
                </div>

                {flight.result && (
                  <div className="space-y-4">
                    <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-2">
                            ${flight.result.price}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            Best price found
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Airline</span>
                        <Badge variant="outline">{flight.result.airline}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Duration</span>
                        <Badge variant="outline">{flight.result.duration}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Stops</span>
                        <Badge variant="outline">
                          {flight.result.stops === 0 ? 'Direct' : `${flight.result.stops} stop${flight.result.stops > 1 ? 's' : ''}`}
                        </Badge>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      Book Flight
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}