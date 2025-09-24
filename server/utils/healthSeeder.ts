import { storage } from "../storage";
import { StandardErrorHandler } from './standardErrorHandler';

export async function seedHealthData() {
  console.log('🌱 Seeding Health & Wellness Neuron data...');

  try {
    // Seed Health Archetypes
    const archetypes = [
      {
        slug: 'the-sleepless-pro',
        name: 'The Sleepless Pro',
        description: 'High-achieving professionals struggling with sleep quality and work-life balance.',
        characteristics: {
          traits: ['ambitious', 'stressed', 'time-constrained', 'tech-savvy'],
          challenges: ['poor sleep', 'high stress', 'irregular schedule'],
          goals: ['better sleep', 'stress management', 'productivity optimization']
        },
        emotionMapping: 'calm',
        colorScheme: {
          primary: '#3B82F6',
          secondary: '#93C5FD',
          accent: '#1E40AF'
        },
        preferredTools: ['sleep-calculator', 'stress-tracker', 'meditation-timer'],
        isActive: true
      },
      {
        slug: 'the-diet-starter',
        name: 'The Diet Starter',
        description: 'Individuals beginning their nutrition and weight management journey.',
        characteristics: {
          traits: ['motivated', 'goal-oriented', 'seeking guidance', 'health-conscious'],
          challenges: ['weight management', 'nutrition confusion', 'habit formation'],
          goals: ['weight loss', 'healthy eating', 'sustainable habits']
        },
        emotionMapping: 'energetic',
        colorScheme: {
          primary: '#10B981',
          secondary: '#6EE7B7',
          accent: '#047857'
        },
        preferredTools: ['bmi-calculator', 'calorie-tracker', 'meal-planner'],
        isActive: true
      },
      {
        slug: 'the-overwhelmed-parent',
        name: 'The Overwhelmed Parent',
        description: 'Parents juggling family responsibilities while trying to maintain personal health.',
        characteristics: {
          traits: ['caring', 'busy', 'self-sacrificing', 'practical'],
          challenges: ['time management', 'stress', 'self-care neglect'],
          goals: ['family wellness', 'stress reduction', 'time efficiency']
        },
        emotionMapping: 'trustworthy',
        colorScheme: {
          primary: '#8B5CF6',
          secondary: '#C4B5FD',
          accent: '#6D28D9'
        },
        preferredTools: ['family-fitness', 'quick-meals', 'stress-relief'],
        isActive: true
      },
      {
        slug: 'the-biohacker',
        name: 'The Biohacker',
        description: 'Data-driven individuals optimizing every aspect of their health and performance.',
        characteristics: {
          traits: ['analytical', 'experimental', 'tech-savvy', 'detail-oriented'],
          challenges: ['information overload', 'perfectionism', 'analysis paralysis'],
          goals: ['optimization', 'peak performance', 'longevity']
        },
        emotionMapping: 'playful',
        colorScheme: {
          primary: '#F59E0B',
          secondary: '#FCD34D',
          accent: '#D97706'
        },
        preferredTools: ['advanced-tracking', 'supplement-optimizer', 'performance-metrics'],
        isActive: true
      }
    ];

    for (const archetype of archetypes) {
      await StandardErrorHandler.handleSeedError(
        () => storage.createHealthArchetype(archetype),
        `health archetype: ${archetype.name}`,
        { component: 'HealthSeeder', operation: 'createHealthArchetype' }
      );
    }

    // Seed Health Tools
    const tools = [
      {
        slug: 'bmi-calculator',
        name: 'BMI Calculator',
        description: 'Calculate your Body Mass Index and get personalized health insights.',
        category: 'fitness',
        emotionMapping: 'trustworthy',
        inputFields: {
          height: { type: 'number', unit: 'cm', required: true },
          weight: { type: 'number', unit: 'kg', required: true },
          age: { type: 'number', required: false },
          gender: { type: 'select', options: ['male', 'female', 'other'], required: false }
        },
        calculationLogic: 'BMI = weight(kg) / height(m)²',
        outputFormat: {
          bmi: 'number',
          category: 'string',
          healthyRange: 'string',
          recommendations: 'array'
        },
        trackingEnabled: true,
        isActive: true
      },
      {
        slug: 'calorie-calculator',
        name: 'Daily Calorie Calculator',
        description: 'Calculate your daily calorie needs based on your goals and activity level.',
        category: 'nutrition',
        emotionMapping: 'energetic',
        inputFields: {
          age: { type: 'number', required: true },
          gender: { type: 'select', options: ['male', 'female'], required: true },
          height: { type: 'number', unit: 'cm', required: true },
          weight: { type: 'number', unit: 'kg', required: true },
          activityLevel: { type: 'select', options: ['sedentary', 'light', 'moderate', 'active', 'very-active'], required: true },
          goal: { type: 'select', options: ['maintain', 'lose', 'gain'], required: true }
        },
        calculationLogic: 'BMR + Activity Factor + Goal Adjustment',
        outputFormat: {
          bmr: 'number',
          maintenanceCalories: 'number',
          goalCalories: 'number',
          macroBreakdown: 'object'
        },
        trackingEnabled: true,
        isActive: true
      },
      {
        slug: 'sleep-debt-calculator',
        name: 'Sleep Debt Calculator',
        description: 'Track your sleep debt and get recommendations for better rest.',
        category: 'sleep',
        emotionMapping: 'calm',
        inputFields: {
          idealSleep: { type: 'number', unit: 'hours', default: 8, required: true },
          sleepLog: { type: 'array', items: { date: 'date', hours: 'number' }, required: true }
        },
        calculationLogic: 'Sum of (ideal - actual) sleep over time period',
        outputFormat: {
          totalDebt: 'number',
          averageSleep: 'number',
          recommendation: 'string',
          recoveryPlan: 'array'
        },
        trackingEnabled: true,
        isActive: true
      },
      {
        slug: 'water-intake-tracker',
        name: 'Water Intake Tracker',
        description: 'Calculate optimal water intake and track your daily hydration.',
        category: 'nutrition',
        emotionMapping: 'trustworthy',
        inputFields: {
          weight: { type: 'number', unit: 'kg', required: true },
          activityLevel: { type: 'select', options: ['low', 'moderate', 'high'], required: true },
          climate: { type: 'select', options: ['cool', 'moderate', 'hot'], required: true }
        },
        calculationLogic: 'Base intake (35ml/kg) + activity adjustment + climate adjustment',
        outputFormat: {
          dailyTarget: 'number',
          currentIntake: 'number',
          remaining: 'number',
          recommendations: 'array'
        },
        trackingEnabled: true,
        isActive: true
      },
      {
        slug: 'stress-assessment',
        name: 'Stress Level Assessment',
        description: 'Evaluate your current stress levels and get personalized coping strategies.',
        category: 'mental-health',
        emotionMapping: 'calm',
        inputFields: {
          symptoms: { type: 'multiselect', options: ['headaches', 'insomnia', 'fatigue', 'anxiety', 'irritability'], required: true },
          frequency: { type: 'select', options: ['rarely', 'sometimes', 'often', 'always'], required: true },
          triggers: { type: 'multiselect', options: ['work', 'family', 'health', 'finances', 'relationships'], required: true }
        },
        calculationLogic: 'Weighted scoring based on symptoms, frequency, and triggers',
        outputFormat: {
          stressLevel: 'string',
          score: 'number',
          primaryTriggers: 'array',
          copingStrategies: 'array'
        },
        trackingEnabled: true,
        isActive: true
      }
    ];

    for (const tool of tools) {
      try {
        await storage.createHealthTool(tool);
      } catch (error) {
        if ((error as any)?.code === '23505') {
          console.log(`Health tool '${tool.name}' already exists, skipping...`);
        } else {
          console.warn(`Error creating health tool '${tool.name}':`, (error as any)?.message);
        }
      }
    }

    // Seed Health Quizzes
    const quizzes = [
      {
        slug: 'wellness-persona-quiz',
        title: 'Which Wellness Persona Are You?',
        description: 'Discover your unique health and wellness archetype with our AI-powered assessment.',
        category: 'general',
        questions: [
          {
            id: 1,
            text: 'What time do you typically go to bed?',
            type: 'single-choice',
            options: [
              { value: 'before-10pm', text: 'Before 10 PM', weight: { 'sleepless-pro': 3, 'overwhelmed-parent': 2 } },
              { value: '10pm-11pm', text: '10-11 PM', weight: { 'diet-starter': 2, 'biohacker': 1 } },
              { value: '11pm-12am', text: '11 PM - 12 AM', weight: { 'sleepless-pro': 1, 'biohacker': 2 } },
              { value: 'after-12am', text: 'After 12 AM', weight: { 'sleepless-pro': 3, 'biohacker': 1 } }
            ]
          },
          {
            id: 2,
            text: 'What motivates you most about health and wellness?',
            type: 'single-choice',
            options: [
              { value: 'weight-loss', text: 'Losing weight', weight: { 'diet-starter': 3 } },
              { value: 'energy', text: 'Having more energy', weight: { 'overwhelmed-parent': 3, 'sleepless-pro': 2 } },
              { value: 'performance', text: 'Optimizing performance', weight: { 'biohacker': 3, 'sleepless-pro': 1 } },
              { value: 'family', text: 'Setting a good example for family', weight: { 'overwhelmed-parent': 3 } }
            ]
          },
          {
            id: 3,
            text: 'How do you prefer to track your health progress?',
            type: 'single-choice',
            options: [
              { value: 'apps', text: 'Detailed apps and wearables', weight: { 'biohacker': 3, 'sleepless-pro': 2 } },
              { value: 'simple', text: 'Simple journaling', weight: { 'diet-starter': 2, 'overwhelmed-parent': 3 } },
              { value: 'occasional', text: 'Occasional check-ins', weight: { 'diet-starter': 1, 'overwhelmed-parent': 2 } },
              { value: 'none', text: 'I dont track much', weight: { 'overwhelmed-parent': 1 } }
            ]
          }
        ],
        scoringLogic: {
          method: 'weighted-sum',
          archetypes: ['sleepless-pro', 'diet-starter', 'overwhelmed-parent', 'biohacker']
        },
        resultMappings: {
          'sleepless-pro': {
            title: 'The Sleepless Pro',
            description: 'You are driven and ambitious but struggling with work-life balance.',
            recommendations: ['sleep optimization', 'stress management', 'time management']
          },
          'diet-starter': {
            title: 'The Diet Starter', 
            description: 'You are motivated to improve your nutrition and overall health.',
            recommendations: ['meal planning', 'calorie tracking', 'habit formation']
          },
          'overwhelmed-parent': {
            title: 'The Overwhelmed Parent',
            description: 'You care deeply about family health but need to prioritize self-care.',
            recommendations: ['family fitness', 'quick healthy meals', 'stress relief']
          },
          'biohacker': {
            title: 'The Biohacker',
            description: 'You love data and want to optimize every aspect of your health.',
            recommendations: ['advanced tracking', 'supplement optimization', 'performance metrics']
          }
        },
        estimatedTime: 180,
        isActive: true
      }
    ];

    for (const quiz of quizzes) {
      try {
        await storage.createHealthQuiz(quiz);
      } catch (error) {
        if ((error as any)?.code === '23505') {
          console.log(`Health quiz '${quiz.title}' already exists, skipping...`);
        } else {
          console.warn(`Error creating health quiz '${quiz.title}':`, (error as any)?.message);
        }
      }
    }

    // Seed Health Content
    const contentPieces = [
      {
        slug: 'complete-sleep-optimization-guide',
        title: 'The Complete Sleep Optimization Guide for Busy Professionals',
        excerpt: 'Discover science-backed strategies to improve sleep quality and wake up refreshed, even with a demanding schedule.',
        content: `# The Complete Sleep Optimization Guide for Busy Professionals

Sleep is not a luxury—it's a biological necessity that directly impacts your cognitive performance, emotional regulation, and physical health. This comprehensive guide provides evidence-based strategies to optimize your sleep quality.

## Understanding Sleep Architecture

Your sleep follows predictable cycles throughout the night:
- **Stage 1**: Light sleep transition
- **Stage 2**: True sleep onset 
- **Stage 3**: Deep sleep (critical for physical recovery)
- **REM Sleep**: Rapid Eye Movement (essential for memory consolidation)

## The Sleep Foundation Protocol

### 1. Sleep Environment Optimization
- **Temperature**: Maintain 65-68°F (18-20°C)
- **Darkness**: Use blackout curtains or sleep masks
- **Noise**: Consider white noise or earplugs
- **Comfort**: Invest in quality mattress and pillows

### 2. Circadian Rhythm Regulation
- **Morning Light**: Get 10-15 minutes of sunlight within 30 minutes of waking
- **Evening Routine**: Dim lights 2 hours before bedtime
- **Consistency**: Maintain same sleep/wake times, even on weekends

### 3. Pre-Sleep Protocol
- **Digital Sunset**: No screens 1 hour before bed
- **Temperature Drop**: Take a warm shower to trigger natural cooling
- **Relaxation**: Practice deep breathing or gentle stretching
- **Supplements**: Consider magnesium glycinate or melatonin (consult healthcare provider)

## Advanced Optimization Techniques

### Sleep Tracking and Analysis
- Monitor sleep stages using wearable devices
- Track sleep debt and recovery patterns
- Identify personal sleep efficiency metrics

### Nutritional Timing
- **Last Meal**: Finish eating 3 hours before bed
- **Caffeine Cutoff**: No caffeine after 2 PM
- **Alcohol Awareness**: Avoid alcohol 3 hours before sleep

### Stress Management Integration
- Practice progressive muscle relaxation
- Use meditation apps for guided sleep sessions
- Implement journaling to clear mental clutter

## Common Sleep Disruptors and Solutions

| Problem | Solution |
|---------|----------|
| Racing thoughts | Keep notepad by bed for brain dump |
| Sleep anxiety | Practice 4-7-8 breathing technique |
| Hot flashes/sweating | Use cooling mattress pad or pajamas |
| Frequent wake-ups | Avoid fluids 2 hours before bed |

## The 30-Day Sleep Challenge

Week 1: Establish consistent sleep/wake times
Week 2: Optimize sleep environment 
Week 3: Implement pre-sleep routine
Week 4: Track and refine your protocol

## Measuring Success

Track these key metrics:
- Sleep latency (time to fall asleep)
- Sleep efficiency (time asleep vs time in bed)
- Morning energy levels (1-10 scale)
- Daytime alertness and focus

Remember: Quality sleep is an investment in every aspect of your life. Start with small changes and build sustainable habits over time.`,
        category: 'sleep',
        contentType: 'guide',
        targetArchetype: 'the-sleepless-pro',
        emotionTone: 'calm',
        readingTime: 8,
        seoTitle: 'Sleep Optimization Guide: Better Sleep for Busy Professionals | Health Hub',
        seoDescription: 'Discover evidence-based sleep strategies for professionals. Improve sleep quality, reduce sleep debt, and wake up refreshed with our comprehensive guide.',
        tags: ['sleep', 'professionals', 'optimization', 'productivity', 'health'],
        sources: ['Sleep Foundation', 'National Sleep Institute', 'Harvard Medical School'],
        isGenerated: false,
        publishedAt: new Date(),
        isActive: true
      },
      {
        slug: 'nutrition-basics-weight-loss',
        title: 'Nutrition Basics: A Beginners Guide to Healthy Weight Loss',
        excerpt: 'Learn the fundamentals of nutrition and create a sustainable approach to healthy weight management.',
        content: `# Nutrition Basics: A Beginner's Guide to Healthy Weight Loss

Starting your weight loss journey can feel overwhelming with conflicting information everywhere. This guide cuts through the noise with evidence-based nutrition principles that work.

## Understanding Energy Balance

Weight loss fundamentally comes down to creating a caloric deficit:
**Calories In < Calories Out = Weight Loss**

But the quality of those calories matters significantly for:
- Hunger and satiety
- Energy levels
- Metabolic health
- Long-term success

## The Macronutrient Foundation

### Protein (4 calories per gram)
- **Target**: 0.8-1.2g per kg body weight
- **Benefits**: Preserves muscle, increases satiety, higher thermic effect
- **Sources**: Lean meats, fish, eggs, dairy, legumes, tofu

### Carbohydrates (4 calories per gram)  
- **Target**: 45-65% of total calories
- **Focus**: Complex carbs for sustained energy
- **Sources**: Vegetables, fruits, whole grains, legumes

### Fats (9 calories per gram)
- **Target**: 20-35% of total calories
- **Benefits**: Hormone production, nutrient absorption, satiety
- **Sources**: Nuts, seeds, olive oil, avocados, fatty fish

## Building Your Plate

### The Balanced Meal Formula
- **½ Plate**: Non-starchy vegetables
- **¼ Plate**: Lean protein
- **¼ Plate**: Complex carbohydrates
- **Thumb**: Healthy fats

### Portion Control Strategies
- Use smaller plates and bowls
- Eat slowly and mindfully
- Stop eating when 80% full
- Practice hunger/fullness awareness

## Meal Planning Made Simple

### Weekly Planning Process
1. **Choose 3-4 breakfast options** (rotate throughout week)
2. **Plan 5-7 lunch recipes** (batch cook on weekends)
3. **Select 4-5 dinner meals** (include family-friendly options)
4. **Prep healthy snacks** (cut vegetables, portion nuts)

### Smart Shopping Tips
- Shop with a list
- Focus on perimeter of store (fresh foods)
- Read nutrition labels
- Avoid shopping when hungry

## Hydration and Weight Loss

### Water's Role in Weight Management
- Increases satiety before meals
- Supports metabolism
- Reduces liquid calorie intake
- Improves exercise performance

### Hydration Guidelines
- **Baseline**: 35ml per kg body weight
- **Exercise**: +500-750ml per hour of activity
- **Climate**: Increase in hot weather
- **Timing**: Drink before meals for satiety

## Common Pitfalls and Solutions

| Pitfall | Solution |
|---------|----------|
| All-or-nothing thinking | Focus on progress, not perfection |
| Restriction leading to binges | Include moderate treats in plan |
| Ignoring hunger cues | Practice mindful eating |
| Unrealistic expectations | Aim for 0.5-1kg per week loss |

## Sustainable Habits for Long-Term Success

### Week 1-2: Foundation Building
- Track food intake to understand patterns
- Establish regular meal times
- Increase vegetable intake

### Week 3-4: Refinement
- Adjust portions based on hunger/fullness
- Introduce new healthy recipes
- Build consistent exercise routine

### Month 2+: Lifestyle Integration
- Plan for social situations
- Develop cooking skills
- Create flexible eating patterns

## When to Seek Professional Help

Consider consulting a registered dietitian if you:
- Have medical conditions affecting diet
- Struggle with disordered eating patterns
- Need personalized meal planning
- Want accountability and support

Remember: Sustainable weight loss is a marathon, not a sprint. Focus on building healthy habits that you can maintain for life.`,
        category: 'nutrition',
        contentType: 'guide',
        targetArchetype: 'the-diet-starter',
        emotionTone: 'energetic',
        readingTime: 10,
        seoTitle: 'Beginner Weight Loss Guide: Nutrition Basics for Sustainable Results',
        seoDescription: 'Learn evidence-based nutrition principles for healthy weight loss. Get practical meal planning tips and avoid common diet mistakes.',
        tags: ['nutrition', 'weight-loss', 'beginners', 'meal-planning', 'healthy-eating'],
        sources: ['Academy of Nutrition and Dietetics', 'WHO Guidelines', 'Mayo Clinic'],
        isGenerated: false,
        publishedAt: new Date(),
        isActive: true
      }
    ];

    for (const content of contentPieces) {
      await storage.createHealthContent(content);
    }

    // Seed Health Lead Magnets
    const leadMagnets = [
      {
        slug: 'sleep-optimization-checklist',
        title: 'Ultimate Sleep Optimization Checklist',
        description: 'A comprehensive 30-point checklist to transform your sleep quality in 30 days.',
        magnetType: 'checklist',
        category: 'sleep',
        targetArchetype: 'the-sleepless-pro',
        deliveryMethod: 'email',
        fileUrl: '/downloads/sleep-optimization-checklist.pdf',
        emailSequence: [
          {
            day: 0,
            subject: 'Your Sleep Optimization Checklist is here!',
            template: 'sleep_welcome'
          },
          {
            day: 7,
            subject: 'Week 1 Check-in: How is your sleep?',
            template: 'sleep_week1'
          },
          {
            day: 30,
            subject: 'Sleep Challenge Complete! What\'s next?',
            template: 'sleep_month1'
          }
        ],
        downloadCount: 0,
        conversionRate: 0.0,
        isActive: true
      },
      {
        slug: 'meal-prep-starter-kit',
        title: '7-Day Meal Prep Starter Kit',
        description: 'Complete meal planning templates, shopping lists, and prep guides for beginners.',
        magnetType: 'ebook',
        category: 'nutrition',
        targetArchetype: 'the-diet-starter',
        deliveryMethod: 'email',
        fileUrl: '/downloads/meal-prep-starter-kit.pdf',
        emailSequence: [
          {
            day: 0,
            subject: 'Your Meal Prep Kit is ready!',
            template: 'mealprep_welcome'
          },
          {
            day: 3,
            subject: 'Meal prep tips for busy schedules',
            template: 'mealprep_tips'
          },
          {
            day: 14,
            subject: 'Level up your meal prep game',
            template: 'mealprep_advanced'
          }
        ],
        downloadCount: 0,
        conversionRate: 0.0,
        isActive: true
      }
    ];

    for (const magnet of leadMagnets) {
      await storage.createHealthLeadMagnet(magnet);
    }

    // Seed Health Daily Quests
    const dailyQuests = [
      {
        slug: 'hydration-hero',
        title: 'Hydration Hero',
        description: 'Drink 8 glasses of water throughout the day.',
        category: 'hydration',
        xpReward: 15,
        difficultyLevel: 'easy',
        completionCriteria: {
          type: 'counter',
          target: 8,
          unit: 'glasses'
        },
        isDaily: true,
        isActive: true
      },
      {
        slug: 'movement-master',
        title: 'Movement Master',
        description: 'Take 10,000 steps or exercise for 30 minutes.',
        category: 'movement',
        xpReward: 25,
        difficultyLevel: 'medium',
        completionCriteria: {
          type: 'either',
          options: [
            { type: 'counter', target: 10000, unit: 'steps' },
            { type: 'duration', target: 30, unit: 'minutes' }
          ]
        },
        isDaily: true,
        isActive: true
      },
      {
        slug: 'mindfulness-moment',
        title: 'Mindfulness Moment',
        description: 'Practice 10 minutes of meditation or deep breathing.',
        category: 'mindfulness',
        xpReward: 20,
        difficultyLevel: 'easy',
        completionCriteria: {
          type: 'duration',
          target: 10,
          unit: 'minutes'
        },
        isDaily: true,
        isActive: true
      },
      {
        slug: 'nutrition-ninja',
        title: 'Nutrition Ninja',
        description: 'Eat 5 servings of fruits and vegetables.',
        category: 'nutrition',
        xpReward: 20,
        difficultyLevel: 'medium',
        completionCriteria: {
          type: 'counter',
          target: 5,
          unit: 'servings'
        },
        isDaily: true,
        isActive: true
      },
      {
        slug: 'sleep-champion',
        title: 'Sleep Champion',
        description: 'Get 7-9 hours of quality sleep.',
        category: 'sleep',
        xpReward: 30,
        difficultyLevel: 'medium',
        completionCriteria: {
          type: 'range',
          min: 7,
          max: 9,
          unit: 'hours'
        },
        isDaily: true,
        isActive: true
      }
    ];

    for (const quest of dailyQuests) {
      await storage.createHealthDailyQuest(quest);
    }

    console.log('✅ Health & Wellness Neuron data seeded successfully');
    console.log(`   - ${archetypes.length} health archetypes`);
    console.log(`   - ${tools.length} health tools`);
    console.log(`   - ${quizzes.length} health quizzes`);
    console.log(`   - ${contentPieces.length} health content pieces`);
    console.log(`   - ${leadMagnets.length} lead magnets`);
    console.log(`   - ${dailyQuests.length} daily quests`);

  } catch (error) {
    console.error('❌ Error seeding health data:', error);
    throw error;
  }
}