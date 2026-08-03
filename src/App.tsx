import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  CircularProgress,
  Drawer,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemIcon,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  Button,
  Popover,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import PlannerPage from './components/PlannerPage'
import './App.css'
import type { PlannerData } from './types'
import { createSeedData } from './data/seed'
import { v4 as uuid } from 'uuid'
import packageJson from '../package.json'
import {
  createProject,
  saveProjectData,
  subscribeProject,
} from './utils/firebaseProjects'

const PROJECT_ID_KEY = 'wedding-planner-project-id'
const HIDDEN_SECTIONS_KEY = 'wedding-planner-hidden-sections-v1'
const SECTION_ORDER_KEY = 'wedding-planner-section-order-v1'
const ITEM_ORDER_KEY = 'wedding-planner-item-order-v1'
const DEFAULT_PROJECT_ID = '39511bce-7fa5-4a62-8a5d-3d81e9b0be05'

const normalizePlannerData = (input?: PlannerData): PlannerData => {
  const fallback = createSeedData()
  const source = input ?? fallback
  return {
    sections: (source.sections ?? []).map((section) => ({
      ...section,
      items: (section.items ?? []).map((item) => ({
        ...item,
        notes: item.notes ?? [],
      })),
    })),
  }
}

const orderByIds = <T extends { id: string }>(items: T[], order: string[]) => {
  if (!order.length) return items
  const map = new Map(items.map((entry) => [entry.id, entry]))
  const ordered: T[] = []
  for (const id of order) {
    const entry = map.get(id)
    if (entry) ordered.push(entry)
  }
  for (const entry of items) {
    if (!order.includes(entry.id)) ordered.push(entry)
  }
  return ordered
}

