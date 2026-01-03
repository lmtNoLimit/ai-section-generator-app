/**
 * useStreamingProgress hook - Tracks build phases during AI streaming
 * Detects Liquid section patterns to show progress through generation phases
 * Uses content analysis to determine current phase (schema → styles → markup)
 */
import { useState, useCallback, useRef } from 'react';

export interface BuildPhase {
  id: string;
  label: string;
  trigger: string | null;
  percentage: number;
  completed: boolean;
}

export interface StreamingProgress {
  phases: BuildPhase[];
  currentPhase: string;
  percentage: number;
  tokenCount: number;
  estimatedTotal: number;
  isComplete: boolean;
}

// Build phases for Liquid section generation
// Triggers based on Shopify Liquid section structure
const PHASE_DEFINITIONS: Omit<BuildPhase, 'completed'>[] = [
  { id: 'analyzing', label: 'Analyzing prompt', trigger: null, percentage: 0 },
  { id: 'schema', label: 'Building schema', trigger: '{% schema %}', percentage: 25 },
  { id: 'styles', label: 'Adding styles', trigger: '{% style %}', percentage: 50 },
  { id: 'markup', label: 'Creating markup', trigger: '{% endstyle %}', percentage: 75 },
  { id: 'complete', label: 'Finalizing', trigger: '{% endschema %}', percentage: 100 },
];

const initialProgress: StreamingProgress = {
  phases: PHASE_DEFINITIONS.map(p => ({ ...p, completed: false })),
  currentPhase: 'analyzing',
  percentage: 0,
  tokenCount: 0,
  estimatedTotal: 2000, // Typical section ~2000 tokens
  isComplete: false,
};

export function useStreamingProgress() {
  const [progress, setProgress] = useState<StreamingProgress>(initialProgress);
  const contentBufferRef = useRef('');

  /**
   * Process incoming token and update progress state
   * Detects phase transitions based on content patterns
   */
  const processToken = useCallback((token: string) => {
    contentBufferRef.current += token;
    const content = contentBufferRef.current;
    const tokenCount = content.length;

    // Detect completed phases based on triggers
    const updatedPhases = PHASE_DEFINITIONS.map(phase => ({
      ...phase,
      completed: phase.trigger ? content.includes(phase.trigger) : tokenCount > 0,
    }));

    // Calculate percentage based on completed phases
    const completedPhases = updatedPhases.filter(p => p.completed && p.id !== 'analyzing');
    const totalPhases = PHASE_DEFINITIONS.length - 1; // Exclude 'analyzing' from calculation
    const phasePercentage = Math.round((completedPhases.length / totalPhases) * 100);

    // Token-based progress as fallback (smoother for phases without triggers)
    const tokenPercentage = Math.min(Math.round((tokenCount / 2000) * 100), 99);

    // Use higher of phase or token percentage for smoother UX
    const percentage = Math.max(phasePercentage, tokenPercentage);

    // Find current phase (first non-completed phase)
    const currentPhaseIndex = updatedPhases.findIndex(p => !p.completed);
    const currentPhase = currentPhaseIndex >= 0
      ? updatedPhases[currentPhaseIndex].id
      : 'complete';

    // Check if generation complete (schema ended)
    const isComplete = content.includes('{% endschema %}');

    setProgress({
      phases: updatedPhases,
      currentPhase,
      percentage: isComplete ? 100 : percentage,
      tokenCount,
      estimatedTotal: 2000,
      isComplete,
    });
  }, []);

  /**
   * Reset progress state for new generation
   */
  const reset = useCallback(() => {
    contentBufferRef.current = '';
    setProgress(initialProgress);
  }, []);

  /**
   * Get content accumulated so far
   */
  const getContent = useCallback(() => contentBufferRef.current, []);

  return {
    progress,
    processToken,
    reset,
    getContent,
  };
}

export type { StreamingProgress as StreamingProgressState };
