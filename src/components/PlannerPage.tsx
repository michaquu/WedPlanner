import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { PlannerData } from '../types'
import { STORAGE_KEYS } from '../constants'
import { usePlannerActions } from '../hooks/usePlannerActions'
import { usePlannerDnd } from '../hooks/usePlannerDnd'
import { useStoredState } from '../hooks/useStoredState'
import {
  filterSections,
  orderSectionsWithItems,
  sortPlannerItems,
  type PlannerSort,
} from '../utils/plannerData'
import ItemDetailsView from './ItemDetailsView'
import SectionAccordion from './SectionAccordion'
import SortableItemCard from './SortableItemCard'
import DeleteConfirmationDialog, {
  type DeleteTarget,
} from './planner/DeleteConfirmationDialog'
import PlannerDragOverlay from './planner/PlannerDragOverlay'
import PlannerSearch from './planner/PlannerSearch'

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
  const [sort, setSort] = useState<PlannerSort>('manual')
  const listScrollPosition = useRef<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [expandedSections, setExpandedSections] = useStoredState<Record<string, boolean>>(
    STORAGE_KEYS.collapsedSections,
    {},
  )
  const actions = usePlannerActions(setData)

  const orderedSections = useMemo(
    () => orderSectionsWithItems(data.sections, sectionOrder, itemOrder),
    [data.sections, itemOrder, sectionOrder],
  )
  const displayedSections = useMemo(
    () => filterSections(orderedSections, hiddenSections, searchQuery, favoriteOnly),
    [favoriteOnly, hiddenSections, orderedSections, searchQuery],
  )
  const sortedItems = useMemo(
    () => sortPlannerItems(displayedSections, sort),
    [displayedSections, sort],
  )
  const matchedItemsCount = displayedSections.reduce(
    (total, section) => total + section.items.length,
    0,
  )
  const selectedItem = data.sections.reduce<
    { item: (typeof data.sections)[number]['items'][number]; sectionId: string } | null
  >((found, section) => {
    if (found || !selectedItemId) return found
    const item = section.items.find((entry) => entry.id === selectedItemId)
    return item ? { item, sectionId: section.id } : null
  }, null)
  const dnd = usePlannerDnd({
    data,
    orderedSections,
    sectionOrder,
    setData,
    setSectionOrder,
    setItemOrder,
  })

  useEffect(() => {
    if (selectedItemId) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedItemId])

  useLayoutEffect(() => {
    if (selectedItemId || listScrollPosition.current === null) return
    window.scrollTo({ top: listScrollPosition.current, behavior: 'auto' })
    listScrollPosition.current = null
  }, [selectedItemId])

  useEffect(() => {
    if (!navigateSectionId) return
    if (sort !== 'manual') {
      const timeout = window.setTimeout(() => setSort('manual'), 0)
      return () => window.clearTimeout(timeout)
    }
    const timeout = window.setTimeout(() => {
      setExpandedSections((current) => ({ ...current, [navigateSectionId]: true }))
      setSelectedItemId(null)
      document.getElementById(`section-${navigateSectionId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      onNavigateHandled()
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [navigateSectionId, onNavigateHandled, setExpandedSections, sort])

  const requestItemDeletion = (sectionId: string, itemId: string) => {
    const item = data.sections
      .find((section) => section.id === sectionId)
      ?.items.find((entry) => entry.id === itemId)
    setDeleteTarget({ type: 'item', sectionId, itemId, title: item?.title })
  }

  const requestSectionDeletion = (sectionId: string) => {
    const section = data.sections.find((entry) => entry.id === sectionId)
    setDeleteTarget({ type: 'section', sectionId, title: section?.title })
  }

  const handleOpenItem = (itemId: string) => {
    listScrollPosition.current = window.scrollY
    setSelectedItemId(itemId)
  }

  const handleBackToPlanner = () => setSelectedItemId(null)

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'item') {
      actions.deleteItem(deleteTarget.sectionId, deleteTarget.itemId)
      setItemOrder((current) => ({
        ...current,
        [deleteTarget.sectionId]: (current[deleteTarget.sectionId] ?? []).filter(
          (id) => id !== deleteTarget.itemId,
        ),
      }))
      if (selectedItemId === deleteTarget.itemId) setSelectedItemId(null)
    } else {
      actions.deleteSection(deleteTarget.sectionId)
      setSectionOrder((current) => current.filter((id) => id !== deleteTarget.sectionId))
      setExpandedSections((current) => {
        const next = { ...current }
        delete next[deleteTarget.sectionId]
        return next
      })
      setHiddenSections((current) => {
        const next = { ...current }
        delete next[deleteTarget.sectionId]
        return next
      })
      setItemOrder((current) => {
        const next = { ...current }
        delete next[deleteTarget.sectionId]
        return next
      })
    }
    setDeleteTarget(null)
  }

  if (selectedItem) {
    return (
      <ItemDetailsView
        item={selectedItem.item}
        onBack={handleBackToPlanner}
        onUpdate={(changes) => actions.updateItem(selectedItem.sectionId, selectedItem.item.id, changes)}
        onAddNote={(note) => actions.addNote(selectedItem.sectionId, selectedItem.item.id, note)}
        onRemoveNote={(noteId) =>
          actions.removeNote(selectedItem.sectionId, selectedItem.item.id, noteId)
        }
      />
    )
  }

  const hasActiveFilter = Boolean(searchQuery.trim()) || favoriteOnly
  return (
    <Stack spacing={3}>
      <Box className="planner-header">
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Planer slubny
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sekcje i zadania przeciagasz, a szczegoly edytujesz po kliknieciu.
        </Typography>
      </Box>

      {searchVisible && (
        <PlannerSearch
          query={searchQuery}
          favoriteOnly={favoriteOnly}
          matchedItems={matchedItemsCount}
          matchedSections={displayedSections.length}
          sort={sort}
          onQueryChange={onSearchQueryChange}
          onFavoriteOnlyChange={onFavoriteOnlyChange}
          onSortChange={setSort}
        />
      )}

      <DndContext
        sensors={dnd.sensors}
        onDragStart={dnd.handleDragStart}
        onDragEnd={dnd.handleDragEnd}
        onDragCancel={dnd.handleDragCancel}
      >
        <SortableContext
          items={
            sort === 'manual'
              ? displayedSections.map((section) => section.id)
              : sortedItems.map(({ item }) => item.id)
          }
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={2.5}>
            {sort === 'manual' ? (
              displayedSections.map((section) => (
                <SectionAccordion
                  key={section.id}
                  section={section}
                  onToggleItem={(itemId) => actions.toggleItem(section.id, itemId)}
                  onToggleFavorite={(itemId) => actions.toggleFavorite(section.id, itemId)}
                  onOpenItem={handleOpenItem}
                  onAddItem={(title) => actions.addItem(section.id, title)}
                  onDeleteItem={(itemId) => requestItemDeletion(section.id, itemId)}
                  onDeleteSection={() => requestSectionDeletion(section.id)}
                  onHideSection={() =>
                    setHiddenSections((current) => ({ ...current, [section.id]: true }))
                  }
                  expanded={expandedSections[section.id] ?? true}
                  onToggleExpanded={() =>
                    setExpandedSections((current) => ({
                      ...current,
                      [section.id]: !(current[section.id] ?? true),
                    }))
                  }
                />
              ))
            ) : (
              <Stack spacing={1.25}>
                <Typography variant="subtitle2" color="text.secondary">
                  Wszystkie zadania ({sortedItems.length})
                </Typography>
                {sortedItems.map(({ item, sectionId, sectionTitle }) => (
                  <SortableItemCard
                    key={item.id}
                    item={item}
                    sectionId={sectionId}
                    sectionTitle={sectionTitle}
                    dragEnabled={false}
                    onToggle={() => actions.toggleItem(sectionId, item.id)}
                    onToggleFavorite={() => actions.toggleFavorite(sectionId, item.id)}
                    onOpen={handleOpenItem}
                    onDelete={() => requestItemDeletion(sectionId, item.id)}
                  />
                ))}
              </Stack>
            )}
            {((sort === 'manual' && hasActiveFilter && displayedSections.length === 0) ||
              (sort !== 'manual' && sortedItems.length === 0)) && (
              <Paper className="empty-search" elevation={0}>
                <SearchRoundedIcon color="disabled" />
                <Typography variant="body2" color="text.secondary">
                  {hasActiveFilter
                    ? 'Brak zadan pasujacych do wyszukiwania.'
                    : 'Brak zadan do wyswietlenia.'}
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
          <PlannerDragOverlay data={data} activeId={dnd.activeId} activeType={dnd.activeType} />
        </DragOverlay>
      </DndContext>

      <DeleteConfirmationDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Stack>
  )
}

export default PlannerPage
