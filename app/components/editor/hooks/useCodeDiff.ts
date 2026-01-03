/**
 * Hook for managing code diff state and calculations
 * Tracks previous code and toggles diff view mode
 */

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { calculateDiff } from '../diff/diff-engine';
import type { DiffResult } from '../diff/diff-types';

interface UseCodeDiffOptions {
  /** Current code content */
  code: string;
  /** Enable auto-tracking of previous code on changes */
  autoTrack?: boolean;
}

interface UseCodeDiffResult {
  /** Calculated diff result */
  diff: DiffResult;
  /** Whether diff view is active */
  isDiffView: boolean;
  /** Toggle diff view mode */
  toggleDiffView: () => void;
  /** Whether there are changes to show */
  hasDiff: boolean;
  /** Previous code state */
  previousCode: string;
  /** Manually set previous code (e.g., when loading a section) */
  setPreviousCode: (code: string) => void;
  /** Reset previous code to current (clear diff) */
  acceptChanges: () => void;
}

export function useCodeDiff({
  code,
  autoTrack = false,
}: UseCodeDiffOptions): UseCodeDiffResult {
  const [isDiffView, setIsDiffView] = useState(false);
  const [previousCode, setPreviousCode] = useState(code);
  const initialCodeRef = useRef(code);

  // Track initial code when component mounts or code is first set
  useEffect(() => {
    if (!initialCodeRef.current && code) {
      initialCodeRef.current = code;
      setPreviousCode(code);
    }
  }, [code]);

  // Calculate diff between previous and current code
  const diff = useMemo(() => {
    return calculateDiff(previousCode, code);
  }, [previousCode, code]);

  const toggleDiffView = useCallback(() => {
    setIsDiffView((prev) => !prev);
  }, []);

  // Accept current changes as new baseline
  const acceptChanges = useCallback(() => {
    setPreviousCode(code);
    setIsDiffView(false);
  }, [code]);

  // Auto-enable diff view when changes detected
  useEffect(() => {
    if (autoTrack && diff.hasDiff && !isDiffView) {
      setIsDiffView(true);
    }
  }, [autoTrack, diff.hasDiff, isDiffView]);

  return {
    diff,
    isDiffView,
    toggleDiffView,
    hasDiff: diff.hasDiff,
    previousCode,
    setPreviousCode,
    acceptChanges,
  };
}
