import {
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import type { Item, ItemStatus } from '../../types'

const STATUS_OPTIONS: ItemStatus[] = ['Do zrobienia', 'W trakcie', 'Zrobione']

interface ItemFieldsProps {
  item: Item
  onUpdate: (changes: Partial<Item>) => void
}

const ItemFields = ({ item, onUpdate }: ItemFieldsProps) => (
  <Stack spacing={2.5}>
    <TextField
      label="Tytul"
      value={item.title}
      onChange={(event) => onUpdate({ title: event.target.value })}
      fullWidth
    />
    <FormControl fullWidth>
      <InputLabel>Status</InputLabel>
      <Select
        label="Status"
        value={item.status}
        onChange={(event) => onUpdate({ status: event.target.value as ItemStatus })}
      >
        {STATUS_OPTIONS.map((status) => (
          <MenuItem key={status} value={status}>
            {status}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    <TextField
      label="Termin"
      type="date"
      value={item.dueDate ?? ''}
      onChange={(event) => onUpdate({ dueDate: event.target.value })}
      fullWidth
      slotProps={{ inputLabel: { shrink: true } }}
    />
    <TextField
      label="Koszt"
      type="number"
      value={item.cost ?? ''}
      onChange={(event) => {
        const cost = event.target.value === '' ? undefined : Number(event.target.value)
        onUpdate({ cost, ...(cost === undefined ? { costPaid: false } : {}) })
      }}
      fullWidth
      slotProps={{
        htmlInput: { min: 0, step: 0.01 },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                {item.cost !== undefined && !item.costPaid && (
                  <Typography variant="caption" color="text.secondary">
                    Nieopłacone
                  </Typography>
                )}
                <Switch
                  size="small"
                  checked={item.costPaid}
                  disabled={item.cost === undefined}
                  onChange={(event) => onUpdate({ costPaid: event.target.checked })}
                  color="success"
                  slotProps={{ input: { 'aria-label': 'Oznacz koszt jako opłacony' } }}
                />
                <Typography variant="body2">zł</Typography>
              </Stack>
            </InputAdornment>
          ),
        },
      }}
    />
    <FormControlLabel
      control={
        <Switch
          checked={item.checked}
          onChange={(event) => onUpdate({ checked: event.target.checked })}
        />
      }
      label="Odhaczone"
    />
  </Stack>
)

export default ItemFields
