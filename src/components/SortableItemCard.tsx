import { Box, Chip, IconButton, Paper, Stack, Typography } from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Item } from '../types'
import StyledCheckbox from '../utils/components/StyledCheckbox'


interface SortableItemCardProps {
  item: Item
  sectionId: string
  sectionTitle?: string
  dragEnabled?: boolean
  onToggle: (itemId: string) => void
  onToggleFavorite: (itemId: string) => void
  onOpen: (itemId: string) => void
  onDelete: (itemId: string) => void
}

const formatDate = (value?: string) => {
  if (!value) return 'Brak'
  return value
}

const formatCost = (value?: number) => {
  if (value === undefined) return 'Brak'
  return `${value} zl`
}

const statusColor = (status: Item['status']) => {
  switch (status) {
    case 'Zrobione':
      return 'success'
    case 'W trakcie':
      return 'warning'
    default:
      return 'default'
  }
}


const SortableItemCard = ({
  item,
  sectionId,
  sectionTitle,
  dragEnabled = true,
  onToggle,
  onToggleFavorite,
  onOpen,
  onDelete,
}: SortableItemCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
      data: { type: 'item', sectionId },
      disabled: !dragEnabled,
    })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(item.id)}
      sx={{
        padding: 1.25,
        borderRadius: 2,
        cursor: 'pointer',
        background: item.checked
          ? 'linear-gradient(135deg, rgba(225,225,225,0.8), rgba(240,240,240,0.7))'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(250,247,244,0.9))',
        opacity: item.checked ? 0.6 : 1,
        filter: item.checked ? 'grayscale(0.15)' : 'none',
        border: '1px solid rgba(47, 39, 36, 0.08)',
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <StyledCheckbox
          checked={item.checked}
          onChange={(event) => {
            event.stopPropagation()
            onToggle(item.id)
          }}
          onClick={(event) => event.stopPropagation()}
        />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {item.title}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            {sectionTitle && (
              <Chip label={sectionTitle} color="primary" variant="outlined" size="small" />
            )}
            <Typography variant="caption" color="text.secondary">
              Termin: {formatDate(item.dueDate)}
            </Typography>
            <Typography
              variant="caption"
              color={item.costPaid && item.cost !== undefined ? 'success.main' : 'text.secondary'}
              sx={{ fontWeight: item.costPaid && item.cost !== undefined ? 700 : 400 }}
            >
              Koszt: {formatCost(item.cost)}
              {item.cost !== undefined && !item.costPaid && ' · nieopłacone'}
            </Typography>
            <Box sx={{ display: 'flex', flex: 1, justifyContent: 'flex-end', paddingTop: '2px' }}>
              <Chip label={item.status} color={statusColor(item.status)} size="small" />
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={0}>
          <IconButton
            size="small"
            color={item.favorite ? 'error' : 'default'}
            aria-label={item.favorite ? 'Usun z polubionych' : 'Dodaj do polubionych'}
            onClick={(event) => {
              event.stopPropagation()
              onToggleFavorite(item.id)
            }}
            sx={{ padding: 0.25 }}
          >
            {item.favorite ? (
              <FavoriteRoundedIcon fontSize="small" />
            ) : (
              <FavoriteBorderRoundedIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            size="small"
            aria-label="Usun zadanie"
            onClick={(event) => {
              event.stopPropagation()
              onDelete(item.id)
            }}
            sx={{ padding: 0.25 }}
          >
            <DeleteOutlineOutlinedIcon fontSize="small" />
          </IconButton>
          {dragEnabled && (
            <IconButton
              size="small"
              aria-label="Przeciagnij zadanie"
              {...attributes}
              {...listeners}
              onClick={(event) => event.stopPropagation()}
              sx={{ touchAction: 'none', padding: 0.25 }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Stack>
    </Paper>
  )
}

export default SortableItemCard
