import { useState, useRef, useEffect } from 'react';
import type { CodeSource } from './hooks/useEditorState';

interface EditorHeaderProps {
  sectionName: string;
  onNameChange: (name: string) => void;
  isDirty: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  isSavingDraft: boolean;
  isPublishing: boolean;
  canPublish: boolean;
  themeName: string;
  canRevert?: boolean;
  onRevert?: () => void;
  lastCodeSource?: CodeSource;
}

/**
 * Editor header with section name, dirty indicator, and save actions
 */
export function EditorHeader({
  sectionName,
  onNameChange,
  isDirty,
  onSaveDraft,
  onPublish,
  isSavingDraft,
  isPublishing,
  canPublish,
  themeName,
  canRevert,
  onRevert,
  lastCodeSource,
}: EditorHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(sectionName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode (more accessible than autoFocus)
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const handleNameSubmit = () => {
    if (editedName.trim()) {
      onNameChange(editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditedName(sectionName);
      setIsEditingName(false);
    }
  };

  const isAnyLoading = isSavingDraft || isPublishing;

  return (
    <header className="editor-header">
      <div className="editor-header__left">
        {/* Back button */}
        <a href="/app/sections" className="editor-header__back">
          <span aria-hidden="true">←</span>
          <span className="sr-only">Back to sections</span>
        </a>

        {/* Section name */}
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            className="editor-header__name-input"
            aria-label="Section name"
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            className="editor-header__name"
          >
            {sectionName}
            {isDirty && <span className="editor-header__dirty">*</span>}
          </button>
        )}

        {/* AI updated badge */}
        {lastCodeSource === 'chat' && (
          <span className="editor-header__badge">AI updated</span>
        )}
      </div>

      <div className="editor-header__right">
        {/* Revert button */}
        {canRevert && onRevert && (
          <s-button
            variant="tertiary"
            onClick={onRevert}
            disabled={isAnyLoading || undefined}
          >
            Revert
          </s-button>
        )}

        {/* Save Draft */}
        <s-button
          variant="secondary"
          onClick={onSaveDraft}
          loading={isSavingDraft || undefined}
          disabled={isAnyLoading || undefined}
        >
          Save Draft
        </s-button>

        {/* Publish to Theme */}
        <s-button
          variant="primary"
          onClick={onPublish}
          loading={isPublishing || undefined}
          disabled={!canPublish || isAnyLoading || undefined}
        >
          Publish to {themeName}
        </s-button>
      </div>
    </header>
  );
}
