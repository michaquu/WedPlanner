import { Box, Divider, IconButton, Stack, Typography } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import type { Item, Note } from '../types'
import { SwipeBack } from '../utils/components/SwipeBack'
import ItemFields from './item-details/ItemFields'
import NoteComposer from './item-details/NoteComposer'
import NotesList from './NotesList'

interface ItemDetailsViewProps {
  item: Item
  onBack: () => void
  onUpdate: (changes: Partial<Item>) => void
  onAddNote: (note: Note) => void
  onRemoveNote: (noteId: string) => void
}

const ItemDetailsView = ({
  item,
  onBack,
  onUpdate,
  onAddNote,
  onRemoveNote,
}: ItemDetailsViewProps) => (
  <SwipeBack action={onBack}>
    <Box className="details-view">
      <Stack spacing={2.5}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <IconButton onClick={onBack} size="small" aria-label="Wroc">
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Szczegoly zadania
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Edytuj status, termin, koszt, płatność i notatki.
            </Typography>
          </Box>
        </Stack>
        <ItemFields item={item} onUpdate={onUpdate} />
        <Divider />
        <Box>
          <Typography variant="h6" sx={{ marginBottom: 1 }}>
            Notatki
          </Typography>
          <NotesList notes={item.notes} onRemove={onRemoveNote} />
        </Box>
        <Divider />
        <NoteComposer onAdd={onAddNote} />
      </Stack>
    </Box>
  </SwipeBack>
)

export default ItemDetailsView
