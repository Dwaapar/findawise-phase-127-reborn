import { db } from '../../db';
import { saasContent, saasTools, saasCategories } from '../../../shared/saasTables';
import { eq, desc } from 'drizzle-orm';

export interface ArticleTemplate {
  type: 'comparison' | 'review' | 'listicle' | 'guide';
  title: string;
  outline: string[];
  wordCount: number;
  seoKeywords: string[];
}

export class ArticleGenerator {
  private templates: Record<string, ArticleTemplate> = {
    comparison: {
      type: 'comparison',
      title: '{tool1} vs {tool2}: Complete Comparison Guide {year}',
      outline: [
        'Introduction and Overview',
        '{tool1} Detailed Review',
        '{tool2} Detailed Review', 
        'Feature Comparison Table',
        'Pricing Analysis',
        'Pros and Cons',
        'Use Case Recommendations',
        'Final Verdict',
        'FAQ Section'
      ],
      wordCount: 3500,
      seoKeywords: ['{tool1} vs {tool2}', 'comparison', 'review', 'best {category}']
    },
    
    listicle: {
      type: 'listicle',
      title: 'Best {category} Tools for {audience} in {year}',
      outline: [
        'Introduction',
        'Why {category} Tools Matter',
        'Selection Criteria',
        'Top {count} {category} Tools',
        'Detailed Tool Reviews',
        'Comparison Matrix',
        'Budget Considerations',
        'Implementation Tips',
        'Conclusion and Recommendations'
      ],
      wordCount: 4000,
      seoKeywords: ['best {category} tools', '{category} software', '{audience} tools']
    },

    guide: {
      type: 'guide',
      title: 'Complete Guide to {topic} for {audience}',
      outline: [
        'Introduction to {topic}',
        'Getting Started',
        'Essential Features to Look For',
        'Step-by-Step Setup',
        'Best Practices',
        'Common Mistakes to Avoid',
        'Advanced Tips',
        'Recommended Tools',
        'Conclusion'
      ],
      wordCount: 3000,
      seoKeywords: ['{topic} guide', 'how to {topic}', '{topic} tutorial']
    }
  };

  async generateArticle(type: string, variables: Record<string, string>): Promise<string> {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Unknown article type: ${type}`);
    }

    const title = this.replaceVariables(template.title, variables);
    const content = await this.generateContent(template, variables);
    
    return this.formatArticle(title, content, template.seoKeywords.map(kw => 
      this.replaceVariables(kw, variables)
    ));
  }

  private async generateContent(template: ArticleTemplate, variables: Record<string, string>): Promise<string> {
    let content = '';
    
    for (const section of template.outline) {
      const sectionTitle = this.replaceVariables(section, variables);
      const sectionContent = await this.generateSectionContent(
        template.type, 
        sectionTitle, 
        variables,
        Math.floor(template.wordCount / template.outline.length)
      );
      
      content += `## ${sectionTitle}\n\n${sectionContent}\n\n`;
    }
    
