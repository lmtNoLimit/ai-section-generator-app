/**
 * Editor components barrel export
 * Provides unified editor layout and related components
 */

// Main layout component
export { PolarisEditorLayout } from './PolarisEditorLayout';

// Sub-components
export { ChatPanelWrapper } from './ChatPanelWrapper';
export { CodePreviewPanel } from './CodePreviewPanel';
export { CodeDiffView } from './CodeDiffView';
export { EditorSettingsPanel } from './EditorSettingsPanel';
export { PreviewSettingsPanel } from './PreviewSettingsPanel';
export { PublishModal, PUBLISH_MODAL_ID } from './PublishModal';
export { SchemaValidation } from './SchemaValidation';
export { FeedbackWidget } from './FeedbackWidget';

// Hooks
export { useEditorState } from './hooks/useEditorState';
export { useCodeDiff } from './hooks/useCodeDiff';

// Diff utilities
export { calculateDiff } from './diff/diff-engine';
export type { DiffResult, DiffLine, DiffHunk, DiffStats } from './diff/diff-types';

// Validation utilities
export { validateSchema, type SchemaValidationResult } from './validation/schema-validator';
export type { ValidationRule, ValidationResult, ParsedSchema } from './validation/validation-rules';
