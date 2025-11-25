import { Button } from '../shared/Button';

export interface GenerateActionsProps {
  onGenerate: () => void;
  onSave: () => void;
  isGenerating: boolean;
  isSaving: boolean;
  canSave: boolean;
  generateButtonText?: string;
  saveButtonText?: string;
}

/**
 * Action buttons for generate and save operations
 * Handles loading states and conditional save button visibility
 */
export function GenerateActions({
  onGenerate,
  onSave,
  isGenerating,
  isSaving,
  canSave,
  generateButtonText = 'Generate Code',
  saveButtonText = 'Save to Theme'
}: GenerateActionsProps) {
  return (
    <>
      <Button
        variant="primary"
        loading={isGenerating}
        disabled={isGenerating || isSaving}
        onClick={onGenerate}
      >
        {generateButtonText}
      </Button>

      {canSave && (
        <Button
          loading={isSaving}
          disabled={isSaving || isGenerating}
          onClick={onSave}
        >
          {saveButtonText}
        </Button>
      )}
    </>
  );
}
