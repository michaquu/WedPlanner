import { Box, Paper, Typography } from '@mui/material'
import type { DashboardMetrics } from '../../utils/dashboard'
import { formatCurrency } from '../../utils/dashboard'

interface DashboardStatsProps {
  metrics: DashboardMetrics
  sectionCount: number
}

const DashboardStats = ({ metrics, sectionCount }: DashboardStatsProps) => {
  const stats = [
    {
      label: 'Postep',
      value: `${metrics.completion}%`,
      detail: `${metrics.completedItems}/${metrics.items.length} zadan`,
    },
    {
      label: 'Laczny koszt',
      value: formatCurrency(metrics.totalCost),
      detail: `${metrics.pricedItems} wycenionych zadan`,
    },
    { label: 'Sekcje', value: sectionCount, detail: `${metrics.items.length} zadan lacznie` },
    { label: 'Po terminie', value: metrics.overdueItems, detail: 'nieukonczonych zadan' },
  ]
  return (
    <Box className="dashboard-grid">
      {stats.map((stat) => (
        <Paper key={stat.label} className="dashboard-card" elevation={0}>
          <Typography variant="caption" color="text.secondary">
            {stat.label}
          </Typography>
          <Typography
            variant="h5"
            className="dashboard-stat-value"
            sx={{ fontWeight: 700, marginY: 0.5 }}
          >
            {stat.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stat.detail}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}

export default DashboardStats

