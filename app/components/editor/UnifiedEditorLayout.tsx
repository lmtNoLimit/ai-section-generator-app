import { useState, useEffect } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import { usePanelLayout } from './hooks/usePanelLayout';
import { EditorStyles } from './EditorStyles';
import { MobileLayout } from './MobileLayout';

interface UnifiedEditorLayoutProps {
  chatPanel: React.ReactNode;
  codePreviewPanel: React.ReactNode;
  settingsPanel: React.ReactNode;
}

/**
 * 3-panel resizable layout for the unified editor
 * Chat (left) | Code/Preview (center) | Settings (right)
 */
const MOBILE_BREAKPOINT = 768;

export function UnifiedEditorLayout({
  chatPanel,
  codePreviewPanel,
  settingsPanel,
}: UnifiedEditorLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const {
    chatPanelRef,
    settingsPanelRef,
    getSavedSizes,
    saveSizes,
  } = usePanelLayout();

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const defaultSizes = getSavedSizes();

  // Use mobile layout on small screens
  if (isMobile) {
    return (
      <>
        <EditorStyles />
        <MobileLayout
          chatPanel={chatPanel}
          codePreviewPanel={codePreviewPanel}
          settingsPanel={settingsPanel}
        />
      </>
    );
  }

  return (
    <div className="unified-editor">
      <EditorStyles />
      <PanelGroup
        direction="horizontal"
        onLayout={saveSizes}
        autoSaveId="ai-section-editor"
      >
        {/* Chat Panel */}
        <Panel
          ref={chatPanelRef}
          defaultSize={defaultSizes.chat}
          minSize={15}
          maxSize={50}
          collapsible
          collapsedSize={0}
        >
          <div className="editor-panel editor-panel--chat">
            {chatPanel}
          </div>
        </Panel>

        <PanelResizeHandle className="editor-resize-handle" />

        {/* Code/Preview Panel */}
        <Panel
          defaultSize={defaultSizes.codePreview}
          minSize={30}
        >
          <div className="editor-panel editor-panel--main">
            {codePreviewPanel}
          </div>
        </Panel>

        <PanelResizeHandle className="editor-resize-handle" />

        {/* Settings Panel */}
        <Panel
          ref={settingsPanelRef}
          defaultSize={defaultSizes.settings}
          minSize={15}
          maxSize={40}
          collapsible
          collapsedSize={0}
        >
          <div className="editor-panel editor-panel--settings">
            {settingsPanel}
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
