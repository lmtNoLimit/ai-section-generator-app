interface DeleteConfirmModalProps {
  id: string;
  isBulk: boolean;
  count: number;
  isDeleting: boolean;
  onConfirm: () => void;
}

/**
 * Confirmation modal for delete actions using Shopify s-modal component.
 * Uses declarative commandFor pattern - trigger with a button that has commandFor={id}
 */
export function DeleteConfirmModal({
  id,
  isBulk,
  count,
  isDeleting,
  onConfirm,
}: DeleteConfirmModalProps) {
  const title = isBulk
    ? `Delete ${count} section${count > 1 ? "s" : ""}?`
    : "Delete this section?";

  const message = isBulk
    ? `Are you sure you want to delete ${count} selected section${count > 1 ? "s" : ""}? This action cannot be undone.`
    : "Are you sure you want to delete this section? This action cannot be undone.";

  return (
    <s-modal id={id} heading={title} size="small">
      <s-stack gap="base" direction="block">
        <s-paragraph>{message}</s-paragraph>
      </s-stack>
      <s-button
        slot="secondary-actions"
        command="--hide"
        commandFor={id}
        disabled={isDeleting}
      >
        Cancel
      </s-button>
      <s-button
        slot="primary-action"
        variant="primary"
        tone="critical"
        commandFor={id}
        command="--hide"
        onClick={onConfirm}
        loading={isDeleting}
        disabled={isDeleting}
      >
        Delete
      </s-button>
    </s-modal>
  );
}
