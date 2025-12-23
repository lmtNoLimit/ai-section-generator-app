/**
 * PolarisEditorLayout - 3-column editor layout using Polaris Web Components
 * Replaces react-resizable-panels with native Polaris grid layout
 *
 * Layout: Chat (350px) | Preview/Code (1fr) | Settings (280px)
 * Responsive: Stacks to single column on mobile with tab navigation
 */
import { useState, useEffect, useRef, type ReactNode } from "react";

interface PolarisEditorLayoutProps {
  chatPanel: ReactNode;
  codePreviewPanel: ReactNode;
  settingsPanel: ReactNode;
}

type MobileTab = "chat" | "editor" | "settings";

const MOBILE_BREAKPOINT = 900;

export function PolarisEditorLayout({
  chatPanel,
  codePreviewPanel,
  settingsPanel,
}: PolarisEditorLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<MobileTab>("editor");
  const [containerHeight, setContainerHeight] = useState("calc(100vh - 140px)");
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate remaining height dynamically
  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const remainingHeight = window.innerHeight - rect.top - 16; // 16px bottom padding
        setContainerHeight(`${Math.max(remainingHeight, 400)}px`);
      }
    };

    // Initial calculation after render
    const timer = setTimeout(calculateHeight, 100);
    window.addEventListener("resize", calculateHeight);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateHeight);
    };
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Panel styles with card-like appearance
  const panelStyle = {
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 0,
    overflow: "hidden",
    background: "var(--p-color-bg-surface)",
    borderRadius: "12px",
    boxShadow: "var(--p-shadow-card)",
  };

  // Mobile layout with tab navigation
  if (isMobile) {
    return (
      <div
        ref={containerRef}
        style={{
          display: "flex",
          flexDirection: "column",
          height: containerHeight,
        }}
      >
        {/* Mobile tab navigation */}
        <div style={{ flexShrink: 0 }}>
          <s-box
            padding="base"
            background="base"
            borderWidth="none none small none"
            borderColor="subdued"
          >
            <s-button-group gap="none" accessibilityLabel="Editor panels">
              <s-button
                slot="secondary-actions"
                variant={activeTab === "chat" ? "primary" : "secondary"}
                onClick={() => setActiveTab("chat")}
              >
                Chat
              </s-button>
              <s-button
                slot="secondary-actions"
                variant={activeTab === "editor" ? "primary" : "secondary"}
                onClick={() => setActiveTab("editor")}
              >
                Editor
              </s-button>
              <s-button
                slot="secondary-actions"
                variant={activeTab === "settings" ? "primary" : "secondary"}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </s-button>
            </s-button-group>
          </s-box>
        </div>

        {/* Active panel content */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {activeTab === "chat" && (
            <div style={{ ...panelStyle, flex: 1 }}>{chatPanel}</div>
          )}
          {activeTab === "editor" && (
            <div style={{ ...panelStyle, flex: 1 }}>{codePreviewPanel}</div>
          )}
          {activeTab === "settings" && (
            <div style={{ ...panelStyle, flex: 1, overflow: "auto", padding: "16px" }}>
              {settingsPanel}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop 3-column layout
  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: containerHeight,
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          gap: "16px",
        }}
      >
        {/* Chat Panel */}
        <div style={{ ...panelStyle, width: "350px", flexShrink: 0 }}>
          {chatPanel}
        </div>

        {/* Code/Preview Panel */}
        <div style={{ ...panelStyle, flex: 1, minWidth: 0 }}>
          {codePreviewPanel}
        </div>

        {/* Settings Panel */}
        <div style={{ ...panelStyle, width: "280px", flexShrink: 0, overflow: "auto", padding: "16px" }}>
          {settingsPanel}
        </div>
      </div>
    </div>
  );
}