function App() {
  const [data, setData] = useState<PlannerData>(() => createSeedData())
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [infoAnchor, setInfoAnchor] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [navigateSectionId, setNavigateSectionId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState(() => {
    try {
      return window.localStorage.getItem(PROJECT_ID_KEY) ?? DEFAULT_PROJECT_ID
    } catch {
      return DEFAULT_PROJECT_ID
    }
  })
  const [projectIdInput, setProjectIdInput] = useState('')
  const [projectExists, setProjectExists] = useState<boolean | null>(null)
  const [isLoadingProject, setIsLoadingProject] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const skipNextSaveRef = useRef(false)
  const initialSyncRef = useRef(false)
  const [hiddenSections, setHiddenSections] = useState<Record<string, boolean>>(() => {
    try {
      const raw = window.localStorage.getItem(HIDDEN_SECTIONS_KEY)
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    } catch {
      return {}
    }
  })
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(SECTION_ORDER_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  })
  const [itemOrder, setItemOrder] = useState<Record<string, string[]>>(() => {
    try {
      const raw = window.localStorage.getItem(ITEM_ORDER_KEY)
      return raw ? (JSON.parse(raw) as Record<string, string[]>) : {}
    } catch {
      return {}
    }
  })

  const effectiveSectionOrder = useMemo(() => {
    const ids = data.sections.map((section) => section.id)
    const next = sectionOrder.filter((id) => ids.includes(id))
    const missing = ids.filter((id) => !next.includes(id))
    return [...next, ...missing]
  }, [data.sections, sectionOrder])

  const effectiveItemOrder = useMemo(() => {
    const next: Record<string, string[]> = {}
    for (const section of data.sections) {
      const ids = section.items.map((item) => item.id)
      const current = itemOrder[section.id] ?? []
      const kept = current.filter((id) => ids.includes(id))
      const missing = ids.filter((id) => !kept.includes(id))
      next[section.id] = [...kept, ...missing]
    }
    return next
  }, [data.sections, itemOrder])

  const orderedSections = useMemo(
    () => orderByIds(data.sections, effectiveSectionOrder),
    [data.sections, effectiveSectionOrder],
  )

  const summary = useMemo(() => {
    const totals = data.sections.reduce(
      (acc, section) => {
        for (const item of section.items) {
          acc.totalTasks += 1
          if (item.checked) acc.doneTasks += 1
          if (item.cost) acc.totalCost += item.cost
        }
        return acc
      },
      { totalTasks: 0, doneTasks: 0, totalCost: 0 },
    )
    return totals
  }, [data.sections])

  const handleOpenAddSection = () => setAddSectionOpen(true)
  const handleCloseAddSection = () => setAddSectionOpen(false)

  const handleAddSection = () => {
    const title = newSectionTitle.trim()
    if (!title) return
    setData((prev) => ({
      sections: [
        ...prev.sections,
        {
          id: uuid(),
          title,
          items: [],
        },
      ],
    }))
    setNewSectionTitle('')
    setAddSectionOpen(false)
  }

  const handleDrawerNavigate = (sectionId: string) => {
    if (hiddenSections[sectionId]) {
      setHiddenSections((prev) => ({ ...prev, [sectionId]: false }))
    }
    setNavigateSectionId(sectionId)
    setDrawerOpen(false)
  }

  const handleSaveProjectId = () => {
    const value = projectIdInput.trim()
    if (!value) return
    setProjectId(value)
    setProjectExists(null)
    setProjectIdInput('')
    try {
      window.localStorage.setItem(PROJECT_ID_KEY, value)
    } catch {
      // Ignore storage errors.
    }
  }

  const handleCreateNewProject = () => {
    const nextId = uuid()
    const seed = createSeedData()
    setProjectId(nextId)
    setProjectExists(true)
    setData(seed)
    createProject(nextId, seed)
    try {
      window.localStorage.setItem(PROJECT_ID_KEY, nextId)
    } catch {
      // Ignore storage errors.
    }
  }


  useEffect(() => {
    if (!projectId) return
    if (projectId === DEFAULT_PROJECT_ID) {
      try {
        window.localStorage.setItem(PROJECT_ID_KEY, projectId)
      } catch {
        // Ignore storage errors.
      }
    }
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    setIsLoadingProject(true)
    const unsubscribe = subscribeProject(projectId, (payload) => {
      skipNextSaveRef.current = true
      if (payload.exists && payload.data) {
        setProjectExists(true)
        setData(normalizePlannerData(payload.data))
        setIsLoadingProject(false)
      } else {
        setProjectExists(false)
        setIsLoadingProject(false)
      }
    })
    return () => unsubscribe()
  }, [projectId])

  useEffect(() => {
    if (!projectId || projectExists !== true) return
    if (initialSyncRef.current) return
    initialSyncRef.current = true
    saveProjectData(projectId, normalizePlannerData(data))
  }, [data, projectExists, projectId])

  const handleInitProject = () => {
    const nextId = uuid()
    const seed = createSeedData()
    setProjectId(nextId)
    setProjectExists(true)
    setData(seed)
    createProject(nextId, seed)
    try {
      window.localStorage.setItem(PROJECT_ID_KEY, nextId)
    } catch {
      // Ignore storage errors.
    }
  }

  useEffect(() => {
    if (!projectId || projectExists !== true) return
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    setIsSaving(true)
    setSaveError(false)
    const saveTimeout = setTimeout(() => {
      saveProjectData(projectId, data)
        .then(() => {
          setIsSaving(false)
        })
        .catch(() => {
          setIsSaving(false)
          setSaveError(true)
        })
    }, 400)
    return () => clearTimeout(saveTimeout)
  }, [data, projectExists, projectId])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        HIDDEN_SECTIONS_KEY,
        JSON.stringify(hiddenSections),
      )
    } catch {
      // Ignore storage errors.
    }
  }, [hiddenSections])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SECTION_ORDER_KEY,
        JSON.stringify(effectiveSectionOrder),
      )
    } catch {
      // Ignore storage errors.
    }
  }, [effectiveSectionOrder])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        ITEM_ORDER_KEY,
        JSON.stringify(effectiveItemOrder),
      )
    } catch {
      // Ignore storage errors.
    }
  }, [effectiveItemOrder])
  return (
    <div className="app-shell">
      <header className="app-hero">
        <Container maxWidth="lg">
          <Stack
            direction="row"
            spacing={1}
            className="hero-stack"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <IconButton
                color="primary"
                aria-label="Menu"
                className="hero-add"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuRoundedIcon />
              </IconButton>
              <Typography variant="h5" className="hero-title">
                Wedding Planner
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              <IconButton
                color="primary"
                aria-label="Podsumowanie"
                className="hero-add"
                onClick={(event) => setInfoAnchor(event.currentTarget)}
              >
                <InfoOutlinedIcon />
              </IconButton>
              <IconButton
                color="primary"
                aria-label="Dodaj nowa sekcje"
                className="hero-add"
                onClick={handleOpenAddSection}
              >
                <AddRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Container>
      </header>

      <main className="app-main">
        <Container maxWidth="sm">
          {projectExists === false ? (
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 3,
                border: '1px solid rgba(47, 39, 36, 0.12)',
                padding: 3,
                boxShadow: '0 12px 30px rgba(47, 39, 36, 0.08)',
              }}
            >
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Brak projektu
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  W bazie nie ma danych dla ID: {projectId || 'brak'}. Mozesz
                  utworzyc nowy projekt lub wpisac inne ID w ustawieniach.
                </Typography>
                <Button variant="contained" onClick={handleInitProject}>
                  Utworz projekt
                </Button>
              </Stack>
            </Box>
          ) : (
            <PlannerPage
              data={data}
              setData={setData}
              navigateSectionId={navigateSectionId}
              onNavigateHandled={() => setNavigateSectionId(null)}
              hiddenSections={hiddenSections}
              setHiddenSections={setHiddenSections}
              sectionOrder={effectiveSectionOrder}
              setSectionOrder={setSectionOrder}
              itemOrder={effectiveItemOrder}
              setItemOrder={setItemOrder}
            />
          )}
        </Container>
      </main>

      <Dialog open={addSectionOpen} onClose={handleCloseAddSection} fullWidth>
        <DialogTitle>Nowa sekcja</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nazwa sekcji"
            fullWidth
            value={newSectionTitle}
            onChange={(event) => setNewSectionTitle(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddSection}>Anuluj</Button>
          <Button variant="contained" onClick={handleAddSection}>
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(infoAnchor)}
        anchorEl={infoAnchor}
        onClose={() => setInfoAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack spacing={1.5} sx={{ padding: 2, minWidth: 220 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Podsumowanie
          </Typography>
          <Divider />
          <Typography variant="body2">
            Zadania: {summary.doneTasks}/{summary.totalTasks}
          </Typography>
          <Typography variant="body2">
            Suma kosztow: {summary.totalCost} zl
          </Typography>
          <Typography variant="body2">
            Sekcje: {data.sections.length}
          </Typography>
        </Stack>
      </Popover>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, padding: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, marginBottom: 1 }}>
            Sekcje
          </Typography>
          <List dense>
            {orderedSections.map((section) => (
              <ListItemButton
                key={section.id}
                onClick={() => handleDrawerNavigate(section.id)}
              >
                <ListItemText
                  primary={section.title}
                  secondary={
                    hiddenSections[section.id]
                      ? 'Ukryta sekcja'
                      : `${section.items.length} zadania`
                  }
                />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ marginY: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 1 }}>
            Ukryte sekcje
          </Typography>
          <List dense>
            {orderedSections
              .filter((section) => hiddenSections[section.id])
              .map((section) => (
                <ListItemButton
                  key={section.id}
                  onClick={() => handleDrawerNavigate(section.id)}
                >
                  <ListItemIcon>
                    <VisibilityOffOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={section.title}
                    secondary="Kliknij, aby pokazac"
                  />
                </ListItemButton>
              ))}
          </List>
          <Divider sx={{ marginY: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 1 }}>
            Ustawienia
          </Typography>
          <Stack spacing={1.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Aktualne ID projektu
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <TextField
                  size="small"
                  value={projectId || 'brak'}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
                <IconButton
                  size="small"
                  aria-label="Udostepnij ID"
                  onClick={() => {
                    if (!projectId) return
                    navigator.clipboard?.writeText(projectId)
                  }}
                >
                  <ShareRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
            <TextField
              size="small"
              label="Wpisz ID projektu"
              value={projectIdInput}
              onChange={(event) => setProjectIdInput(event.target.value)}
              fullWidth
                helperText={
                  projectExists === false
                    ? 'Nie znaleziono projektu. Utworz nowe lub wpisz inne ID.'
                    : undefined
                }
            />
            {isLoadingProject && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Ladowanie danych...
                </Typography>
              </Stack>
            )}
            {isSaving && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Zapisywanie...
                </Typography>
              </Stack>
            )}
            <Stack spacing={1}>
              <Button variant="contained" onClick={handleSaveProjectId}>
                Zapisz ID
              </Button>
              <Button variant="outlined" onClick={handleCreateNewProject}>
                Utworz nowe
              </Button>
            </Stack>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'left', paddingTop: 2, size: '0.75rem' }}
            >
              Wersja: {packageJson.version}
            </Typography>
          </Stack>
        </Box>
      </Drawer>

      <Snackbar
        open={saveError}
        autoHideDuration={3000}
        onClose={() => setSaveError(false)}
      >
        <Alert severity="error" variant="filled">
          Blad zapisu. Sprobuj ponownie.
        </Alert>
      </Snackbar>
    </div>
  )
}

export default App
