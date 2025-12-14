/**
 * Editor components barrel export
 * Provides unified editor layout and related components
 */

// Main layout components
export { UnifiedEditorLayout } from './UnifiedEditorLayout';
export { MobileLayout } from './MobileLayout';

// Sub-components
export { EditorHeader } from './EditorHeader';
export { ChatPanelWrapper } from './ChatPanelWrapper';
export { CodePreviewPanel } from './CodePreviewPanel';
export { EditorSettingsPanel } from './EditorSettingsPanel';
export { EditorStyles } from './EditorStyles';

// Hooks
export { useEditorState } from './hooks/useEditorState';
export { usePanelLayout } from './hooks/usePanelLayout';
export type { PanelSizes } from './hooks/usePanelLayout';
