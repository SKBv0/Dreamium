import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getAnalysisFilePath, analysisFileExists } from '@/lib/server/analysis-storage';

/**
 * API endpoint for providing dream history
 * @returns List of previous dream analyses
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ success: false, message: 'Filename is required' }, { status: 400 });
  }

  if (!analysisFileExists(file)) {
    return NextResponse.json({ success: false, message: 'Analysis not found' }, { status: 404 });
  }

  try {
    const filePath = getAnalysisFilePath(file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const analysis = JSON.parse(fileContent);
    return NextResponse.json({ success: true, analysis });
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Failed to read analysis file ${file}:`, error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json({
      success: false,
      message: 'Failed to read analysis file',
      error: errorMessage,
      details: process.env.NODE_ENV !== 'production' ? errorStack : undefined
    }, { status: 500 });
  }
}
