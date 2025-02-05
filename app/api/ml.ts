import Papa from 'papaparse';

export const API_URL = '/api';

// Helper function to parse CSV data with proper error handling
const parseCSV = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true, // Automatically convert numeric values
      skipEmptyLines: true, // Skip empty lines
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('Error parsing CSV: ' + results.errors[0].message));
        } else if (!results.data || results.data.length === 0) {
          reject(new Error('No data found in CSV file'));
        } else {
          resolve(results.data);
        }
      },
      error: (error) => reject(new Error('Error parsing CSV: ' + error.message)),
    });
  });
};

export async function uploadDataset(file: File) {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Please upload a CSV file');
  }

  try {
    const data = await parseCSV(file);
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    return { 
      message: 'File uploaded successfully', 
      rows: data.length,
      columns: Object.keys(data[0] || {}).length
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Error uploading file');
  }
}

export async function analyzeData(file: File) {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const data = await parseCSV(file);
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format');
    }

    // Analyze columns
    const columns = Object.keys(data[0] || {});
    const nullColumns: Record<string, number> = {};
    const stringColumns: string[] = [];
    const numericColumns: string[] = [];

    columns.forEach(column => {
      let nullCount = 0;
      let isNumeric = true;

      data.forEach((row: any) => {
        const value = row[column];
        if (value === null || value === undefined || value === '') {
          nullCount++;
        } else if (typeof value === 'string' && isNaN(Number(value))) {
          isNumeric = false;
        }
      });

      nullColumns[column] = nullCount;
      if (isNumeric) {
        numericColumns.push(column);
      } else {
        stringColumns.push(column);
      }
    });

    // Get first 5 rows for preview
    const head = data.slice(0, 5);

    return {
      null_columns: nullColumns,
      string_columns: stringColumns,
      numeric_columns: numericColumns,
      head,
      total_rows: data.length,
      total_columns: columns.length
    };
  } catch (error: any) {
    console.error('Analysis error:', error);
    throw new Error(error.message || 'Error analyzing data');
  }
}

export async function preprocessData(file: File) {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const data = await parseCSV(file);
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format');
    }

    const columns = Object.keys(data[0] || {});
    const processedData = [...data];
    const stats: Record<string, any> = {};

    columns.forEach(column => {
      let sum = 0;
      let count = 0;
      let isNumeric = true;
      const categories = new Set();
      let min = Infinity;
      let max = -Infinity;

      // First pass: analyze data
      data.forEach((row: any) => {
        const value = row[column];
        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'number' || !isNaN(Number(value))) {
            const numValue = Number(value);
            sum += numValue;
            count++;
            min = Math.min(min, numValue);
            max = Math.max(max, numValue);
          } else {
            isNumeric = false;
            categories.add(value);
          }
        }
      });

      // Store column statistics
      stats[column] = {
        type: isNumeric ? 'numeric' : 'categorical',
        nullCount: data.length - count,
        ...(isNumeric ? {
          mean: count > 0 ? sum / count : 0,
          min: min !== Infinity ? min : 0,
          max: max !== -Infinity ? max : 0
        } : {
          categories: Array.from(categories),
          mostCommon: Array.from(categories)[0]
        })
      };

      // Second pass: fill missing values
      processedData.forEach((row: any) => {
        if (row[column] === null || row[column] === undefined || row[column] === '') {
          row[column] = isNumeric ? stats[column].mean : stats[column].mostCommon;
        }
      });
    });

    return { 
      message: 'Data preprocessed successfully', 
      shape: [processedData.length, columns.length],
      stats
    };
  } catch (error: any) {
    console.error('Preprocess error:', error);
    throw new Error(error.message || 'Error preprocessing data');
  }
}

export async function trainModel(file: File, problemType: string, modelName: string) {
  if (!file || !problemType || !modelName) {
    throw new Error('Missing required parameters');
  }

  try {
    const data = await parseCSV(file);
    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format');
    }

    // Mock training results with more realistic values
    const features = Object.keys(data[0] || {});
    const mockResults = {
      accuracy: problemType === 'classification' ? 
        0.75 + Math.random() * 0.2 : // Classification accuracy between 75-95%
        1 - Math.random() * 0.3,     // Regression R² between 0.7-1.0
      feature_importance: Object.fromEntries(
        features.map(feature => [
          feature,
          Math.random()
        ])
      ),
      confusion_matrix: problemType === 'classification' ? [
        [Math.floor(Math.random() * 100), Math.floor(Math.random() * 30)],
        [Math.floor(Math.random() * 30), Math.floor(Math.random() * 100)]
      ] : null,
      predictions: data.slice(0, 10).map(() => 
        problemType === 'classification' ? 
          Math.round(Math.random()) : 
          Math.random() * 100
      )
    };

    return mockResults;
  } catch (error: any) {
    console.error('Training error:', error);
    throw new Error(error.message || 'Error training model');
  }
}