from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_squared_error, confusion_matrix
import io
import json

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataAnalysis(BaseModel):
    null_columns: dict
    string_columns: List[str]
    numeric_columns: List[str]

class TrainingResult(BaseModel):
    accuracy: float
    feature_importance: dict
    confusion_matrix: Optional[List[List[float]]]
    predictions: List[float]

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    return {"message": "File uploaded successfully", "rows": len(df)}

@app.post("/analyze")
async def analyze_data(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    null_analysis = df.isnull().sum().to_dict()
    string_columns = df.select_dtypes(include=['object']).columns.tolist()
    numeric_columns = df.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    return DataAnalysis(
        null_columns=null_analysis,
        string_columns=string_columns,
        numeric_columns=numeric_columns
    )

@app.post("/preprocess")
async def preprocess_data(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    # Handle null values
    numeric_columns = df.select_dtypes(include=['int64', 'float64']).columns
    df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].mean())
    
    # Handle categorical columns
    categorical_columns = df.select_dtypes(include=['object']).columns
    label_encoders = {}
    
    for column in categorical_columns:
        le = LabelEncoder()
        df[column] = le.fit_transform(df[column].astype(str))
        label_encoders[column] = le
    
    return {"message": "Data preprocessed successfully", "shape": df.shape}

@app.post("/train")
async def train_model(
    file: UploadFile = File(...),
    problem_type: str = "classification",
    model_name: str = "random_forest",
    target_column: str = None
):
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    if target_column is None:
        target_column = df.columns[-1]
    
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    if problem_type == "classification":
        if model_name == "random_forest":
            model = RandomForestClassifier(n_estimators=100)
        else:
            model = LogisticRegression()
    else:
        if model_name == "random_forest":
            model = RandomForestRegressor(n_estimators=100)
        else:
            model = LinearRegression()
    
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    
    result = {
        "accuracy": accuracy_score(y_test, predictions) if problem_type == "classification" 
                   else mean_squared_error(y_test, predictions),
        "feature_importance": dict(zip(X.columns, model.feature_importances_)) 
                            if hasattr(model, 'feature_importances_') 
                            else dict(zip(X.columns, [0] * len(X.columns))),
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist() 
                          if problem_type == "classification" 
                          else None,
        "predictions": predictions.tolist()
    }
    
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)