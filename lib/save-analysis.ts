import fs from 'fs';

import { logger } from './logger';
import type { PersistedAnalysisPayload } from './types';
import { getAnalysisHistoryDir, getAnalysisLogPath, getAnalysisFilePath } from './server/analysis-storage';

/**
 * Saves dream analysis to analysis_history directory and updates analysis_log.json file.
 * @param analysisData Analysis data to save
 * @returns Path to saved file or null
 */
export async function saveAnalysis(analysisData: PersistedAnalysisPayload): Promise<string | null> {
  try {
    // Create timestamp
    const timestamp = new Date().toISOString();
    const safeTimestamp = timestamp.replace(/:/g, '-');

    // Add timestamp to data
    const dataToSave = {
      ...analysisData,
      timestamp: safeTimestamp,
      meta: {
        version: '1.0',
        analysisDate: timestamp
      }
    };

    // Create filename
    const fileName = `analysis_${safeTimestamp}.json`;
    const filePath = getAnalysisFilePath(fileName);

    // Save analysis to file (directories are ensured by getAnalysisFilePath)
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');

    // Also update analysis_log.json file (to show latest analysis)
    const logPath = getAnalysisLogPath();
    fs.writeFileSync(logPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    
    logger.info(`Analysis saved to ${filePath} and updated in log`);
    return filePath;
  } catch (error) {
    logger.error('Error saving analysis:', error);
    return null;
  }
} 
