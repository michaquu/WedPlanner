import { useMemo, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { v4 as uuid } from 'uuid'
import type { Note, NoteType } from '../../types'

const NOTE_TYPES: NoteType[] = ['text', 'link', 'image', 'file']

interface Attachment {
  content: string
  fileName: string
  mimeType: string
  size: number
}

interface NoteComposerProps {
  onAdd: (note: Note) => void
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result?.toString() ?? '')
    reader.onerror = () => reject(new Error('Nie udalo sie odczytac pliku.'))
    reader.readAsDataURL(file)
  })

const NoteComposer = ({ onAdd }: NoteComposerProps) => {
  const [type, setType] = useState<NoteType>('text')
  const [text, setText] = useState('')
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [fileError, setFileError] = useState(false)
  const canAdd = useMemo(
    () => (type === 'image' || type === 'file' ? Boolean(attachment) : Boolean(text.trim())),
    [attachment, text, type],
  )

  const resetContent = () => {
    setText('')
    setAttachment(null)
    setFileError(false)
  }

  const handleTypeChange = (nextType: NoteType) => {
    setType(nextType)
    resetContent()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileError(false)
    try {
      setAttachment({
        content: await readFileAsDataUrl(file),
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      })
    } catch {
      setAttachment(null)
      setFileError(true)
    }
  }

  const handleAdd = () => {
    if (!canAdd) return
    const common = { id: uuid(), type, createdAt: new Date().toISOString() }
    if (type === 'image' || type === 'file') {
      if (!attachment) return
      onAdd({ ...common, ...attachment })
    } else {
      onAdd({ ...common, content: text.trim() })
    }
    resetContent()
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Dodaj notatke
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Typ</InputLabel>
        <Select
          label="Typ"
          value={type}
          onChange={(event) => handleTypeChange(event.target.value as NoteType)}
        >
          {NOTE_TYPES.map((noteType) => (
            <MenuItem key={noteType} value={noteType}>
              {noteType}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {type === 'image' || type === 'file' ? (
        <Button variant="outlined" component="label">
          {type === 'image' ? 'Wybierz zdjecie' : 'Wybierz plik'}
          <input
            hidden
            type="file"
            accept={type === 'image' ? 'image/*' : '*/*'}
            onChange={handleFileChange}
          />
        </Button>
      ) : (
        <TextField
          label={type === 'link' ? 'Link' : 'Tekst'}
          value={text}
          onChange={(event) => setText(event.target.value)}
          fullWidth
          multiline={type === 'text'}
          rows={type === 'text' ? 3 : 1}
        />
      )}
      {attachment && (
        <Typography variant="caption" color="text.secondary">
          Wybrano: {attachment.fileName}
        </Typography>
      )}
      {fileError && <Alert severity="error">Nie udalo sie odczytac pliku.</Alert>}
      <Button variant="contained" onClick={handleAdd} disabled={!canAdd}>
        Dodaj
      </Button>
    </Stack>
  )
}

export default NoteComposer

