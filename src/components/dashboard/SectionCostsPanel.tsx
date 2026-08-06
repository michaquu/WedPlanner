import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import type { DashboardSection } from '../../utils/dashboard'
import { formatCurrency } from '../../utils/dashboard'

interface SectionCostsPanelProps {
  sections: DashboardSection[]
  maxCost: number
}

const SectionCostsPanel = ({ sections, maxCost }: SectionCostsPanelProps) => (
  <Paper className="dashboard-panel" elevation={0}>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      Koszty wedlug sekcji
    </Typography>
    <Typography variant="caption" color="text.secondary">
      Dlugosc paska jest porownywana z najdrozsza sekcja.
    </Typography>
    <Stack spacing={1.75} sx={{ marginTop: 2 }}>
      {sections.map((section) => (
        <Box key={section.id}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {section.title}
            </Typography>
            <Typography variant="body2">{formatCurrency(section.cost)}</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(section.cost / maxCost) * 100}
            sx={{ marginTop: 0.75, height: 7, borderRadius: 999 }}
          />
          <Typography variant="caption" color="text.secondary">
            Opłacone: {formatCurrency(section.paidCost)} · do zapłaty:{' '}
            {formatCurrency(section.cost - section.paidCost)}
          </Typography>
        </Box>
      ))}
    </Stack>
  </Paper>
)

export default SectionCostsPanel
