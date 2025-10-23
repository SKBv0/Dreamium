import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveAnalysis } from '@/lib/save-analysis';
import type { APIResponse, HistoryAPIResponse } from '@/lib/types';
import { getAnalysisHistoryDir, getAnalysisLogPath } from '@/lib/server/analysis-storage';

export async function POST(request: Request): Promise<NextResponse<APIResponse>> {
  try {
    const data = await request.json();
    
    // Validate request data
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid request data',
        error: 'Request body must be a valid JSON object'
      }, { 
        status: 400 
      });
    }
    
    const historyFilePath = await saveAnalysis(data);
    
    if (historyFilePath) {
      return NextResponse.json({ 
        success: true, 
        message: 'Analysis logged successfully.',
        data: { historyFile: historyFilePath }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to log analysis.', 
        error: 'saveAnalysis returned null'
      }, { 
        status: 500 
      });
    }

  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to log analysis:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      message: 'Failed to log analysis.',
      error: errorMessage,
      details: process.env.NODE_ENV !== 'production' ? error : undefined
    }, {
      status: 500
    });
  }
}

export async function GET(_request: Request): Promise<NextResponse<HistoryAPIResponse>> {
  try {
    const historyDirectory = getAnalysisHistoryDir();
    const currentAnalysisPath = getAnalysisLogPath();

    // If directory doesn't exist yet, return empty history gracefully
    if (!fs.existsSync(historyDirectory)) {
      return NextResponse.json({
        success: true,
        current: undefined,
        history: []
      });
    }

    const files = fs.readdirSync(historyDirectory)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => {
        try {
          // Sort by timestamp (newest first)
          return fs.statSync(path.join(historyDirectory, b)).mtime.getTime() -
                 fs.statSync(path.join(historyDirectory, a)).mtime.getTime();
        } catch (statError) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`Failed to get stats for file: ${b}`, statError);
          }
          return 0;
        }
      });

    let currentAnalysis = null;

    if (fs.existsSync(currentAnalysisPath)) {
      try {
        const currentAnalysisData = fs.readFileSync(currentAnalysisPath, 'utf8');
        currentAnalysis = JSON.parse(currentAnalysisData);
      } catch (parseError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Failed to parse current analysis file:', parseError);
        }
      }
    }
    
    const history = files.map(file => {
      try {
        const filePath = path.join(historyDirectory, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          date: stats.mtime.toISOString()
        };
      } catch (statError) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Failed to get stats for file: ${file}`, statError);
        }
        return {
          filename: file,
          date: new Date().toISOString()
        };
      }
    });
    
    return NextResponse.json({
      success: true,
      current: currentAnalysis,
      history
    });
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Failed to retrieve analysis history:', error);
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve analysis history',
      error: errorMessage
    }, {
      status: 500
    });
  }
} 
