/**
 * Barrel export file for all UI components
 * Provides centralized imports for shared and feature-specific components
 */

// Shared components
export { Button } from './shared/Button';
export { Card } from './shared/Card';
export { Banner, SuccessBanner, ErrorBanner } from './shared/Banner';

// Generate feature components - Layout
export { GenerateLayout } from './generate/GenerateLayout';
export { GenerateInputColumn } from './generate/GenerateInputColumn';
export { GeneratePreviewColumn } from './generate/GeneratePreviewColumn';

// Generate feature components - Individual
export { PromptInput } from './generate/PromptInput';
export { ThemeSelector } from './generate/ThemeSelector';
export { CodePreview } from './generate/CodePreview';
export { SectionNameInput } from './generate/SectionNameInput';
export { GenerateActions } from './generate/GenerateActions';
export { TemplateSuggestions } from './generate/TemplateSuggestions';
export { PromptExamples } from './generate/PromptExamples';
export { AdvancedOptions } from './generate/AdvancedOptions';
export { LoadingState } from './generate/LoadingState';
export { EmptyState } from './generate/EmptyState';

// Types
export type { ButtonProps } from './shared/Button';
export type { CardProps } from './shared/Card';
export type { BannerProps } from './shared/Banner';
export type { GenerateLayoutProps } from './generate/GenerateLayout';
export type { GenerateInputColumnProps } from './generate/GenerateInputColumn';
export type { GeneratePreviewColumnProps } from './generate/GeneratePreviewColumn';
export type { PromptInputProps } from './generate/PromptInput';
export type { ThemeSelectorProps } from './generate/ThemeSelector';
export type { CodePreviewProps } from './generate/CodePreview';
export type { SectionNameInputProps } from './generate/SectionNameInput';
export type { GenerateActionsProps } from './generate/GenerateActions';
export type { TemplateSuggestionsProps } from './generate/TemplateSuggestions';
export type { PromptExamplesProps } from './generate/PromptExamples';
export type { AdvancedOptionsProps, AdvancedOptionsState } from './generate/AdvancedOptions';
export type { LoadingStateProps } from './generate/LoadingState';
export type { EmptyStateProps } from './generate/EmptyState';
