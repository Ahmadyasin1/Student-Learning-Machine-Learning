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
    
    // Analyze null values and column types
    const columns = Object.keys(data[0] || {});
    const nullColumns: Record<string, number> = {};
    const stringColumns: string[] = [];
    const numericColumns: string[] = [];

    columns.forEach(column => {
      let nullCount = 0;
      let isNumeric = true;

      data.forEach((row: any) => {
        if (!row[column] || row[column] === '') {
          nullCount++;
        }
        if (isNaN(Number(row[column]))) {
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

    return NextResponse.json({
      null_columns: nullColumns,
      string_columns: stringColumns,
      numeric_columns: numericColumns
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Error analyzing file' }, { status: 500 });
  }
}