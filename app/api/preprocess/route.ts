import { NextResponse } from 'next/server';
import { parse } from 'papaparse';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileContent = fileBuffer.toString();
    
    // Parse CSV
    const { data } = parse(fileContent, { header: true });
    
    // Process data
    const columns = Object.keys(data[0] || {});
    const processedData = [...data];

    columns.forEach(column => {
      let sum = 0;
      let count = 0;
      let isNumeric = true;
      let categories = new Set();

      // First pass: determine column type and calculate mean for numeric columns
      data.forEach((row: any) => {
        if (row[column] && row[column] !== '') {
          if (!isNaN(Number(row[column]))) {
            sum += Number(row[column]);
            count++;
          } else {
            isNumeric = false;
            categories.add(row[column]);
          }
        }
      });

      // Second pass: fill missing values and encode categorical variables
      if (isNumeric) {
        const mean = sum / count;
        processedData.forEach((row: any) => {
          if (!row[column] || row[column] === '') {
            row[column] = mean;
          }
        });
      } else {
        const categoriesArray = Array.from(categories);
        processedData.forEach((row: any) => {
          if (!row[column] || row[column] === '') {
            row[column] = categoriesArray[0]; // Use first category as default
          }
          row[column] = categoriesArray.indexOf(row[column]); // Label encoding
        });
      }
    });

    return NextResponse.json({
      message: 'Data preprocessed successfully',
      shape: [processedData.length, columns.length]
    });
  } catch (error) {
    console.error('Preprocess error:', error);
    return NextResponse.json({ error: 'Error preprocessing file' }, { status: 500 });
  }
}