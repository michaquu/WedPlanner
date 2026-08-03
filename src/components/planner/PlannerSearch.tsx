import { IconButton, InputAdornment, Stack, TextField } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'

interface PlannerSearchProps {
  query: string
  favoriteOnly: boolean
  matchedItems: number
  matchedSections: number
  onQueryChange: (value: string) => void
  onFavoriteOnlyChange: (value: boolean) => void
}

const PlannerSearch = ({
  query,
  favoriteOnly,
  matchedItems,
  matchedSections,
  onQueryChange,
  onFavoriteOnlyChange,
}: PlannerSearchProps) => {
  const hasFilter = Boolean(query.trim()) || favoriteOnly
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
      <TextField
        autoFocus
        fullWidth
        size="small"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Szukaj w zadaniach, notatkach, kosztach i terminach..."
        aria-label="Szukaj w planerze"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onQueryChange('')}
                  aria-label="Wyczysc wyszukiwanie"
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
        }}
        helperText={
          hasFilter
            ? `Znaleziono ${matchedItems} zadan w ${matchedSections} sekcjach`
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
  )
}

export default PlannerSearch