    return content;
  }

  private async generateSectionContent(
    articleType: string, 
    sectionTitle: string, 
    variables: Record<string, string>,
    targetWords: number
  ): Promise<string> {
    
    // Get relevant tools for context
    const tools = await this.getRelevantTools(variables.category);
    
    switch (articleType) {
      case 'comparison':
        return this.generateComparisonSection(sectionTitle, variables, tools, targetWords);
      case 'listicle':
        return this.generateListicleSection(sectionTitle, variables, tools, targetWords);
      case 'guide':
        return this.generateGuideSection(sectionTitle, variables, tools, targetWords);
      default:
        return this.generateGenericSection(sectionTitle, variables, targetWords);
    }
  }

  private async getRelevantTools(category?: string): Promise<any[]> {
    if (!category) return [];
    
    try {
      return await db.select()
        .from(saasTools)
        .where(eq(saasTools.category, category))
        .orderBy(desc(saasTools.rating))
        .limit(10);
    } catch (error) {
      console.error('Error fetching tools:', error);
      return [];
    }
  }

  private generateComparisonSection(
    sectionTitle: string, 
    variables: Record<string, string>, 
    tools: any[], 
    targetWords: number
  ): string {
    const { tool1, tool2 } = variables;
    
    if (sectionTitle.includes('Introduction')) {
      return `When choosing between ${tool1} and ${tool2}, businesses need to carefully evaluate features, pricing, and use cases. Both tools offer unique advantages in the ${variables.category} space, but they serve different needs and business sizes.

In this comprehensive comparison, we'll analyze every aspect of both platforms to help you make an informed decision. We'll cover pricing, features, user experience, integrations, and real-world use cases to determine which tool is right for your specific needs.

Our analysis is based on extensive testing, user feedback, and current market data as of ${variables.year}.`;
    }
    
    if (sectionTitle.includes(tool1)) {
      const tool1Data = tools.find(t => t.name.toLowerCase().includes(tool1.toLowerCase()));
      return this.generateToolReview(tool1, tool1Data, targetWords);
    }
    
    if (sectionTitle.includes(tool2)) {
      const tool2Data = tools.find(t => t.name.toLowerCase().includes(tool2.toLowerCase()));
      return this.generateToolReview(tool2, tool2Data, targetWords);
    }
    
    if (sectionTitle.includes('Feature Comparison')) {
      return this.generateFeatureComparison(tool1, tool2, tools);
    }
    
    if (sectionTitle.includes('Pricing')) {
      return this.generatePricingComparison(tool1, tool2, tools);
    }
    
    return this.generateGenericSection(sectionTitle, variables, targetWords);
  }

  private generateToolReview(toolName: string, toolData: any, targetWords: number): string {
    const features = toolData?.features ? JSON.parse(toolData.features) : [];
    const rating = toolData?.rating || 4.0;
    
    return `${toolName} stands out as a ${toolData?.category || 'powerful'} solution with a ${rating}/5 star rating from users. The platform offers a comprehensive suite of features designed for modern businesses.

**Key Features:**
${features.slice(0, 5).map((f: string) => `- ${f.charAt(0).toUpperCase() + f.slice(1)}`).join('\n')}

**Strengths:**
- User-friendly interface that's easy to navigate
- Robust feature set covering essential business needs
- Reliable performance with high uptime
- Active customer support team
- Regular updates and improvements

**Best For:**
This tool excels for businesses that need ${features.slice(0, 2).join(' and ')} capabilities. It's particularly well-suited for teams looking for a balance between functionality and ease of use.

The platform integrates well with popular business tools and offers flexible pricing options to accommodate different business sizes.`;
  }

  private generateFeatureComparison(tool1: string, tool2: string, tools: any[]): string {
    return `| Feature | ${tool1} | ${tool2} |
|---------|----------|----------|
| **Ease of Use** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Feature Set** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Integrations** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Customer Support** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Value for Money** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Mobile App** | ✅ | ✅ |
| **API Access** | ✅ | ✅ |
| **Free Plan** | ✅ | ✅ |

Both platforms offer comprehensive feature sets, but they excel in different areas. ${tool1} focuses on [specific strength], while ${tool2} prioritizes [different strength].

The choice between these tools often comes down to your specific workflow requirements and team preferences.`;
  }

  private generatePricingComparison(tool1: string, tool2: string, tools: any[]): string {
    return `## Pricing Breakdown

### ${tool1} Pricing
- **Free Plan**: Basic features for small teams
- **Starter**: $9/user/month - Essential features
- **Professional**: $19/user/month - Advanced features  
- **Enterprise**: Custom pricing - Full feature set

### ${tool2} Pricing  
- **Free Plan**: Limited but functional for individuals
- **Plus**: $12/user/month - Enhanced capabilities
- **Pro**: $24/user/month - Advanced workflows
- **Enterprise**: Custom pricing - Enterprise-grade features

### Value Analysis
When comparing value for money, consider both the feature set and your team size. ${tool1} offers better value for smaller teams, while ${tool2} provides more advanced features that justify the higher cost for larger organizations.

Both tools offer free trials, so you can test the features before committing to a paid plan.`;
  }

  private generateListicleSection(
    sectionTitle: string, 
    variables: Record<string, string>, 
    tools: any[], 
    targetWords: number
  ): string {
    if (sectionTitle.includes('Introduction')) {
      return `Choosing the right ${variables.category} tools can make or break your ${variables.audience} success. With hundreds of options available, finding the perfect solution for your specific needs can be overwhelming.

We've tested and analyzed the top ${variables.category} tools in the market to bring you this comprehensive list. Our selection criteria include ease of use, feature completeness, pricing value, customer support quality, and user satisfaction ratings.

Each tool in this list has been carefully evaluated based on real-world usage and user feedback from the ${variables.audience} community.`;
    }
    
    if (sectionTitle.includes('Selection Criteria')) {
      return `Our evaluation process considered these key factors:

**Feature Completeness**: Does the tool provide all essential ${variables.category} capabilities?
**Ease of Use**: How quickly can new users become productive?
**Pricing Value**: Fair pricing relative to features offered
**Integration Capabilities**: Works well with other business tools
**Customer Support**: Responsive and helpful support team
**User Reviews**: Consistent positive feedback from actual users
**Regular Updates**: Active development and feature additions

These criteria ensure our recommendations serve the real needs of ${variables.audience} professionals.`;
    }
    
    if (sectionTitle.includes('Tool Reviews')) {
      return tools.slice(0, 5).map((tool, index) => {
        const features = tool.features ? JSON.parse(tool.features) : [];
        return `### ${index + 1}. ${tool.name}

**Rating**: ⭐ ${tool.rating}/5 (${tool.reviewCount || 0} reviews)
**Best For**: ${features.slice(0, 2).join(' and ')} needs

${tool.description}

**Key Features**:
${features.slice(0, 4).map((f: string) => `- ${f.charAt(0).toUpperCase() + f.slice(1)}`).join('\n')}

**Pricing**: Starting at ${tool.pricing?.monthly ? `$${tool.pricing.monthly}/month` : 'Free'}

[Visit ${tool.name}](${tool.affiliateUrl})`;
      }).join('\n\n');
    }
    
    return this.generateGenericSection(sectionTitle, variables, targetWords);
  }

  private generateGuideSection(
    sectionTitle: string, 
    variables: Record<string, string>, 
    tools: any[], 
    targetWords: number
  ): string {
    if (sectionTitle.includes('Introduction')) {
      return `${variables.topic} has become essential for ${variables.audience} looking to streamline their workflows and improve productivity. This comprehensive guide will walk you through everything you need to know to get started.

Whether you're new to ${variables.topic} or looking to optimize your current setup, this guide provides practical insights and actionable steps. We'll cover the basics, advanced techniques, and tool recommendations based on real-world experience.

By the end of this guide, you'll have a clear understanding of how to implement ${variables.topic} effectively in your workflow.`;
    }
    
    if (sectionTitle.includes('Getting Started')) {
      return `The first step in your ${variables.topic} journey is understanding your specific needs and goals. Consider these questions:

- What problems are you trying to solve?
- What's your current workflow like?
- What's your budget for tools and solutions?
- How much time can you invest in setup and learning?

Once you have clear answers, you can choose the right approach and tools for your situation.

**Quick Start Checklist**:
1. Assess your current processes
2. Set clear goals and success metrics
3. Research available tools and solutions
4. Start with a simple implementation
5. Gradually expand and optimize`;
    }
    
    return this.generateGenericSection(sectionTitle, variables, targetWords);
  }

  private generateGenericSection(sectionTitle: string, variables: Record<string, string>, targetWords: number): string {
    return `This section covers ${sectionTitle.toLowerCase()} in detail. The content would be specifically tailored to ${variables.audience || 'users'} looking to understand ${variables.topic || 'the subject matter'}.

Key points to consider:
- Understanding the fundamentals
- Practical implementation steps  
- Common challenges and solutions
- Best practices and tips
- Real-world examples and case studies

This information helps readers make informed decisions and implement solutions effectively.`;
  }

  private replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return result;
  }

  private formatArticle(title: string, content: string, keywords: string[]): string {
    const seoMeta = `---
title: "${title}"
description: "Comprehensive analysis and comparison of top SaaS tools"
keywords: "${keywords.join(', ')}"
author: "Findawise SaaS Team"
date: "${new Date().toISOString().split('T')[0]}"
category: "SaaS Reviews"
tags: ${JSON.stringify(keywords.slice(0, 5))}
---

`;

    return seoMeta + `# ${title}\n\n` + content;
  }

  async saveArticle(
    title: string, 
    content: string, 
    category: string,
    keywords: string[] = []
  ): Promise<void> {
    try {
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      await db.insert(saasContent).values({
        title,
        slug,
        content,
        // excerpt: content.substring(0, 200) + '...',
        category,
        tags: JSON.stringify(keywords),
        seoKeywords: JSON.stringify(keywords),
        isPublished: true,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`✅ Article saved: ${title}`);
    } catch (error) {
      console.error(`❌ Error saving article: ${title}`, error);
    }
  }

  async generateAndSaveComparison(tool1: string, tool2: string, category: string): Promise<void> {
    const variables = {
      tool1,
      tool2,
      category,
      year: new Date().getFullYear().toString(),
      audience: 'businesses'
    };

    const article = await this.generateArticle('comparison', variables);
    const title = this.replaceVariables(this.templates.comparison.title, variables);
    
    await this.saveArticle(
      title,
      article,
      category,
      [`${tool1} vs ${tool2}`, 'comparison', 'review', `best ${category}`]
    );
  }

  async generateAndSaveListicle(category: string, audience: string, count: number = 10): Promise<void> {
    const variables = {
      category,
      audience,
      count: count.toString(),
      year: new Date().getFullYear().toString()
    };

    const article = await this.generateArticle('listicle', variables);
    const title = this.replaceVariables(this.templates.listicle.title, variables);
    
    await this.saveArticle(
      title,
      article,
      category,
      [`best ${category} tools`, `${category} software`, `${audience} tools`]
    );
  }
}

export const articleGenerator = new ArticleGenerator();