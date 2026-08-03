import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

export type DeleteTarget =
  | { type: 'section'; sectionId: string; title?: string }
  | { type: 'item'; sectionId: string; itemId: string; title?: string }

interface DeleteConfirmationDialogProps {
  target: DeleteTarget | null
  onClose: () => void
  onConfirm: () => void
}

const DeleteConfirmationDialog = ({
  target,
  onClose,
  onConfirm,
}: DeleteConfirmationDialogProps) => (
  <Dialog open={Boolean(target)} onClose={onClose}>
    <DialogTitle>Potwierdzenie</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        {target?.type === 'section'
          ? `Usunac sekcje${target.title ? ` "${target.title}"` : ''}?`
          : `Usunac zadanie${target?.title ? ` "${target.title}"` : ''}?`}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Anuluj</Button>
      <Button variant="contained" color="error" onClick={onConfirm}>
        Usun
      </Button>
    </DialogActions>
  </Dialog>
)

export default DeleteConfirmationDialog

