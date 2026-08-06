import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import type { Section } from '../../types'
import type { DeadlineNotificationStatus } from '../../hooks/useDeadlineNotifications'

interface NavigationDrawerProps {
  open: boolean
  sections: Section[]
  hiddenSections: Record<string, boolean>
  projectId: string
  projectIdInput: string
  projectExists: boolean | null
  isLoading: boolean
  isSaving: boolean
  version: string
  notificationStatus: DeadlineNotificationStatus
  onClose: () => void
  onNavigate: (sectionId: string) => void
  onOpenDashboard: () => void
  onProjectIdInputChange: (value: string) => void
  onSelectProject: () => void
  onCreateProject: () => void
  onEnableNotifications: () => void
}

const ProjectStatus = ({ isLoading, isSaving }: Pick<NavigationDrawerProps, 'isLoading' | 'isSaving'>) => {
  const label = isLoading ? 'Ladowanie danych...' : isSaving ? 'Zapisywanie...' : null
  if (!label) return null
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <CircularProgress size={16} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  )
}

const NavigationDrawer = ({
  open,
  sections,
  hiddenSections,
  projectId,
  projectIdInput,
  projectExists,
  isLoading,
  isSaving,
  version,
  notificationStatus,
  onClose,
  onNavigate,
  onOpenDashboard,
  onProjectIdInputChange,
  onSelectProject,
  onCreateProject,
  onEnableNotifications,
}: NavigationDrawerProps) => {
  const hidden = sections.filter((section) => hiddenSections[section.id])

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280, padding: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, marginBottom: 1 }}>
          Sekcje
        </Typography>
        <List dense>
          {sections.map((section) => (
            <ListItemButton key={section.id} onClick={() => onNavigate(section.id)}>
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
          {hidden.map((section) => (
            <ListItemButton key={section.id} onClick={() => onNavigate(section.id)}>
              <ListItemIcon>
                <VisibilityOffOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={section.title} secondary="Kliknij, aby pokazac" />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ marginY: 2 }} />
        <List dense disablePadding>
          <ListItemButton onClick={onOpenDashboard}>
            <ListItemIcon>
              <DashboardRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" secondary="Koszty, postep i raport" />
          </ListItemButton>
        </List>

        <Divider sx={{ marginY: 2 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ marginBottom: 1 }}>
          Ustawienia
        </Typography>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="subtitle2">Powiadomienia o terminach</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Przypomnienia 7 i 2 dni przed terminem o 11:00.
            </Typography>
            <Button
              size="small"
              variant={notificationStatus === 'granted' ? 'text' : 'outlined'}
              startIcon={<NotificationsActiveOutlinedIcon />}
              onClick={onEnableNotifications}
              disabled={notificationStatus === 'granted' || notificationStatus === 'unsupported'}
              sx={{ marginTop: 1 }}
            >
              {notificationStatus === 'granted'
                ? 'Powiadomienia włączone'
                : notificationStatus === 'denied'
                  ? 'Powiadomienia zablokowane'
                  : notificationStatus === 'unsupported'
                    ? 'Brak obsługi powiadomień'
                    : 'Włącz powiadomienia'}
            </Button>
          </Box>
          <Divider />
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
                onClick={() => navigator.clipboard?.writeText(projectId)}
                disabled={!projectId}
              >
                <ShareRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
          <TextField
            size="small"
            label="Wpisz ID projektu"
            value={projectIdInput}
            onChange={(event) => onProjectIdInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSelectProject()
            }}
            fullWidth
            helperText={
              projectExists === false
                ? 'Nie znaleziono projektu. Utworz nowe lub wpisz inne ID.'
                : undefined
            }
          />
          <ProjectStatus isLoading={isLoading} isSaving={isSaving} />
          <Stack spacing={1}>
            <Button variant="contained" onClick={onSelectProject} disabled={!projectIdInput.trim()}>
              Zapisz ID
            </Button>
            <Button variant="outlined" onClick={onCreateProject}>
              Utworz nowe
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ paddingTop: 2 }}>
            Wersja: {version}
          </Typography>
        </Stack>
      </Box>
    </Drawer>
  )
}

export default NavigationDrawer
