import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { v4 as uuid } from 'uuid'
import packageJson from '../package.json'
import './App.css'
import { STORAGE_KEYS } from './constants'
import AddSectionDialog from './components/app/AddSectionDialog'
import AppHeader from './components/app/AppHeader'
import MissingProject from './components/app/MissingProject'
import NavigationDrawer from './components/app/NavigationDrawer'
import ProjectLoading from './components/app/ProjectLoading'
import SummaryPopover from './components/app/SummaryPopover'
import UpdateBanner from './components/app/UpdateBanner'
import DashboardPage from './components/DashboardPage'
import PlannerPage from './components/PlannerPage'
import { useProjectData } from './hooks/useProjectData'
import { useDeadlineNotifications } from './hooks/useDeadlineNotifications'
import { useStoredState } from './hooks/useStoredState'
import {
  getEffectiveItemOrder,
  getEffectiveSectionOrder,
  getPlannerSummary,
  orderByIds,
} from './utils/plannerData'
import { appendPlannerSection } from './utils/plannerMutations'

type AppView = 'planner' | 'dashboard'

function App() {
  const project = useProjectData()
  const { projectId, selectProject } = project
  const deadlineNotifications = useDeadlineNotifications(project.projectId)
  const [activeView, setActiveView] = useState<AppView>('planner')
  const [searchQuery, setSearchQuery] = useState('')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [searchVisible, setSearchVisible] = useStoredState(STORAGE_KEYS.searchVisible, true)
  const [hiddenSections, setHiddenSections] = useStoredState<Record<string, boolean>>(
    STORAGE_KEYS.hiddenSections,
    {},
  )
  const [sectionOrder, setSectionOrder] = useStoredState<string[]>(
    STORAGE_KEYS.sectionOrder,
    [],
  )
  const [itemOrder, setItemOrder] = useStoredState<Record<string, string[]>>(
    STORAGE_KEYS.itemOrder,
    {},
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [summaryAnchor, setSummaryAnchor] = useState<HTMLElement | null>(null)
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [projectIdInput, setProjectIdInput] = useState('')
  const [navigateSectionId, setNavigateSectionId] = useState<string | null>(null)
  const [notificationPromptSeen, setNotificationPromptSeen] = useStoredState(
    STORAGE_KEYS.notificationPromptSeen,
    false,
  )

  const notificationPromptOpen =
    project.projectExists === true &&
    deadlineNotifications.status === 'default' &&
    !notificationPromptSeen

  const handleEnableNotifications = async () => {
    setNotificationPromptSeen(true)
    await deadlineNotifications.requestPermission()
  }

  useEffect(() => {
    const targetProjectId = new URLSearchParams(window.location.search).get('projectId')
    if (targetProjectId && targetProjectId !== projectId) {
      selectProject(targetProjectId)
    }
  }, [projectId, selectProject])

  const effectiveSectionOrder = useMemo(
    () => getEffectiveSectionOrder(project.data.sections, sectionOrder),
    [project.data.sections, sectionOrder],
  )
  const effectiveItemOrder = useMemo(
    () => getEffectiveItemOrder(project.data.sections, itemOrder),
    [itemOrder, project.data.sections],
  )
  const orderedSections = useMemo(
    () => orderByIds(project.data.sections, effectiveSectionOrder),
    [effectiveSectionOrder, project.data.sections],
  )
  const summary = useMemo(() => getPlannerSummary(project.data), [project.data])

  const resetFilters = () => {
    setSearchQuery('')
    setFavoriteOnly(false)
  }

  const handleToggleSearch = () => {
    setActiveView('planner')
    if (searchVisible) resetFilters()
    setSearchVisible(!searchVisible)
  }

  const handleNavigateSection = (sectionId: string) => {
    if (hiddenSections[sectionId]) {
      setHiddenSections((current) => ({ ...current, [sectionId]: false }))
    }
    setActiveView('planner')
    resetFilters()
    setNavigateSectionId(sectionId)
    setDrawerOpen(false)
  }

  const handleOpenDashboard = () => {
    setActiveView('dashboard')
    setSummaryAnchor(null)
    setDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddSection = () => {
    const title = newSectionTitle.trim()
    if (!title) return
    project.setData((current) =>
      appendPlannerSection(current, { id: uuid(), title, items: [] }),
    )
    setNewSectionTitle('')
    setAddSectionOpen(false)
  }

  const handleSelectProject = () => {
    if (project.selectProject(projectIdInput)) setProjectIdInput('')
  }

  return (
    <div className="app-shell">
      <AppHeader
        searchVisible={searchVisible}
        onOpenMenu={() => setDrawerOpen(true)}
        onToggleSearch={handleToggleSearch}
        onOpenSummary={setSummaryAnchor}
        onAddSection={() => setAddSectionOpen(true)}
      />

      <main className="app-main">
        <Container maxWidth="sm">
          {project.projectExists === null || project.isLoading ? (
            <ProjectLoading />
          ) : project.projectExists === false ? (
            <MissingProject projectId={project.projectId} onCreate={project.createNewProject} />
          ) : activeView === 'dashboard' ? (
            <DashboardPage data={project.data} onBack={() => setActiveView('planner')} />
          ) : (
            <PlannerPage
              data={project.data}
              setData={project.setData}
              navigateSectionId={navigateSectionId}
              onNavigateHandled={() => setNavigateSectionId(null)}
              hiddenSections={hiddenSections}
              setHiddenSections={setHiddenSections}
              sectionOrder={effectiveSectionOrder}
              setSectionOrder={setSectionOrder}
              itemOrder={effectiveItemOrder}
              setItemOrder={setItemOrder}
              searchVisible={searchVisible}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              favoriteOnly={favoriteOnly}
              onFavoriteOnlyChange={setFavoriteOnly}
            />
          )}
        </Container>
      </main>

      <AddSectionDialog
        open={addSectionOpen}
        title={newSectionTitle}
        onTitleChange={setNewSectionTitle}
        onClose={() => setAddSectionOpen(false)}
        onAdd={handleAddSection}
      />
      <SummaryPopover
        anchor={summaryAnchor}
        summary={summary}
        sectionCount={project.data.sections.length}
        onClose={() => setSummaryAnchor(null)}
        onOpenDashboard={handleOpenDashboard}
      />
      <NavigationDrawer
        open={drawerOpen}
        sections={orderedSections}
        hiddenSections={hiddenSections}
        projectId={project.projectId}
        projectIdInput={projectIdInput}
        projectExists={project.projectExists}
        isLoading={project.isLoading}
        isSaving={project.isSaving}
        version={packageJson.version}
        notificationStatus={deadlineNotifications.status}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleNavigateSection}
        onOpenDashboard={handleOpenDashboard}
        onProjectIdInputChange={setProjectIdInput}
        onSelectProject={handleSelectProject}
        onCreateProject={project.createNewProject}
        onEnableNotifications={handleEnableNotifications}
      />
      <Dialog
        open={notificationPromptOpen}
        onClose={() => setNotificationPromptSeen(true)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Wlacz powiadomienia?</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography variant="body2">
              Otrzymasz przypomnienia o terminach zadan oraz przypietych notatkach,
              nawet gdy aplikacja bedzie zamknieta.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Na iPhonie aplikacja musi byc dodana do ekranu poczatkowego.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationPromptSeen(true)}>Nie teraz</Button>
          <Button variant="contained" onClick={() => void handleEnableNotifications()}>
            Wlacz powiadomienia
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={project.saveError}
        autoHideDuration={3000}
        onClose={() => project.setSaveError(false)}
      >
        <Alert severity="error" variant="filled">
          Blad zapisu. Sprobuj ponownie.
        </Alert>
      </Snackbar>
      <UpdateBanner isSaving={project.isSaving} />
    </div>
  )
}

export default App
