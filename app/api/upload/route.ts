import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';
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
    const { data, errors } = parse(fileContent, { header: true });
    
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Invalid CSV file' }, { status: 400 });
    }

    return NextResponse.json({ message: 'File uploaded successfully', rows: data.length });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Error processing file' }, { status: 500 });
  }
}