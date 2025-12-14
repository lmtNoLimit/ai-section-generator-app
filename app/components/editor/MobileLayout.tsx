/**
 * Mobile layout component - Tab-based panel navigation for small screens
 * Replaces 3-panel resizable layout with single-panel tab navigation
 */
import { useState } from 'react';

type MobilePanel = 'chat' | 'editor' | 'settings';

interface MobileLayoutProps {
  chatPanel: React.ReactNode;
  codePreviewPanel: React.ReactNode;
  settingsPanel: React.ReactNode;
}

export function MobileLayout({
  chatPanel,
  codePreviewPanel,
  settingsPanel,
}: MobileLayoutProps) {
  const [activePanel, setActivePanel] = useState<MobilePanel>('editor');

  return (
    <div className="mobile-editor">
      {/* Tab bar */}
      <div className="mobile-editor__tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activePanel === 'chat'}
          onClick={() => setActivePanel('chat')}
          className={`mobile-editor__tab ${activePanel === 'chat' ? 'mobile-editor__tab--active' : ''}`}
        >
          Chat
        </button>
        <button
          role="tab"
          aria-selected={activePanel === 'editor'}
          onClick={() => setActivePanel('editor')}
          className={`mobile-editor__tab ${activePanel === 'editor' ? 'mobile-editor__tab--active' : ''}`}
        >
          Editor
        </button>
        <button
          role="tab"
          aria-selected={activePanel === 'settings'}
          onClick={() => setActivePanel('settings')}
          className={`mobile-editor__tab ${activePanel === 'settings' ? 'mobile-editor__tab--active' : ''}`}
        >
          Settings
        </button>
      </div>

      {/* Panel content */}
      <div className="mobile-editor__content" role="tabpanel">
        {activePanel === 'chat' && chatPanel}
        {activePanel === 'editor' && codePreviewPanel}
        {activePanel === 'settings' && settingsPanel}
      </div>
    </div>
  );
}
