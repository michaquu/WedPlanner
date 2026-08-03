import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { v4 as uuid } from 'uuid'
import type { Item, PlannerData, Note, Section } from '../types'
import SectionAccordion from './SectionAccordion'
import ItemDetailsView from './ItemDetailsView'

interface PlannerPageProps {
  data: PlannerData
  setData: Dispatch<SetStateAction<PlannerData>>
  navigateSectionId: string | null
  onNavigateHandled: () => void
  hiddenSections: Record<string, boolean>
  setHiddenSections: Dispatch<SetStateAction<Record<string, boolean>>>
  sectionOrder: string[]
  setSectionOrder: Dispatch<SetStateAction<string[]>>
  itemOrder: Record<string, string[]>
  setItemOrder: Dispatch<SetStateAction<Record<string, string[]>>>
  searchVisible: boolean
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  favoriteOnly: boolean
  onFavoriteOnlyChange: (value: boolean) => void
}

const COLLAPSE_KEY = 'wedding-planner-collapse-v1'

const PlannerPage = ({
  data,
  setData,
  navigateSectionId,
  onNavigateHandled,
  hiddenSections,
  setHiddenSections,
  sectionOrder,
  setSectionOrder,
  itemOrder,
  setItemOrder,
  searchVisible,
  searchQuery,
  onSearchQueryChange,
  favoriteOnly,
  onFavoriteOnlyChange,
}: PlannerPageProps) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [activeDragType, setActiveDragType] = useState<'section' | 'item' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<
    | { type: 'section'; sectionId: string; title?: string }
    | { type: 'item'; sectionId: string; itemId: string; title?: string }
    | null
  >(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    try {
      const raw = window.localStorage.getItem(COLLAPSE_KEY)
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    } catch {
      return {}
    }
  })

  const orderedSections = useMemo(() => {
    const map = new Map(data.sections.map((section) => [section.id, section]))
    const order = sectionOrder.length ? sectionOrder : data.sections.map((section) => section.id)
    const sorted: Section[] = []
    for (const id of order) {
      const entry = map.get(id)
      if (entry) {
        const itemIds = itemOrder[entry.id] ?? []
        const itemsMap = new Map(entry.items.map((item) => [item.id, item]))
        const sortedItems: Item[] = []
        for (const itemId of itemIds) {
          const item = itemsMap.get(itemId)
          if (item) sortedItems.push(item)
        }
        for (const item of entry.items) {
          if (!itemIds.includes(item.id)) sortedItems.push(item)
        }
        sorted.push({ ...entry, items: sortedItems })
      }
    }
    for (const section of data.sections) {
      if (!order.includes(section.id)) {
        const itemIds = itemOrder[section.id] ?? []
        const itemsMap = new Map(section.items.map((item) => [item.id, item]))
        const sortedItems: Item[] = []
        for (const itemId of itemIds) {
          const item = itemsMap.get(itemId)
          if (item) sortedItems.push(item)
        }
        for (const item of section.items) {
          if (!itemIds.includes(item.id)) sortedItems.push(item)
        }
        sorted.push({ ...section, items: sortedItems })
      }
    }
    return sorted
  }, [data.sections, sectionOrder, itemOrder])

  const normalizedQuery = searchQuery
    .trim()
    .toLocaleLowerCase('pl-PL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const displayedSections = useMemo(() => {
    if (!normalizedQuery && !favoriteOnly) {
      return orderedSections.filter((section) => !hiddenSections[section.id])
    }

    const includesQuery = (value: unknown) =>
      String(value ?? '')
        .toLocaleLowerCase('pl-PL')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(normalizedQuery)

    return orderedSections.flatMap((section) => {
      const sectionMatches = includesQuery(section.title)
      const items = section.items.filter((item) => {
        if (favoriteOnly && !item.favorite) return false
        if (!normalizedQuery) return true
        if (sectionMatches) return true
        return [
          item.title,
          item.status,
          item.dueDate,
          item.cost,
          item.checked ? 'ukonczone zrobione' : 'nieukonczone do zrobienia',
          ...item.notes.flatMap((note) => [
            note.type,
            note.type === 'text' || note.type === 'link' ? note.content : undefined,
            note.fileName,
            note.mimeType,
          ]),
        ].some(includesQuery)
      })
      return items.length ? [{ ...section, items }] : []
    })
  }, [favoriteOnly, hiddenSections, normalizedQuery, orderedSections])

  const matchedItemsCount = displayedSections.reduce(
    (total, section) => total + section.items.length,
    0,
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  )

  useEffect(() => {
    if (selectedItemId) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [selectedItemId])

  useEffect(() => {
    if (!navigateSectionId) return
    setTimeout(() => {
      if (hiddenSections[navigateSectionId]) {
        setHiddenSections((prev) => ({ ...prev, [navigateSectionId]: false }))
      }
      setExpandedSections((prev) => ({
        ...prev,
        [navigateSectionId]: true,
      }))
      setSelectedItemId(null)
      const target = document.getElementById(`section-${navigateSectionId}`)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      onNavigateHandled()
    }, 0)
  }, [navigateSectionId, hiddenSections, onNavigateHandled, setHiddenSections])

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(expandedSections))
    } catch {
      // Ignore storage errors.
    }
  }, [expandedSections])

  let selectedItem: { item: Item; sectionId: string } | null = null
  if (selectedItemId) {
    for (const section of data.sections) {
      const item = section.items.find((entry) => entry.id === selectedItemId)
      if (item) {
        selectedItem = { item, sectionId: section.id }
        break
      }
    }
  }

  const updateItem = (sectionId: string, itemId: string, changes: Partial<Item>) => {
    setData((prev) => ({
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? { ...item, ...changes } : item,
          ),
        }
      }),
    }))
  }

  const handleToggleItem = (sectionId: string, itemId: string) => {
    const section = data.sections.find((entry) => entry.id === sectionId)
    const item = section?.items.find((entry) => entry.id === itemId)
    if (!item) return
    updateItem(sectionId, itemId, { checked: !item.checked })
  }

  const handleToggleFavorite = (sectionId: string, itemId: string) => {
    const section = data.sections.find((entry) => entry.id === sectionId)
    const item = section?.items.find((entry) => entry.id === itemId)
    if (!item) return
    updateItem(sectionId, itemId, { favorite: !item.favorite })
  }

  const handleAddNote = (sectionId: string, itemId: string, note: Note) => {
    const newNote = {
      ...note,
    }
    setData((prev) => ({
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId
              ? { ...item, notes: [newNote, ...(item.notes ?? [])] }
              : item,
          ),
        }
      }),
    }))
  }

  const handleRemoveNote = (sectionId: string, itemId: string, noteId: string) => {
    setData((prev) => ({
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId
              ? { ...item, notes: item.notes.filter((note) => note.id !== noteId) }
              : item,
          ),
        }
      }),
    }))
  }

  const handleAddItem = (sectionId: string, title: string) => {
    const value = title.trim()
    if (!value) return
    setData((prev) => ({
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section
        return {
          ...section,
          items: [
            ...section.items,
            {
              id: uuid(),
              title: value,
              checked: false,
              favorite: false,
              status: 'Do zrobienia',
              dueDate: '',
              cost: undefined,
              notes: [],
            },
          ],
        }
      }),
    }))
  }

  const handleDragStart = (event: DragStartEvent) => {
    const type = event.active.data.current?.type as 'section' | 'item' | undefined
    setActiveDragType(type ?? null)
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)
    setActiveDragType(null)
    if (!over) return

    const activeType = active.data.current?.type

    if (activeType === 'section') {
      if (active.id === over.id) return
      const order = sectionOrder.length
        ? sectionOrder
        : data.sections.map((section) => section.id)
      const oldIndex = order.indexOf(String(active.id))
      const newIndex = order.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return
      setSectionOrder(arrayMove(order, oldIndex, newIndex))
      return
    }

    if (activeType === 'item') {
      const sourceSectionId = active.data.current?.sectionId as string
      const overType = over.data.current?.type
      let targetSectionId = sourceSectionId
      let targetIndex = -1

      if (overType === 'item') {
        const found = orderedSections.find((section) =>
          section.items.some((item) => item.id === over.id),
        )
        targetSectionId = found?.id ?? sourceSectionId
        targetIndex = found?.items.findIndex((item) => item.id === over.id) ?? -1
      } else if (overType === 'section-drop') {
        targetSectionId = over.data.current?.sectionId as string
        targetIndex = -1
      }

      const currentSection = orderedSections.find((section) => section.id === sourceSectionId)
      const currentItems = currentSection?.items ?? []
      const sourceIndex = currentItems.findIndex((item) => item.id === active.id)
      if (sourceIndex === -1) return

      if (sourceSectionId === targetSectionId) {
        if (targetIndex < 0) return
        const order = currentItems.map((item) => item.id)
        setItemOrder((prev) => ({
          ...prev,
          [sourceSectionId]: arrayMove(order, sourceIndex, targetIndex),
        }))
        return
      }

      setData((prev) => {
        const sections = prev.sections.map((section) => ({
          ...section,
          items: [...section.items],
        }))
        const sourceSection = sections.find((section) => section.id === sourceSectionId)
        const targetSection = sections.find((section) => section.id === targetSectionId)
        if (!sourceSection || !targetSection) return prev

        const sourceIndex = sourceSection.items.findIndex((item) => item.id === active.id)
        if (sourceIndex === -1) return prev

        const [moved] = sourceSection.items.splice(sourceIndex, 1)
        const insertIndex = targetIndex >= 0 ? targetIndex : targetSection.items.length
        targetSection.items.splice(insertIndex, 0, moved)
        return { sections }
      })

      setItemOrder((prev) => {
        const next = { ...prev }
        const sourceOrder = (prev[sourceSectionId] ?? currentItems.map((item) => item.id)).filter(
          (id) => id !== active.id,
        )
        const targetSection = orderedSections.find((section) => section.id === targetSectionId)
        const targetBase = targetSection?.items.map((item) => item.id) ?? []
        const targetOrder = prev[targetSectionId] ?? targetBase
        const insertIndex = targetIndex >= 0 ? targetIndex : targetOrder.length
        const nextTarget = [...targetOrder]
        nextTarget.splice(insertIndex, 0, String(active.id))
        next[sourceSectionId] = sourceOrder
        next[targetSectionId] = nextTarget
        return next
      })
    }
  }

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    const section = data.sections.find((entry) => entry.id === sectionId)
    const item = section?.items.find((entry) => entry.id === itemId)
    setConfirmDelete({
      type: 'item',
      sectionId,
      itemId,
      title: item?.title,
    })
  }

  const handleDeleteSection = (sectionId: string) => {
    const section = data.sections.find((entry) => entry.id === sectionId)
    setConfirmDelete({
      type: 'section',
      sectionId,
      title: section?.title,
    })
  }

  const handleConfirmDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'item') {
      const { sectionId, itemId } = confirmDelete
      setData((prev) => ({
        sections: prev.sections.map((section) => {
          if (section.id !== sectionId) return section
          return {
            ...section,
            items: section.items.filter((item) => item.id !== itemId),
          }
        }),
      }))
      if (selectedItemId === itemId) {
        setSelectedItemId(null)
      }
    }
    if (confirmDelete.type === 'section') {
      const { sectionId } = confirmDelete
      setData((prev) => ({
        sections: prev.sections.filter((section) => section.id !== sectionId),
      }))
      setExpandedSections((prev) => {
        const next = { ...prev }
        delete next[sectionId]
        return next
      })
      setHiddenSections((prev) => {
        const next = { ...prev }
        delete next[sectionId]
        return next
      })
    }
    setConfirmDelete(null)
  }

  const handleHideSection = (sectionId: string) => {
    setHiddenSections((prev) => ({ ...prev, [sectionId]: true }))
  }

  return (
    <Stack spacing={3}>
      {selectedItem ? (
        <ItemDetailsView
          item={selectedItem.item}
          onBack={() => setSelectedItemId(null)}
          onUpdate={(changes) =>
            updateItem(selectedItem.sectionId, selectedItem.item.id, changes)
          }
          onAddNote={(note) =>
            handleAddNote(selectedItem.sectionId, selectedItem.item.id, note)
          }
          onRemoveNote={(noteId) =>
            handleRemoveNote(selectedItem.sectionId, selectedItem.item.id, noteId)
          }
        />
      ) : (
        <>
          <Box className="planner-header">
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: { md: 'center' } }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Planer slubny
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sekcje i zadania przeciagasz, a szczegoly edytujesz po
                  kliknieciu.
                </Typography>
              </Box>
            </Stack>
          </Box>

          {searchVisible && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <TextField
                autoFocus
                fullWidth
                size="small"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Szukaj w zadaniach, notatkach, kosztach i terminach..."
                aria-label="Szukaj w planerze"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => onSearchQueryChange('')}
                          aria-label="Wyczysc wyszukiwanie"
                        >
                          <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
                helperText={
                  normalizedQuery || favoriteOnly
                    ? `Znaleziono ${matchedItemsCount} zadan w ${displayedSections.length} sekcjach`
                    : undefined
                }
              />
              <IconButton
                color={favoriteOnly ? 'error' : 'default'}
                className="favorite-filter"
                onClick={() => onFavoriteOnlyChange(!favoriteOnly)}
                aria-label={favoriteOnly ? 'Pokaz wszystkie zadania' : 'Pokaz tylko polubione'}
                aria-pressed={favoriteOnly}
              >
                {favoriteOnly ? <FavoriteRoundedIcon /> : <FavoriteBorderRoundedIcon />}
              </IconButton>
            </Stack>
          )}

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
              setActiveDragId(null)
              setActiveDragType(null)
            }}
          >
            <SortableContext
              items={displayedSections.map((section) => section.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack spacing={2.5}>
                {displayedSections.map((section) => (
                    <SectionAccordion
                      key={section.id}
                      section={section}
                      onToggleItem={(itemId) => handleToggleItem(section.id, itemId)}
                      onToggleFavorite={(itemId) =>
                        handleToggleFavorite(section.id, itemId)
                      }
                      onOpenItem={(itemId) => setSelectedItemId(itemId)}
                      onAddItem={(title) => handleAddItem(section.id, title)}
                      onDeleteItem={(itemId: string) => handleDeleteItem(section.id, itemId)}
                      onDeleteSection={() => handleDeleteSection(section.id)}
                      onHideSection={() => handleHideSection(section.id)}
                      expanded={expandedSections[section.id] ?? true}
                      onToggleExpanded={() =>
                        setExpandedSections((prev) => ({
                          ...prev,
                          [section.id]: !(prev[section.id] ?? true),
                        }))
                      }
                    />
                  ))}
                {(normalizedQuery || favoriteOnly) && displayedSections.length === 0 && (
                  <Paper className="empty-search" elevation={0}>
                    <SearchRoundedIcon color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      Brak zadan pasujacych do wyszukiwania.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </SortableContext>
            <DragOverlay
              dropAnimation={{
                duration: 180,
                easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                sideEffects: defaultDropAnimationSideEffects({
                  styles: { active: { opacity: '0.6' } },
                }),
              }}
            >
              {activeDragId && activeDragType === 'item' && (
                <Paper className="drag-overlay">
                  {(() => {
                    const item = data.sections
                      .flatMap((section) => section.items)
                      .find((entry) => entry.id === activeDragId)
                    if (!item) return null
                    return (
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            Termin: {item.dueDate || 'Brak'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Koszt: {item.cost ? `${item.cost} zl` : 'Brak'}
                          </Typography>
                          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'flex-end' }}>
                            <Chip label={item.status} size="small" />
                          </Box>
                        </Stack>
                      </Stack>
                    )
                  })()}
                </Paper>
              )}
              {activeDragId && activeDragType === 'section' && (
                <Paper className="drag-overlay">
                  {(() => {
                    const section = data.sections.find(
                      (entry) => entry.id === activeDragId,
                    )
                    if (!section) return null
                    return (
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {section.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {section.items.length} zadania
                        </Typography>
                      </Stack>
                    )
                  })()}
                </Paper>
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Potwierdzenie</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirmDelete?.type === 'section'
              ? `Usunac sekcje${confirmDelete.title ? ` "${confirmDelete.title}"` : ''}?`
              : `Usunac zadanie${confirmDelete?.title ? ` "${confirmDelete.title}"` : ''}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Anuluj</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Usun
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}

export default PlannerPage
