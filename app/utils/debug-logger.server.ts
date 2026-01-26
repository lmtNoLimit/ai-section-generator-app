import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Debug logger for AI response tracing (SERVER-SIDE ONLY)
 * Writes to ./debug-logs/ directory for inspection
 *
 * Enable with: DEBUG_AI_RESPONSE=true in .env
 */

const DEBUG_DIR = path.join(process.cwd(), 'debug-logs');
const MAX_LOG_FILES = 20; // Keep only last 20 logs

// Log on module load to verify env is read
console.log(`[DEBUG-LOGGER] Loaded. DEBUG_AI_RESPONSE=${process.env.DEBUG_AI_RESPONSE}`);

// Ensure debug directory exists
function ensureDebugDir() {
  if (!fs.existsSync(DEBUG_DIR)) {
    fs.mkdirSync(DEBUG_DIR, { recursive: true });
  }
}

// Clean old log files (keep only MAX_LOG_FILES most recent)
function cleanOldLogs() {
  try {
    const files = fs.readdirSync(DEBUG_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        time: fs.statSync(path.join(DEBUG_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Remove files beyond limit
    files.slice(MAX_LOG_FILES).forEach(f => {
      fs.unlinkSync(path.join(DEBUG_DIR, f.name));
    });
  } catch (e) {
    // Ignore cleanup errors
  }
}

/**
 * Log AI generation debug data to file
 * File: debug-logs/ai-{timestamp}.json
 */
export function logAIDebug(data: {
  conversationId: string;
  prompt: string;
  fullResponse: string;
  finishReason?: string;
  tokenCount?: number;
  extractionResult?: {
    hasCode: boolean;
    codeLength?: number;
    changesCount?: number;
  };
  validationResult?: {
    isComplete: boolean;
    errors: string[];
  };
  continuationCount?: number;
  timestamp?: string;
}) {
  // Always log that this function was called
  console.log(`[DEBUG-LOGGER] logAIDebug called. Flag=${process.env.DEBUG_AI_RESPONSE}, ResponseLen=${data.fullResponse?.length}`);

  // Only write file if debug flag is enabled
  if (process.env.DEBUG_AI_RESPONSE !== 'true') {
    console.log('[DEBUG-LOGGER] Skipping file write - flag not true');
    return;
  }

  try {
    console.log(`[DEBUG-LOGGER] Writing to ${DEBUG_DIR}...`);
    ensureDebugDir();
    cleanOldLogs();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ai-${timestamp}.json`;
    const filepath = path.join(DEBUG_DIR, filename);

    const logData = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      responseLength: data.fullResponse?.length || 0,
      // Add markers to easily identify truncation
      responseStart: data.fullResponse?.substring(0, 200),
      responseEnd: data.fullResponse?.substring(data.fullResponse.length - 500),
    };

    fs.writeFileSync(filepath, JSON.stringify(logData, null, 2));

    console.log(`[DEBUG] AI response logged to: ${filepath}`);
    console.log(`[DEBUG] Response length: ${data.fullResponse?.length} chars`);
    console.log(`[DEBUG] Finish reason: ${data.finishReason || 'unknown'}`);

    return filepath;
  } catch (error) {
    console.error('[DEBUG] Failed to write debug log:', error);
  }
}

/**
 * Quick console log for key debugging points
 */
export function debugLog(label: string, data: Record<string, unknown>) {
  // Always log that this was called (minimal)
  console.log(`[DEBUG-LOGGER] debugLog("${label}") called. Flag=${process.env.DEBUG_AI_RESPONSE}`);

  if (process.env.DEBUG_AI_RESPONSE !== 'true') {
    return;
  }

  console.log(`\n=== [DEBUG: ${label}] ===`);
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > 200) {
      console.log(`  ${key}: (${value.length} chars) "${value.substring(0, 100)}...${value.substring(value.length - 100)}"`);
    } else {
      console.log(`  ${key}:`, value);
    }
  }
  console.log('=========================\n');
}
