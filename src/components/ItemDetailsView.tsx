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
import { v4 as uuid } from 'uuid'
import type { Item, ItemStatus, Note, NoteType } from '../types'
import NotesList from './NotesList'

interface ItemDetailsViewProps {
  item: Item
  onBack: () => void
  onUpdate: (changes: Partial<Item>) => void
  onAddNote: (note: Note) => void
  onRemoveNote: (noteId: string) => void
}

const statusOptions: ItemStatus[] = [
  'Do zrobienia',
  'W trakcie',
  'Zrobione',
]

const noteTypes: NoteType[] = ['text', 'link', 'image', 'file']

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result?.toString() ?? '')
    reader.onerror = () => reject(new Error('Nie udalo sie odczytac pliku.'))
    reader.readAsDataURL(file)
  })

const ItemDetailsView = ({
  item,
  onBack,
  onUpdate,
  onAddNote,
  onRemoveNote,
}: ItemDetailsViewProps) => {
  const [noteType, setNoteType] = useState<NoteType>('text')
  const [noteText, setNoteText] = useState('')
  const [noteAttachment, setNoteAttachment] = useState<{
    content: string
    fileName: string
    mimeType: string
    size: number
  } | null>(null)

  const canAdd = useMemo(() => {
    if (noteType === 'image' || noteType === 'file') return Boolean(noteAttachment)
    return noteText.trim().length > 0
  }, [noteAttachment, noteText, noteType])

  const handleAddNote = () => {
    if (!canAdd) return
    if (noteType === 'image' || noteType === 'file') {
      if (!noteAttachment) return
      onAddNote({
        id: uuid(),
        type: noteType,
        content: noteAttachment.content,
        createdAt: new Date().toISOString(),
        fileName: noteAttachment.fileName,
        mimeType: noteAttachment.mimeType,
        size: noteAttachment.size,
      })
    } else {
      onAddNote({
        id: uuid(),
        type: noteType,
        content: noteText.trim(),
        createdAt: new Date().toISOString(),
      })
    }
    setNoteText('')
    setNoteAttachment(null)
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const content = await readFileAsDataUrl(file)
    setNoteAttachment({
      content,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    })
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
                setNoteAttachment(null)
              }}
            >
              {noteTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {noteType === 'image' || noteType === 'file' ? (
            <Button variant="outlined" component="label">
              {noteType === 'image' ? 'Wybierz zdjecie' : 'Wybierz plik'}
              <input
                hidden
                type="file"
                accept={noteType === 'image' ? 'image/*' : '*/*'}
                onChange={handleFileChange}
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

          {noteAttachment && (noteType === 'image' || noteType === 'file') && (
            <Typography variant="caption" color="text.secondary">
              Wybrano: {noteAttachment.fileName}
            </Typography>
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
