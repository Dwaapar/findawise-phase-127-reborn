/**
 * AI/ML Engine Service - Advanced Machine Learning Integration
 * 
 * This service provides comprehensive AI/ML capabilities for the Findawise Orchestrator:
 * - Scikit-learn integration for predictive modeling
 * - Feature engineering from analytics data
 * - Model training, evaluation, and deployment
 * - Real-time predictions for content optimization
 * - Model performance monitoring and drift detection
 */

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../../db';
import { 
  mlModels, 
  mlTrainingData, 
  mlPredictions, 
  modelPerformanceTracking,
  type InsertMlModel,
  type InsertMlTrainingData,
  type InsertMlPrediction,
  type InsertModelPerformanceTracking
} from '@shared/schema';
import { eq, desc, and, gte, lt } from 'drizzle-orm';

export interface MLFeatures {
  // Page features
  pageAge?: number; // days since creation
  wordCount?: number;
  imageCount?: number;
  linkCount?: number;
  headingCount?: number;
  
  // User behavior features
  averageTimeOnPage?: number;
  bounceRate?: number;
  pageViews?: number;
  uniqueVisitors?: number;
  returnVisitorRate?: number;
  
  // Emotion and content features
  emotionIntensity?: number; // 0-100
  emotionType?: string; // encoded as numeric
  ctaCount?: number;
  offerCount?: number;
  moduleCount?: number;
  
  // Temporal features
  dayOfWeek?: number; // 0-6
  hourOfDay?: number; // 0-23
  monthOfYear?: number; // 1-12
  isWeekend?: boolean;
  
  // Traffic features
  organicTrafficShare?: number; // 0-1
  paidTrafficShare?: number; // 0-1
  socialTrafficShare?: number; // 0-1
  directTrafficShare?: number; // 0-1
  
  // Device features
  mobileShare?: number; // 0-1
  desktopShare?: number; // 0-1
  tabletShare?: number; // 0-1
  
  // Engagement features
  scrollDepth?: number; // 0-100
  clickThroughRate?: number; // 0-1
  conversionRate?: number; // 0-1
  engagementScore?: number; // 0-100
}

export interface MLPredictionResult {
  prediction: number | string | object;
  confidence: number; // 0-100
  featureImportance?: Record<string, number>;
  explanation?: string;
  alternatives?: Array<{
    prediction: number | string | object;
    confidence: number;
    reason: string;
  }>;
}

export interface ModelTrainingRequest {
  modelName: string;
  modelType: 'content_optimizer' | 'cta_predictor' | 'emotion_classifier' | 'user_segmentation';
  algorithm: 'random_forest' | 'gradient_boosting' | 'neural_network' | 'logistic_regression';
  features: string[];
  targetVariable: string;
  trainingDataFilter?: {
    dateRange?: { start: Date; end: Date };
    minSamples?: number;
    entityTypes?: string[];
    performanceThreshold?: number;
  };
  hyperparameters?: Record<string, any>;
  validationSplit?: number; // 0-1
  testSplit?: number; // 0-1
}

export interface ModelEvaluationResult {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  confusionMatrix?: number[][];
  featureImportance: Record<string, number>;
  crossValidationScore?: number;
  trainingTime: number; // milliseconds
  predictionTime: number; // milliseconds per prediction
}

class MLEngineService {
  private readonly modelsDir = path.join(process.cwd(), 'ml_models');
  private readonly scriptsDir = path.join(process.cwd(), 'scripts', 'ml');
  private loadedModels: Map<string, any> = new Map();
  
  constructor() {
    this.initializeMLEngine();
  }

  /**
   * Initialize ML Engine and create necessary directories
   */
  private async initializeMLEngine(): Promise<void> {
    try {
      // Create directories
      await fs.mkdir(this.modelsDir, { recursive: true });
      await fs.mkdir(this.scriptsDir, { recursive: true });
      
      // Create Python scripts for ML operations
      await this.createPythonScripts();
      
      console.log('✅ ML Engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ML Engine:', error);
    }
  }

