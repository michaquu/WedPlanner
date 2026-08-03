import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { PlannerData } from '../../types'

interface PlannerDragOverlayProps {
  data: PlannerData
  activeId: string | null
  activeType: 'section' | 'item' | null
}

const PlannerDragOverlay = ({ data, activeId, activeType }: PlannerDragOverlayProps) => {
  if (!activeId || !activeType) return null

  if (activeType === 'section') {
    const section = data.sections.find((entry) => entry.id === activeId)
    if (!section) return null
    return (
      <Paper className="drag-overlay">
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {section.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {section.items.length} zadania
          </Typography>
        </Stack>
      </Paper>
    )
  }

  const item = data.sections.flatMap((section) => section.items).find((entry) => entry.id === activeId)
  if (!item) return null
  return (
    <Paper className="drag-overlay">
      <Stack spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {item.title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Termin: {item.dueDate || 'Brak'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Koszt: {item.cost === undefined ? 'Brak' : `${item.cost} zl`}
          </Typography>
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
            <Chip label={item.status} size="small" />
          </Box>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default PlannerDragOverlay

