#!/usr/bin/env python3
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
