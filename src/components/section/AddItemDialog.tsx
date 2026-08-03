import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'

interface AddItemDialogProps {
  open: boolean
  title: string
  onTitleChange: (title: string) => void
  onClose: () => void
  onAdd: () => void
}

const AddItemDialog = ({ open, title, onTitleChange, onClose, onAdd }: AddItemDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth>
    <DialogTitle>Nowe zadanie</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Nazwa zadania"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onAdd()
        }}
        fullWidth
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Anuluj</Button>
      <Button variant="contained" onClick={onAdd} disabled={!title.trim()}>
        Dodaj
      </Button>
    </DialogActions>
  </Dialog>
)

export default AddItemDialog

