#!/usr/bin/env python3
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
