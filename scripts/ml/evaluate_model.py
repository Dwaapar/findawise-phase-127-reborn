#!/usr/bin/env python3
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
