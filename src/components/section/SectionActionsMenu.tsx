import { Box, Menu, MenuItem } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'

interface SectionActionsMenuProps {
  anchor: HTMLElement | null
  onClose: () => void
  onAddItem: () => void
  onDelete: () => void
  onHide: () => void
}

const SectionActionsMenu = ({
  anchor,
  onClose,
  onAddItem,
  onDelete,
  onHide,
}: SectionActionsMenuProps) => {
  const runAndClose = (action: () => void) => {
    action()
    onClose()
  }
  return (
    <Menu
      anchorEl={anchor}
      open={Boolean(anchor)}
      onClose={onClose}
      onClick={(event) => event.stopPropagation()}
    >
      <MenuItem onClick={() => runAndClose(onAddItem)}>
        <AddRoundedIcon fontSize="small" />
        <Box sx={{ marginLeft: 1 }}>Dodaj zadanie</Box>
      </MenuItem>
      <MenuItem onClick={() => runAndClose(onDelete)}>
        <DeleteOutlineOutlinedIcon fontSize="small" />
        <Box sx={{ marginLeft: 1 }}>Usun sekcje</Box>
      </MenuItem>
      <MenuItem onClick={() => runAndClose(onHide)}>
        <VisibilityOffOutlinedIcon fontSize="small" />
        <Box sx={{ marginLeft: 1 }}>Ukryj sekcje</Box>
      </MenuItem>
    </Menu>
  )
}

export default SectionActionsMenu

