import { useEffect, useMemo, useState } from 'react'
import {
  Box,
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
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import PlannerPage from './components/PlannerPage'
import './App.css'
import type { PlannerData } from './types'
import { loadPlanner, savePlanner } from './utils/storage'
import { createSeedData } from './data/seed'
import { v4 as uuid } from 'uuid'

const PROJECT_ID_KEY = 'wedding-planner-project-id'
const HIDDEN_SECTIONS_KEY = 'wedding-planner-hidden-sections-v1'

function App() {
  const [data, setData] = useState<PlannerData>(() => {
    return loadPlanner() ?? createSeedData()
  })
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [infoAnchor, setInfoAnchor] = useState<null | HTMLElement>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [navigateSectionId, setNavigateSectionId] = useState<string | null>(null)
  const [projectId, setProjectId] = useState(() => {
    try {
      return window.localStorage.getItem(PROJECT_ID_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const [projectIdInput, setProjectIdInput] = useState('')
  const [hiddenSections, setHiddenSections] = useState<Record<string, boolean>>(() => {
    try {
      const raw = window.localStorage.getItem(HIDDEN_SECTIONS_KEY)
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
    } catch {
      return {}
    }
  })

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
    setProjectIdInput('')
    try {
      window.localStorage.setItem(PROJECT_ID_KEY, value)
    } catch {
      // Ignore storage errors.
    }
  }

  const handleCreateNewProject = () => {
    const nextId = uuid()
    setProjectId(nextId)
    setData(createSeedData())
    try {
      window.localStorage.setItem(PROJECT_ID_KEY, nextId)
    } catch {
      // Ignore storage errors.
    }
  }

  useEffect(() => {
    savePlanner(data)
  }, [data])

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
          <PlannerPage
            data={data}
            setData={setData}
            navigateSectionId={navigateSectionId}
            onNavigateHandled={() => setNavigateSectionId(null)}
            hiddenSections={hiddenSections}
            setHiddenSections={setHiddenSections}
          />
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
            {data.sections.map((section) => (
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
            />
            <Stack spacing={1}>
              <Button variant="contained" onClick={handleSaveProjectId}>
                Zapisz ID
              </Button>
              <Button variant="outlined" onClick={handleCreateNewProject}>
                Utworz nowe
              </Button>
            </Stack>
          </Stack>
          <Divider sx={{ marginY: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 1 }}>
            Ukryte sekcje
          </Typography>
          <List dense>
            {data.sections
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
        </Box>
      </Drawer>
    </div>
  )
}

export default App
