import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'

interface AddSectionDialogProps {
  open: boolean
  title: string
  onTitleChange: (title: string) => void
  onClose: () => void
  onAdd: () => void
}

const AddSectionDialog = ({
  open,
  title,
  onTitleChange,
  onClose,
  onAdd,
}: AddSectionDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth>
    <DialogTitle>Nowa sekcja</DialogTitle>
    <DialogContent>
      <TextField
        autoFocus
        margin="dense"
        label="Nazwa sekcji"
        fullWidth
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onAdd()
        }}
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

export default AddSectionDialog

