/**
 * EditorStyles component - injects editor styles into the document
 * Uses reference counting to handle multiple instances
 *
 * Polaris-inspired design system for the section editor
 */
import { useEffect } from 'react';

const STYLE_ID = 'editor-component-styles';
let styleRefCount = 0;

const editorCSS = `
/* ========================================
   CSS Custom Properties (Polaris-aligned)
   ======================================== */
:root {
  --editor-bg: #f6f6f7;
  --editor-surface: #ffffff;
  --editor-surface-secondary: #f1f2f4;
  --editor-surface-hover: #f6f6f7;
  --editor-border: #e1e3e5;
  --editor-border-strong: #c9cccf;
  --editor-text: #202223;
  --editor-text-secondary: #6d7175;
  --editor-text-disabled: #8c9196;
  --editor-brand: #008060;
  --editor-brand-hover: #006e52;
  --editor-brand-text: #ffffff;
  --editor-shadow-sm: 0 1px 0 rgba(0, 0, 0, 0.05);
  --editor-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  --editor-shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --editor-radius-sm: 4px;
  --editor-radius: 8px;
  --editor-radius-lg: 12px;
  --editor-space-1: 4px;
  --editor-space-2: 8px;
  --editor-space-3: 12px;
  --editor-space-4: 16px;
  --editor-space-5: 20px;
  --editor-space-6: 24px;
}

/* ========================================
   Unified Editor Layout
   ======================================== */
.unified-editor {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  background: var(--editor-bg);
  padding: var(--editor-space-4);
  gap: var(--editor-space-4);
}

/* Panel Group Container */
.unified-editor > div {
  background: var(--editor-bg);
  border-radius: var(--editor-radius-lg);
  overflow: hidden;
}

/* ========================================
   Editor Panels - Card Style
   ======================================== */
.editor-panel {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--editor-surface);
  border-radius: var(--editor-radius-lg);
  box-shadow: var(--editor-shadow);
  border: 1px solid var(--editor-border);
}

.editor-panel--chat {
  background: var(--editor-surface);
}

.editor-panel--main {
  background: var(--editor-surface);
}

.editor-panel--settings {
  background: var(--editor-surface);
}

/* ========================================
   Resize Handle - Visual Divider
   ======================================== */
.editor-resize-handle {
  width: 12px;
  background: transparent;
  cursor: col-resize;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.editor-resize-handle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 48px;
  background: var(--editor-border);
  border-radius: 2px;
  transition: all 0.15s ease;
}

.editor-resize-handle:hover::before {
  background: var(--editor-brand);
  height: 64px;
  width: 4px;
}

.editor-resize-handle:active::before {
  background: var(--editor-brand);
  width: 6px;
  height: 80px;
}

.editor-resize-handle:focus-visible {
  outline: none;
}

.editor-resize-handle:focus-visible::before {
  background: var(--editor-brand);
  box-shadow: 0 0 0 2px rgba(0, 128, 96, 0.2);
}

/* ========================================
   Chat Panel Wrapper
   ======================================== */
.chat-panel-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ========================================
   Code Preview Panel
   ======================================== */
.code-preview-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--editor-surface);
}

.code-preview-panel__tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--editor-space-3) var(--editor-space-4);
  background: var(--editor-surface);
  border-bottom: 1px solid var(--editor-border);
  flex-shrink: 0;
}

.code-preview-panel__tabs-left {
  display: flex;
  align-items: center;
}

/* Segmented Control Style for Tabs */
.code-preview-panel__tab-group {
  display: inline-flex;
  background: var(--editor-surface-secondary);
  border-radius: var(--editor-radius);
  padding: 2px;
  gap: 2px;
}

.code-preview-panel__tab {
  background: transparent;
  border: none;
  padding: var(--editor-space-2) var(--editor-space-4);
  border-radius: calc(var(--editor-radius) - 2px);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--editor-text-secondary);
  transition: all 0.15s ease;
  min-width: 80px;
}

.code-preview-panel__tab:hover:not(.code-preview-panel__tab--active) {
  color: var(--editor-text);
  background: rgba(0, 0, 0, 0.04);
}

.code-preview-panel__tab--active {
  background: var(--editor-surface);
  color: var(--editor-text);
  box-shadow: var(--editor-shadow-sm), 0 1px 2px rgba(0, 0, 0, 0.05);
}

.code-preview-panel__copy-all {
  background: var(--editor-surface);
  border: 1px solid var(--editor-border);
  border-radius: var(--editor-radius);
  padding: var(--editor-space-2) var(--editor-space-3);
  font-size: 13px;
  font-weight: 500;
  color: var(--editor-text);
  cursor: pointer;
  transition: all 0.15s ease;
}

.code-preview-panel__copy-all:hover {
  background: var(--editor-surface-secondary);
  border-color: var(--editor-border-strong);
}

.code-preview-panel__content {
  flex: 1;
  overflow: auto;
  padding: var(--editor-space-4);
  background: var(--editor-surface-secondary);
}

/* ========================================
   Settings Panel
   ======================================== */
.settings-panel {
  padding: var(--editor-space-4);
  overflow-y: auto;
  height: 100%;
}

.settings-panel__title {
  margin: 0 0 var(--editor-space-4);
  font-size: 15px;
  font-weight: 600;
  color: var(--editor-text);
}

.settings-panel__section {
  margin-bottom: var(--editor-space-5);
  padding-bottom: var(--editor-space-4);
  border-bottom: 1px solid var(--editor-border);
}

.settings-panel__section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

/* ========================================
   Screen Reader Only
   ======================================== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ========================================
   Responsive: Tablet
   ======================================== */
@media (max-width: 1024px) {
  .unified-editor {
    height: calc(100vh - 100px);
    padding: var(--editor-space-3);
  }
}

/* ========================================
   Responsive: Mobile - Stack Panels
   ======================================== */
@media (max-width: 768px) {
  .unified-editor {
    display: none;
  }
}

/* ========================================
   Mobile Editor Layout
   ======================================== */
.mobile-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  background: var(--editor-bg);
}

.mobile-editor__tabs {
  display: flex;
  background: var(--editor-surface);
  border-bottom: 1px solid var(--editor-border);
  padding: var(--editor-space-2);
  gap: var(--editor-space-2);
}

.mobile-editor__tab {
  flex: 1;
  padding: var(--editor-space-3);
  background: var(--editor-surface-secondary);
  border: none;
  border-radius: var(--editor-radius);
  font-size: 14px;
  font-weight: 500;
  color: var(--editor-text-secondary);
  cursor: pointer;
  min-height: 44px;
  transition: all 0.15s ease;
}

.mobile-editor__tab--active {
  background: var(--editor-brand);
  color: var(--editor-brand-text);
}

.mobile-editor__content {
  flex: 1;
  overflow: auto;
  background: var(--editor-surface);
}

/* Hide mobile editor on desktop */
@media (min-width: 769px) {
  .mobile-editor {
    display: none;
  }
}

/* ========================================
   Mobile Chat Adjustments
   ======================================== */
@media (max-width: 768px) {
  .chat-input__textarea {
    font-size: 16px;
  }

  .chat-message__content {
    max-width: 90%;
  }

  .chat-code-block__pre {
    max-height: 300px;
  }
}
`;

export function EditorStyles() {
  useEffect(() => {
    // Increment reference count
    styleRefCount++;

    // Only inject if this is the first instance
    if (styleRefCount === 1) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = editorCSS;
      document.head.appendChild(style);
    }

    // Cleanup: only remove when last instance unmounts
    return () => {
      styleRefCount--;
      if (styleRefCount === 0) {
        const existingStyle = document.getElementById(STYLE_ID);
        if (existingStyle) {
          existingStyle.remove();
        }
      }
    };
  }, []);

  return null;
}
