import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  IconButton,
} from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import type { Item, ItemStatus, NoteType } from '../types'
import NotesList from './NotesList'

interface ItemDetailsViewProps {
  item: Item
  onBack: () => void
  onUpdate: (changes: Partial<Item>) => void
  onAddNote: (note: { type: NoteType; content: string }) => void
  onRemoveNote: (noteId: string) => void
}

const statusOptions: ItemStatus[] = [
  'Do zrobienia',
  'W trakcie',
  'Zrobione',
]

const noteTypes: NoteType[] = ['text', 'link', 'image']

const ItemDetailsView = ({
  item,
  onBack,
  onUpdate,
  onAddNote,
  onRemoveNote,
}: ItemDetailsViewProps) => {
  const [noteType, setNoteType] = useState<NoteType>('text')
  const [noteText, setNoteText] = useState('')
  const [noteImage, setNoteImage] = useState('')

  const canAdd = useMemo(() => {
    if (noteType === 'image') return Boolean(noteImage)
    return noteText.trim().length > 0
  }, [noteImage, noteText, noteType])

  const handleAddNote = () => {
    if (!canAdd) return
    const content = noteType === 'image' ? noteImage : noteText.trim()
    onAddNote({ type: noteType, content })
    setNoteText('')
    setNoteImage('')
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result?.toString() ?? ''
      setNoteImage(result)
    }
    reader.readAsDataURL(file)
  }

  return (
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
              Edytuj status, termin, koszt i notatki.
            </Typography>
          </Box>
        </Stack>

        <TextField
          label="Tytul"
          value={item.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={item.status}
            onChange={(event) =>
              onUpdate({ status: event.target.value as ItemStatus })
            }
          >
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Termin"
          type="date"
          value={item.dueDate ?? ''}
          onChange={(event) => onUpdate({ dueDate: event.target.value })}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Koszt"
          type="number"
          value={item.cost ?? ''}
          onChange={(event) =>
            onUpdate({
              cost: event.target.value
                ? Number(event.target.value)
                : undefined,
            })
          }
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">zl</InputAdornment>
              ),
            },
          }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={item.checked}
              onChange={(event) => onUpdate({ checked: event.target.checked })}
            />
          }
          label="Odhaczone"
        />

        <Divider />

        <Box>
          <Typography variant="h6" sx={{ marginBottom: 1 }}>
            Notatki
          </Typography>
          <NotesList notes={item.notes} onRemove={onRemoveNote} />
        </Box>

        <Divider />

        <Stack spacing={1.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Dodaj notatke
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Typ</InputLabel>
            <Select
              label="Typ"
              value={noteType}
              onChange={(event) => {
                setNoteType(event.target.value as NoteType)
                setNoteText('')
                setNoteImage('')
              }}
            >
              {noteTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {noteType === 'image' ? (
            <Button variant="outlined" component="label">
              Wybierz zdjecie
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
          ) : (
            <TextField
              label={noteType === 'link' ? 'Link' : 'Tekst'}
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              fullWidth
              multiline={noteType === 'text'}
              rows={noteType === 'text' ? 3 : 1}
            />
          )}

          <Button variant="contained" onClick={handleAddNote} disabled={!canAdd}>
            Dodaj
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

export default ItemDetailsView
