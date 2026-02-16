/**
 * ConfirmDialog — reusable confirmation modal (US-012).
 *
 * Shows a blocking dialog asking the user to confirm a destructive action.
 * Pressing Cancel closes the dialog without executing the action.
 * Pressing Confirm executes the action and closes the dialog.
 *
 * Usage:
 *   const [pendingId, setPendingId] = useState<string | null>(null);
 *
 *   <button onClick={() => setPendingId(item.id)}>Delete</button>
 *
 *   {pendingId !== null && (
 *     <ConfirmDialog
 *       title="Delete item?"
 *       description="This cannot be undone."
 *       onConfirm={() => { doDelete(pendingId); setPendingId(null); }}
 *       onCancel={() => setPendingId(null)}
 *     />
 *   )}
 */

import { Button } from "@/shared/components/ui/button";

interface ConfirmDialogProps {
  /** Dialog heading shown in bold. */
  title: string;
  /** Explanatory text shown below the heading. */
  description: string;
  /** Label for the confirm button (default "Delete"). */
  confirmLabel?: string;
  /** Called when the user presses the confirm button. */
  onConfirm: () => void;
  /** Called when the user presses the cancel button or the backdrop. */
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      data-testid="confirm-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop — clicking it cancels */}
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden="true"
        onClick={onCancel}
      />

      {/* Modal panel */}
      <div className="relative z-10 bg-background border rounded-lg shadow-lg p-6 w-full max-w-sm mx-4 space-y-4">
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold"
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            data-testid="confirm-dialog-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            data-testid="confirm-dialog-confirm"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
