import {
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import SortRoundedIcon from '@mui/icons-material/SortRounded'
import type { PlannerSort } from '../../utils/plannerData'

const sortOptions: { value: PlannerSort; label: string }[] = [
  { value: 'manual', label: 'Kolejność własna' },
  { value: 'dueDateAsc', label: 'Najbliższy termin' },
  { value: 'costAsc', label: 'Koszt: od najniższego' },
  { value: 'costDesc', label: 'Koszt: od najwyższego' },
]

interface PlannerSearchProps {
  query: string
  favoriteOnly: boolean
  matchedItems: number
  matchedSections: number
  sort: PlannerSort
  onQueryChange: (value: string) => void
  onFavoriteOnlyChange: (value: boolean) => void
  onSortChange: (value: PlannerSort) => void
}

const PlannerSearch = ({
  query,
  favoriteOnly,
  matchedItems,
  matchedSections,
  sort,
  onQueryChange,
  onFavoriteOnlyChange,
  onSortChange,
}: PlannerSearchProps) => {
  const [sortDialogOpen, setSortDialogOpen] = useState(false)
  const hasFilter = Boolean(query.trim()) || favoriteOnly
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label

  const handleSortChange = (value: PlannerSort) => {
    onSortChange(value)
    setSortDialogOpen(false)
  }

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
        <IconButton
          color={sort === 'manual' ? 'default' : 'primary'}
          className="sort-filter"
          onClick={() => setSortDialogOpen(true)}
          aria-label={`Sortuj zadania. Wybrano: ${sortLabel}`}
        >
          <SortRoundedIcon />
        </IconButton>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Szukaj w zadaniach, notatkach, kosztach i terminach..."
          slotProps={{
            htmlInput: { 'aria-label': 'Szukaj w planerze' },
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

      <Dialog
        open={sortDialogOpen}
        onClose={() => setSortDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Sortuj zadania</DialogTitle>
        <DialogContent dividers>
          <RadioGroup
            value={sort}
            onChange={(event) => handleSortChange(event.target.value as PlannerSort)}
            aria-label="Sposób sortowania"
          >
            {sortOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PlannerSearch
