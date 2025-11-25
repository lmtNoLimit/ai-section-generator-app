/**
 * Barrel export file for all UI components
 * Provides centralized imports for shared and feature-specific components
 */

// Shared components
export { Button } from './shared/Button';
export { Card } from './shared/Card';
export { Banner, SuccessBanner, ErrorBanner } from './shared/Banner';

// Generate feature components
export { PromptInput } from './generate/PromptInput';
export { ThemeSelector } from './generate/ThemeSelector';
export { CodePreview } from './generate/CodePreview';
export { SectionNameInput } from './generate/SectionNameInput';
export { GenerateActions } from './generate/GenerateActions';

// Types
export type { ButtonProps } from './shared/Button';
export type { CardProps } from './shared/Card';
export type { BannerProps } from './shared/Banner';
export type { PromptInputProps } from './generate/PromptInput';
export type { ThemeSelectorProps } from './generate/ThemeSelector';
export type { CodePreviewProps } from './generate/CodePreview';
export type { SectionNameInputProps } from './generate/SectionNameInput';
export type { GenerateActionsProps } from './generate/GenerateActions';
