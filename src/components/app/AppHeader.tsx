import { Container, IconButton, Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

interface AppHeaderProps {
  searchVisible: boolean
  onOpenMenu: () => void
  onToggleSearch: () => void
  onOpenSummary: (anchor: HTMLElement) => void
  onAddSection: () => void
}

const AppHeader = ({
  searchVisible,
  onOpenMenu,
  onToggleSearch,
  onOpenSummary,
  onAddSection,
}: AppHeaderProps) => (
  <header className="app-hero">
    <Container maxWidth="lg">
      <Stack
        direction="row"
        spacing={{ xs: 0.5, sm: 1 }}
        className="hero-stack"
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} sx={{ alignItems: 'center' }}>
          <IconButton
            size="small"
            color="primary"
            aria-label="Menu"
            className="hero-add"
            onClick={onOpenMenu}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Typography variant="h5" className="hero-title">
            Wedding Planner
          </Typography>
        </Stack>
        <Stack direction="row" spacing={{ xs: 0, sm: 1 }}>
          <IconButton
            size="small"
            color="primary"
            aria-label={searchVisible ? 'Ukryj wyszukiwarke' : 'Pokaz wyszukiwarke'}
            className="hero-add"
            onClick={onToggleSearch}
          >
            <SearchRoundedIcon />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            aria-label="Podsumowanie"
            className="hero-add"
            onClick={(event) => onOpenSummary(event.currentTarget)}
          >
            <InfoOutlinedIcon />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            aria-label="Dodaj nowa sekcje"
            className="hero-add"
            onClick={onAddSection}
          >
            <AddRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Container>
  </header>
)

export default AppHeader
