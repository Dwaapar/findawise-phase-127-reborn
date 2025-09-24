import { storage } from "../storage";

export async function seedTravelData() {
  console.log('🌱 Seeding Travel Neuron data...');

  try {
    // Create Travel Archetypes
    const archetypes = [
      {
        slug: 'digital-nomad',
        name: 'Digital Nomad',
        description: 'Remote workers seeking work-life balance in inspiring destinations',
        emoji: '💻',
        traits: ['Remote work', 'WiFi quality', 'Cost of living', 'Community'],
        preferredDestinations: ['Bali', 'Portugal', 'Mexico', 'Thailand'],
        budgetRange: 'mid',
        travelStyle: 'slow',
        isActive: true
      },
      {
        slug: 'luxury-explorer',
        name: 'Luxury Explorer', 
        description: 'Affluent travelers seeking premium experiences and exclusive destinations',
        emoji: '✨',
        traits: ['Premium hotels', 'Fine dining', 'Exclusive access', 'Comfort'],
        preferredDestinations: ['Dubai', 'Maldives', 'Swiss Alps', 'Japan'],
        budgetRange: 'luxury',
        travelStyle: 'comfortable',
        isActive: true
      },
      {
        slug: 'adventure-seeker',
        name: 'Adventure Seeker',
        description: 'Thrill-seekers looking for extreme sports and outdoor adventures',
        emoji: '🏔️',
        traits: ['Outdoor activities', 'Extreme sports', 'Nature', 'Physical challenges'],
        preferredDestinations: ['New Zealand', 'Nepal', 'Patagonia', 'Iceland'],
        budgetRange: 'mid',
        travelStyle: 'active',
        isActive: true
      },
      {
        slug: 'budget-traveler',
        name: 'Budget Traveler',
        description: 'Cost-conscious travelers maximizing value and authentic experiences',
        emoji: '🎒',
        traits: ['Cost efficiency', 'Local experiences', 'Hostels', 'Public transport'],
        preferredDestinations: ['Southeast Asia', 'Eastern Europe', 'Central America', 'India'],
        budgetRange: 'budget',
        travelStyle: 'backpacking',
        isActive: true
      },
      {
        slug: 'cultural-explorer',
        name: 'Cultural Explorer',
        description: 'History and culture enthusiasts seeking authentic local experiences',
        emoji: '🏛️',
        traits: ['Museums', 'Historical sites', 'Local culture', 'Architecture'],
        preferredDestinations: ['Italy', 'Greece', 'Egypt', 'Peru'],
        budgetRange: 'mid',
        travelStyle: 'educational',
        isActive: true
      }
    ];

    for (const archetype of archetypes) {
      try {
        await storage.createTravelArchetype(archetype);
        console.log(`✅ Created travel archetype: ${archetype.name}`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⏭️  travel archetype: ${archetype.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating travel archetype ${archetype.name}:`, error);
        }
      }
    }

    // Create Travel Destinations
    const destinations = [
      {
        slug: 'bali-indonesia',
        name: 'Bali, Indonesia',
        country: 'Indonesia',
        continent: 'Asia',
        description: 'Tropical paradise perfect for digital nomads with affordable living costs, stunning beaches, and vibrant coworking scene.',
        shortDescription: 'Digital nomad paradise with beaches and culture',
        budgetRange: 'budget',
        bestTimeToVisit: 'April to October',
        averageCost: 800,
        tags: ['beaches', 'digital nomad', 'culture', 'affordable'],
        coordinates: { lat: -8.3405, lng: 115.0920 },
        imageUrl: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1',
        weatherInfo: { averageTemp: 28, season: 'tropical' },
        topAttractions: ['Ubud Rice Terraces', 'Tanah Lot Temple', 'Mount Batur'],
        popularityScore: 95,
        isTrending: true,
        isHidden: false
      },
      {
        slug: 'tokyo-japan',
        name: 'Tokyo, Japan',
        country: 'Japan',
        continent: 'Asia',
        description: 'Ultra-modern metropolis blending cutting-edge technology with ancient traditions, perfect for cultural explorers.',
        shortDescription: 'Modern metropolis with ancient traditions',
        budgetRange: 'luxury',
        bestTimeToVisit: 'March to May, September to November',
        averageCost: 2500,
        tags: ['technology', 'culture', 'food', 'modern'],
        coordinates: { lat: 35.6762, lng: 139.6503 },
        imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
        weatherInfo: { averageTemp: 15, season: 'temperate' },
        topAttractions: ['Shibuya Crossing', 'Senso-ji Temple', 'Tokyo Skytree'],
        popularityScore: 92,
        isTrending: true,
        isHidden: false
      },
      {
        slug: 'lisbon-portugal',
        name: 'Lisbon, Portugal',
        country: 'Portugal',
        continent: 'Europe',
        description: 'Charming European capital with excellent digital nomad infrastructure, affordable living, and rich history.',
        shortDescription: 'European nomad hub with historic charm',
        budgetRange: 'mid',
        bestTimeToVisit: 'April to October',
        averageCost: 1500,
        tags: ['digital nomad', 'history', 'affordable', 'europe'],
        coordinates: { lat: 38.7223, lng: -9.1393 },
        imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b',
        weatherInfo: { averageTemp: 17, season: 'mediterranean' },
        topAttractions: ['Belém Tower', 'Jerónimos Monastery', 'Tram 28'],
        popularityScore: 88,
        isTrending: true,
        isHidden: false
      },
      {
        slug: 'queenstown-new-zealand',
        name: 'Queenstown, New Zealand',
        country: 'New Zealand',
        continent: 'Oceania',
        description: 'Adventure capital of the world with bungee jumping, skydiving, and stunning alpine scenery.',
        shortDescription: 'Adventure capital with alpine scenery',
        budgetRange: 'luxury',
        bestTimeToVisit: 'December to February',
        averageCost: 2200,
        tags: ['adventure', 'nature', 'extreme sports', 'mountains'],
        coordinates: { lat: -45.0312, lng: 168.6626 },
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        weatherInfo: { averageTemp: 12, season: 'temperate' },
        topAttractions: ['Milford Sound', 'Shotover Jet', 'The Remarkables'],
        popularityScore: 85,
        isTrending: false,
        isHidden: false
      },
      {
        slug: 'chiang-mai-thailand',
        name: 'Chiang Mai, Thailand',
        country: 'Thailand',
        continent: 'Asia',
        description: 'Budget-friendly Thai city with incredible street food, ancient temples, and welcoming digital nomad community.',
        shortDescription: 'Budget-friendly with temples and street food',
        budgetRange: 'budget',
        bestTimeToVisit: 'November to April',
        averageCost: 600,
        tags: ['budget', 'digital nomad', 'temples', 'food'],
        coordinates: { lat: 18.7883, lng: 98.9853 },
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96',
        weatherInfo: { averageTemp: 26, season: 'tropical' },
        topAttractions: ['Doi Suthep', 'Old City Temples', 'Night Bazaar'],
        popularityScore: 90,
        isTrending: true,
        isHidden: false
      }
    ];

    for (const destination of destinations) {
      try {
        await storage.createTravelDestination(destination);
        console.log(`✅ Created travel destination: ${destination.name}`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⏭️  travel destination: ${destination.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating travel destination ${destination.name}:`, error);
        }
      }
    }

    // Create Travel Quiz Questions
    const quizQuestions = [
      {
        quizType: 'travel-archetype',
        question: 'What type of accommodation do you prefer while traveling?',
        options: ['Luxury hotel', 'Boutique hotel', 'Hostel', 'Airbnb', 'Camping'],
        order: 1,
        isActive: true
      },
      {
        quizType: 'travel-archetype',
        question: 'What is your ideal daily budget for travel?',
        options: ['Under $50', '$50-100', '$100-200', '$200-400', 'Above $400'],
        order: 2,
        isActive: true
      },
      {
        quizType: 'travel-archetype',
        question: 'Which activity sounds most appealing to you?',
        options: ['Museum visit', 'Bungee jumping', 'Beach relaxation', 'Coworking session', 'Fine dining'],
        order: 3,
        isActive: true
      },
      {
        quizType: 'travel-archetype',
        question: 'How do you prefer to plan your travels?',
        options: ['Detailed itinerary', 'General outline', 'Spontaneous', 'Guided tours', 'Local recommendations'],
        order: 4,
        isActive: true
      },
      {
        quizType: 'travel-archetype',
        question: 'What is most important to you when choosing a destination?',
        options: ['Cost of living', 'Adventure opportunities', 'Cultural experiences', 'Luxury amenities', 'WiFi quality'],
        order: 5,
        isActive: true
      }
    ];

    for (const question of quizQuestions) {
      try {
        await storage.createTravelQuizQuestion(question);
        console.log(`✅ Created travel quiz question: ${question.question.substring(0, 50)}...`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⏭️  travel quiz question already exists, skipping...`);
        } else {
          console.error(`❌ Error creating travel quiz question:`, error);
        }
      }
    }

    // Create Travel Tools
    const tools = [
      {
        slug: 'budget-calculator',
        name: 'Travel Budget Calculator',
        description: 'Calculate your travel costs and daily budget for any destination',
        category: 'planning',
        toolType: 'calculator',
        inputFields: {
          destination: 'text',
          duration: 'number',
          accommodationType: 'select',
          travelStyle: 'select'
        },
        isActive: true,
        order: 1
      },
      {
        slug: 'packing-checklist',
        name: 'Smart Packing Checklist',
        description: 'AI-powered packing list based on destination, season, and activities',
        category: 'preparation',
        toolType: 'checklist',
        inputFields: {
          destination: 'text',
          duration: 'number',
          season: 'select',
          activities: 'multiselect'
        },
        isActive: true,
        order: 2
      },
      {
        slug: 'time-zone-planner',
        name: 'Travel Time Zone Planner',
        description: 'Plan your schedule across multiple time zones and beat jet lag',
        category: 'planning',
        toolType: 'scheduler',
        inputFields: {
          departure: 'text',
          destination: 'text',
          travelDate: 'date'
        },
        isActive: true,
        order: 3
      },
      {
        slug: 'visa-checker',
        name: 'Visa Requirements Checker',
        description: 'Check visa requirements and travel restrictions for your passport',
        category: 'documentation',
        toolType: 'checker',
        inputFields: {
          passport: 'select',
          destination: 'text',
          travelPurpose: 'select'
        },
        isActive: true,
        order: 4
      }
    ];

    for (const tool of tools) {
      try {
        await storage.createTravelTool(tool);
        console.log(`✅ Created travel tool: ${tool.name}`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⏭️  travel tool: ${tool.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating travel tool ${tool.name}:`, error);
        }
      }
    }

    // Create Travel Articles
    const articles = [
      {
        slug: 'digital-nomad-destinations-2025',
        title: 'Top 15 Digital Nomad Destinations for 2025: Complete Guide',
        content: 'Comprehensive guide to the best digital nomad destinations including visa requirements, cost of living, and coworking spaces...',
        excerpt: 'Discover the best digital nomad destinations for 2025 with detailed insights on costs, visas, and community.',
        tags: ['digital nomad', 'remote work', '2025', 'destinations'],
        archetype: 'digital-nomad',
        readTime: 12,
        isPublished: true,
        publishedAt: new Date(),
        views: 0,
        likes: 0
      },
      {
        slug: 'luxury-travel-trends-2025',
        title: 'Luxury Travel Trends 2025: What High-End Travelers Want',
        content: 'Explore the latest luxury travel trends including sustainable luxury, exclusive experiences, and premium destinations...',
        excerpt: 'Discover luxury travel trends shaping 2025 from sustainable options to exclusive experiences.',
        tags: ['luxury travel', 'trends', '2025', 'premium'],
        archetype: 'luxury-explorer',
        readTime: 8,
        isPublished: true,
        publishedAt: new Date(),
        views: 0,
        likes: 0
      },
      {
        slug: 'budget-travel-hacks-2025',
        title: '50 Budget Travel Hacks That Will Save You Thousands',
        content: 'Master the art of budget travel with these proven strategies for saving money on flights, accommodation, and activities...',
        excerpt: 'Learn 50 proven budget travel hacks to save thousands on your next adventure.',
        tags: ['budget travel', 'money saving', 'travel tips', 'backpacking'],
        archetype: 'budget-traveler',
        readTime: 15,
        isPublished: true,
        publishedAt: new Date(),
        views: 0,
        likes: 0
      }
    ];

    for (const article of articles) {
      try {
        await storage.createTravelArticle(article);
        console.log(`✅ Created travel article: ${article.title}`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⏭️  travel article: ${article.title} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating travel article ${article.title}:`, error);
        }
      }
    }

    console.log('✅ Travel seed data completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Error seeding travel data:', error);
    return false;
  }
}