  /**
   * Train a new ML model with the provided configuration
   */
  async trainModel(request: ModelTrainingRequest): Promise<string> {
    const startTime = Date.now();
    const modelId = `${request.modelName}-${request.modelType}-${Date.now()}`;
    const modelPath = path.join(this.modelsDir, `${modelId}.joblib`);
    
    try {
      console.log(`🧠 Starting training for model: ${request.modelName}`);
      
      // Prepare training data
      const trainingData = await this.prepareTrainingData(request);
      
      if (trainingData.length < (request.trainingDataFilter?.minSamples || 100)) {
        throw new Error(`Insufficient training data: ${trainingData.length} samples (minimum: ${request.trainingDataFilter?.minSamples || 100})`);
      }
      
      // Save training data to temporary file
      const trainingDataPath = path.join(this.scriptsDir, `training_${modelId}.json`);
      await fs.writeFile(trainingDataPath, JSON.stringify({
        data: trainingData,
        config: request
      }));
      
      // Train model using Python script
      const trainingResult = await this.runPythonScript('train_model.py', [
        trainingDataPath,
        modelPath,
        JSON.stringify(request.hyperparameters || {})
      ]);
      
      const evaluation = JSON.parse(trainingResult);
      const trainingTime = Date.now() - startTime;
      
      // Save model metadata to database
      const modelRecord: InsertMlModel = {
        name: request.modelName,
        version: '1.0.0',
        type: request.modelType,
        algorithm: request.algorithm,
        purpose: `${request.modelType} model for optimizing ${request.targetVariable}`,
        features: request.features,
        hyperparameters: request.hyperparameters || {},
        performance: {
          ...evaluation,
          trainingTime,
          trainingDataSize: trainingData.length
        },
        trainingData: {
          sampleCount: trainingData.length,
          features: request.features,
          targetVariable: request.targetVariable,
          trainingDataFilter: request.trainingDataFilter
        },
        modelPath,
        isActive: true,
        isProduction: evaluation.accuracy > 0.8, // Auto-deploy if accuracy > 80%
        trainedAt: new Date(),
        createdBy: 'ml_engine'
      };
      
      const [model] = await db.insert(mlModels).values(modelRecord).returning();
      
      // Store performance tracking
      const performanceRecord: InsertModelPerformanceTracking = {
        modelId: model.id,
        evaluationType: 'validation',
        datasetSize: trainingData.length,
        metrics: evaluation,
        confusionMatrix: evaluation.confusionMatrix,
        featureImportance: evaluation.featureImportance,
        isProductionReady: evaluation.accuracy > 0.8,
        evaluatedBy: 'ml_engine',
        notes: `Initial training evaluation for ${request.modelName}`
      };
      
      await db.insert(modelPerformanceTracking).values(performanceRecord);
      
      // Clean up temporary files
      await fs.unlink(trainingDataPath);
      
      console.log(`✅ Model training completed: ${request.modelName} (Accuracy: ${(evaluation.accuracy * 100).toFixed(1)}%)`);
      
      return modelId;
      
    } catch (error) {
      console.error(`❌ Model training failed for ${request.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Make predictions using a trained model
   */
  async predict(modelName: string, features: MLFeatures): Promise<MLPredictionResult> {
    try {
      // Get the latest production model
      const [model] = await db
        .select()
        .from(mlModels)
        .where(and(
          eq(mlModels.name, modelName),
          eq(mlModels.isProduction, true),
          eq(mlModels.isActive, true)
        ))
        .orderBy(desc(mlModels.trainedAt))
        .limit(1);
      
      if (!model) {
        throw new Error(`No production model found for: ${modelName}`);
      }
      
      // Prepare feature vector
      const featureVector = this.prepareFeatureVector(features, model.features as string[]);
      
      // Make prediction using Python script
      const predictionResult = await this.runPythonScript('predict.py', [
        model.modelPath!,
        JSON.stringify(featureVector),
        JSON.stringify(model.features)
      ]);
      
      const result = JSON.parse(predictionResult);
      
      // Store prediction for feedback loop
      const predictionRecord: InsertMlPrediction = {
        predictionId: randomUUID(),
        modelId: model.id,
        inputFeatures: featureVector,
        prediction: result.prediction,
        confidence: Math.round(result.confidence * 100),
        sourceEntity: features.pageSlug || 'unknown',
        sourceType: this.inferSourceType(features),
        wasImplemented: false,
        feedbackReceived: false
      };
      
      await db.insert(mlPredictions).values(predictionRecord);
      
      // Update model usage
      await db
        .update(mlModels)
        .set({ 
          lastUsedAt: new Date(),
          usageCount: model.usageCount + 1
        })
        .where(eq(mlModels.id, model.id));
      
      return {
        prediction: result.prediction,
        confidence: Math.round(result.confidence * 100),
        featureImportance: result.featureImportance,
        explanation: result.explanation,
        alternatives: result.alternatives
      };
      
    } catch (error) {
      console.error(`❌ Prediction failed for model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Evaluate model performance on new data
   */
  async evaluateModel(modelId: number, testData?: any[]): Promise<ModelEvaluationResult> {
    try {
      const [model] = await db
        .select()
        .from(mlModels)
        .where(eq(mlModels.id, modelId));
      
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      // Use provided test data or generate from recent data
      const evaluationData = testData || await this.prepareEvaluationData(model);
      
      if (evaluationData.length === 0) {
        throw new Error('No evaluation data available');
      }
      
      // Save evaluation data to temporary file
      const evalDataPath = path.join(this.scriptsDir, `eval_${modelId}_${Date.now()}.json`);
      await fs.writeFile(evalDataPath, JSON.stringify(evaluationData));
      
      // Run evaluation using Python script
      const evaluationResult = await this.runPythonScript('evaluate_model.py', [
        model.modelPath!,
        evalDataPath,
        JSON.stringify(model.features)
      ]);
      
      const result = JSON.parse(evaluationResult);
      
      // Store evaluation results
      const performanceRecord: InsertModelPerformanceTracking = {
        modelId: model.id,
        evaluationType: 'production',
        datasetSize: evaluationData.length,
        metrics: result,
        confusionMatrix: result.confusionMatrix,
        featureImportance: result.featureImportance,
        predictionDistribution: result.predictionDistribution,
        driftDetection: result.driftDetection,
        isProductionReady: result.accuracy > 0.75,
        evaluatedBy: 'ml_engine',
        notes: `Production evaluation for model ${model.name}`
      };
      
      await db.insert(modelPerformanceTracking).values(performanceRecord);
      
      // Clean up temporary files
      await fs.unlink(evalDataPath);
      
      console.log(`✅ Model evaluation completed for ${model.name} (Accuracy: ${(result.accuracy * 100).toFixed(1)}%)`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Model evaluation failed:`, error);
      throw error;
    }
  }

  /**
   * Retrain model with new data
   */
  async retrainModel(modelId: number, additionalData?: any[]): Promise<void> {
    try {
      const [model] = await db
        .select()
        .from(mlModels)
        .where(eq(mlModels.id, modelId));
      
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      console.log(`🔄 Retraining model: ${model.name}`);
      
      // Prepare combined training data
      const originalRequest = {
        modelName: model.name,
        modelType: model.type as any,
        algorithm: model.algorithm as any,
        features: model.features as string[],
        targetVariable: (model.trainingData as any)?.targetVariable,
        trainingDataFilter: (model.trainingData as any)?.trainingDataFilter,
        hyperparameters: model.hyperparameters as any
      };
      
      const combinedData = await this.prepareTrainingData(originalRequest, additionalData);
      
      // Create new model version
      const newModelId = await this.trainModel({
        ...originalRequest,
        modelName: `${model.name}_v${Date.now()}`
      });
      
      // Compare performance with previous version
      const newModel = await db
        .select()
        .from(mlModels)
        .where(eq(mlModels.name, `${model.name}_v${Date.now()}`));
      
      // If new model performs better, make it production
      if (newModel.length > 0) {
        const newPerformance = newModel[0].performance as any;
        const oldPerformance = model.performance as any;
        
        if (newPerformance.accuracy > oldPerformance.accuracy) {
          // Promote new model to production
          await db
            .update(mlModels)
            .set({ isProduction: false })
            .where(eq(mlModels.id, model.id));
          
          await db
            .update(mlModels)
            .set({ isProduction: true, deployedAt: new Date() })
            .where(eq(mlModels.id, newModel[0].id));
          
          console.log(`✅ Model ${model.name} retrained and promoted to production`);
        } else {
          console.log(`⚠️  Retrained model performance did not improve, keeping original`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Model retraining failed:`, error);
      throw error;
    }
  }

  /**
   * Extract features from analytics data for ML training
   */
  extractFeatures(analyticsData: any, contextData?: any): MLFeatures {
    const features: MLFeatures = {};
    
    try {
      // Page features
      if (analyticsData.content) {
        features.wordCount = analyticsData.content.wordCount || 0;
        features.imageCount = analyticsData.content.imageCount || 0;
        features.linkCount = analyticsData.content.linkCount || 0;
        features.headingCount = analyticsData.content.headingCount || 0;
      }
      
      // Behavior features
      if (analyticsData.behavior) {
        features.averageTimeOnPage = analyticsData.behavior.averageTimeOnPage || 0;
        features.bounceRate = analyticsData.behavior.bounceRate || 0;
        features.pageViews = analyticsData.behavior.pageViews || 0;
        features.uniqueVisitors = analyticsData.behavior.uniqueVisitors || 0;
        features.returnVisitorRate = analyticsData.behavior.returnVisitorRate || 0;
        features.scrollDepth = analyticsData.behavior.scrollDepth || 0;
        features.engagementScore = analyticsData.behavior.engagementScore || 0;
      }
      
      // Performance features
      if (analyticsData.performance) {
        features.clickThroughRate = analyticsData.performance.ctr || 0;
        features.conversionRate = analyticsData.performance.conversionRate || 0;
      }
      
      // Context features
      if (contextData) {
        features.emotionType = this.encodeEmotion(contextData.emotion);
        features.emotionIntensity = contextData.emotionIntensity || 50;
        features.ctaCount = contextData.ctaCount || 0;
        features.offerCount = contextData.offerCount || 0;
        features.moduleCount = contextData.moduleCount || 0;
      }
      
      // Temporal features
      const now = new Date();
      features.dayOfWeek = now.getDay();
      features.hourOfDay = now.getHours();
      features.monthOfYear = now.getMonth() + 1;
      features.isWeekend = features.dayOfWeek === 0 || features.dayOfWeek === 6;
      
      // Traffic features
      if (analyticsData.traffic) {
        const total = analyticsData.traffic.organic + analyticsData.traffic.paid + 
                     analyticsData.traffic.social + analyticsData.traffic.direct;
        if (total > 0) {
          features.organicTrafficShare = analyticsData.traffic.organic / total;
          features.paidTrafficShare = analyticsData.traffic.paid / total;
          features.socialTrafficShare = analyticsData.traffic.social / total;
          features.directTrafficShare = analyticsData.traffic.direct / total;
        }
      }
      
      // Device features
      if (analyticsData.devices) {
        const totalDevices = analyticsData.devices.mobile + analyticsData.devices.desktop + 
                            analyticsData.devices.tablet;
        if (totalDevices > 0) {
          features.mobileShare = analyticsData.devices.mobile / totalDevices;
          features.desktopShare = analyticsData.devices.desktop / totalDevices;
          features.tabletShare = analyticsData.devices.tablet / totalDevices;
        }
      }
      
      return features;
      
    } catch (error) {
      console.warn('⚠️  Error extracting features:', error);
      return features;
    }
  }

  /**
   * Prepare training data from analytics
   */
  private async prepareTrainingData(request: ModelTrainingRequest, additionalData?: any[]): Promise<any[]> {
    // This would typically query your analytics database
    // For now, return a mock structure that shows the expected format
    const mockData = [];
    
    // In production, this would:
    // 1. Query analytics events, behavior data, performance metrics
    // 2. Join with page/offer/CTA configuration data
    // 3. Extract features using extractFeatures method
    // 4. Create feature vectors with target variables
    // 5. Apply filters and transformations
    
    console.log(`📊 Preparing training data for ${request.modelType} model`);
    console.log(`🎯 Target variable: ${request.targetVariable}`);
    console.log(`📈 Features: ${request.features.join(', ')}`);
    
    // Return mock data structure
    return mockData;
  }

  /**
   * Prepare evaluation data from recent analytics
   */
  private async prepareEvaluationData(model: any): Promise<any[]> {
    // Query recent data for evaluation
    // Similar to prepareTrainingData but with recent time filter
    return [];
  }

  /**
   * Prepare feature vector for prediction
   */
  private prepareFeatureVector(features: MLFeatures, expectedFeatures: string[]): Record<string, number> {
    const vector: Record<string, number> = {};
    
    for (const feature of expectedFeatures) {
      vector[feature] = (features as any)[feature] || 0;
    }
    
    return vector;
  }

  /**
   * Encode emotion string to numeric value
   */
  private encodeEmotion(emotion?: string): number {
    const emotionMap: Record<string, number> = {
      trust: 1,
      excitement: 2,
      relief: 3,
      confidence: 4,
      calm: 5
    };
    
    return emotionMap[emotion || 'trust'] || 1;
  }

  /**
   * Infer source type from features
   */
  private inferSourceType(features: MLFeatures): string {
    if (features.ctaCount && features.ctaCount > 0) return 'cta';
    if (features.offerCount && features.offerCount > 0) return 'offer';
    if (features.moduleCount && features.moduleCount > 0) return 'module';
    return 'page';
  }

  /**
   * Run Python script for ML operations
   */
  private async runPythonScript(scriptName: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        path.join(this.scriptsDir, scriptName),
        ...args
      ]);
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Python script failed: ${stderr}`));
        }
      });
      
      // Set timeout for long-running operations
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script timeout'));
      }, 300000); // 5 minutes
    });
  }

  /**
   * Create Python scripts for ML operations
   */
  private async createPythonScripts(): Promise<void> {
    // Create training script
    const trainScript = `#!/usr/bin/env python3
import json
import sys
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import numpy as np

def train_model():
    # Load training data
    with open(sys.argv[1], 'r') as f:
        data = json.load(f)
    
    training_data = data['data']
    config = data['config']
    hyperparameters = json.loads(sys.argv[3])
    
    # Convert to DataFrame
    df = pd.DataFrame(training_data)
    
    # Prepare features and target
    X = df[config['features']]
    y = df[config['targetVariable']]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Initialize model
    if config['algorithm'] == 'random_forest':
        model = RandomForestClassifier(**hyperparameters)
    elif config['algorithm'] == 'gradient_boosting':
        model = GradientBoostingClassifier(**hyperparameters)
    elif config['algorithm'] == 'logistic_regression':
        model = LogisticRegression(**hyperparameters)
    elif config['algorithm'] == 'neural_network':
        model = MLPClassifier(**hyperparameters)
    else:
        model = RandomForestClassifier()
    
    # Train model
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    
    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5)
    
    # Feature importance
    if hasattr(model, 'feature_importances_'):
        feature_importance = dict(zip(config['features'], model.feature_importances_))
    else:
        feature_importance = {}
    
    # Save model
    joblib.dump(model, sys.argv[2])
    
    # Return results
    results = {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1Score': float(f1),
        'crossValidationScore': float(cv_scores.mean()),
        'confusionMatrix': confusion_matrix(y_test, y_pred).tolist(),
        'featureImportance': feature_importance
    }
    
    print(json.dumps(results))

if __name__ == '__main__':
    train_model()
`;

    // Create prediction script
    const predictScript = `#!/usr/bin/env python3
import json
import sys
import joblib
import pandas as pd
import numpy as np

def predict():
    # Load model
    model = joblib.load(sys.argv[1])
    
    # Load input features
    features = json.loads(sys.argv[2])
    feature_names = json.loads(sys.argv[3])
    
    # Create DataFrame
    df = pd.DataFrame([features])
    
    # Make prediction
    prediction = model.predict(df)[0]
    
    # Get confidence (probability)
    if hasattr(model, 'predict_proba'):
        probabilities = model.predict_proba(df)[0]
        confidence = float(max(probabilities))
    else:
        confidence = 0.8  # Default confidence for models without probability
    
    # Feature importance
    if hasattr(model, 'feature_importances_'):
        feature_importance = dict(zip(feature_names, model.feature_importances_))
    else:
        feature_importance = {}
    
    results = {
        'prediction': float(prediction) if isinstance(prediction, (int, float, np.number)) else str(prediction),
        'confidence': confidence,
        'featureImportance': feature_importance,
        'explanation': f'Predicted {prediction} with {confidence:.1%} confidence'
    }
    
    print(json.dumps(results))

if __name__ == '__main__':
    predict()
`;

    // Create evaluation script
    const evaluateScript = `#!/usr/bin/env python3
import json
import sys
import joblib
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import numpy as np

def evaluate_model():
    # Load model
    model = joblib.load(sys.argv[1])
    
    # Load evaluation data
    with open(sys.argv[2], 'r') as f:
        eval_data = json.load(f)
    
    feature_names = json.loads(sys.argv[3])
    
    # Convert to DataFrame
    df = pd.DataFrame(eval_data)
    
    X = df[feature_names]
    y = df['target']
    
    # Make predictions
    y_pred = model.predict(X)
    
    # Calculate metrics
    accuracy = accuracy_score(y, y_pred)
    precision = precision_score(y, y_pred, average='weighted')
    recall = recall_score(y, y_pred, average='weighted')
    f1 = f1_score(y, y_pred, average='weighted')
    
    # Feature importance
    if hasattr(model, 'feature_importances_'):
        feature_importance = dict(zip(feature_names, model.feature_importances_))
    else:
        feature_importance = {}
    
    results = {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1Score': float(f1),
        'confusionMatrix': confusion_matrix(y, y_pred).tolist(),
        'featureImportance': feature_importance
    }
    
    print(json.dumps(results))

if __name__ == '__main__':
    evaluate_model()
`;

    // Write scripts to files
    await fs.writeFile(path.join(this.scriptsDir, 'train_model.py'), trainScript);
    await fs.writeFile(path.join(this.scriptsDir, 'predict.py'), predictScript);
    await fs.writeFile(path.join(this.scriptsDir, 'evaluate_model.py'), evaluateScript);
    
    // Make scripts executable
    await fs.chmod(path.join(this.scriptsDir, 'train_model.py'), 0o755);
    await fs.chmod(path.join(this.scriptsDir, 'predict.py'), 0o755);
    await fs.chmod(path.join(this.scriptsDir, 'evaluate_model.py'), 0o755);
  }
}

export const mlEngine = new MLEngineService();