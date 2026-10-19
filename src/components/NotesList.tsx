import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import type { Note } from '../types'
import { formatFileSize } from '../utils/formatters'

interface NotesListProps {
  notes?: Note[]
  onRemove: (noteId: string) => void
  onUpdate: (noteId: string, changes: Partial<Note>) => void
}

const NotesList = ({ notes = [], onRemove, onUpdate }: NotesListProps) => {
  const [previewImage, setPreviewImage] = useState<Note | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editReminderAt, setEditReminderAt] = useState('')

  const formatReminder = (value?: string) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const toDateTimeLocal = (value?: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
  }

  const openEditor = (note: Note) => {
    setEditingNote(note)
    setEditContent(note.type === 'text' || note.type === 'link' ? note.content : '')
    setEditReminderAt(toDateTimeLocal(note.reminderAt))
  }

  const saveEditor = () => {
    if (!editingNote) return
    const changes: Partial<Note> = {
      reminderAt: editReminderAt ? new Date(editReminderAt).toISOString() : undefined,
    }
    if (editingNote.type === 'text' || editingNote.type === 'link') {
      const content = editContent.trim()
      if (!content) return
      changes.content = content
    }
    onUpdate(editingNote.id, changes)
    setEditingNote(null)
  }

  if (!notes.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Brak notatek.
      </Typography>
    )
  }

  return (
    <Stack spacing={1.5}>
      {notes.map((note) => (
        <Box
          key={note.id}
          id={`note-${note.id}`}
          sx={{
            borderRadius: 2,
            border: '1px solid rgba(47, 39, 36, 0.08)',
            background: 'rgba(255,255,255,0.75)',
            padding: 1.5,
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip label={note.type} size="small" />
            <Box sx={{ flex: 1 }} />
            {(note.type === 'image' || note.type === 'file') && (
              <IconButton
                size="small"
                component="a"
                href={note.content}
                download={note.fileName}
                aria-label="Pobierz"
                sx={{ padding: 0.25 }}
              >
                <DownloadRoundedIcon fontSize="small" />
              </IconButton>
            )}
            {(note.type === 'text' || note.type === 'link') && (
              <IconButton
                size="small"
                onClick={() => openEditor(note)}
                aria-label="Edytuj notatke"
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={() => onRemove(note.id)}>
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>

          {note.type === 'image' ? (
            <Box sx={{ marginTop: 1 }}>
              <Box
                component="img"
                src={note.content}
                alt={note.fileName ?? 'Zdjecie'}
                onClick={() => setPreviewImage(note)}
                sx={{
                  width: '100%',
                  maxHeight: 220,
                  objectFit: 'cover',
                  borderRadius: 2,
                  cursor: 'zoom-in',
                }}
              />
            </Box>
          ) : note.type === 'file' ? (
            <Stack spacing={1} sx={{ marginTop: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {note.fileName ?? 'Zalacznik'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {[note.mimeType, formatFileSize(note.size)].filter(Boolean).join(' · ')}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component="a"
                href={note.content}
                download={note.fileName}
                startIcon={<DownloadRoundedIcon fontSize="small" />}
                sx={{ width: 'fit-content' }}
              >
                Pobierz plik
              </Button>
            </Stack>
          ) : note.type === 'link' ? (
            <Typography
              component="a"
              href={note.content}
              target="_blank"
              rel="noreferrer"
              sx={{
                display: 'block',
                marginTop: 1,
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {note.content}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ marginTop: 1 }}>
              {note.content}
            </Typography>
          )}
          {note.type !== 'text' && note.description && (
            <Typography variant="body2" color="text.secondary" sx={{ marginTop: 1 }}>
              {note.description}
            </Typography>
          )}
          {formatReminder(note.reminderAt) && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', marginTop: 1 }}>
              Przypomnienie: {formatReminder(note.reminderAt)}
            </Typography>
          )}
        </Box>
      ))}

      <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} maxWidth="lg">
        <DialogContent sx={{ padding: 1 }}>
          {previewImage && (
            <Box
              component="img"
              src={previewImage.content}
              alt={previewImage.fileName ?? 'Zdjecie'}
              sx={{ display: 'block', maxWidth: 'min(90vw, 1000px)', maxHeight: '85vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingNote)} onClose={() => setEditingNote(null)} fullWidth>
        <DialogTitle>Edytuj notatke</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ paddingTop: 1 }}>
            {editingNote && (editingNote.type === 'text' || editingNote.type === 'link') && (
              <TextField
                label={editingNote.type === 'link' ? 'Link' : 'Tekst'}
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                multiline={editingNote.type === 'text'}
                rows={editingNote.type === 'text' ? 4 : 1}
                fullWidth
              />
            )}
            <TextField
              label="Przypomnij (opcjonalnie)"
              type="datetime-local"
              value={editReminderAt}
              onChange={(event) => setEditReminderAt(event.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingNote(null)}>Anuluj</Button>
          <Button variant="contained" onClick={saveEditor}>Zapisz</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default NotesList
