import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import type { Section } from '../types'
import SortableItemCard from './SortableItemCard'
import AddItemDialog from './section/AddItemDialog'
import SectionActionsMenu from './section/SectionActionsMenu'

interface SectionAccordionProps {
  section: Section
  onToggleItem: (itemId: string) => void
  onToggleFavorite: (itemId: string) => void
  onOpenItem: (itemId: string) => void
  onAddItem: (title: string) => void
  onDeleteItem: (itemId: string) => void
  onDeleteSection: () => void
  onHideSection: () => void
  expanded: boolean
  onToggleExpanded: () => void
}

const SectionAccordion = ({
  section,
  onToggleItem,
  onToggleFavorite,
  onOpenItem,
  onAddItem,
  onDeleteItem,
  onDeleteSection,
  onHideSection,
  expanded,
  onToggleExpanded,
}: SectionAccordionProps) => {
  const [newItemTitle, setNewItemTitle] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [actionsAnchor, setActionsAnchor] = useState<null | HTMLElement>(null)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id, data: { type: 'section' } })

  const { setNodeRef: setDropRef } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'section-drop', sectionId: section.id },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const handleAdd = () => {
    if (!newItemTitle.trim()) return
    onAddItem(newItemTitle)
    setNewItemTitle('')
    setAddOpen(false)
  }

  const closeActions = () => setActionsAnchor(null)

  const completedCount = section.items.filter((item) => item.checked).length
  const isAllDone = section.items.length > 0 && completedCount === section.items.length

  return (
    <Box ref={setNodeRef} style={style} id={`section-${section.id}`}>
      <Accordion
        expanded={expanded}
        onChange={onToggleExpanded}
        sx={{
          opacity: isAllDone ? 0.6 : 1,
          filter: isAllDone ? 'grayscale(0.15)' : 'none',
        }}
      >
        <AccordionSummary component="div" expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" spacing={1.5} sx={{ width: '100%', alignItems: 'center' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {section.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completedCount}/{section.items.length} zadania
              </Typography>
            </Box>
            <Stack direction="row" spacing={0}>
              <IconButton
                size="small"
                aria-label="Akcje sekcji"
                onClick={(event) => {
                  event.stopPropagation()
                  setActionsAnchor(event.currentTarget)
                }}
                sx={{ padding: 0.25 }}
              >
                <MoreVertRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                aria-label="Przeciagnij sekcje"
                {...attributes}
                {...listeners}
                onClick={(event) => event.stopPropagation()}
                sx={{ touchAction: 'none', padding: 0.25 }}
              >
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Box ref={setDropRef} sx={{ minHeight: 40 }}>
            <SortableContext
              items={section.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={1}>
                {section.items.map((item) => (
                  <SortableItemCard
                    key={item.id}
                    item={item}
                    sectionId={section.id}
                    onToggle={onToggleItem}
                    onToggleFavorite={onToggleFavorite}
                    onOpen={onOpenItem}
                    onDelete={onDeleteItem}
                  />
                ))}
              </Stack>
            </SortableContext>
          </Box>
        </AccordionDetails>
      </Accordion>

      <AddItemDialog
        open={addOpen}
        title={newItemTitle}
        onTitleChange={setNewItemTitle}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
      />
      <SectionActionsMenu
        anchor={actionsAnchor}
        onClose={closeActions}
        onAddItem={() => setAddOpen(true)}
        onDelete={onDeleteSection}
        onHide={onHideSection}
      />
    </Box>
  )
}

export default SectionAccordion
