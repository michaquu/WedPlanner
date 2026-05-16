import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import type { Note } from '../types'

interface NotesListProps {
  notes?: Note[]
  onRemove: (noteId: string) => void
}

const NotesList = ({ notes = [], onRemove }: NotesListProps) => {
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
            <IconButton size="small" onClick={() => onRemove(note.id)}>
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
          {note.type === 'image' ? (
            <Box
              component="img"
              src={note.content}
              alt="Notatka"
              sx={{
                width: '100%',
                maxHeight: 180,
                objectFit: 'cover',
                borderRadius: 2,
                marginTop: 1,
              }}
            />
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
              }}
            >
              {note.content}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ marginTop: 1 }}>
              {note.content}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  )
}

export default NotesList
