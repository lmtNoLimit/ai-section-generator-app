export interface ServiceModeIndicatorProps {
  themeMode: 'mock' | 'real';
  aiMode: 'mock' | 'real';
  showIndicator: boolean;
}

export function ServiceModeIndicator({ themeMode, aiMode, showIndicator }: ServiceModeIndicatorProps) {
  // Don't render in production or when flag disabled
  if (!showIndicator || !themeMode || !aiMode) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: '#f0f0f0',
      padding: '10px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999,
      border: '1px solid #ccc'
    }}>
      <div><strong>Service Mode</strong></div>
      <div>Theme: <span style={{ color: themeMode === 'mock' ? 'orange' : 'green' }}>
        {themeMode.toUpperCase()}
      </span></div>
      <div>AI: <span style={{ color: aiMode === 'mock' ? 'orange' : 'green' }}>
        {aiMode.toUpperCase()}
      </span></div>
    </div>
  );
}
