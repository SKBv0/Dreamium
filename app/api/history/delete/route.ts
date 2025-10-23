import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getAnalysisHistoryDir, getAnalysisLogPath, getAnalysisFilePath, analysisFileExists } from '@/lib/server/analysis-storage';

/**
 * API endpoint for deleting dream analysis history
 * Supports deleting individual files or clearing all history
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'single' or 'all'
    const filename = searchParams.get('filename');

    const historyDir = getAnalysisHistoryDir();
    const logPath = getAnalysisLogPath();

    if (action === 'all') {
      let deletedCount = 0;
      let errors: string[] = [];

      if (fs.existsSync(historyDir)) {
        try {
          const files = fs.readdirSync(historyDir)
            .filter(file => file.endsWith('.json'));

          for (const file of files) {
            try {
              fs.unlinkSync(getAnalysisFilePath(file));
              deletedCount++;
            } catch (error) {
              errors.push(`Failed to delete ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        } catch (error) {
          errors.push(`Failed to read directory ${historyDir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Also delete analysis_log.json
      if (fs.existsSync(logPath)) {
        try {
          fs.unlinkSync(logPath);
        } catch (error) {
          errors.push(`Failed to delete log file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} analysis files`,
        deletedCount,
        errors: errors.length > 0 ? errors : undefined
      });

    } else if (action === 'single' && filename) {
      if (!analysisFileExists(filename)) {
        return NextResponse.json({
          success: false,
          message: 'Analysis file not found'
        }, { status: 404 });
      }

      try {
        fs.unlinkSync(getAnalysisFilePath(filename));
        return NextResponse.json({
          success: true,
          message: 'Analysis file deleted successfully'
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Failed to delete analysis file',
          error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }

    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid action. Use "single" with filename or "all" to clear all history' 
      }, { status: 400 });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json({
      success: false,
      message: 'Failed to delete analysis history',
      error: errorMessage
    }, { status: 500 });
  }
}

