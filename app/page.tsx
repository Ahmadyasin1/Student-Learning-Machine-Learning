'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileUp, Database, AlertTriangle, Wand2, Brain, BarChart, Table, SplitSquareHorizontal, Target, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { uploadDataset, analyzeData, preprocessData, trainModel } from './api/ml';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [learningType, setLearningType] = useState<string>('');
  const [problemType, setProblemType] = useState<string>('');
  const [step, setStep] = useState(1);
  const [dataset, setDataset] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState('');
  const [results, setResults] = useState<any>(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [splitRatio, setSplitRatio] = useState(0.2);
  const [showDatasetInfo, setShowDatasetInfo] = useState(false);
  const [dataHead, setDataHead] = useState<any>(null);


  const lastStepRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to new steps
  useEffect(() => {
    if (lastStepRef.current) {
      lastStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [analysisResults]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 30 * 1024 * 1024) {
      setFile(file);
      try {
        const result = await uploadDataset(file);
        setShowDatasetInfo(true);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file');
      }
    } else {
      alert('File size should be less than 30MB');
    }
  };

  const loadDataset = async () => {
    if (!file) return;
    try {
      const result = await analyzeData(file);
      setAnalysis(result);
      setDataHead(result.head);
      setStep(3);
    } catch (error) {
      console.error('Error analyzing data:', error);
      alert('Error analyzing data');
    }
  };

  const handlePreprocessing = async () => {
    if (!file) return;
    try {
      await preprocessData(file);
      setStep(5);
    } catch (error) {
      console.error('Error preprocessing data:', error);
      alert('Error preprocessing data');
    }
  };

  const trainSelectedModel = async () => {
    if (!file || !selectedModel || !problemType) return;
    
    try {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 95));
      }, 500);

      const result = await trainModel(file, problemType, selectedModel);
      clearInterval(interval);
      setProgress(100);
      setResults(result);
      setStep(8);
    } catch (error) {
      console.error('Error training model:', error);
      alert('Error training model');
    }
  };

  const regressionModels = [
    { value: 'linear', label: 'Linear Regression', description: 'Best for linear relationships between variables' },
    { value: 'random_forest', label: 'Random Forest', description: 'Handles non-linear relationships and feature interactions' },
    { value: 'svr', label: 'Support Vector Regression', description: 'Good for non-linear regression with kernel tricks' },
    { value: 'gradient_boost', label: 'Gradient Boosting', description: 'Powerful ensemble method for complex relationships' }
  ];

  const classificationModels = [
    { value: 'logistic', label: 'Logistic Regression', description: 'Best for binary classification with linear boundaries' },
    { value: 'random_forest', label: 'Random Forest', description: 'Handles complex decision boundaries and feature interactions' },
    { value: 'svc', label: 'Support Vector Classification', description: 'Effective for high-dimensional spaces' },
    { value: 'gradient_boost', label: 'Gradient Boosting', description: 'High performance on structured data' }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-12">
          Machine Learning Training Platform created by Ahmad Yasin.
        </h1>

        <div className="space-y-6">
          {/* Step 1: File Upload */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Upload className="w-6 h-6" />
              Step 1: Upload Dataset
            </h2>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90"
            />
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected file: {file.name}
              </p>
            )}
          </Card>

          {/* Step 2: Learning Type Selection */}
          {file && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Step 2: Select Learning Type
              </h2>
              <Select onValueChange={setLearningType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select learning type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supervised">Supervised Learning</SelectItem>
                  <SelectItem value="unsupervised">Unsupervised Learning</SelectItem>
                </SelectContent>
              </Select>
              {learningType && (
                <div className="mt-4">
                  <Alert>
                    <AlertDescription>
                      {learningType === 'supervised' 
                        ? "Supervised learning uses labeled data to train models for prediction or classification tasks."
                        : "Unsupervised learning finds patterns in unlabeled data through clustering or dimensionality reduction."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </Card>
          )}

          {/* Step 3: Problem Type Selection */}
          {learningType === 'supervised' && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <GitBranch className="w-6 h-6" />
                Step 3: Select Problem Type
              </h2>
              <Select onValueChange={setProblemType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select problem type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regression">Regression</SelectItem>
                  <SelectItem value="classification">Classification</SelectItem>
                </SelectContent>
              </Select>
              {problemType && (
                <div className="mt-4">
                  <Alert>
                    <AlertDescription>
                      {problemType === 'regression'
                        ? "Regression predicts continuous numerical values."
                        : "Classification predicts discrete categories or classes."}
                    </AlertDescription>
                  </Alert>
                  <Button onClick={loadDataset} className="mt-4">
                    Load Dataset
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Step 4: Dataset Information */}
          {step >= 3 && analysis && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Table className="w-6 h-6" />
                Step 4: Dataset Information
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Dataset Overview:</h3>
                  {dataHead && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            {Object.keys(dataHead[0] || {}).map((col) => (
                              <th key={col} className="px-4 py-2 bg-gray-50">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataHead.map((row: any, i: number) => (
                            <tr key={i}>
                              {Object.values(row).map((value: any, j: number) => (
                                <td key={j} className="px-4 py-2 border">{value}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <Button onClick={() => setStep(4)}>Continue to Preprocessing</Button>
              </div>
            </Card>
          )}

          {/* Step 5: Data Preprocessing */}
          {step >= 4 && analysis && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Wand2 className="w-6 h-6" />
                Step 5: Data Preprocessing
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Null Values:</h3>
                  <ul className="list-disc ml-6">
                    {Object.entries(analysis.null_columns).map(([col, count]) => (
                      <li key={col}>{col}: {count as number} null values</li>
                    ))}
                  </ul>
                  <div className="mt-2">
                    <label htmlFor="null-action" className="block font-medium">
                      Action on Null Values:
                    </label>
                    <select id="null-action" className="border rounded p-2">
                      <option value="mean">Fill with Mean</option>
                      <option value="median">Fill with Median</option>
                      <option value="mode">Fill with Mode</option>
                      <option value="drop">Drop Rows</option>
                    </select>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Duplicate Rows:</h3>
                  <p>{analysis.duplicates} duplicate rows found.</p>
                  <div className="mt-2">
                    <label htmlFor="duplicates-action" className="block font-medium">
                      Action on Duplicates:
                    </label>
                    <select id="duplicates-action" className="border rounded p-2">
                      <option value="keep">Keep</option>
                      <option value="drop">Drop Duplicates</option>
                    </select>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Column Types:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Numeric Columns:</h4>
                      <ul className="list-disc ml-6">
                        {analysis.numeric_columns.map((col: string) => (
                          <li key={col}>{col}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium">Categorical Columns:</h4>
                      <ul className="list-disc ml-6">
                        {analysis.string_columns.map((col: string) => (
                          <li key={col}>{col}</li>
                        ))}
                      </ul>
                      <div className="mt-2">
                        <label htmlFor="categorical-encoding" className="block font-medium">
                          Encoding for Categorical Columns:
                        </label>
                        <select id="categorical-encoding" className="border rounded p-2">
                          <option value="label">Label Encoding</option>
                          <option value="onehot">One-Hot Encoding</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Scaling:</h3>
                  <label htmlFor="scaling-method" className="block font-medium">
                    Choose Scaling Method:
                  </label>
                  <select id="scaling-method" className="border rounded p-2">
                    <option value="none">None</option>
                    <option value="standard">Standard Scaler</option>
                    <option value="minmax">Min-Max Scaler</option>
                  </select>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Remove Columns:</h3>
                  <p>Select columns to remove:</p>
                  <ul className="list-disc ml-6">
                    {Object.keys(analysis.null_columns).map((col) => (
                      <li key={col}>
                        <label>
                          <input type="checkbox" value={col} className="mr-2" />
                          {col}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button onClick={handlePreprocessing}>Apply Preprocessing</Button>
              </div>
            </Card>
          )}


          {/* Step 6: Target Selection */}
          {step >= 5 && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Step 6: Select Target Variable
              </h2>
              <Select onValueChange={setTargetColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target column" />
                </SelectTrigger>
                <SelectContent>
                  {analysis?.numeric_columns.map((col: string) => (
                    <SelectItem key={col} value={col}>{col}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetColumn && (
                <Button onClick={() => setStep(6)} className="mt-4">
                  Continue
                </Button>
              )}
            </Card>
          )}

          {/* Step 7: Train/Test Split */}
          {step >= 6 && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <SplitSquareHorizontal className="w-6 h-6" />
                Step 7: Train/Test Split
              </h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Test Set Size: {splitRatio * 100}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="0.4"
                  step="0.1"
                  value={splitRatio}
                  onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
                  className="w-full"
                />
                <Button onClick={() => setStep(7)}>Continue</Button>
              </div>
            </Card>
          )}

          {/* Step 8: Model Selection */}
          {step >= 7 && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Step 8: Select Model
              </h2>
              <Select onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {(problemType === 'regression' ? regressionModels : classificationModels)
                    .map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedModel && (
                <div className="mt-4">
                  <Alert>
                    <AlertDescription>
                      {(problemType === 'regression' ? regressionModels : classificationModels)
                        .find(m => m.value === selectedModel)?.description}
                    </AlertDescription>
                  </Alert>
                  <Button onClick={trainSelectedModel} className="mt-4">
                    Train Model
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Step 9: Training Progress */}
          {progress > 0 && progress < 100 && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Training Progress</h2>
              <Progress value={progress} className="w-full" />
              <p className="mt-2 text-center">{progress}% Complete</p>
            </Card>
          )}

          {/* Step 10: Results */}
          {results && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <BarChart className="w-6 h-6" />
                Model Results
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">
                    {problemType === 'classification' ? 'Accuracy' : 'Mean Squared Error'}:
                  </h3>
                  <p className="text-2xl">{results.accuracy.toFixed(4)}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Feature Importance:</h3>
                  <div className="space-y-2">
                    {Object.entries(results.feature_importance)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([feature, importance]) => (
                        <div key={feature} className="flex items-center gap-2">
                          <div className="w-32 truncate">{feature}:</div>
                          <div className="flex-1 bg-secondary rounded-full h-4">
                            <div
                              className="bg-primary rounded-full h-4"
                              style={{ width: `${(Number(importance) * 100).toFixed(1)}%` }}
                            />
                          </div>
                          <div className="w-16 text-right">
                            {(Number(importance) * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {results.confusion_matrix && (
                  <div>
                    <h3 className="font-semibold mb-2">Confusion Matrix:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {results.confusion_matrix.map((row: number[], i: number) => (
                        row.map((cell: number, j: number) => (
                          <div key={`${i}-${j}`} className="bg-muted p-2 text-center rounded">
                            {cell}
                          </div>
                        ))
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground grid grid-cols-2 gap-2 text-center">
                      <div>True Negative</div>
                      <div>False Positive</div>
                      <div>False Negative</div>
                      <div>True Positive</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}