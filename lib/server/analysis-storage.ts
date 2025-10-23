import path from 'path';
import fs from 'fs';

/**
 * Server-side storage paths for dream analysis history
 */

const DATA_DIR = path.join(process.cwd(), '.data');
const ANALYSIS_HISTORY_DIR = path.join(DATA_DIR, 'analysis_history');
const ANALYSIS_LOG_PATH = path.join(DATA_DIR, 'analysis_log.json');

/**
 * Ensure the data directories exist
 */
export function ensureDataDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ANALYSIS_HISTORY_DIR)) {
    fs.mkdirSync(ANALYSIS_HISTORY_DIR, { recursive: true });
  }
}

/**
 * Get the analysis history directory path
 */
export function getAnalysisHistoryDir(): string {
  ensureDataDirectories();
  return ANALYSIS_HISTORY_DIR;
}

/**
 * Get the analysis log file path
 */
export function getAnalysisLogPath(): string {
  ensureDataDirectories();
  return ANALYSIS_LOG_PATH;
}

/**
 * Get full path for an analysis file
 */
export function getAnalysisFilePath(filename: string): string {
  const safeFilename = path.basename(filename); // Prevent path traversal
  return path.join(getAnalysisHistoryDir(), safeFilename);
}

/**
 * Check if a file exists in analysis history
 */
export function analysisFileExists(filename: string): boolean {
  return fs.existsSync(getAnalysisFilePath(filename));
}
