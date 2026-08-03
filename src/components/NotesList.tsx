import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import type { Note } from '../types'

interface NotesListProps {
  notes?: Note[]
  onRemove: (noteId: string) => void
}

const NotesList = ({ notes = [], onRemove }: NotesListProps) => {
  const formatSize = (size?: number) => {
    if (!size) return ''
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
    return `${Math.round(size / (1024 * 1024))} MB`
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
                sx={{
                  width: '100%',
                  maxHeight: 220,
                  objectFit: 'cover',
                  borderRadius: 2,
                }}
              />
            </Box>
          ) : note.type === 'file' ? (
            <Stack spacing={1} sx={{ marginTop: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {note.fileName ?? 'Zalacznik'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {[note.mimeType, formatSize(note.size)].filter(Boolean).join(' · ')}
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
        </Box>
      ))}
    </Stack>
  )
}

export default NotesList
