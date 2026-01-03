/**
 * Type definitions for line-by-line diff engine
 * Used by CodeDiffView to visualize code changes
 */

export type DiffLineType = 'add' | 'remove' | 'unchanged';

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
}

export interface DiffResult {
  hunks: DiffHunk[];
  stats: DiffStats;
  hasDiff: boolean;
}
